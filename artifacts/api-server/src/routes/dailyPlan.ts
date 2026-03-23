import { Router, type IRouter } from "express";
import { db, childrenTable, dailyPlansTable, childTopicProgressTable, progressTable } from "@workspace/db";
import type { DailyPlanTask, DailyPlanTaskStatus } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";
import { detectWeakTopics } from "../lib/weaknessDetection";
import { applySmartSequencing, calculateSuccessRate, type TaskWithMetadata } from "../lib/smartTaskSequencing";

const router: IRouter = Router();

/* ─────────────────────────────────────────────────────────────────
   Curriculum catalogue used for plan generation
   Each entry: subjectId (frontend), topicId, minGrade, xpReward
───────────────────────────────────────────────────────────────── */
const TASK_POOL: Array<{
  subjectId: string;
  topicId: string;
  minGrade: number;
  maxGrade: number;
  baseXp: number;
}> = [
  { subjectId: "mathematics",        topicId: "addition",       minGrade: 1, maxGrade: 2, baseXp: 30 },
  { subjectId: "mathematics",        topicId: "subtraction",    minGrade: 1, maxGrade: 2, baseXp: 30 },
  { subjectId: "mathematics",        topicId: "multiplication", minGrade: 2, maxGrade: 4, baseXp: 40 },
  { subjectId: "mathematics",        topicId: "division",       minGrade: 3, maxGrade: 4, baseXp: 45 },
  { subjectId: "mathematics",        topicId: "word-problems",  minGrade: 2, maxGrade: 4, baseXp: 40 },
  { subjectId: "bulgarian-language", topicId: "alphabet",       minGrade: 1, maxGrade: 1, baseXp: 25 },
  { subjectId: "bulgarian-language", topicId: "reading",        minGrade: 1, maxGrade: 3, baseXp: 35 },
  { subjectId: "bulgarian-language", topicId: "writing",        minGrade: 2, maxGrade: 4, baseXp: 35 },
  { subjectId: "bulgarian-language", topicId: "grammar",        minGrade: 3, maxGrade: 4, baseXp: 40 },
  { subjectId: "reading-literature", topicId: "stories",        minGrade: 1, maxGrade: 4, baseXp: 35 },
  { subjectId: "reading-literature", topicId: "comprehension",  minGrade: 2, maxGrade: 4, baseXp: 40 },
  { subjectId: "logic-thinking",     topicId: "patterns",       minGrade: 1, maxGrade: 3, baseXp: 25 },
  { subjectId: "logic-thinking",     topicId: "puzzles",        minGrade: 2, maxGrade: 4, baseXp: 35 },
  { subjectId: "nature-science",     topicId: "plants",         minGrade: 1, maxGrade: 3, baseXp: 30 },
  { subjectId: "nature-science",     topicId: "animals",        minGrade: 1, maxGrade: 2, baseXp: 30 },
  { subjectId: "nature-science",     topicId: "weather",        minGrade: 2, maxGrade: 4, baseXp: 30 },
];

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function generatePlan(childId: number, grade: number, xp: number): Promise<DailyPlanTask[]> {
  const gradeNum = Math.max(1, Math.min(4, grade));

  const eligible = TASK_POOL.filter(t => gradeNum >= t.minGrade && gradeNum <= t.maxGrade);

  const topicProgressRows = await db
    .select()
    .from(childTopicProgressTable)
    .where(eq(childTopicProgressTable.childId, childId));

  const doneKeys = new Set(
    topicProgressRows
      .filter(r => r.lessonDone && r.practiceDone)
      .map(r => `${r.subjectId}:${r.topicId}`)
  );
  const startedKeys = new Set(
    topicProgressRows
      .filter(r => r.lessonDone || r.practiceDone)
      .map(r => `${r.subjectId}:${r.topicId}`)
  );

  /* ── Topic-level weakness detection ──────────────────────────── */
  const weakTopics = detectWeakTopics(topicProgressRows);
  const weakTopicKeys = new Set(weakTopics.map(w => `${w.subjectId}:${w.topicId}`));

  /* ── Subject-level weakness from progress table ───────────────── */
  const recentProgress = await db
    .select()
    .from(progressTable)
    .where(eq(progressTable.childId, childId))
    .orderBy(desc(progressTable.createdAt))
    .limit(30);

  const subjectScores: Record<string, number[]> = {};
  for (const row of recentProgress) {
    const sid = row.subject.toLowerCase();
    if (!subjectScores[sid]) subjectScores[sid] = [];
    subjectScores[sid].push(row.score);
  }
  const avgBySubject: Record<string, number> = {};
  for (const [sid, scores] of Object.entries(subjectScores)) {
    avgBySubject[sid] = scores.reduce((s, v) => s + v, 0) / scores.length;
  }

  function subjectWeakness(subjectId: string): number {
    for (const [key, avg] of Object.entries(avgBySubject)) {
      if (subjectId.includes(key) || key.includes(subjectId.split("-")[0])) {
        return 100 - avg;
      }
    }
    return 30;
  }

  const xpMultiplier = xp >= 300 ? 1.3 : xp >= 100 ? 1.1 : 1.0;

  const scored = eligible.map(t => {
    const key = `${t.subjectId}:${t.topicId}`;
    const done = doneKeys.has(key);
    const started = startedKeys.has(key);
    const isWeak = weakTopicKeys.has(key);
    const weakness = subjectWeakness(t.subjectId);

    let score = weakness;
    if (!started) score += 20;
    if (done && !isWeak) score -= 100;
    /* Weak topics get a strong priority boost even if previously completed */
    if (isWeak) score += 80;

    /* Determine task type: weak topics always start with a lesson review */
    const weakEntry = isWeak ? weakTopics.find(w => w.subjectId === t.subjectId && w.topicId === t.topicId) : null;
    let taskType: "lesson" | "practice" = xp >= 50 ? "practice" : "lesson";
    if (weakEntry) {
      taskType = weakEntry.successRate < 50 ? "lesson" : "practice";
    }

    return { ...t, score, done, started, isWeakTopic: isWeak, taskType };
  });

  /* ── Smart task sequencing (Phase 2C+) ────────────────────────── */
  // Calculate overall success rate for today's difficulty adjustment
  const allScores = Object.values(subjectScores).flat();
  const overallSuccessRate = calculateSuccessRate(allScores);

  // Build task metadata for sequencing
  const notFullyDone = scored
    .filter(t => !t.done || t.isWeakTopic)
    .map(t => ({
      ...t,
      baseXp: t.baseXp,
      xpReward: Math.round(t.baseXp * xpMultiplier),
    })) as TaskWithMetadata[];

  // First pass: pick 3 candidate tasks (one per subject if possible)
  const candidates: typeof notFullyDone = [];
  const usedSubjects = new Set<string>();

  for (const t of notFullyDone.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))) {
    if (candidates.length >= 4) break; // Pick 4 to filter down to 3 after sequencing
    if (usedSubjects.has(t.subjectId)) continue;
    candidates.push(t);
    usedSubjects.add(t.subjectId);
  }

  if (candidates.length < 3) {
    for (const t of notFullyDone) {
      if (candidates.length >= 4) break;
      if (!candidates.find(p => p.subjectId === t.subjectId && p.topicId === t.topicId)) {
        candidates.push(t);
      }
    }
  }

  // Apply smart sequencing to reorder tasks intelligently
  const sequencingContext = {
    recentSuccessRate: overallSuccessRate,
    subjectSuccessRates: avgBySubject as Record<string, number>,
  };

  const sequenced = applySmartSequencing(candidates.slice(0, 4), sequencingContext);

  return sequenced.slice(0, 3).map((t, i) => ({
    id: `task_${i}`,
    subjectId: t.subjectId,
    topicId: t.topicId,
    taskType: t.taskType,
    xpReward: t.xpReward, // Already adjusted by smart sequencing
    status: "not_started" as DailyPlanTaskStatus,
    isWeakTopic: t.isWeakTopic,
  }));
}

/* ─────────────────────────────────────────────────────────────────
   GET /daily-plan?childId=:childId
   Return today's plan (generate if not yet created).
───────────────────────────────────────────────────────────────── */
router.get("/daily-plan", requireAuth, async (req, res): Promise<void> => {
  const childIdStr = req.query.childId as string;
  if (!childIdStr) {
    res.status(400).json({ error: "childId is required" });
    return;
  }
  const childId = parseInt(childIdStr, 10);
  if (isNaN(childId)) {
    res.status(400).json({ error: "Invalid childId" });
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

  const today = todayDate();
  const [existing] = await db
    .select()
    .from(dailyPlansTable)
    .where(and(eq(dailyPlansTable.childId, childId), eq(dailyPlansTable.planDate, today)));

  if (existing) {
    res.json(existing);
    return;
  }

  const tasks = await generatePlan(childId, child.grade, child.xp ?? 0);

  const [inserted] = await db
    .insert(dailyPlansTable)
    .values({ childId, planDate: today, tasks })
    .returning();

  res.json(inserted);
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /daily-plan/:planId/task/:taskId
   Update the status of a single task.
───────────────────────────────────────────────────────────────── */
router.patch("/daily-plan/:planId/task/:taskId", requireAuth, async (req, res): Promise<void> => {
  const planId = parseInt(req.params.planId as string, 10);
  const taskId = req.params.taskId as string;
  const { status } = req.body as { status: DailyPlanTaskStatus };

  if (!status || !["not_started", "in_progress", "completed"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [plan] = await db
    .select()
    .from(dailyPlansTable)
    .where(eq(dailyPlansTable.id, planId));

  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  const [child] = await db
    .select()
    .from(childrenTable)
    .where(and(eq(childrenTable.id, plan.childId), eq(childrenTable.familyId, familyId ?? -1)));
  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const updatedTasks = (plan.tasks as DailyPlanTask[]).map(t =>
    t.id === taskId ? { ...t, status } : t
  );

  const [updated] = await db
    .update(dailyPlansTable)
    .set({ tasks: updatedTasks, updatedAt: new Date() })
    .where(eq(dailyPlansTable.id, planId))
    .returning();

  res.json(updated);
});

export default router;
