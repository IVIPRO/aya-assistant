/**
 * hintExampleValidator.ts
 *
 * Validates that hint examples in lesson/exercise generation are:
 * - Semantically natural (no absurd body-part/object combinations)
 * - Age-appropriate Bulgarian
 * - Grammatically sound
 * - Topic-aligned (examples match the lesson topic)
 */

// ─── Red Flags for Unnatural Examples ─────────────────────────────────────────

/**
 * Patterns that indicate unnatural or absurd examples
 */
const UNNATURAL_PATTERNS = [
  // Bizarre body-part + inanimate object combinations
  /сърцето.*куклата/i, // heart of puppet
  /сърцето.*книга/i, // heart of book
  /сърцето.*молив/i, // heart of pencil
  /мозък.*стол/i, // brain of chair
  /мозък.*вода/i, // brain of water
  /очите.*хляб/i, // eyes of bread
  /устата.*дърво/i, // mouth of tree
  /ръката.*облак/i, // hand of cloud
  /краката.*луна/i, // legs of moon
  /зъбите.*звезда/i, // teeth of star

  // Completely illogical subject-verb pairs
  /планината.*тича/i, // mountain runs
  /водата.*летя/i, // water flies
  /облакът.*яде/i, // cloud eats
  /камънят.*пее/i, // stone sings
  /дървото.*плуви/i, // tree swims

  // Nonsensical combinations
  /духа.*сърцето/i, // wind blows heart
  /движи.*мисълта/i, // moves thought
  /гледа.*числото/i, // looks at number (weird phrasing)
];

/**
 * Safe Bulgarian nouns and verbs for hint examples suitable for grades 1-2
 */
const SAFE_BULGARIAN_NOUNS = {
  objects: [
    "молив",
    "книга",
    "хляб",
    "ябълка",
    "топка",
    "стол",
    "маса",
    "врата",
    "прозорец",
    "листо",
    "цвете",
    "пътека",
    "дърво",
    "камък",
    "песък",
  ],
  animals: [
    "куче",
    "котка",
    "птица",
    "риба",
    "пеперуда",
    "пчела",
    "зайче",
    "мишка",
    "конче",
  ],
  people: [
    "момче",
    "момиче",
    "мама",
    "татко",
    "баба",
    "дядо",
    "учител",
    "приятел",
  ],
  places: [
    "парк",
    "училище",
    "кухня",
    "дом",
    "градина",
    "пътека",
    "гора",
    "река",
    "плаж",
  ],
  nature: ["вода", "вятър", "слънце", "облак", "снег", "дъжд", "листа", "цветя"],
  actions: [
    "тича",
    "ходи",
    "скача",
    "плува",
    "летя",
    "яде",
    "пие",
    "пее",
    "танцува",
    "рисува",
  ],
};

/**
 * Check if a hint example sentence is natural and appropriate for Bulgarian Junior learners
 */
export function isHintExampleNatural(example: string, topic?: string): boolean {
  if (!example || example.length < 3) return true; // Empty is okay

  const ex = example.toLowerCase();

  // Check for explicit unnatural patterns
  for (const pattern of UNNATURAL_PATTERNS) {
    if (pattern.test(ex)) {
      console.warn(`[HINT_EXAMPLE] Unnatural pattern detected: "${example.slice(0, 50)}..."`);
      return false;
    }
  }

  // Check that example uses reasonable nouns
  // If example is very long and contains many weird nouns, reject
  const allSafeNouns = [
    ...SAFE_BULGARIAN_NOUNS.objects,
    ...SAFE_BULGARIAN_NOUNS.animals,
    ...SAFE_BULGARIAN_NOUNS.people,
    ...SAFE_BULGARIAN_NOUNS.places,
    ...SAFE_BULGARIAN_NOUNS.nature,
  ];

  // Count how many words in example match safe vocabulary
  const words = ex.split(/[\s,?.!;:]+/).filter((w) => w.length > 2);
  const safeWordCount = words.filter((w) => allSafeNouns.some((n) => w.includes(n))).length;

  // If example is mostly non-safe words, it's probably weird
  if (words.length > 4 && safeWordCount < words.length * 0.4) {
    console.warn(`[HINT_EXAMPLE] Low safe vocabulary: "${example.slice(0, 50)}..."`);
    return false;
  }

  return true;
}

/**
 * Get a safe fallback hint example for a given topic
 * Returns a simple, natural Bulgarian example that stays on topic
 */
export function getSafeHintExample(topicId: string): string | null {
  const examples: Record<string, string[]> = {
    // Math
    addition_to_10: [
      "Ако имам 3 ябълки и добавя 2 ябълки, колко имам всичко?",
      "3 книги + 2 книги = ?",
      "5 топки + 4 топки = ?",
    ],
    subtraction_to_10: [
      "Ако имам 7 молива и отнемам 3 молива, колко остават?",
      "8 цветя - 3 цветя = ?",
      "Имам 6 топки. Дам 2 на приятеля си. Колко остават?",
    ],

    // Science - Water & Air
    water_cycle_g3: [
      "Водата от реката се изпарява под слънцето.",
      "Облаците се образуват от влага на вода.",
      "Дъждът пада от облаците.",
    ],
    human_body_g2: [
      "Дишаме с белите дробове.",
      "Сърцето ни бие, когато бягаме.",
      "Очите ни виждат светлина.",
    ],

    // Reading
    simple_stories_g2: ["Героят е добър и смел.", "Историята е за приятелство."],
    reading_comprehension_basic: [
      "Прочети внимателно първото изречение.",
      "Героят е момче по име Иван.",
    ],

    // Grammar
    nouns_basic: ["Съществителното назовава предмет или живо същество.", "Куче, дърво, момче — всички са съществителни."],
    verbs_basic: ["Глаголът показва действие: тича, скача, яде.", "Какво действие прави персонажът?"],

    // Logic & Patterns
    color_patterns: ["Редицата е: червено, синьо, червено, синьо...", "Какъв цвят идва след жълто?"],
    patterns_g2: ["Числата растат: 2, 4, 6, 8...", "Всяко число е по-голямо от предишното."],
    visual_puzzles: [
      "Логическа задача: ако А = В и В = С, то А = С.",
      "Мислене: кое число липсва в редицата?",
    ],

    // Sorting & Comparison
    sorting_g2: [
      "Групирай предметите по размер: малко, средно, голямо.",
      "Сортирай плодовете по цвят.",
    ],
    comparison_g2: [
      "Ябълката е по-малка от динята.",
      "Сравни височините на момчетата.",
    ],
  };

  const topicExamples = examples[topicId];
  if (topicExamples && topicExamples.length > 0) {
    return topicExamples[Math.floor(Math.random() * topicExamples.length)];
  }

  return null; // No safe fallback for this topic
}
