import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const missionTasksTable = pgTable("mission_tasks", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").notNull(),
  taskId: text("task_id").notNull(), // Unique task identifier from generator
  expression: text("expression").notNull(), // "3 + 4"
  answer: integer("answer").notNull(), // 7
  type: text("type").notNull(), // "addition", "subtraction", "multiplication"
  difficulty: text("difficulty").notNull().default("easy"),
  number1: integer("number1").notNull(),
  number2: integer("number2").notNull(),
  operator: text("operator").notNull(), // "+", "-", "*"
  answered: boolean("answered").notNull().default(false),
  correct: boolean("correct"),
  userAnswer: integer("user_answer"),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMissionTaskSchema = createInsertSchema(missionTasksTable).omit({ 
  id: true, 
  createdAt: true,
  answered: true,
  correct: true,
  userAnswer: true,
  answeredAt: true,
});

export type InsertMissionTask = z.infer<typeof insertMissionTaskSchema>;
export type MissionTask = typeof missionTasksTable.$inferSelect;
