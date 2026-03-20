import { Router, type IRouter } from "express";
import { db, chatMessagesTable, memoriesTable, childrenTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { SendChatMessageBody } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";
import { getAIResponse, detectTeachingIntent, generateAdditionTask, evaluateAdditionAnswer, getAdditionFeedback, getAdditionTaskPrompt, getLang, detectMathOperationSwitch, generateMathTask, evaluateMathAnswer, getMathFeedback, getMathTaskPrompt } from "../lib/aiResponses";
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
    return `Ти си ${charName}, AI учебен асистент за деца от ${gradeLabel}. Помагаш на ${childName}.

ПРАВИЛА:
1. Прегледай снимката внимателнои определи предмета (математика, български, четене, логика, английски, окружаващ свят).
2. Ако е достатъчно ясна - обясни задачата стъпка по стъпка, подходящо за ${gradeLabel}.
3. Ако е математическа задача - покажи всяка стъпка.
4. Ако е текстова задача - обясни как да я разбереш.
5. Ако е неясна - попроси по-добра снимка.
6. Бъди насърчаващ и приятелски.
7. Никога не давай само крайния отговор - обяснявай подробно.
8. Завърши с кратко насърчение.

Отговаряй само на Български.`;
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

/* Helper function to extract language from context */
function getLang(language?: string): "bg" | "es" | "en" {
  const l = (language ?? "").toLowerCase();
  if (l.includes("bulgar") || l === "bg") return "bg";
  if (l.includes("spanish") || l.includes("español") || l === "es") return "es";
  return "en";
}

router.post("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  
  // Generate unique request ID for complete trace through this request
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { module, content, childId } = parsed.data;

  // Check if message contains an image (format: [IMAGE_DATA:base64:mimeType:imageId]\nCaption)
  const imageMatch = content.match(/^\[IMAGE_DATA:([^:]+):([^:]+):([^\]]+)\]/);
  const hasImage = !!imageMatch;
  const [, imageBase64 = "", imageMimeType = "", imageId = ""] = imageMatch || [];

  // Extract clean content without image markers
  const cleanContent = content.replace(/^\[IMAGE_DATA:[^\]]+\]\n?/, "");

  const [userMsg] = await db
    .insert(chatMessagesTable)
    .values({ userId, childId: childId ?? null, module, role: "user", content: cleanContent })
    .returning();

  let context: { grade?: number; country?: string; aiCharacter?: string; childName?: string; language?: string; lastMissionTopic?: string; lastInteractionTime?: Date; childXp?: number } = {};
  if (module === "junior" && childId) {
    const { getFamilyIdFromDb } = await import("../lib/auth");
    const familyId = await getFamilyIdFromDb(userId);
    if (familyId) {
      const [childRecord] = await db
        .select()
        .from(childrenTable)
        .where(and(eq(childrenTable.id, childId), eq(childrenTable.familyId, familyId)));
      if (childRecord) {
        // Fetch latest memory for this child to include topic and interaction context
        const [latestMemory] = await db
          .select()
          .from(memoriesTable)
          .where(and(eq(memoriesTable.childId, childId), eq(memoriesTable.type, "mission_complete")))
          .orderBy(desc(memoriesTable.createdAt))
          .limit(1);
        
        // Parse mission topic from memory if available
        let lastMissionTopic: string | undefined;
        if (latestMemory && latestMemory.content) {
          // Memory format: "Completed: {topic_name} ..."
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

  // If message contains an image, try simple math solving first (Stage 1 of Homework Brain)
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

      // Stage 1: Try to extract and solve simple arithmetic locally
      console.log(`[AYA_HOMEWORK] ${requestId} attempting Stage 1 simple math solver...`);
      const simpleMathResult = await trySimpleMathSolve(imageBase64, imageMimeType, resolvedLang, openai, requestId);

      if (simpleMathResult) {
        // Simple math was detected and solved
        console.log(`[AYA_HOMEWORK] ${requestId} STAGE_1_SUCCESS`);
        console.log(`[AYA_HOMEWORK] ${requestId} RESPONSE_LENGTH: ${simpleMathResult.length} chars`);
        console.log(`[AYA_HOMEWORK] ${requestId} FULL_RESPONSE:\n${simpleMathResult}`);
        aiContent = simpleMathResult;
      } else {
        // Not simple math - use full vision analysis with step-by-step tutoring
        console.log(`[AYA_HOMEWORK] ${requestId} Stage 1 returned null, falling back to Stage 2 full vision analysis`);
        console.log(`[AYA_HOMEWORK] ${requestId} ===== STAGE 2: Full Vision Analysis =====`);
        const resolvedGrade = context.grade ?? 2;
        const childName = context.childName ?? "the student";
        const charKey = context.aiCharacter ?? "owl";

        const systemPrompt = buildHomeworkAnalysisPrompt(resolvedLang, resolvedGrade, childName, charKey);
        
        // Build user prompt in the child's language
        const userPrompt =
          resolvedLang === "bg"
            ? "Погледни снимката и обясни задачата стъпка по стъпка, ако е достатъчно ясна."
            : resolvedLang === "es"
            ? "Mira la foto y explica la tarea paso a paso si es lo suficientemente clara."
            : "Look at the photo and explain the task step by step if it is clear enough.";

        const validMime = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(imageMimeType)
          ? (imageMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
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
                { type: "image_url", image_url: { url: `data:${validMime};base64,${imageBase64}`, detail: "high" } },
              ],
            },
          ],
        });

        aiContent = completion.choices[0]?.message?.content ?? "";
      }
    } catch (error) {
      // Fallback if vision API fails
      const lang = getLang(context.language);
      const fallbackMsgs = {
        bg: "Прегледах снимката. Снимката не е достатъчно ясна. Можеш ли да я снимаш по-отблизо?",
        es: "Revisé la imagen. La imagen no es lo bastante clara. ¿Puedes tomar una foto más cercana?",
        en: "I reviewed the image. The image is not clear enough. Can you take a closer photo?",
      };
      aiContent = fallbackMsgs[lang];
    }
  } else {
    // Get language for all flows
    const lang = getLang(context.language);
    console.log("[VOICE_INTENT_INPUT]", { cleanContent, lang });
    
    // FIRST: Check if there's an active question and if this is an operation switch request
    let operationSwitchHandled = false;
    if (childId && module === "junior") {
      const [activeQuestion] = await db
        .select()
        .from(memoriesTable)
        .where(and(
          eq(memoriesTable.childId, childId),
          eq(memoriesTable.type, "active_question"),
          eq(memoriesTable.module, module)
        ))
        .orderBy(desc(memoriesTable.createdAt))
        .limit(1);
      
      if (activeQuestion) {
        try {
          const questionData = JSON.parse(activeQuestion.content);
          const currentOperation = questionData.operation || "addition";
          const requestedOp = detectMathOperationSwitch(cleanContent, lang);
          
          if (requestedOp && requestedOp !== currentOperation) {
            console.log("[MATH_OPERATION_CURRENT]", currentOperation);
            console.log("[MATH_OPERATION_REQUESTED]", requestedOp);
            console.log("[MATH_OPERATION_SET]", requestedOp);
            console.log("[MATH_OPERATION_SWITCHED]", { from: currentOperation, to: requestedOp });
            
            // Delete current question and generate new one with different operation
            await db.delete(memoriesTable).where(eq(memoriesTable.id, activeQuestion.id)).catch(() => {});
            
            const fallbackName = lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend";
            const childName = context.childName ?? fallbackName;
            console.log("[MATH_OPERATION_BEFORE_GENERATE]", { requestedOp, type: typeof requestedOp });
            const { a, b, task, operation } = generateMathTask(requestedOp);
            aiContent = getMathTaskPrompt(a, b, operation, childName, lang);
            console.log("[MATH_NEXT_TASK_GENERATED]", { a, b, task, operation });
            if (operation === "division") {
              console.log("[MATH_DIVISION_TASK_GENERATED]", { a, b, task });
            }
            
            // Store new question
            await db.insert(memoriesTable).values({
              userId,
              childId,
              type: "active_question",
              content: JSON.stringify({ a, b, task, operation, createdAt: new Date().toISOString() }),
              module,
            }).catch(() => {});
            
            operationSwitchHandled = true;
          }
        } catch (error) {
          console.log("[OPERATION_SWITCH_CHECK_ERROR]", error);
        }
      }
    }
    
    // SECOND: If operation switch not handled, check if user wants to start a new teaching loop
    if (!operationSwitchHandled) {
      const isTeachingRequest = detectTeachingIntent(cleanContent, lang);
      console.log("[VOICE_INTENT_CLASSIFIED]", { isTeachingRequest, module });
      
      if (isTeachingRequest && module === "junior") {
        // Start a new teaching loop
        console.log("[VOICE_TEACHER_LOOP_TRIGGERED] Starting Smart Teacher Loop for:", cleanContent);
        
        // Check if child requested a specific operation
        console.log("[MATH_OPERATION_INPUT]", cleanContent);
        const requestedOperation = detectMathOperationSwitch(cleanContent, lang);
        console.log("[MATH_OPERATION_CLASSIFIED]", requestedOperation);
        
        // Use requested operation or default to addition
        const startOperation = requestedOperation || "addition";
        if (requestedOperation) {
          console.log("[MATH_OPERATION_REQUESTED]", requestedOperation);
          console.log("[MATH_OPERATION_SET]", requestedOperation);
        } else {
          console.log("[MATH_OPERATION_FALLBACK] No specific operation requested, using default addition");
        }
        
        const fallbackName = lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend";
        const childName = context.childName ?? fallbackName;
        console.log("[MATH_OPERATION_BEFORE_GENERATE_NEW_LOOP]", { startOperation, type: typeof startOperation });
        const { a, b, task, operation } = generateMathTask(startOperation as "addition" | "subtraction" | "multiplication" | "division");
        aiContent = getMathTaskPrompt(a, b, operation, childName, lang);
        
        console.log("[MATH_OPERATION_CURRENT]", operation);
        console.log("[MATH_NEXT_TASK_GENERATED]", { a, b, task, operation });
        if (operation === "division") {
          console.log("[MATH_DIVISION_TASK_GENERATED]", { a, b, task });
        }
        
        // Store active question in memory for state persistence
        if (childId) {
          await db.insert(memoriesTable).values({
            userId,
            childId,
            type: "active_question",
            content: JSON.stringify({ a, b, task, operation, createdAt: new Date().toISOString() }),
            module,
          }).catch(() => {}); // Silent fail if insert doesn't work
        }
      } else {
      // Get language for all non-teaching-request flows
      
      // First, check if there's a post-success follow-up state
      let isPostSuccessFollowup = false;
      let postSuccessFollowupId: number | null = null;
      
      if (childId) {
        const [postSuccess] = await db
          .select()
          .from(memoriesTable)
          .where(and(
            eq(memoriesTable.childId, childId),
            eq(memoriesTable.type, "post_success_followup"),
            eq(memoriesTable.module, module)
          ))
          .orderBy(desc(memoriesTable.createdAt))
          .limit(1);
        
        if (postSuccess) {
          console.log("[TEACHER_LOOP_POST_SUCCESS_ACTIVE] Found post-success follow-up state");
          console.log("[TEACHER_LOOP_FOLLOWUP_INPUT]", cleanContent);
          
          // Check for operation switch request
          console.log("[MATH_OPERATION_INPUT]", cleanContent);
          const requestedOperation = detectMathOperationSwitch(cleanContent, lang);
          console.log("[MATH_OPERATION_CLASSIFIED]", requestedOperation);
          if (requestedOperation) {
            console.log("[MATH_OPERATION_REQUESTED]", requestedOperation);
            console.log("[MATH_OPERATION_SET]", requestedOperation);
          } else {
            console.log("[MATH_OPERATION_FALLBACK] No operation requested, will use default");
          }
          
          // Check if child wants to continue or stop
          const msg = cleanContent.toLowerCase().trim();
          const continueYes = ["да", "дай", "давай", "още", "друга", "следваща", "да, още една", "дай ми още една", "дай ми още един", "още един", "още една", "да, по-трудна", "да, по-сложна", "по-трудна", "по-сложна", "да, по-лесна", "по-лесна"].some(t => msg.includes(t));
          const stopNo = ["не", "стига", "достатъчно е", "върши"].some(t => msg.includes(t));
          
          console.log("[TEACHER_LOOP_FOLLOWUP_CLASSIFIED]", { continueYes, stopNo, requestedOperation, message: msg });
          
          if (continueYes || requestedOperation) {
            // Generate a new task and continue the loop
            console.log("[TEACHER_LOOP_NEXT_TASK_TRIGGERED] Continuing with new task");
            if (requestedOperation) console.log("[MATH_OPERATION_SWITCHED]", { from: "addition", to: requestedOperation });
            postSuccessFollowupId = postSuccess.id;
            
            const fallbackName = lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend";
            const childName = context.childName ?? fallbackName;
            const nextOp = (requestedOperation || "addition") as "addition" | "subtraction" | "multiplication" | "division";
            console.log("[MATH_OPERATION_BEFORE_GENERATE_FOLLOWUP]", { nextOp, requestedOperation, type: typeof nextOp });
            const { a, b, task, operation } = generateMathTask(nextOp);
            aiContent = getMathTaskPrompt(a, b, operation, childName, lang);
            console.log("[MATH_NEXT_TASK_GENERATED]", { a, b, task, operation });
            if (operation === "division") {
              console.log("[MATH_DIVISION_TASK_GENERATED]", { a, b, task });
            }
            
            // Store the new active question
            if (childId) {
              await db.insert(memoriesTable).values({
                userId,
                childId,
                type: "active_question",
                content: JSON.stringify({ a, b, task, operation, createdAt: new Date().toISOString() }),
                module,
              }).catch(() => {});
              
              // Delete the post-success follow-up state since we've acted on it
              await db
                .delete(memoriesTable)
                .where(eq(memoriesTable.id, postSuccessFollowupId))
                .catch(() => {});
            }
            isPostSuccessFollowup = true;
          } else if (stopNo) {
            // Child wants to stop, exit the loop
            console.log("[TEACHER_LOOP_FOLLOWUP_CLASSIFIED] Child wants to stop");
            await db
              .delete(memoriesTable)
              .where(eq(memoriesTable.id, postSuccess.id))
              .catch(() => {});
            
            // Return to friendly chat mode
            const fallbackName = lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend";
            const childName = context.childName ?? fallbackName;
            
            const exitMessages = {
              bg: "Чудесна работа, {{childName}}! Когато си готов, мога да те помогна отново. 🌟",
              es: "¡Excelente trabajo, {{childName}}! Cuando estés listo, puedo ayudarte de nuevo. 🌟",
              en: "Great work, {{childName}}! Whenever you're ready, I can help you again. 🌟",
            };
            
            aiContent = (exitMessages[lang] ?? exitMessages.en).replace("{{childName}}", childName);
            isPostSuccessFollowup = true;
          }
        }
      }
      
      // If not in post-success follow-up, check if there's an active unresolved teacher-loop question
      let isAnswerToTask = false;
      let taskA = 0, taskB = 0;
      let activeQuestionId: number | null = null;
      
      // Fetch the most recent active_question memory
      if (childId) {
        const [activeQuestion] = await db
          .select()
          .from(memoriesTable)
          .where(and(
            eq(memoriesTable.childId, childId),
            eq(memoriesTable.type, "active_question"),
            eq(memoriesTable.module, module)
          ))
          .orderBy(desc(memoriesTable.createdAt))
          .limit(1);
        
        if (activeQuestion) {
          console.log("[TEACHER_LOOP_ACTIVE] Found active question in memory");
          try {
            const questionData = JSON.parse(activeQuestion.content);
            taskA = questionData.a;
            taskB = questionData.b;
            const taskOperation = questionData.operation || "addition";
            activeQuestionId = activeQuestion.id;
            console.log("[MATH_OPERATION_CURRENT]", taskOperation);
            console.log("[TEACHER_LOOP_EXPECTED_ANSWER]", { taskA, taskB, operation: taskOperation });
            
            // Check if child wants to switch operation
            const requestedOp = detectMathOperationSwitch(cleanContent, lang);
            if (requestedOp && requestedOp !== taskOperation) {
              console.log("[MATH_OPERATION_REQUESTED]", requestedOp);
              console.log("[MATH_OPERATION_SWITCHED]", { from: taskOperation, to: requestedOp });
              
              // Delete current question and generate new one with different operation
              await db.delete(memoriesTable).where(eq(memoriesTable.id, activeQuestionId)).catch(() => {});
              
              const fallbackName = lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend";
              const childName = context.childName ?? fallbackName;
              const { a, b, task, operation } = generateMathTask(requestedOp);
              aiContent = getMathTaskPrompt(a, b, operation, childName, lang);
              console.log("[MATH_NEXT_TASK_GENERATED]", { a, b, task, operation });
              
              // Store new question
              if (childId) {
                await db.insert(memoriesTable).values({
                  userId,
                  childId,
                  type: "active_question",
                  content: JSON.stringify({ a, b, task, operation, createdAt: new Date().toISOString() }),
                  module,
                }).catch(() => {});
              }
              isAnswerToTask = false;
            } else {
              // Evaluate the child's message as a potential answer
              console.log("[TEACHER_LOOP_CHILD_INPUT]", cleanContent);
              console.log("[MIC_TRANSCRIPT_RAW]", cleanContent);
              const { correct, expected } = evaluateMathAnswer(taskA, taskB, taskOperation, cleanContent);
              console.log("[MIC_EXPECTED_ANSWER]", expected);
              console.log("[MIC_VALIDATION_RESULT]", { correct, userAnswer: cleanContent, expected });
              console.log("[TEACHER_LOOP_MATCH_RESULT]", { correct, userAnswer: cleanContent, expected });
              
              isAnswerToTask = true;
              const fallbackName = lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend";
              const childName = context.childName ?? fallbackName;
              
              aiContent = getMathFeedback(taskA, taskB, taskOperation, cleanContent, childName, lang, correct);
              
              // If answer is correct, remove the active question and award XP
              if (correct) {
                console.log("[TEACHER_LOOP_RESOLVED] Answer was correct");
                
                // Instead of deleting, store a post-success follow-up state
                // This allows the next message to continue the loop
                if (childId) {
                  await db
                    .delete(memoriesTable)
                    .where(eq(memoriesTable.id, activeQuestionId))
                    .catch(() => {}); // Delete the active question
                  
                  // Store post-success follow-up state for next message routing
                  await db.insert(memoriesTable).values({
                    userId,
                    childId,
                    type: "post_success_followup",
                    content: JSON.stringify({ 
                      lastDifficulty: "medium", 
                      createdAt: new Date().toISOString() 
                    }),
                    module,
                  }).catch(() => {}); // Silent fail if insert doesn't work
                  
                  // Award small XP for correct answer in teaching loop
                  const xpReward = 3;
                  await db
                    .update(childrenTable)
                    .set({ xp: (context.childXp ?? 0) + xpReward })
                    .where(eq(childrenTable.id, childId))
                    .catch(() => {}); // Silent fail if update doesn't work
                }
              }
            }
          } catch (error) {
            console.log("[TEACHER_LOOP_ERROR] Failed to parse active question:", error);
            isAnswerToTask = false;
          }
        }
      }
      
      // If no active question, use default response logic
      if (!isAnswerToTask) {
        // Regular chat without active teaching task - use default response logic
        aiContent = getAIResponse(module, cleanContent, context);
      }
    }
    }
  }

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({ userId, childId: childId ?? null, module, role: "assistant", content: aiContent })
    .returning();

  // Store conversation memory with type "conversation_summary" for tracking interactions
  await db.insert(memoriesTable).values({
    userId,
    childId: childId ?? null,
    type: "conversation_summary",
    content: `User asked: "${cleanContent.slice(0, 100)}" in ${module} module.${hasImage ? " (with image)" : ""}`,
    module,
  });

  res.status(201).json({ userMessage: userMsg, assistantMessage: assistantMsg });
});

export default router;
