import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const dailyPlanTaskStatusValues = ["not_started", "in_progress", "completed"] as const;
export type DailyPlanTaskStatus = (typeof dailyPlanTaskStatusValues)[number];

export interface DailyPlanTask {
  id: string;
  subjectId: string;
  topicId: string;
  taskType: "lesson" | "practice";
  xpReward: number;
  status: DailyPlanTaskStatus;
  isWeakTopic?: boolean;
}

export const dailyPlansTable = pgTable("daily_plans", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  planDate: text("plan_date").notNull(),
  tasks: jsonb("tasks").$type<DailyPlanTask[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const DailyPlanTaskSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  topicId: z.string(),
  taskType: z.enum(["lesson", "practice"]),
  xpReward: z.number(),
  status: z.enum(dailyPlanTaskStatusValues),
});

export const DailyPlanSchema = z.object({
  id: z.number(),
  childId: z.number(),
  planDate: z.string(),
  tasks: z.array(DailyPlanTaskSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DailyPlan = typeof dailyPlansTable.$inferSelect;
