import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  color: text("color").notNull(),
  captain: text("captain").notNull(),
  members: text("members").array().notNull().default(sql`'{}'::text[]`),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  color: text("color").notNull().default("#6B7280"),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  textEn: text("text_en").notNull(),
  textAr: text("text_ar").notNull(),
  optionAEn: text("option_a_en").notNull(),
  optionAAr: text("option_a_ar").notNull(),
  optionBEn: text("option_b_en").notNull(),
  optionBAr: text("option_b_ar").notNull(),
  optionCEn: text("option_c_en").notNull(),
  optionCAr: text("option_c_ar").notNull(),
  optionDEn: text("option_d_en").notNull(),
  optionDAr: text("option_d_ar").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  categoryEn: text("category_en").notNull(),
  categoryAr: text("category_ar").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  isActive: boolean("is_active").notNull().default(true),
});

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").notNull().default("waiting"),
  currentTeamId: integer("current_team_id"),
  currentQuestionId: integer("current_question_id"),
  timerSeconds: integer("timer_seconds").notNull().default(30),
});

export const teamScores = pgTable("team_scores", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  sessionId: integer("session_id").notNull(),
  score: integer("score").notNull().default(0),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
});

export const questionHistory = pgTable("question_history", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  teamId: integer("team_id").notNull(),
  questionId: integer("question_id").notNull(),
  answerGiven: text("answer_given"),
  isCorrect: boolean("is_correct"),
  answeredAt: timestamp("answered_at").defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ id: true, createdAt: true });
export const insertTeamScoreSchema = createInsertSchema(teamScores).omit({ id: true });
export const insertQuestionHistorySchema = createInsertSchema(questionHistory).omit({ id: true, answeredAt: true });

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type TeamScore = typeof teamScores.$inferSelect;
export type InsertTeamScore = z.infer<typeof insertTeamScoreSchema>;
export type QuestionHistory = typeof questionHistory.$inferSelect;
export type InsertQuestionHistory = z.infer<typeof insertQuestionHistorySchema>;

export const authorizedEmails = pgTable("authorized_emails", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  playerName: text("player_name"),
  teamId: integer("team_id"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
});

export const insertAuthorizedEmailSchema = createInsertSchema(authorizedEmails).omit({ id: true, addedAt: true });
export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true });

export type AuthorizedEmail = typeof authorizedEmails.$inferSelect;
export type InsertAuthorizedEmail = z.infer<typeof insertAuthorizedEmailSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
