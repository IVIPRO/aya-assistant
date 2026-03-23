import { Router, type IRouter } from "express";
import { db, chatMessagesTable, memoriesTable, childrenTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { SendChatMessageBody } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";
import { getAIResponse, getLang } from "../lib/aiResponses";
import { handleJuniorChat } from "../lib/juniorChatHandler";
import { handleFreeConversationChat } from "../lib/freeConversationHandler";
import { trySimpleMathSolve } from "../lib/mathSolver";
import OpenAI from "openai";

const router: IRouter = Router();

function getOpenAIClient() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "sk-placeholder";
  if (!baseURL) throw new Error("AI_INTEGRATIONS_OPENAI_BASE_URL is not set");
  return new OpenAI({ baseURL, apiKey });
}

router.get("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const module = req.query.module as string;
  const childIdStr = req.query.childId as string | undefined;

  if (!module) {
    res.status(400).json({ error: "module is required" });
    return;
  }

  const childId = childIdStr ? parseInt(childIdStr, 10) : null;

  const conditions = [
    eq(chatMessagesTable.userId, userId),
    eq(chatMessagesTable.module, module),
  ];

  if (childId !== null && !isNaN(childId)) {
    conditions.push(eq(chatMessagesTable.childId, childId));
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(and(...conditions))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages);
});

/* Helper function to build homework analysis prompt */
function buildHomeworkAnalysisPrompt(lang: "bg" | "es" | "en", grade: number, childName: string, charKey: string): string {
  const charName =
    charKey === "panda" ? (lang === "bg" ? "AYA Панда" : "AYA Panda")
    : charKey === "robot" ? (lang === "bg" ? "AYA Робот" : "AYA Robot")
    : charKey === "fox" ? (lang === "bg" ? "AYA Лисица" : "AYA Fox")
    : (lang === "bg" ? "AYA Сова" : "AYA Owl");

  const gradeLabel = lang === "bg" ? `${grade} клас` : `Grade ${grade}`;

  if (lang === "bg") {
    return `Ти си ${charName}, приятелски български учител за деца от 1 до 4 клас. Помагаш на ${childName}.

ЕЗИК: Винаги говори на чист съвременен български език. Никога не използвай руски думи или руска граматика. Бъди позитивен, търпелив и насърчаващ.

ПРАВИЛА:
1. Прегледай снимката внимателно и определи предмета (математика, български, четене, логика, английски, окружаващ свят).
2. Ако е достатъчно ясна - обясни задачата стъпка по стъпка, подходящо за ${gradeLabel}.
3. Ако е математическа задача - покажи всяка стъпка.
4. Ако е текстова задача - обясни как да я разбереш.
5. Ако е неясна - попроси по-добра снимка.
6. Бъди насърчаващ и приятелски.
7. Никога не давай само крайния отговор - обяснявай подробно.
8. Завърши с кратко насърчение.

Отговаряй само на чист съвременен Български. Никога не използвай руски думи или руска граматика.`;
  }

  if (lang === "es") {
    return `Eres ${charName}, un asistente educativo de IA para niños de ${gradeLabel}. Estás ayudando a ${childName}.

REGLAS:
1. Examina cuidadosamente la foto e identifica el tema (matemáticas, español, lectura, lógica, inglés, ciencias).
2. Si es lo bastante clara - explica la tarea paso a paso, apropiada para ${gradeLabel}.
3. Si es un problema de matemáticas - muestra cada paso.
4. Si es un problema de palabras - explica cómo entenderlo.
5. Si es poco clara - pide una foto mejor.
6. Sé alentador y amigable.
7. Nunca des solo la respuesta final - explica en detalle.
8. Termina con un breve aliento.

Responde solo en Español.`;
  }

  return `You are ${charName}, an AI learning assistant for ${gradeLabel} children. You are helping ${childName}.

RULES:
1. Carefully examine the photo and identify the subject (math, language, reading, logic, English, science).
2. If it is clear enough - explain the task step by step, appropriate for ${gradeLabel}.
3. If it is a math problem - show every step.
4. If it is a word problem - explain how to understand it.
5. If it is unclear - ask for a better photo.
6. Be encouraging and friendly.
7. Never give just the final answer - explain in detail.
8. End with a short encouragement.

Respond only in English.`;
}

router.post("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { module, content, childId, mode } = parsed.data;

  const imageMatch = content.match(/^\[IMAGE_DATA:([^:]+):([^:]+):([^\]]+)\]/);
  const hasImage = !!imageMatch;
  const [, imageBase64 = "", imageMimeType = "", imageId = ""] = imageMatch || [];

  const cleanContent = content.replace(/^\[IMAGE_DATA:[^\]]+\]\n?/, "");

  const [userMsg] = await db
    .insert(chatMessagesTable)
    .values({ userId, childId: childId ?? null, module, role: "user", content: cleanContent })
    .returning();

  let context: {
    grade?: number;
    country?: string;
    aiCharacter?: string;
    childName?: string;
    language?: string;
    lastMissionTopic?: string;
    lastInteractionTime?: Date;
    childXp?: number;
  } = {};

  if (module === "junior" && childId) {
    const { getFamilyIdFromDb } = await import("../lib/auth");
    const familyId = await getFamilyIdFromDb(userId);
    if (familyId) {
      const [childRecord] = await db
        .select()
        .from(childrenTable)
        .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId)));
      if (childRecord) {
        const [latestMemory] = await db
          .select()
          .from(memoriesTable)
          .where(and(eq(memoriesTable.childId, childId), eq(memoriesTable.type, "mission_complete")))
          .orderBy(desc(memoriesTable.createdAt))
          .limit(1);

        let lastMissionTopic: string | undefined;
        if (latestMemory && latestMemory.content) {
          const match = latestMemory.content.match(/Completed:\s*([^(]+)/);
          lastMissionTopic = match ? match[1].trim() : undefined;
        }

        context = {
          grade: childRecord.grade,
          country: childRecord.country,
          aiCharacter: childRecord.aiCharacter ?? undefined,
          childName: childRecord.name,
          language: childRecord.language ?? undefined,
          lastMissionTopic,
          lastInteractionTime: latestMemory?.createdAt,
          childXp: childRecord.xp ?? 0,
        };
      }
    }
  }

  let aiContent = "";

  // ── IMAGE FLOW (Homework Brain) ────────────────────────────────────────────
  if (hasImage && module === "junior" && imageBase64) {
    try {
      console.log("[AYA_HOMEWORK] ===== HOMEWORK IMAGE FLOW =====");
      console.log(`[AYA_HOMEWORK] REQUEST_ID: ${requestId}`);
      console.log(`[AYA_HOMEWORK] IMAGE_ID: ${imageId}`);
      console.log(`[AYA_HOMEWORK] IMAGE_SIZE_BYTES: ${imageBase64.length}`);
      console.log(`[AYA_HOMEWORK] MIME_TYPE: ${imageMimeType}`);
      console.log("[AYA_HOMEWORK] child:", context.childName, "grade:", context.grade, "language:", context.language);

      const resolvedLang = getLang(context.language);
      const openai = getOpenAIClient();

      // ===== COST OPTIMIZATION ROUTER =====
      // Phase 1: Try cheap local math solver first
      // Skips expensive OpenAI Stage 2 if simple arithmetic detected
      console.log(`[AYA_HOMEWORK] ${requestId} attempting Stage 1 simple math solver...`);
      const simpleMathResult = await trySimpleMathSolve(imageBase64, imageMimeType, resolvedLang, openai, requestId, db, childId ?? undefined);

      if (simpleMathResult) {
        console.log(`[AYA_HOMEWORK] ${requestId} STAGE_1_SUCCESS`);
        console.log(`[ROUTER] local solver used - skipping expensive Stage 2 grid-split + OpenAI vision`);
        aiContent = simpleMathResult;
        // Count problems in Stage 1 response
        const stage1Problems = (aiContent.match(/[1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟]/g) || []).length;
        console.log(`[HOMEWORK_PIPELINE] Stage 1 aiContent: ${aiContent.length} chars, ${stage1Problems} emoji-problems`);
        console.log(`[HOMEWORK_PIPELINE] Stage 1 response (first 200 chars): "${aiContent.substring(0, 200)}"`);
      } else {
        console.log(`[AYA_HOMEWORK] ${requestId} Stage 1 returned null, falling back to Stage 2 full vision analysis`);
        console.log(`[ROUTER] fallback to OpenAI - Stage 2 4-region grid split + vision API`);
        const resolvedGrade = context.grade ?? 2;
        const childName = context.childName ?? "the student";
        const charKey = context.aiCharacter ?? "owl";

        const systemPrompt = buildHomeworkAnalysisPrompt(resolvedLang, resolvedGrade, childName, charKey);

        // Extract problems from left and right columns using split logic
        let leftProblems = "";
        let rightProblems = "";
        let problemsMerged = "";

        try {
          console.log(`[AYA_HOMEWORK] ${requestId} Stage 2: Splitting image into 4-region grid...`);
          const sharp = await import("sharp");
          const buffer = Buffer.from(imageBase64, "base64");
          const image = sharp.default(buffer);
          const metadata = await image.metadata();
          
          if (metadata.width && metadata.height) {
            const halfWidth = Math.floor(metadata.width / 2);
            const halfHeight = Math.floor(metadata.height / 2);
            console.log(`[AYA_HOMEWORK] ${requestId} Image: ${metadata.width}x${metadata.height}, split at (${halfWidth}, ${halfHeight})`);
            
            const validMime = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(imageMimeType)
              ? (imageMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
              : "image/jpeg";

            // Helper to extract region and call OCR
            const extractRegionProblems = async (
              regionName: string,
              left: number,
              top: number,
              width: number,
              height: number
            ): Promise<{ problems: string; count: number }> => {
              console.log(`[AYA_HOMEWORK] ${requestId} Extracting problems from ${regionName}...`);
              const regionBuffer = await sharp.default(buffer)
                .extract({ left, top, width, height })
                .toBuffer();
              const regionBase64 = regionBuffer.toString("base64");
              
              const completion = await getOpenAIClient().chat.completions.create({
                model: "gpt-5.2",
                max_completion_tokens: 512,
                messages: [
                  { role: "system", content: systemPrompt },
                  {
                    role: "user",
                    content: [
                      { type: "text", text: `Extract ALL math problems from this ${regionName} region. List each problem exactly as written, including the equals sign and answer if visible.` },
                      { type: "image_url", image_url: { url: `data:${validMime};base64,${regionBase64}`, detail: "high" } },
                    ],
                  },
                ],
              });
              
              const problemText = completion.choices[0]?.message?.content ?? "";
              const count = problemText.trim().length > 0 ? (problemText.match(/\n/g) || []).length + 1 : 0;
              console.log(`[TRACE] ${regionName}: ${count} problems detected`);
              return { problems: problemText, count };
            };

            // Extract problems from all 4 regions in reading order: TL, TR, BL, BR
            const tlResult = await extractRegionProblems("TOP-LEFT", 0, 0, halfWidth, halfHeight);
            const trResult = await extractRegionProblems("TOP-RIGHT", halfWidth, 0, metadata.width - halfWidth, halfHeight);
            const blResult = await extractRegionProblems("BOTTOM-LEFT", 0, halfHeight, halfWidth, metadata.height - halfHeight);
            const brResult = await extractRegionProblems("BOTTOM-RIGHT", halfWidth, halfHeight, metadata.width - halfWidth, metadata.height - halfHeight);

            // Merge in reading order: TL, TR, BL, BR
            const allProblems = [tlResult.problems, trResult.problems, blResult.problems, brResult.problems]
              .map(p => p.trim())
              .filter(p => p.length > 0)
              .join("\n")
              .trim();
            
            const totalProblems = tlResult.count + trResult.count + blResult.count + brResult.count;
            
            // Cap at 30 problems max
            const problemLines = allProblems.split("\n").filter(l => l.length > 0);
            const cappedProblems = problemLines.slice(0, 30).join("\n");
            problemsMerged = cappedProblems;
            
            console.log(`[AYA_HOMEWORK] ${requestId} MERGED: TL(${tlResult.count}) + TR(${trResult.count}) + BL(${blResult.count}) + BR(${brResult.count}) = ${totalProblems} total`);
            console.log(`[TRACE] 4-region grid OCR MERGED: ${totalProblems} problems detected (capped at ${Math.min(totalProblems, 30)})`);
          }
        } catch (splitErr) {
          console.error(`[AYA_HOMEWORK] ${requestId} Image splitting failed:`, splitErr);
          console.log(`[AYA_HOMEWORK] ${requestId} Falling back to single full-image processing...`);
          problemsMerged = "";
        }

        // Final explanation using merged or full image
        const userPrompt = problemsMerged
          ? (resolvedLang === "bg"
              ? `Ево всички задачи от домашното (ляво + дясно):\n${problemsMerged}\n\nОбясни всяка задача стъпка по стъпка.`
              : resolvedLang === "es"
              ? `Aquí están todos los problemas de la tarea (izquierda + derecha):\n${problemsMerged}\n\nExplica cada problema paso a paso.`
              : `Here are all the homework problems (left + right):\n${problemsMerged}\n\nExplain each problem step by step.`)
          : (resolvedLang === "bg"
              ? "Погледни снимката и обясни задачата стъпка по стъпка, ако е достатъчно ясна."
              : resolvedLang === "es"
              ? "Mira la foto y explica la tarea paso a paso si es lo suficientemente clara."
              : "Look at the photo and explain the task step by step if it is clear enough.");

        const problemsInPrompt = problemsMerged ? (problemsMerged.match(/\n/g) || []).length + 1 : 0;
        console.log(`[AYA_HOMEWORK] ${requestId} Prompt builder: found ${problemsInPrompt} problems in merged text`);
        console.log(`[AYA_HOMEWORK] ${requestId} User prompt length: ${userPrompt.length}`);
        console.log(`[TRACE] Before OpenAI: ${problemsInPrompt} problems in prompt`);

        const validMime = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(imageMimeType)
          ? (imageMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
          : "image/jpeg";

        console.log(`[TRACE] Calling OpenAI with ${problemsInPrompt} problems...`);
        const completion = await getOpenAIClient().chat.completions.create({
          model: "gpt-5.2",
          max_completion_tokens: 2048,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: problemsMerged 
                ? userPrompt
                : [
                    { type: "text", text: userPrompt },
                    { type: "image_url", image_url: { url: `data:${validMime};base64,${imageBase64}`, detail: "high" } },
                  ],
            },
          ],
        });

        aiContent = completion.choices[0]?.message?.content ?? "";
        const responseLines = aiContent.split('\n').filter(l => l.length > 0);
        const emojiCount = (aiContent.match(/[1-9️⃣🔟]/g) || []).length;
        const problemsInResponse = (aiContent.match(/[1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟]/g) || []).length;
        console.log(`[AYA_HOMEWORK] ${requestId} OpenAI response: ${aiContent.length} chars, ${responseLines.length} lines, ~${emojiCount} emoji problems`);
        console.log(`[AYA_HOMEWORK] ${requestId} Response content: ${aiContent.substring(0, 200)}...`);
        console.log(`[HOMEWORK_PIPELINE] Stage 2 (OpenAI) aiContent: ${aiContent.length} chars, ${problemsInResponse} emoji-problems`);
        console.log(`[TRACE] After OpenAI: response has ${problemsInResponse} emoji-numbered problems, ${responseLines.length} lines, ${aiContent.length} chars`);
      }
    } catch (error) {
      const lang = getLang(context.language);
      const fallbackMsgs = {
        bg: "Прегледах снимката. Снимката не е достатъчно ясна. Можеш ли да я снимаш по-отблизо?",
        es: "Revisé la imagen. La imagen no es lo bastante clara. ¿Puedes tomar una foto más cercana?",
        en: "I reviewed the image. The image is not clear enough. Can you take a closer photo?",
      };
      aiContent = fallbackMsgs[lang];
    }

  // ── UNIFIED CHAT HANDLER ─────────────────────────────────────────────────
  } else if (module === "junior" && childId) {
    if (mode === "free_conversation") {
      // Free conversation: OpenAI-first, then internal tools only if action detected
      const openai = getOpenAIClient();
      aiContent = await handleFreeConversationChat(userId, childId, module, cleanContent, context, openai);
    } else {
      // Structured learning: internal-first (math engine, BG lessons, etc.)
      aiContent = await handleJuniorChat(userId, childId, module, cleanContent, context);
    }

  } else {
    // Non-junior modules
    aiContent = getAIResponse(module, cleanContent, context);
  }

  console.log(`[AYA_HOMEWORK] Before DB save: aiContent length = ${aiContent.length}, first 150 chars = "${aiContent.substring(0, 150)}"`);
  const aiProblemsBeforeSave = (aiContent.match(/[1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟]/g) || []).length;
  console.log(`[HOMEWORK_PIPELINE] Before DB save - aiContent: ${aiContent.length} chars, ${aiProblemsBeforeSave} emoji-problems`);
  console.log(`[TRACE] Problems in aiContent before DB save: ${aiProblemsBeforeSave}`);

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({ userId, childId: childId ?? null, module, role: "assistant", content: aiContent })
    .returning();

  console.log(`[AYA_HOMEWORK] After DB save: assistantMsg.content length = ${assistantMsg.content.length}`);
  const aiProblemsAfterSave = (assistantMsg.content.match(/[1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟]/g) || []).length;
  console.log(`[HOMEWORK_PIPELINE] After DB save - assistantMsg: ${assistantMsg.content.length} chars, ${aiProblemsAfterSave} emoji-problems`);
  console.log(`[TRACE] Problems in assistantMsg after DB save: ${aiProblemsAfterSave}`);

  await db.insert(memoriesTable).values({
    userId,
    childId: childId ?? null,
    type: "conversation_summary",
    content: `User asked: "${cleanContent.slice(0, 100)}" in ${module} module.${hasImage ? " (with image)" : ""}`,
    module,
  });

  console.log(`[AYA_HOMEWORK] Response being sent: ${assistantMsg.content.length} chars, content: "${assistantMsg.content.substring(0, 150)}"`);
  const finalProblems = (assistantMsg.content.match(/[1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟]/g) || []).length;
  console.log(`[HOMEWORK_PIPELINE] Final frontend response: ${assistantMsg.content.length} chars, ${finalProblems} emoji-problems`);
  console.log(`[TRACE] FINAL: Sent to frontend ${finalProblems} emoji-numbered problems`);
  res.status(201).json({ userMessage: userMsg, assistantMessage: assistantMsg });
});

export default router;
