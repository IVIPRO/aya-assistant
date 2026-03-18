import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express" {
  interface Request {
    authUser?: AuthPayload;
  }
}

const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET: string = _jwtSecret;

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
  familyId: number | null;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.authUser = payload;
  next();
}

export function getUser(req: Request): AuthPayload {
  if (!req.authUser) {
    throw new Error("requireAuth middleware must be called before getUser");
  }
  return req.authUser;
}

export async function getFamilyIdFromDb(userId: number): Promise<number | null> {
  const [user] = await db.select({ familyId: usersTable.familyId }).from(usersTable).where(eq(usersTable.id, userId));
  return user?.familyId ?? null;
}
