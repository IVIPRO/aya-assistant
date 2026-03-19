import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const childTopicProgressTable = pgTable("child_topic_progress", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  subjectId: text("subject_id").notNull(),
  topicId: text("topic_id").notNull(),
  lessonDone: boolean("lesson_done").notNull().default(false),
  practiceDone: boolean("practice_done").notNull().default(false),
  quizPassed: boolean("quiz_passed").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  wrongAnswers: integer("wrong_answers").notNull().default(0),
  retryCount: integer("retry_count").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ChildTopicProgress = typeof childTopicProgressTable.$inferSelect;
