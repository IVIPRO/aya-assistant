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
import { getCurriculumTopics } from "../lib/bgCurriculum.js";
import { buildWeeklyInsights } from "../lib/weeklyInsights";
import { buildTeacherExport } from "../lib/teacherExport";

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

  const mergedBadges: BadgeRecord[] = [...existingBadges, ...newBadges];

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
    celebration: streakDays >= 3 ? { message: `${streakDays} days 🔥`, emoji: "🎉" } : null,
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
   GET /api/learning/adaptive-profile?childId=&subjectId=&topicId=
   Unified adaptive state for a child (optionally scoped to a topic).
   No new tables — pure computation from childTopicProgressTable.
   Used by the interactive lesson engine to adapt difficulty/support.
───────────────────────────────────────────────────────────────── */
router.get("/learning/adaptive-profile", requireAuth, async (req, res): Promise<void> => {
  const childId = parseInt(req.query.childId as string, 10);
  const subjectId = (req.query.subjectId as string) ?? null;
  const topicId   = (req.query.topicId   as string) ?? null;

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

  const allTopics = await db
    .select()
    .from(childTopicProgressTable)
    .where(eq(childTopicProgressTable.childId, childId));

  /* ── Weak topics (authoritative: weaknessDetection.ts) ─────── */
  const weakTopics = detectWeakTopics(allTopics);

  /* ── Strong topics: >=80% success, >=5 attempts ────────────── */
  const strongTopics = allTopics
    .filter(r => {
      const att = r.attempts ?? 0;
      const cor = r.correctAnswers ?? 0;
      return att >= 5 && cor / att >= 0.8;
    })
    .map(r => ({
      subjectId: r.subjectId,
      topicId: r.topicId,
      successRate: Math.round(((r.correctAnswers ?? 0) / (r.attempts ?? 1)) * 100),
      attempts: r.attempts ?? 0,
    }));

  /* ── Current topic stats (if subjectId + topicId provided) ─── */
  let currentTopicStats: {
    attempts: number; correctAnswers: number; wrongAnswers: number;
    successRate: number; retryCount: number; quizPassed: boolean;
    context: "weak" | "strong" | "normal";
  } | null = null;

  if (subjectId && topicId) {
    const row = allTopics.find(r => r.subjectId === subjectId && r.topicId === topicId);
    if (row) {
      const att = row.attempts ?? 0;
      const cor = row.correctAnswers ?? 0;
      const sr = att > 0 ? Math.round((cor / att) * 100) : 0;
      const isWeak = weakTopics.some(w => w.subjectId === subjectId && w.topicId === topicId);
      const isStrong = !isWeak && att >= 5 && sr >= 80;
      currentTopicStats = {
        attempts: att,
        correctAnswers: cor,
        wrongAnswers: row.wrongAnswers ?? 0,
        successRate: sr,
        retryCount: row.retryCount ?? 0,
        quizPassed: row.quizPassed ?? false,
        context: isWeak ? "weak" : isStrong ? "strong" : "normal",
      };
    }
  }

  /* ── Overall accuracy across all attempts ───────────────────── */
  const totalAttempts = allTopics.reduce((s, r) => s + (r.attempts ?? 0), 0);
  const totalCorrect  = allTopics.reduce((s, r) => s + (r.correctAnswers ?? 0), 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  /* ── Recommended mode ───────────────────────────────────────── */
  let recommendedMode: "normal" | "review" | "boost" = "normal";
  if (weakTopics.length >= 2 || (overallAccuracy !== null && overallAccuracy < 55)) {
    recommendedMode = "review";
  } else if (strongTopics.length >= 3 && (overallAccuracy === null || overallAccuracy >= 80)) {
    recommendedMode = "boost";
  }

  res.json({
    childId,
    weakTopics,
    strongTopics,
    currentTopicStats,
    overallAccuracy,
    recommendedMode,
    totalTopicsStudied: allTopics.length,
  });
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
   GET /api/learning/recommendation?childId=
   AYA Adaptive Learning Path — recommend the next learning focus.

   Logic (in priority order):
   1. Weakest topic from childTopicProgressTable (via detectWeakTopics)
   2. Next unstarted topic in BG curriculum order (for mathematics /
      bulgarian_language subjects)
   3. Topic with most wrong answers across all subjects (reinforcement)
   4. Fallback: first BG curriculum topic for grade

   Reuses: detectWeakTopics, getCurriculumTopics, learningPathTable
   No new tables or scoring engines.
───────────────────────────────────────────────────────────────── */
router.get("/learning/recommendation", requireAuth, async (req, res): Promise<void> => {
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

  const grade = child.grade ?? 2;

  const allTopics = await db
    .select()
    .from(childTopicProgressTable)
    .where(eq(childTopicProgressTable.childId, childId));

  /* ── Step 1: weakness detection (authoritative, reuses existing engine) ── */
  const weakTopics = detectWeakTopics(allTopics);

  type RecommendationReason =
    | "weak_topic"
    | "needs_more_practice"
    | "recommended_review"
    | "next_in_curriculum"
    | "reinforcement"
    | "first_topic";

  let subjectId = "mathematics";
  let topicId = "addition_to_10";
  let recommendationReason: RecommendationReason = "first_topic";
  let suggestedPracticeCount = 2;

  if (weakTopics.length > 0) {
    /* ── Case 1: Weakest topic — already sorted ascending by successRate ── */
    const top = weakTopics[0];
    subjectId = top.subjectId;
    topicId = top.topicId;
    recommendationReason = top.label as RecommendationReason;
    suggestedPracticeCount =
      top.label === "weak_topic" ? 5 :
      top.label === "needs_more_practice" ? 3 : 2;

  } else {
    /* ── Case 2: No weaknesses — find next unstarted topic in BG curriculum ─ */
    const bgSubjects = ["mathematics", "bulgarian_language"] as const;
    const studiedSet = new Set(allTopics.map(r => `${r.subjectId}::${r.topicId}`));

    let found = false;
    for (const subj of bgSubjects) {
      const curriculumTopics = getCurriculumTopics(grade, subj);
      const nextTopic = curriculumTopics.find(ct => !studiedSet.has(`${subj}::${ct.topicId}`));
      if (nextTopic) {
        subjectId = subj;
        topicId = nextTopic.topicId;
        recommendationReason = "next_in_curriculum";
        suggestedPracticeCount = 2;
        found = true;
        break;
      }
    }

    if (!found) {
      /* ── Case 3: All curriculum topics started — pick topic with most wrong answers ── */
      if (allTopics.length > 0) {
        const worst = [...allTopics].sort(
          (a, b) => (b.wrongAnswers ?? 0) - (a.wrongAnswers ?? 0)
        )[0];
        subjectId = worst.subjectId;
        topicId = worst.topicId;
        recommendationReason = "reinforcement";
        suggestedPracticeCount = 3;
      } else {
        /* ── Case 4: No activity yet — first BG curriculum topic for grade ── */
        const first = getCurriculumTopics(grade, "mathematics")[0];
        subjectId = "mathematics";
        topicId = first?.topicId ?? "addition_to_10";
        recommendationReason = "first_topic";
        suggestedPracticeCount = 2;
      }
    }
  }

  /* ── Build suggested lessons list ── */
  const suggestedLessons = [{ subjectId, topicId }];

  /* ── Persist to learningPathTable (reuse existing table) ── */
  const recommendation = {
    subjectId,
    topicId,
    recommendationReason,
    suggestedLessons,
    suggestedPracticeCount,
    generatedAt: new Date().toISOString(),
  };

  await db.insert(learningPathTable).values({
    childId,
    priorityTopic: `${subjectId}:${topicId}`,
    generatedPractice: recommendation,
  }).catch(() => {});

  res.json(recommendation);
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
   GET /api/learning/daily-quests?childId=
   Return today's 3 daily quests for a child.
   Deterministic — derived from existing progress data, no new DB table.
───────────────────────────────────────────────────────────────── */
router.get("/learning/daily-quests", requireAuth, async (req, res): Promise<void> => {
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [todayActivity, recentActivity] = await Promise.all([
    db.select().from(progressTable)
      .where(and(eq(progressTable.childId, childId), gte(progressTable.createdAt, todayStart))),
    db.select({ createdAt: progressTable.createdAt }).from(progressTable)
      .where(and(eq(progressTable.childId, childId), gte(progressTable.createdAt, thirtyDaysAgo))),
  ]);

  const streakDays = computeStreak(recentActivity.map((r) => new Date(r.createdAt)));

  const lessonDoneToday = todayActivity.some(a => a.notes?.startsWith("lesson:") || a.notes?.startsWith("quiz:"));
  const correctAnswersToday = todayActivity.reduce((sum, a) => sum + (a.score ?? 0), 0);
  const streakAlive = streakDays >= 1;

  res.json({
    quests: [
      {
        id: "daily_lesson",
        icon: "📖",
        title: "Complete a lesson",
        titleBg: "Завърши урок",
        titleEs: "Completa una lección",
        titleDe: "Eine Lektion abschließen",
        titleFr: "Terminer une leçon",
        xpReward: 20,
        done: lessonDoneToday,
      },
      {
        id: "daily_practice",
        icon: "✏️",
        title: "Earn 15 XP practicing",
        titleBg: "Спечели 15 XP в практика",
        titleEs: "Gana 15 XP practicando",
        titleDe: "Verdiene 15 XP beim Üben",
        titleFr: "Gagne 15 XP en pratiquant",
        xpReward: 15,
        done: correctAnswersToday >= 15,
      },
      {
        id: "daily_streak",
        icon: "🔥",
        title: "Keep your streak alive",
        titleBg: "Поддържай серията си",
        titleEs: "Mantén tu racha",
        titleDe: "Halte deine Streak aufrecht",
        titleFr: "Maintiens ta série",
        xpReward: 10,
        done: streakAlive,
      },
    ],
    completedCount: [lessonDoneToday, correctAnswersToday >= 15, streakAlive].filter(Boolean).length,
    totalCount: 3,
    streakDays,
  });
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

/* ─────────────────────────────────────────────────────────────────
   GET /api/learning/resume?childId=
   Return the most recent unfinished or last-touched lesson for resuming.
───────────────────────────────────────────────────────────────── */
router.get("/learning/resume", requireAuth, async (req, res): Promise<void> => {
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

  if (topics.length === 0) {
    res.json({ subject: null, topic: null });
    return;
  }

  // 1️⃣ Find in-progress topic (lesson OR practice OR quiz started, but not all complete)
  const inProgressTopics = topics.filter(
    (t) => (t.lessonDone || t.practiceDone || t.quizPassed) && 
           !(t.lessonDone && t.practiceDone && t.quizPassed)
  );
  
  let resumeProgress = inProgressTopics.length > 0 
    ? inProgressTopics.sort((a, b) => (b.lastActivityAt?.getTime() ?? 0) - (a.lastActivityAt?.getTime() ?? 0))[0]
    : null;

  // 2️⃣ If no in-progress, find last touched topic (by lastActivityAt)
  if (!resumeProgress) {
    resumeProgress = topics.sort((a, b) => (b.lastActivityAt?.getTime() ?? 0) - (a.lastActivityAt?.getTime() ?? 0))[0];
  }

  if (!resumeProgress) {
    res.json({ subject: null, topic: null });
    return;
  }

  // Get curriculum data to find the actual Subject and Topic objects
  const allTopics = getCurriculumTopics(child.grade);
  const subject = allTopics.find((s) => s.id === resumeProgress!.subjectId);
  const topic = subject?.topics.find((t) => t.id === resumeProgress!.topicId);

  if (!subject || !topic) {
    res.json({ subject: null, topic: null });
    return;
  }

  res.json({ subject, topic, lastActivityAt: resumeProgress.lastActivityAt });
});

export default router;
