import { Router, type IRouter } from "express";
import { db, familyTasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateFamilyTaskBody, UpdateFamilyTaskBody, UpdateFamilyTaskParams, DeleteFamilyTaskParams } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/family-tasks", requireAuth, async (req, res): Promise<void> => {
  const { familyId } = getUser(req);
  if (!familyId) {
    res.json([]);
    return;
  }

  const tasks = await db
    .select()
    .from(familyTasksTable)
    .where(eq(familyTasksTable.familyId, familyId))
    .orderBy(familyTasksTable.createdAt);

  res.json(tasks);
});

router.post("/family-tasks", requireAuth, async (req, res): Promise<void> => {
  const { userId, familyId } = getUser(req);
  if (!familyId) {
    res.status(400).json({ error: "You must be in a family to create tasks" });
    return;
  }

  const parsed = CreateFamilyTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(familyTasksTable)
    .values({
      ...parsed.data,
      familyId,
      userId,
      completed: false,
      description: parsed.data.description ?? null,
      dueAt: parsed.data.dueAt ?? null,
      priority: parsed.data.priority ?? "medium",
      assignedTo: parsed.data.assignedTo ?? null,
    })
    .returning();

  res.status(201).json(task);
});

router.patch("/family-tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateFamilyTaskParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateFamilyTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { familyId } = getUser(req);
  const [existing] = await db.select().from(familyTasksTable)
    .where(and(eq(familyTasksTable.id, params.data.id), eq(familyTasksTable.familyId, familyId ?? -1)));
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== null && parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== null && parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.completed !== null && parsed.data.completed !== undefined) updateData.completed = parsed.data.completed;
  if (parsed.data.dueAt !== null && parsed.data.dueAt !== undefined) updateData.dueAt = parsed.data.dueAt;
  if (parsed.data.priority !== null && parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.assignedTo !== null && parsed.data.assignedTo !== undefined) updateData.assignedTo = parsed.data.assignedTo;

  const [task] = await db
    .update(familyTasksTable)
    .set(updateData)
    .where(and(eq(familyTasksTable.id, params.data.id), eq(familyTasksTable.familyId, familyId ?? -1)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

router.delete("/family-tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFamilyTaskParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { familyId } = getUser(req);
  const [existing] = await db.select().from(familyTasksTable)
    .where(and(eq(familyTasksTable.id, params.data.id), eq(familyTasksTable.familyId, familyId ?? -1)));
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await db.delete(familyTasksTable)
    .where(and(eq(familyTasksTable.id, params.data.id), eq(familyTasksTable.familyId, familyId ?? -1)));
  res.sendStatus(204);
});

export default router;
