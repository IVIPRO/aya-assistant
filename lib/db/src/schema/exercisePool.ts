import { pgTable, serial, integer, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const exercisePoolTable = pgTable("exercise_pool", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  subjectId: text("subject_id").notNull(),
  topicId: text("topic_id").notNull(),
  grade: integer("grade").notNull(),
  lang: text("lang").notNull().default("en"),
  difficulty: text("difficulty").notNull().default("medium"),
  question: text("question").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  options: jsonb("options").$type<string[] | null>().default(null),
  hint: text("hint"),
  explanation: text("explanation"),
  exerciseType: text("exercise_type").notNull().default("multiple-choice"),
  batchId: text("batch_id").notNull(),
  used: boolean("used").notNull().default(false),
  correct: boolean("correct"),
  userAnswer: text("user_answer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export type ExercisePoolItem = typeof exercisePoolTable.$inferSelect;
export type InsertExercisePoolItem = typeof exercisePoolTable.$inferInsert;
