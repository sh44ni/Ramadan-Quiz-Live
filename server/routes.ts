import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { seedDatabase } from "./seed";

const ADMIN_PASSWORD = process.env.SESSION_SECRET || "admin123";
const adminTokens = new Set<string>();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-admin-token"] as string;
  if (token && adminTokens.has(token)) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
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
