/**
 * AYA Junior — Bulgaria Academic Curriculum, Grades 1-4
 * Subjects: mathematics, bulgarian_language
 *
 * This module is the single source of truth for BG academic topics.
 * It is used by the subject router, lesson prompt generator, and
 * the academic profile foundation (future teacher accounts).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonType = "lesson" | "practice" | "game" | "reading" | "writing";
export type DifficultyLevel = "intro" | "basic" | "intermediate" | "advanced";

export interface CurriculumTopic {
  topicId: string;
  topicTitleBg: string;
  topicTitleEn: string;
  difficultyLevel: DifficultyLevel;
  lessonType: LessonType;
  skills: string[];
}

export interface GradeSubjectEntry {
  grade: number;
  subjectId: string;
  topics: CurriculumTopic[];
}

// ─── Curriculum Data ──────────────────────────────────────────────────────────

export const BG_CURRICULUM: GradeSubjectEntry[] = [

  // ── Mathematics Grade 1 ────────────────────────────────────────────────────
  {
    grade: 1,
    subjectId: "mathematics",
    topics: [
      {
        topicId: "addition_to_10",
        topicTitleBg: "Събиране до 10",
        topicTitleEn: "Addition up to 10",
        difficultyLevel: "intro",
        lessonType: "practice",
        skills: ["count", "add_single_digit", "number_sense_to_10"],
      },
      {
        topicId: "subtraction_to_10",
        topicTitleBg: "Изваждане до 10",
        topicTitleEn: "Subtraction up to 10",
        difficultyLevel: "intro",
        lessonType: "practice",
        skills: ["subtract_single_digit", "number_sense_to_10"],
      },
      {
        topicId: "addition_to_20",
        topicTitleBg: "Събиране до 20",
        topicTitleEn: "Addition up to 20",
        difficultyLevel: "basic",
        lessonType: "practice",
        skills: ["add_to_20", "carry_over_basic"],
      },
      {
        topicId: "subtraction_to_20",
        topicTitleBg: "Изваждане до 20",
        topicTitleEn: "Subtraction up to 20",
        difficultyLevel: "basic",
        lessonType: "practice",
        skills: ["subtract_to_20", "borrow_basic"],
      },
    ],
  },

  // ── Mathematics Grade 2 ────────────────────────────────────────────────────
  {
    grade: 2,
    subjectId: "mathematics",
    topics: [
      {
        topicId: "addition_subtraction_to_100",
        topicTitleBg: "Събиране и изваждане до 100",
        topicTitleEn: "Addition and subtraction up to 100",
        difficultyLevel: "basic",
        lessonType: "practice",
        skills: ["two_digit_addition", "two_digit_subtraction", "place_value"],
      },
      {
        topicId: "multiplication_intro",
        topicTitleBg: "Въведение в умножението",
        topicTitleEn: "Introduction to multiplication",
        difficultyLevel: "basic",
        lessonType: "lesson",
        skills: ["repeated_addition", "multiplication_concept", "times_tables_2_3"],
      },
      {
        topicId: "division_intro",
        topicTitleBg: "Въведение в делението",
        topicTitleEn: "Introduction to division",
        difficultyLevel: "basic",
        lessonType: "lesson",
        skills: ["equal_groups", "division_concept", "sharing"],
      },
    ],
  },

  // ── Mathematics Grade 3 ────────────────────────────────────────────────────
  {
    grade: 3,
    subjectId: "mathematics",
    topics: [
      {
        topicId: "multiplication_tables",
        topicTitleBg: "Таблица за умножение",
        topicTitleEn: "Multiplication tables",
        difficultyLevel: "intermediate",
        lessonType: "practice",
        skills: ["times_tables_1_10", "multiplication_fluency"],
      },
      {
        topicId: "division_facts",
        topicTitleBg: "Факти за деление",
        topicTitleEn: "Division facts",
        difficultyLevel: "intermediate",
        lessonType: "practice",
        skills: ["division_fluency", "inverse_operations"],
      },
      {
        topicId: "word_problems_basic",
        topicTitleBg: "Текстови задачи (основни)",
        topicTitleEn: "Word problems (basic)",
        difficultyLevel: "intermediate",
        lessonType: "reading",
        skills: ["problem_comprehension", "choose_operation", "single_step"],
      },
    ],
  },

  // ── Mathematics Grade 4 ────────────────────────────────────────────────────
  {
    grade: 4,
    subjectId: "mathematics",
    topics: [
      {
        topicId: "larger_numbers",
        topicTitleBg: "По-големи числа",
        topicTitleEn: "Larger numbers",
        difficultyLevel: "advanced",
        lessonType: "lesson",
        skills: ["thousands", "place_value_extended", "number_reading"],
      },
      {
        topicId: "multi_step_operations",
        topicTitleBg: "Многостъпкови операции",
        topicTitleEn: "Multi-step operations",
        difficultyLevel: "advanced",
        lessonType: "practice",
        skills: ["order_of_operations", "multi_step_problems"],
      },
      {
        topicId: "fractions_intro",
        topicTitleBg: "Въведение в дробите",
        topicTitleEn: "Introduction to fractions",
        difficultyLevel: "advanced",
        lessonType: "lesson",
        skills: ["fraction_concept", "numerator_denominator", "half_quarter"],
      },
      {
        topicId: "word_problems_extended",
        topicTitleBg: "Текстови задачи (разширени)",
        topicTitleEn: "Word problems (extended)",
        difficultyLevel: "advanced",
        lessonType: "reading",
        skills: ["multi_step_comprehension", "choose_strategy", "check_answer"],
      },
    ],
  },

  // ── Bulgarian Language Grade 1 ─────────────────────────────────────────────
  {
    grade: 1,
    subjectId: "bulgarian_language",
    topics: [
      {
        topicId: "letters_and_sounds",
        topicTitleBg: "Букви и звукове",
        topicTitleEn: "Letters and sounds",
        difficultyLevel: "intro",
        lessonType: "lesson",
        skills: ["letter_recognition", "sound_letter_mapping", "phonemic_awareness"],
      },
      {
        topicId: "vowels_and_consonants",
        topicTitleBg: "Гласни и съгласни",
        topicTitleEn: "Vowels and consonants",
        difficultyLevel: "intro",
        lessonType: "lesson",
        skills: ["identify_vowels", "identify_consonants", "classify_sounds"],
      },
      {
        topicId: "syllables",
        topicTitleBg: "Срички",
        topicTitleEn: "Syllables",
        difficultyLevel: "basic",
        lessonType: "practice",
        skills: ["syllable_splitting", "syllable_count", "clap_syllables"],
      },
      {
        topicId: "simple_words",
        topicTitleBg: "Прости думи",
        topicTitleEn: "Simple words",
        difficultyLevel: "basic",
        lessonType: "reading",
        skills: ["sight_words_bg", "decode_cvc", "word_recognition"],
      },
      {
        topicId: "simple_sentences",
        topicTitleBg: "Прости изречения",
        topicTitleEn: "Simple sentences",
        difficultyLevel: "basic",
        lessonType: "writing",
        skills: ["sentence_concept", "capital_letter", "full_stop"],
      },
    ],
  },

  // ── Reading & Literature Grade 1 ───────────────────────────────────────────
  {
    grade: 1,
    subjectId: "reading-literature",
    topics: [
      {
        topicId: "simple_stories",
        topicTitleBg: "Прости разкази",
        topicTitleEn: "Simple stories",
        difficultyLevel: "intro",
        lessonType: "reading",
        skills: ["story_comprehension", "identify_characters", "sequence_events"],
      },
      {
        topicId: "reading_comprehension_intro",
        topicTitleBg: "Начално разбиране на текст",
        topicTitleEn: "Reading comprehension basics",
        difficultyLevel: "basic",
        lessonType: "reading",
        skills: ["answer_questions", "find_details", "understand_purpose"],
      },
      {
        topicId: "simple_poetry",
        topicTitleBg: "Проста поезия",
        topicTitleEn: "Simple poetry",
        difficultyLevel: "intro",
        lessonType: "reading",
        skills: ["rhyme_recognition", "rhythm", "emotional_response"],
      },
      {
        topicId: "story_characters",
        topicTitleBg: "Герои и техните дела",
        topicTitleEn: "Characters and their actions",
        difficultyLevel: "basic",
        lessonType: "lesson",
        skills: ["character_traits", "character_motivation", "story_role"],
      },
      {
        topicId: "story_retelling",
        topicTitleBg: "Преразказ на истории",
        topicTitleEn: "Story retelling",
        difficultyLevel: "basic",
        lessonType: "writing",
        skills: ["sequence_recall", "describe_events", "summarize"],
      },
    ],
  },

  // ── Logic & Thinking Grade 1 ────────────────────────────────────────────────
  {
    grade: 1,
    subjectId: "logic-thinking",
    topics: [
      {
        topicId: "color_patterns",
        topicTitleBg: "Цветни закономерности",
        topicTitleEn: "Color patterns",
        difficultyLevel: "intro",
        lessonType: "game",
        skills: ["pattern_recognition", "predict_next", "color_sequence"],
      },
      {
        topicId: "number_patterns",
        topicTitleBg: "Числови закономерности",
        topicTitleEn: "Number patterns",
        difficultyLevel: "intro",
        lessonType: "practice",
        skills: ["sequence", "counting_pattern", "predict_continuation"],
      },
      {
        topicId: "visual_puzzles",
        topicTitleBg: "Визуални пъзели",
        topicTitleEn: "Visual puzzles",
        difficultyLevel: "basic",
        lessonType: "game",
        skills: ["spatial_reasoning", "problem_solving", "logic"],
      },
      {
        topicId: "size_comparison",
        topicTitleBg: "Сравняване по размер",
        topicTitleEn: "Comparing sizes",
        difficultyLevel: "intro",
        lessonType: "practice",
        skills: ["bigger_smaller", "tallest_shortest", "comparison"],
      },
      {
        topicId: "ordering_sequence",
        topicTitleBg: "Наредба в поредица",
        topicTitleEn: "Ordering in sequence",
        difficultyLevel: "basic",
        lessonType: "practice",
        skills: ["sequence_order", "before_after", "logical_order"],
      },
    ],
  },

  // ── Nature & Science Grade 1 ────────────────────────────────────────────────
  {
    grade: 1,
    subjectId: "nature-science",
    topics: [
      {
        topicId: "plants_basics",
        topicTitleBg: "Растения - основи",
        topicTitleEn: "Plants - basics",
        difficultyLevel: "intro",
        lessonType: "lesson",
        skills: ["plant_parts", "growth", "needs_of_plants"],
      },
      {
        topicId: "animals_habitats",
        topicTitleBg: "Животни и техните домове",
        topicTitleEn: "Animals and their habitats",
        difficultyLevel: "intro",
        lessonType: "lesson",
        skills: ["animal_types", "habitat_match", "animal_needs"],
      },
      {
        topicId: "earth_basics",
        topicTitleBg: "Земята - основи",
        topicTitleEn: "Earth basics",
        difficultyLevel: "intro",
        lessonType: "lesson",
        skills: ["day_night", "sun_moon", "earth_movement"],
      },
      {
        topicId: "seasons_changes",
        topicTitleBg: "Сезонни промени",
        topicTitleEn: "Seasonal changes",
        difficultyLevel: "basic",
        lessonType: "lesson",
        skills: ["season_characteristics", "weather_changes", "plant_animal_changes"],
      },
      {
        topicId: "weather_observation",
        topicTitleBg: "Наблюдение на времето",
        topicTitleEn: "Weather observation",
        difficultyLevel: "intro",
        lessonType: "practice",
        skills: ["weather_types", "weather_effects", "clothing_weather"],
      },
    ],
  },

  // ── Bulgarian Language Grade 2 ─────────────────────────────────────────────
  {
    grade: 2,
    subjectId: "bulgarian_language",
    topics: [
      {
        topicId: "reading_comprehension_basic",
        topicTitleBg: "Четене с разбиране (основно)",
        topicTitleEn: "Basic reading comprehension",
        difficultyLevel: "basic",
        lessonType: "reading",
        skills: ["literal_comprehension", "answer_questions", "retell"],
      },
      {
        topicId: "nouns_basic",
        topicTitleBg: "Съществителни имена (основни)",
        topicTitleEn: "Nouns (basic)",
        difficultyLevel: "basic",
        lessonType: "lesson",
        skills: ["identify_nouns", "noun_gender_bg", "singular_plural"],
      },
      {
        topicId: "verbs_basic",
        topicTitleBg: "Глаголи (основни)",
        topicTitleEn: "Verbs (basic)",
        difficultyLevel: "basic",
        lessonType: "lesson",
        skills: ["identify_verbs", "action_words", "verb_in_sentence"],
      },
      {
        topicId: "sentence_building",
        topicTitleBg: "Съставяне на изречения",
        topicTitleEn: "Sentence building",
        difficultyLevel: "basic",
        lessonType: "writing",
        skills: ["subject_predicate", "expand_sentence", "sentence_order"],
      },
    ],
  },

  // ── Bulgarian Language Grade 3 ─────────────────────────────────────────────
  {
    grade: 3,
    subjectId: "bulgarian_language",
    topics: [
      {
        topicId: "parts_of_speech_intro",
        topicTitleBg: "Части на речта (въведение)",
        topicTitleEn: "Parts of speech (introduction)",
        difficultyLevel: "intermediate",
        lessonType: "lesson",
        skills: ["noun_verb_adjective", "identify_pos", "classify_words"],
      },
      {
        topicId: "spelling_rules_basic",
        topicTitleBg: "Правописни правила (основни)",
        topicTitleEn: "Basic spelling rules",
        difficultyLevel: "intermediate",
        lessonType: "practice",
        skills: ["apply_spelling_rules", "common_errors_bg", "dictation_prep"],
      },
      {
        topicId: "short_text_comprehension",
        topicTitleBg: "Разбиране на кратък текст",
        topicTitleEn: "Short text comprehension",
        difficultyLevel: "intermediate",
        lessonType: "reading",
        skills: ["main_idea", "supporting_details", "inference_basic"],
      },
    ],
  },

  // ── Bulgarian Language Grade 4 ─────────────────────────────────────────────
  {
    grade: 4,
    subjectId: "bulgarian_language",
    topics: [
      {
        topicId: "sentence_parts_intro",
        topicTitleBg: "Части на изречението",
        topicTitleEn: "Parts of the sentence",
        difficultyLevel: "advanced",
        lessonType: "lesson",
        skills: ["subject", "predicate", "object", "sentence_analysis"],
      },
      {
        topicId: "grammar_review",
        topicTitleBg: "Преговор по граматика",
        topicTitleEn: "Grammar review",
        difficultyLevel: "advanced",
        lessonType: "practice",
        skills: ["pos_review", "case_basics", "agreement"],
      },
      {
        topicId: "reading_comprehension_extended",
        topicTitleBg: "Четене с разбиране (разширено)",
        topicTitleEn: "Extended reading comprehension",
        difficultyLevel: "advanced",
        lessonType: "reading",
        skills: ["extended_inference", "author_purpose", "text_structure"],
      },
      {
        topicId: "short_written_response",
        topicTitleBg: "Кратко писмено изложение",
        topicTitleEn: "Short written response",
        difficultyLevel: "advanced",
        lessonType: "writing",
        skills: ["paragraph_structure", "topic_sentence", "supporting_ideas", "conclusion"],
      },
    ],
  },

  // ── Mathematics Grade 5 (Foundation: Natural numbers, Fractions, Geometry) ─────
  {
    grade: 5,
    subjectId: "mathematics-advanced",
    topics: [
      { topicId: "nat-num-review", topicTitleBg: "Преглед на натуралните числа", topicTitleEn: "Natural numbers review", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["counting", "place_value", "number_sense"] },
      { topicId: "addition-subtraction", topicTitleBg: "Събиране и изваждане", topicTitleEn: "Addition and subtraction", difficultyLevel: "intermediate", lessonType: "practice", skills: ["add_subtract", "mental_math", "estimate"] },
      { topicId: "multiplication-facts", topicTitleBg: "Таблица за умножение", topicTitleEn: "Multiplication facts", difficultyLevel: "intermediate", lessonType: "practice", skills: ["multiply", "times_tables", "skip_counting"] },
      { topicId: "division-basics", topicTitleBg: "Деление на естествени числа", topicTitleEn: "Division basics", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["divide", "remainders", "long_division"] },
      { topicId: "divisibility-rules", topicTitleBg: "Делимост на числата", topicTitleEn: "Divisibility rules", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["divisors", "multiples", "prime_composite"] },
      { topicId: "factors-multiples", topicTitleBg: "Делители и кратни", topicTitleEn: "Factors and multiples", difficultyLevel: "intermediate", lessonType: "practice", skills: ["find_factors", "find_multiples", "lcm_gcd"] },
      { topicId: "prime-numbers", topicTitleBg: "Прости числа", topicTitleEn: "Prime numbers", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_primes", "prime_factorization"] },
      { topicId: "order-of-operations", topicTitleBg: "Редът на операциите", topicTitleEn: "Order of operations", difficultyLevel: "intermediate", lessonType: "practice", skills: ["pemdas", "evaluate_expressions"] },
      { topicId: "fractions-intro", topicTitleBg: "Въведение в дробите", topicTitleEn: "Fractions introduction", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["fraction_parts", "identify_fractions", "equivalent_fractions"] },
      { topicId: "comparing-fractions", topicTitleBg: "Сравняване на дроби", topicTitleEn: "Comparing fractions", difficultyLevel: "intermediate", lessonType: "practice", skills: ["compare", "order", "number_line_fractions"] },
      { topicId: "fractions-addition", topicTitleBg: "Събиране на дроби", topicTitleEn: "Adding fractions", difficultyLevel: "intermediate", lessonType: "practice", skills: ["common_denominator", "add_like_unlike"] },
      { topicId: "fractions-subtraction", topicTitleBg: "Изваждане на дроби", topicTitleEn: "Subtracting fractions", difficultyLevel: "intermediate", lessonType: "practice", skills: ["subtract_fractions", "borrow"] },
      { topicId: "mixed-numbers", topicTitleBg: "Смесени числа", topicTitleEn: "Mixed numbers", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["convert_mixed", "improper_fractions"] },
      { topicId: "decimals-intro", topicTitleBg: "Въведение в десетичните числа", topicTitleEn: "Decimals introduction", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["decimal_notation", "place_value_decimals", "tenths_hundredths"] },
      { topicId: "comparing-decimals", topicTitleBg: "Сравняване на десетични числа", topicTitleEn: "Comparing decimals", difficultyLevel: "intermediate", lessonType: "practice", skills: ["order_decimals", "number_line"] },
      { topicId: "decimals-addition", topicTitleBg: "Събиране на десетични числа", topicTitleEn: "Adding decimals", difficultyLevel: "intermediate", lessonType: "practice", skills: ["align_decimal", "add_decimals"] },
      { topicId: "decimals-subtraction", topicTitleBg: "Изваждане на десетични числа", topicTitleEn: "Subtracting decimals", difficultyLevel: "intermediate", lessonType: "practice", skills: ["subtract_decimals", "borrow_decimals"] },
      { topicId: "decimals-multiplication", topicTitleBg: "Умножение на десетични числа", topicTitleEn: "Multiplying decimals", difficultyLevel: "intermediate", lessonType: "practice", skills: ["multiply_decimals", "place_value"] },
      { topicId: "decimals-division", topicTitleBg: "Деление на десетични числа", topicTitleEn: "Dividing decimals", difficultyLevel: "intermediate", lessonType: "practice", skills: ["divide_decimals", "long_division"] },
      { topicId: "fractions-decimals", topicTitleBg: "Преобразуване дроби-десетични", topicTitleEn: "Fractions and decimals", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["convert_fraction_decimal", "percent_basics"] },
      { topicId: "percentages-basic", topicTitleBg: "Проценти - основи", topicTitleEn: "Percentages basics", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["percent_concept", "find_percent", "percent_of"] },
      { topicId: "measurement-length", topicTitleBg: "Мерни единици - дължина", topicTitleEn: "Length measurement", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["mm_cm_m_km", "convert_length"] },
      { topicId: "measurement-weight", topicTitleBg: "Мерни единици - маса", topicTitleEn: "Weight/Mass measurement", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["g_kg", "convert_weight"] },
      { topicId: "measurement-volume", topicTitleBg: "Мерни единици - обем", topicTitleEn: "Volume measurement", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["ml_l", "convert_volume"] },
      { topicId: "area-perimeter", topicTitleBg: "Площ и периметър", topicTitleEn: "Area and perimeter", difficultyLevel: "intermediate", lessonType: "practice", skills: ["rectangle_area", "triangle_area", "perimeter"] },
      { topicId: "angles-basics", topicTitleBg: "Ъгли - основи", topicTitleEn: "Angles basics", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["angle_types", "measure_angles"] },
      { topicId: "triangles-types", topicTitleBg: "Видове триъгълници", topicTitleEn: "Types of triangles", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["classify_triangles", "triangle_properties"] },
      { topicId: "quadrilaterals", topicTitleBg: "Четириъгълници", topicTitleEn: "Quadrilaterals", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["classify_quadrilaterals", "properties"] },
      { topicId: "circles-basics", topicTitleBg: "Окръжност - основи", topicTitleEn: "Circles basics", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["circle_parts", "radius_diameter"] },
      { topicId: "polygons", topicTitleBg: "Многоъгълници", topicTitleEn: "Polygons", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["classify_polygons", "properties"] },
      { topicId: "symmetry-basics", topicTitleBg: "Симетрия", topicTitleEn: "Symmetry", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["line_symmetry", "identify_symmetry"] },
      { topicId: "word-problems-5", topicTitleBg: "Текстови задачи", topicTitleEn: "Word problems", difficultyLevel: "intermediate", lessonType: "reading", skills: ["problem_solving", "choose_operation"] },
      { topicId: "estimation-5", topicTitleBg: "Приблизни пресмятания", topicTitleEn: "Estimation", difficultyLevel: "intermediate", lessonType: "practice", skills: ["estimate", "rounding"] },
      { topicId: "data-interpretation", topicTitleBg: "Интерпретация на данни", topicTitleEn: "Data interpretation", difficultyLevel: "intermediate", lessonType: "reading", skills: ["read_charts", "interpret_graphs"] },
    ],
  },

  // ── Bulgarian Language Grade 5 (Foundation: Phonetics, Parts of Speech) ──────
  {
    grade: 5,
    subjectId: "bulgarian-language-adv",
    topics: [
      { topicId: "phonetics-review", topicTitleBg: "Фонетика - преглед", topicTitleEn: "Phonetics review", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["vowels", "consonants", "syllables"] },
      { topicId: "word-stress", topicTitleBg: "Ударение в думите", topicTitleEn: "Word stress", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_stress", "pronunciation"] },
      { topicId: "alphabets-writing", topicTitleBg: "Правила на писане", topicTitleEn: "Writing rules", difficultyLevel: "intermediate", lessonType: "practice", skills: ["capitalization", "punctuation_basic"] },
      { topicId: "nouns-types", topicTitleBg: "Съществителни имена - видове", topicTitleEn: "Noun types", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["common_proper", "concrete_abstract"] },
      { topicId: "noun-gender", topicTitleBg: "Род на съществителното", topicTitleEn: "Noun gender", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["masculine_feminine", "neuter"] },
      { topicId: "noun-number", topicTitleBg: "Число на съществителното", topicTitleEn: "Noun number", difficultyLevel: "intermediate", lessonType: "practice", skills: ["singular_plural", "noun_forms"] },
      { topicId: "adjectives-types", topicTitleBg: "Прилагателни имена", topicTitleEn: "Adjectives", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["descriptive", "agreement"] },
      { topicId: "adjectives-comparison", topicTitleBg: "Сравнение на прилагателни", topicTitleEn: "Adjective comparison", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["comparative", "superlative"] },
      { topicId: "verbs-infinitive", topicTitleBg: "Глаголи - инфинитив", topicTitleEn: "Verbs infinitive", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_verbs", "verb_forms"] },
      { topicId: "verbs-tense-present", topicTitleBg: "Сегашно време", topicTitleEn: "Present tense", difficultyLevel: "intermediate", lessonType: "practice", skills: ["form_present", "use_present"] },
      { topicId: "verbs-tense-past", topicTitleBg: "Минало време", topicTitleEn: "Past tense", difficultyLevel: "intermediate", lessonType: "practice", skills: ["form_past", "use_past"] },
      { topicId: "verbs-tense-future", topicTitleBg: "Бъдеще време", topicTitleEn: "Future tense", difficultyLevel: "intermediate", lessonType: "practice", skills: ["form_future", "use_future"] },
      { topicId: "pronouns-personal", topicTitleBg: "Лични местоимения", topicTitleEn: "Personal pronouns", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_pronouns", "pronoun_forms"] },
      { topicId: "pronouns-possessive", topicTitleBg: "Притежателни местоимения", topicTitleEn: "Possessive pronouns", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["possessive_forms", "usage"] },
      { topicId: "prepositions", topicTitleBg: "Предлози", topicTitleEn: "Prepositions", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_prepositions", "usage"] },
      { topicId: "conjunctions", topicTitleBg: "Съюзи", topicTitleEn: "Conjunctions", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["types_conjunctions", "usage"] },
      { topicId: "sentence-simple", topicTitleBg: "Просто изречение", topicTitleEn: "Simple sentence", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["subject_predicate", "sentence_parts"] },
      { topicId: "sentence-subject-predicate", topicTitleBg: "Подлог и сказуемо", topicTitleEn: "Subject and predicate", difficultyLevel: "intermediate", lessonType: "practice", skills: ["identify_subject", "identify_predicate"] },
      { topicId: "direct-object", topicTitleBg: "Преко допълнение", topicTitleEn: "Direct object", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_object", "usage"] },
      { topicId: "indirect-object", topicTitleBg: "Непреко допълнение", topicTitleEn: "Indirect object", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_indirect", "usage"] },
      { topicId: "adverbials", topicTitleBg: "Обстоятелства", topicTitleEn: "Adverbials", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["time", "place", "manner"] },
      { topicId: "punctuation-period", topicTitleBg: "Точка", topicTitleEn: "Period", difficultyLevel: "intermediate", lessonType: "practice", skills: ["use_period"] },
      { topicId: "punctuation-comma", topicTitleBg: "Запетая", topicTitleEn: "Comma", difficultyLevel: "intermediate", lessonType: "practice", skills: ["comma_rules"] },
      { topicId: "punctuation-question", topicTitleBg: "Въпросителен знак", topicTitleEn: "Question mark", difficultyLevel: "intermediate", lessonType: "practice", skills: ["questions"] },
      { topicId: "punctuation-exclamation", topicTitleBg: "Удивителен знак", topicTitleEn: "Exclamation mark", difficultyLevel: "intermediate", lessonType: "practice", skills: ["emotions", "emphasis"] },
      { topicId: "direct-speech", topicTitleBg: "Преки реч", topicTitleEn: "Direct speech", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["quotation_marks", "dialogue"] },
      { topicId: "vocabulary-synonyms", topicTitleBg: "Синоними", topicTitleEn: "Synonyms", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_synonyms", "usage"] },
      { topicId: "vocabulary-antonyms", topicTitleBg: "Антоними", topicTitleEn: "Antonyms", difficultyLevel: "intermediate", lessonType: "lesson", skills: ["identify_antonyms", "usage"] },
      { topicId: "reading-comprehension", topicTitleBg: "Разбиране на прочетеното", topicTitleEn: "Reading comprehension", difficultyLevel: "intermediate", lessonType: "reading", skills: ["understand", "answer_questions"] },
      { topicId: "writing-sentences", topicTitleBg: "Писане на изречения", topicTitleEn: "Sentence writing", difficultyLevel: "intermediate", lessonType: "writing", skills: ["construct", "punctuate"] },
      { topicId: "writing-paragraph", topicTitleBg: "Писане на абзац", topicTitleEn: "Paragraph writing", difficultyLevel: "intermediate", lessonType: "writing", skills: ["organize", "develop_ideas"] },
    ],
  },

  // ── Mathematics Grade 6 (Intermediate: Ratios, Algebra, Advanced Geometry) ────
  {
    grade: 6,
    subjectId: "mathematics-advanced",
    topics: [
      { topicId: "ratios-intro", topicTitleBg: "Съотношения - основи", topicTitleEn: "Ratios introduction", difficultyLevel: "advanced", lessonType: "lesson", skills: ["ratio_concept", "simplify_ratios"] },
      { topicId: "equivalent-ratios", topicTitleBg: "Равносилни съотношения", topicTitleEn: "Equivalent ratios", difficultyLevel: "advanced", lessonType: "practice", skills: ["scale_ratios"] },
      { topicId: "proportions", topicTitleBg: "Пропорции", topicTitleEn: "Proportions", difficultyLevel: "advanced", lessonType: "lesson", skills: ["solve_proportions", "cross_multiply"] },
      { topicId: "unit-rates", topicTitleBg: "Единични норми", topicTitleEn: "Unit rates", difficultyLevel: "advanced", lessonType: "practice", skills: ["find_unit_rate", "compare"] },
      { topicId: "scale-factor", topicTitleBg: "Масштаб", topicTitleEn: "Scale factor", difficultyLevel: "advanced", lessonType: "lesson", skills: ["scale_drawings", "enlarge_reduce"] },
      { topicId: "percentages-advanced", topicTitleBg: "Проценти - напредок", topicTitleEn: "Percentages advanced", difficultyLevel: "advanced", lessonType: "lesson", skills: ["percent_of", "find_percent", "discount"] },
      { topicId: "discount-tax", topicTitleBg: "Отстъпка и ДДС", topicTitleEn: "Discount and tax", difficultyLevel: "advanced", lessonType: "practice", skills: ["calculate_discount", "calculate_tax"] },
      { topicId: "interest-simple", topicTitleBg: "Простата лихва", topicTitleEn: "Simple interest", difficultyLevel: "advanced", lessonType: "lesson", skills: ["calculate_interest"] },
      { topicId: "integers-intro", topicTitleBg: "Цели числа - основи", topicTitleEn: "Integers introduction", difficultyLevel: "advanced", lessonType: "lesson", skills: ["positive_negative", "number_line"] },
      { topicId: "integers-operations", topicTitleBg: "Операции с цели числа", topicTitleEn: "Integer operations", difficultyLevel: "advanced", lessonType: "practice", skills: ["add_integers", "subtract_integers", "multiply_divide"] },
      { topicId: "rational-numbers", topicTitleBg: "Рационални числа", topicTitleEn: "Rational numbers", difficultyLevel: "advanced", lessonType: "lesson", skills: ["rational_forms", "operations"] },
      { topicId: "absolute-value", topicTitleBg: "Абсолютна стойност", topicTitleEn: "Absolute value", difficultyLevel: "advanced", lessonType: "lesson", skills: ["find_absolute", "distance"] },
      { topicId: "expressions-algebraic", topicTitleBg: "Алгебрични изрази", topicTitleEn: "Algebraic expressions", difficultyLevel: "advanced", lessonType: "lesson", skills: ["variables", "evaluate_expressions"] },
      { topicId: "simplify-expressions", topicTitleBg: "Опростяване на изрази", topicTitleEn: "Simplify expressions", difficultyLevel: "advanced", lessonType: "practice", skills: ["combine_like_terms", "distributive_property"] },
      { topicId: "one-step-equations", topicTitleBg: "Уравнения в един ход", topicTitleEn: "One-step equations", difficultyLevel: "advanced", lessonType: "practice", skills: ["solve_one_step"] },
      { topicId: "two-step-equations", topicTitleBg: "Уравнения в два хода", topicTitleEn: "Two-step equations", difficultyLevel: "advanced", lessonType: "practice", skills: ["solve_two_step"] },
      { topicId: "coordinate-plane", topicTitleBg: "Координатна равнина", topicTitleEn: "Coordinate plane", difficultyLevel: "advanced", lessonType: "lesson", skills: ["plot_points", "quadrants", "ordered_pairs"] },
      { topicId: "graphing-linear", topicTitleBg: "Графики на линейни функции", topicTitleEn: "Graphing linear", difficultyLevel: "advanced", lessonType: "practice", skills: ["linear_graphs", "slope_intercept"] },
      { topicId: "slopes", topicTitleBg: "Наклон", topicTitleEn: "Slopes", difficultyLevel: "advanced", lessonType: "lesson", skills: ["calculate_slope", "interpret_slope"] },
      { topicId: "distance-formula", topicTitleBg: "Формула за разстояние", topicTitleEn: "Distance formula", difficultyLevel: "advanced", lessonType: "lesson", skills: ["calculate_distance"] },
      { topicId: "midpoint-formula", topicTitleBg: "Формула за средна точка", topicTitleEn: "Midpoint formula", difficultyLevel: "advanced", lessonType: "lesson", skills: ["find_midpoint"] },
      { topicId: "angles-advanced", topicTitleBg: "Ъгли - напредок", topicTitleEn: "Angles advanced", difficultyLevel: "advanced", lessonType: "lesson", skills: ["angle_relationships", "angle_sum"] },
      { topicId: "triangles-advanced", topicTitleBg: "Триъгълници - напредок", topicTitleEn: "Triangles advanced", difficultyLevel: "advanced", lessonType: "lesson", skills: ["triangle_properties", "angle_sum"] },
      { topicId: "congruence", topicTitleBg: "Конгруентност", topicTitleEn: "Congruence", difficultyLevel: "advanced", lessonType: "lesson", skills: ["identify_congruent", "sss_sas"] },
      { topicId: "similarity", topicTitleBg: "Подобие", topicTitleEn: "Similarity", difficultyLevel: "advanced", lessonType: "lesson", skills: ["identify_similar", "proportional_sides"] },
      { topicId: "area-advanced", topicTitleBg: "Площ - напредок", topicTitleEn: "Area advanced", difficultyLevel: "advanced", lessonType: "practice", skills: ["composite_shapes", "irregular_shapes"] },
      { topicId: "circles-advanced", topicTitleBg: "Окръжност - напредок", topicTitleEn: "Circles advanced", difficultyLevel: "advanced", lessonType: "lesson", skills: ["circumference", "area_circle"] },
      { topicId: "volume-intro", topicTitleBg: "Обем - основи", topicTitleEn: "Volume introduction", difficultyLevel: "advanced", lessonType: "lesson", skills: ["rectangular_prism", "volume_concept"] },
      { topicId: "surface-area", topicTitleBg: "Повърхностна площ", topicTitleEn: "Surface area", difficultyLevel: "advanced", lessonType: "practice", skills: ["net_diagrams", "calculate_surface"] },
      { topicId: "pythagorean-theorem", topicTitleBg: "Питагорова теорема", topicTitleEn: "Pythagorean theorem", difficultyLevel: "advanced", lessonType: "lesson", skills: ["apply_theorem"] },
      { topicId: "transformations", topicTitleBg: "Трансформации", topicTitleEn: "Transformations", difficultyLevel: "advanced", lessonType: "lesson", skills: ["translations", "reflections", "rotations"] },
      { topicId: "statistics-basics", topicTitleBg: "Статистика - основи", topicTitleEn: "Statistics basics", difficultyLevel: "advanced", lessonType: "lesson", skills: ["mean", "median", "mode", "range"] },
      { topicId: "probability-basics", topicTitleBg: "Вероятност - основи", topicTitleEn: "Probability basics", difficultyLevel: "advanced", lessonType: "lesson", skills: ["theoretical", "experimental", "outcomes"] },
    ],
  },

  // ── Bulgarian Language Grade 6 (Intermediate: Complex Sentences, Text Analysis) 
  {
    grade: 6,
    subjectId: "bulgarian-language-adv",
    topics: [
      { topicId: "sentence-compound", topicTitleBg: "Съставно изречение", topicTitleEn: "Compound sentence", difficultyLevel: "advanced", lessonType: "lesson", skills: ["coordinate_clauses", "conjunctions"] },
      { topicId: "sentence-complex", topicTitleBg: "Сложно изречение", topicTitleEn: "Complex sentence", difficultyLevel: "advanced", lessonType: "lesson", skills: ["main_clause", "subordinate_clause"] },
      { topicId: "dependent-clauses", topicTitleBg: "Придаточни клаузи", topicTitleEn: "Dependent clauses", difficultyLevel: "advanced", lessonType: "lesson", skills: ["identify_clauses", "relationships"] },
      { topicId: "adverbs-types", topicTitleBg: "Наречия - видове", topicTitleEn: "Adverb types", difficultyLevel: "advanced", lessonType: "lesson", skills: ["classify_adverbs", "usage"] },
      { topicId: "adverbial-phrases", topicTitleBg: "Наречни фрази", topicTitleEn: "Adverbial phrases", difficultyLevel: "advanced", lessonType: "lesson", skills: ["identify_phrases", "modify_verbs"] },
      { topicId: "infinitive-phrases", topicTitleBg: "Инфинитивни фрази", topicTitleEn: "Infinitive phrases", difficultyLevel: "advanced", lessonType: "lesson", skills: ["identify", "usage"] },
      { topicId: "participles", topicTitleBg: "Причастия", topicTitleEn: "Participles", difficultyLevel: "advanced", lessonType: "lesson", skills: ["present_participles", "past_participles"] },
      { topicId: "gerunds", topicTitleBg: "Герунди", topicTitleEn: "Gerunds", difficultyLevel: "advanced", lessonType: "lesson", skills: ["noun_form", "usage"] },
      { topicId: "active-passive", topicTitleBg: "Активен и пасивен залог", topicTitleEn: "Active and passive voice", difficultyLevel: "advanced", lessonType: "lesson", skills: ["transform_voice"] },
      { topicId: "mood-indicative", topicTitleBg: "Изяви - изъявителен", topicTitleEn: "Indicative mood", difficultyLevel: "advanced", lessonType: "lesson", skills: ["facts", "reality"] },
      { topicId: "mood-subjunctive", topicTitleBg: "Изяви - условен", topicTitleEn: "Subjunctive mood", difficultyLevel: "advanced", lessonType: "lesson", skills: ["conditions", "wishes"] },
      { topicId: "mood-imperative", topicTitleBg: "Изяви - повелителен", topicTitleEn: "Imperative mood", difficultyLevel: "advanced", lessonType: "lesson", skills: ["commands", "requests"] },
      { topicId: "punctuation-semicolon", topicTitleBg: "Точка и запетая", topicTitleEn: "Semicolon", difficultyLevel: "advanced", lessonType: "practice", skills: ["join_clauses"] },
      { topicId: "punctuation-colon", topicTitleBg: "Двоеточие", topicTitleEn: "Colon", difficultyLevel: "advanced", lessonType: "practice", skills: ["introduce_lists"] },
      { topicId: "punctuation-quotation", topicTitleBg: "Кавички", topicTitleEn: "Quotation marks", difficultyLevel: "advanced", lessonType: "practice", skills: ["direct_speech", "titles"] },
      { topicId: "punctuation-apostrophe", topicTitleBg: "Апостроф", topicTitleEn: "Apostrophe", difficultyLevel: "advanced", lessonType: "practice", skills: ["contractions", "possessives"] },
      { topicId: "punctuation-dash", topicTitleBg: "Тире", topicTitleEn: "Dash", difficultyLevel: "advanced", lessonType: "practice", skills: ["emphasis", "interruption"] },
      { topicId: "punctuation-parentheses", topicTitleBg: "Скоби", topicTitleEn: "Parentheses", difficultyLevel: "advanced", lessonType: "practice", skills: ["additional_info"] },
      { topicId: "morphology-advanced", topicTitleBg: "Морфология - напредок", topicTitleEn: "Morphology advanced", difficultyLevel: "advanced", lessonType: "lesson", skills: ["complex_words", "affixes"] },
      { topicId: "word-roots", topicTitleBg: "Коренови на думи", topicTitleEn: "Word roots", difficultyLevel: "advanced", lessonType: "lesson", skills: ["etymology", "meaning"] },
      { topicId: "vocabulary-context", topicTitleBg: "Думи в контекст", topicTitleEn: "Words in context", difficultyLevel: "advanced", lessonType: "lesson", skills: ["infer_meaning", "usage"] },
      { topicId: "figurative-language", topicTitleBg: "Образна реч", topicTitleEn: "Figurative language", difficultyLevel: "advanced", lessonType: "lesson", skills: ["metaphor", "simile", "personification"] },
      { topicId: "text-main-idea", topicTitleBg: "Главна идея в текста", topicTitleEn: "Main idea", difficultyLevel: "advanced", lessonType: "reading", skills: ["identify_main", "summarize"] },
      { topicId: "text-structure", topicTitleBg: "Структура на текста", topicTitleEn: "Text structure", difficultyLevel: "advanced", lessonType: "reading", skills: ["chronological", "cause_effect"] },
      { topicId: "author-purpose", topicTitleBg: "Цел на автора", topicTitleEn: "Author purpose", difficultyLevel: "advanced", lessonType: "reading", skills: ["inform", "entertain", "persuade"] },
      { topicId: "text-inference", topicTitleBg: "Изводи от текста", topicTitleEn: "Text inference", difficultyLevel: "advanced", lessonType: "reading", skills: ["make_inferences", "read_between_lines"] },
      { topicId: "essay-exposition", topicTitleBg: "Експозиционен есей", topicTitleEn: "Exposition essay", difficultyLevel: "advanced", lessonType: "writing", skills: ["explain", "develop_ideas"] },
      { topicId: "essay-narrative", topicTitleBg: "Наративен есей", topicTitleEn: "Narrative essay", difficultyLevel: "advanced", lessonType: "writing", skills: ["tell_story", "chronological"] },
      { topicId: "essay-persuasion", topicTitleBg: "Убеждаващ есей", topicTitleEn: "Persuasive essay", difficultyLevel: "advanced", lessonType: "writing", skills: ["argue", "support_claims"] },
      { topicId: "essay-structure", topicTitleBg: "Структура на есея", topicTitleEn: "Essay structure", difficultyLevel: "advanced", lessonType: "writing", skills: ["intro", "body", "conclusion"] },
    ],
  },

  // ── Mathematics Grade 7 (Advanced: Equations, Functions, Probability) ─────────
  {
    grade: 7,
    subjectId: "mathematics-advanced",
    topics: [
      { topicId: "linear-equations-solving", topicTitleBg: "Линейни уравнения - решаване", topicTitleEn: "Linear equations solving", difficultyLevel: "advanced", lessonType: "lesson", skills: ["solve_equations", "variables"] },
      { topicId: "multi-step-equations", topicTitleBg: "Многоходови уравнения", topicTitleEn: "Multi-step equations", difficultyLevel: "advanced", lessonType: "practice", skills: ["combine_operations", "distributive"] },
      { topicId: "variables-both-sides", topicTitleBg: "Променливи от двете страни", topicTitleEn: "Variables both sides", difficultyLevel: "advanced", lessonType: "practice", skills: ["isolate_variable"] },
      { topicId: "inequalities-linear", topicTitleBg: "Линейни неравенства", topicTitleEn: "Linear inequalities", difficultyLevel: "advanced", lessonType: "lesson", skills: ["solve_inequalities", "graph_inequalities"] },
      { topicId: "compound-inequalities", topicTitleBg: "Съединени неравенства", topicTitleEn: "Compound inequalities", difficultyLevel: "advanced", lessonType: "practice", skills: ["and_or", "solution_sets"] },
      { topicId: "absolute-value-equations", topicTitleBg: "Уравнения с абсолютна стойност", topicTitleEn: "Absolute value equations", difficultyLevel: "advanced", lessonType: "practice", skills: ["solve_absolute"] },
      { topicId: "functions-intro", topicTitleBg: "Функции - основи", topicTitleEn: "Functions introduction", difficultyLevel: "advanced", lessonType: "lesson", skills: ["function_notation", "domain_range"] },
      { topicId: "function-rules", topicTitleBg: "Правила на функциите", topicTitleEn: "Function rules", difficultyLevel: "advanced", lessonType: "lesson", skills: ["write_rules", "evaluate"] },
      { topicId: "linear-functions", topicTitleBg: "Линейни функции", topicTitleEn: "Linear functions", difficultyLevel: "advanced", lessonType: "lesson", skills: ["slope_intercept", "point_slope"] },
      { topicId: "nonlinear-functions", topicTitleBg: "Нелинейни функции", topicTitleEn: "Nonlinear functions", difficultyLevel: "advanced", lessonType: "lesson", skills: ["quadratic", "exponential"] },
      { topicId: "quadratic-functions", topicTitleBg: "Квадратни функции", topicTitleEn: "Quadratic functions", difficultyLevel: "advanced", lessonType: "lesson", skills: ["parabola", "vertex"] },
      { topicId: "systems-linear", topicTitleBg: "Системи линейни уравнения", topicTitleEn: "Systems of linear equations", difficultyLevel: "advanced", lessonType: "lesson", skills: ["substitution", "elimination", "graphing"] },
      { topicId: "exponents-laws", topicTitleBg: "Закони на степените", topicTitleEn: "Laws of exponents", difficultyLevel: "advanced", lessonType: "lesson", skills: ["power_rules", "simplify"] },
      { topicId: "scientific-notation", topicTitleBg: "Научна нотация", topicTitleEn: "Scientific notation", difficultyLevel: "advanced", lessonType: "lesson", skills: ["convert_notation", "operations"] },
      { topicId: "radicals", topicTitleBg: "Радикали", topicTitleEn: "Radicals", difficultyLevel: "advanced", lessonType: "lesson", skills: ["simplify_radicals", "operations"] },
      { topicId: "polynomial-operations", topicTitleBg: "Операции с полиноми", topicTitleEn: "Polynomial operations", difficultyLevel: "advanced", lessonType: "practice", skills: ["add_polynomials", "multiply_polynomials"] },
      { topicId: "factoring", topicTitleBg: "Разлагане на множители", topicTitleEn: "Factoring", difficultyLevel: "advanced", lessonType: "lesson", skills: ["common_factor", "trinomial"] },
      { topicId: "quadratic-formula", topicTitleBg: "Квадратна формула", topicTitleEn: "Quadratic formula", difficultyLevel: "advanced", lessonType: "lesson", skills: ["solve_quadratic"] },
      { topicId: "rational-expressions", topicTitleBg: "Рационални изрази", topicTitleEn: "Rational expressions", difficultyLevel: "advanced", lessonType: "lesson", skills: ["simplify", "operations"] },
      { topicId: "probability-compound", topicTitleBg: "Съединена вероятност", topicTitleEn: "Compound probability", difficultyLevel: "advanced", lessonType: "lesson", skills: ["independent", "dependent", "conditional"] },
      { topicId: "permutations-combinations", topicTitleBg: "Пермутации и комбинации", topicTitleEn: "Permutations and combinations", difficultyLevel: "advanced", lessonType: "lesson", skills: ["counting_principle", "factorial"] },
      { topicId: "statistics-advanced", topicTitleBg: "Статистика - напредок", topicTitleEn: "Statistics advanced", difficultyLevel: "advanced", lessonType: "lesson", skills: ["standard_deviation", "z_scores"] },
      { topicId: "normal-distribution", topicTitleBg: "Нормално разпределение", topicTitleEn: "Normal distribution", difficultyLevel: "advanced", lessonType: "lesson", skills: ["bell_curve", "percentiles"] },
      { topicId: "data-analysis", topicTitleBg: "Анализ на данни", topicTitleEn: "Data analysis", difficultyLevel: "advanced", lessonType: "reading", skills: ["interpret_data", "bias"] },
      { topicId: "sequences-arithmetic", topicTitleBg: "Аритметични прогресии", topicTitleEn: "Arithmetic sequences", difficultyLevel: "advanced", lessonType: "lesson", skills: ["find_terms", "sum"] },
      { topicId: "sequences-geometric", topicTitleBg: "Геометрични прогресии", topicTitleEn: "Geometric sequences", difficultyLevel: "advanced", lessonType: "lesson", skills: ["find_terms", "sum"] },
      { topicId: "trigonometry-basics", topicTitleBg: "Тригонометрия - основи", topicTitleEn: "Trigonometry basics", difficultyLevel: "advanced", lessonType: "lesson", skills: ["sine", "cosine", "tangent"] },
      { topicId: "trigonometric-ratios", topicTitleBg: "Тригонометрични съотношения", topicTitleEn: "Trigonometric ratios", difficultyLevel: "advanced", lessonType: "practice", skills: ["soh_cah_toa", "solve_triangles"] },
      { topicId: "similar-triangles-advanced", topicTitleBg: "Подобни триъгълници - напредок", topicTitleEn: "Similar triangles advanced", difficultyLevel: "advanced", lessonType: "practice", skills: ["proportional_sides", "angle_angle"] },
      { topicId: "circles-equations", topicTitleBg: "Уравнения на окръжности", topicTitleEn: "Circle equations", difficultyLevel: "advanced", lessonType: "lesson", skills: ["standard_form", "center_radius"] },
    ],
  },

  // ── Bulgarian Language Grade 7 (Advanced: Literary Analysis, Complex Writing) ──
  {
    grade: 7,
    subjectId: "bulgarian-language-adv",
    topics: [
      { topicId: "text-types-advanced", topicTitleBg: "Видове текстове - напредок", topicTitleEn: "Text types advanced", difficultyLevel: "advanced", lessonType: "lesson", skills: ["analyze_types", "style"] },
      { topicId: "literary-elements", topicTitleBg: "Литературни елементи", topicTitleEn: "Literary elements", difficultyLevel: "advanced", lessonType: "lesson", skills: ["character", "plot", "setting", "theme"] },
      { topicId: "literary-devices", topicTitleBg: "Литературни похвати", topicTitleEn: "Literary devices", difficultyLevel: "advanced", lessonType: "lesson", skills: ["alliteration", "irony", "foreshadowing"] },
      { topicId: "poetry-analysis", topicTitleBg: "Анализ на поезия", topicTitleEn: "Poetry analysis", difficultyLevel: "advanced", lessonType: "reading", skills: ["meter", "rhyme", "imagery"] },
      { topicId: "poetry-forms", topicTitleBg: "Форми на поезия", topicTitleEn: "Poetry forms", difficultyLevel: "advanced", lessonType: "lesson", skills: ["sonnets", "haiku", "ballads"] },
      { topicId: "prose-analysis", topicTitleBg: "Анализ на проза", topicTitleEn: "Prose analysis", difficultyLevel: "advanced", lessonType: "reading", skills: ["narrative_perspective", "dialogue"] },
      { topicId: "drama-analysis", topicTitleBg: "Анализ на драма", topicTitleEn: "Drama analysis", difficultyLevel: "advanced", lessonType: "reading", skills: ["stage_directions", "conflict"] },
      { topicId: "characterization", topicTitleBg: "Характеризация", topicTitleEn: "Characterization", difficultyLevel: "advanced", lessonType: "reading", skills: ["direct", "indirect", "motivation"] },
      { topicId: "narrative-perspective", topicTitleBg: "Наративна перспектива", topicTitleEn: "Narrative perspective", difficultyLevel: "advanced", lessonType: "reading", skills: ["first_person", "third_person", "unreliable"] },
      { topicId: "conflict-resolution", topicTitleBg: "Конфликт и разрешение", topicTitleEn: "Conflict and resolution", difficultyLevel: "advanced", lessonType: "reading", skills: ["types_conflict", "climax"] },
      { topicId: "symbolism", topicTitleBg: "Символизъм", topicTitleEn: "Symbolism", difficultyLevel: "advanced", lessonType: "reading", skills: ["symbols", "meaning", "interpret"] },
      { topicId: "tone-mood", topicTitleBg: "Тон и настроение", topicTitleEn: "Tone and mood", difficultyLevel: "advanced", lessonType: "reading", skills: ["identify_tone", "emotion"] },
      { topicId: "bias-prejudice", topicTitleBg: "Предубеждения и предразсъдъци", topicTitleEn: "Bias and prejudice", difficultyLevel: "advanced", lessonType: "reading", skills: ["identify_bias", "critical_reading"] },
      { topicId: "propaganda-techniques", topicTitleBg: "Техники на пропаганда", topicTitleEn: "Propaganda techniques", difficultyLevel: "advanced", lessonType: "reading", skills: ["persuasion", "fallacies"] },
      { topicId: "rhetoric", topicTitleBg: "Реторика", topicTitleEn: "Rhetoric", difficultyLevel: "advanced", lessonType: "lesson", skills: ["ethos", "pathos", "logos"] },
      { topicId: "essay-analysis", topicTitleBg: "Анализ на есей", topicTitleEn: "Essay analysis", difficultyLevel: "advanced", lessonType: "reading", skills: ["thesis", "argument", "evidence"] },
      { topicId: "essay-advanced", topicTitleBg: "Напредна писане на есеи", topicTitleEn: "Advanced essay writing", difficultyLevel: "advanced", lessonType: "writing", skills: ["complex_arguments", "synthesis"] },
      { topicId: "research-paper", topicTitleBg: "Изследователска работа", topicTitleEn: "Research paper", difficultyLevel: "advanced", lessonType: "writing", skills: ["sources", "citations", "outline"] },
      { topicId: "citations-mla", topicTitleBg: "Цитирания - MLA", topicTitleEn: "Citations MLA", difficultyLevel: "advanced", lessonType: "practice", skills: ["in_text", "works_cited"] },
      { topicId: "citations-apa", topicTitleBg: "Цитирания - APA", topicTitleEn: "Citations APA", difficultyLevel: "advanced", lessonType: "practice", skills: ["in_text", "reference_list"] },
      { topicId: "debate-skills", topicTitleBg: "Умения за дебат", topicTitleEn: "Debate skills", difficultyLevel: "advanced", lessonType: "practice", skills: ["argument", "rebuttal", "evidence"] },
      { topicId: "public-speaking", topicTitleBg: "Публично говорене", topicTitleEn: "Public speaking", difficultyLevel: "advanced", lessonType: "practice", skills: ["presentation", "delivery", "confidence"] },
      { topicId: "media-literacy", topicTitleBg: "Медийна грамотност", topicTitleEn: "Media literacy", difficultyLevel: "advanced", lessonType: "reading", skills: ["analyze_media", "sources"] },
      { topicId: "digital-communication", topicTitleBg: "Цифрово общуване", topicTitleEn: "Digital communication", difficultyLevel: "advanced", lessonType: "practice", skills: ["email", "formal_writing"] },
      { topicId: "vocabulary-academic", topicTitleBg: "Академичен речник", topicTitleEn: "Academic vocabulary", difficultyLevel: "advanced", lessonType: "lesson", skills: ["subject_specific", "context"] },
      { topicId: "etymology-advanced", topicTitleBg: "Етимология - напредок", topicTitleEn: "Etymology advanced", difficultyLevel: "advanced", lessonType: "lesson", skills: ["word_origins", "language_history"] },
      { topicId: "language-register", topicTitleBg: "Регистър на езика", topicTitleEn: "Language register", difficultyLevel: "advanced", lessonType: "lesson", skills: ["formal", "informal", "context"] },
      { topicId: "stylistic-analysis", topicTitleBg: "Стилистичен анализ", topicTitleEn: "Stylistic analysis", difficultyLevel: "advanced", lessonType: "reading", skills: ["analyze_style", "author_technique"] },
      { topicId: "comparative-literature", topicTitleBg: "Сравнителна литература", topicTitleEn: "Comparative literature", difficultyLevel: "advanced", lessonType: "reading", skills: ["compare_contrast", "themes"] },
      { topicId: "cultural-context", topicTitleBg: "Културен контекст", topicTitleEn: "Cultural context", difficultyLevel: "advanced", lessonType: "reading", skills: ["historical", "social", "interpret"] },
    ],
  },
];

// ─── Lookup Functions ─────────────────────────────────────────────────────────

export function getCurriculumTopics(grade: number, subjectId: string): CurriculumTopic[] {
  const entry = BG_CURRICULUM.find(e => e.grade === grade && e.subjectId === subjectId);
  return entry?.topics ?? [];
}

export function getTopicById(grade: number, subjectId: string, topicId: string): CurriculumTopic | null {
  return getCurriculumTopics(grade, subjectId).find(t => t.topicId === topicId) ?? null;
}

export function getFirstTopic(grade: number, subjectId: string): CurriculumTopic | null {
  return getCurriculumTopics(grade, subjectId)[0] ?? null;
}

// ─── Bulgarian Language Lesson Prompt Generator ───────────────────────────────
//
// Returns a deterministic, grade-appropriate Bulgarian language learning activity.
// Never generates arithmetic tasks. Never returns empty.
// Used by juniorChatHandler when active_subject = "bulgarian_language".

const BG_LESSON_PROMPTS: Record<string, Record<number, string>> = {
  // ── letters_and_sounds ─────────────────────────────────────────────────────
  letters_and_sounds: {
    1: `📝 Хайде да учим буквите!

Днес ще упражняваме буквата **А**. Тя е гласна и звучи като: А-А-А!

🎯 Задача: Назови 3 думи, които започват с буквата **А**.
Например: АНА, АВЕН, АКО...

Кои думи знаеш ти? Напиши ги!`,
    2: `📝 Буквите и техните звукове!

В българската азбука има **30 букви** — 6 гласни и 24 съгласни.

🎯 Задача: Кажи кой звук правят тези букви:
- Б произнася: Б-Б-Б (като "банан")
- М произнася: М-М-М (като "мама")
- С произнася: С-С-С (като "слон")

Измисли по 1 дума за всяка буква!`,
    3: `📝 Знаеш ли всички букви?

Нека проверим! Прочети тези думи на глас:
**КАТ • МОМ • ПАН • РИС**

🎯 Какви звукове чуваш в началото на всяка дума? Кои букви ги написват?`,
    4: `📝 Буквите са нашите приятели!

🎯 Задача за четене: Прочети изречението бавно, буква по буква:
**"МА-МА МИ-ЕТ РЪ-ЦЕ."**

Можеш ли да прочетеш сричка по сричка? Опитай!`,
  },

  // ── vowels_and_consonants ─────────────────────────────────────────────────
  vowels_and_consonants: {
    1: `🎵 Гласни и съгласни букви!

В българския език **гласните** са само 6:
**А, Ъ, Е, И, О, У** 🎶

Всички останали букви са **съгласни**.

🎯 Задача: В кои думи има гласна в средата?
- МАС → гласна А е в средата ✅
- РИС → ?
- КОТ → ?
- ПЕН → ?

Намери гласната в тези думи!`,
    2: `🎵 Гласни и съгласни — упражнение!

🎯 Раздели думите на гласни и съгласни букви:
**МАМА, БАЩА, СЛОН, ЯБЪЛКА**

Запиши за всяка дума: колко гласни и колко съгласни има?
Например: МАМА → 2 гласни (А, А), 2 съгласни (М, М)`,
    3: `🎵 Правило за гласни!

Когато произнасяме думи, **гласните** са тези, при които устата ни е отворена.

🎯 Прочети тези думи и отбележи всяка гласна:
- ЯБЪЛКА → Я, А (гласни), Б, Л, К (съгласни)
- УЧЕБНИК → ?
- ПРИРОДА → ?`,
    4: `🎵 Сложни думи и техните звукове!

🎯 Задача: Намери всички гласни в тези думи:
**ПРИКЛЮЧЕНИЕ, ОБРАЗОВАНИЕ, ПРИЯТЕЛСТВО**

Колко гласни има всяка дума? Каква е разликата между кратките и дългите думи?`,
  },

  // ── syllables ─────────────────────────────────────────────────────────────
  syllables: {
    1: `✂️ Делим думите на срички!

**Сричката** е малка звукова група в думата. Можем да ги намерим като пляскаме с ръце!

🎯 Ела, нека пляскаме заедно:
- МА-МА → 2 ръкопляскания = 2 срички
- ТА-ТА → ?
- КО-ТЕ → ?
- ЯЪ-БЪЛ-КА → ?

Пляскай и брой!`,
    2: `✂️ Срички в по-дълги думи!

🎯 Раздели тези думи на срички (постави тире - между тях):
- УЧЕБНИК → ?
- ПРОЛЕТ → ?
- СЛЪНЦЕ → ?
- ДЕТЕЛИНА → ?

Подсказка: Всяка сричка има поне 1 гласна!`,
    3: `✂️ Думи с много срички!

🎯 Намери думите с точно 3 срички:
- МАМА (2 срички) ❌
- ЯБЪЛКА (3 срички: ЯБ-ЪЛ-КА) ✅
- СЛОН (1 сричка) ❌
- ПРОЛЕТ (2 срички) ❌
- ЖИВОТНО (3 срички: ЖИ-ВОТ-НО) ✅

Намери още 2 думи с 3 срички!`,
    4: `✂️ Сричкуване за четене!

🎯 Прочети тези трудни думи сричка по сричка:
- ПРИ-КЛЮ-ЧЕ-НИ-Е
- ОБ-РА-ЗО-ВА-НИ-Е
- БЛА-ГО-ДАР-НО-СТ

Колко срички има всяка дума? Коя е най-дългата?`,
  },

  // ── simple_words ──────────────────────────────────────────────────────────
  simple_words: {
    1: `📖 Прочети прости думи!

🎯 Прочети тези думи на глас:
**КОТ • МЯУ • КУЧ • ЛАЙ • ПТА • ПЕЙ**

Можеш ли да измислиш изречение с 2 от тях?
Например: "Котът мяука."`,
    2: `📖 Думи и техните значения!

🎯 Свържи думата с нейното значение:
- СЛОН → голямо животно с хобот
- РОЗА → цвете
- НЕБЕ → това, което виждаме горе
- МОРЕ → много вода

Сега измисли своя дума и обясни какво означава!`,
    3: `📖 Синоними — думи с близко значение!

**Синонимите** са думи, които означават почти едно и също нещо.

🎯 Намери синоним:
- ГОЛЯМ → огромен, грамаден...
- КРАСИВ → хубав, прекрасен...
- БЪРЗАМ → побързвам, тичам...

Знаеш ли още синоними? Напиши ги!`,
    4: `📖 Думи в контекст!

🎯 Попълни липсващата дума:
1. Котката ___ мляко. (пие / яде / спи)
2. Слънцето ___ от изток. (залязва / изгрява / свети)
3. Децата ___ в парка. (играят / четат / пишат)

Обясни защо избра тези думи!`,
  },

  // ── simple_sentences ──────────────────────────────────────────────────────
  simple_sentences: {
    1: `✍️ Нека пишем изречения!

**Изречението** започва с ГЛАВНА буква и завършва с точка.

🎯 Поправи изреченията:
- "котката спи на дивана." → "Котката спи на дивана." ✅
- "кучето лае силно" → ?
- "децата играят" → ?

Сега напиши собствено изречение!`,
    2: `✍️ Кратко или разширено изречение?

**Кратко**: "Котката спи."
**Разширено**: "Малката котка спи на уютния диван."

🎯 Разшири тези кратки изречения:
- "Дете играе." → ?
- "Птица пее." → ?
- "Слон яде." → ?

Добави: КАКВА/КАКЪВ? КЪДЕ? КАК?`,
    3: `✍️ Видове изречения!

В езика имаме 3 вида изречения:
- **Съобщително**: "Котката спи."
- **Въпросително**: "Спи ли котката?"
- **Заповедно**: "Тихо! Не буди котката."

🎯 Напиши по 1 изречение от всеки вид за темата "Дъжд".`,
    4: `✍️ Разбор на изречение!

🎯 Разбери изречението:
**"Малкото куче тичаше бързо из градината."**

- Кой/Какво? → куче (подлог)
- Какво прави? → тичаше (сказуемо)
- Как? → бързо
- Къде? → из градината

Сега разбери: "Умното момче четеше книга в библиотеката."`,
  },

  // ── reading_comprehension_basic ───────────────────────────────────────────
  reading_comprehension_basic: {
    2: `📖 Четене с разбиране!

Прочети внимателно:

*"Мария има котка на име Пухче. Пухче обича да спи на слънце и да играе с топка. Всяка вечер Мария го храни с рибица."*

🎯 Отговори на въпросите:
1. Как се казва котката?
2. Какво обича да прави Пухче?
3. С какво го храни Мария?`,
    3: `📖 Четене с разбиране — по-труден текст!

Прочети:

*"Есента идва след лятото. Листата на дърветата стават жълти, оранжеви и червени. Птиците се готвят да летят на юг. Децата се връщат на училище с нови раници."*

🎯 Въпроси:
1. Кой сезон е описан?
2. Какво се случва с листата?
3. Защо птиците летят на юг?
4. Какво правят децата?`,
    4: `📖 Четене с разбиране — разсъждение!

*"Дядо Иван сади дърво всяка пролет. Той казва: 'Дърветата дават плодове, сянка и чист въздух. Ако всеки посади едно дърво, светът ще бъде по-хубав.'"*

🎯 Въпроси:
1. Какво прави дядо Иван всяка пролет?
2. Какви ползи дават дърветата?
3. Съгласен ли си с дядо Иван? Защо?
4. Ако можеш да посадиш дърво, кое би избрал?`,
  },

  // ── nouns_basic ───────────────────────────────────────────────────────────
  nouns_basic: {
    2: `📚 Съществителните имена!

**Съществителното** е дума за **лице, предмет или явление**.
Примери: МАМА, КУЧЕ, СЛЪНЦЕ, ДЪЖД

🎯 Намери всички съществителни в изречението:
*"Малкото момче хвана голяма риба в езерото с въдицата."*

Подсказка: задай въпроса "КОЙ? КОЯ? КАКВО?" — ако отговорът е думата, тя е съществително!`,
    3: `📚 Съществителни — мъжки, женски, среден род!

В българския език съществителните имат **род**:
- Мъжки: СТОЛ, ПРОЗОРЕЦ, УЧЕНИК
- Женски: КНИГА, МАСА, УЧЕНИЧКА
- Среден: КУЧЕ, ДЕТЕ, СЛЪНЦЕ

🎯 Определи рода:
ЦВЕТЕ, ПРОЗОРЕЦ, ВОДА, ТЕТРАДКА, МОЛИВ, ЕЗЕРО

Как познаваш рода? (подсказка: "ЕДИН", "ЕДНА", "ЕДНО")`,
    4: `📚 Съществителни — единствено и множествено число!

- Единствено: КНИГА, СТОЛ, ДЕТЕ
- Множествено: КНИГИ, СТОЛОВЕ, ДЕЦА

🎯 Образувай множествено число:
ЦВЕТЕ → ?
ЯБЪЛКА → ?
МОЛИВ → ?
ПРОЗОРЕЦ → ?
МОМЧЕ → ?

Забелязваш ли правило? Какво се добавя в края?`,
  },

  // ── verbs_basic ───────────────────────────────────────────────────────────
  verbs_basic: {
    2: `🏃 Глаголите — думите за действие!

**Глаголът** казва какво ПРАВИ субектът.
Примери: ЯМ, ПИША, ИГРАЯ, ТИЧАМ, ЧЕТА

🎯 Намери глаголите:
*"Децата тичат в парка. Те смеят и играят. Мама ги гледа и се усмихва."*

Колко глагола намери? Какво действие описва всеки?`,
    3: `🏃 Глаголи — сегашно, минало и бъдеще!

- Сегашно: "Аз **четА** книга."
- Минало: "Аз **четОх** книга."
- Бъдеще: "Аз **ще чета** книга."

🎯 Постави глагола в правилното време:
- "Утре ние ___ (играем/играхме/ще играем) футбол."
- "Вчера тя ___ (пише/написа/ще пише) писмо."
- "Сега аз ___ (уча/учих/ще уча) урока."`,
    4: `🏃 Глаголи в изречение!

🎯 Разбери кой е подлогът и кой е сказуемото:

1. "Ученикът пише диктовка."
   - Подлог (КОЙ?): ___ Сказуемо (КАКВО ПРАВИ?): ___

2. "Птиците летят на юг."
   - Подлог: ___ Сказуемо: ___

3. "Малкото дете спи дълбоко."
   - Подлог: ___ Сказуемо: ___`,
  },

  // ── sentence_building ─────────────────────────────────────────────────────
  sentence_building: {
    2: `🏗️ Строим изречения!

**Изречението** има поне: КОЙ прави нещо (подлог) + КАКВО прави (сказуемо).

🎯 Наредете думите в правилно изречение:
1. бързо / тича / кучето → ?
2. пее / птицата / дърво / на → ?
3. книга / момичето / чете / интересна → ?

Кое изречение ти харесва най-много? Защо?`,
    3: `🏗️ Разширяваме изреченията!

🎯 Добави думи, за да направиш изречението по-интересно:
1. "Котката спи." → Добави КАКВА и КЪДЕ: "_____ котката спи _____."
2. "Дете рисува." → Добави КАКВО и КАК: "Детето рисува _____ _____."
3. "Слънцето грее." → Добави КАК и КОГА: "Слънцето грее _____ _____."`,
    4: `🏗️ Сложни изречения!

**Сложното изречение** свързва 2 прости изречения.
Използваме: И, НО, ЗАЩОТО, АКО, КОГАТО

🎯 Свържи изреченията:
1. "Вали дъжд." + "Не мога да играя навън." → ?
2. "Научих урока." + "Отидох да играя." → ?
3. "Обичам четенето." + "Чета всеки ден." → ?`,
  },

  // ── parts_of_speech_intro ─────────────────────────────────────────────────
  parts_of_speech_intro: {
    3: `🔤 Части на речта!

В езика имаме **3 основни части на речта**:

1. **Съществително** — казва КОЙ/КАКВО → КУЧЕ, СЛЪНЦЕ
2. **Прилагателно** — казва КАКЪВ/КАКВА → ГОЛЯМО, ТОПЛО
3. **Глагол** — казва КАКВО ПРАВИ → ТИЧА, ГРЕЕ

🎯 Определи частта на речта:
ХУБАВ, ПИША, ПРОЗОРЕЦ, ЗЕЛЕНА, МОМЧЕ, СКАЧА, ШИРОКО

Подсказки: Задай въпрос — КОЙ/КАКВО?, КАКЪВ/КАКВА?, КАКВО ПРАВИ?`,
    4: `🔤 Части на речта — разширено!

🎯 В изречението "Малкото куче бързо тичаше из зеления парк." намери:
- Всички **съществителни** (КОЙ/КАКВО?)
- Всички **прилагателни** (КАКЪВ/КАКВА?)
- **Глагола** (КАКВО ПРАВИ?)
- **Наречието** (КАК?)

Колко от всеки вид намери?`,
  },

  // ── spelling_rules_basic ──────────────────────────────────────────────────
  spelling_rules_basic: {
    3: `✏️ Правописни правила!

**Правило 1**: Думи с "Ъ": мъж, стъкло, кръв, звъня
**Правило 2**: Думи с "Й": майка, чайник, войник, тройка

🎯 Попълни правилната буква (Ъ или Й):
- M_Ж (мъж)
- MA_KA (майка)
- ЧА_НИК (чайник)
- КР_В (кръв)
- ТРО_КА (тройка)

Знаеш ли повече думи с тези букви?`,
    4: `✏️ Диктовка — готови?

🎯 Напиши думите правилно (внимавай за Ъ, Й, и двойни съгласни):
- Жена, която е майка: MA_KA
- Напитката от чай: ЧА_ (чай)
- Числото 3 в редна форма: ТРЕ_И (трети)
- Голям град: ГРА_

Сега провери: написал ли си всичко правилно?`,
  },

  // ── short_text_comprehension ──────────────────────────────────────────────
  short_text_comprehension: {
    3: `📖 Разбиране на текст!

Прочети и отговори:

*"Хитрата лисица видяла гарван с парче сирене в клюна. 'Гарване, чух, че имаш прекрасен глас!' рекла тя. Гарванът отворил уста да пее — и сиренето паднало. Лисицата го грабнала и избягала."*

🎯 Въпроси:
1. Какво имал гарванът?
2. Какво казала лисицата?
3. Защо паднало сиренето?
4. Каква поука крие историята?`,
    4: `📖 Разбиране и разсъждение!

*"Преди много векове, в едно малко село живял добросърдечен ковач. Той помагал на бедните, без да иска нищо в замяна. Хората го уважавали и обичали. Когато остарял, цялото село му помогнало да построи нова работилница."*

🎯 Отговори:
1. Кой е главният герой? Опиши го.
2. Как се отнасял той с другите?
3. Как хората му отвърнали?
4. Каква поука извличаш ти?`,
  },

  // ── sentence_parts_intro ──────────────────────────────────────────────────
  sentence_parts_intro: {
    4: `🔍 Части на изречението!

**Подлог** — КОЙ/КАКВО прави нещо?
**Сказуемо** — КАКВО ПРАВИ подлогът?
**Допълнение** — КОГО/КАКВО засяга действието?

Пример: "Ученикът чете книгата."
- Подлог: УЧЕНИКЪТ
- Сказуемо: ЧЕТЕ
- Допълнение: КНИГАТА

🎯 Разбери:
1. "Майката готви вкусна супа."
2. "Учителят обяснява новото правило."
3. "Децата бране горски ягоди."`,
  },

  // ── grammar_review ────────────────────────────────────────────────────────
  grammar_review: {
    4: `📝 Преговор по граматика!

🎯 Мини-тест (отговори на всички):

1. Какво е "ЯБЪЛКА"? (съществително / прилагателно / глагол)
2. Какъв е родът на "ПРОЗОРЕЦ"? (мъжки / женски / среден)
3. Намери глагола: "Умното дете бързо прочете трудния урок."
4. Образувай множествено число: ДЕТЕ → ?
5. Какво прави изречението въпросително?

Проверихте ли своите отговори!`,
  },

  // ── reading_comprehension_extended ────────────────────────────────────────
  reading_comprehension_extended: {
    4: `📖 Разширено четене с разбиране!

*"Иван Вазов е най-великият български писател. Роден е на 9 юли 1850 г. в Сопот. Написал е стотици стихотворения, разкази и романи. Най-известното му произведение е романът 'Под игото', за който научаваш в горните класове. Вазов обичал природата и България дълбоко в сърцето си."*

🎯 Задачи:
1. Кой е Иван Вазов? Кога е роден?
2. Какво е написал?
3. Как се казва най-известното му произведение?
4. Какво знаеш за Иван Вазов от своя клас? Разкажи!`,
  },

  // ── short_written_response ────────────────────────────────────────────────
  short_written_response: {
    4: `✍️ Кратко съчинение!

🎯 Напиши от три до пет изречения на тема:
**"Моят любим сезон"**

Твоето съчинение трябва да има:
1. **Началото**: Кой е любимият ти сезон?
2. **Средата**: Защо го обичаш? Какво правиш?
3. **Края**: Как се чувстваш в него?

Пример начало: "Моят любим сезон е пролетта. Тогава..."

Сега ти опитай! Пиши смело 🌟`,
  },
};

/**
 * Returns a deterministic Bulgarian-language learning activity.
 * Grade-appropriate, never contains arithmetic tasks.
 * @param grade 1-4
 * @param topicId curriculum topic ID, or null for auto-selection
 * @param childName child's first name
 * @param charEmoji character emoji (🐼 / 🤖 / 🦊 / 🦉)
 */
/**
 * Extract and show only the current question from a multi-question prompt.
 * For reading_comprehension_basic with multiple questions, show lesson text
 * and only the current question number based on questionIndex.
 */
function showSingleQuestion(fullPrompt: string, questionIndex: number): string {
  // Extract lesson text (everything before "🎯 Отговори на въпросите:")
  const questionSeparator = "🎯 Отговори на въпросите:";
  const questionSeparator2 = "🎯 Въпроси:";
  
  let lessonText = "";
  let questionSection = "";
  
  if (fullPrompt.includes(questionSeparator)) {
    const parts = fullPrompt.split(questionSeparator);
    lessonText = parts[0];
    questionSection = parts[1];
  } else if (fullPrompt.includes(questionSeparator2)) {
    const parts = fullPrompt.split(questionSeparator2);
    lessonText = parts[0];
    questionSection = parts[1];
  } else {
    // No multi-question format, return as-is
    return fullPrompt;
  }
  
  // Parse questions: numbered lines like "1. Question text"
  const questionLines = questionSection
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Find question at current index (1-indexed questions, 0-indexed array)
  let currentQuestion = "";
  for (const line of questionLines) {
    // Match "N. Question" or just grab the line if it looks like a question
    const match = line.match(/^(\d+)\.\s*(.*)/);
    if (match) {
      const qNum = parseInt(match[1]) - 1; // Convert to 0-indexed
      if (qNum === questionIndex) {
        currentQuestion = match[2]; // Extract just the question text
        break;
      }
    }
  }
  
  // If no question found, use the first one as fallback
  if (!currentQuestion && questionLines.length > 0) {
    const firstMatch = questionLines[0].match(/^(\d+)\.\s*(.*)/);
    currentQuestion = firstMatch ? firstMatch[2] : questionLines[0];
  }
  
  // Reconstruct: lesson text + current question only
  const leadingText = lessonText.includes("🎯") 
    ? lessonText.split("🎯")[0]
    : lessonText;
  
  return `${leadingText.trim()}\n\n🎯 ${currentQuestion}`;
}

export function getBulgarianLessonPrompt(
  grade: number,
  topicId: string | null,
  childName: string,
  charEmoji: string = "📚",
  questionIndex: number = 0,
): string {
  const g = Math.max(1, Math.min(4, grade));

  // If no specific topic, pick the first grade-appropriate topic
  const resolvedTopicId = topicId ?? getFirstTopic(g, "bulgarian_language")?.topicId ?? "letters_and_sounds";

  const gradePrompts = BG_LESSON_PROMPTS[resolvedTopicId];
  if (gradePrompts) {
    // Look for the exact grade, then fall back to nearest
    let prompt = gradePrompts[g] ?? gradePrompts[1] ?? gradePrompts[2] ?? gradePrompts[3] ?? gradePrompts[4];
    if (prompt) {
      // For reading_comprehension_basic, show only current question
      if (resolvedTopicId === "reading_comprehension_basic") {
        prompt = showSingleQuestion(prompt, questionIndex);
      }
      return `${charEmoji} Здравей, ${childName}! Нека поучим малко **Български език**!\n\n${prompt}`;
    }
  }

  // Safe fallback — never returns empty
  const fallback: Record<number, string> = {
    1: `${charEmoji} Здравей, ${childName}! Хайде да упражним **буквите**!\n\nПрочети тези срички: МА, МЕ, МИ, МО, МУ\nМожеш ли да измислиш по една дума за всяка сричка?`,
    2: `${charEmoji} Здравей, ${childName}! Днес ще упражняваме **четене**!\n\nПрочети изречението: "Слънцето грее, птиците пеят."\nОтговори: Колко думи има изречението? Кои са съществителните?`,
    3: `${charEmoji} Здравей, ${childName}! Нека поговорим за **части на речта**!\n\nОткрий съществителните и глаголите в: "Умното дете четеше интересна книга в библиотеката."`,
    4: `${charEmoji} Здравей, ${childName}! Готов/а ли си за **граматика**?\n\nРазбери изречението: "Талантливото момиче написа красиво стихотворение."\nКой е подлогът? Кое е сказуемото? Има ли допълнение?`,
  };

  return fallback[g] ?? fallback[1];
}

/**
 * Pick a safe topic for a grade when no specific topic is requested.
 * Returns the first topic in the BG curriculum for that grade.
 */
export function getDefaultBulgarianTopic(grade: number): string {
  return getFirstTopic(Math.max(1, Math.min(4, grade)), "bulgarian_language")?.topicId ?? "letters_and_sounds";
}
