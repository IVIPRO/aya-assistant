import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const childWeaknessStatsTable = pgTable("child_weakness_stats", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  category: text("category").notNull(), // e.g., "addition_to_10", "multiplication", "division"
  mistakesCount: integer("mistakes_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ChildWeaknessStats = typeof childWeaknessStatsTable.$inferSelect;
