import { Router, type IRouter } from "express";
import { db, childrenTable, missionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateChildBody, UpdateChildBody, GetChildParams, UpdateChildParams, DeleteChildParams } from "@workspace/api-zod";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";

const router: IRouter = Router();

const STARTER_MISSIONS = [
  { title: "Count to 20", description: "Practice counting from 1 to 20 out loud", subject: "Math", xpReward: 30, starReward: 1 },
  { title: "Read a short story", description: "Read a short story and tell AYA what it was about", subject: "Reading", xpReward: 40, starReward: 1 },
  { title: "Draw your family", description: "Draw a picture of your family and describe each person", subject: "Art", xpReward: 25, starReward: 1 },
  { title: "Name 5 animals", description: "Name 5 animals and tell one fact about each", subject: "Science", xpReward: 35, starReward: 1 },
  { title: "Learn your address", description: "Practice saying your home address", subject: "Life Skills", xpReward: 20, starReward: 1 },
  { title: "Identify shapes", description: "Find 3 circles, 3 squares, and 3 triangles around the house", subject: "Math", xpReward: 30, starReward: 1 },
];

router.get("/children", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  if (!familyId) {
    res.json([]);
    return;
  }
  const children = await db.select().from(childrenTable).where(eq(childrenTable.familyId, familyId));
  res.json(children);
});

router.post("/children", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  if (!familyId) {
    res.status(400).json({ error: "You must be in a family to add children" });
    return;
  }

  const parsed = CreateChildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const avatars = ["🦁", "🐼", "🦊", "🐨", "🐸", "🦋", "🐙", "🦄"];
  const avatar = parsed.data.avatar || avatars[Math.floor(Math.random() * avatars.length)];

  const [child] = await db
    .insert(childrenTable)
    .values({ ...parsed.data, familyId, avatar, xp: 0, stars: 0 })
    .returning();

  await db.insert(missionsTable).values(
    STARTER_MISSIONS.map(m => ({
      childId: child.id,
      title: m.title,
      description: m.description,
      subject: m.subject,
      xpReward: m.xpReward,
      starReward: m.starReward,
      completed: false,
    }))
  );

  res.status(201).json(child);
});

router.get("/children/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetChildParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  const [child] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, params.data.id), eq(childrenTable.familyId, familyId ?? -1)));

  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  res.json(child);
});

router.patch("/children/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateChildParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateChildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  const [existing] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, params.data.id), eq(childrenTable.familyId, familyId ?? -1)));
  if (!existing) {
    res.status(404).json({ error: "Child not found" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== null && parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.grade !== null && parsed.data.grade !== undefined) updateData.grade = parsed.data.grade;
  if (parsed.data.language !== null && parsed.data.language !== undefined) updateData.language = parsed.data.language;
  if (parsed.data.country !== null && parsed.data.country !== undefined) updateData.country = parsed.data.country;
  if (parsed.data.avatar !== null && parsed.data.avatar !== undefined) updateData.avatar = parsed.data.avatar;
  if (parsed.data.xp !== null && parsed.data.xp !== undefined) updateData.xp = parsed.data.xp;
  if (parsed.data.stars !== null && parsed.data.stars !== undefined) updateData.stars = parsed.data.stars;

  const [child] = await db
    .update(childrenTable)
    .set(updateData)
    .where(and(eq(childrenTable.id, params.data.id), eq(childrenTable.familyId, familyId ?? -1)))
    .returning();

  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  res.json(child);
});

router.delete("/children/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteChildParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  const [existing] = await db.select().from(childrenTable)
    .where(and(eq(childrenTable.id, params.data.id), eq(childrenTable.familyId, familyId ?? -1)));
  if (!existing) {
    res.status(404).json({ error: "Child not found" });
    return;
  }

  await db.delete(childrenTable)
    .where(and(eq(childrenTable.id, params.data.id), eq(childrenTable.familyId, familyId ?? -1)));
  res.sendStatus(204);
});

export default router;
