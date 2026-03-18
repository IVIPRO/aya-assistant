import { Router, type IRouter } from "express";
import { db, missionsTable, childrenTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CompleteMissionParams } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/missions", requireAuth, async (req, res): Promise<void> => {
  const childIdStr = req.query.childId as string;
  if (!childIdStr) {
    res.status(400).json({ error: "childId is required" });
    return;
  }
  const childId = parseInt(childIdStr, 10);

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

  const [updated] = await db
    .update(missionsTable)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(missionsTable.id, params.data.id))
    .returning();

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, mission.childId));
  if (child) {
    await db
      .update(childrenTable)
      .set({
        xp: (child.xp || 0) + mission.xpReward,
        stars: (child.stars || 0) + mission.starReward,
      })
      .where(eq(childrenTable.id, mission.childId));
  }

  res.json(updated);
});

export default router;
