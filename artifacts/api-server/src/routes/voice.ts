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

// TTS client resolution:
// 1. If a real OPENAI_API_KEY is set, use it directly with api.openai.com.
// 2. Otherwise fall back to the Replit AI integration proxy (same as getOpenAI()).
//    The AI_INTEGRATIONS_OPENAI_API_KEY is a proxy-only placeholder key that is
//    rejected by api.openai.com with "Incorrect API key" (HTTP 401 from OpenAI,
//    not from our auth middleware). Always route through the proxy in published mode.
function getOpenAIForTTS(): OpenAI {
  const directKey = process.env.OPENAI_API_KEY;
  if (directKey) {
    return new OpenAI({ apiKey: directKey }); // real key → api.openai.com
  }
  // Fall back to the Replit AI integration proxy (works in both preview and published)
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "sk-placeholder";
  if (!baseURL) throw new Error("No OpenAI API key or proxy URL configured for TTS");
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

  // Enhanced Bulgarian transcription hint for children's speech stability
  const bgTranscriptionHint = resolvedLang === "bg"
    ? "Разпознавай точно детска българска реч. Важни думи и фрази: " +
      "числа (нула, едно, две, три, четири, пет, шест, седем, осем, девет, десет, единадесет, дванадесет, петнадесет, двадесет), " +
      "математика (плюс, минус, по, делено, разделено на, умножено, събери, извади, колко е), " +
      "урок (задача, упражнение, помощ, обясни, не разбирам, помогни ми, дай ми), " +
      "активности (да четем, четем заедно, упражнявай, хайде да си играем, да учим, нека учим, задай ми въпрос, логически, английски), " +
      "основни фрази (как се казваш, какво можеш, разкажи ми, привет, здравей), " +
      "приказки и истории (лошия, лошият, вълк, червената, шапчица, червената шапчица, баба, ловец, гора, приказка, герой, героиня, принцеса, принц, дракон, фея, магия, замък, зайче, мечка, лисица, коте, кученце, игра, играем, песничка, книжка, рисуване, цвете, слънце, облак, дъжд, мама, татко, приятел, приятелка), " +
      "деятелности (хайде, давай, спасявам, бяга, скачам, скрия, карам, летя, пея)."
    : undefined;

  console.log("[VOICE_MODEL]", "gpt-4o-mini-transcribe");
  console.log("[VOICE_LANG]", resolvedLang);
  if (bgTranscriptionHint) {
    console.log("[VOICE_PROMPT_HINT]", "Bulgarian children's speech context enabled");
  }

  const transcription = await openai.audio.transcriptions.create({
    model: "gpt-4o-mini-transcribe",
    file,
    language: resolvedLang,
    response_format: "json",
    ...(bgTranscriptionHint ? { prompt: bgTranscriptionHint } : {}),
  });

  let text = transcription.text ?? "";
  console.log("[VOICE_TEXT_RAW]", text);

  // Bulgarian normalization: collapse spaces, preserve Cyrillic, normalize punctuation
  if (resolvedLang === "bg") {
    console.log("[VOICE_BG_CORRECTION_ACTIVE]", true);
    
    text = text
      .replace(/\s+/g, " ")  // Collapse multiple spaces
      .trim();
    
    // Light confidence check: if text has mixed Latin/Cyrillic noise patterns, try to identify Bulgarian words
    const cyrillic = (text.match(/[а-яА-ЯёЁ]/g) || []).length;
    const latin = (text.match(/[a-zA-Z]/g) || []).length;
    
    console.log("[VOICE_BG_CONFIDENCE_HINT]", { cyrillic, latin, ratio: latin > 0 ? (cyrillic / (cyrillic + latin) * 100).toFixed(1) : "100" });
    
    // Bulgarian story/children's words vocabulary hints for correction
    const bgWordHints = [
      "лошия", "лошият", "вълк", "червената", "шапчица", "червената шапчица",
      "баба", "ловец", "гора", "приказка", "герой", "героиня", 
      "принцеса", "принц", "дракон", "фея", "магия", "замък",
      "зайче", "мечка", "лисица", "коте", "кученце",
      "игра", "играем", "песничка", "книжка", "рисуване",
      "цвете", "слънце", "облак", "дъжд", "мама", "татко",
      "приятел", "приятелка", "спасявам", "бяга", "помощ",
      "хайде", "давай", "скачам", "скрия", "карам", "летя", "пея"
    ];
    console.log("[VOICE_BG_STORY_HINTS]", bgWordHints.length + " words enabled");
    
    // Common transcription correction rules for Bulgarian children's speech
    const corrections: Record<string, string> = {
      // Bad wolf variations
      "моше вълк": "лошия вълк",
      "моше": "лошия",
      "моше вълка": "лошия вълк",
      "моше вулк": "лошия вълк",
      "лусия вълк": "лошия вълк",
      "лусия": "лошия",
      
      // Wolf variations
      "вулк": "вълк",
      "вулка": "вълка",
      
      // Little Red Riding Hood
      "шапцица": "шапчица",
      "шапцата": "шапчицата",
      "червената шапцица": "червената шапчица",
      "червена шапцица": "червената шапчица",
      
      // Save/rescue variations
      "спасавам": "спасявам",
      "спасава": "спасява",
      "спасаем": "спасяваме",
      "спасен": "спасен",
      "спасена": "спасена",
      
      // Common story words misheard
      "принцес": "принцеса",
      "дракон": "дракон",  // Keep correct
      "фея": "фея",  // Keep correct
      "замък": "замък",  // Keep correct
    };
    
    let correctedText = text;
    let correctionsMade = 0;
    
    // Apply corrections (case-insensitive match, preserve original case)
    for (const [wrong, right] of Object.entries(corrections)) {
      const regex = new RegExp(`\\b${wrong}\\b`, "gi");
      if (regex.test(correctedText)) {
        correctedText = correctedText.replace(regex, (match) => {
          // Preserve case from original match
          if (match === wrong) return right;
          if (match === wrong.charAt(0).toUpperCase() + wrong.slice(1)) {
            return right.charAt(0).toUpperCase() + right.slice(1);
          }
          if (match === wrong.toUpperCase()) return right.toUpperCase();
          return right;
        });
        correctionsMade++;
      }
    }
    
    if (correctionsMade > 0) {
      console.log("[VOICE_BG_CORRECTED_TEXT]", correctedText);
      text = correctedText;
    } else {
      console.log("[VOICE_BG_NO_CORRECTION]", "text is already correct");
    }
    
    console.log("[VOICE_TEXT_NORMALIZED]", text);
  }

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

  let ttsClient: OpenAI;
  try {
    ttsClient = getOpenAIForTTS();
  } catch {
    res.status(500).json({ error: "TTS service not configured" });
    return;
  }

  const resolvedLang = langToLocale(lang ?? "en");

  const voice =
    resolvedLang === "bg" ? "nova" :
    resolvedLang === "es" ? "nova" :
    "nova";

  console.log("[TTS] SDK_PATH_ACTIVE");

  let speechResponse: Awaited<ReturnType<typeof ttsClient.audio.speech.create>>;
  try {
    speechResponse = await ttsClient.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text.slice(0, 4000),
      response_format: "mp3",
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const message = (err as Error)?.message ?? "TTS failed";
    console.error("[TTS_ERROR]", { status, message });
    if (status === 429) {
      res.status(429).json({ error: "TTS quota exceeded" });
    } else {
      // Return 503 (service error) regardless of what OpenAI returned.
      // This prevents OpenAI's own 401 (bad API key) from being misread
      // by the client as a user-auth failure.
      res.status(503).json({ error: "TTS service unavailable" });
    }
    return;
  }

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
