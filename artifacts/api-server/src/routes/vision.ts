import { Router, type IRouter } from "express";
import { db, childrenTable, progressTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";
import { requireAuth, getUser, getFamilyIdFromDb } from "../lib/auth";
import OpenAI from "openai";

const router: IRouter = Router();

function getOpenAIClient() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "sk-placeholder";
  if (!baseURL) throw new Error("AI_INTEGRATIONS_OPENAI_BASE_URL is not set");
  return new OpenAI({ baseURL, apiKey });
}

function buildHomeworkSystemPrompt(
  lang: string,
  grade: number,
  childName: string,
  charKey: string,
): string {
  const charName =
    charKey === "panda" ? (lang === "bg" ? "AYA Панда" : "AYA Panda")
    : charKey === "robot" ? (lang === "bg" ? "AYA Робот" : "AYA Robot")
    : charKey === "fox" ? (lang === "bg" ? "AYA Лисица" : "AYA Fox")
    : (lang === "bg" ? "AYA Сова" : "AYA Owl");

  const gradeLabel =
    lang === "bg" ? `${grade} клас`
    : `Grade ${grade}`;

  if (lang === "bg") {
    return `Ти си ${charName}, AI учебен асистент за деца от ${gradeLabel}. Помагаш на ${childName}.

ПРАВИЛА:
1. НИКОГА не давай само крайния отговор без обяснение.
2. Обяснявай стъпка по стъпка като учител за ${gradeLabel}.
3. Използвай прости думи, подходящи за ${gradeLabel}.
4. Бъди насърчаващ и приятелски.
5. Ако задачата е математическа, покажи всяка стъпка от изчислението.
6. Ако е текстова задача, обясни как да разбереш какво се иска.
7. Завърши с кратко насърчение.

Отговаряй само на Български.`;
  }

  if (lang === "es") {
    return `Eres ${charName}, un asistente educativo de IA para niños de ${gradeLabel}. Estás ayudando a ${childName}.

REGLAS:
1. NUNCA des solo la respuesta final sin explicación.
2. Explica paso a paso como maestro de ${gradeLabel}.
3. Usa palabras simples adecuadas para ${gradeLabel}.
4. Sé alentador y amigable.
5. Si es un problema de matemáticas, muestra cada paso del cálculo.
6. Si es un problema de palabras, explica cómo entender lo que se pide.
7. Termina con un breve aliento.

Responde solo en Español.`;
  }

  return `You are ${charName}, an AI learning assistant for ${gradeLabel} children. You are helping ${childName}.

RULES:
1. NEVER give just the final answer without explanation.
2. Explain step by step like a ${gradeLabel} teacher.
3. Use simple language appropriate for ${gradeLabel}.
4. Be encouraging and friendly.
5. If it is a math problem, show every calculation step clearly.
6. If it is a word problem, explain how to understand what is being asked.
7. End with a short encouragement.

Respond only in English.`;
}

/* ─────────────────────────────────────────────────────────────────
   POST /api/vision/homework
   Body: { childId: number, image: string (base64), mimeType: string, lang?: string, grade?: number }
   Returns: { explanation: string, problemText: string }
───────────────────────────────────────────────────────────────── */
router.post("/vision/homework", requireAuth, async (req, res): Promise<void> => {
  const { childId, image, mimeType, lang, grade } = req.body as {
    childId?: number;
    image?: string;
    mimeType?: string;
    lang?: string;
    grade?: number;
  };

  if (!image || !mimeType) {
    res.status(400).json({ error: "image (base64) and mimeType are required" });
    return;
  }

  const { userId } = getUser(req);
  const familyId = await getFamilyIdFromDb(userId);

  let childRecord: { name: string; grade: number; aiCharacter: string | null; language: string | null } | null = null;

  if (childId && familyId) {
    const [found] = await db
      .select({ name: childrenTable.name, grade: childrenTable.grade, aiCharacter: childrenTable.aiCharacter, language: childrenTable.language })
      .from(childrenTable)
      .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId)));
    childRecord = found ?? null;
  }

  function resolveLang(providedLang: string | undefined, childLang: string | null | undefined): "bg" | "es" | "en" {
    const l = (providedLang ?? childLang ?? "").toLowerCase();
    if (l === "bg" || l.includes("bulgar")) return "bg";
    if (l === "es" || l.includes("spanish") || l.includes("español")) return "es";
    return "en";
  }

  const resolvedLang = resolveLang(lang, childRecord?.language);
  const resolvedGrade = grade ?? childRecord?.grade ?? 2;
  const childName = childRecord?.name ?? "the student";
  const charKey = childRecord?.aiCharacter ?? "owl";

  const systemPrompt = buildHomeworkSystemPrompt(resolvedLang, resolvedGrade, childName, charKey);

  const userPrompt =
    resolvedLang === "bg"
      ? "Погледни снимката на домашното и обясни задачата стъпка по стъпка."
      : resolvedLang === "es"
      ? "Mira la foto de la tarea y explica el problema paso a paso."
      : "Look at the homework photo and explain the problem step by step.";

  let openai: OpenAI;
  try {
    openai = getOpenAIClient();
  } catch (err) {
    res.status(500).json({ error: "AI service not configured" });
    return;
  }

  const validMime = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)
    ? (mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
    : "image/jpeg";

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: `data:${validMime};base64,${image}`, detail: "high" } },
        ],
      },
    ],
  });

  const explanation = completion.choices[0]?.message?.content ?? "";

  /* Track homework completion for parent dashboard */
  if (childId) {
    await db.insert(progressTable).values({
      childId,
      module: "homework",
      subject: "vision",
      score: 100,
      notes: `vision_homework:${new Date().toISOString()}`,
    });
  }

  res.json({ explanation, problemText: "" });
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/vision/homework/today?childId=
   Returns count of homework items solved today.
───────────────────────────────────────────────────────────────── */
router.get("/vision/homework/today", requireAuth, async (req, res): Promise<void> => {
  const childId = parseInt(req.query.childId as string, 10);
  if (isNaN(childId)) {
    res.status(400).json({ error: "childId required" });
    return;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ id: progressTable.id })
    .from(progressTable)
    .where(
      and(
        eq(progressTable.childId, childId),
        eq(progressTable.module, "homework"),
        gte(progressTable.createdAt, startOfDay),
      )
    );

  res.json({ count: rows.length });
});

export default router;
