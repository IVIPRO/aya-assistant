import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface BadgeRecord {
  id: string;
  title: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  language: text("language").notNull(),
  country: text("country").notNull(),
  avatar: text("avatar"),
  aiCharacter: text("ai_character"),
  badgesEarned: jsonb("badges_earned").$type<BadgeRecord[]>(),
  xp: integer("xp").notNull().default(0),
  stars: integer("stars").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChildSchema = createInsertSchema(childrenTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof childrenTable.$inferSelect;
