import OpenAI from "openai";
import { getLessonContent, type LessonContent } from "./lessonContent";

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

// ─── Variety framing contexts (rotated per call to reduce repetition) ─────────

const FRAMING_VARIANTS = [
  "Use a real-world scenario with everyday objects the child knows.",
  "Frame the problems in a story format with a small adventure.",
  "Use nature and animals as the theme for all examples.",
  "Use food, cooking, and kitchen objects as the theme.",
  "Use sports, games, and outdoor play as the theme.",
];

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

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildLessonSystemPrompt(): string {
  return `You are AYA, a warm and encouraging AI teacher for primary school children (ages 6–10).
Your lessons are clear, kind, age-appropriate, and educationally sound.
Return only valid JSON — no markdown, no commentary, just the JSON object.`;
}

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

  const framingIdx = Math.floor(Math.random() * FRAMING_VARIANTS.length);
  const framing = FRAMING_VARIANTS[framingIdx];

  const modeHint =
    mode === "weak"
      ? `The child has been struggling with this topic. Use very simple, short sentences. Add extra encouragement. Break down each step carefully. Start with the very basics.`
      : mode === "strong"
      ? `The child is doing very well. You can add a small challenge or interesting extension. Go slightly deeper than the standard curriculum.`
      : `Use standard level appropriate for ${gradeLabel}.`;

  const bulgarianNote =
    lang === "bg"
      ? `\nThis is a Bulgarian child following the МОН (Ministry of Education) curriculum for ${gradeLabel}. Use Bulgarian vocabulary and examples from Bulgarian everyday life, nature, or culture where appropriate.`
      : "";

  return `Generate a complete lesson in ${langName} for:
- Subject: ${subjectLabel}
- Topic: ${topicLabel}
- Grade: ${gradeLabel}
- Difficulty context: ${modeHint}
- Variety framing: ${framing}${bulgarianNote}

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

// ─── Validator ────────────────────────────────────────────────────────────────

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

// ─── Public API ───────────────────────────────────────────────────────────────

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
        { role: "system", content: buildLessonSystemPrompt() },
        { role: "user", content: buildLessonUserPrompt(subjectId, topicId, grade, lang, mode) },
      ],
      max_tokens: 2048,
      temperature: 0.8,
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
