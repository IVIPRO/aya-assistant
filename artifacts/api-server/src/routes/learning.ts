import { Router, type IRouter } from "express";
import { db, childrenTable, childTopicProgressTable, progressTable } from "@workspace/db";
import type { BadgeRecord } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";
import {
  getLevel,
  XP_AWARDS,
  computeLessonBadgeStats,
  evaluateLessonBadges,
  computeStreak,
} from "../lib/levelSystem";
import { detectWeakTopics } from "../lib/weaknessDetection";

const router: IRouter = Router();

/* ─────────────────────────────────────────────────────────────────
   POST /api/learning/complete
   Record a lesson / practice / quiz completion and award XP + stars.
───────────────────────────────────────────────────────────────── */
router.post("/learning/complete", requireAuth, async (req, res): Promise<void> => {
  const { childId, subjectId, topicId, action, correctCount = 0, totalCount = 0 } = req.body as {
    childId: number;
    subjectId: string;
    topicId: string;
    action: "lesson" | "practice" | "quiz";
    correctCount?: number;
    totalCount?: number;
  };

  if (!childId || !subjectId || !topicId || !action) {
    res.status(400).json({ error: "childId, subjectId, topicId, action are required" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);

  const [child] = await db
    .select()
    .from(childrenTable)
    .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId ?? -1)));

  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  /* ── Fetch existing topic progress ────────────────────────────── */
  const [existing] = await db
    .select()
    .from(childTopicProgressTable)
    .where(
      and(
        eq(childTopicProgressTable.childId, childId),
        eq(childTopicProgressTable.subjectId, subjectId),
        eq(childTopicProgressTable.topicId, topicId),
      ),
    );

  /* ── Compute rewards ──────────────────────────────────────────── */
  let xpGained = 0;
  let starsGained = 0;
  const updateFields: Partial<{
    lessonDone: boolean;
    practiceDone: boolean;
    quizPassed: boolean;
    attempts: number;
    correctAnswers: number;
    wrongAnswers: number;
    retryCount: number;
    lastActivityAt: Date;
  }> = {};

  const newAttempts = (existing?.attempts ?? 0) + 1;
  const wrongCount = Math.max(0, (totalCount || correctCount + 1) - correctCount);

  updateFields.attempts = newAttempts;
  updateFields.correctAnswers = (existing?.correctAnswers ?? 0) + Math.max(0, correctCount);
  updateFields.wrongAnswers = (existing?.wrongAnswers ?? 0) + wrongCount;
  updateFields.lastActivityAt = new Date();

  if (action === "lesson") {
    if (!existing?.lessonDone) {
      xpGained += XP_AWARDS.lesson;
      updateFields.lessonDone = true;
    }
  } else if (action === "practice") {
    if (!existing?.practiceDone) {
      xpGained += XP_AWARDS.practice;
      updateFields.practiceDone = true;
    } else {
      updateFields.retryCount = (existing?.retryCount ?? 0) + 1;
    }
    xpGained += Math.max(0, correctCount) * XP_AWARDS.correctAnswer;
    starsGained += Math.max(0, correctCount);
  } else if (action === "quiz") {
    const totalQuestions = totalCount || 3;
    const passed = correctCount >= Math.ceil(totalQuestions * 0.67);
    if (passed) {
      xpGained += XP_AWARDS.quiz;
      starsGained += 3;
      if (!existing?.quizPassed) updateFields.quizPassed = true;
    } else {
      updateFields.retryCount = (existing?.retryCount ?? 0) + 1;
    }
  }

  /* ── Upsert topic progress ────────────────────────────────────── */
  if (!existing) {
    await db.insert(childTopicProgressTable).values({
      childId,
      subjectId,
      topicId,
      lessonDone: updateFields.lessonDone ?? false,
      practiceDone: updateFields.practiceDone ?? false,
      quizPassed: updateFields.quizPassed ?? false,
      attempts: updateFields.attempts ?? 1,
      correctAnswers: updateFields.correctAnswers ?? 0,
      wrongAnswers: updateFields.wrongAnswers ?? 0,
      retryCount: updateFields.retryCount ?? 0,
      lastActivityAt: updateFields.lastActivityAt,
    });
  } else {
    await db
      .update(childTopicProgressTable)
      .set(updateFields)
      .where(eq(childTopicProgressTable.id, existing.id));
  }

  /* ── Log to progress table (for streak computation) ───────────── */
  if (xpGained > 0) {
    await db.insert(progressTable).values({
      childId,
      module: "elementary",
      subject: subjectId,
      score: xpGained,
      notes: `${action}:${topicId}`,
    });
  }

  /* ── Update child XP and stars ────────────────────────────────── */
  const prevLevel = getLevel(child.xp);
  const newXp = child.xp + xpGained;
  const newStars = child.stars + starsGained;
  const newLevel = getLevel(newXp);
  const levelUp = newLevel > prevLevel;

  /* ── Evaluate new badges ──────────────────────────────────────── */
  const allTopicProgress = await db
    .select()
    .from(childTopicProgressTable)
    .where(eq(childTopicProgressTable.childId, childId));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivity = await db
    .select({ createdAt: progressTable.createdAt })
    .from(progressTable)
    .where(and(eq(progressTable.childId, childId), gte(progressTable.createdAt, thirtyDaysAgo)));

  const streakDays = computeStreak(recentActivity.map((r) => new Date(r.createdAt)));

  const badgeStats = computeLessonBadgeStats(allTopicProgress, streakDays);
  const existingBadges = (child.badgesEarned ?? []) as BadgeRecord[];
  const newBadges = evaluateLessonBadges(badgeStats, existingBadges);

  const mergedBadges: BadgeRecord[] = [...existingBadges, ...newBadges];

  const [updatedChild] = await db
    .update(childrenTable)
    .set({ xp: newXp, stars: newStars, badgesEarned: mergedBadges })
    .where(eq(childrenTable.id, childId))
    .returning();

  res.json({
    xpGained,
    starsGained,
    levelUp,
    prevLevel,
    newLevel,
    newBadges,
    totalXp: updatedChild.xp,
    totalStars: updatedChild.stars,
    streakDays,
  });
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/learning/progress?childId=
   Return per-topic completion state for a child.
───────────────────────────────────────────────────────────────── */
router.get("/learning/progress", requireAuth, async (req, res): Promise<void> => {
  const childId = parseInt(req.query.childId as string, 10);
  if (isNaN(childId)) {
    res.status(400).json({ error: "childId is required" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);

  const [child] = await db
    .select()
    .from(childrenTable)
    .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId ?? -1)));

  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const topics = await db
    .select()
    .from(childTopicProgressTable)
    .where(eq(childTopicProgressTable.childId, childId));

  const summary = {
    totalLessons: topics.filter((t) => t.lessonDone).length,
    totalPractice: topics.filter((t) => t.practiceDone).length,
    totalQuizzes: topics.filter((t) => t.quizPassed).length,
  };

  res.json({ topics, summary });
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/learning/weaknesses?childId=
   Return weak topics detected from performance data.
───────────────────────────────────────────────────────────────── */
router.get("/learning/weaknesses", requireAuth, async (req, res): Promise<void> => {
  const childId = parseInt(req.query.childId as string, 10);
  if (isNaN(childId)) {
    res.status(400).json({ error: "childId is required" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);

  const [child] = await db
    .select()
    .from(childrenTable)
    .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId ?? -1)));

  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const topics = await db
    .select()
    .from(childTopicProgressTable)
    .where(eq(childTopicProgressTable.childId, childId));

  const weakTopics = detectWeakTopics(topics);

  res.json({ weakTopics, childId });
});

export default router;
