import { Router, type IRouter } from "express";
import bcryptjs from "bcryptjs";
import { db, usersTable, familiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcryptjs.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name, role: role ?? "parent", familyId: null })
    .returning();

  const token = signToken({ userId: user.id, email: user.email, role: user.role, familyId: user.familyId });
  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, familyId: user.familyId, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcryptjs.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const freshUser = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  const u = freshUser[0];

  const token = signToken({ userId: u.id, email: u.email, role: u.role, familyId: u.familyId });
  res.json({
    user: { id: u.id, email: u.email, name: u.name, role: u.role, familyId: u.familyId, createdAt: u.createdAt },
    token,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, familyId: user.familyId, createdAt: user.createdAt });
});

export default router;
