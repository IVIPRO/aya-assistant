/**
 * Adaptive Learning Engine — Phase 1A: Student Profile Data Layer
 *
 * Tracks and manages adaptive learning state per child.
 * Stores state inside existing memoriesTable as JSON, no schema migration.
 *
 * Types:
 * - recentAccuracy: (0-1) recent success rate
 * - currentDifficultyBySubject: { subject => difficulty level 1-5 }
 * - streakCorrect: consecutive correct answers
 * - streakWrong: consecutive wrong answers
 * - weakTopics: topics with <40% success after 5+ attempts
 * - strongTopics: topics with >80% success after 5+ attempts
 * - lastSubject: most recent subject studied
 * - lastTopic: most recent topic studied
 * - recommendedMode: "normal" | "review" | "boost"
 */

import { db, memoriesTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────

export interface TopicPerformance {
  topicId: string;
  attempts: number;
  correct: number;
  successRate: number;
}

export interface AdaptiveProfile {
  childId: number;
  recentAccuracy: number; // 0-1
  currentDifficultyBySubject: Record<string, number>; // subject => 1-5
  streakCorrect: number;
  streakWrong: number;
  weakTopics: string[]; // topic IDs
  strongTopics: string[]; // topic IDs
  lastSubject: string | null;
  lastTopic: string | null;
  recommendedMode: "normal" | "review" | "boost";
  topicPerformance: Record<string, TopicPerformance>; // topic => perf data
  updatedAt: string; // ISO timestamp
}

// ─── Default Profile ──────────────────────────────────────────────────────

function createDefaultProfile(childId: number): AdaptiveProfile {
  return {
    childId,
    recentAccuracy: 0.5,
    currentDifficultyBySubject: {
      bulgarian_language: 1,
      mathematics: 1,
    },
    streakCorrect: 0,
    streakWrong: 0,
    weakTopics: [],
    strongTopics: [],
    lastSubject: null,
    lastTopic: null,
    recommendedMode: "normal",
    topicPerformance: {},
    updatedAt: new Date().toISOString(),
  };
}

// ─── Database Access ──────────────────────────────────────────────────────

async function readAdaptiveState(childId: number): Promise<AdaptiveProfile | null> {
  try {
    const [row] = await db
      .select()
      .from(memoriesTable)
      .where(
        and(
          eq(memoriesTable.childId, childId),
          eq(memoriesTable.type, "adaptive_profile"),
        ),
      )
      .orderBy(desc(memoriesTable.createdAt))
      .limit(1);

    if (!row) return null;

    const data = JSON.parse(row.content) as AdaptiveProfile;
    return { ...data, childId };
  } catch {
    return null;
  }
}

async function storeAdaptiveState(userId: number, childId: number, profile: AdaptiveProfile): Promise<void> {
  // Clear existing adaptive profile
  await db
    .delete(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "adaptive_profile"),
      ),
    )
    .catch(() => {});

  // Store new profile
  await db
    .insert(memoriesTable)
    .values({
      userId,
      childId,
      type: "adaptive_profile",
      content: JSON.stringify(profile),
      module: "junior",
    })
    .catch(() => {});
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Get the current adaptive profile for a child.
 * Returns default profile if none exists.
 */
export async function getAdaptiveProfile(childId: number): Promise<AdaptiveProfile> {
  const existing = await readAdaptiveState(childId);
  return existing || createDefaultProfile(childId);
}

/**
 * Update adaptive profile based on answer result.
 * - Tracks streaks
 * - Updates topic performance
 * - Flags weak/strong topics
 * - Calculates recommended mode
 */
export async function updateAdaptiveProfile(
  userId: number,
  childId: number,
  subject: string,
  topic: string,
  wasCorrect: boolean,
): Promise<AdaptiveProfile> {
  const profile = await getAdaptiveProfile(childId);

  // Update streaks
  if (wasCorrect) {
    profile.streakCorrect += 1;
    profile.streakWrong = 0;
  } else {
    profile.streakWrong += 1;
    profile.streakCorrect = 0;
  }

  // Update topic performance
  if (!profile.topicPerformance[topic]) {
    profile.topicPerformance[topic] = {
      topicId: topic,
      attempts: 0,
      correct: 0,
      successRate: 0,
    };
  }

  const perf = profile.topicPerformance[topic];
  perf.attempts += 1;
  if (wasCorrect) perf.correct += 1;
  perf.successRate = perf.attempts > 0 ? perf.correct / perf.attempts : 0;

  // Adjust difficulty based on streaks
  const currentDiff = profile.currentDifficultyBySubject[subject] || 1;
  if (profile.streakCorrect >= 3) {
    profile.currentDifficultyBySubject[subject] = Math.min(5, currentDiff + 1);
  } else if (profile.streakWrong >= 2) {
    profile.currentDifficultyBySubject[subject] = Math.max(1, currentDiff - 1);
  }

  // Flag weak/strong topics (after at least 5 attempts)
  if (perf.attempts >= 5) {
    if (perf.successRate < 0.4) {
      if (!profile.weakTopics.includes(topic)) {
        profile.weakTopics.push(topic);
      }
      // Remove from strong if it was there
      profile.strongTopics = profile.strongTopics.filter(t => t !== topic);
    } else if (perf.successRate > 0.8) {
      if (!profile.strongTopics.includes(topic)) {
        profile.strongTopics.push(topic);
      }
      // Remove from weak if it was there
      profile.weakTopics = profile.weakTopics.filter(t => t !== topic);
    }
  }

  // Update last subject/topic
  profile.lastSubject = subject;
  profile.lastTopic = topic;

  // Calculate recent accuracy (simple: last 10 interactions)
  const recentCount = Math.min(10, Object.values(profile.topicPerformance).length);
  if (recentCount > 0) {
    const totalRecent = Object.values(profile.topicPerformance)
      .slice(-recentCount)
      .reduce((sum, p) => sum + p.attempts, 0);
    const correctRecent = Object.values(profile.topicPerformance)
      .slice(-recentCount)
      .reduce((sum, p) => sum + p.correct, 0);
    profile.recentAccuracy = totalRecent > 0 ? correctRecent / totalRecent : 0.5;
  }

  // Update recommended mode
  profile.recommendedMode = calculateRecommendedMode(profile);

  // Persist
  profile.updatedAt = new Date().toISOString();
  await storeAdaptiveState(userId, childId, profile);

  return profile;
}

/**
 * Get the recommended difficulty level for a subject.
 * Returns 1-5 based on current performance.
 */
export function getRecommendedDifficulty(profile: AdaptiveProfile, subject: string): number {
  return profile.currentDifficultyBySubject[subject] ?? 1;
}

/**
 * Check if child should review a weak topic instead of advancing.
 * Returns true if there are weak topics and accuracy is below 70%.
 */
export function shouldReviewWeakTopic(profile: AdaptiveProfile, subject: string): boolean {
  const hasWeakTopics = profile.weakTopics.length > 0;
  const lowAccuracy = profile.recentAccuracy < 0.7;
  const isRelevantSubject = profile.lastSubject === subject;

  return hasWeakTopics && lowAccuracy && isRelevantSubject;
}

/**
 * Calculate the recommended learning mode based on profile state.
 */
function calculateRecommendedMode(profile: AdaptiveProfile): "normal" | "review" | "boost" {
  if (profile.streakCorrect >= 3) {
    return "boost";
  }
  if (profile.streakWrong >= 2 || profile.weakTopics.length > 0) {
    return "review";
  }
  return "normal";
}

/**
 * Get the adaptive mode (for handler-level decisions).
 * Helper to avoid recalculating.
 */
export function getAdaptiveMode(profile: AdaptiveProfile): "normal" | "review" | "boost" {
  return profile.recommendedMode;
}
