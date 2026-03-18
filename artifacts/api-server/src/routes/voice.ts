import { Router, type IRouter } from "express";
import { db, childrenTable, progressTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";
import OpenAI from "openai";
import { Readable } from "stream";

const router: IRouter = Router();

function getOpenAI() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "sk-placeholder";
  if (!baseURL) throw new Error("AI_INTEGRATIONS_OPENAI_BASE_URL is not set");
  return new OpenAI({ baseURL, apiKey });
}

function langToLocale(lang: string): string {
  if (lang === "bg" || lang.toLowerCase().includes("bulgar")) return "bg";
  if (lang === "es" || lang.toLowerCase().includes("spanish")) return "es";
  return "en";
}

function estimateDurationSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 2.5));
}

/* ─────────────────────────────────────────────────────────────────
   POST /api/voice/transcribe
   Body: { audio: base64, mimeType: string, lang?: string, childId?: number }
   Returns: { text: string }
───────────────────────────────────────────────────────────────── */
router.post("/voice/transcribe", requireAuth, async (req, res): Promise<void> => {
  const { audio, mimeType, lang, childId } = req.body as {
    audio?: string;
    mimeType?: string;
    lang?: string;
    childId?: number;
  };

  if (!audio) {
    res.status(400).json({ error: "audio (base64) is required" });
    return;
  }

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    res.status(500).json({ error: "AI service not configured" });
    return;
  }

  const resolvedLang = langToLocale(lang ?? "en");
  const audioBuffer = Buffer.from(audio, "base64");
  const ext = (mimeType ?? "audio/webm").includes("webm") ? "webm"
    : (mimeType ?? "").includes("mp4") ? "mp4"
    : (mimeType ?? "").includes("wav") ? "wav"
    : "webm";

  const file = new File([audioBuffer], `recording.${ext}`, { type: mimeType ?? "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    model: "gpt-4o-mini-transcribe",
    file,
    language: resolvedLang,
    response_format: "json",
  });

  const text = transcription.text ?? "";

  if (childId && text.trim()) {
    const { userId } = getUser(req);
    const familyId = await getFamilyIdFromDb(userId);
    if (familyId) {
      await db.insert(progressTable).values({
        childId,
        module: "voice",
        subject: "session",
        score: 1,
        notes: `stt:${new Date().toISOString()}`,
      }).catch(() => {});
    }
  }

  res.json({ text });
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/voice/speak
   Body: { text: string, lang?: string, childId?: number }
   Returns: audio/mpeg binary
───────────────────────────────────────────────────────────────── */
router.post("/voice/speak", requireAuth, async (req, res): Promise<void> => {
  const { text, lang, childId } = req.body as {
    text?: string;
    lang?: string;
    childId?: number;
  };

  if (!text || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    res.status(500).json({ error: "AI service not configured" });
    return;
  }

  const resolvedLang = langToLocale(lang ?? "en");

  const voice =
    resolvedLang === "bg" ? "nova" :
    resolvedLang === "es" ? "nova" :
    "nova";

  const speechResponse = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text.slice(0, 4000),
    speed: 0.9,
    response_format: "mp3",
  });

  const arrayBuffer = await speechResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (childId) {
    const durationSecs = estimateDurationSeconds(text);
    db.insert(progressTable).values({
      childId,
      module: "voice",
      subject: "tts",
      score: durationSecs,
      notes: `tts:${new Date().toISOString()}`,
    }).catch(() => {});
  }

  res.set({
    "Content-Type": "audio/mpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "no-cache",
  });
  res.send(buffer);
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/voice/stats?childId=
   Returns: { sessionsToday: number, minutesListened: number }
───────────────────────────────────────────────────────────────── */
router.get("/voice/stats", requireAuth, async (req, res): Promise<void> => {
  const childId = parseInt(req.query.childId as string, 10);
  if (isNaN(childId)) {
    res.status(400).json({ error: "childId required" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);
  if (!familyId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sessions = await db
    .select({ id: progressTable.id })
    .from(progressTable)
    .where(
      and(
        eq(progressTable.childId, childId),
        eq(progressTable.module, "voice"),
        eq(progressTable.subject, "session"),
        gte(progressTable.createdAt, startOfDay),
      )
    );

  const ttsRows = await db
    .select({ score: progressTable.score })
    .from(progressTable)
    .where(
      and(
        eq(progressTable.childId, childId),
        eq(progressTable.module, "voice"),
        eq(progressTable.subject, "tts"),
        gte(progressTable.createdAt, startOfDay),
      )
    );

  const totalSeconds = ttsRows.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const minutesListened = Math.round(totalSeconds / 60 * 10) / 10;

  res.json({ sessionsToday: sessions.length, minutesListened });
});

export default router;
