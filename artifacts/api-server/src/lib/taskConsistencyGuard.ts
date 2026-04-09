/**
 * taskConsistencyGuard.ts
 *
 * Provides:
 *  1. Topic-type classification (what category of task this topic should produce)
 *  2. Topic-specific prompt guidance that enforces task/hint/example consistency
 *  3. Subject-safe framing (thematic context that never bleeds into unrelated topics)
 *  4. Post-generation content validation (filter out clearly mismatched exercises)
 *  5. Safe fallback templates for critical Junior topics
 */

// ─── Topic Type Categories ────────────────────────────────────────────────────

export type TopicCategory =
  | "math_arithmetic"
  | "math_geometry"
  | "math_patterns"
  | "math_word_problems"
  | "math_fractions"
  | "language_phonics"
  | "language_grammar"
  | "language_reading"
  | "language_writing"
  | "logic_game_pattern"
  | "logic_game_visual"
  | "logic_sequence"
  | "logic_comparison"
  | "nature_science"
  | "social_studies"
  | "general";

// ─── Semantic Intent (prevent cross-topic drift) ────────────────────────────────

/**
 * Semantic intent defines WHAT the topic is conceptually about.
 * This prevents mixing related but distinct concepts (e.g., "breathing" vs "water evaporation").
 * Used to validate that all generated content (question, hint, explanation) stay on the same
 * semantic topic.
 */
export interface SemanticIntent {
  /** Core concept being tested */
  concept: string;
  /** What the topic IS about */
  includes: string[];
  /** What the topic IS NOT about - explicitly exclude these */
  excludes: string[];
}

// ─── Topic ID → Category Mapping ─────────────────────────────────────────────

const TOPIC_CATEGORY_MAP: Record<string, TopicCategory> = {
  // Math - Arithmetic
  addition_to_10: "math_arithmetic",
  addition_to_20: "math_arithmetic",
  addition_subtraction_to_100: "math_arithmetic",
  subtraction_to_10: "math_arithmetic",
  subtraction_to_20: "math_arithmetic",
  multiplication_intro: "math_arithmetic",
  division_intro: "math_arithmetic",
  multiplication_tables: "math_arithmetic",
  division_facts: "math_arithmetic",
  multi_step_operations: "math_arithmetic",
  larger_numbers: "math_arithmetic",
  addition: "math_arithmetic",
  subtraction: "math_arithmetic",
  multiplication: "math_arithmetic",
  division: "math_arithmetic",

  // Math - Fractions
  fractions_intro: "math_fractions",
  "fractions-intro": "math_fractions",

  // Math - Word Problems
  word_problems_basic: "math_word_problems",
  word_problems_extended: "math_word_problems",
  "word-problems": "math_word_problems",

  // Math - Patterns
  number_patterns: "math_patterns",
  patterns_sequences: "math_patterns",
  patterns_g2: "math_patterns",
  logical_series_g4: "math_patterns",

  // Language - Phonics
  letters_and_sounds: "language_phonics",
  vowels_and_consonants: "language_phonics",
  syllables: "language_phonics",
  simple_words: "language_phonics",
  "letters-sounds": "language_phonics",
  spelling_rules_basic: "language_phonics",
  spelling: "language_phonics",

  // Language - Grammar
  nouns_basic: "language_grammar",
  verbs_basic: "language_grammar",
  sentence_building: "language_grammar",
  parts_of_speech_intro: "language_grammar",
  grammar_review: "language_grammar",
  sentence_parts_intro: "language_grammar",
  punctuation: "language_grammar",
  "grammar-basics": "language_grammar",
  nouns: "language_grammar",
  verbs: "language_grammar",
  adjectives: "language_grammar",

  // Language - Reading
  simple_sentences: "language_reading",
  simple_stories: "language_reading",
  reading_comprehension_intro: "language_reading",
  reading_comprehension_basic: "language_reading",
  reading_comprehension_extended: "language_reading",
  short_text_comprehension: "language_reading",
  simple_stories_g2: "language_reading",
  fairy_tales_g2: "language_reading",
  "story-comprehension": "language_reading",
  "reading-sentences": "language_reading",
  story_characters: "language_reading",
  story_retelling: "language_reading",
  character_study_g2: "language_reading",
  setting_description_g2: "language_reading",
  fables: "language_reading",
  poetry: "language_reading",
  simple_poetry: "language_reading",
  short_poems_g2: "language_reading",

  // Language - Writing
  short_written_response: "language_writing",

  // Logic - Game Pattern (memory, pattern recognition, observation)
  color_patterns: "logic_game_pattern",
  visual_puzzles: "logic_game_visual",
  simple_puzzles_g2: "logic_game_visual",
  logic_puzzles_g3: "logic_game_visual",
  critical_thinking_g4: "logic_game_visual",
  spatial_reasoning_g3: "logic_game_visual",
  earth_materials_g3: "logic_game_visual",
  advanced_puzzles_g4: "logic_game_visual",
  pattern_analysis_g3: "logic_game_pattern",
  "patterns-sequences": "logic_game_pattern",

  // Logic - Sequence
  ordering_sequence: "logic_sequence",
  sequencing_g2: "logic_sequence",
  sorting_g2: "logic_sequence",
  "sorting-grouping": "logic_sequence",

  // Logic - Comparison
  size_comparison: "logic_comparison",
  comparison_g2: "logic_comparison",
  comparisons: "logic_comparison",

  // Nature & Science
  plants_basics: "nature_science",
  animals_habitats: "nature_science",
  earth_basics: "nature_science",
  seasons_changes: "nature_science",
  weather_observation: "nature_science",
  animals_g2: "nature_science",
  plants_g2: "nature_science",
  seasons_g2: "nature_science",
  human_body_g2: "nature_science",
  "animals-plants": "nature_science",
  "seasons-weather": "nature_science",
  "human-body": "nature_science",

  // Social Studies
  "community-helpers": "social_studies",
  "maps-directions": "social_studies",
  "history-stories": "social_studies",
  "family-home": "social_studies",
  "colors-shapes": "logic_comparison",
  "greetings": "language_phonics",
  "numbers-en": "math_arithmetic",
};

export function getTopicCategory(topicId: string): TopicCategory {
  return TOPIC_CATEGORY_MAP[topicId] ?? "general";
}

// ─── Topic-Specific Prompt Guidance ──────────────────────────────────────────

/**
 * Returns a block of instructions to inject into the exercise prompt that
 * enforces content consistency for the given topic category.
 *
 * Each block specifies:
 * - What kind of question to generate
 * - What the hint must do
 * - What the explanation must cover
 * - What NOT to include
 */
export function getTopicPromptGuidance(
  category: TopicCategory,
  topicLabel: string,
  topicId: string,
  grade: number,
): string {
  switch (category) {
    case "math_arithmetic":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must be a solvable arithmetic problem using real numbers (no placeholders).
- The hint must reference the SPECIFIC numbers in this question (e.g., "Think of ${grade <= 2 ? "counting fingers or using a number line" : "breaking into tens and ones"}").
- The explanation must show the step that leads to the exact correct answer.
- Do NOT switch to geometry, fractions, or word stories — keep all exercises purely arithmetic.
- For grade ${grade}: use numbers in the range ${grade <= 1 ? "1–10" : grade === 2 ? "1–50" : grade === 3 ? "1–100" : "1–1000"}.`;

    case "math_fractions":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must be about dividing something into equal parts (fractions).
- Use simple visual descriptions: "a pizza cut into 4 equal pieces", "half of 8 apples".
- The hint must help the student think about equal parts (e.g., "Divide into equal groups first.").
- The explanation must reference the numerator and denominator in simple language.
- Do NOT switch to whole-number arithmetic — keep all exercises about fractions.`;

    case "math_word_problems":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must be a short story-problem with specific numbers.
- The hint must guide solving steps (e.g., "First find what is given. Then decide: add or subtract?").
- The explanation must walk through the calculation step by step.
- Questions should involve everyday situations a child can picture (buying, counting, sharing).
- Do NOT generate abstract arithmetic without context — every question needs a small story.`;

    case "math_patterns":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must show a sequence and ask "what comes next?" or "what is missing?".
- Use number sequences, shape sequences, or colour sequences.
- The hint must describe the RULE of the pattern (e.g., "+2 each time", "alternating red-blue").
- The explanation must state the rule and show why the answer continues it.
- Do NOT ask simple arithmetic — every exercise must involve spotting a pattern.`;

    case "language_phonics":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must test letters, sounds, syllables, or spelling of words.
- Use simple, short, age-appropriate Bulgarian words for grade ${grade}.
- The hint must describe a phonics strategy (e.g., "Say it slowly out loud: How many syllables do you hear?").
- The explanation must reference the sound/letter rule used.
- Do NOT ask grammar or comprehension questions — stay on phonics, sounds, or spelling.`;

    case "language_grammar":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must test the specific grammar skill: "${topicLabel}".
- Use simple, complete Bulgarian sentences appropriate for grade ${grade}.
- The hint must reference the grammar rule directly (e.g., "A noun is a word that names a person, place, or thing.").
- The explanation must state which grammar rule applies and why the answer is correct.
- Do NOT mix grammar categories — a lesson about nouns stays about nouns.`;

    case "language_reading":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must test reading comprehension, story elements, or text meaning.
- Provide a short 2-3 sentence passage (age-appropriate) and ask a question about it.
- The hint must guide the student to re-read the relevant part (e.g., "Look at the second sentence.").
- The explanation must quote or reference the part of the text that contains the answer.
- Do NOT ask spelling, grammar, or arithmetic — all exercises must be about understanding text.`;

    case "language_writing":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must ask the student to choose or identify a correct sentence or text structure.
- Use multiple-choice format with complete sentences as options.
- The hint must reference what makes writing clear and correct.
- The explanation must describe why the chosen option is better written.
- Do NOT ask phonics or arithmetic — focus on sentence quality and written expression.`;

    case "logic_game_pattern":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}" (Pattern Recognition / Memory Game):
- Every question must present a visible PATTERN and ask: what comes next, what is missing, or what is different.
- Describe patterns clearly in text (e.g., "Red, Blue, Red, Blue, Red, ___").
- The hint must describe the REPEATING RULE of the pattern (e.g., "The colours alternate: red, then blue, then red again.").
- The explanation must identify the pattern rule and show how it predicts the answer.
- Do NOT generate open-ended discussion questions or arithmetic.
- Do NOT introduce topics unrelated to the pattern (no food lists, no definitions).
- These tasks should feel like a fun game of spotting what comes next.`;

    case "logic_game_visual":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}" (Logic Puzzle / Visual Reasoning):
- Every question must present a logical situation or visual reasoning challenge.
- Use clear descriptions that can be solved by logical deduction (e.g., "Ana has more apples than Bora. Bora has more than Cora. Who has the fewest?").
- The hint must give ONE reasoning step to get closer to the answer (not the full solution).
- The explanation must walk through the logical reasoning that leads to the correct answer.
- Do NOT ask about spelling, grammar, or arithmetic calculation.
- Do NOT ask vague questions like "What is your favourite colour?" — every question has ONE correct logical answer.`;

    case "logic_sequence":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}" (Ordering / Sequencing):
- Every question must ask about ordering, grouping, or sorting items by a clear rule.
- Examples: "Order smallest to largest", "Which group does this belong to?", "What comes before/after?".
- The hint must name the sorting RULE (e.g., "Sort by size: small → medium → large.").
- The explanation must state the rule and why the answer follows it.
- Do NOT generate arithmetic or reading comprehension — stay on sequencing and sorting.`;

    case "logic_comparison":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}" (Comparisons):
- Every question must compare two or more items using a measurable property (size, quantity, length, etc.).
- Use clear comparison language: bigger/smaller, more/fewer, heavier/lighter.
- The hint must name the comparison dimension (e.g., "Compare the heights: which is taller?").
- The explanation must state which item wins the comparison and why.
- Do NOT ask about arithmetic operations or language grammar.`;

    case "nature_science":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}" (Nature & Science):
- Every question must be factual and observable — about plants, animals, weather, or the environment.
- Use concrete, specific facts appropriate for grade ${grade} (e.g., "A bee collects nectar from flowers.").
- The hint must guide the student to recall the relevant science fact (e.g., "Think about what plants need to grow.").
- The explanation must state the correct fact and briefly explain why it is true.
- Do NOT ask arithmetic or grammar questions — stay on nature and science facts.`;

    case "social_studies":
      return `TOPIC-SPECIFIC RULES for "${topicLabel}" (Social Studies):
- Every question must be about people, communities, places, or social roles appropriate for grade ${grade}.
- Use relatable, concrete examples (e.g., "A doctor helps people who are sick.").
- The hint must guide the student to think about the role or relationship being asked about.
- The explanation must state the correct fact in simple terms.
- Do NOT switch to science facts or arithmetic.`;

    default:
      return `TOPIC-SPECIFIC RULES for "${topicLabel}":
- Every question must directly relate to the topic "${topicLabel}".
- The hint must help solve THIS specific question (not a different type of question).
- The explanation must explain why the correct answer is right for this specific question.
- Do NOT mix this topic with unrelated subjects.`;
  }
}

// ─── Subject-Aligned Framing ──────────────────────────────────────────────────

/**
 * Returns a safe thematic framing string that will NOT cause topic bleed.
 * Unlike the old random FRAMING_VARIANTS (which used food/kitchen/sports themes
 * indiscriminately), these framings are chosen based on topic type so the
 * variety context stays within the subject domain.
 */
export function getTopicAlignedFraming(category: TopicCategory): string {
  const framings: Record<TopicCategory, string[]> = {
    math_arithmetic: [
      "Use everyday objects children know: toys, fruits, books.",
      "Use classroom situations: children, desks, pencils, notebooks.",
      "Use a small story with characters collecting or sharing items.",
    ],
    math_geometry: [
      "Use real shapes children see every day: windows, wheels, doors.",
      "Use drawing and construction: building with blocks, drawing shapes.",
    ],
    math_patterns: [
      "Use sequences of simple symbols, numbers, or colours.",
      "Use everyday repeated patterns: beads on a string, tiles on a floor.",
    ],
    math_word_problems: [
      "Use a market or shop scenario where children buy or share items.",
      "Use a school trip or class activity scenario.",
    ],
    math_fractions: [
      "Use food items split into equal portions: pizza, cake, bread.",
      "Use everyday sharing: equal portions for friends.",
    ],
    language_phonics: [
      "Use simple common Bulgarian words children know from home.",
      "Use animal names and nature words as vocabulary examples.",
    ],
    language_grammar: [
      "Use simple Bulgarian sentences about everyday school or home life.",
      "Use short sentences about nature and animals to practice grammar.",
    ],
    language_reading: [
      "Use a short passage about a child's everyday adventure.",
      "Use a short animal story as the reading passage.",
    ],
    language_writing: [
      "Use short sentences about school life to evaluate.",
      "Use everyday descriptive sentences for children to assess.",
    ],
    logic_game_pattern: [
      "Use clear sequences of colours, shapes, or numbers.",
      "Use simple repeating patterns that can be described in text.",
    ],
    logic_game_visual: [
      "Use logical deduction puzzles with 2-3 characters and one clear answer.",
      "Use spatial reasoning described in simple text (who is taller, what fits where).",
    ],
    logic_sequence: [
      "Use objects of different sizes or amounts to sort.",
      "Use events in a story to place in the correct order.",
    ],
    logic_comparison: [
      "Use everyday objects with clear measurable differences.",
      "Use simple counts of items to compare.",
    ],
    nature_science: [
      "Use familiar Bulgarian nature: forests, meadows, the seasons.",
      "Use common animals and plants children see in everyday life.",
    ],
    social_studies: [
      "Use a small Bulgarian village or town community scenario.",
      "Use a family or school community as the context.",
    ],
    general: [
      "Use everyday situations a child in Bulgaria would recognise.",
    ],
  };

  const opts = framings[category] ?? framings.general;
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── Content Consistency Validator ───────────────────────────────────────────

/**
 * Basic content consistency check on a generated exercise.
 * Returns true if the exercise looks consistent (hint matches question context,
 * correct answer is not obviously mismatched), false if it should be discarded.
 *
 * This is a lightweight heuristic — not a semantic AI check — but catches
 * the most common drift patterns:
 *   - Hint that is completely empty when it shouldn't be
 *   - Correct answer appears nowhere in options for multiple-choice
 *   - Question is too short to be meaningful (< 5 chars)
 *   - Options are placeholders ("A", "B", "C", "D")
 */
export function isExerciseConsistent(exercise: {
  question: string;
  correctAnswer: string;
  options: string[] | null;
  hint: string | null;
  explanation: string | null;
  exerciseType: "multiple-choice" | "open-ended";
}): boolean {
  const { question, correctAnswer, options, exerciseType } = exercise;

  // Question must be substantial
  if (!question || question.trim().length < 5) return false;

  // Correct answer must be present
  if (!correctAnswer || correctAnswer.trim().length === 0) return false;

  // For multiple-choice: correct answer must appear in options
  if (exerciseType === "multiple-choice" && Array.isArray(options) && options.length >= 2) {
    const answerInOptions = options.some(
      (opt) => opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
    );
    if (!answerInOptions) return false;

    // Options must not be bare placeholders
    const placeholders = ["a", "b", "c", "d", "option a", "option b"];
    const allPlaceholders = options.every((opt) =>
      placeholders.includes(opt.trim().toLowerCase()),
    );
    if (allPlaceholders) return false;
  }

  // Question should not be identical to correct answer (degenerate)
  if (question.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) return false;

  if (question.toLowerCase().includes("срич") && correctAnswer.trim().length === 0) return false;

  return true;
}

// ─── Safe Topic Templates ─────────────────────────────────────────────────────

export interface SafeTemplate {
  question: string;
  correctAnswer: string;
  options: string[] | null;
  hint: string;
  explanation: string;
  exerciseType: "multiple-choice" | "open-ended";
  difficulty: "easy" | "medium" | "hard";
}

type TemplateFn = (grade: number) => SafeTemplate[];

/**
 * Safe templates for critical Junior topics.
 * These are guaranteed to be internally consistent and age-appropriate.
 * Used as fallback when AI generation fails completely for a topic.
 */
const SAFE_TEMPLATES_BG: Record<string, TemplateFn> = {
  // ── Addition ──────────────────────────────────────────────────────────────
  addition_to_10: (_grade) => [
    {
      question: "Колко е 3 + 4?",
      correctAnswer: "7",
      options: ["5", "6", "7", "8"],
      hint: "Започни от 3 и брой още 4 напред: 4, 5, 6, 7.",
      explanation: "3 + 4 = 7. Събираме двете числа и получаваме 7.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
    {
      question: "Колко е 5 + 2?",
      correctAnswer: "7",
      options: ["6", "7", "8", "9"],
      hint: "Започни от 5 и брой още 2 напред: 6, 7.",
      explanation: "5 + 2 = 7. Добавяме 2 към 5 и получаваме 7.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
    {
      question: "Колко е 6 + 3?",
      correctAnswer: "9",
      options: ["7", "8", "9", "10"],
      hint: "Започни от 6 и брой: 7, 8, 9. Преброи 3 пъти.",
      explanation: "6 + 3 = 9. Добавяме 3 към 6.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
  ],

  subtraction_to_10: (_grade) => [
    {
      question: "Колко е 8 - 3?",
      correctAnswer: "5",
      options: ["4", "5", "6", "7"],
      hint: "Започни от 8 и брой назад 3 пъти: 7, 6, 5.",
      explanation: "8 - 3 = 5. Изваждаме 3 от 8 и остава 5.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
    {
      question: "Колко е 7 - 4?",
      correctAnswer: "3",
      options: ["2", "3", "4", "5"],
      hint: "Започни от 7 и брой назад 4 пъти: 6, 5, 4, 3.",
      explanation: "7 - 4 = 3. Изваждаме 4 от 7 и остава 3.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
  ],

  // ── Color Patterns (Logic Game) ───────────────────────────────────────────
  color_patterns: (_grade) => [
    {
      question: "Погледни редицата: Червено, Синьо, Червено, Синьо, Червено, ___. Какъв цвят е следващият?",
      correctAnswer: "Синьо",
      options: ["Червено", "Синьо", "Жълто", "Зелено"],
      hint: "Цветовете се редуват: червено, синьо, червено, синьо... Какво идва след червено?",
      explanation: "Закономерността е: Червено → Синьо → Червено → Синьо. След второто Червено идва Синьо.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
    {
      question: "Погледни редицата: Жълто, Жълто, Зелено, Жълто, Жълто, Зелено, ___. Какво е следващото?",
      correctAnswer: "Жълто",
      options: ["Зелено", "Жълто", "Червено", "Синьо"],
      hint: "Групата се повтаря: Жълто, Жълто, Зелено. Кой елемент от тази група идва следващ?",
      explanation: "Закономерността е: Жълто, Жълто, Зелено (повтарящи се). Следващото е Жълто (първото от новата група).",
      exerciseType: "multiple-choice",
      difficulty: "medium",
    },
  ],

  // ── Visual Puzzles (Logic Game) ───────────────────────────────────────────
  visual_puzzles: (_grade) => [
    {
      question: "Ана е по-висока от Бора. Бора е по-висока от Вера. Коя е най-ниска?",
      correctAnswer: "Вера",
      options: ["Ана", "Бора", "Вера", "Всички са еднакви"],
      hint: "Наредете ги: Ана > Бора > Вера. Кой е на последно място?",
      explanation: "Ана е по-висока от Бора, а Бора е по-висока от Вера. Значи Вера е най-ниска.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
    {
      question: "В чантата има 3 моливи и 2 химикала. Колко пишещи инструмента има общо?",
      correctAnswer: "5",
      options: ["4", "5", "6", "3"],
      hint: "Съберете моливите и химикалите заедно: 3 + 2 = ?",
      explanation: "3 молива + 2 химикала = 5 пишещи инструмента.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
  ],

  // ── Nouns ─────────────────────────────────────────────────────────────────
  nouns_basic: (_grade) => [
    {
      question: "Кое от следните думи е съществително (предмет или живо същество)?",
      correctAnswer: "котка",
      options: ["бягам", "котка", "бързо", "хубав"],
      hint: "Съществителното назовава предмет, животно или човек. Кое от думите е нещо, което можеш да докоснеш или видиш?",
      explanation: "'Котка' е съществително — то назовава животно. 'Бягам' е глагол, 'бързо' е наречие, 'хубав' е прилагателно.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
    {
      question: "Намери съществителното в изречението: 'Малкото куче тича в парка.'",
      correctAnswer: "куче и парк",
      options: ["малко и тича", "куче и парк", "тича и в", "малко и куче"],
      hint: "Съществителните са имена на неща. Кои думи назовават нещо, което съществува?",
      explanation: "'Куче' и 'парк' са съществителни — назовават животно и място. 'Малко' е прилагателно, 'тича' е глагол.",
      exerciseType: "multiple-choice",
      difficulty: "medium",
    },
  ],

  // ── Size Comparison ───────────────────────────────────────────────────────
  size_comparison: (_grade) => [
    {
      question: "Слон, мишка и котка. Кое животно е НАЙ-ГОЛЯМО?",
      correctAnswer: "слон",
      options: ["мишка", "котка", "слон", "всички са еднакви"],
      hint: "Сравнете размерите: слонът е огромен, котката е средна, мишката е малка.",
      explanation: "Слонът е най-голямото животно от трите. Мишката е най-малка, котката е по-голяма от мишката, но по-малка от слона.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
    {
      question: "Молив: 15 сантиметра. Линия: 30 сантиметра. Кое е по-ДЪЛГО?",
      correctAnswer: "линия",
      options: ["молив", "линия", "еднакво дълги", "не може да се определи"],
      hint: "Сравнете числата: 15 и 30. Кое е по-голямо число?",
      explanation: "30 > 15, значи линията (30 см) е по-дълга от молива (15 см).",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
  ],

  // ── Reading Comprehension ─────────────────────────────────────────────────
  reading_comprehension_basic: (_grade) => [
    {
      question: "Прочети: 'Мечето Тедди обича да яде мед. Всяка сутрин то търси мед в гората.' Какво прави Тедди всяка сутрин?",
      correctAnswer: "Търси мед в гората",
      options: [
        "Спи в пещерата",
        "Търси мед в гората",
        "Играе с приятели",
        "Яде плодове",
      ],
      hint: "Прочети второто изречение отново. Какво се казва, че Тедди прави всяка сутрин?",
      explanation: "Второто изречение казва: 'Всяка сутрин то търси мед в гората.' Значи Тедди търси мед.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
    {
      question: "Прочети: 'Мария има 5 ябълки. Тя дава 2 на приятелката си.' Колко ябълки остават на Мария?",
      correctAnswer: "3",
      options: ["2", "3", "4", "7"],
      hint: "Мария е имала 5 ябълки и е дала 2. Колко остават? Извади: 5 - 2 = ?",
      explanation: "5 - 2 = 3. На Мария остават 3 ябълки.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
  ],

  // ── Ordering Sequence ─────────────────────────────────────────────────────
  ordering_sequence: (_grade) => [
    {
      question: "Наредете събитията в правилен ред: 1) Децата се приберат вкъщи. 2) Децата излизат за разходка. 3) Децата обядват. Какъв е правилният ред?",
      correctAnswer: "2, 3, 1",
      options: ["1, 2, 3", "2, 3, 1", "3, 1, 2", "1, 3, 2"],
      hint: "Мислете логично: какво правим преди разходката и какво след нея?",
      explanation: "Логичният ред е: Децата излизат (2), след това обядват (3), след това се прибират (1). Ред: 2, 3, 1.",
      exerciseType: "multiple-choice",
      difficulty: "medium",
    },
    {
      question: "Кое число идва между 5 и 7?",
      correctAnswer: "6",
      options: ["4", "6", "8", "5"],
      hint: "Погледнете числовата редица: ..., 5, ___, 7, ... Кое число идва след 5 и преди 7?",
      explanation: "6 идва след 5 и преди 7. Редицата е: 5, 6, 7.",
      exerciseType: "multiple-choice",
      difficulty: "easy",
    },
  ],
};

/**
 * Get safe fallback templates for a topic in Bulgarian.
 * Returns an empty array if no template exists for this topic.
 */
export function getSafeTemplates(
  topicId: string,
  _grade: number,
): SafeTemplate[] {
  const fn = SAFE_TEMPLATES_BG[topicId];
  if (!fn) return [];
  return fn(_grade);
}

// ─── Key Topic Rules (for prompt injection) ───────────────────────────────────

/**
 * Returns the core consistency rules that MUST be enforced in every generated
 * exercise, regardless of topic.
 */
export function getCoreConsistencyRules(): string {
  return `
CORE CONSISTENCY RULES (apply to every exercise):
1. HINT CONSISTENCY: The "hint" field must directly help the student solve THIS specific question. Never write a hint that references a different question type, different objects, or a different topic. If the question is about numbers, the hint must reference those numbers. If the question is about a text passage, the hint must reference that passage.
2. EXPLANATION CONSISTENCY: The "explanation" field must explain why the correct answer is right for THIS specific question. It must reference the specific numbers, words, or logic from the question.
3. TOPIC FOCUS: Do NOT drift from the stated topic. If the topic is about patterns, every exercise must be about patterns. If the topic is about nouns, every exercise must test nouns. Never mix subjects within a batch.
4. ANSWER IN OPTIONS: For multiple-choice: the "correctAnswer" string must appear EXACTLY in the "options" array. Spelling and capitalisation must match.
5. AGE APPROPRIATE: Use vocabulary and sentence complexity appropriate for the grade level. For grades 1-2: short simple sentences only.`;
}

// ─── Semantic Intent Map ──────────────────────────────────────────────────────

const SEMANTIC_INTENT_MAP: Record<string, SemanticIntent> = {
  // Water cycle topics — EXCLUDE breathing/respiration/lungs
  water_cycle_g3: {
    concept: "Water cycle (evaporation, condensation, precipitation)",
    includes: [
      "water",
      "evaporation",
      "condensation",
      "precipitation",
      "cycle",
      "sun",
      "rain",
      "cloud",
      "вода",
      "изпарение",
      "кондензация",
      "влага",
      "слънце",
      "облак",
    ],
    excludes: ["breathing", "respiration", "lungs", "дишане", "дышане"],
  },

  // Human body topics (grade 2) — breathing is part of respiration
  human_body_g2: {
    concept: "Human body parts and basic functions",
    includes: [
      "body",
      "head",
      "arms",
      "legs",
      "eyes",
      "ears",
      "heart",
      "lungs",
      "teeth",
      "digest",
      "breathe",
      "дише",
      "белите дробове",
      "сърце",
      "тяло",
    ],
    excludes: ["water", "evaporation", "вода", "изпарение"],
  },

  // Math - Addition
  addition_to_10: {
    concept: "Addition (combining quantities with +)",
    includes: ["add", "plus", "sum", "total", "altogether", "more", "combine", "събира", "плюс", "сума"],
    excludes: ["subtract", "minus", "less", "отнема", "минус"],
  },
  addition_to_20: {
    concept: "Addition (combining quantities with +)",
    includes: ["add", "plus", "sum", "total", "altogether", "more", "combine", "събира", "плюс", "сума"],
    excludes: ["subtract", "minus", "less", "отнема", "минус"],
  },
  addition_subtraction_to_100: {
    concept: "Addition and subtraction up to 100",
    includes: ["add", "plus", "sum", "subtract", "minus", "difference", "събира", "плюс", "изважда"],
    excludes: ["multiply", "divide", "multiplica", "деления"],
  },

  // Math - Subtraction
  subtraction_to_10: {
    concept: "Subtraction (removing quantities with -)",
    includes: ["subtract", "minus", "less", "remove", "take away", "difference", "how many left", "изважда", "минус", "отнема"],
    excludes: ["add", "plus", "sum", "more", "събира", "плюс"],
  },
  subtraction_to_20: {
    concept: "Subtraction (removing quantities with -)",
    includes: ["subtract", "minus", "less", "remove", "take away", "difference", "how many left", "изважда", "минус", "отнема"],
    excludes: ["add", "plus", "sum", "more", "събира", "плюс"],
  },

  // Logic - Patterns
  color_patterns: {
    concept: "Color patterns (repeating sequences of colors)",
    includes: ["color", "pattern", "sequence", "repeat", "next", "alternating", "цвет", "закономер", "редица", "повтаря"],
    excludes: ["numbers", "shapes", "size", "logic puzzle", "deduction", "числа", "форми"],
  },
  patterns_g2: {
    concept: "Patterns and sequences",
    includes: ["pattern", "sequence", "repeat", "next", "rule", "закономер", "редица", "повтаря", "правило"],
    excludes: ["counting", "arithmetic", "calculation"],
  },

  // Logic - Puzzles & Games
  visual_puzzles: {
    concept: "Visual reasoning and logical deduction",
    includes: ["puzzle", "logic", "reason", "deduction", "figure out", "puzle", "логик", "мислене", "дедукц"],
    excludes: ["pattern", "sequence", "arithmetic"],
  },
  simple_puzzles_g2: {
    concept: "Simple logic puzzles",
    includes: ["puzzle", "logic", "think", "reason", "логик", "пъзел", "мислене"],
    excludes: ["arithmetic", "pattern sequence"],
  },

  // Reading & Literature
  simple_stories_g2: {
    concept: "Reading and understanding simple stories",
    includes: ["story", "read", "character", "plot", "event", "historia", "história", "história", "четене", "история", "персонаж"],
    excludes: ["grammar", "spelling", "pronunciation"],
  },
  story_characters: {
    concept: "Understanding story characters and their traits",
    includes: ["character", "person", "trait", "describe", "персонаж", "описание", "характер"],
    excludes: ["grammar", "spelling"],
  },
  reading_comprehension_basic: {
    concept: "Reading comprehension from text passages",
    includes: ["read", "understand", "passage", "question", "answer", "четене", "разбира", "текст"],
    excludes: ["spelling", "grammar rules"],
  },

  // Language - Grammar
  nouns_basic: {
    concept: "Nouns (words that name people, places, things)",
    includes: ["noun", "name", "person", "place", "thing", "subject", "съществител", "назовава"],
    excludes: ["verb", "adjective", "action", "глагол", "прилагател"],
  },
  verbs_basic: {
    concept: "Verbs (action words)",
    includes: ["verb", "action", "do", "move", "глагол", "действие", "прави"],
    excludes: ["noun", "adjective", "person", "place"],
  },
  adjectives: {
    concept: "Adjectives (describing words)",
    includes: ["adjective", "describe", "quality", "color", "size", "прилагател", "описва", "качество"],
    excludes: ["verb", "noun", "action"],
  },

  // Nature & Science - Animals
  animals_g2: {
    concept: "Animals - types, habitats, characteristics",
    includes: ["animal", "creature", "habitat", "live", "zoo", "farm", "животно", "място", "живот"],
    excludes: ["plant", "water cycle", "weather", "растение"],
  },
  animals_habitats: {
    concept: "Animal habitats and where animals live",
    includes: ["habitat", "home", "live", "environment", "jungle", "desert", "ocean", "animal", "място", "живот", "животно"],
    excludes: ["plant", "food chain"],
  },

  // Nature & Science - Plants
  plants_basics: {
    concept: "Plants - basic parts and needs (roots, stems, leaves, flowers)",
    includes: ["plant", "root", "stem", "leaf", "flower", "grow", "растение", "корен", "стъбло", "цвят"],
    excludes: ["animal", "water cycle", "weather"],
  },
  plants_g2: {
    concept: "Plants - types and characteristics",
    includes: ["plant", "flower", "tree", "grow", "green", "растение", "дърво", "цвят"],
    excludes: ["animal", "food chain"],
  },

  // Sorting & Classification
  sorting_g2: {
    concept: "Sorting and classifying objects into groups",
    includes: ["sort", "group", "classify", "category", "same", "different", "сортира", "групира", "класифик"],
    excludes: ["counting", "arithmetic"],
  },
  comparison_g2: {
    concept: "Comparing objects (bigger, smaller, more, less)",
    includes: ["compare", "bigger", "smaller", "more", "less", "same", "different", "сравня", "по-голям", "по-малък"],
    excludes: ["arithmetic operations"],
  },

  // Seasons & Weather
  seasons_g2: {
    concept: "Seasons and their characteristics",
    includes: ["season", "spring", "summer", "autumn", "winter", "weather", "сезон", "пролет", "лято", "есен", "зима"],
    excludes: ["temperature scale", "thermometer"],
  },

  // ── SLUG-FORMAT ALIASES (same intents, accessed via URL slugs) ─────────────

  // "human-body" slug → same as human_body_g2
  "human-body": {
    concept: "Human body parts and basic functions",
    includes: ["body", "head", "arms", "legs", "eyes", "ears", "heart", "lungs", "teeth", "breathe", "sense",
      "дише", "белите дробове", "сърце", "тяло", "очи", "уши", "нос", "уста", "зъби"],
    excludes: ["water cycle", "evaporation", "condensation", "вода", "изпарение", "кондензация"],
  },

  // "animals-plants" slug
  "animals-plants": {
    concept: "Animals and plants — types, features, basic needs",
    includes: ["animal", "plant", "creature", "flower", "tree", "root", "leaf", "grow", "live", "eat",
      "животно", "растение", "цвете", "дърво", "корен", "расте", "живее", "яде"],
    excludes: ["water cycle", "evaporation", "human body", "arithmetic"],
  },

  // "seasons-weather" slug
  "seasons-weather": {
    concept: "Seasons and weather — spring, summer, autumn, winter, rain, sun",
    includes: ["season", "spring", "summer", "autumn", "winter", "rain", "snow", "sun", "wind", "weather",
      "сезон", "пролет", "лято", "есен", "зима", "дъжд", "сняг", "слънце", "вятър", "времето"],
    excludes: ["water cycle evaporation", "human body", "arithmetic", "изпарение"],
  },

  // ── Air / Wind topics ──────────────────────────────────────────────────────
  air_wind_g2: {
    concept: "Air and wind — wind moves objects, air is around us, we need air to breathe",
    includes: ["wind", "air", "blow", "move", "leaf", "flag", "kite", "breathe",
      "вятър", "въздух", "духа", "движи", "листа", "знаме", "хвърчило", "дишаме"],
    excludes: ["water evaporation", "condensation", "изпарение", "кондензация", "кръвообращение", "сърце", "очи"],
  },
  air_properties_g3: {
    concept: "Properties of air — air has weight, takes up space, can be compressed",
    includes: ["air", "weight", "space", "pressure", "volume", "въздух", "тегло", "налягане", "обем"],
    excludes: ["water cycle", "breathing organs", "изпарение"],
  },

  // ── Breathing / Respiration (separate from wind/air, separate from water) ──
  breathing_g2: {
    concept: "Breathing — lungs, inhale/exhale air, nose and mouth, oxygen",
    includes: ["breathing", "lung", "inhale", "exhale", "oxygen", "air", "nose", "mouth",
      "дишане", "белите дробове", "вдишва", "издишва", "кислород", "въздух", "нос", "уста"],
    excludes: ["water evaporation", "water cycle", "wind", "изпарение", "кондензация", "вятър", "очи", "сърце"],
  },

  // ── Water (drinking/liquid water, NOT evaporation cycle) ──────────────────
  water_basics_g2: {
    concept: "Water — drinking, liquid, rivers, rain, washing — basic properties",
    includes: ["water", "drink", "liquid", "river", "rain", "wash", "clean", "wet",
      "вода", "пие", "течност", "река", "дъжд", "мие", "чист", "влажен"],
    excludes: ["breathing", "lungs", "human body organs", "дишане", "белите дробове"],
  },

  // ── Community Helpers / Social Studies ────────────────────────────────────
  "community-helpers": {
    concept: "Community helpers — doctors, firefighters, teachers, police, roles in society",
    includes: ["doctor", "teacher", "firefighter", "police", "help", "community", "work", "role",
      "лекар", "учител", "пожарникар", "полиция", "помага", "общество", "работа"],
    excludes: ["arithmetic", "plants", "water cycle"],
  },

  // ── Maps / Directions ────────────────────────────────────────────────────
  "maps-directions": {
    concept: "Maps and directions — left, right, north, south, reading simple maps",
    includes: ["map", "direction", "left", "right", "north", "south", "east", "west", "navigate",
      "карта", "посока", "ляво", "дясно", "север", "юг", "изток", "запад"],
    excludes: ["arithmetic", "seasons", "weather"],
  },

  // ── History Stories ─────────────────────────────────────────────────────
  "history-stories": {
    concept: "Bulgarian history — important people, events, national heroes, traditions",
    includes: ["history", "hero", "Bulgaria", "story", "event", "tradition", "ancient", "past",
      "история", "герой", "България", "традиция", "събитие", "миналото"],
    excludes: ["arithmetic", "water cycle", "animals"],
  },

  // ── Family & Home ───────────────────────────────────────────────────────
  "family-home": {
    concept: "Family members and home — parents, siblings, grandparents, rooms, chores",
    includes: ["family", "parent", "mother", "father", "brother", "sister", "grandparent", "home", "house", "room",
      "семейство", "родители", "майка", "баща", "брат", "сестра", "баба", "дядо", "дом", "стая"],
    excludes: ["arithmetic", "water cycle", "animals", "plants"],
  },

  // ── Math: multiplication ──────────────────────────────────────────────
  multiplication_intro: {
    concept: "Multiplication — equal groups, repeated addition, times tables",
    includes: ["multiply", "times", "groups", "product", "умножа", "пъти", "групи", "произведение"],
    excludes: ["subtract", "minus", "divide", "fraction", "изважда", "дели"],
  },

  // ── Math: division ────────────────────────────────────────────────────
  division_intro: {
    concept: "Division — sharing equally, how many groups",
    includes: ["divide", "share", "groups", "equal", "quotient", "дели", "разпредели", "групи", "равно"],
    excludes: ["multiply", "add", "subtract", "умножа", "събира", "изважда"],
  },
};

/**
 * Normalise a topic slug (e.g. "human-body") to a canonical ID (e.g. "human_body_g2").
 * This is necessary because route params use URL-friendly slugs but the intent
 * map uses underscore-separated IDs.  Without this mapping, getSemanticIntent()
 * always returns null for slug-format topics, silently disabling all semantic
 * validation for every science/social/nature topic.
 */
const SLUG_TO_CANONICAL: Record<string, string> = {
  // Nature & Science
  "human-body": "human_body_g2",
  "animals-plants": "animals_g2",
  "seasons-weather": "seasons_g2",
  "weather": "seasons_g2",
  // Math
  "addition": "addition_to_10",
  "subtraction": "subtraction_to_10",
  "multiplication": "multiplication_intro",
  "division": "division_intro",
  // Logic
  "patterns-sequences": "color_patterns",
  "sorting-grouping": "sorting_g2",
  "comparisons": "comparison_g2",
  "colors-shapes": "color_patterns",
  // Language
  "grammar-basics": "nouns_basic",
  "story-comprehension": "reading_comprehension_basic",
  "reading-sentences": "reading_comprehension_basic",
  "letters-sounds": "nouns_basic",
};

export function normalizeTopicId(topicId: string): string {
  return SLUG_TO_CANONICAL[topicId] ?? topicId;
}

export function getSemanticIntent(topicId: string): SemanticIntent | null {
  const canonical = normalizeTopicId(topicId);
  return SEMANTIC_INTENT_MAP[canonical] ?? SEMANTIC_INTENT_MAP[topicId] ?? null;
}

/**
 * Check if content appears to be semantically aligned with the intent.
 * Returns true if content appears to stay on topic, false if there's obvious drift.
 * This is a heuristic check — uses keyword overlap to detect major semantic misalignment.
 */
export function validateSemanticIntent(
  content: string,
  intent: SemanticIntent,
  checkIncludes: boolean = true,
): boolean {
  if (!content || content.length < 5) return true; // Empty content passes
  const c = content.toLowerCase();

  if (checkIncludes) {
    // Check that content contains at least one "includes" keyword
    const hasIncludeKeyword = intent.includes.some((kw) => c.includes(kw.toLowerCase()));
    if (!hasIncludeKeyword) return false;
  }

  // Check that content does NOT contain "excludes" keywords
  const hasExcludeKeyword = intent.excludes.some((kw) => c.includes(kw.toLowerCase()));
  if (hasExcludeKeyword) return false;

  return true;
}

export function validateExerciseSemanticAlignment(
  question: string,
  hint: string | null,
  explanation: string | null,
  intent: SemanticIntent,
): boolean {
  // Question MUST align with intent (must include at least one include keyword)
  if (!validateSemanticIntent(question, intent, true)) return false;

  // Hint: must NOT contain exclude keywords AND, if it's long, must contain
  // at least one include keyword (prevents hints about unrelated topics drifting in).
  if (hint && hint.length > 10) {
    // Always check excludes
    if (!validateSemanticIntent(hint, intent, false)) return false;
    // If the hint is substantial (>40 chars), require positive include alignment too.
    // This catches cases like: breathing question + water evaporation hint (includes don't overlap)
    if (hint.length > 40 && !validateSemanticIntent(hint, intent, true)) {
      console.warn(`[COHERENCE] Hint drifts from intent "${intent.concept}": "${hint.slice(0, 50)}"`);
      return false;
    }
  }

  // Explanation: must NOT contain exclude keywords
  if (explanation && explanation.length > 5) {
    if (!validateSemanticIntent(explanation, intent, false)) return false;
  }

  return true;
}
