import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const familyTasksTable = pgTable("family_tasks", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  dueAt: timestamp("due_at", { withTimezone: true }),
  priority: text("priority").notNull().default("medium"),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFamilyTaskSchema = createInsertSchema(familyTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFamilyTask = z.infer<typeof insertFamilyTaskSchema>;
export type FamilyTask = typeof familyTasksTable.$inferSelect;
