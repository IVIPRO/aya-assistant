import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express" {
  interface Request {
    authUser?: AuthPayload;
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    email?: string;
    role?: string;
    familyId?: number | null;
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

export function setSession(req: Request, payload: AuthPayload): void {
  req.session.userId = payload.userId;
  req.session.email = payload.email;
  req.session.role = payload.role;
  req.session.familyId = payload.familyId;
}

export function clearSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionUserId = req.session.userId;
  const isVoiceSpeak = req.path === "/voice/speak";

  if (isVoiceSpeak) {
    console.log("[VOICE_SPEAK_AUTH_CHECK]", {
      hasSession: !!sessionUserId,
      sessionUserId,
      hasAuthHeader: !!req.headers.authorization,
      authHeaderPrefix: req.headers.authorization?.slice(0, 20),
    });
  }

  if (sessionUserId) {
    // Session-cookie path (set at login time via setSession)
    console.log("[AUTH] session OK", { userId: sessionUserId, path: req.path });
    req.authUser = {
      userId: sessionUserId,
      email: req.session.email ?? "",
      role: req.session.role ?? "parent",
      familyId: req.session.familyId ?? null,
    };
    next();
    return;
  }

  // No session — fall back to JWT Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[AUTH] 401 — no session and no Bearer header", {
      path: req.path,
      hasAuthHeader: !!authHeader,
      headerPrefix: authHeader ? authHeader.slice(0, 10) : "(none)",
    });
    if (isVoiceSpeak) {
      console.log("[VOICE_SPEAK_401_REASON]", "no session and no valid Bearer header");
    }
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    console.warn("[AUTH] 401 — Bearer token invalid or expired", {
      path: req.path,
      tokenPrefix: token.slice(0, 12),
    });
    if (isVoiceSpeak) {
      console.log("[VOICE_SPEAK_401_REASON]", "Bearer token invalid or expired");
    }
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  console.log("[AUTH] JWT OK", { userId: payload.userId, path: req.path });
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
