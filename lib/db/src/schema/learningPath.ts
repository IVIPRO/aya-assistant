import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const learningPathTable = pgTable("learning_path", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  priorityTopic: text("priority_topic").notNull(),
  generatedPractice: jsonb("generated_practice").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LearningPath = typeof learningPathTable.$inferSelect;
export type NewLearningPath = typeof learningPathTable.$inferInsert;
