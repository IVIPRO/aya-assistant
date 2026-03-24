/**
 * AYA Junior — Unified Hybrid Chat Handler
 *
 * Single entry point for ALL child input (typed and voice).
 * Implements the Master Prompt v1 architecture:
 *   1. Intent Router   — classifies each message into one intent
 *   2. State Manager   — reads/writes session state from the DB
 *   3. Math Engine     — deterministic task generation & validation
 *   4. Free Chat       — educational fallback that never corrupts math state
 *   5. Explain Mode    — hint-only path that never marks right/wrong
 */

import { db, memoriesTable, childrenTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

// Simple in-memory cache for child profile + mission data (5 min TTL)
const PROFILE_CACHE = new Map<number, { profile: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheFresh(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}
import {
  generateMathTask,
  evaluateMathAnswer,
  getMathFeedback,
  getMathTaskPrompt,
  detectMathOperationSwitch,
  getAIResponse,
  getLang,
} from "./aiResponses";
import {
  getBulgarianLessonPrompt,
  getDefaultBulgarianTopic,
} from "./bgCurriculum";
import { updateActiveSubject } from "./academicProfile";
import {
  evaluateBulgarianLessonAnswer,
  type EvaluationResult,
} from "./bgLessonEvaluator";
import {
  recordTopicAttempt,
  checkTopicProgression,
} from "./topicProgression";
import {
  getAdaptiveProfile,
  updateAdaptiveProfile,
  getRecommendedDifficulty,
  shouldReviewWeakTopic,
  getAdaptiveMode,
} from "./studentAdaptiveProfile";

// ─── Types ──────────────────────────────────────────────────────────────────

type Lang = "bg" | "es" | "en";
type Operation = "addition" | "subtraction" | "multiplication" | "division";

type Intent =
  | "math_answer"
  | "new_math_task"
  | "next_task"
  | "change_operation"
  | "explain_current_task"
  | "free_question"
  | "small_talk"
  | "unknown";

interface ActiveQuestion {
  id: number;
  a: number;
  b: number;
  operation: Operation;
  task: string;
}

interface SessionState {
  activeQuestion: ActiveQuestion | null;   // awaiting_answer = !!activeQuestion
  postSuccessId: number | null;            // post_success_waiting = !!postSuccessId
}

interface BulgarianLessonState {
  id: number;
  topicId: string;
  subject: string; // "bulgarian_language"
  grade: number;
  createdAt: string; // ISO timestamp
  currentQuestionIndex: number; // Tracks which question in a multi-question topic
  attemptsPerQuestion: Record<number, number>; // Track wrong attempts per question (0-indexed)
}

interface JuniorContext {
  childName?: string;
  grade?: number;
  language?: string;
  aiCharacter?: string;
  childXp?: number;
  country?: string;
}

// ─── State Reader ────────────────────────────────────────────────────────────

async function readSessionState(
  childId: number,
  module: string
): Promise<SessionState> {
  const [aq] = await db
    .select()
    .from(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "active_question"),
        eq(memoriesTable.module, module)
      )
    )
    .orderBy(desc(memoriesTable.createdAt))
    .limit(1);

  const [ps] = await db
    .select()
    .from(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "post_success_followup"),
        eq(memoriesTable.module, module)
      )
    )
    .orderBy(desc(memoriesTable.createdAt))
    .limit(1);

  let activeQuestion: ActiveQuestion | null = null;
  if (aq) {
    try {
      const data = JSON.parse(aq.content);
      activeQuestion = {
        id: aq.id,
        a: data.a,
        b: data.b,
        operation: (data.operation || "addition") as Operation,
        task: data.task ?? "",
      };
    } catch {
      /* corrupt record — treat as no active question */
    }
  }

  return {
    activeQuestion,
    postSuccessId: ps ? ps.id : null,
  };
}

// ─── Bulgarian Lesson State ───────────────────────────────────────────────────

async function readBulgarianLessonState(
  childId: number,
  module: string,
): Promise<BulgarianLessonState | null> {
  const [row] = await db
    .select()
    .from(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "bulgarian_lesson_active"),
        eq(memoriesTable.module, module),
      ),
    )
    .orderBy(desc(memoriesTable.createdAt))
    .limit(1);

  if (!row) return null;
  try {
    const data = JSON.parse(row.content);
    return {
      id: row.id,
      topicId: data.topicId,
      subject: data.subject ?? "bulgarian_language",
      grade: data.grade,
      createdAt: data.createdAt,
      currentQuestionIndex: data.currentQuestionIndex ?? 0,
      attemptsPerQuestion: data.attemptsPerQuestion ?? {},
    };
  } catch {
    return null;
  }
}

async function storeBulgarianLesson(
  userId: number,
  childId: number,
  module: string,
  topicId: string,
  grade: number,
  currentQuestionIndex: number = 0,
  attemptsPerQuestion: Record<number, number> = {},
): Promise<number> {
  // Clear existing lesson state
  await db
    .delete(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "bulgarian_lesson_active"),
        eq(memoriesTable.module, module),
      ),
    )
    .catch(() => {});

  const [inserted] = await db
    .insert(memoriesTable)
    .values({
      userId,
      childId,
      type: "bulgarian_lesson_active",
      content: JSON.stringify({
        topicId,
        subject: "bulgarian_language",
        grade,
        currentQuestionIndex,
        attemptsPerQuestion,
        createdAt: new Date().toISOString(),
      }),
      module,
    })
    .returning();

  return inserted.id;
}

async function clearBulgarianLesson(childId: number, module: string): Promise<void> {
  await db
    .delete(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "bulgarian_lesson_active"),
        eq(memoriesTable.module, module),
      ),
    )
    .catch(() => {});
}

// ─── Intent Router ───────────────────────────────────────────────────────────

function detectIntent(
  msg: string,
  state: SessionState,
  lang: Lang
): Intent {
  const m = msg.toLowerCase().trim();
  console.log("[INTENT_RAW]", msg);
  console.log("[INTENT_NORMALIZED]", m);

  // ── 1. Operation-switch always wins (any context) ───────────────────────
  const op = detectMathOperationSwitch(m, lang);
  if (op) return "change_operation";

  // ── 2. New math task request (any context, even with active question) ────
  if (isNewMathTaskRequest(m, lang)) return "new_math_task";

  // ── 2b. If there's an active question, check if this is a NEW math problem (e.g., "колко е 5+3")
  // before treating it as an answer to the current task ──────────────────────
  if (state.activeQuestion !== null) {
    if (containsMathOperators(m, lang)) return "new_math_task";
  }

  // ── 3. Post-success continuation ────────────────────────────────────────
  if (state.postSuccessId !== null) {
    if (isContinueCommand(m, lang)) return "next_task";
    if (isStopCommand(m, lang))     return "unknown"; // will exit loop
  }

  // ── 4. Active task context ───────────────────────────────────────────────
  if (state.activeQuestion !== null) {
    // Explain/help first (before answer check, avoid treating "как" as answer)
    if (isExplainRequest(m, lang)) return "explain_current_task";

    // NEW: Check for Bulgarian spoken math (e.g., "пет плюс три" or "колко е пет плюс три?")
    // Only in Bulgarian language
    if (lang === "bg") {
      const spokenMath = parseBulgarianSpokenMath(m);
      if (spokenMath) {
        console.log("[BG_SPOKEN_MATH_PARSED]", spokenMath);
        if (spokenMath.type === "full_question") {
          // Full question like "Колко е пет плюс три?" -> answer via OpenAI
          console.log("[BG_SPOKEN_MATH_ROUTE] full question -> answering via OpenAI");
          return "unknown";
        } else {
          // Short answer like "пет плюс три" -> treat as math answer to current task
          console.log("[BG_SPOKEN_MATH_ROUTE] short answer -> validating against current task");
          return "math_answer";
        }
      }
    }

    // Check if this is a complete direct math question (e.g., "Колко е пет плюс три?")
    // If so, route it to OpenAI to answer, NOT to the active task answer handler
    if (isDirectMathQuestion(m, lang)) {
      console.log("[DIRECT_MATH_QUESTION] detected - will answer via OpenAI");
      return "unknown"; // Routes to OpenAI for answering
    }

    // Numeric typed answer
    if (/^\d+([.,]\d+)?$/.test(m.trim())) {
      console.log("[MATH_ANSWER_ROUTE] numeric answer detected");
      return "math_answer";
    }

    // Bulgarian number word / spoken sentence (but NOT a full question)
    if (looksLikeBulgarianAnswer(m)) {
      console.log("[MATH_ANSWER_ROUTE] bulgarian answer detected");
      return "math_answer";
    }
  }

  // ── 5. Free educational question ────────────────────────────────────────
  if (isEducationalQuestion(m, lang)) {
    console.log("[INTENT_RESULT]", "free_question");
    console.log("[INTENT_ROUTE]", "getFreeQuestionReply");
    return "free_question";
  }

  // ── 6. Small talk / greeting ─────────────────────────────────────────────
  if (isGreeting(m, lang)) {
    console.log("[INTENT_RESULT]", "small_talk");
    console.log("[INTENT_ROUTE]", "getAIResponse");
    return "small_talk";
  }

  // ── 7. Fallback — unknown ────────────────────────────────────────────────
  console.log("[INTENT_FALLBACK_REASON]", "no intent matched");
  console.log("[INTENT_RESULT]", "unknown");
  console.log("[INTENT_ROUTE]", "getAIResponse");
  return "unknown";
}

// ─── Intent Helpers ──────────────────────────────────────────────────────────

function isNewMathTaskRequest(m: string, lang: Lang): boolean {
  const triggers: Record<Lang, string[]> = {
    bg: [
      "дай ми задача", "дай задача", "математическа задача", "задача по математика",
      "искам задача", "дай упражнение", "искам упражнение", "математика",
      "научи ме", "тренирай ме", "дай ми", "искам да уча",
    ],
    es: [
      "dame una tarea", "tarea de matemática", "ejercicio", "matemáticas",
      "quiero practicar", "enséñame",
    ],
    en: [
      "give me a task", "math task", "give me a problem", "math problem",
      "let's practice", "practice math", "teach me",
    ],
  };
  return triggers[lang].some((t) => m.includes(t));
}

function containsMathOperators(m: string, lang: Lang): boolean {
  // Don't treat direct math questions (starting with "колко", "какво", etc.) as new tasks
  // These should be answered, not create a new random task
  if (lang === "bg" && /^(колко|какво|как|кой|коя|кое|къде|кога|защо)/.test(m)) {
    console.log("[MATH_OPERATORS] skipping - starts with question word");
    return false;
  }
  if (lang === "es" && /^(cuánto|qué|cómo|quién|dónde|cuándo|por)/.test(m)) {
    console.log("[MATH_OPERATORS] skipping - starts with question word");
    return false;
  }
  if (lang === "en" && /^(how|what|which|when|where|who|why)/.test(m)) {
    console.log("[MATH_OPERATORS] skipping - starts with question word");
    return false;
  }
  
  const operators: Record<Lang, string[]> = {
    bg: ["плюс", "минус", "умножено", "разделено", "+", "-", "×", "÷", "*", "/"],
    es: ["más", "menos", "multiplicado", "dividido", "+", "-", "×", "÷", "*", "/"],
    en: ["plus", "minus", "times", "multiplied", "divided", "+", "-", "×", "÷", "*", "/"],
  };
  const hasOp = operators[lang].some((op) => m.includes(op));
  if (hasOp) console.log("[MATH_OPERATORS] detected - treating as new task request");
  return hasOp;
}

function isContinueCommand(m: string, lang: Lang): boolean {
  const triggers: Record<Lang, string[]> = {
    bg: ["да", "дай", "давай", "още", "друга", "следваща", "още един", "още една", "продължи", "напред"],
    es: ["sí", "dame", "otra", "siguiente", "continúa", "más"],
    en: ["yes", "give", "more", "another", "next", "continue", "ok"],
  };
  return triggers[lang].some((t) => m.includes(t));
}

function isStopCommand(m: string, lang: Lang): boolean {
  const triggers: Record<Lang, string[]> = {
    bg: ["не", "стига", "достатъчно", "спри", "довиждане", "чао"],
    es: ["no", "basta", "suficiente", "parar", "adiós"],
    en: ["no", "stop", "enough", "quit", "bye"],
  };
  return triggers[lang].some((t) => m.includes(t));
}

function isExplainRequest(m: string, lang: Lang): boolean {
  // STRICT: Only match if clearly asking for help WITH the current task
  // NOT general greetings or casual questions
  const patterns: Record<Lang, RegExp> = {
    bg: /\b(обясни|помогни|не разбирам|как се решава|помощ|не мога)\b/i,
    es: /\b(explica|ayuda|no entiendo|cómo se resuelve|ayúdame|no puedo)\b/i,
    en: /\b(explain|help|don't understand|how to solve|help me|can't)\b/i,
  };
  return patterns[lang].test(m);
}

function isEducationalQuestion(m: string, lang: Lang): boolean {
  const patterns: Record<Lang, RegExp> = {
    bg: /^(защо|какво|как|откъде|кога|кой|коя|къде|как се|как се казваш|какво можеш да правиш|какви|какъв|каква|разкажи|прочети|кажи ми|помогни ми|да четем|хайде да си играем|хайде да)\b/i,
    es: /^(por qué|qué|cómo|dónde|cuándo|quién|cuéntame|léeme)\b/i,
    en: /^(why|what|how|where|when|who|tell me|read me)\b/i,
  };
  return patterns[lang].test(m);
}

function isGreeting(m: string, lang: Lang): boolean {
  const patterns: Record<Lang, RegExp> = {
    bg: /^(привет|здравей|здрасти|хей|салам|добър ден|добро утро|добра вечер)/i,
    es: /^(hola|buenos|buenas|cómo estás|qué tal)/i,
    en: /^(hi|hello|hey|good morning|good evening|how are)/i,
  };
  return patterns[lang].test(m);
}

// ─── Subject Router ───────────────────────────────────────────────────────────
//
// Runs BEFORE intent detection. Returns the requested subject if the child is
// explicitly asking to learn a particular subject; null otherwise.
//
// Priority: bulgarian_language check is tested BEFORE mathematics so that
// messages containing both words (e.g. "не искам математика, искам български")
// always route to the correct subject.

export type SubjectRequest = "bulgarian_language" | "mathematics" | null;

export function detectSubjectRequest(msg: string, _lang: Lang): SubjectRequest {
  const m = msg.toLowerCase().trim();

  // ── Bulgarian language triggers (checked first — higher priority) ──────────
  const bgTriggers = [
    "искам български",
    "да учим български",
    "нека учим български",
    "урок по български",
    "упражнение по български",
    "искам урок по български",
    "дай ми упражнение по български",
    "дай упражнение по български",
    "нека четем",
    "нека пишем",
    "искам четене",
    "искам писане",
    "искам граматика",
    "дай граматика",
    "да учим граматика",
    "bulgarian lesson",
    "bulgarian language",
    "bulgarian",
    "български език",
    "учим езика",
    "упражнение по езика",
  ];
  if (bgTriggers.some(t => m.includes(t))) return "bulgarian_language";

  // ── Mathematics triggers ───────────────────────────────────────────────────
  const mathTriggers = [
    "искам математика",
    "да учим математика",
    "нека учим математика",
    "урок по математика",
    "задача по математика",
    "дай ми задача по математика",
    "math lesson",
    "math task",
    "let's do math",
  ];
  if (mathTriggers.some(t => m.includes(t))) return "mathematics";

  return null;
}

// ─── Character Emoji Lookup ───────────────────────────────────────────────────

function getCharEmoji(aiCharacter?: string): string {
  const map: Record<string, string> = {
    panda: "🐼",
    robot: "🤖",
    fox: "🦊",
    owl: "🦉",
  };
  return map[(aiCharacter ?? "").toLowerCase()] ?? "📚";
}

function isDirectMathQuestion(m: string, lang: Lang): boolean {
  // Detects complete math questions like "Колко е пет плюс три?"
  // but NOT short answers like "пет" or "8" or "осем"
  
  if (lang === "bg") {
    // Must contain: question word + operator + at least 2 numbers
    const hasQuestionWord = /^(колко|какво|как)\s+/.test(m);
    const hasOperator = /плюс|минус|умножено|разделено|\+|-|×|÷|\*|\//.test(m);
    const hasMultipleNumbers = /(нула|едно|две|три|четири|пет|шест|седем|осем|девет|десет|\d+).*?(нула|едно|две|три|четири|пет|шест|седем|осем|девет|десет|\d+)/.test(m);
    const isComplete = hasQuestionWord && hasOperator && hasMultipleNumbers;
    return isComplete;
  }
  if (lang === "es") {
    const hasQuestionWord = /^(cuánto|qué|cómo)\s+/.test(m);
    const hasOperator = /más|menos|multiplicado|dividido|\+|-|×|÷|\*|\//.test(m);
    const hasMultipleNumbers = /(\d+|cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez).*?(\d+|cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)/.test(m);
    return hasQuestionWord && hasOperator && hasMultipleNumbers;
  }
  if (lang === "en") {
    const hasQuestionWord = /^(how|what|which)\s+/.test(m);
    const hasOperator = /plus|minus|times|divided|\+|-|×|÷|\*|\//.test(m);
    const hasMultipleNumbers = /(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten).*?(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten)/.test(m);
    return hasQuestionWord && hasOperator && hasMultipleNumbers;
  }
  return false;
}

function parseBulgarianSpokenMath(m: string): { expression: string; type: "full_question" | "short_answer" | null } | null {
  // Parses Bulgarian spoken math like "пет плюс три" -> "5 + 3"
  // Returns null if not a recognizable math phrase
  
  const bgToNum: Record<string, number> = {
    "нула": 0, "едно": 1, "две": 2, "три": 3, "четири": 4, "пет": 5,
    "шест": 6, "седем": 7, "осем": 8, "девет": 9, "десет": 10,
    "единадесет": 11, "дванадесет": 12, "тринадесет": 13, "четиринадесет": 14, "петнадесет": 15,
    "шестнадесет": 16, "седемнадесет": 17, "осемнадесет": 18, "деветнадесет": 19, "двадесет": 20,
    "един": 1, "два": 2,
  };
  
  // Map operators to symbols (longer operators first to avoid partial matches)
  const opMap: Record<string, string> = {
    // Division synonyms
    "разделено на": "/",
    "раздели на": "/",
    "делено на": "/",
    "разделено": "/",
    "делено": "/",
    // Multiplication synonyms
    "умножено по": "*",
    "умножи по": "*",
    "по": "*",
    // Addition synonyms
    "събери с": "+",
    "събрано с": "+",
    "плюс": "+",
    // Subtraction synonyms
    "извади": "-",
    "без": "-",
    "минус": "-",
  };

  let normalized = m.toLowerCase().trim();
  
  // Try to parse as spoken math: "число оператор число"
  // e.g., "пет плюс три", "осем разделено на две"
  
  // Sort operators by length (longest first) to avoid partial matches
  const sortedOps = Object.entries(opMap).sort((a, b) => b[0].length - a[0].length);
  
  for (const [op, sym] of sortedOps) {
    if (normalized.includes(op)) {
      const parts = normalized.split(op).map(p => p.trim());
      if (parts.length === 2) {
        const leftNum = bgToNum[parts[0]];
        const rightNum = bgToNum[parts[1]];
        if (leftNum !== undefined && rightNum !== undefined) {
          const expr = `${leftNum} ${sym} ${rightNum}`;
          // Check if it's a question (starts with "колко", etc.)
          const isQuestion = /^(колко|какво)/.test(m.toLowerCase());
          console.log("[BG_SPOKEN_MATH_DETECTED]", { raw: m, parsed: expr, synonym: op });
          return {
            expression: expr,
            type: isQuestion ? "full_question" : "short_answer",
          };
        }
      }
    }
  }
  
  return null;
}

function looksLikeBulgarianAnswer(m: string): boolean {
  const bgNumbers = [
    "нула","едно","две","три","четири","пет","шест","седем","осем","девет",
    "десет","единадесет","дванадесет","тринадесет","четиринадесет","петнадесет",
    "шестнадесет","седемнадесет","осемнадесет","деветнадесет","двадесет",
    "трийсет","четирийсет","петдесет","шейсет","седемдесет","осемдесет",
    "деветдесет","един","два",
  ];
  return bgNumbers.some((n) => m.includes(n));
}

// ─── Math Hint Generator ─────────────────────────────────────────────────────

function getMathHint(
  a: number,
  b: number,
  operation: Operation,
  childName: string,
  lang: Lang
): string {
  const emoji = "🐼";
  const sym = { addition: "+", subtraction: "-", multiplication: "×", division: "÷" }[operation];

  if (lang === "bg") {
    const hints: Record<Operation, string> = {
      addition: `${emoji} ${childName}, опитай да броиш на пръсти! Вземи ${a} и добави ${b} едно по едно. Какво излиза?`,
      subtraction: `${emoji} ${childName}, представи си ${a} ябълки и вземаш ${b} от тях. Колко остават?`,
      multiplication: `${emoji} ${childName}, умножението е повторно събиране! ${a} × ${b} е като да добавяш ${a} точно ${b} пъти.`,
      division: `${emoji} ${childName}, раздели ${a} предмета на ${b} равни групи. Колко ще влязат в една група?`,
    };
    return hints[operation];
  }
  if (lang === "es") {
    const hints: Record<Operation, string> = {
      addition: `${emoji} ${childName}, ¡intenta contar con los dedos! Toma ${a} y añade ${b} uno por uno. ¿Qué obtienes?`,
      subtraction: `${emoji} ${childName}, imagina ${a} manzanas y quitas ${b}. ¿Cuántas quedan?`,
      multiplication: `${emoji} ${childName}, ¡la multiplicación es suma repetida! ${a} × ${b} es como sumar ${a} exactamente ${b} veces.`,
      division: `${emoji} ${childName}, divide ${a} objetos en ${b} grupos iguales. ¿Cuántos van en cada grupo?`,
    };
    return hints[operation];
  }
  const hints: Record<Operation, string> = {
    addition: `${emoji} ${childName}, try counting on your fingers! Take ${a} and add ${b} one by one. What do you get?`,
    subtraction: `${emoji} ${childName}, imagine ${a} apples and you take away ${b}. How many are left?`,
    multiplication: `${emoji} ${childName}, multiplication is repeated addition! ${a} × ${b} means adding ${a} exactly ${b} times.`,
    division: `${emoji} ${childName}, split ${a} objects into ${b} equal groups. How many go in each group?`,
  };
  return hints[operation];
}

// ─── State Writers ────────────────────────────────────────────────────────────

async function storeNewTask(
  userId: number,
  childId: number,
  module: string,
  a: number,
  b: number,
  task: string,
  operation: Operation
): Promise<number> {
  // Clear ALL existing active_question records for this child+module first
  await db
    .delete(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "active_question"),
        eq(memoriesTable.module, module)
      )
    )
    .catch(() => {});

  const [inserted] = await db
    .insert(memoriesTable)
    .values({
      userId,
      childId,
      type: "active_question",
      content: JSON.stringify({ a, b, task, operation, createdAt: new Date().toISOString() }),
      module,
    })
    .returning();

  return inserted.id;
}

async function clearActiveQuestion(childId: number, module: string): Promise<void> {
  await db
    .delete(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "active_question"),
        eq(memoriesTable.module, module)
      )
    )
    .catch(() => {});
}

async function storePostSuccess(
  userId: number,
  childId: number,
  module: string
): Promise<void> {
  await db
    .insert(memoriesTable)
    .values({
      userId,
      childId,
      type: "post_success_followup",
      content: JSON.stringify({ lastDifficulty: "medium", createdAt: new Date().toISOString() }),
      module,
    })
    .catch(() => {});
}

async function clearPostSuccess(childId: number, module: string): Promise<void> {
  await db
    .delete(memoriesTable)
    .where(
      and(
        eq(memoriesTable.childId, childId),
        eq(memoriesTable.type, "post_success_followup"),
        eq(memoriesTable.module, module)
      )
    )
    .catch(() => {});
}

async function awardXp(
  childId: number,
  currentXp: number,
  xpReward: number
): Promise<void> {
  await db
    .update(childrenTable)
    .set({ xp: currentXp + xpReward })
    .where(eq(childrenTable.id, childId))
    .catch(() => {});
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function handleJuniorChat(
  userId: number,
  childId: number,
  module: string,
  rawMessage: string,
  context: JuniorContext
): Promise<string> {
  const lang = getLang(context.language);
  const fallbackName = lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend";
  const childName = context.childName ?? fallbackName;
  const msg = rawMessage.trim();

  // ── 1. Read current session state from DB (always fresh) ─────────────────
  const state = await readSessionState(childId, module);
  console.log("[JUNIOR_CHAT] state", {
    hasActiveQ: !!state.activeQuestion,
    postSuccess: !!state.postSuccessId,
    operation: state.activeQuestion?.operation,
  });

  // ── 1b. Subject router (runs before intent detection, highest priority) ───
  //
  // If the child explicitly requests a subject ("искам български", "bulgarian
  // language", "да учим математика"…) we handle it immediately and skip the
  // math intent pipeline entirely for bulgarian_language requests.

  const requestedSubject = detectSubjectRequest(msg, lang);
  console.log("[JUNIOR_CHAT] requestedSubject:", requestedSubject);

  if (requestedSubject === "bulgarian_language") {
    const grade = context.grade ?? 1;
    const topicId = getDefaultBulgarianTopic(grade);
    const charEmoji = getCharEmoji(context.aiCharacter);

    // Persist active subject state for teacher report / future reference
    await updateActiveSubject(
      userId, childId, module,
      "bulgarian_language", topicId,
      grade, "BG",
    ).catch(() => {});

    // Store the lesson state so we can evaluate the next answer
    await storeBulgarianLesson(userId, childId, module, topicId, grade).catch(() => {});

    console.log("[JUNIOR_CHAT] routing → bulgarian_language", { grade, topicId });
    // Start with question 0 for new lesson
    return getBulgarianLessonPrompt(grade, topicId, childName, charEmoji, 0);
  }

  if (requestedSubject === "mathematics") {
    const grade = context.grade ?? 1;
    // Update active subject then fall through to math intent detection below
    await updateActiveSubject(
      userId, childId, module,
      "mathematics", null,
      grade, context.country ?? "BG",
    ).catch(() => {});
    console.log("[JUNIOR_CHAT] routing → mathematics (continuing math engine)");
    // Do NOT return here — fall through to intent detection which handles math
  }

  // ── 2. Classify intent ───────────────────────────────────────────────────
  const intent = detectIntent(msg, state, lang);
  console.log("[JUNIOR_CHAT] intent:", intent, "| msg:", msg);
  
  // ── Task breakout: conversational msg while in task → clear task context ──
  if (state.activeQuestion && intent === "unknown" && isEducationalQuestion(msg.toLowerCase().trim(), lang)) {
    console.log("[TASK_CONTEXT_RESET] clearing active task", { activeOp: state.activeQuestion.operation, intent, msg });
    await clearActiveQuestion(childId, module);
    // Clear from state so downstream logic doesn't see it
    state.activeQuestion = null;
  }
  
  // ── Task continue check ──────────────────────────────────────────────────
  if (state.activeQuestion && (intent === "math_answer" || intent === "explain_current_task")) {
    console.log("[TASK_CONTEXT_KEPT] continuing in task", { operation: state.activeQuestion.operation, intent });
  }

  // ── 3. Route to handler ──────────────────────────────────────────────────
  if (intent === "free_question") {
    console.log("[FREE_CHAT_REPLY_PATH]", "getFreeQuestionReply");
    return getFreeQuestionReply(msg, context, childName, lang);
  }

  // ── CHANGE_OPERATION ─────────────────────────────────────────────────────
  if (intent === "change_operation") {
    const op = detectMathOperationSwitch(msg.toLowerCase(), lang)!;
    const adaptiveProfile = await getAdaptiveProfile(childId);
    const recommendedDifficulty = getRecommendedDifficulty(adaptiveProfile, "mathematics");
    const { a, b, task, operation } = generateMathTask(op, recommendedDifficulty);
    await clearPostSuccess(childId, module);
    await storeNewTask(userId, childId, module, a, b, task, operation as Operation);
    console.log("[JUNIOR_CHAT] change_operation", { op, a, b, task, difficulty: recommendedDifficulty });
    return getMathTaskPrompt(a, b, operation, childName, lang);
  }

  // ── NEW_MATH_TASK ────────────────────────────────────────────────────────
  if (intent === "new_math_task") {
    const requestedOp = detectMathOperationSwitch(msg.toLowerCase(), lang);
    const op = requestedOp || "addition";
    const adaptiveProfile = await getAdaptiveProfile(childId);
    const recommendedDifficulty = getRecommendedDifficulty(adaptiveProfile, "mathematics");
    const { a, b, task, operation } = generateMathTask(op as Operation, recommendedDifficulty);
    await clearPostSuccess(childId, module);
    await storeNewTask(userId, childId, module, a, b, task, operation as Operation);
    console.log("[JUNIOR_CHAT] new_math_task", { op, a, b, task, difficulty: recommendedDifficulty });
    return getMathTaskPrompt(a, b, operation, childName, lang);
  }

  // ── NEXT_TASK (after post-success continue) ───────────────────────────────
  if (intent === "next_task") {
    const requestedOp = detectMathOperationSwitch(msg.toLowerCase(), lang);
    const lastOp = state.activeQuestion?.operation ?? "addition";
    
    // Read adaptive profile and determine difficulty/weak topic preference
    const adaptiveProfile = await getAdaptiveProfile(childId);
    const recommendedDifficulty = getRecommendedDifficulty(adaptiveProfile, "mathematics");
    const shouldReviewWeak = shouldReviewWeakTopic(adaptiveProfile, "mathematics");
    
    // If in review mode and there's a weak topic, prefer that operation
    let op = requestedOp || lastOp;
    if (shouldReviewWeak && adaptiveProfile.weakTopics.length > 0) {
      // Find weak operation that matches our math operations
      const weakOp = adaptiveProfile.weakTopics.find(t =>
        ["addition", "subtraction", "multiplication", "division"].includes(t)
      );
      if (weakOp) {
        op = weakOp as Operation;
      }
    }
    
    const { a, b, task, operation } = generateMathTask(op as Operation, recommendedDifficulty);
    await clearPostSuccess(childId, module);
    await storeNewTask(userId, childId, module, a, b, task, operation as Operation);
    console.log("[JUNIOR_CHAT] next_task", { op, a, b, task, difficulty: recommendedDifficulty });
    return getMathTaskPrompt(a, b, operation, childName, lang);
  }

  // ── MATH_ANSWER ───────────────────────────────────────────────────────────
  if (intent === "math_answer" && state.activeQuestion) {
    // Read the EXACT values from the fresh DB record (never from cached state)
    const { id: aqId, a, b, operation } = state.activeQuestion;
    const { correct, expected } = evaluateMathAnswer(a, b, operation, msg);
    console.log("[JUNIOR_CHAT] math_answer", { a, b, operation, msg, correct, expected });

    // Track adaptive learning profile
    await updateAdaptiveProfile(userId, childId, "mathematics", operation, correct);

    if (correct) {
      await clearActiveQuestion(childId, module);
      await storePostSuccess(userId, childId, module);
      await awardXp(childId, context.childXp ?? 0, 3);
    }

    return getMathFeedback(a, b, operation, msg, childName, lang, correct);
  }

  // ── EXPLAIN_CURRENT_TASK ──────────────────────────────────────────────────
  if (intent === "explain_current_task" && state.activeQuestion) {
    const { a, b, operation } = state.activeQuestion;
    console.log("[JUNIOR_CHAT] explain_current_task", { a, b, operation });
    // Do NOT mark right or wrong — just give a hint
    return getMathHint(a, b, operation, childName, lang);
  }

  // ── EARLY EXIT for conversational messages ────────────────────────────────
  // Greetings, free questions, and unknown inputs must never be evaluated as
  // lesson answers. Return the AI fallback immediately and skip everything below.
  if (intent === "small_talk" || intent === "free_question" || intent === "unknown") {
    if (state.postSuccessId !== null) {
      await clearPostSuccess(childId, module);
    }
    console.log("[JUNIOR_CHAT] free_chat / early_return — skipping lesson eval", { intent });
    const reply = await getAIResponse(module, msg, context);
    console.log("[FREE_CHAT_REPLY_TEXT]", reply);
    console.log("[FREE_CHAT_FALLBACK_USED]", intent === "unknown");
    return reply;
  }

  // ── BULGARIAN_LESSON_ANSWER ────────────────────────────────────────────────
  // Reached only when intent is structural (not small_talk / free_question / unknown).
  // Evaluates the message as an answer to the active lesson prompt.
  const bgLessonState = await readBulgarianLessonState(childId, module);
  if (bgLessonState && requestedSubject === null) {
    const grade = bgLessonState.grade;
    const topicId = bgLessonState.topicId as any;
    const evaluation = evaluateBulgarianLessonAnswer(
      { grade, topicId, questionIndex: bgLessonState.currentQuestionIndex },
      msg,
    );

    console.log("[JUNIOR_CHAT] bulgarian_lesson_answer", {
      topicId,
      grade,
      correct: evaluation.correct,
    });

    // Record the attempt
    await recordTopicAttempt(childId, "bulgarian_language", topicId, grade, evaluation.correct);

    // Track adaptive learning profile
    await updateAdaptiveProfile(userId, childId, "bulgarian_language", topicId, evaluation.correct);

    // Check for progression
    const progression = await checkTopicProgression(
      childId,
      "bulgarian_language",
      topicId,
      grade,
    );

    console.log("[JUNIOR_CHAT] progression_check", {
      successRate: progression.successRate,
      advancedToNext: progression.advancedToNext,
      markedWeak: progression.markedWeak,
    });

    // Award XP for correct answer
    if (evaluation.correct) {
      await awardXp(childId, context.childXp ?? 0, 2);
    }

    // Build response: feedback + next prompt if advancing
    const charEmoji = getCharEmoji(context.aiCharacter);
    let response = "";
    
    // Track attempts and generate friendly feedback
    const qIndex = bgLessonState.currentQuestionIndex;
    const attempts = bgLessonState.attemptsPerQuestion[qIndex] ?? 0;
    
    if (evaluation.correct) {
      // Correct answer: short, positive feedback
      const positiveMessages = ["Браво!", "Чудесно!", "Страхотно!", "Точно така!"];
      const feedbackMsg = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
      response = `${feedbackMsg}\n\n${evaluation.explanation}`;
    } else {
      // Wrong answer: friendly feedback based on attempt count
      if (attempts === 0) {
        // First wrong attempt: encourage to try again
        response = `Почти! Помисли още малко.\n\nОпитай пак!`;
      } else if (attempts === 1) {
        // Second wrong attempt: give a hint using canonical answer if available
        response = `Почти! Подсказка: ${evaluation.explanation}`;
      } else {
        // Third+ wrong attempt: show the correct answer
        response = `Отговорът е: ${evaluation.explanation}`;
      }
    }

    if (progression.advancedToNext && progression.nextTopicId) {
      // Read adaptive profile to check for weak topic preference
      const adaptiveProfile = await getAdaptiveProfile(childId);
      const shouldReviewWeak = shouldReviewWeakTopic(adaptiveProfile, "bulgarian_language");
      
      // If in review mode and weak topics exist, prefer weak Bulgarian topic
      let topicToShow = progression.nextTopicId;
      if (shouldReviewWeak && adaptiveProfile.weakTopics.length > 0) {
        // Find a weak Bulgarian topic to review
        const weakBgTopic = adaptiveProfile.weakTopics.find(t => 
          t.startsWith("reading_") || t.startsWith("spelling_") || t === "bulgarian_language"
        );
        if (weakBgTopic && weakBgTopic !== "bulgarian_language") {
          topicToShow = weakBgTopic;
        }
      }
      
      // Prepare next lesson (reset question index to 0 for new topic)
      await storeBulgarianLesson(userId, childId, module, topicToShow, grade, 0, {});
      const nextPrompt = getBulgarianLessonPrompt(grade, topicToShow, childName, charEmoji, 0);
      response += `\n\n✨ Браво на теб! Ти напредва! ✨\n\n${nextPrompt}`;
    } else if (evaluation.correct) {
      // On correct answer within a topic, try to advance to next question if available
      const nextQIndex = bgLessonState.currentQuestionIndex + 1;
      await storeBulgarianLesson(userId, childId, module, topicId, grade, nextQIndex, bgLessonState.attemptsPerQuestion);
      // Show the next question prompt if available
      const nextQuestionPrompt = getBulgarianLessonPrompt(grade, topicId, childName, charEmoji, nextQIndex);
      response += `\n\n✨ Отлично! Продължи! ✨\n\n${nextQuestionPrompt}`;
    } else {
      // On wrong answer, stay on same question (don't increment) but track the attempt
      const updatedAttempts = { ...bgLessonState.attemptsPerQuestion, [qIndex]: attempts + 1 };
      await storeBulgarianLesson(userId, childId, module, topicId, grade, bgLessonState.currentQuestionIndex, updatedAttempts);
    }

    // Note: Do NOT clear lesson state here. It persists so subsequent answers on the
    // same topic stay in the lesson evaluation flow. It's only cleared when:
    // - User switches subject (subject router), or
    // - Topic is completed and we store the NEXT topic (line 725)

    return response;
  }

  // ── STOP (inside post_success or free chat) ───────────────────────────────
  if (state.postSuccessId !== null) {
    // User said something unrecognised after success — clear state, go to free chat
    await clearPostSuccess(childId, module);
  }

  // ── FREE_QUESTION / SMALL_TALK / UNKNOWN ─────────────────────────────────
  // These paths never touch math state, so the active question remains intact
  console.log("[JUNIOR_CHAT] free_chat / fallback", { intent });
  return await getAIResponse(module, msg, context);
}
