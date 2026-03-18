import { Router, type IRouter } from "express";
import { db, progressTable, childrenTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateProgressBody } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/progress", requireAuth, async (req, res): Promise<void> => {
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

  const { familyId } = getUser(req);
  const [child] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId ?? -1)));
  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const entries = await db
    .select()
    .from(progressTable)
    .where(eq(progressTable.childId, childId))
    .orderBy(progressTable.createdAt);

  res.json(entries);
});

router.post("/progress", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { familyId } = getUser(req);
  const [child] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, parsed.data.childId), eq(childrenTable.familyId, familyId ?? -1)));
  if (!child) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [entry] = await db
    .insert(progressTable)
    .values({ ...parsed.data, notes: parsed.data.notes ?? null })
    .returning();

  res.status(201).json(entry);
});

export default router;
