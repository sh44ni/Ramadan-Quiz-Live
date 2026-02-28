import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { insertCategorySchema, insertQuestionSchema } from "@shared/schema";
import { broadcast, broadcastGameState, stopTimer } from "./websocket";

const ADMIN_PASSWORD = process.env.SESSION_SECRET || "admin123";
const adminTokens = new Set<string>();
const playerTokens = new Map<string, number>(); // Map token -> teamId

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

  app.patch("/api/teams/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { nameEn, nameAr, captain, secretKey, members } = req.body;
      const data: Record<string, unknown> = {};
      if (nameEn !== undefined) data.nameEn = nameEn;
      if (nameAr !== undefined) data.nameAr = nameAr;
      if (captain !== undefined) data.captain = captain;
      if (secretKey !== undefined) data.secretKey = secretKey;
      if (members !== undefined) data.members = members;
      const updated = await storage.updateTeam(id, data);
      if (!updated) return res.status(404).json({ message: "Team not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
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

  app.post("/api/auth/login-team", async (req, res) => {
    try {
      const { teamId, secretKey } = req.body;
      if (!teamId || !secretKey) {
        return res.status(400).json({ message: "Team ID and secret key are required" });
      }

      const team = await storage.getTeam(parseInt(teamId));
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.secretKey !== secretKey.trim()) {
        return res.status(401).json({ message: "Invalid secret key" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      playerTokens.set(token, team.id);

      res.json({
        success: true,
        token,
        teamId: team.id,
        teamName: team.nameEn,
        playerName: team.captain,
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/verify-token", async (req, res) => {
    const token = req.headers["x-player-token"] as string;
    if (token && playerTokens.has(token)) {
      const teamId = playerTokens.get(token)!;
      const team = await storage.getTeam(teamId);
      if (team) {
        return res.json({
          valid: true,
          teamId: team.id,
          teamName: team.nameEn,
          playerName: team.captain,
        });
      }
    }
    res.json({ valid: false });
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

      broadcast({ type: "game-started" });
      await broadcastGameState();
      res.json({ session });
    } catch (error) {
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  app.post("/api/game/pause", requireAdmin, async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (!session) return res.status(404).json({ message: "No active session" });
      stopTimer();
      const updated = await storage.updateSession(session.id, { status: "paused" });
      broadcast({ type: "game-paused" });
      await broadcastGameState();
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
      broadcast({ type: "game-resumed" });
      await broadcastGameState();
      res.json({ session: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to resume game" });
    }
  });

  app.post("/api/game/end", requireAdmin, async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (!session) return res.status(404).json({ message: "No active session" });
      stopTimer();
      const updated = await storage.updateSession(session.id, { status: "finished" });
      broadcast({ type: "game-finished" });
      await broadcastGameState();
      res.json({ session: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to end game" });
    }
  });

  app.post("/api/game/reset", requireAdmin, async (_req, res) => {
    try {
      stopTimer();
      const session = await storage.getActiveSession();
      if (session) {
        await storage.updateSession(session.id, { status: "finished" });
      }
      broadcast({ type: "game-reset" });
      await broadcastGameState();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset game" });
    }
  });

  app.get("/api/categories", async (_req, res) => {
    try {
      const cats = await storage.getCategories();
      res.json(cats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAdmin, async (req, res) => {
    try {
      const result = insertCategorySchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid category data", errors: result.error.flatten() });
      const created = await storage.createCategory(result.data);
      res.json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const updated = await storage.updateCategory(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.post("/api/questions", requireAdmin, async (req, res) => {
    try {
      const result = insertQuestionSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: "Invalid question data", errors: result.error.flatten() });
      const created = await storage.createQuestion(result.data);
      res.json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const updated = await storage.updateQuestion(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteQuestion(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  app.post("/api/game/select-question", async (req, res) => {
    try {
      const { sessionId, questionId } = req.body;
      const updated = await storage.updateSession(sessionId, { currentQuestionId: questionId });
      const question = await storage.getQuestion(questionId);
      broadcast({ type: "question-selected", question, questionId });
      await broadcastGameState();
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

      stopTimer();

      broadcast({
        type: "answer-result",
        isCorrect,
        correctAnswer: question.correctAnswer,
        answerGiven: answer,
        teamId,
      });

      await broadcastGameState();

      res.json({ isCorrect, correctAnswer: question.correctAnswer });
    } catch (error) {
      res.status(500).json({ message: "Failed to process answer" });
    }
  });

  app.post("/api/game/skip", requireAdmin, async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      if (!session) return res.status(404).json({ message: "No active session" });

      stopTimer();
      const teams = await storage.getTeams();
      const currentIndex = teams.findIndex((t) => t.id === session.currentTeamId);
      const nextTeam = teams[(currentIndex + 1) % teams.length];

      const updated = await storage.updateSession(session.id, {
        currentTeamId: nextTeam.id,
        currentQuestionId: null,
      });

      broadcast({ type: "turn-changed", teamId: nextTeam.id });
      await broadcastGameState();
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

      await broadcastGameState();
      res.json({ score: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust score" });
    }
  });

  return httpServer;
}
