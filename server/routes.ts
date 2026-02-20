import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import crypto from "crypto";
import { Resend } from "resend";
import { storage } from "./storage";
import { seedDatabase } from "./seed";

const ADMIN_PASSWORD = process.env.SESSION_SECRET || "admin123";
const adminTokens = new Set<string>();
const playerTokens = new Map<string, string>();

const resend = new Resend(process.env.RESEND_API_KEY);

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-admin-token"] as string;
  if (token && adminTokens.has(token)) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.get("/api/teams", async (_req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/questions", async (_req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/game/current", async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (!session) {
        return res.json(null);
      }
      const scores = await storage.getTeamScores(session.id);
      const answeredQuestionIds = await storage.getAnsweredQuestionIds(session.id);
      res.json({ session, scores, answeredQuestionIds });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game state" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      if (password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString("hex");
        adminTokens.add(token);
        res.json({ success: true, token });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const normalizedEmail = email.toLowerCase().trim();
      const authorized = await storage.getAuthorizedEmail(normalizedEmail);
      if (!authorized) {
        return res.status(403).json({ message: "Email not authorized" });
      }

      const code = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtpCode({
        email: normalizedEmail,
        code,
        expiresAt,
        used: false,
      });

      try {
        await resend.emails.send({
          from: "Ramadan Quiz <onboarding@resend.dev>",
          to: normalizedEmail,
          subject: "Your Ramadan Quiz Access Code | رمز الدخول لمسابقة رمضان",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #1a5e3a 0%, #0d3320 100%); border-radius: 16px; color: white;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">Ramadan Quiz Competition</h1>
                <h2 style="color: #fbbf24; margin: 4px 0 0; font-size: 20px; direction: rtl;">مسابقة رمضان الثقافية</h2>
              </div>
              <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 24px; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255,255,255,0.8);">Your access code / رمز الدخول</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fbbf24; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; display: inline-block;">
                  ${code}
                </div>
                <p style="margin: 16px 0 0; font-size: 12px; color: rgba(255,255,255,0.6);">Valid for 10 minutes / صالح لمدة ١٠ دقائق</p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Email send error:", emailError);
        return res.status(500).json({ message: "Failed to send OTP email" });
      }

      res.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
      console.error("OTP request error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

      const normalizedEmail = email.toLowerCase().trim();
      const otp = await storage.getValidOtp(normalizedEmail, code);

      if (!otp) {
        return res.status(401).json({ message: "Invalid or expired code" });
      }

      await storage.markOtpUsed(otp.id);

      const token = crypto.randomBytes(32).toString("hex");
      playerTokens.set(token, normalizedEmail);

      res.json({ success: true, token, email: normalizedEmail });
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.get("/api/auth/verify-token", async (req, res) => {
    const token = req.headers["x-player-token"] as string;
    if (token && playerTokens.has(token)) {
      const email = playerTokens.get(token)!;
      const authorized = await storage.getAuthorizedEmail(email);
      if (authorized) {
        return res.json({ valid: true, email, name: authorized.name });
      }
    }
    res.json({ valid: false });
  });

  app.get("/api/admin/authorized-emails", requireAdmin, async (_req, res) => {
    try {
      const emails = await storage.getAuthorizedEmails();
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch authorized emails" });
    }
  });

  app.post("/api/admin/authorized-emails", requireAdmin, async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !name) return res.status(400).json({ message: "Email and name are required" });

      const existing = await storage.getAuthorizedEmail(email);
      if (existing) return res.status(409).json({ message: "Email already authorized" });

      const created = await storage.addAuthorizedEmail({ email, name });
      res.json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to add authorized email" });
    }
  });

  app.delete("/api/admin/authorized-emails/:id", requireAdmin, async (req, res) => {
    try {
      await storage.removeAuthorizedEmail(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove authorized email" });
    }
  });

  app.post("/api/admin/send-invitation", requireAdmin, async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const appUrl = `${req.protocol}://${req.get("host")}`;

      try {
        await resend.emails.send({
          from: "Ramadan Quiz <onboarding@resend.dev>",
          to: email,
          subject: "You're Invited to Ramadan Quiz! | دعوة لمسابقة رمضان",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #1a5e3a 0%, #0d3320 100%); border-radius: 16px; color: white;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">Ramadan Quiz Competition</h1>
                <h2 style="color: #fbbf24; margin: 4px 0 0; font-size: 20px; direction: rtl;">مسابقة رمضان الثقافية</h2>
              </div>
              <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 24px; text-align: center;">
                <p style="margin: 0 0 16px; font-size: 16px;">
                  Hello ${name || "Player"},<br/>
                  <span style="direction: rtl; display: inline-block;">مرحباً ${name || "لاعب"}</span>
                </p>
                <p style="margin: 0 0 16px; font-size: 14px; color: rgba(255,255,255,0.9);">
                  You've been invited to join the Ramadan Quiz Competition!<br/>
                  <span style="direction: rtl; display: inline-block;">لقد تمت دعوتك للمشاركة في مسابقة رمضان الثقافية!</span>
                </p>
                <a href="${appUrl}/login" style="display: inline-block; padding: 12px 32px; background: #fbbf24; color: #0d3320; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 16px;">
                  Join Now | انضم الآن
                </a>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Invitation email error:", emailError);
        return res.status(500).json({ message: "Failed to send invitation email" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  app.post("/api/game/start", requireAdmin, async (_req, res) => {
    try {
      const teams = await storage.getTeams();
      if (teams.length === 0) {
        return res.status(400).json({ message: "No teams found" });
      }

      const session = await storage.createSession({
        status: "active",
        currentTeamId: teams[0].id,
        currentQuestionId: null,
        timerSeconds: 30,
      });

      for (const team of teams) {
        await storage.createTeamScore({
          teamId: team.id,
          sessionId: session.id,
          score: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
        });
      }

      res.json({ session });
    } catch (error) {
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  app.post("/api/game/pause", requireAdmin, async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (!session) return res.status(404).json({ message: "No active session" });
      const updated = await storage.updateSession(session.id, { status: "paused" });
      res.json({ session: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to pause game" });
    }
  });

  app.post("/api/game/resume", requireAdmin, async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (!session) return res.status(404).json({ message: "No session found" });
      const updated = await storage.updateSession(session.id, { status: "active" });
      res.json({ session: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to resume game" });
    }
  });

  app.post("/api/game/end", requireAdmin, async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (!session) return res.status(404).json({ message: "No active session" });
      const updated = await storage.updateSession(session.id, { status: "finished" });
      res.json({ session: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to end game" });
    }
  });

  app.post("/api/game/reset", requireAdmin, async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (session) {
        await storage.updateSession(session.id, { status: "finished" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset game" });
    }
  });

  app.post("/api/game/select-question", async (req, res) => {
    try {
      const { sessionId, questionId } = req.body;
      const updated = await storage.updateSession(sessionId, { currentQuestionId: questionId });
      res.json({ session: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to select question" });
    }
  });

  app.post("/api/game/answer", async (req, res) => {
    try {
      const { sessionId, questionId, teamId, answer } = req.body;

      const question = await storage.getQuestion(questionId);
      if (!question) return res.status(404).json({ message: "Question not found" });

      const isCorrect = answer === question.correctAnswer;

      await storage.createQuestionHistory({
        sessionId,
        teamId,
        questionId,
        answerGiven: answer,
        isCorrect,
      });

      const teamScore = await storage.getTeamScore(sessionId, teamId);
      if (teamScore) {
        await storage.updateTeamScore(teamScore.id, {
          score: teamScore.score + (isCorrect ? 10 : 0),
          questionsAnswered: teamScore.questionsAnswered + 1,
          correctAnswers: teamScore.correctAnswers + (isCorrect ? 1 : 0),
        });
      }

      const teams = await storage.getTeams();
      const currentIndex = teams.findIndex((t) => t.id === teamId);
      const nextTeam = teams[(currentIndex + 1) % teams.length];

      await storage.updateSession(sessionId, {
        currentTeamId: nextTeam.id,
        currentQuestionId: null,
      });

      const answeredIds = await storage.getAnsweredQuestionIds(sessionId);
      const allQuestions = await storage.getQuestions();
      if (answeredIds.length >= allQuestions.length) {
        await storage.updateSession(sessionId, { status: "finished" });
      }

      res.json({ isCorrect, correctAnswer: question.correctAnswer });
    } catch (error) {
      res.status(500).json({ message: "Failed to process answer" });
    }
  });

  app.post("/api/game/skip", requireAdmin, async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (!session) return res.status(404).json({ message: "No active session" });

      const teams = await storage.getTeams();
      const currentIndex = teams.findIndex((t) => t.id === session.currentTeamId);
      const nextTeam = teams[(currentIndex + 1) % teams.length];

      const updated = await storage.updateSession(session.id, {
        currentTeamId: nextTeam.id,
        currentQuestionId: null,
      });

      res.json({ session: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to skip" });
    }
  });

  app.post("/api/game/adjust-score", requireAdmin, async (req, res) => {
    try {
      const { teamId, points } = req.body;
      const session = await storage.getActiveSession();
      if (!session) return res.status(404).json({ message: "No active session" });

      const teamScore = await storage.getTeamScore(session.id, teamId);
      if (!teamScore) return res.status(404).json({ message: "Team score not found" });

      const updated = await storage.updateTeamScore(teamScore.id, {
        score: Math.max(0, teamScore.score + points),
      });

      res.json({ score: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust score" });
    }
  });

  return httpServer;
}
