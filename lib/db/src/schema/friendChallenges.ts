import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const friendChallengesTable = pgTable("friend_challenges", {
  id: serial("id").primaryKey(),
  creatorStudentId: integer("creator_student_id").notNull(),
  opponentStudentId: integer("opponent_student_id").notNull(),
  topic: text("topic").notNull(),
  tasksTotal: integer("tasks_total").notNull().default(10),
  tasksCompletedCreator: integer("tasks_completed_creator").notNull().default(0),
  tasksCompletedOpponent: integer("tasks_completed_opponent").notNull().default(0),
  winner: integer("winner"), /* null until challenge complete */
  status: text("status").notNull().default("pending"), /* pending | accepted | completed */
  xpReward: integer("xp_reward").notNull().default(25),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertFriendChallengeSchema = createInsertSchema(friendChallengesTable).omit({ 
  id: true, 
  createdAt: true,
  acceptedAt: true,
  completedAt: true,
});

export type InsertFriendChallenge = z.infer<typeof insertFriendChallengeSchema>;
export type FriendChallenge = typeof friendChallengesTable.$inferSelect;
