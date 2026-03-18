import { Router, type IRouter } from "express";
import { db, familiesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateFamilyBody } from "@workspace/api-zod";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";

const router: IRouter = Router();

router.get("/families", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  if (!familyId) {
    res.status(404).json({ error: "No family found" });
    return;
  }

  const [family] = await db.select().from(familiesTable).where(eq(familiesTable.id, familyId));
  if (!family) {
    res.status(404).json({ error: "Family not found" });
    return;
  }
  res.json(family);
});

router.post("/families", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const parsed = CreateFamilyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [family] = await db
    .insert(familiesTable)
    .values({ ...parsed.data, ownerId: userId })
    .returning();

  await db.update(usersTable).set({ familyId: family.id }).where(eq(usersTable.id, userId));

  res.status(201).json(family);
});

export default router;
