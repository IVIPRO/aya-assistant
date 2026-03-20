/**
 * AYA Junior — Bulgarian Topic Progression System
 *
 * Tracks student performance per topic and advances through the curriculum.
 * When success_rate > 70% for a topic, automatically advance to the next topic.
 * When success_rate < 30%, mark topic as weak and flag for teacher review.
 */

import { db, childTopicProgressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getCurriculumTopics } from "./bgCurriculum.js";

export interface TopicAttempt {
  topicId: string;
  attempt: "correct" | "incorrect";
  timestamp: Date;
}

export interface ProgressionResult {
  topicId: string;
  successRate: number; // 0.0–1.0
  totalAttempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  advancedToNext: boolean;
  nextTopicId: string | null;
  markedWeak: boolean;
}

// ─── Progress Tracking ─────────────────────────────────────────────────────────

/**
 * Record a student's attempt on a topic (correct or incorrect).
 * Updates the childTopicProgressTable.
 */
export async function recordTopicAttempt(
  childId: number,
  subjectId: string,
  topicId: string,
  grade: number,
  isCorrect: boolean,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(childTopicProgressTable)
    .where(
      and(
        eq(childTopicProgressTable.childId, childId),
        eq(childTopicProgressTable.subjectId, subjectId),
        eq(childTopicProgressTable.topicId, topicId),
      ),
    )
    .limit(1);

  if (existing) {
    // Update existing record
    const newAttempts = (existing.attempts ?? 0) + 1;
    const newCorrect = isCorrect ? (existing.correctAnswers ?? 0) + 1 : (existing.correctAnswers ?? 0);
    const newWrong = !isCorrect ? (existing.wrongAnswers ?? 0) + 1 : (existing.wrongAnswers ?? 0);

    await db
      .update(childTopicProgressTable)
      .set({
        attempts: newAttempts,
        correctAnswers: newCorrect,
        wrongAnswers: newWrong,
        lastActivityAt: new Date(),
      })
      .where(eq(childTopicProgressTable.id, existing.id))
      .catch(() => {});
  } else {
    // Create new record
    await db
      .insert(childTopicProgressTable)
      .values({
        childId,
        subjectId,
        topicId,
        attempts: 1,
        correctAnswers: isCorrect ? 1 : 0,
        wrongAnswers: isCorrect ? 0 : 1,
        retryCount: 0,
        lessonDone: false,
        practiceDone: false,
        quizPassed: false,
        lastActivityAt: new Date(),
      })
      .catch(() => {});
  }
}

// ─── Progression Logic ─────────────────────────────────────────────────────────

/**
 * Check if a student should advance to the next topic.
 * Returns progression result + side effects (DB updates if advancement occurs).
 */
export async function checkTopicProgression(
  childId: number,
  subjectId: string,
  topicId: string,
  grade: number,
): Promise<ProgressionResult> {
  const [record] = await db
    .select()
    .from(childTopicProgressTable)
    .where(
      and(
        eq(childTopicProgressTable.childId, childId),
        eq(childTopicProgressTable.subjectId, subjectId),
        eq(childTopicProgressTable.topicId, topicId),
      ),
    )
    .limit(1);

  const attempts = record?.attempts ?? 0;
  const correct = record?.correctAnswers ?? 0;
  const wrong = record?.wrongAnswers ?? 0;

  const successRate = attempts > 0 ? correct / attempts : 0;

  // Get all topics for this grade/subject
  const allTopics = getCurriculumTopics(grade, subjectId);
  const currentIndex = allTopics.findIndex(t => t.topicId === topicId);
  const nextTopic = currentIndex >= 0 && currentIndex < allTopics.length - 1
    ? allTopics[currentIndex + 1]
    : null;

  // Progression rules:
  // - If >= 70% success rate and >= 5 attempts → advance
  // - If < 30% success rate and >= 5 attempts → mark weak

  const advancedToNext = successRate >= 0.7 && attempts >= 5 && nextTopic !== null;
  const markedWeak = successRate < 0.3 && attempts >= 5;

  // If advancing, mark current topic as lesson-done and create next topic record
  if (advancedToNext && nextTopic) {
    await db
      .update(childTopicProgressTable)
      .set({ lessonDone: true })
      .where(eq(childTopicProgressTable.id, record!.id))
      .catch(() => {});

    // Ensure next topic record exists (prepopulate for next session)
    const [nextRecord] = await db
      .select()
      .from(childTopicProgressTable)
      .where(
        and(
          eq(childTopicProgressTable.childId, childId),
          eq(childTopicProgressTable.subjectId, subjectId),
          eq(childTopicProgressTable.topicId, nextTopic.topicId),
        ),
      )
      .limit(1);

    if (!nextRecord) {
      await db
        .insert(childTopicProgressTable)
        .values({
          childId,
          subjectId,
          topicId: nextTopic.topicId,
          attempts: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          retryCount: 0,
          lessonDone: false,
          practiceDone: false,
          quizPassed: false,
          lastActivityAt: new Date(),
        })
        .catch(() => {});
    }
  }

  return {
    topicId,
    successRate,
    totalAttempts: attempts,
    correctAnswers: correct,
    wrongAnswers: wrong,
    advancedToNext,
    nextTopicId: nextTopic?.topicId ?? null,
    markedWeak,
  };
}

// ─── Weak Topic Detection ──────────────────────────────────────────────────────

/**
 * Get all topics marked as weak for a child.
 * Weak = success rate < 30% with >= 5 attempts.
 */
export async function getWeakTopics(childId: number, subjectId: string): Promise<string[]> {
  const records = await db
    .select()
    .from(childTopicProgressTable)
    .where(
      and(
        eq(childTopicProgressTable.childId, childId),
        eq(childTopicProgressTable.subjectId, subjectId),
      ),
    );

  return records
    .filter(r => {
      const attempts = r.attempts ?? 0;
      const correct = r.correctAnswers ?? 0;
      const rate = attempts > 0 ? correct / attempts : 0;
      return rate < 0.3 && attempts >= 5;
    })
    .map(r => r.topicId);
}

/**
 * Get the next topic in the curriculum for a child.
 * Preference: first non-done topic, or first topic if none done.
 */
export async function getNextBulgarianTopic(
  childId: number,
  grade: number,
  subjectId: string = "bulgarian_language",
): Promise<string> {
  const allTopics = getCurriculumTopics(grade, subjectId);

  const records = await db
    .select()
    .from(childTopicProgressTable)
    .where(
      and(
        eq(childTopicProgressTable.childId, childId),
        eq(childTopicProgressTable.subjectId, subjectId),
      ),
    );

  // Find first topic that is NOT lesson-done
  const nextTopic = allTopics.find(topic => {
    const record = records.find(r => r.topicId === topic.topicId);
    return !record || !record.lessonDone;
  });

  return nextTopic?.topicId ?? allTopics[0]?.topicId ?? "letters_and_sounds";
}
