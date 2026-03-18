import { Router, type IRouter } from "express";
import { db, missionsTable, childrenTable, progressTable, type BadgeRecord } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CompleteMissionParams, CompleteMissionBody } from "@workspace/api-zod";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";
import { evaluateBadges, type BadgeStats } from "../lib/badges";

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

export default router;
