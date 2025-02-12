import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull().references(() => decks.id),
  kanji: text("kanji").notNull(),
  furigana: text("furigana").notNull(),
  english: text("english").notNull(),
  isHard: boolean("is_hard").notNull().default(false),
});

// New tables for statistics
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deckId: integer("deck_id").notNull().references(() => decks.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  cardsStudied: integer("cards_studied").notNull().default(0),
});

export const cardAttempts = pgTable("card_attempts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => studySessions.id),
  cardId: integer("card_id").notNull().references(() => cards.id),
  isCorrect: boolean("is_correct").notNull(),
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertDeckSchema = createInsertSchema(decks).pick({
  name: true,
});

export const insertCardSchema = createInsertSchema(cards).pick({
  deckId: true,
  kanji: true,
  furigana: true,
  english: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).pick({
  deckId: true,
});

export const insertCardAttemptSchema = createInsertSchema(cardAttempts).pick({
  sessionId: true,
  cardId: true,
  isCorrect: true,
});

// Types
export type User = typeof users.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type CardAttempt = typeof cardAttempts.$inferSelect;