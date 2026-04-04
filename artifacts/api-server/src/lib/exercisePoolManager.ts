/**
 * Exercise Pool Manager — Phase B: Adaptive Lesson Generator + Exercise Cache
 *
 * Manages a per-child exercise pool stored in the database.
 * Generates AI exercise batches once, reuses them across sessions.
 * Refills automatically when the pool runs low.
 */

import { randomUUID } from "crypto";
import { db, exercisePoolTable } from "@workspace/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { generateExerciseBatch, type LessonMode } from "./aiLessonGenerator";
import { recordAnswer, getDifficultyMode } from "./exerciseDifficultyTracker";
import { recordTopicAnswer } from "./weakTopicMemoryTracker";
import type { ExercisePoolItem } from "@workspace/db";

export type { ExercisePoolItem };

const LOW_POOL_THRESHOLD = 5;
const INITIAL_BATCH_SIZE = 5;   /* small — blocks first HTTP request */
const REFILL_BATCH_SIZE  = 30;  /* large — runs in background */

// ─── Pool Stats ───────────────────────────────────────────────────────────────

export interface PoolStats {
  total: number;
  unused: number;
  used: number;
  correct: number;
  wrong: number;
}

export async function getPoolStats(
  childId: number,
  subjectId: string,
  topicId: string,
): Promise<PoolStats> {
  const rows = await db
    .select()
    .from(exercisePoolTable)
    .where(
      and(
        eq(exercisePoolTable.childId, childId),
        eq(exercisePoolTable.subjectId, subjectId),
        eq(exercisePoolTable.topicId, topicId),
      ),
    );

  const total = rows.length;
  const unused = rows.filter((r) => !r.used).length;
  const used = rows.filter((r) => r.used).length;
  const correct = rows.filter((r) => r.correct === true).length;
  const wrong = rows.filter((r) => r.correct === false).length;

  return { total, unused, used, correct, wrong };
}

// ─── Determine adaptive mode from pool stats ──────────────────────────────────

function inferMode(stats: PoolStats): LessonMode {
  if (stats.used < 3) return "normal";
  const answeredCount = stats.correct + stats.wrong;
  if (answeredCount === 0) return "normal";
  const accuracy = stats.correct / answeredCount;
  if (accuracy < 0.4) return "weak";
  if (accuracy > 0.8) return "strong";
  return "normal";
}

// ─── Generate and Insert a New Batch ─────────────────────────────────────────

async function generateAndInsertBatch(
  childId: number,
  subjectId: string,
  topicId: string,
  grade: number,
  lang: string,
  mode: LessonMode,
  count: number = REFILL_BATCH_SIZE,
): Promise<number> {
  const exercises = await generateExerciseBatch(
    subjectId,
    topicId,
    grade,
    lang as Parameters<typeof generateExerciseBatch>[3],
    mode,
    count,
  );

  if (exercises.length === 0) {
    console.warn("[POOL_MANAGER] generateExerciseBatch returned 0 items");
    return 0;
  }

  const batchId = randomUUID();
  const rows = exercises.map((ex) => ({
    childId,
    subjectId,
    topicId,
    grade,
    lang,
    difficulty: ex.difficulty,
    question: ex.question,
    correctAnswer: ex.correctAnswer,
    options: ex.options,
    hint: ex.hint,
    explanation: ex.explanation,
    exerciseType: ex.exerciseType,
    batchId,
  }));

  await db.insert(exercisePoolTable).values(rows);
  console.log(`[POOL_MANAGER] Inserted ${rows.length} exercises (batch=${batchId})`);
  return rows.length;
}

// ─── Ensure Pool Has Enough Exercises ────────────────────────────────────────

/* Track in-progress refill to avoid parallel duplicate calls */
const refillInProgress = new Set<string>();

export async function ensureExercisePool(
  childId: number,
  subjectId: string,
  topicId: string,
  grade: number,
  lang: string,
): Promise<PoolStats> {
  const stats = await getPoolStats(childId, subjectId, topicId);
  const poolKey = `${childId}:${subjectId}:${topicId}`;

  // ─── Smart Difficulty Adjustment ─────────────────────────────────────────
  // Get difficulty mode from tracker (based on recent answer patterns)
  // This overrides the batch-level mode from pool stats
  const trackerMode = getDifficultyMode(childId, subjectId);
  // Fall back to stats-based mode if tracker returns normal (default)
  const statsMode = inferMode(stats);
  const mode: LessonMode = trackerMode !== "normal" ? trackerMode : statsMode;

  if (stats.total === 0) {
    /* Very first call — generate a small batch synchronously so the user
       gets exercises immediately, then kick off a full refill in background. */
    console.log(`[POOL_MANAGER] Pool empty — generating initial ${INITIAL_BATCH_SIZE} (sync) mode=${mode} [tracker=${trackerMode}, stats=${statsMode}]`);
    await generateAndInsertBatch(childId, subjectId, topicId, grade, lang, mode, INITIAL_BATCH_SIZE);
    /* Fire-and-forget the large refill */
    if (!refillInProgress.has(poolKey)) {
      refillInProgress.add(poolKey);
      generateAndInsertBatch(childId, subjectId, topicId, grade, lang, mode, REFILL_BATCH_SIZE)
        .catch((e) => console.warn("[POOL_MANAGER] Background refill failed:", e))
        .finally(() => refillInProgress.delete(poolKey));
    }
    return getPoolStats(childId, subjectId, topicId);
  }

  if (stats.unused < LOW_POOL_THRESHOLD && !refillInProgress.has(poolKey)) {
    /* Pool running low — refill in background, don't block response */
    console.log(`[POOL_MANAGER] Pool low (${stats.unused} unused) — background refill mode=${mode} [tracker=${trackerMode}, stats=${statsMode}]`);
    refillInProgress.add(poolKey);
    generateAndInsertBatch(childId, subjectId, topicId, grade, lang, mode, REFILL_BATCH_SIZE)
      .catch((e) => console.warn("[POOL_MANAGER] Background refill failed:", e))
      .finally(() => refillInProgress.delete(poolKey));
  }

  return stats;
}

// ─── Get Next Exercises from Pool ─────────────────────────────────────────────

export async function getNextExercises(
  childId: number,
  subjectId: string,
  topicId: string,
  count = 10,
): Promise<ExercisePoolItem[]> {
  const exercises = await db
    .select()
    .from(exercisePoolTable)
    .where(
      and(
        eq(exercisePoolTable.childId, childId),
        eq(exercisePoolTable.subjectId, subjectId),
        eq(exercisePoolTable.topicId, topicId),
        eq(exercisePoolTable.used, false),
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(count);

  return exercises;
}

// ─── Record Exercise Result ───────────────────────────────────────────────────

export async function recordExerciseResult(
  exerciseId: number,
  correct: boolean,
  userAnswer: string,
): Promise<void> {
  // Get exercise to know which subject it belongs to
  const [exercise] = await db
    .select()
    .from(exercisePoolTable)
    .where(eq(exercisePoolTable.id, exerciseId));

  await db
    .update(exercisePoolTable)
    .set({
      used: true,
      correct,
      userAnswer,
      usedAt: new Date(),
    })
    .where(eq(exercisePoolTable.id, exerciseId));

  // ─── Smart Difficulty Adjustment + Weak Topic Detection ────────────────
  // Record answer in difficulty tracker to enable real-time difficulty adjustment
  // Also record topic answer for weak topic detection
  if (exercise) {
    recordAnswer(exercise.childId, exercise.subjectId, correct);
    
    // Record answer for this topic (for weak topic detection)
    const topicId = exercise.topicId || "unknown";
    recordTopicAnswer(exercise.childId, exercise.subjectId, topicId, correct);
  }

  console.log(`[POOL_MANAGER] Recorded result exerciseId=${exerciseId} correct=${correct}`);
}
