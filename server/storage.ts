import { db } from "./db";
import { eq, and, lt } from "drizzle-orm";
import {
  teams, questions, gameSessions, teamScores, questionHistory,
  authorizedEmails, otpCodes, categories,
  type Team, type InsertTeam,
  type Category, type InsertCategory,
  type Question, type InsertQuestion,
  type GameSession, type InsertGameSession,
  type TeamScore, type InsertTeamScore,
  type QuestionHistory, type InsertQuestionHistory,
} from "@shared/schema";

export interface IStorage {
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, data: Partial<Team>): Promise<Team | undefined>;

  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;

  getQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, data: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<void>;

  getActiveSession(): Promise<GameSession | undefined>;
  getSession(id: number): Promise<GameSession | undefined>;
  createSession(session: InsertGameSession): Promise<GameSession>;
  updateSession(id: number, data: Partial<GameSession>): Promise<GameSession | undefined>;

  getTeamScores(sessionId: number): Promise<TeamScore[]>;
  getTeamScore(sessionId: number, teamId: number): Promise<TeamScore | undefined>;
  createTeamScore(score: InsertTeamScore): Promise<TeamScore>;
  updateTeamScore(id: number, data: Partial<TeamScore>): Promise<TeamScore | undefined>;

  getQuestionHistory(sessionId: number): Promise<QuestionHistory[]>;
  createQuestionHistory(history: InsertQuestionHistory): Promise<QuestionHistory>;

  getAnsweredQuestionIds(sessionId: number): Promise<number[]>;
}

export class DatabaseStorage implements IStorage {
  async getTeams(): Promise<Team[]> {
    return db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [created] = await db.insert(teams).values(team).returning();
    return created;
  }

  async updateTeam(id: number, data: Partial<Team>): Promise<Team | undefined> {
    const [updated] = await db.update(teams).set(data).where(eq(teams.id, id)).returning();
    return updated;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getQuestions(): Promise<Question[]> {
    return db.select().from(questions);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [created] = await db.insert(questions).values(question).returning();
    return created;
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<Question | undefined> {
    const [updated] = await db.update(questions).set(data).where(eq(questions.id, id)).returning();
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async getActiveSession(): Promise<GameSession | undefined> {
    const sessions = await db
      .select()
      .from(gameSessions)
      .where(
        eq(gameSessions.status, "active")
      );
    if (sessions.length > 0) return sessions[0];

    const paused = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.status, "paused"));
    if (paused.length > 0) return paused[0];

    const waiting = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.status, "waiting"));
    if (waiting.length > 0) return waiting[0];

    const finished = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.status, "finished"));
    if (finished.length > 0) return finished[finished.length - 1];

    return undefined;
  }

  async getSession(id: number): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session;
  }

  async createSession(session: InsertGameSession): Promise<GameSession> {
    const [created] = await db.insert(gameSessions).values(session).returning();
    return created;
  }

  async updateSession(id: number, data: Partial<GameSession>): Promise<GameSession | undefined> {
    const [updated] = await db
      .update(gameSessions)
      .set(data)
      .where(eq(gameSessions.id, id))
      .returning();
    return updated;
  }

  async getTeamScores(sessionId: number): Promise<TeamScore[]> {
    return db.select().from(teamScores).where(eq(teamScores.sessionId, sessionId));
  }

  async getTeamScore(sessionId: number, teamId: number): Promise<TeamScore | undefined> {
    const [score] = await db
      .select()
      .from(teamScores)
      .where(and(eq(teamScores.sessionId, sessionId), eq(teamScores.teamId, teamId)));
    return score;
  }

  async createTeamScore(score: InsertTeamScore): Promise<TeamScore> {
    const [created] = await db.insert(teamScores).values(score).returning();
    return created;
  }

  async updateTeamScore(id: number, data: Partial<TeamScore>): Promise<TeamScore | undefined> {
    const [updated] = await db
      .update(teamScores)
      .set(data)
      .where(eq(teamScores.id, id))
      .returning();
    return updated;
  }

  async getQuestionHistory(sessionId: number): Promise<QuestionHistory[]> {
    return db
      .select()
      .from(questionHistory)
      .where(eq(questionHistory.sessionId, sessionId));
  }

  async createQuestionHistory(history: InsertQuestionHistory): Promise<QuestionHistory> {
    const [created] = await db.insert(questionHistory).values(history).returning();
    return created;
  }

  async getAnsweredQuestionIds(sessionId: number): Promise<number[]> {
    const history = await db
      .select({ questionId: questionHistory.questionId })
      .from(questionHistory)
      .where(eq(questionHistory.sessionId, sessionId));
    return history.map((h) => h.questionId);
  }
}

export const storage = new DatabaseStorage();
