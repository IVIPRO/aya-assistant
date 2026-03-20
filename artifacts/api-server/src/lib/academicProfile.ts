/**
 * AYA Junior — Student Academic Profile Foundation
 *
 * Provides clean data structures and helper functions for student academic
 * state tracking. Designed so future teacher accounts can read:
 *   - current grade and country
 *   - active subject and topic
 *   - completion rate by topic
 *   - weak and strong topics
 *   - recent session summary
 *
 * State is persisted in memoriesTable (type = "academic_subject_state")
 * so no schema changes are needed.
 *
 * DO NOT build teacher UI here — this is the data layer only.
 */

import { db, memoriesTable, childTopicProgressTable, childrenTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveSubjectState {
  activeSubject: string;          // e.g. "bulgarian_language" | "mathematics"
  activeTopicId: string | null;   // e.g. "letters_and_sounds"
  grade: number;
  country: string;
  updatedAt: string;              // ISO timestamp
}

export interface TopicProgressEntry {
  topicId: string;
  subjectId: string;
  lessonDone: boolean;
  practiceDone: boolean;
  quizPassed: boolean;
  correctAnswers: number;
  wrongAnswers: number;
  attempts: number;
  successRate: number;            // 0.0–1.0
  lastActivityAt: string | null;
}

export interface StudentAcademicProfile {
  childId: number;
  country: string;
  gradeLevel: number;
  activeSubject: string | null;
  activeTopicId: string | null;
  progressBySubject: Record<string, number>;          // subjectId → avg success rate (0.0–1.0)
  progressByTopic: Record<string, TopicProgressEntry>;
  weakTopics: string[];    // topicIds with successRate < 0.5
  strongTopics: string[];  // topicIds with successRate >= 0.8
  lastActivityAt: string | null;
}

export interface TeacherReport {
  childId: number;
  gradeLevel: number;
  country: string;
  activeSubject: string | null;
  activeTopicId: string | null;
  topicProgress: TopicProgressEntry[];
  weakTopics: string[];
  strongTopics: string[];
  recentSessions: RecentSession[];
  generatedAt: string;
}

export interface RecentSession {
  module: string;
  content: string;
  createdAt: string;
}

// ─── State Reader ─────────────────────────────────────────────────────────────

/**
 * Read the stored active subject state for a child from memoriesTable.
 * Returns null if no subject has been set yet.
 */
export async function readActiveSubjectState(
  childId: number,
  module: string,
): Promise<ActiveSubjectState | null> {
  const [row] = await db
    .select()
    .from(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "academic_subject_state"),
        eq(memoriesTable.module, module),
      ),
    )
    .orderBy(desc(memoriesTable.createdAt))
    .limit(1);

  if (!row) return null;
  try {
    return JSON.parse(row.content) as ActiveSubjectState;
  } catch {
    return null;
  }
}

// ─── State Writer ─────────────────────────────────────────────────────────────

/**
 * Persist the child's active subject and topic.
 * Overwrites any existing academic_subject_state for this child+module.
 * Used by the subject router each time the child requests a subject.
 */
export async function updateActiveSubject(
  userId: number,
  childId: number,
  module: string,
  activeSubject: string,
  activeTopicId: string | null,
  grade: number,
  country: string,
): Promise<void> {
  // Delete existing records first (keep only latest)
  await db
    .delete(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "academic_subject_state"),
        eq(memoriesTable.module, module),
      ),
    )
    .catch(() => {});

  const state: ActiveSubjectState = {
    activeSubject,
    activeTopicId,
    grade,
    country,
    updatedAt: new Date().toISOString(),
  };

  await db
    .insert(memoriesTable)
    .values({
      userId,
      childId,
      type: "academic_subject_state",
      content: JSON.stringify(state),
      module,
    })
    .catch(() => {});
}

// ─── Profile Builder ──────────────────────────────────────────────────────────

/**
 * Build the full student academic profile for a child.
 * Aggregates data from childrenTable, childTopicProgressTable, and memoriesTable.
 * Returns a clean, serialisable object ready for teacher-facing reads.
 */
export async function buildStudentProfile(
  childId: number,
  module: string,
): Promise<StudentAcademicProfile> {
  // 1. Fetch child base data
  const [child] = await db
    .select()
    .from(childrenTable)
    .where(eq(childrenTable.id, childId))
    .limit(1);

  const gradeLevel = child?.grade ?? 1;
  const country = child?.country ?? "BG";

  // 2. Fetch active subject state
  const activeState = await readActiveSubjectState(childId, module);

  // 3. Fetch topic progress
  const progressRows = await db
    .select()
    .from(childTopicProgressTable)
    .where(eq(childTopicProgressTable.childId, childId));

  const progressByTopic: Record<string, TopicProgressEntry> = {};
  const progressBySubject: Record<string, number[]> = {};

  for (const row of progressRows) {
    const attempts = row.attempts ?? 0;
    const correctAnswers = row.correctAnswers ?? 0;
    const wrongAnswers = row.wrongAnswers ?? 0;
    const successRate = attempts > 0 ? correctAnswers / attempts : 0;

    const entry: TopicProgressEntry = {
      topicId: row.topicId,
      subjectId: row.subjectId,
      lessonDone: row.lessonDone,
      practiceDone: row.practiceDone,
      quizPassed: row.quizPassed,
      correctAnswers,
      wrongAnswers,
      attempts,
      successRate,
      lastActivityAt: row.lastActivityAt
        ? new Date(row.lastActivityAt).toISOString()
        : null,
    };

    progressByTopic[row.topicId] = entry;

    if (!progressBySubject[row.subjectId]) progressBySubject[row.subjectId] = [];
    progressBySubject[row.subjectId].push(successRate);
  }

  // Compute per-subject average
  const progressBySubjectAvg: Record<string, number> = {};
  for (const [subjectId, rates] of Object.entries(progressBySubject)) {
    progressBySubjectAvg[subjectId] =
      rates.reduce((s, r) => s + r, 0) / rates.length;
  }

  const weakTopics = Object.values(progressByTopic)
    .filter(t => t.attempts >= 3 && t.successRate < 0.5)
    .map(t => t.topicId);

  const strongTopics = Object.values(progressByTopic)
    .filter(t => t.attempts >= 3 && t.successRate >= 0.8)
    .map(t => t.topicId);

  // 4. Last activity timestamp
  const lastActivityAt =
    Object.values(progressByTopic)
      .map(t => t.lastActivityAt)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null;

  return {
    childId,
    country,
    gradeLevel,
    activeSubject: activeState?.activeSubject ?? null,
    activeTopicId: activeState?.activeTopicId ?? null,
    progressBySubject: progressBySubjectAvg,
    progressByTopic,
    weakTopics,
    strongTopics,
    lastActivityAt,
  };
}

// ─── Teacher Report Builder ───────────────────────────────────────────────────

/**
 * Build a teacher-facing report for a child.
 * This is the clean output structure intended for future teacher account reads.
 * Not wired to any UI yet — data layer only.
 */
export async function buildTeacherReport(
  childId: number,
  module: string,
): Promise<TeacherReport> {
  const profile = await buildStudentProfile(childId, module);

  // Recent session memories (last 10)
  const recentRows = await db
    .select()
    .from(memoriesTable)
    .where(eq(memoriesTable.childId, childId))
    .orderBy(desc(memoriesTable.createdAt))
    .limit(10);

  const recentSessions: RecentSession[] = recentRows.map(r => ({
    module: r.module ?? "junior",
    content: r.content,
    createdAt: new Date(r.createdAt).toISOString(),
  }));

  return {
    childId,
    gradeLevel: profile.gradeLevel,
    country: profile.country,
    activeSubject: profile.activeSubject,
    activeTopicId: profile.activeTopicId,
    topicProgress: Object.values(profile.progressByTopic),
    weakTopics: profile.weakTopics,
    strongTopics: profile.strongTopics,
    recentSessions,
    generatedAt: new Date().toISOString(),
  };
}
