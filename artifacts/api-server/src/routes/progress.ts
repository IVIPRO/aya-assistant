import { Router, type IRouter } from "express";
import { db, progressTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateProgressBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/progress", requireAuth, async (req, res): Promise<void> => {
  const childIdStr = req.query.childId as string;
  if (!childIdStr) {
    res.status(400).json({ error: "childId is required" });
    return;
  }
  const childId = parseInt(childIdStr, 10);

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

  const [entry] = await db
    .insert(progressTable)
    .values({ ...parsed.data, notes: parsed.data.notes ?? null })
    .returning();

  res.status(201).json(entry);
});

export default router;
