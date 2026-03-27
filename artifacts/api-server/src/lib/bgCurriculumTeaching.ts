/**
 * AYA Bulgarian Curriculum Teaching Engine
 *
 * Maps Bulgarian MoE curriculum (grades 1–7) to age-appropriate teaching
 * strategies, explanation templates, and system prompt context.
 *
 * Used by:
 *   - freeConversationHandler.ts  (system prompt enrichment)
 *   - aiResponses.ts              (math/subject explanation helpers)
 *   - juniorChatHandler.ts        (subject-specific hints)
 *
 * Does NOT touch: homework solver, voice, avatar, chat layout.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Lang = "bg" | "es" | "en";

export interface GradeMathContext {
  /** Human-readable label for what grade does in math */
  topicSummaryBg: string;
  /** Main operations at this grade */
  operations: string[];
  /** Max number range for tasks */
  numberRange: number;
  /** Whether multiplication table is expected */
  hasTimesTable: boolean;
  /** Whether fractions are in scope */
  hasFractions: boolean;
  /** Grade-specific teaching tip for the AI */
  teachingTipBg: string;
}

export interface GradeLangContext {
  /** Topics in focus for Bulgarian language at this grade */
  focusTopicsBg: string[];
  /** Key terms the child should know */
  keyTermsBg: string[];
  /** Grade-appropriate teaching tip */
  teachingTipBg: string;
}

// ─── Grade Math Context ───────────────────────────────────────────────────────

const GRADE_MATH: Record<number, GradeMathContext> = {
  1: {
    topicSummaryBg: "Числа до 20, събиране и изваждане на малки числа",
    operations: ["addition", "subtraction"],
    numberRange: 20,
    hasTimesTable: false,
    hasFractions: false,
    teachingTipBg: "Използвай пръсти, точки или картинки. Обяснявай конкретно и кратко. Никога не бързай.",
  },
  2: {
    topicSummaryBg: "Числа до 100, въведение в умножението и делението",
    operations: ["addition", "subtraction", "multiplication"],
    numberRange: 100,
    hasTimesTable: false,
    hasFractions: false,
    teachingTipBg: "Умножението обяснявай като многократно събиране. Използвай примери с предмети.",
  },
  3: {
    topicSummaryBg: "Таблица за умножение (1–10), деление, текстови задачи",
    operations: ["addition", "subtraction", "multiplication", "division"],
    numberRange: 1000,
    hasTimesTable: true,
    hasFractions: false,
    teachingTipBg: "Детето трябва да знае таблицата наизуст. При деление питай 'Кое число по Х дава Y?'",
  },
  4: {
    topicSummaryBg: "По-големи числа, многостъпкови задачи, въведение в дробите",
    operations: ["addition", "subtraction", "multiplication", "division"],
    numberRange: 10000,
    hasTimesTable: true,
    hasFractions: true,
    teachingTipBg: "Дробите обяснявай с пица или ябълка. Реши задачите стъпка по стъпка.",
  },
  5: {
    topicSummaryBg: "Дроби, десетични числа, основна геометрия",
    operations: ["addition", "subtraction", "multiplication", "division"],
    numberRange: 100000,
    hasTimesTable: true,
    hasFractions: true,
    teachingTipBg: "Десетичните числа обяснявай чрез пари (лева и стотинки). Геометрията — рисувай.",
  },
  6: {
    topicSummaryBg: "Уравнения, пропорции, процент, геометрични тела",
    operations: ["addition", "subtraction", "multiplication", "division"],
    numberRange: 1000000,
    hasTimesTable: true,
    hasFractions: true,
    teachingTipBg: "Уравнения: обяснявай чрез везни (двете страни са равни). Процент = от 100.",
  },
  7: {
    topicSummaryBg: "Рационални числа, права пропорционалност, статистика",
    operations: ["addition", "subtraction", "multiplication", "division"],
    numberRange: 10000000,
    hasTimesTable: true,
    hasFractions: true,
    teachingTipBg: "Рационалните числа включват цели и дробни. Графиките помагат за статистиката.",
  },
};

// ─── Grade Language Context ───────────────────────────────────────────────────

const GRADE_LANG: Record<number, GradeLangContext> = {
  1: {
    focusTopicsBg: ["Букви и звукове", "Гласни и съгласни", "Срички", "Прости думи", "Прости изречения"],
    keyTermsBg: ["буква", "звук", "гласна", "съгласна", "сричка", "дума", "изречение"],
    teachingTipBg: "Използвай прости думи. Пляскай срички. Чете бавно. Хвали всеки успех.",
  },
  2: {
    focusTopicsBg: ["Четене с разбиране", "Съществителни имена", "Глаголи", "Съставяне на изречения"],
    keyTermsBg: ["съществително", "глагол", "изречение", "главен герой", "текст"],
    teachingTipBg: "При четене: кой? какво прави? кога? Частите на речта — назови и покажи в изречение.",
  },
  3: {
    focusTopicsBg: ["Части на речта", "Правописни правила", "Разбиране на текст"],
    keyTermsBg: ["съществително", "прилагателно", "глагол", "правопис", "препинателни знаци"],
    teachingTipBg: "Правописните правила — дай примери с известни думи. Не учи правило без пример.",
  },
  4: {
    focusTopicsBg: ["Части на изречението", "Граматичен преговор", "Разширено четене", "Кратко изложение"],
    keyTermsBg: ["подлог", "сказуемо", "допълнение", "абзац", "основна мисъл"],
    teachingTipBg: "Подлог = кой? Сказуемо = какво прави? При изложение: въведение, развитие, край.",
  },
  5: {
    focusTopicsBg: ["Морфология", "Лексика", "Текстове — анализ и интерпретация"],
    keyTermsBg: ["морфема", "корен", "представка", "наставка", "синоним", "антоним"],
    teachingTipBg: "Морфологията е строежа на думата. Синонимите — думи с близко значение.",
  },
  6: {
    focusTopicsBg: ["Синтаксис", "Сложни изречения", "Стилистика"],
    keyTermsBg: ["просто изречение", "сложно изречение", "главно изречение", "подчинено изречение"],
    teachingTipBg: "Сложните изречения свързват идеи. Всяко подчинено отговаря на въпрос.",
  },
  7: {
    focusTopicsBg: ["Литература и анализ", "Реторика", "Писмено изложение"],
    keyTermsBg: ["тема", "идея", "автор", "герой", "конфликт", "развръзка"],
    teachingTipBg: "При анализ: тема (за какво?), идея (какво иска да каже авторът?).",
  },
};

// ─── Math Explanation with Grade Awareness ────────────────────────────────────

/**
 * Returns a grade-appropriate step-by-step math explanation.
 * Grade 1–2: use repeated addition / concrete objects.
 * Grade 3: reference times table.
 * Grade 4+: show structured multi-step solution.
 */
export function getGradeAwareMathExplanation(
  a: number,
  b: number,
  operation: string,
  result: number,
  grade: number,
  lang: Lang,
): string {
  const g = Math.max(1, Math.min(7, grade));

  if (lang === "bg") {
    if (operation === "multiplication") {
      if (g <= 2) {
        // Grade 1–2: repeated addition, very concrete
        const addends = Array(a).fill(b).join(" + ");
        return (
          `Нека помислим заедно.\n\n` +
          `${a} по ${b} означава да повторим ${b} точно ${a} пъти.\n\n` +
          `Ето как изглежда:\n${addends} = ${result}\n\n` +
          `Значи:\n${a} × ${b} = ${result}\n\nОтговор: **${result}**`
        );
      } else if (g === 3) {
        // Grade 3: reference times table
        return (
          `Проверяваме в таблицата за умножение.\n\n` +
          `${a} × ${b} = ?\n\n` +
          `Помним: ${a} реда × ${b} колони = ${result} квадратчета.\n\n` +
          `Значи ${a} × ${b} = **${result}**`
        );
      } else {
        // Grade 4+: structured
        return (
          `Ще решим стъпка по стъпка.\n\n` +
          `Задача: ${a} × ${b}\n\n` +
          `Стъпка 1: ${a} по ${b} = ${result}\n\n` +
          `Проверка: ${result} ÷ ${a} = ${b} ✓\n\n` +
          `Отговор: **${result}**`
        );
      }
    } else if (operation === "division") {
      if (g <= 2) {
        return (
          `Разделяме ${a} на ${b} равни части.\n\n` +
          `Питаме: Кое число по ${b} дава ${a}?\n\n` +
          `${result} × ${b} = ${a} ✓\n\n` +
          `Значи:\n${a} ÷ ${b} = **${result}**`
        );
      } else if (g === 3) {
        return (
          `Делението е обратното на умножението.\n\n` +
          `${a} ÷ ${b} = ?\n\n` +
          `Питаме: ? × ${b} = ${a}\n` +
          `Намираме в таблицата: ${result} × ${b} = ${a} ✓\n\n` +
          `Отговор: **${result}**`
        );
      } else {
        return (
          `Ще решим стъпка по стъпка.\n\n` +
          `Задача: ${a} ÷ ${b}\n\n` +
          `Стъпка 1: Питаме — ${b} × ? = ${a}\n` +
          `Стъпка 2: ${b} × ${result} = ${a} ✓\n\n` +
          `Проверка: ${result} × ${b} = ${a} ✓\n\n` +
          `Отговор: **${result}**`
        );
      }
    } else if (operation === "subtraction") {
      if (g <= 2) {
        return (
          `Вадим ${b} от ${a}.\n\n` +
          `Можем да броим назад от ${a}: ${Array.from({ length: b }, (_, i) => a - i).join(", ")}...\n\n` +
          `${a} - ${b} = **${result}**`
        );
      } else {
        return (
          `Задача: ${a} - ${b}\n\n` +
          `${a} минус ${b} = ${result}\n\n` +
          `Проверка: ${result} + ${b} = ${a} ✓\n\n` +
          `Отговор: **${result}**`
        );
      }
    } else {
      // addition
      if (g <= 2) {
        return (
          `Събираме ${a} и ${b}.\n\n` +
          `Броим напред от ${a}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(", ")}\n\n` +
          `${a} + ${b} = **${result}**`
        );
      } else {
        return (
          `Задача: ${a} + ${b}\n\n` +
          `${a} плюс ${b} = ${result}\n\n` +
          `Проверка: ${result} - ${b} = ${a} ✓\n\n` +
          `Отговор: **${result}**`
        );
      }
    }
  }

  // English / Spanish fallback (same structure, translated)
  const opWord = operation === "multiplication" ? (lang === "es" ? "por" : "times")
    : operation === "division" ? (lang === "es" ? "dividido entre" : "divided by")
    : operation === "subtraction" ? (lang === "es" ? "menos" : "minus")
    : (lang === "es" ? "más" : "plus");
  const letsThink = lang === "es" ? "Pensemos juntos." : "Let's think together.";
  const answer = lang === "es" ? "Respuesta" : "Answer";
  return (
    `${letsThink}\n\n` +
    `${a} ${opWord} ${b} = ?\n\n` +
    `${a} ${opWord} ${b} = ${result}\n\n` +
    `${answer}: **${result}**`
  );
}

// ─── Bulgarian Language Teaching Explanations ────────────────────────────────

/**
 * Returns a quick in-chat explanation for common Bulgarian language topics.
 * Used when AYA detects homework involving grammar/spelling/parts of speech.
 */
export function getBgLanguageExplanation(topicHint: string, grade: number): string {
  const g = Math.max(1, Math.min(7, grade));
  const hint = topicHint.toLowerCase();

  // Nouns (съществителни)
  if (hint.includes("съществителн") || hint.includes("noun") || hint.includes("подчертай съществителн")) {
    if (g <= 2) {
      return (
        `📝 **Съществителни имена** са думи, с които назоваваме хора, животни и предмети.\n\n` +
        `Примери: **мама, куче, маса, слон, град**\n\n` +
        `🎯 Въпрос: „Кой? Какво?" — ако отговорът е дума, тя е съществително!\n\n` +
        `Например: „Кой лае?" → Кучето → **куче** е съществително.`
      );
    } else {
      return (
        `📝 **Съществителното** е дума, която назовава предмет, лице, явление или понятие.\n\n` +
        `Въпроси: **Кой? Какво? Кого? Чий?**\n\n` +
        `Примери: ябълка (Какво?), Мария (Кой?), любов (Какво?), вятър (Какво?)\n\n` +
        `В изречението съществителното може да е **подлог** или **допълнение**.`
      );
    }
  }

  // Verbs (глаголи)
  if (hint.includes("глагол") || hint.includes("verb")) {
    if (g <= 2) {
      return (
        `📝 **Глаголите** са думи, с които казваме какво правим или какво се случва.\n\n` +
        `Примери: **бягам, играя, уча, спя, ям**\n\n` +
        `🎯 Въпрос: „Какво прави?" → ако отговорът е действие, думата е глагол!\n\n` +
        `„Кучето **лае**." → лае е глагол.`
      );
    } else {
      return (
        `📝 **Глаголът** изразява действие, процес или състояние.\n\n` +
        `Въпроси: **Какво прави? Какво се прави? Какво е?**\n\n` +
        `Глаголите се изменят по **лице**, **число** и **време** (минало, сегашно, бъдеще).\n\n` +
        `Примери: уча (сег.), учих (мин.), ще уча (бъд.)`
      );
    }
  }

  // Adjectives (прилагателни)
  if (hint.includes("прилагателн") || hint.includes("adjective")) {
    if (g <= 3) {
      return (
        `📝 **Прилагателните** описват как изглежда или каква е дадена дума.\n\n` +
        `Примери: **голям, малък, червен, бърз, красив**\n\n` +
        `🎯 Въпрос: „Какъв? Каква? Какво?" пред съществителното.\n\n` +
        `„**Голямото** куче лае." → голямото е прилагателно.`
      );
    } else {
      return (
        `📝 **Прилагателното** означава качество или свойство на предмет.\n\n` +
        `Съгласува се с съществителното по **род** и **число**.\n\n` +
        `Мъжки: добър, Женски: добра, Среден: добро, Мн.ч.: добри\n\n` +
        `Степени: добър → по-добър → най-добър`
      );
    }
  }

  // Spelling (правопис)
  if (hint.includes("правопис") || hint.includes("spell") || hint.includes("правил")) {
    return (
      `📝 **Правопис** — правилно записване на думите.\n\n` +
      `Важни правила за ${g} клас:\n` +
      `• Имената на хора и градове се пишат с **главна буква**\n` +
      `• В края на изречението — **точка, въпросителна или удивителна**\n` +
      (g >= 3 ? `• Пред глаголи: „не" се пише **отделно** (не уча)\n` : "") +
      (g >= 4 ? `• Думите с ят: „бял/бяла", „вяра/вярвам"\n` : "") +
      `\n🎯 При съмнение: произнеси думата бавно и запиши каквото чуваш!`
    );
  }

  // Reading comprehension (четене с разбиране)
  if (hint.includes("четен") || hint.includes("прочети") || hint.includes("разбиране") || hint.includes("герой")) {
    return (
      `📖 **Четене с разбиране** — стъпки:\n\n` +
      `1️⃣ **Прочети** текста веднъж (или два пъти)\n` +
      `2️⃣ **Кой е главният герой?** — кой е най-важният в историята\n` +
      `3️⃣ **Какво се случва?** — накратко: начало → развитие → край\n` +
      `4️⃣ **Непознати думи** — опитай да разбереш от контекста\n` +
      `5️⃣ **Отговори** на въпросите\n\n` +
      (g >= 4 ? `💡 За по-задълбочено разбиране: Защо авторът е написал текста? Какво иска да ни каже?\n` : "")
    );
  }

  // Syllables (срички)
  if (hint.includes("сричк") || hint.includes("syllable")) {
    return (
      `✂️ **Срички** — делим думите на малки части.\n\n` +
      `Правило: Всяка сричка има поне **1 гласна** (А, Ъ, Е, И, О, У).\n\n` +
      `Начин: Постави ръка под брадата → при всяка гласна устата се отваря = 1 сричка.\n\n` +
      `Примери:\n` +
      `• МА-МА → 2 срички\n` +
      `• ЯБ-ЪЛ-КА → 3 срички\n` +
      `• УЧИЛ-ИЩЕ → 4 срички\n\n` +
      `🎯 Пляскай с ръце за всяка сричка!`
    );
  }

  // Sentences (изречения)
  if (hint.includes("изречени") || hint.includes("sentence")) {
    if (g <= 3) {
      return (
        `📝 **Изречение** — група думи, която изразява пълна мисъл.\n\n` +
        `Правила:\n` +
        `• Започва с **главна буква**\n` +
        `• Завършва с **.** или **?** или **!**\n\n` +
        `Пример: „Котката спи на дивана."\n\n` +
        `🎯 Провери: Изречението ти има ли смисъл само по себе си?`
      );
    } else {
      return (
        `📝 **Видове изречения:**\n\n` +
        `• **Просто** — 1 сказуемо: „Котката спи."\n` +
        `• **Сложно** — 2+ сказуеми: „Котката спи, а кучето играе."\n\n` +
        `По цел:\n` +
        `• Съобщително: „Вали дъжд."\n` +
        `• Въпросително: „Вали ли дъжд?"\n` +
        `• Удивително: „Колко хубав ден!"`
      );
    }
  }

  // Generic fallback — encourage the child
  return (
    `📝 Нека помислим заедно!\n\n` +
    `За ${g} клас учим: ${GRADE_LANG[g]?.focusTopicsBg.join(", ") ?? "Bulgarian language"}\n\n` +
    `Кажи ми какво точно трябва да направиш и ще ти помогна стъпка по стъпка! 🌟`
  );
}

// ─── Curriculum System Prompt Snippet ────────────────────────────────────────

/**
 * Returns a compact curriculum context string to inject into any AI system prompt.
 * Tells the model which grade topics are in scope and how to explain them.
 */
export function buildCurriculumContext(grade: number, lang: Lang): string {
  const g = Math.max(1, Math.min(7, grade));
  const mathCtx = GRADE_MATH[g];
  const langCtx = GRADE_LANG[g];

  if (lang === "bg") {
    return (
      `Детето е в ${g} клас (България). ` +
      `По математика: ${mathCtx.topicSummaryBg}. ` +
      (mathCtx.hasTimesTable ? `Знае таблицата за умножение. ` : "") +
      (mathCtx.hasFractions ? `Работи с дроби и десетични числа. ` : "") +
      `Преподавателски съвет: ${mathCtx.teachingTipBg} ` +
      `По Български език: ${langCtx.focusTopicsBg.join(", ")}. ` +
      `Ключови термини: ${langCtx.keyTermsBg.join(", ")}. ` +
      `Преподавателски съвет: ${langCtx.teachingTipBg}`
    );
  }

  if (lang === "es") {
    return (
      `El niño está en el grado ${g}. ` +
      `Matemáticas: ${mathCtx.topicSummaryBg}. ` +
      `Lenguaje: ${langCtx.focusTopicsBg.join(", ")}.`
    );
  }

  return (
    `Child is in grade ${g}. ` +
    `Math topics: ${mathCtx.topicSummaryBg}. ` +
    `Language topics: ${langCtx.focusTopicsBg.join(", ")}.`
  );
}

/**
 * Detects if a message likely contains a Bulgarian language homework task.
 * Returns a category string or null.
 */
export function detectBgLanguageTask(message: string): string | null {
  const msg = message.toLowerCase();
  if (msg.includes("съществителн")) return "nouns";
  if (msg.includes("глагол")) return "verbs";
  if (msg.includes("прилагателн")) return "adjectives";
  if (msg.includes("правопис") || msg.includes("изписва")) return "spelling";
  if (msg.includes("сричк")) return "syllables";
  if (msg.includes("изречени")) return "sentences";
  if (msg.includes("четен") || msg.includes("прочети") || msg.includes("герой")) return "reading";
  if (msg.includes("подчертай") || msg.includes("намери") || msg.includes("открий")) return "identify";
  return null;
}

/**
 * Detect likely math operation from a text message.
 * Returns a more specific detection than the existing coarse router.
 */
export function detectMathFromMessage(message: string): {
  ismath: boolean;
  likelyOperation: string | null;
} {
  const msg = message.toLowerCase();
  const hasMath = /\d/.test(msg) || msg.includes("колко") || msg.includes("задача") || msg.includes("сметни");
  if (!hasMath) return { ismath: false, likelyOperation: null };

  if (msg.includes("по") || msg.includes("умноже") || msg.includes("×") || msg.includes("*")) {
    return { ismath: true, likelyOperation: "multiplication" };
  }
  if (msg.includes("разделен") || msg.includes("дели") || msg.includes("÷") || msg.includes("/")) {
    return { ismath: true, likelyOperation: "division" };
  }
  if (msg.includes("минус") || msg.includes("извад") || msg.includes("-")) {
    return { ismath: true, likelyOperation: "subtraction" };
  }
  if (msg.includes("плюс") || msg.includes("събер") || msg.includes("+")) {
    return { ismath: true, likelyOperation: "addition" };
  }
  return { ismath: true, likelyOperation: null };
}
