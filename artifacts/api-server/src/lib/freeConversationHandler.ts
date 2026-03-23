/**
 * AYA Junior — Free Conversation Handler
 *
 * OpenAI-first routing for free conversation mode:
 *   1. Fetch limited history (last 4 messages) for minimal token cost
 *   2. Call OpenAI with a compact language-specific system prompt
 *   3. Parse the response for embedded [ACTION:math] / [ACTION:bulgarian] tags
 *   4. If an action tag is found → strip it and delegate to the internal handler
 *   5. Otherwise → return the AI reply directly
 *
 * Structured paths (homework, OCR, answer validation, analytics, missions)
 * are never touched here — they remain internal-first.
 */

import OpenAI from "openai";
import { db, chatMessagesTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import { handleJuniorChat } from "./juniorChatHandler";
import { getLang } from "./aiResponses";

type Lang = "bg" | "es" | "en";

interface FreeConvContext {
  childName?: string;
  grade?: number;
  language?: string;
  aiCharacter?: string;
  childXp?: number;
  country?: string;
}

function charName(lang: Lang, charKey: string): string {
  const map: Record<string, Record<Lang, string>> = {
    panda:  { bg: "AYA Панда",  es: "AYA Panda",   en: "AYA Panda"  },
    robot:  { bg: "AYA Робот",  es: "AYA Robot",   en: "AYA Robot"  },
    fox:    { bg: "AYA Лисица", es: "AYA Zorro",   en: "AYA Fox"    },
    owl:    { bg: "AYA Сова",   es: "AYA Búho",    en: "AYA Owl"    },
  };
  return map[charKey]?.[lang] ?? (lang === "bg" ? "AYA Сова" : "AYA Owl");
}

function buildSystemPrompt(lang: Lang, charKey: string, childName: string): string {
  const name = charName(lang, charKey);

  if (lang === "bg") {
    return (
      `Ти си ${name} – приятелски помощник на ${childName} (1–4 клас). ` +
      `Говори на чист съвременен български. Никога не използвай руски думи или руска граматика. ` +
      `Отговаряй топло и кратко (1–3 изречения). ` +
      `Ако детето поиска задача по математика, добави [ACTION:math] в края на отговора. ` +
      `Ако поиска урок по български език, добави [ACTION:bulgarian] в края.`
    );
  }

  if (lang === "es") {
    return (
      `Eres ${name}, asistente amigable de ${childName} (1.°–4.° grado). ` +
      `Responde en español, de forma cálida y breve (1–3 oraciones). ` +
      `Si pide una tarea de matemáticas, añade [ACTION:math] al final. ` +
      `Si pide una lección de lengua, añade [ACTION:bulgarian] al final.`
    );
  }

  return (
    `You are ${name}, a friendly companion for ${childName} (grades 1–4). ` +
    `Reply warmly and briefly (1–3 sentences). ` +
    `If they want a math task, append [ACTION:math] at the end. ` +
    `If they want a Bulgarian language lesson, append [ACTION:bulgarian] at the end.`
  );
}

export async function handleFreeConversationChat(
  userId: number,
  childId: number,
  module: string,
  message: string,
  context: FreeConvContext,
  openai: OpenAI,
): Promise<string> {
  const lang = getLang(context.language);
  const name = context.childName ?? (lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend");
  const charKey = context.aiCharacter ?? "owl";

  // ── Limited context: last 4 messages (cheap) ────────────────────────────
  const recentRows = await db
    .select({ role: chatMessagesTable.role, content: chatMessagesTable.content })
    .from(chatMessagesTable)
    .where(
      and(
        eq(chatMessagesTable.userId, userId),
        eq(chatMessagesTable.module, module),
        eq(chatMessagesTable.childId, childId),
      ),
    )
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(4);

  const history = recentRows
    .reverse()
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content.slice(0, 300),
    }));

  const systemPrompt = buildSystemPrompt(lang, charKey, name);

  // ── Single OpenAI call — compact, cost-optimised ─────────────────────────
  console.log(`[FREE_CONV_AI] Calling OpenAI | lang=${lang} char=${charKey} historyLen=${history.length}`);

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 300,
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ],
  });

  const rawReply = completion.choices[0]?.message?.content?.trim() ?? "";
  console.log(`[FREE_CONV_AI] Raw reply (${rawReply.length} chars): "${rawReply.slice(0, 120)}"`);

  // ── Action detection ─────────────────────────────────────────────────────
  const hasMath      = rawReply.includes("[ACTION:math]");
  const hasBulgarian = rawReply.includes("[ACTION:bulgarian]");

  if (hasMath || hasBulgarian) {
    const action = hasMath ? "math" : "bulgarian";
    const cleanReply = rawReply
      .replace(/\[ACTION:math\]/g, "")
      .replace(/\[ACTION:bulgarian\]/g, "")
      .trim();

    console.log(`[FREE_CONV_AI] Action detected: ${action} — delegating to internal handler`);

    const internalResult = await handleJuniorChat(userId, childId, module, message, context);

    return cleanReply ? `${cleanReply}\n\n${internalResult}` : internalResult;
  }

  // ── No action — return conversational reply directly ─────────────────────
  return rawReply;
}
