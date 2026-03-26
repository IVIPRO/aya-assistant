/**
 * AYA Lesson Generator - Dev Utility
 * Generates lesson seed content compatible with the existing LessonContent schema
 * Reuses helper functions and patterns from lessonContent.ts
 * 
 * USAGE (dev only):
 * const lesson = generateLesson({ grade: 2, subject: 'mathematics', topic: 'multiplication_intro' });
 * console.log(JSON.stringify(lesson, null, 2));
 */

import type { LessonContent, LessonExample, QuizQuestion } from '../lib/lessonContent';

type LangCode = "en" | "bg" | "es";
type Band = "low" | "high";

export interface GeneratorParams {
  grade: number;
  subject: "mathematics" | "bulgarian-language" | "reading";
  topic: string;
  lessonCount?: number;
  lang?: LangCode;
}

/* ─── Helper functions (mirrored from lessonContent.ts) ─────────────── */

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mcOptions(correct: number, spread = 6): { options: string[]; correctIndex: number } {
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = rnd(1, spread);
    const w = Math.random() < 0.5 ? correct + d : Math.max(0, correct - d);
    if (w !== correct) wrongs.add(w);
  }
  const all = shuffle([correct, ...Array.from(wrongs)]);
  return { options: all.map(String), correctIndex: all.indexOf(correct) };
}

function band(grade: number): Band {
  return grade <= 2 ? "low" : "high";
}

function range(grade: number): [number, number] {
  if (grade <= 1) return [1, 9];
  if (grade === 2) return [5, 49];
  if (grade === 3) return [10, 99];
  return [50, 499];
}

/* ─── Math Problem Generators ─────────────────────────────────────── */

interface MathProblem {
  question: string;
  answer: string;
}

function addProb(grade: number): MathProblem {
  const [lo, hi] = range(grade);
  const a = rnd(lo, hi), b = rnd(lo, hi);
  return { question: `${a} + ${b} = ?`, answer: String(a + b) };
}

function mulProb(grade: number): MathProblem {
  const maxA = grade <= 2 ? 5 : 12;
  const maxB = grade <= 2 ? 3 : 12;
  const a = rnd(2, maxA), b = rnd(2, maxB);
  return { question: `${a} × ${b} = ?`, answer: String(a * b) };
}

function wordProb(grade: number, lang: LangCode): MathProblem {
  const a = rnd(3, range(grade)[1]);
  const b = rnd(2, a - 1);
  
  const templates: Record<LangCode, Array<(x: number, y: number) => { q: string; ans: string }>> = {
    en: [
      (x, y) => ({ q: `A box has ${x} apples. ${y} are eaten. How many remain?`, ans: String(x - y) }),
      (x, y) => ({ q: `There are ${x} birds. ${y} more arrive. How many in total?`, ans: String(x + y) }),
      (x, y) => ({ q: `${x} stickers split equally among ${y} children. Each gets?`, ans: String(Math.floor(x / y)) }),
    ],
    bg: [
      (x, y) => ({ q: `В кутия има ${x} ябълки. Изядени са ${y}. Колко останаха?`, ans: String(x - y) }),
      (x, y) => ({ q: `На поляна има ${x} птици. Прилетяват ${y}. Колко общо?`, ans: String(x + y) }),
      (x, y) => ({ q: `${x} стикера между ${y} деца поравно. По колко всяко?`, ans: String(Math.floor(x / y)) }),
    ],
    es: [
      (x, y) => ({ q: `Una caja tiene ${x} manzanas. Se comen ${y}. ¿Cuántas quedan?`, ans: String(x - y) }),
      (x, y) => ({ q: `Hay ${x} pájaros. Llegan ${y} más. ¿Cuántos hay en total?`, ans: String(x + y) }),
      (x, y) => ({ q: `${x} pegatinas entre ${y} niños por igual. ¿Cuántas le toca a cada uno?`, ans: String(Math.floor(x / y)) }),
    ],
  };
  
  const tpls = templates[lang];
  const t = tpls[rnd(0, tpls.length - 1)];
  const safeB = b < 2 ? 2 : b;
  const { q, ans } = t(a, safeB);
  return { question: q, answer: ans };
}

/* ─── Lesson Generator by Topic ───────────────────────────────────── */

function generateMathWortProblems(grade: number, lang: LangCode): LessonContent {
  const b = band(grade);
  
  if (b === "low") {
    return {
      lesson: {
        title: lang === "bg" ? "Текстови задачи" : lang === "es" ? "Problemas de palabras" : "Word Problems",
        explanation: lang === "bg"
          ? "Текстовите задачи разказват история с числа. Прочети внимателно какво трябва да направиш."
          : lang === "es"
          ? "Los problemas de palabras cuentan una historia con números. Lee con cuidado."
          : "Word problems tell a story with numbers. Read carefully to find what to do.",
        examples: [
          {
            problem: wordProb(grade, lang).question,
            solution: wordProb(grade, lang).answer,
            hint: lang === "bg" ? "Потърси ключови думи" : lang === "es" ? "Busca palabras clave" : "Look for key words",
          },
          {
            problem: wordProb(grade, lang).question,
            solution: wordProb(grade, lang).answer,
            hint: lang === "bg" ? "Запиши числата" : lang === "es" ? "Escribe los números" : "Write down the numbers",
          },
          {
            problem: wordProb(grade, lang).question,
            solution: wordProb(grade, lang).answer,
            hint: lang === "bg" ? "Реши стъпка по стъпка" : lang === "es" ? "Resuelve paso a paso" : "Solve step by step",
          },
        ],
        tip: lang === "bg" ? "🔑 Прочети два пъти!" : lang === "es" ? "🔑 ¡Lee dos veces!" : "🔑 Read twice!",
      },
      practice: {
        instructions: lang === "bg"
          ? "Реши следните задачи. Напиши отговора си и провери!"
          : lang === "es"
          ? "Resuelve los siguientes ejercicios. ¡Escribe tu respuesta y comprueba!"
          : "Solve the following problems. Write your answer and check!",
        problems: [
          wordProb(grade, lang),
          wordProb(grade, lang),
          wordProb(grade, lang),
          wordProb(grade, lang),
          wordProb(grade, lang),
        ],
      },
      quiz: {
        instructions: lang === "bg"
          ? "Избери верния отговор за всеки въпрос. Успех!"
          : lang === "es"
          ? "Elige la respuesta correcta para cada pregunta. ¡Buena suerte!"
          : "Choose the correct answer for each question. Good luck!",
        questions: Array.from({ length: 4 }, () => {
          const prob = wordProb(grade, lang);
          const correctNum = parseInt(prob.answer);
          return {
            question: prob.question,
            ...mcOptions(correctNum, 10),
          };
        }),
      },
    };
  }
  
  // Grade 3+ version
  return {
    lesson: {
      title: lang === "bg" ? "Текстови задачи" : lang === "es" ? "Problemas de palabras" : "Word Problems",
      explanation: lang === "bg"
        ? "Решавай задачи от реалния свят. Използвай събиране, изваждане, умножение или деление."
        : lang === "es"
        ? "Resuelve problemas del mundo real. Usa suma, resta, multiplicación o división."
        : "Solve real-world problems. Use addition, subtraction, multiplication, or division.",
      examples: [
        {
          problem: wordProb(grade, lang).question,
          solution: wordProb(grade, lang).answer,
          hint: lang === "bg" ? "Определи какво действие е нужно" : lang === "es" ? "Identifica la operación" : "Identify the operation",
        },
        {
          problem: wordProb(grade, lang).question,
          solution: wordProb(grade, lang).answer,
          hint: lang === "bg" ? "Проверй отговора" : lang === "es" ? "Comprueba el resultado" : "Check your answer",
        },
        {
          problem: wordProb(grade, lang).question,
          solution: wordProb(grade, lang).answer,
          hint: lang === "bg" ? "Двойни стъпки?" : lang === "es" ? "¿Dos pasos?" : "Two steps?",
        },
      ],
      tip: lang === "bg" ? "✅ Прочети отново въпроса!" : lang === "es" ? "✅ ¡Relee la pregunta!" : "✅ Reread the question!",
    },
    practice: {
      instructions: lang === "bg"
        ? "Реши следните задачи. Напиши отговора си и провери!"
        : lang === "es"
        ? "Resuelve los siguientes ejercicios. ¡Escribe tu respuesta y comprueba!"
        : "Solve the following problems. Write your answer and check!",
      problems: [
        wordProb(grade, lang),
        wordProb(grade, lang),
        wordProb(grade, lang),
        wordProb(grade, lang),
        wordProb(grade, lang),
      ],
    },
    quiz: {
      instructions: lang === "bg"
        ? "Избери верния отговор за всеки въпрос. Успех!"
        : lang === "es"
        ? "Elige la respuesta correcta para cada pregunta. ¡Buena suerte!"
        : "Choose the correct answer for each question. Good luck!",
      questions: Array.from({ length: 4 }, () => {
        const prob = wordProb(grade, lang);
        const correctNum = parseInt(prob.answer);
        return {
          question: prob.question,
          ...mcOptions(correctNum, 10),
        };
      }),
    },
  };
}

function generateBulgarianReading(grade: number, lang: LangCode): LessonContent {
  const b = band(grade);
  
  if (b === "low") {
    return {
      lesson: {
        title: lang === "bg" ? "Четене на български" : lang === "es" ? "Lectura en búlgaro" : "Reading in Bulgarian",
        explanation: lang === "bg"
          ? "Четенето помага да научиш езика естествено. Начни с кратки разкази."
          : lang === "es"
          ? "Leer textos en búlgaro te ayuda a aprender el idioma. Comienza con historias cortas."
          : "Reading Bulgarian texts helps you learn naturally. Start with short stories.",
        examples: [
          {
            problem: "Прочети: 'На поляна живее малко мече.'",
            solution: lang === "bg" ? "Малко мече живее на поляна." : lang === "es" ? "Un pequeño oso vive en un prado." : "A small bear lives in a meadow.",
            hint: lang === "bg" ? "Търси ключови думи" : lang === "es" ? "Busca palabras clave" : "Find key words",
          },
          {
            problem: "Прочети: 'Момичето чете книга.'",
            solution: lang === "bg" ? "Момичето прочита книга." : lang === "es" ? "La niña lee un libro." : "The girl reads a book.",
            hint: lang === "bg" ? "Какво прави момичето?" : lang === "es" ? "¿Qué hace la niña?" : "What is the girl doing?",
          },
          {
            problem: "Прочети: 'Котето е гладно.'",
            solution: lang === "bg" ? "Котето има нужда от храна." : lang === "es" ? "El gatito tiene hambre." : "The kitten is hungry.",
            hint: lang === "bg" ? "Какво чувства котето?" : lang === "es" ? "¿Qué siente el gatito?" : "How does the kitten feel?",
          },
        ],
        tip: lang === "bg" ? "📖 Преразкажи историята!" : lang === "es" ? "📖 ¡Recontar la historia!" : "📖 Retell the story!",
      },
      practice: {
        instructions: lang === "bg"
          ? "Отговори на въпросите за текстовете"
          : lang === "es"
          ? "Responde las preguntas sobre los textos"
          : "Answer questions about the texts",
        problems: [
          {
            question: lang === "bg" ? "Кой живее на поляна?" : lang === "es" ? "¿Quién vive en el prado?" : "Who lives in the meadow?",
            answer: lang === "bg" ? "мече" : lang === "es" ? "un oso" : "a bear",
          },
          {
            question: lang === "bg" ? "Какво чета момичето?" : lang === "es" ? "¿Qué lee la niña?" : "What is the girl reading?",
            answer: lang === "bg" ? "книга" : lang === "es" ? "un libro" : "a book",
          },
          {
            question: lang === "bg" ? "Как се чувства котето?" : lang === "es" ? "¿Cómo se siente el gatito?" : "How does the kitten feel?",
            answer: lang === "bg" ? "гладно" : lang === "es" ? "hambriento" : "hungry",
          },
          {
            question: lang === "bg" ? "Къде живее мечето?" : lang === "es" ? "¿Dónde vive el oso?" : "Where does the bear live?",
            answer: lang === "bg" ? "на поляна" : lang === "es" ? "en el prado" : "in a meadow",
          },
          {
            question: lang === "bg" ? "Кое животно е гладно?" : lang === "es" ? "¿Qué animal tiene hambre?" : "Which animal is hungry?",
            answer: lang === "bg" ? "котето" : lang === "es" ? "el gatito" : "the kitten",
          },
        ],
      },
      quiz: {
        instructions: lang === "bg"
          ? "Избери верния отговор"
          : lang === "es"
          ? "Elige la respuesta correcta"
          : "Choose the correct answer",
        questions: [
          {
            question: lang === "bg" ? "Кой живее на поляна?" : lang === "es" ? "¿Quién vive en el prado?" : "Who lives in the meadow?",
            options: [
              lang === "bg" ? "котете" : lang === "es" ? "un gato" : "a cat",
              lang === "bg" ? "мече" : lang === "es" ? "un oso" : "a bear",
              lang === "bg" ? "птица" : lang === "es" ? "un pájaro" : "a bird",
              lang === "bg" ? "риба" : lang === "es" ? "un pez" : "a fish",
            ],
            correctIndex: 1,
          },
          {
            question: lang === "bg" ? "Какво чета момичето?" : lang === "es" ? "¿Qué lee la niña?" : "What is the girl reading?",
            options: [
              lang === "bg" ? "играчка" : lang === "es" ? "un juguete" : "a toy",
              lang === "bg" ? "книга" : lang === "es" ? "un libro" : "a book",
              lang === "bg" ? "картина" : lang === "es" ? "una pintura" : "a picture",
              lang === "bg" ? "писмо" : lang === "es" ? "una carta" : "a letter",
            ],
            correctIndex: 1,
          },
          {
            question: lang === "bg" ? "Как се чувства котето?" : lang === "es" ? "¿Cómo se siente el gatito?" : "How does the kitten feel?",
            options: [
              lang === "bg" ? "весело" : lang === "es" ? "feliz" : "happy",
              lang === "bg" ? "гладно" : lang === "es" ? "hambriento" : "hungry",
              lang === "bg" ? "сънно" : lang === "es" ? "dormido" : "sleepy",
              lang === "bg" ? "страховито" : lang === "es" ? "asustado" : "scared",
            ],
            correctIndex: 1,
          },
          {
            question: lang === "bg" ? "На кого харесва да чете?" : lang === "es" ? "¿A quién le gusta leer?" : "Who likes to read?",
            options: [
              lang === "bg" ? "мечето" : lang === "es" ? "el oso" : "the bear",
              lang === "bg" ? "котето" : lang === "es" ? "el gato" : "the cat",
              lang === "bg" ? "момичето" : lang === "es" ? "la niña" : "the girl",
              lang === "bg" ? "птицата" : lang === "es" ? "el pájaro" : "the bird",
            ],
            correctIndex: 2,
          },
        ],
      },
    };
  }
  
  // Grade 3+ version
  return {
    lesson: {
      title: lang === "bg" ? "Четене на български" : lang === "es" ? "Lectura en búlgaro" : "Reading in Bulgarian",
      explanation: lang === "bg"
        ? "Чети по-дълги текстове. Ищи основната идея и деталите."
        : lang === "es"
        ? "Lee textos más largos. Busca la idea principal y los detalles."
        : "Read longer texts. Find the main idea and details.",
      examples: [
        {
          problem: "Прочети: 'Момчето отиде в гора и видя красива птица. Птицата пееше.'",
          solution: lang === "bg" ? "Момчето видя птица" : lang === "es" ? "El niño vio un pájaro" : "The boy saw a bird",
          hint: lang === "bg" ? "Какво видя момчето?" : lang === "es" ? "¿Qué vio el niño?" : "What did the boy see?",
        },
        {
          problem: "Прочети: 'На село живеят интересни животни. Всяко е различно.'",
          solution: lang === "bg" ? "Животни живеят на село" : lang === "es" ? "Animales viven en el pueblo" : "Animals live in a village",
          hint: lang === "bg" ? "Къде живеят животните?" : lang === "es" ? "¿Dónde viven los animales?" : "Where do the animals live?",
        },
        {
          problem: "Прочети: 'Децата играха в парка целия ден.'",
          solution: lang === "bg" ? "Децата играха дълго време" : lang === "es" ? "Los niños jugaron mucho tiempo" : "The children played a long time",
          hint: lang === "bg" ? "Колко дълго играха?" : lang === "es" ? "¿Cuánto tiempo jugaron?" : "How long did they play?",
        },
      ],
      tip: lang === "bg" ? "❓ Попросебе: Кой? Какво? Кога?" : lang === "es" ? "❓ Pregúntate: ¿Quién? ¿Qué? ¿Cuándo?" : "❓ Ask yourself: Who? What? When?",
    },
    practice: {
      instructions: lang === "bg"
        ? "Отговори на въпросите за текстовете"
        : lang === "es"
        ? "Responde las preguntas sobre los textos"
        : "Answer questions about the texts",
      problems: [
        {
          question: lang === "bg" ? "Какво видя момчето в гората?" : lang === "es" ? "¿Qué vio el niño en el bosque?" : "What did the boy see in the forest?",
          answer: lang === "bg" ? "птица" : lang === "es" ? "un pájaro" : "a bird",
        },
        {
          question: lang === "bg" ? "Където живеят животните?" : lang === "es" ? "¿Dónde viven los animales?" : "Where do the animals live?",
          answer: lang === "bg" ? "село" : lang === "es" ? "pueblo" : "village",
        },
        {
          question: lang === "bg" ? "Каква е птицата?" : lang === "es" ? "¿Cómo es el pájaro?" : "What is the bird like?",
          answer: lang === "bg" ? "красива" : lang === "es" ? "hermoso" : "beautiful",
        },
        {
          question: lang === "bg" ? "Какво правиха децата?" : lang === "es" ? "¿Qué hicieron los niños?" : "What did the children do?",
          answer: lang === "bg" ? "играха" : lang === "es" ? "jugaron" : "played",
        },
        {
          question: lang === "bg" ? "Колко дълго играха?" : lang === "es" ? "¿Cuánto tiempo jugaron?" : "How long did they play?",
          answer: lang === "bg" ? "целия ден" : lang === "es" ? "todo el día" : "all day",
        },
      ],
    },
    quiz: {
      instructions: lang === "bg"
        ? "Избери верния отговор"
        : lang === "es"
        ? "Elige la respuesta correcta"
        : "Choose the correct answer",
      questions: [
        {
          question: lang === "bg" ? "Където отиде момчето?" : lang === "es" ? "¿Adónde fue el niño?" : "Where did the boy go?",
          options: [
            lang === "bg" ? "в училище" : lang === "es" ? "a la escuela" : "to school",
            lang === "bg" ? "в гора" : lang === "es" ? "al bosque" : "to the forest",
            lang === "bg" ? "в парк" : lang === "es" ? "al parque" : "to a park",
            lang === "bg" ? "в магазин" : lang === "es" ? "a la tienda" : "to a store",
          ],
          correctIndex: 1,
        },
        {
          question: lang === "bg" ? "Какво пееше?" : lang === "es" ? "¿Qué cantaba?" : "What was singing?",
          options: [
            lang === "bg" ? "момчето" : lang === "es" ? "el niño" : "the boy",
            lang === "bg" ? "риба" : lang === "es" ? "un pez" : "a fish",
            lang === "bg" ? "птица" : lang === "es" ? "un pájaro" : "a bird",
            lang === "bg" ? "насекомо" : lang === "es" ? "un insecto" : "an insect",
          ],
          correctIndex: 2,
        },
        {
          question: lang === "bg" ? "Всяко животно е...?" : lang === "es" ? "¿Cada animal es...?" : "Each animal is...?",
          options: [
            lang === "bg" ? "еднакво" : lang === "es" ? "igual" : "the same",
            lang === "bg" ? "интересно" : lang === "es" ? "interesante" : "interesting",
            lang === "bg" ? "различно" : lang === "es" ? "diferente" : "different",
            lang === "bg" ? "малко" : lang === "es" ? "pequeño" : "small",
          ],
          correctIndex: 2,
        },
        {
          question: lang === "bg" ? "Декта играха целия...?" : lang === "es" ? "¿Los niños jugaron todo el...?" : "The children played all...?",
          options: [
            lang === "bg" ? "ден" : lang === "es" ? "día" : "day",
            lang === "bg" ? "месец" : lang === "es" ? "mes" : "month",
            lang === "bg" ? "час" : lang === "es" ? "hora" : "hour",
            lang === "bg" ? "миг" : lang === "es" ? "momento" : "moment",
          ],
          correctIndex: 0,
        },
      ],
    },
  };
}

/* ─── Multiplication Generator ─────────────────────────────────────── */

function generateMathMultiplication(grade: number, lang: LangCode): LessonContent {
  const b = band(grade);
  const maxA = b === "low" ? 5 : 9;
  const maxB = b === "low" ? 3 : 9;

  const title = lang === "bg" ? "Умножение" : lang === "es" ? "Multiplicación" : "Multiplication";
  const explanation =
    lang === "bg"
      ? `Умножението е бързо събиране. ${rnd(2, maxA)} × ${rnd(2, maxB)} означава ${rnd(2, maxA)} групи от ${rnd(2, maxB)}.`
      : lang === "es"
      ? `La multiplicación es suma rápida. ${rnd(2, maxA)} × ${rnd(2, maxB)} significa ${rnd(2, maxA)} grupos de ${rnd(2, maxB)}.`
      : `Multiplication is fast adding. ${rnd(2, maxA)} × ${rnd(2, maxB)} means ${rnd(2, maxA)} groups of ${rnd(2, maxB)}.`;

  const makeExample = () => {
    const a = rnd(2, maxA), bv = rnd(2, maxB), ans = a * bv;
    return {
      problem: `${a} × ${bv} = ?`,
      solution: String(ans),
      hint:
        lang === "bg" ? `Добави ${a} точно ${bv} пъти` :
        lang === "es" ? `Suma ${a} exactamente ${bv} veces` :
        `Add ${a} exactly ${bv} times`,
    };
  };

  const makeProb = (): { question: string; answer: string } => {
    const prob = mulProb(grade);
    return { question: prob.question, answer: prob.answer };
  };

  return {
    lesson: {
      title,
      explanation,
      examples: [makeExample(), makeExample(), makeExample()],
      tip:
        lang === "bg" ? "✖️ Научи таблицата за умножение наизуст!" :
        lang === "es" ? "✖️ ¡Aprende la tabla de multiplicar de memoria!" :
        "✖️ Learn your times tables by heart!",
    },
    practice: {
      instructions:
        lang === "bg" ? "Реши задачите с умножение." :
        lang === "es" ? "Resuelve los ejercicios de multiplicación." :
        "Solve the multiplication problems.",
      problems: [makeProb(), makeProb(), makeProb(), makeProb(), makeProb()],
    },
    quiz: {
      instructions:
        lang === "bg" ? "Избери верния отговор." :
        lang === "es" ? "Elige la respuesta correcta." :
        "Choose the correct answer.",
      questions: Array.from({ length: 4 }, () => {
        const prob = mulProb(grade);
        const correct = parseInt(prob.answer);
        return { question: prob.question, ...mcOptions(correct, 8) };
      }),
    },
  };
}

/* ─── Main Generator Functions ─────────────────────────────────────── */

/**
 * Generate a single lesson variation for the given parameters.
 * Each call produces randomized but schema-compliant content.
 */
export function generateLesson(params: GeneratorParams): LessonContent {
  const { grade, subject, topic, lang = "en" } = params;

  if (grade < 2 || grade > 4) {
    throw new Error(`Generator supports grades 2–4 only. Got grade ${grade}`);
  }

  if (subject === "mathematics") {
    if (topic === "word-problems") return generateMathWortProblems(grade, lang);
    if (topic === "multiplication_intro" || topic === "multiplication") return generateMathMultiplication(grade, lang);
  }

  if (subject === "bulgarian-language" && topic === "reading") {
    return generateBulgarianReading(grade, lang);
  }

  throw new Error(
    `Generator does not support subject="${subject}" topic="${topic}". ` +
    `Supported: mathematics/word-problems, mathematics/multiplication_intro, bulgarian-language/reading`
  );
}

/**
 * Generate multiple lesson variations for the given parameters.
 *
 * generateLessons({ grade: 2, subject: "mathematics", topic: "multiplication_intro", lessonCount: 5 })
 *
 * Returns an array of LessonContent objects — each is a fresh random variation.
 * Does NOT modify curriculum, DB, UI, or routes. Dev utility only.
 */
export function generateLessons(params: GeneratorParams): LessonContent[] {
  const { lessonCount = 1 } = params;
  if (lessonCount < 1 || lessonCount > 20) {
    throw new Error(`lessonCount must be between 1 and 20. Got ${lessonCount}`);
  }
  return Array.from({ length: lessonCount }, () => generateLesson(params));
}

/* ─── Dev Logging Helper ───────────────────────────────────────────── */

export function generateAndLog(params: GeneratorParams): void {
  const lessons = generateLessons(params);
  console.log(`\n✅ Generated ${lessons.length} lesson(s) for ${params.subject}/${params.topic} grade ${params.grade}:`);
  lessons.forEach((lesson, i) => {
    console.log(`\n--- Lesson ${i + 1} ---`);
    console.log(JSON.stringify(lesson, null, 2));
  });
}
