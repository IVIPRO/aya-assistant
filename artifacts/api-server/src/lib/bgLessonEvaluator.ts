/**
 * AYA Junior — Bulgarian Lesson Answer Evaluator
 *
 * Provides deterministic, child-friendly evaluation for common BG language exercises:
 * - letter recognition
 * - syllable reading
 * - simple word spelling
 * - sentence completion
 * - reading comprehension
 *
 * Returns: { correct: boolean, explanation: string }
 */

export interface EvaluationResult {
  correct: boolean;
  explanation: string;
  feedbackBg: string; // "Браво!" or "Почти!"
}

export interface QuestionItem {
  questionIndex: number;
  questionText: string;
  acceptedAnswers: string[];
  canonicalAnswer?: string; // Primary answer for feedback (shortest/cleanest form)
}

// ─── Question-Specific Q&A Database ──────────────────────────────────────────

/**
 * Grade 2 Reading Comprehension: "Мария и Пухче"
 * Structured Q&A for validation against CURRENT question only.
 */
const readingComprehensionGrade2: QuestionItem[] = [
  {
    questionIndex: 0,
    questionText: "Как се казва котката?",
    acceptedAnswers: ["Пухче", "пухче"],
    canonicalAnswer: "Пухче",
  },
  {
    questionIndex: 1,
    questionText: "Какво обича да прави Пухче?",
    acceptedAnswers: ["спи на слънце", "играе с топка", "топка", "сън"],
    canonicalAnswer: "спи на слънце или играе с топка",
  },
  {
    questionIndex: 2,
    questionText: "С какво го храни Мария?",
    acceptedAnswers: ["рибица", "риба", "рибици"],
    canonicalAnswer: "рибица",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeAnswer(ans: string): string {
  return ans
    .toLowerCase()
    .trim()
    // Remove leading numbering: "1.", "2.", "1)", "2)", etc.
    .replace(/^\d+[\.\)]\s*/i, "")
    // Remove trailing punctuation: ".", ",", "!", "?", ";", ":"
    .replace(/[\.,!?;:]+$/i, "")
    // Strip remaining non-Cyrillic/non-digit/non-space characters
    .replace(/[^а-яё\s0-9]/gi, "")
    .trim(); // Trim again after replacements
}

function isSimilar(actual: string, expected: string, tolerance: number = 0.85): boolean {
  const a = normalizeAnswer(actual);
  const e = normalizeAnswer(expected);

  if (a === e) return true;

  // Levenshtein-inspired similarity for minor typos
  const maxLen = Math.max(a.length, e.length);
  if (maxLen === 0) return true;

  let matches = 0;
  for (let i = 0; i < Math.min(a.length, e.length); i++) {
    if (a[i] === e[i]) matches++;
  }

  const similarity = matches / maxLen;
  return similarity >= tolerance;
}

// ─── Evaluators ───────────────────────────────────────────────────────────────

/**
 * Letter recognition: "Коя буква започва думата 'море'?"
 * Expected answer: "м"
 */
export function evaluateLetterRecognition(studentAnswer: string, correctLetter: string): EvaluationResult {
  const correct = normalizeAnswer(studentAnswer) === normalizeAnswer(correctLetter);

  return {
    correct,
    explanation: correct
      ? `Правилно! Буквата ${correctLetter.toUpperCase()} е начална буква.`
      : `Буквата е ${correctLetter.toUpperCase()}, а не ${studentAnswer.toUpperCase()}. Опитай отново!`,
    feedbackBg: correct ? "Браво!" : "Почти!",
  };
}

/**
 * Syllable reading: "На колко срички е разделена думата 'ябълка'?"
 * Expected answer: "3" or "три"
 */
export function evaluateSyllableCount(studentAnswer: string, correctCount: number): EvaluationResult {
  const normalized = normalizeAnswer(studentAnswer);

  // Accept both digit and word form
  const wordForms: Record<number, string[]> = {
    1: ["1", "едно", "един"],
    2: ["2", "две", "два"],
    3: ["3", "три"],
    4: ["4", "четири"],
    5: ["5", "пет"],
  };

  const isCorrect =
    normalized === String(correctCount) ||
    (wordForms[correctCount] && wordForms[correctCount].includes(normalized));

  return {
    correct: isCorrect,
    explanation: isCorrect
      ? `Да! Думата е разделена на ${correctCount} срички. ✓`
      : `Не съвсем. Думата има ${correctCount} срички. Броя: сричка-сричка-сричка.`,
    feedbackBg: isCorrect ? "Браво!" : "Почти!",
  };
}

/**
 * Simple word spelling: "Напиши думата 'котка'"
 * Expected answer: "котка"
 */
export function evaluateWordSpelling(studentAnswer: string, correctWord: string): EvaluationResult {
  const correct = isSimilar(studentAnswer, correctWord, 0.8); // 80% tolerance for typos

  return {
    correct,
    explanation: correct
      ? `Отличен правопис! Думата '${correctWord}' е правилна.`
      : `Правилното написание е: ${correctWord}. Твой отговор: ${studentAnswer}.`,
    feedbackBg: correct ? "Браво!" : "Почти!",
  };
}

/**
 * Sentence completion: "Слънцето ______."
 * Expected answer: "грее" (or variations)
 */
export function evaluateSentenceCompletion(
  studentAnswer: string,
  acceptableAnswers: string[],
): EvaluationResult {
  const correct = acceptableAnswers.some(ans => isSimilar(studentAnswer, ans, 0.8));
  const expectedStr = acceptableAnswers.slice(0, 2).join(" / ");

  return {
    correct,
    explanation: correct
      ? `Правилно! "${studentAnswer}" е добро продължение.`
      : `Изречението би трябвало: "Слънцето ${expectedStr}."`,
    feedbackBg: correct ? "Браво!" : "Почти!",
  };
}

/**
 * Format feedback with clean canonical answer(s)
 * Deduplicates and shows only the primary/shortest answer form
 */
function formatAcceptedAnswersFeedback(acceptableAnswers: string[]): string {
  if (acceptableAnswers.length === 0) {
    return "Отговорът не е верен.";
  }

  // Deduplicate: normalize all answers and keep unique ones
  const seen = new Set<string>();
  const uniqueAnswers: string[] = [];
  
  for (const ans of acceptableAnswers) {
    const normalized = normalizeAnswer(ans);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniqueAnswers.push(ans);
    }
  }

  // Sort by length (shortest first = most direct answer)
  uniqueAnswers.sort((a, b) => a.length - b.length);

  // Show only the shortest/primary answer, or at most 2 variants
  const mainAnswer = uniqueAnswers[0] || acceptableAnswers[0];
  const secondaryAnswer = uniqueAnswers.length > 1 ? uniqueAnswers[1] : null;

  if (secondaryAnswer) {
    return `Правилният отговор е: ${mainAnswer} или ${secondaryAnswer}.`;
  } else {
    return `Правилният отговор е: ${mainAnswer}.`;
  }
}

/**
 * Reading comprehension: "Кой е главният герой?"
 * Expected answer: any of acceptableAnswers
 */
export function evaluateComprehension(studentAnswer: string, acceptableAnswers: string[]): EvaluationResult {
  const correct = acceptableAnswers.some(ans => isSimilar(studentAnswer, ans, 0.75));

  return {
    correct,
    explanation: correct
      ? `Превъзходно! Разбра си текста правилно.`
      : formatAcceptedAnswersFeedback(acceptableAnswers),
    feedbackBg: correct ? "Браво!" : "Почти!",
  };
}

/**
 * Generic evaluator for custom prompts (fallback if topic type doesn't map)
 * Uses keyword matching for basic comprehension
 */
export function evaluateKeywordMatch(studentAnswer: string, requiredKeywords: string[]): EvaluationResult {
  const ansLower = normalizeAnswer(studentAnswer);
  const keywordsLower = requiredKeywords.map(k => normalizeAnswer(k));

  const matchedCount = keywordsLower.filter(kw => ansLower.includes(kw)).length;
  const correct = matchedCount >= Math.max(1, Math.ceil(requiredKeywords.length / 2));

  return {
    correct,
    explanation: correct
      ? `Добър отговор! Намери си ключовите понятия.`
      : `Опитай да включиш в отговора си някои от: ${requiredKeywords.slice(0, 3).join(", ")}.`,
    feedbackBg: correct ? "Браво!" : "Почти!",
  };
}

// ─── Topic-Specific Evaluation Dispatcher ──────────────────────────────────────

export type BGTopicType =
  | "letters_and_sounds"
  | "vowels_and_consonants"
  | "syllables"
  | "simple_words"
  | "simple_sentences"
  | "reading_comprehension_basic"
  | "nouns_basic"
  | "verbs_basic"
  | "sentence_building"
  | "parts_of_speech_intro"
  | "spelling_rules_basic"
  | "short_text_comprehension"
  | "sentence_parts_intro"
  | "grammar_review"
  | "reading_comprehension_extended"
  | "short_written_response";

export interface EvaluationContext {
  grade: number;
  topicId: BGTopicType;
  questionKey?: string; // For future dynamic Q&A (not used yet)
  questionIndex?: number; // Current question index for multi-question topics
}

/**
 * Evaluate a BG lesson answer based on the topic and question.
 * For now, context-aware but not truly question-specific.
 * Future work: wire to a Q&A database with per-question validation.
 */
/**
 * Topic-specific fallback hints to ensure explanation always matches the topic.
 * Used when generated explanation drifts off-topic.
 */
const TOPIC_FALLBACK_HINTS: Record<string, string> = {
  // Reading/Language
  reading_comprehension_basic: "Прочети внимателното текста отново — ищи ключовите думи в историята.",
  nouns_basic: "Съществителното назовава предмет, място или живо същество. Кое е съществително в текста?",
  verbs_basic: "Глаголът показва действие. Какво действие прави персонажът?",
  sentence_building: "Изречението има подлог (кой?) и сказуемо (какво?). Попълни двете части.",
  simple_words: "Мислей за простите думи — краткосчетени, познати думи.",
  letters_and_sounds: "Фокусирай се на звуковете и буквите — един звук, една буква.",
  syllables: "Брой сричките: раз-де-ли в части и преброй.",
  spelling_rules_basic: "Проверь правилото за правопис — как се пишат правилно тези букви?",
};

/**
 * Validate that an explanation text stays within the topic's semantic field.
 * Returns true if explanation is topic-appropriate, false if it drifts.
 */
function isExplanationOnTopic(explanation: string, topicId: string): boolean {
  if (!explanation || explanation.length < 3) return true; // Empty explanations are okay
  
  const ex = explanation.toLowerCase();
  
  // Simple heuristics: check for obvious cross-topic drift
  const reading_topics = ["reading", "story", "text", "historia", "четене", "история", "текст"];
  const grammar_topics = ["noun", "verb", "adjective", "глагол", "съществител", "прилагател"];
  const sound_topics = ["sound", "letter", "буква", "звук"];
  
  const isReadingTopic = topicId?.includes("reading") || topicId?.includes("story") || topicId?.includes("comprehension");
  const isGrammarTopic = topicId?.includes("noun") || topicId?.includes("verb") || topicId?.includes("adjective");
  const isSoundTopic = topicId?.includes("letter") || topicId?.includes("sound");
  
  // If topic is reading, explanation should not be mainly about grammar or sounds
  if (isReadingTopic && grammar_topics.some(g => ex.includes(g))) return false;
  if (isReadingTopic && sound_topics.some(s => ex.includes(s))) return false;
  
  // If topic is grammar, explanation should not be about reading comprehension
  if (isGrammarTopic && reading_topics.some(r => ex.includes(r))) return false;
  
  // If topic is sounds/letters, explanation should not be about comprehension
  if (isSoundTopic && reading_topics.some(r => ex.includes(r))) return false;
  
  return true; // Assume on-topic if no red flags
}

export function evaluateBulgarianLessonAnswer(
  context: EvaluationContext,
  studentAnswer: string,
): EvaluationResult {
  const { grade, topicId } = context;

  // Grade 1 topics: letter recognition, syllables, simple words
  if (grade === 1) {
    if (topicId === "letters_and_sounds" || topicId === "vowels_and_consonants") {
      // Assume letter recognition like "а", "б", "в"
      // For now, use keyword matching since we don't have specific prompts
      return evaluateKeywordMatch(studentAnswer, ["буква", "звук", "произнася"]);
    }

    if (topicId === "syllables") {
      // Assume syllable counting — heuristic: if digit 2-3 or "две"/"три"
      const normalized = normalizeAnswer(studentAnswer);
      if (["2", "две"].some(n => normalized.includes(n))) {
        return evaluateSyllableCount(studentAnswer, 2);
      }
      if (["3", "три"].some(n => normalized.includes(n))) {
        return evaluateSyllableCount(studentAnswer, 3);
      }
      return evaluateKeywordMatch(studentAnswer, ["сричка", "разделя"]);
    }

    if (topicId === "simple_words" || topicId === "simple_sentences") {
      return evaluateKeywordMatch(studentAnswer, ["дума", "думи", "думата"]);
    }
  }

  // Grade 2 topics: reading comprehension, basic grammar
  if (grade === 2) {
    if (topicId === "reading_comprehension_basic") {
      // Use question-specific answers only
      const qIndex = context.questionIndex ?? 0;
      const question = readingComprehensionGrade2[qIndex];
      if (question) {
        return evaluateComprehension(studentAnswer, question.acceptedAnswers);
      }
      // Fallback if question index out of range
      return evaluateComprehension(studentAnswer, ["Пухче", "рибица"]);
    }

    if (topicId === "nouns_basic" || topicId === "verbs_basic") {
      return evaluateKeywordMatch(studentAnswer, ["съществително", "глагол", "дума"]);
    }

    if (topicId === "sentence_building") {
      return evaluateKeywordMatch(studentAnswer, ["изречение", "подлог", "сказуемо"]);
    }
  }

  // Grade 3+ topics: grammar, comprehension, spelling
  if (grade >= 3) {
    if (topicId === "spelling_rules_basic") {
      return evaluateKeywordMatch(studentAnswer, ["правило", "буква", "правопис"]);
    }

    if (
      topicId === "short_text_comprehension" ||
      topicId === "reading_comprehension_extended"
    ) {
      return evaluateComprehension(studentAnswer, [
        "лисица",
        "гарван",
        "сирене",
        "хитра",
        "лисицата",
      ]);
    }

    if (topicId === "grammar_review" || topicId === "parts_of_speech_intro") {
      return evaluateKeywordMatch(studentAnswer, [
        "подлог",
        "сказуемо",
        "прилагателно",
      ]);
    }

    if (topicId === "short_written_response") {
      return evaluateKeywordMatch(studentAnswer, [
        "сезон",
        "четем",
        "пишем",
        "обичам",
      ]);
    }
  }

  // Fallback: generic keyword evaluation
  let result = evaluateKeywordMatch(studentAnswer, ["разбирам", "научи", "урок"]);
  
  // ── COHERENCE CHECK: Validate explanation stays on-topic ──────────────────
  // If explanation drifts to a different topic, use topic-specific fallback instead.
  if (!isExplanationOnTopic(result.explanation, topicId)) {
    const fallback = TOPIC_FALLBACK_HINTS[topicId] ?? "Помисли отново — можеш ли да намериш на-добрия отговор?";
    result.explanation = fallback;
    console.warn(`[BG_EVALUATOR] Explanation drifted for topic="${topicId}" — using fallback hint`);
  }
  
  return result;
}
