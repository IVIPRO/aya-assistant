import OpenAI from "openai";
import { getLessonContent, type LessonContent } from "./lessonContent";
import {
  getTopicCategory,
  getTopicPromptGuidance,
  getTopicAlignedFraming,
  getCoreConsistencyRules,
  isExerciseConsistent,
  getSafeTemplates,
} from "./taskConsistencyGuard";

type LangCode = "en" | "bg" | "es" | "de" | "fr";
export type LessonMode = "weak" | "normal" | "strong";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Subject / Topic display names ────────────────────────────────────────────

const SUBJECT_LABELS: Record<string, Record<string, string>> = {
  en: {
    "mathematics": "Mathematics",
    "bulgarian-language": "Bulgarian Language",
    "reading-literature": "Reading & Literature",
    "english-language": "English Language",
    "nature-science": "Nature & Science",
    "social-studies": "Social Studies",
    "logic-thinking": "Logic & Thinking",
  },
  bg: {
    "mathematics": "Математика",
    "bulgarian-language": "Български език",
    "reading-literature": "Четене и литература",
    "english-language": "Английски език",
    "nature-science": "Природен свят",
    "social-studies": "Човекът и обществото",
    "logic-thinking": "Логическо мислене",
  },
  es: {
    "mathematics": "Matemáticas",
    "bulgarian-language": "Lengua búlgara",
    "reading-literature": "Lectura y literatura",
    "english-language": "Inglés",
    "nature-science": "Ciencias naturales",
    "social-studies": "Estudios sociales",
    "logic-thinking": "Pensamiento lógico",
  },
};

const TOPIC_LABELS: Record<string, Record<string, string>> = {
  en: {
    "addition": "Addition",
    "subtraction": "Subtraction",
    "multiplication": "Multiplication",
    "division": "Division",
    "word-problems": "Word Problems",
    "letters-sounds": "Letters & Sounds",
    "reading-sentences": "Reading Sentences",
    "spelling": "Spelling",
    "punctuation": "Punctuation",
    "grammar-basics": "Grammar Basics",
    "nouns": "Nouns",
    "verbs": "Verbs",
    "adjectives": "Adjectives",
    "story-comprehension": "Story Comprehension",
    "poetry": "Poetry",
    "fables": "Fables & Tales",
    "greetings": "Greetings",
    "numbers-en": "Numbers in English",
    "colors-shapes": "Colors & Shapes",
    "family-home": "Family & Home",
    "animals-plants": "Animals & Plants",
    "seasons-weather": "Seasons & Weather",
    "human-body": "Human Body",
    "patterns-sequences": "Patterns & Sequences",
    "sorting-grouping": "Sorting & Grouping",
    "comparisons": "Comparisons",
    "maps-directions": "Maps & Directions",
    "community-helpers": "Community Helpers",
    "history-stories": "History Stories",
  },
  bg: {
    "addition": "Събиране",
    "subtraction": "Изваждане",
    "multiplication": "Умножение",
    "division": "Деление",
    "word-problems": "Задачи с думи",
    "letters-sounds": "Букви и звуци",
    "reading-sentences": "Четене на изречения",
    "spelling": "Правопис",
    "punctuation": "Пунктуация",
    "grammar-basics": "Основи на граматиката",
    "nouns": "Съществителни имена",
    "verbs": "Глаголи",
    "adjectives": "Прилагателни имена",
    "story-comprehension": "Разбиране на текст",
    "poetry": "Поезия",
    "fables": "Басни и приказки",
    "greetings": "Поздрави",
    "numbers-en": "Числа на английски",
    "colors-shapes": "Цветове и форми",
    "family-home": "Семейство и дом",
    "animals-plants": "Животни и растения",
    "seasons-weather": "Сезони и времето",
    "human-body": "Човешко тяло",
    "patterns-sequences": "Закономерности и редици",
    "sorting-grouping": "Сортиране и групиране",
    "comparisons": "Сравнения",
    "maps-directions": "Карти и посоки",
    "community-helpers": "Хора и техните професии",
    "history-stories": "Исторически разкази",
  },
  es: {
    "addition": "Suma",
    "subtraction": "Resta",
    "multiplication": "Multiplicación",
    "division": "División",
    "word-problems": "Problemas con palabras",
    "letters-sounds": "Letras y sonidos",
    "reading-sentences": "Lectura de oraciones",
    "spelling": "Ortografía",
    "punctuation": "Puntuación",
    "grammar-basics": "Gramática básica",
    "nouns": "Sustantivos",
    "verbs": "Verbos",
    "adjectives": "Adjetivos",
    "story-comprehension": "Comprensión de textos",
    "poetry": "Poesía",
    "fables": "Fábulas y cuentos",
    "greetings": "Saludos",
    "numbers-en": "Números en inglés",
    "colors-shapes": "Colores y formas",
    "family-home": "Familia y hogar",
    "animals-plants": "Animales y plantas",
    "seasons-weather": "Estaciones y clima",
    "human-body": "Cuerpo humano",
    "patterns-sequences": "Patrones y secuencias",
    "sorting-grouping": "Clasificación y agrupación",
    "comparisons": "Comparaciones",
    "maps-directions": "Mapas y direcciones",
    "community-helpers": "Ayudantes de la comunidad",
    "history-stories": "Historias de la historia",
  },
};

function getLangName(lang: LangCode): string {
  const names: Record<LangCode, string> = {
    en: "English",
    bg: "Bulgarian",
    es: "Spanish",
    de: "German",
    fr: "French",
  };
  return names[lang] ?? "English";
}

function getNormalizedLang(lang: LangCode): "en" | "bg" | "es" {
  if (lang === "bg") return "bg";
  if (lang === "es") return "es";
  return "en";
}

function getSubjectLabel(subjectId: string, lang: LangCode): string {
  const normalized = getNormalizedLang(lang);
  return SUBJECT_LABELS[normalized]?.[subjectId] ?? subjectId;
}

function getTopicLabel(topicId: string, lang: LangCode): string {
  const normalized = getNormalizedLang(lang);
  return TOPIC_LABELS[normalized]?.[topicId] ?? topicId;
}

function getGradeLabel(grade: number, lang: LangCode): string {
  if (lang === "bg") return `${grade} клас`;
  if (lang === "es") return `${grade}º de Primaria`;
  if (lang === "de") return `Klasse ${grade}`;
  return `Grade ${grade}`;
}

// ─── Lesson System Prompt ─────────────────────────────────────────────────────

function buildLessonSystemPrompt(lang?: LangCode): string {
  const bgLock =
    lang === "bg"
      ? `\nCRITICAL LANGUAGE RULE: You MUST generate ALL text in Bulgarian (Български език). Do NOT use Russian. Bulgarian and Russian both use the Cyrillic script but are completely different languages with different words and grammar. Every single word in the JSON output must be Bulgarian — not Russian, not a mix. When in doubt, use simple, short Bulgarian words suitable for primary school children.`
      : "";
  return `You are AYA, a warm and encouraging AI teacher for primary school children (ages 6–10).
Your lessons are clear, kind, age-appropriate, and educationally sound.
Return only valid JSON — no markdown, no commentary, just the JSON object.${bgLock}`;
}

// ─── Lesson User Prompt ───────────────────────────────────────────────────────

function buildLessonUserPrompt(
  subjectId: string,
  topicId: string,
  grade: number,
  lang: LangCode,
  mode: LessonMode,
): string {
  const subjectLabel = getSubjectLabel(subjectId, lang);
  const topicLabel = getTopicLabel(topicId, lang);
  const gradeLabel = getGradeLabel(grade, lang);
  const langName = getLangName(lang);

  // Use topic-aligned framing only — no random cross-subject themes
  const category = getTopicCategory(topicId);
  const framing = getTopicAlignedFraming(category);

  const modeHint =
    mode === "weak"
      ? `The child has been struggling with this topic. Use very simple, short sentences. Add extra encouragement. Break down each step carefully. Start with the very basics.`
      : mode === "strong"
      ? `The child is doing very well. You can add a small challenge or interesting extension. Go slightly deeper than the standard curriculum.`
      : `Use standard level appropriate for ${gradeLabel}.`;

  const bulgarianNote =
    lang === "bg"
      ? `\nThis is a Bulgarian child following the МОН (Ministry of Education) curriculum for ${gradeLabel}. Write ONLY in Bulgarian (Български). Do NOT write in Russian. Bulgarian and Russian share the Cyrillic alphabet but are different languages — use Bulgarian words, Bulgarian grammar, and Bulgarian curriculum examples. Never mix in Russian words or phrases.`
      : "";

  // Get topic-specific guidance
  const topicGuidance = getTopicPromptGuidance(category, topicLabel, topicId, grade);

  return `Generate a complete lesson in ${langName} for:
- Subject: ${subjectLabel}
- Topic: ${topicLabel}
- Grade: ${gradeLabel}
- Difficulty context: ${modeHint}
- Thematic framing: ${framing}${bulgarianNote}

${topicGuidance}

CONSISTENCY REQUIREMENT:
- Every example's "hint" must help understand that specific example's "problem" — not a generic hint.
- Every example's "solution" must be a valid answer to that specific "problem".
- All examples and practice problems must stay within the topic "${topicLabel}".

Return a JSON object matching EXACTLY this schema:
{
  "lesson": {
    "title": "string — topic name, child-friendly (max 8 words)",
    "explanation": "string — 2–4 sentences, simple and clear, suitable for ${gradeLabel}",
    "examples": [
      { "problem": "string", "solution": "string", "hint": "string" },
      { "problem": "string", "solution": "string", "hint": "string" },
      { "problem": "string", "solution": "string", "hint": "string" }
    ],
    "tip": "string — one practical memory tip or trick (max 2 sentences)"
  },
  "practice": {
    "instructions": "string — brief instructions for the practice section",
    "problems": [
      { "question": "string", "answer": "string" },
      { "question": "string", "answer": "string" },
      { "question": "string", "answer": "string" },
      { "question": "string", "answer": "string" },
      { "question": "string", "answer": "string" }
    ]
  },
  "quiz": {
    "instructions": "string — brief instructions for the quiz",
    "questions": [
      { "question": "string", "options": ["A", "B", "C", "D"], "correctIndex": 0 },
      { "question": "string", "options": ["A", "B", "C", "D"], "correctIndex": 1 },
      { "question": "string", "options": ["A", "B", "C", "D"], "correctIndex": 2 },
      { "question": "string", "options": ["A", "B", "C", "D"], "correctIndex": 0 }
    ]
  }
}

Rules:
- All text content must be in ${langName}.
- For mathematics topics: use actual numbers appropriate for ${gradeLabel}. 5 practice problems must all be solvable math expressions with numeric answers.
- For language/reading topics: use age-appropriate vocabulary and sentences.
- quiz.questions must have EXACTLY 4 items. Each must have EXACTLY 4 options.
- correctIndex must be 0, 1, 2, or 3 (pointing to the correct option in the array).
- Do NOT use any placeholders like "A", "B", "C", "D" as the actual option values — replace with real answers.
- practice.problems must have EXACTLY 5 items.
- lesson.examples must have EXACTLY 3 items.`;
}

// ─── Lesson Validator ─────────────────────────────────────────────────────────

function validateLessonContent(raw: unknown): LessonContent {
  if (typeof raw !== "object" || raw === null) throw new Error("Not an object");
  const obj = raw as Record<string, unknown>;

  const lesson = obj["lesson"] as Record<string, unknown>;
  if (!lesson?.title || !lesson?.explanation || !Array.isArray(lesson?.examples) || !lesson?.tip) {
    throw new Error("Invalid lesson shape");
  }
  if (lesson.examples.length < 3) throw new Error("Not enough examples");

  const practice = obj["practice"] as Record<string, unknown>;
  if (!practice?.instructions || !Array.isArray(practice?.problems)) {
    throw new Error("Invalid practice shape");
  }
  if (practice.problems.length < 3) throw new Error("Not enough practice problems");

  const quiz = obj["quiz"] as Record<string, unknown>;
  if (!quiz?.instructions || !Array.isArray(quiz?.questions)) {
    throw new Error("Invalid quiz shape");
  }
  if (quiz.questions.length < 3) throw new Error("Not enough quiz questions");

  // Validate quiz question structure
  for (const q of (quiz.questions as unknown[])) {
    const qObj = q as Record<string, unknown>;
    if (!qObj.question || !Array.isArray(qObj.options) || qObj.options.length < 4) {
      throw new Error("Invalid quiz question structure");
    }
    const idx = Number(qObj.correctIndex);
    if (isNaN(idx) || idx < 0 || idx >= (qObj.options as unknown[]).length) {
      throw new Error("Invalid correctIndex");
    }
  }

  return raw as LessonContent;
}

// ─── Exercise Batch Types ─────────────────────────────────────────────────────

export interface ExerciseItem {
  question: string;
  correctAnswer: string;
  options: string[] | null;
  hint: string | null;
  explanation: string | null;
  exerciseType: "multiple-choice" | "open-ended";
  difficulty: "easy" | "medium" | "hard";
}

// ─── Exercise Batch Prompt ────────────────────────────────────────────────────

function buildExerciseBatchPrompt(
  subjectId: string,
  topicId: string,
  grade: number,
  lang: LangCode,
  mode: LessonMode,
  count: number,
): string {
  const subjectLabel = getSubjectLabel(subjectId, lang);
  const topicLabel = getTopicLabel(topicId, lang);
  const gradeLabel = getGradeLabel(grade, lang);
  const langName = getLangName(lang);

  const difficultyInstruction =
    mode === "weak"
      ? `Generate mostly EASY exercises (70% easy, 20% medium, 10% hard). Keep problems simple and very short.`
      : mode === "strong"
      ? `Generate mostly HARD exercises (20% easy, 30% medium, 50% hard). Add some challenge.`
      : `Mix difficulties evenly (33% easy, 34% medium, 33% hard).`;

  const bulgarianNote =
    lang === "bg"
      ? `\nThis is a Bulgarian child following the МОН curriculum for ${gradeLabel}. Write ONLY in Bulgarian (Български). Do NOT write in Russian. Bulgarian and Russian share the Cyrillic alphabet but are completely different languages. Use Bulgarian words, Bulgarian grammar, and age-appropriate Bulgarian examples. Never use Russian words or phrases.`
      : "";

  // Get topic category and specific guidance
  const category = getTopicCategory(topicId);
  const topicGuidance = getTopicPromptGuidance(category, topicLabel, topicId, grade);
  const consistencyRules = getCoreConsistencyRules();
  const framing = getTopicAlignedFraming(category);

  return `Generate exactly ${count} practice exercises in ${langName} for:
- Subject: ${subjectLabel}
- Topic: ${topicLabel}
- Grade: ${gradeLabel}
- ${difficultyInstruction}
- Thematic context: ${framing}${bulgarianNote}

${topicGuidance}

${consistencyRules}

Return a JSON object with this exact structure:
{
  "exercises": [
    {
      "question": "string — clear, age-appropriate question",
      "correctAnswer": "string — the correct answer",
      "options": ["string", "string", "string", "string"] or null,
      "hint": "string — short helpful hint that helps solve THIS specific question",
      "explanation": "string — brief explanation of why THIS answer is correct for THIS question",
      "exerciseType": "multiple-choice" or "open-ended",
      "difficulty": "easy" or "medium" or "hard"
    }
  ]
}

Additional rules:
- Generate EXACTLY ${count} items in the "exercises" array.
- All text content must be in ${langName}.
- For multiple-choice: "correctAnswer" must match one of the "options" exactly (same spelling, same capitalisation).
- No placeholder options like "A", "B", "C", "D" — all options must be real, meaningful answers.
- Never duplicate questions.
- Ensure ALL exercises are different from each other.
- All exercises must stay on topic: "${topicLabel}". Do NOT drift to other subjects.`;
}

// ─── Exercise Batch Validator ─────────────────────────────────────────────────

function validateExerciseBatch(raw: unknown, expectedCount: number): ExerciseItem[] {
  if (typeof raw !== "object" || raw === null) throw new Error("Not an object");
  const obj = raw as Record<string, unknown>;
  const exercises = obj["exercises"];
  if (!Array.isArray(exercises) || exercises.length === 0) throw new Error("No exercises array");

  const result: ExerciseItem[] = [];
  for (const e of exercises) {
    const ex = e as Record<string, unknown>;
    if (!ex.question || !ex.correctAnswer || !ex.exerciseType || !ex.difficulty) continue;
    if (ex.exerciseType === "multiple-choice" && (!Array.isArray(ex.options) || ex.options.length < 2)) continue;

    const item: ExerciseItem = {
      question: String(ex.question),
      correctAnswer: String(ex.correctAnswer),
      options: Array.isArray(ex.options) ? (ex.options as string[]) : null,
      hint: ex.hint ? String(ex.hint) : null,
      explanation: ex.explanation ? String(ex.explanation) : null,
      exerciseType: ex.exerciseType === "open-ended" ? "open-ended" : "multiple-choice",
      difficulty: ex.difficulty === "hard" ? "hard" : ex.difficulty === "easy" ? "easy" : "medium",
    };

    // Apply consistency filter — discard exercises that fail basic consistency checks
    if (!isExerciseConsistent(item)) {
      console.warn(`[EXERCISE_BATCH] Consistency filter removed: "${item.question.slice(0, 60)}..."`);
      continue;
    }

    result.push(item);
  }

  if (result.length < Math.min(expectedCount * 0.5, 5)) {
    throw new Error(`Only ${result.length} valid exercises parsed from ${exercises.length} raw`);
  }
  return result;
}

// ─── Public API: Generate Exercise Batch ──────────────────────────────────────

export async function generateExerciseBatch(
  subjectId: string,
  topicId: string,
  grade: number,
  lang: LangCode,
  mode: LessonMode = "normal",
  count = 30,
): Promise<ExerciseItem[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[EXERCISE_BATCH] No OPENAI_API_KEY — returning empty batch");
    return [];
  }

  console.log(`[EXERCISE_BATCH] Generating ${count}: subject=${subjectId} topic=${topicId} grade=${grade} lang=${lang} mode=${mode}`);

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildLessonSystemPrompt(lang) },
        { role: "user", content: buildExerciseBatchPrompt(subjectId, topicId, grade, lang, mode, count) },
      ],
      max_tokens: 4096,
      temperature: 0.75, // Slightly reduced from 0.9 to reduce creative drift while keeping variety
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    const parsed: unknown = JSON.parse(raw);
    const exercises = validateExerciseBatch(parsed, count);

    // If AI exercises are insufficient, supplement with safe templates
    if (exercises.length < Math.min(count * 0.5, 8) && lang === "bg") {
      const templates = getSafeTemplates(topicId, grade);
      if (templates.length > 0) {
        console.log(`[EXERCISE_BATCH] Supplementing with ${templates.length} safe templates for topic=${topicId}`);
        exercises.unshift(...templates.slice(0, Math.min(templates.length, count - exercises.length)));
      }
    }

    console.log(`[EXERCISE_BATCH] Success: ${exercises.length} exercises generated (topic=${topicId})`);
    return exercises;
  } catch (err) {
    console.error("[EXERCISE_BATCH] Failed:", String(err));

    // Fallback: return safe templates if available for BG locale
    if (lang === "bg") {
      const templates = getSafeTemplates(topicId, grade);
      if (templates.length > 0) {
        console.log(`[EXERCISE_BATCH] Using ${templates.length} safe templates as fallback for topic=${topicId}`);
        return templates;
      }
    }

    return [];
  }
}

// ─── Public API: Generate Full Lesson ────────────────────────────────────────

export async function generateAILesson(
  subjectId: string,
  topicId: string,
  grade: number,
  lang: LangCode,
  mode: LessonMode = "normal",
): Promise<LessonContent> {
  const normalizedLang = getNormalizedLang(lang);

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("No OPENAI_API_KEY configured — falling back to hardcoded content");
    }

    console.log(`[AI_LESSON] Generating: subject=${subjectId} topic=${topicId} grade=${grade} lang=${lang} mode=${mode}`);

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildLessonSystemPrompt(lang) },
        { role: "user", content: buildLessonUserPrompt(subjectId, topicId, grade, lang, mode) },
      ],
      max_tokens: 2048,
      temperature: 0.75, // Reduced from 0.8 to improve consistency
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    const parsed: unknown = JSON.parse(raw);
    const validated = validateLessonContent(parsed);

    console.log(`[AI_LESSON] Success: subject=${subjectId} topic=${topicId} title="${validated.lesson.title}"`);
    return validated;
  } catch (err) {
    console.error("[AI_LESSON] Failed — falling back to hardcoded content:", String(err));
    return getLessonContent(subjectId, topicId, grade, normalizedLang);
  }
}
