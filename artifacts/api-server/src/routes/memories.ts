import { Router, type IRouter } from "express";
import { db, memoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateMemoryBody } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/memories", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const childIdStr = req.query.childId as string | undefined;

  const memories = await db
    .select()
    .from(memoriesTable)
    .where(eq(memoriesTable.userId, userId))
    .orderBy(memoriesTable.createdAt);

  res.json(memories);
});

router.post("/memories", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const parsed = CreateMemoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [memory] = await db
    .insert(memoriesTable)
    .values({ userId, ...parsed.data, childId: parsed.data.childId ?? null, module: parsed.data.module ?? null })
    .returning();

  res.status(201).json(memory);
});

export default router;
