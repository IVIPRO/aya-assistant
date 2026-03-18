import { Router, type IRouter } from "express";
import { db, calendarEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCalendarEventBody, DeleteCalendarEventParams } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/calendar", requireAuth, async (req, res): Promise<void> => {
  const { familyId } = getUser(req);
  if (!familyId) {
    res.json([]);
    return;
  }

  const events = await db
    .select()
    .from(calendarEventsTable)
    .where(eq(calendarEventsTable.familyId, familyId))
    .orderBy(calendarEventsTable.startAt);

  res.json(events);
});

router.post("/calendar", requireAuth, async (req, res): Promise<void> => {
  const { userId, familyId } = getUser(req);
  if (!familyId) {
    res.status(400).json({ error: "You must be in a family to create events" });
    return;
  }

  const parsed = CreateCalendarEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db
    .insert(calendarEventsTable)
    .values({
      ...parsed.data,
      familyId,
      userId,
      description: parsed.data.description ?? null,
      endAt: parsed.data.endAt ?? null,
      color: parsed.data.color ?? null,
    })
    .returning();

  res.status(201).json(event);
});

router.delete("/calendar/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCalendarEventParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(calendarEventsTable).where(eq(calendarEventsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
