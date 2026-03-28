import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const missionsTable = pgTable("missions", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subject: text("subject").notNull(),
  zone: text("zone"),
  difficulty: text("difficulty").notNull().default("easy"),
  xpReward: integer("xp_reward").notNull().default(50),
  starReward: integer("star_reward").notNull().default(1),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /* Phase C: Dynamic Mission Generator — curriculum linkage */
  topicId: text("topic_id"),       /* links to curriculum Topic.id   (nullable) */
  subjectId: text("subject_id"),   /* links to curriculum Subject.id (nullable) */
  aiGenerated: boolean("ai_generated").notNull().default(false),
});

export const insertMissionSchema = createInsertSchema(missionsTable).omit({ id: true, createdAt: true });
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missionsTable.$inferSelect;
