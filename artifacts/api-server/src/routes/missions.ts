import { Router, type IRouter } from "express";
import { db, missionsTable, childrenTable, progressTable, missionTasksTable, type BadgeRecord } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CompleteMissionParams, CompleteMissionBody } from "@workspace/api-zod";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";
import { evaluateBadges, type BadgeStats } from "../lib/badges";
import { 
  generateMissionTasks, 
  MISSIONS, 
  checkAnswer,
  getCorrectAnswerResponseBg,
  getCorrectAnswerResponseEn,
  getCorrectAnswerResponseEs,
  getIncorrectAnswerResponseBg,
  getIncorrectAnswerResponseEn,
  getIncorrectAnswerResponseEs,
  getMissionCompleteMessageBg,
  getMissionCompleteMessageEn,
  getMissionCompleteMessageEs,
  type MathTask,
} from "../lib/mathTaskGenerator";

const router: IRouter = Router();

router.get("/missions", requireAuth, async (req, res): Promise<void> => {
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
  const [child] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId ?? -1)));
  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const missions = await db
    .select()
    .from(missionsTable)
    .where(eq(missionsTable.childId, childId))
    .orderBy(missionsTable.createdAt);

  // SURGICAL DEBUG: Trace actual missions returned for BG Grade 2
  console.log(`[TRACE] Fetching missions for childId=${childId}`);
  console.log(`[TRACE] Child profile: country=${child.country}, grade=${child.grade}`);
  console.log(`[TRACE] Total missions in database: ${missions.length}`);
  
  const mathIslandMissions = missions.filter(m => m.zone === "Math Island");
  console.log(`[TRACE] Math Island missions (all): ${mathIslandMissions.map(m => m.title).join(", ")}`);
  
  const bgG2MathMissions = missions.filter(m => m.zone === "Math Island" && m.subject === "Математика");
  console.log(`[TRACE] BG Grade 2 Math Island (subject=Математика): ${bgG2MathMissions.map(m => m.title).join(", ")}`);
  
  // Final output for verification
  if (child.country === "BG" && child.grade === 2) {
    console.log(`[MATH_ISLAND_FINAL_BG_G2] mission titles: ${bgG2MathMissions.map(m => m.title).join(", ")}`);
  }

  res.json(missions);
});

router.post("/missions/:id/complete", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteMissionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, params.data.id));
  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  if (mission.completed) {
    res.status(409).json({ error: "Mission already completed" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  const [child] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, mission.childId), eq(childrenTable.familyId, familyId ?? -1)));
  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [updated] = await db
    .update(missionsTable)
    .set({ completed: true, completedAt: new Date() })
    .where(and(eq(missionsTable.id, params.data.id), eq(missionsTable.completed, false)))
    .returning();

  const newXp = (child.xp || 0) + mission.xpReward;
  const newStars = (child.stars || 0) + mission.starReward;

  await db
    .update(childrenTable)
    .set({ xp: newXp, stars: newStars })
    .where(eq(childrenTable.id, mission.childId));

  const completionMeta = CompleteMissionBody.safeParse(req.body ?? {});
  const meta = completionMeta.success ? completionMeta.data : {};

  let completionScore = mission.difficulty === "easy" ? 70 : mission.difficulty === "hard" ? 90 : 80;
  if (meta.correct === false) completionScore = Math.max(completionScore - 15, 40);
  else if (meta.correct === true) completionScore = Math.min(completionScore + 10, 100);
  if (meta.selfRating === 3) completionScore = Math.max(completionScore - 5, 40);
  else if (meta.selfRating === 1) completionScore = Math.min(completionScore + 5, 100);

  const notesParts: string[] = [`Completed: ${mission.title} (${mission.difficulty ?? "easy"} difficulty)`];
  if (meta.responseTimeMs != null) notesParts.push(`response_time=${meta.responseTimeMs}ms`);
  if (meta.correct != null) notesParts.push(`correct=${meta.correct}`);
  if (meta.selfRating != null) notesParts.push(`self_rating=${meta.selfRating}/3`);

  await db.insert(progressTable).values({
    childId: mission.childId,
    subject: mission.subject,
    score: completionScore,
    module: "junior",
    notes: notesParts.join("; "),
  });

  const recentProgress = await db
    .select()
    .from(progressTable)
    .where(eq(progressTable.childId, mission.childId))
    .orderBy(desc(progressTable.createdAt))
    .limit(5);

  const avgScore = recentProgress.length > 0
    ? recentProgress.reduce((sum, p) => sum + p.score, 0) / recentProgress.length
    : 70;

  let nextDifficulty: "easy" | "medium" | "hard" = "easy";
  if (avgScore >= 85) nextDifficulty = "hard";
  else if (avgScore >= 65) nextDifficulty = "medium";
  else nextDifficulty = "easy";

  const pendingMissions = await db
    .select()
    .from(missionsTable)
    .where(and(eq(missionsTable.childId, mission.childId), eq(missionsTable.completed, false)))
    .limit(1);

  if (pendingMissions.length > 0) {
    await db
      .update(missionsTable)
      .set({ difficulty: nextDifficulty })
      .where(eq(missionsTable.id, pendingMissions[0].id));
  }

  const allMissions = await db
    .select()
    .from(missionsTable)
    .where(and(eq(missionsTable.childId, mission.childId), eq(missionsTable.completed, true)));

  const completedBySubject: Record<string, number> = {};
  const completedByZone: Record<string, number> = {};

  for (const m of allMissions) {
    completedBySubject[m.subject] = (completedBySubject[m.subject] ?? 0) + 1;
    if (m.zone) completedByZone[m.zone] = (completedByZone[m.zone] ?? 0) + 1;
  }

  const stats: BadgeStats = {
    totalCompleted: allMissions.length,
    completedBySubject,
    completedByZone,
    totalXp: newXp,
  };

  const existingBadges = (child.badgesEarned as BadgeRecord[] | null) ?? [];
  const newBadges = evaluateBadges(stats, existingBadges);

  if (newBadges.length > 0) {
    await db
      .update(childrenTable)
      .set({ badgesEarned: [...existingBadges, ...newBadges] })
      .where(eq(childrenTable.id, mission.childId));
  }

  res.json({ ...updated, newBadges });
});

/**
 * POST /missions/start
 * Start a new mission and generate initial tasks
 */
router.post("/missions/start", requireAuth, async (req, res): Promise<void> => {
  const { childId, missionId } = req.body as { childId?: number; missionId?: string };
  
  if (!childId || !missionId) {
    res.status(400).json({ error: "childId and missionId are required" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  const [child] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId ?? -1)));
  
  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const mission = MISSIONS[missionId];
  if (!mission) {
    res.status(400).json({ error: `Mission ${missionId} not found` });
    return;
  }

  // Generate initial tasks for the mission
  const tasks = generateMissionTasks(missionId, mission.taskCount);

  // Set correct XP reward based on mission type
  const xpRewardMap: Record<string, number> = {
    m1: 30, // Събиране до 10
    m2: 30, // Изваждане до 10
    m3: 40, // Събиране до 20
    m4: 30, // Умножение в таблицата
  };
  const xpReward = xpRewardMap[missionId] || 30;

  // Insert mission into database
  const [dbMission] = await db.insert(missionsTable)
    .values({
      childId,
      title: mission.titleBg, // Default to Bulgarian
      description: `Complete ${mission.taskCount} tasks to earn ${xpReward} XP`,
      subject: "math",
      zone: "math_island",
      difficulty: "easy",
      xpReward,
      starReward: 1,
    })
    .returning();

  // Insert first task
  if (tasks.length > 0) {
    const firstTask = tasks[0];
    await db.insert(missionTasksTable).values({
      missionId: dbMission.id,
      taskId: firstTask.id,
      expression: firstTask.expression,
      answer: firstTask.answer,
      type: firstTask.type as any,
      difficulty: firstTask.difficulty,
      number1: firstTask.number1,
      number2: firstTask.number2,
      operator: firstTask.operator,
    });
  }

  res.json({
    mission: dbMission,
    currentTask: tasks[0] || null,
    completedCount: 0,
    requiredCount: mission.taskCount,
  });
});

/**
 * POST /missions/tasks/:taskId/answer
 * Answer a mission task
 */
router.post("/missions/tasks/:taskId/answer", requireAuth, async (req, res): Promise<void> => {
  const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
  const { userAnswer, childLang } = req.body as { userAnswer?: number; childLang?: string };

  if (userAnswer === undefined) {
    res.status(400).json({ error: "userAnswer is required" });
    return;
  }

  const { userId } = getUser(req);
  
  // Get the task
  const [task] = await db.select().from(missionTasksTable)
    .where(eq(missionTasksTable.id, parseInt(taskId, 10)));

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  // Verify permission (task belongs to child associated with user)
  const [mission] = await db.select().from(missionsTable)
    .where(eq(missionsTable.id, task.missionId));

  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  const familyId = await getFamilyIdFromDb(userId);
  const [child] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, mission.childId), eq(childrenTable.familyId, familyId ?? -1)));

  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  try {
    // Check answer
    const isCorrect = checkAnswer({ answer: task.answer } as MathTask, userAnswer);
    const lang = (childLang?.toLowerCase() === "bg" ? "bg" : childLang?.toLowerCase() === "es" ? "es" : "en") as "bg" | "es" | "en";

    // Debug logging for word problems
    console.log(`[WORD_PROBLEM] text: "${task.expression}"`);
    console.log(`[WORD_PROBLEM] expectedAnswer: ${task.answer} (type: ${typeof task.answer})`);
    console.log(`[WORD_PROBLEM] submittedAnswer: ${userAnswer} (type: ${typeof userAnswer})`);
    console.log(`[WORD_PROBLEM] normalizedExpected: ${Number(task.answer)}`);
    console.log(`[WORD_PROBLEM] normalizedSubmitted: ${Number(userAnswer)}`);
    console.log(`[WORD_PROBLEM] isCorrect: ${isCorrect}`);

    // Get response message
    let responseMessage = "";
    if (isCorrect) {
      if (lang === "bg") responseMessage = getCorrectAnswerResponseBg({ expression: task.expression, answer: task.answer } as MathTask);
      else if (lang === "es") responseMessage = getCorrectAnswerResponseEs({ expression: task.expression, answer: task.answer } as MathTask);
      else responseMessage = getCorrectAnswerResponseEn({ expression: task.expression, answer: task.answer } as MathTask);
    } else {
      if (lang === "bg") responseMessage = getIncorrectAnswerResponseBg();
      else if (lang === "es") responseMessage = getIncorrectAnswerResponseEs();
      else responseMessage = getIncorrectAnswerResponseEn();
    }

    // Update task with answer
    await db.update(missionTasksTable)
      .set({
        answered: true,
        correct: isCorrect,
        userAnswer,
        answeredAt: new Date(),
      })
      .where(eq(missionTasksTable.id, task.id));

    // Award XP for correct answer
    if (isCorrect) {
      const newXp = (child.xp || 0) + 5;
      await db.update(childrenTable)
        .set({ xp: newXp })
        .where(eq(childrenTable.id, child.id));
    }

    // Check if mission is complete
    const completedTasks = await db.select().from(missionTasksTable)
      .where(and(
        eq(missionTasksTable.missionId, mission.id),
        eq(missionTasksTable.correct, true)
      ));

    let isMissionComplete = false;
    let nextTask = null;

    if (isCorrect) {
      // Get the task count for this mission from MISSIONS
      const missionDef = MISSIONS[mission.missionId] || MISSIONS["m1"];
      const requiredTaskCount = missionDef?.taskCount || 5;
      
      if (completedTasks.length >= requiredTaskCount) {
        isMissionComplete = true;
        
        // Mark mission as complete
        await db.update(missionsTable)
          .set({ completed: true, completedAt: new Date() })
          .where(eq(missionsTable.id, mission.id));

        // Award final XP and stars (mission xpReward was set during mission start)
        const bonusXp = mission.xpReward || 30;
        const finalXp = (child.xp || 0) + bonusXp;
        const finalStars = (child.stars || 0) + 1;
        await db.update(childrenTable)
          .set({ xp: finalXp, stars: finalStars })
          .where(eq(childrenTable.id, child.id));

        // Get completion message
        let completionMessage = "";
        if (lang === "bg") completionMessage = getMissionCompleteMessageBg(mission.title);
        else if (lang === "es") completionMessage = getMissionCompleteMessageEs(mission.title);
        else completionMessage = getMissionCompleteMessageEn(mission.title);

        responseMessage += `\n\n${completionMessage}`;
      } else {
        // Generate next task using the same mission definition
        const generatedTask = missionDef.generate();
        
        const [insertedTask] = await db.insert(missionTasksTable)
          .values({
            missionId: mission.id,
            taskId: generatedTask.id,
            expression: generatedTask.expression,
            answer: generatedTask.answer,
            type: generatedTask.type as any,
            difficulty: generatedTask.difficulty,
            number1: generatedTask.number1,
            number2: generatedTask.number2,
            operator: generatedTask.operator,
          })
          .returning();

        nextTask = {
          id: insertedTask.id,
          expression: generatedTask.expression,
          answer: generatedTask.answer,
        };
      }
    }

    res.json({
      correct: isCorrect,
      responseMessage,
      isMissionComplete,
      completedCount: completedTasks.length,
      nextTask,
      updatedXp: (child.xp || 0) + (isCorrect ? 5 : 0),
    });
  } catch (error) {
    console.error(`[ANSWER_ERROR] Error processing answer:`, error);
    res.status(500).json({ error: "Failed to process answer", details: String(error) });
  }
});

export default router;
