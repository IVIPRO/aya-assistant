import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const childTopicProgressTable = pgTable("child_topic_progress", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  subjectId: text("subject_id").notNull(),
  topicId: text("topic_id").notNull(),
  lessonDone: boolean("lesson_done").notNull().default(false),
  practiceDone: boolean("practice_done").notNull().default(false),
  quizPassed: boolean("quiz_passed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ChildTopicProgress = typeof childTopicProgressTable.$inferSelect;
