import { Router, type IRouter } from "express";
import { db, childrenTable, childTopicProgressTable, progressTable, dailyPlansTable, learningPathTable } from "@workspace/db";
import type { BadgeRecord, DailyPlanTask } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";
import {
  getLevel,
  XP_AWARDS,
  computeLessonBadgeStats,
  evaluateLessonBadges,
  computeStreak,
} from "../lib/levelSystem";
import { detectWeakTopics } from "../lib/weaknessDetection";
import { buildWeeklyInsights } from "../lib/weeklyInsights";
import { buildTeacherExport } from "../lib/teacherExport";
import {
  calculateStreakFromProgress,
  getEligibleBadges,
  formatStreakDisplay,
} from "../lib/gamificationHelpers";

const router: IRouter = Router();

/* ─────────────────────────────────────────────────────────────────
   POST /api/learning/complete
   Record a lesson / practice / quiz completion and award XP + stars.
───────────────────────────────────────────────────────────────── */
router.post("/learning/complete", requireAuth, async (req, res): Promise<void> => {
  const { childId, subjectId, topicId, action, correctCount = 0, totalCount = 0, dailyPlanTaskId, dailyPlanId } = req.body as {
    childId: number;
    subjectId: string;
    topicId: string;
    action: "lesson" | "practice" | "quiz";
    correctCount?: number;
    totalCount?: number;
    dailyPlanTaskId?: string;
    dailyPlanId?: number;
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

  /* ── Gamification: Daily Streak & Achievement Badges ────────────── */
  const dailyStreak = calculateStreakFromProgress(recentActivity.map((r) => new Date(r.createdAt)));
  const lessonsCompleted = allTopicProgress.filter(t => t.lessonDone).length;
  const gamificationBadges = getEligibleBadges(lessonsCompleted, dailyStreak)
    .map(badge => ({
      id: badge.id,
      title: badge.title,
      icon: badge.icon,
      description: badge.description ?? badge.title,
      earnedAt: new Date().toISOString(),
    } as BadgeRecord));
  const streakDisplay = formatStreakDisplay(dailyStreak);

  const mergedBadges: BadgeRecord[] = [...existingBadges, ...newBadges, ...gamificationBadges];

  const [updatedChild] = await db
    .update(childrenTable)
    .set({ xp: newXp, stars: newStars, badgesEarned: mergedBadges })
    .where(eq(childrenTable.id, childId))
    .returning();

  /* ── Daily Plan Task Completion: Mark task as completed if provided ── */
  if (dailyPlanTaskId && dailyPlanId) {
    try {
      const [plan] = await db
        .select()
        .from(dailyPlansTable)
        .where(eq(dailyPlansTable.id, dailyPlanId));

      if (plan && plan.childId === childId) {
        const updatedTasks = (plan.tasks as DailyPlanTask[]).map(t =>
          t.id === dailyPlanTaskId ? { ...t, status: "completed" as const } : t
        );
        await db
          .update(dailyPlansTable)
          .set({ tasks: updatedTasks, updatedAt: new Date() })
          .where(eq(dailyPlansTable.id, dailyPlanId));
      }
    } catch (err) {
      // Log but don't fail if daily plan update fails
      console.error("Failed to update daily plan task:", err);
    }
  }

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
    /* Gamification additions */
    dailyStreak,
    streakDisplay,
    celebration: dailyStreak >= 3 ? { message: streakDisplay, emoji: "🎉" } : null,
    achievementsEarned: gamificationBadges,
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

/* ─────────────────────────────────────────────────────────────────
   GET /api/learning/weekly-insights?childId=
   Return weekly parent insights for a child.
───────────────────────────────────────────────────────────────── */
router.get("/learning/weekly-insights", requireAuth, async (req, res): Promise<void> => {
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

  const insights = await buildWeeklyInsights(childId);
  res.json(insights);
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/learning/teacher-export?childId=&grade=
   Return teacher-ready export data for a child.
───────────────────────────────────────────────────────────────── */
router.get("/learning/teacher-export", requireAuth, async (req, res): Promise<void> => {
  const childId = parseInt(req.query.childId as string, 10);
  const grade = req.query.grade ? parseInt(req.query.grade as string, 10) : undefined;
  
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

  const exportData = await buildTeacherExport(childId, grade);
  res.json(exportData);
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/learning/path?childId=
   Return the latest AI-generated personal learning path for a child.
───────────────────────────────────────────────────────────────── */
router.get("/learning/path", requireAuth, async (req, res): Promise<void> => {
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

  const [latestPath] = await db
    .select()
    .from(learningPathTable)
    .where(eq(learningPathTable.childId, childId))
    .orderBy(desc(learningPathTable.createdAt))
    .limit(1);

  if (!latestPath) {
    res.json({ path: null });
    return;
  }

  res.json({ path: latestPath });
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/free-conversation/session
   Record a Free Conversation Mode session for analytics.
   Stored in the progressTable with module="free_conversation".
───────────────────────────────────────────────────────────────── */
router.post("/free-conversation/session", requireAuth, async (req, res): Promise<void> => {
  const { childId, durationMinutes, voiceReplies, chatReplies } = req.body as {
    childId: number;
    durationMinutes: number;
    voiceReplies: number;
    chatReplies: number;
  };

  if (!childId || isNaN(childId)) {
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

  const mins = Math.max(1, Math.min(durationMinutes ?? 1, 120));
  const vReplies = Math.max(0, voiceReplies ?? 0);
  const cReplies = Math.max(0, chatReplies ?? 0);

  await db.insert(progressTable).values({
    childId,
    module: "free_conversation",
    subject: "voice_session",
    score: mins,
    notes: JSON.stringify({ voiceReplies: vReplies, chatReplies: cReplies, durationMinutes: mins }),
  });

  console.log(`[FREE_CONV] Recorded session childId=${childId} duration=${mins}m voice=${vReplies} chat=${cReplies}`);

  res.json({ ok: true, durationMinutes: mins });
});

export default router;
