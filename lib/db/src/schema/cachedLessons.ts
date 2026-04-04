import { pgTable, serial, text, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const cachedLessonsTable = pgTable(
  "cached_lessons",
  {
    id: serial("id").primaryKey(),
    subjectId: text("subject_id").notNull(),
    topicId: text("topic_id").notNull(),
    grade: integer("grade").notNull(),
    lang: text("lang").notNull().default("en"),
    mode: text("mode").notNull().default("normal"),
    variant: integer("variant").notNull().default(0),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueLessonKey: uniqueIndex("unique_lesson_key").on(
      table.subjectId,
      table.topicId,
      table.grade,
      table.lang,
      table.mode,
      table.variant,
    ),
  }),
);

export type CachedLesson = typeof cachedLessonsTable.$inferSelect;
export type InsertCachedLesson = typeof cachedLessonsTable.$inferInsert;
