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
export function getBulgarianLessonPrompt(
  grade: number,
  topicId: string | null,
  childName: string,
  charEmoji: string = "📚",
): string {
  const g = Math.max(1, Math.min(4, grade));

  // If no specific topic, pick the first grade-appropriate topic
  const resolvedTopicId = topicId ?? getFirstTopic(g, "bulgarian_language")?.topicId ?? "letters_and_sounds";

  const gradePrompts = BG_LESSON_PROMPTS[resolvedTopicId];
  if (gradePrompts) {
    // Look for the exact grade, then fall back to nearest
    const prompt = gradePrompts[g] ?? gradePrompts[1] ?? gradePrompts[2] ?? gradePrompts[3] ?? gradePrompts[4];
    if (prompt) {
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
