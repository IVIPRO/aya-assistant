type LangCode = "en" | "bg" | "es";

export interface LessonExample {
  problem: string;
  solution: string;
  hint: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface LessonContent {
  lesson: {
    title: string;
    explanation: string;
    examples: LessonExample[];
    tip: string;
  };
  practice: {
    instructions: string;
    problems: Array<{ question: string; answer: string }>;
  };
  quiz: {
    instructions: string;
    questions: QuizQuestion[];
  };
}

/* ─── helpers ─────────────────────────────────────────────────── */

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

/* Grade number ranges */
function range(grade: number): [number, number] {
  if (grade <= 1) return [1, 9];
  if (grade === 2) return [5, 49];
  if (grade === 3) return [10, 99];
  return [50, 499];
}

/* ─── Math problem generators ─────────────────────────────────── */

type MathProblem = { question: string; answer: string };

function addProb(grade: number): MathProblem {
  const [lo, hi] = range(grade);
  const a = rnd(lo, hi), b = rnd(lo, hi);
  return { question: `${a} + ${b} = ?`, answer: String(a + b) };
}

function subProb(grade: number): MathProblem {
  const [lo, hi] = range(grade);
  const a = rnd(lo + 1, hi);
  const b = rnd(lo, a - 1);
  return { question: `${a} − ${b} = ?`, answer: String(a - b) };
}

function mulProb(grade: number): MathProblem {
  const maxA = grade <= 2 ? 5 : 12;
  const maxB = grade <= 2 ? 3 : 12;
  const a = rnd(2, maxA), b = rnd(2, maxB);
  return { question: `${a} × ${b} = ?`, answer: String(a * b) };
}

function divProb(grade: number): MathProblem {
  const maxD = grade <= 2 ? 5 : 12;
  const d = rnd(2, maxD);
  const q = rnd(2, grade <= 2 ? 5 : 12);
  return { question: `${d * q} ÷ ${d} = ?`, answer: String(q) };
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
      (x, y) => ({ q: `На поляна има ${x} птици. Прилетяват още ${y}. Колко са общо?`, ans: String(x + y) }),
      (x, y) => ({ q: `${x} стикера се разделят поравно между ${y} деца. Колко получава всяко?`, ans: String(Math.floor(x / y)) }),
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

function mathProblemFn(topicId: string, grade: number, lang: LangCode): () => MathProblem {
  switch (topicId) {
    case "addition":       return () => addProb(grade);
    case "subtraction":    return () => subProb(grade);
    case "multiplication": return () => mulProb(grade);
    case "division":       return () => divProb(grade);
    case "word-problems":  return () => wordProb(grade, lang);
    default:               return () => addProb(grade);
  }
}

/* ─── Lesson text (by lang + grade band) ──────────────────────── */

type Band = "low" | "high"; // low=grade1-2, high=grade3-4
function band(grade: number): Band { return grade <= 2 ? "low" : "high"; }

interface TopicText {
  title: string;
  explanation: string;
  examples: LessonExample[];
  tip: string;
}

/* Returns lesson text; math topics generate examples inline, others are static */
function getTopicText(subjectId: string, topicId: string, grade: number, lang: LangCode): TopicText {
  const b = band(grade);
  const key = `${subjectId}/${topicId}`;

  const content: Record<string, Record<LangCode, Record<Band, TopicText>>> = {

    /* ── MATHEMATICS ── */
    "mathematics/addition": {
      en: {
        low: {
          title: "Addition",
          explanation: "Addition means putting numbers together to find a total. When we add, we count all the parts as one group.",
          examples: [
            { problem: "3 + 4", solution: "= 7", hint: "Count 3 dots, then count 4 more dots. How many in total?" },
            { problem: "6 + 2", solution: "= 8", hint: "Start at 6 on the number line and jump 2 steps forward." },
            { problem: "5 + 5", solution: "= 10", hint: "Doubles are easy — two equal groups always double the number!" },
          ],
          tip: "🖐️ You can use your fingers to count on when the numbers are small!",
        },
        high: {
          title: "Addition",
          explanation: "When adding larger numbers, line them up by place value (ones, tens, hundreds) and add each column from right to left. If a column totals 10 or more, carry the extra ten to the next column.",
          examples: [
            { problem: "47 + 35", solution: "= 82", hint: "7 + 5 = 12, write 2 carry 1. Then 4 + 3 + 1 = 8." },
            { problem: "136 + 248", solution: "= 384", hint: "6+8=14, write 4 carry 1. 3+4+1=8. 1+2=3." },
            { problem: "509 + 374", solution: "= 883", hint: "9+4=13, write 3 carry 1. 0+7+1=8. 5+3=8." },
          ],
          tip: "📐 Always line up the digits by place value before adding!",
        },
      },
      bg: {
        low: {
          title: "Събиране",
          explanation: "Събираме, когато искаме да знаем колко са всичко заедно. Например: имаш 3 ябълки, получаваш 4 — колко имаш?",
          examples: [
            { problem: "3 + 4", solution: "= 7", hint: "Нарисувай 3 точки, после 4 точки. Преброй всичко заедно." },
            { problem: "6 + 2", solution: "= 8", hint: "Стартирай от 6 и преброй напред 2: 7, 8." },
            { problem: "5 + 5", solution: "= 10", hint: "Две еднакви групи от 5 — това е 10!" },
          ],
          tip: "🖐️ При малки числа можеш да броиш на пръсти!",
        },
        high: {
          title: "Събиране",
          explanation: "При по-големи числа ги наредй по разряди: единици под единици, десетици под десетици. Събирай от дясно наляво. Ако сборът е 10 или повече, пренасяй в следващия разряд.",
          examples: [
            { problem: "47 + 35", solution: "= 82", hint: "7+5=12, пишем 2 и пренасяме 1. После 4+3+1=8." },
            { problem: "136 + 248", solution: "= 384", hint: "6+8=14, пишем 4 и пренасяме 1. 3+4+1=8. 1+2=3." },
            { problem: "509 + 374", solution: "= 883", hint: "9+4=13, пишем 3 и пренасяме 1. 0+7+1=8. 5+3=8." },
          ],
          tip: "📐 Нареди цифрите по разряди — тогава всичко е лесно!",
        },
      },
      es: {
        low: {
          title: "Suma",
          explanation: "La suma consiste en juntar números para encontrar el total. Cuando sumamos, contamos todas las partes como un solo grupo.",
          examples: [
            { problem: "3 + 4", solution: "= 7", hint: "Dibuja 3 puntos, luego 4 más. ¿Cuántos hay en total?" },
            { problem: "6 + 2", solution: "= 8", hint: "Empieza en 6 en la recta numérica y da 2 saltos hacia adelante." },
            { problem: "5 + 5", solution: "= 10", hint: "¡Los dobles son fáciles — dos grupos iguales siempre dan el doble!" },
          ],
          tip: "🖐️ ¡Puedes usar los dedos para contar cuando los números son pequeños!",
        },
        high: {
          title: "Suma",
          explanation: "Al sumar números más grandes, alinéalos por valor posicional (unidades, decenas, centenas) y suma cada columna de derecha a izquierda. Si la suma de una columna es 10 o más, lleva el extra a la siguiente columna.",
          examples: [
            { problem: "47 + 35", solution: "= 82", hint: "7+5=12, escribe 2 y lleva 1. Luego 4+3+1=8." },
            { problem: "136 + 248", solution: "= 384", hint: "6+8=14, escribe 4 y lleva 1. 3+4+1=8. 1+2=3." },
            { problem: "509 + 374", solution: "= 883", hint: "9+4=13, escribe 3. 0+7+1=8. 5+3=8." },
          ],
          tip: "📐 ¡Alinea siempre los dígitos por valor posicional antes de sumar!",
        },
      },
    },

    "mathematics/subtraction": {
      en: {
        low: {
          title: "Subtraction",
          explanation: "Subtraction means taking away from a group to find how many are left. It is the opposite of addition.",
          examples: [
            { problem: "8 − 3", solution: "= 5", hint: "Start with 8 objects, remove 3. Count what's left." },
            { problem: "10 − 4", solution: "= 6", hint: "Count back 4 steps from 10 on the number line." },
            { problem: "7 − 7", solution: "= 0", hint: "Taking away all leaves nothing — zero!" },
          ],
          tip: "🔢 Subtraction can never give you more than you started with!",
        },
        high: {
          title: "Subtraction",
          explanation: "To subtract large numbers, line them up by place value and subtract each column from right to left. If the top digit is smaller, borrow 10 from the next column.",
          examples: [
            { problem: "73 − 28", solution: "= 45", hint: "3 < 8, borrow: 13−8=5. Then 6−2=4." },
            { problem: "400 − 156", solution: "= 244", hint: "Borrow across zeros carefully: 10−6=4, 9−5=4, 3−1=2." },
            { problem: "605 − 237", solution: "= 368", hint: "5−7 → borrow: 15−7=8. 9−3=6. 5−2=3." },
          ],
          tip: "📝 When borrowing across a zero, you must borrow from two columns!",
        },
      },
      bg: {
        low: {
          title: "Изваждане",
          explanation: "Изваждаме, когато искаме да знаем колко остава. Например: имаш 8 молива, губиш 3 — колко ти останаха?",
          examples: [
            { problem: "8 − 3", solution: "= 5", hint: "Стартирай от 8 и брои назад 3: 7, 6, 5." },
            { problem: "10 − 4", solution: "= 6", hint: "Брои назад 4 стъпки от 10: 9, 8, 7, 6." },
            { problem: "7 − 7", solution: "= 0", hint: "Ако вземем всичко, не остава нищо — нула!" },
          ],
          tip: "🔢 При изваждане резултатът е по-малък от началното число!",
        },
        high: {
          title: "Изваждане",
          explanation: "При по-големи числа нареди ги по разряди и изваждай от дясно наляво. Ако горната цифра е по-малка — вземи назаем 10 от следващия разряд.",
          examples: [
            { problem: "73 − 28", solution: "= 45", hint: "3 < 8, заемаме: 13−8=5. После 6−2=4." },
            { problem: "400 − 156", solution: "= 244", hint: "Заемаме внимателно: 10−6=4, 9−5=4, 3−1=2." },
            { problem: "605 − 237", solution: "= 368", hint: "5−7 → заемаме: 15−7=8. 9−3=6. 5−2=3." },
          ],
          tip: "📝 Когато заемаш от нула, трябва да заемеш от две колони наведнъж!",
        },
      },
      es: {
        low: {
          title: "Resta",
          explanation: "Restar significa quitar de un grupo para ver cuánto queda. Es lo contrario de la suma.",
          examples: [
            { problem: "8 − 3", solution: "= 5", hint: "Empieza con 8 objetos, quita 3. Cuenta los que quedan." },
            { problem: "10 − 4", solution: "= 6", hint: "Cuenta 4 pasos hacia atrás desde 10 en la recta numérica." },
            { problem: "7 − 7", solution: "= 0", hint: "Si quitamos todo, no queda nada — ¡cero!" },
          ],
          tip: "🔢 ¡Al restar nunca obtenemos más de lo que empezamos!",
        },
        high: {
          title: "Resta",
          explanation: "Para restar números grandes, alinéalos por valor posicional y resta cada columna de derecha a izquierda. Si el dígito de arriba es menor, pide prestado 10 de la columna siguiente.",
          examples: [
            { problem: "73 − 28", solution: "= 45", hint: "3 < 8, prestamos: 13−8=5. Luego 6−2=4." },
            { problem: "400 − 156", solution: "= 244", hint: "Presta con cuidado: 10−6=4, 9−5=4, 3−1=2." },
            { problem: "605 − 237", solution: "= 368", hint: "5−7 → prestamos: 15−7=8. 9−3=6. 5−2=3." },
          ],
          tip: "📝 ¡Cuando pidas prestado a un cero, debes pedir de dos columnas!",
        },
      },
    },

    "mathematics/multiplication": {
      en: {
        low: {
          title: "Multiplication",
          explanation: "Multiplication is a fast way to add equal groups. 3 × 4 means 'three groups of four' — it's the same as 4 + 4 + 4.",
          examples: [
            { problem: "2 × 3", solution: "= 6", hint: "Two groups of three: ●●● + ●●● = 6" },
            { problem: "4 × 2", solution: "= 8", hint: "Four groups of two: 2+2+2+2 = 8" },
            { problem: "5 × 3", solution: "= 15", hint: "Count by 5s three times: 5, 10, 15!" },
          ],
          tip: "🌟 Memorizing the 2×, 5×, and 10× tables makes everything easier!",
        },
        high: {
          title: "Multiplication",
          explanation: "You should know your times tables up to 12×12. For larger numbers, multiply digit by digit and add the partial products.",
          examples: [
            { problem: "7 × 8", solution: "= 56", hint: "Learn it by heart: 7×8=56, 8×7=56 — same product!" },
            { problem: "12 × 9", solution: "= 108", hint: "12×9 = 12×10 − 12×1 = 120 − 12 = 108" },
            { problem: "24 × 3", solution: "= 72", hint: "20×3=60, 4×3=12, add: 60+12=72" },
          ],
          tip: "🔄 A × B = B × A — you can swap the order! Pick whichever is easier.",
        },
      },
      bg: {
        low: {
          title: "Умножение",
          explanation: "Умножението е бърз начин да съберем еднакви групи. 3 × 4 означава 'три групи от по четири' — същото е като 4+4+4.",
          examples: [
            { problem: "2 × 3", solution: "= 6", hint: "Две групи от по три: ●●● + ●●● = 6" },
            { problem: "4 × 2", solution: "= 8", hint: "Четири групи от по две: 2+2+2+2 = 8" },
            { problem: "5 × 3", solution: "= 15", hint: "Брой по 5 три пъти: 5, 10, 15!" },
          ],
          tip: "🌟 Заучи таблиците по 2, по 5 и по 10 — те правят всичко по-лесно!",
        },
        high: {
          title: "Умножение",
          explanation: "Трябва да знаеш таблицата за умножение до 12×12. За по-големи числа умножавай цифра по цифра и събирай частичните произведения.",
          examples: [
            { problem: "7 × 8", solution: "= 56", hint: "Научи го наизуст: 7×8=56!" },
            { problem: "12 × 9", solution: "= 108", hint: "12×9 = 12×10 − 12 = 120 − 12 = 108" },
            { problem: "24 × 3", solution: "= 72", hint: "20×3=60, 4×3=12, събери: 60+12=72" },
          ],
          tip: "🔄 А × Б = Б × А — можеш да разменяш реда! Избери по-лесния вариант.",
        },
      },
      es: {
        low: {
          title: "Multiplicación",
          explanation: "La multiplicación es una forma rápida de sumar grupos iguales. 3 × 4 significa 'tres grupos de cuatro' — es lo mismo que 4+4+4.",
          examples: [
            { problem: "2 × 3", solution: "= 6", hint: "Dos grupos de tres: ●●● + ●●● = 6" },
            { problem: "4 × 2", solution: "= 8", hint: "Cuatro grupos de dos: 2+2+2+2 = 8" },
            { problem: "5 × 3", solution: "= 15", hint: "¡Cuenta de 5 en 5 tres veces: 5, 10, 15!" },
          ],
          tip: "🌟 ¡Memorizar las tablas del 2, 5 y 10 lo hace todo más fácil!",
        },
        high: {
          title: "Multiplicación",
          explanation: "Debes saber las tablas de multiplicar hasta 12×12. Para números más grandes, multiplica dígito por dígito y suma los productos parciales.",
          examples: [
            { problem: "7 × 8", solution: "= 56", hint: "¡Apréndetelo de memoria: 7×8=56!" },
            { problem: "12 × 9", solution: "= 108", hint: "12×9 = 12×10 − 12 = 120 − 12 = 108" },
            { problem: "24 × 3", solution: "= 72", hint: "20×3=60, 4×3=12, suma: 60+12=72" },
          ],
          tip: "🔄 ¡A × B = B × A — puedes intercambiarlos! Elige el que sea más fácil.",
        },
      },
    },

    "mathematics/division": {
      en: {
        low: {
          title: "Division",
          explanation: "Division means sharing equally. 8 ÷ 2 asks 'how many groups of 2 fit in 8?' — or 'share 8 into 2 equal groups'. The answer is 4.",
          examples: [
            { problem: "6 ÷ 2", solution: "= 3", hint: "Share 6 into 2 equal groups — each group gets 3." },
            { problem: "10 ÷ 5", solution: "= 2", hint: "How many 5s fit in 10? Count: 5, 10 — two 5s!" },
            { problem: "9 ÷ 3", solution: "= 3", hint: "Three groups of 3 make 9: 3+3+3=9." },
          ],
          tip: "🔁 Division is the opposite of multiplication: 4×3=12 means 12÷3=4!",
        },
        high: {
          title: "Division",
          explanation: "Division is sharing a number into equal parts. For larger numbers, use the long division method: Divide → Multiply → Subtract → Bring down.",
          examples: [
            { problem: "84 ÷ 7", solution: "= 12", hint: "7×12=84. Think: 7×10=70, 7×2=14, 70+14=84." },
            { problem: "96 ÷ 8", solution: "= 12", hint: "8×12=96. Or: 96÷8 = 96÷4÷2 = 24÷2 = 12." },
            { problem: "144 ÷ 12", solution: "= 12", hint: "12×12=144 — a square number!" },
          ],
          tip: "✅ Always check: answer × divisor = dividend. E.g. 12 × 7 = 84 ✓",
        },
      },
      bg: {
        low: {
          title: "Деление",
          explanation: "Делението означава да разделим поравно. 8 ÷ 2 пита 'колко групи от 2 се съдържат в 8?' — отговорът е 4.",
          examples: [
            { problem: "6 ÷ 2", solution: "= 3", hint: "Раздели 6 на 2 равни групи — всяка група получава 3." },
            { problem: "10 ÷ 5", solution: "= 2", hint: "Колко пъти се побира 5 в 10? 5, 10 — два пъти!" },
            { problem: "9 ÷ 3", solution: "= 3", hint: "Три групи от по 3 правят 9: 3+3+3=9." },
          ],
          tip: "🔁 Делението е обратното на умножението: 4×3=12, значи 12÷3=4!",
        },
        high: {
          title: "Деление",
          explanation: "Делението е разпределяне на число в равни части. За по-големи числа се използва алгоритъмът: Дели → Умножи → Извади → Снеси.",
          examples: [
            { problem: "84 ÷ 7", solution: "= 12", hint: "7×12=84. Проверка: 7×10=70, 7×2=14, 70+14=84." },
            { problem: "96 ÷ 8", solution: "= 12", hint: "8×12=96. Или: 96÷8 = 96÷4÷2 = 24÷2 = 12." },
            { problem: "144 ÷ 12", solution: "= 12", hint: "12×12=144 — квадратно число!" },
          ],
          tip: "✅ Винаги проверявай: резултат × делител = делимо. Напр. 12 × 7 = 84 ✓",
        },
      },
      es: {
        low: {
          title: "División",
          explanation: "Dividir significa repartir por igual. 8 ÷ 2 pregunta '¿cuántos grupos de 2 caben en 8?' — la respuesta es 4.",
          examples: [
            { problem: "6 ÷ 2", solution: "= 3", hint: "Reparte 6 en 2 grupos iguales — cada grupo tiene 3." },
            { problem: "10 ÷ 5", solution: "= 2", hint: "¿Cuántos 5 caben en 10? ¡5, 10 — dos veces!" },
            { problem: "9 ÷ 3", solution: "= 3", hint: "Tres grupos de 3 forman 9: 3+3+3=9." },
          ],
          tip: "🔁 ¡La división es lo contrario de la multiplicación: 4×3=12 significa 12÷3=4!",
        },
        high: {
          title: "División",
          explanation: "Dividir es repartir un número en partes iguales. Para números más grandes, usa la división larga: Divide → Multiplica → Resta → Baja.",
          examples: [
            { problem: "84 ÷ 7", solution: "= 12", hint: "7×12=84. Piensa: 7×10=70, 7×2=14, 70+14=84." },
            { problem: "96 ÷ 8", solution: "= 12", hint: "8×12=96. O bien: 96÷8 = 96÷4÷2 = 24÷2 = 12." },
            { problem: "144 ÷ 12", solution: "= 12", hint: "¡12×12=144 — un número cuadrado!" },
          ],
          tip: "✅ Comprueba siempre: resultado × divisor = dividendo. Ej. 12 × 7 = 84 ✓",
        },
      },
    },

    /* ── BULGARIAN LANGUAGE ── */
    "bulgarian-language/alphabet": {
      en: {
        low: {
          title: "The Bulgarian Alphabet",
          explanation: "The Bulgarian alphabet is called the Cyrillic script. It has 30 letters. Every letter has its own sound. Learning each letter and its sound helps you read and write in Bulgarian.",
          examples: [
            { problem: "А а", solution: "sound: /a/ as in 'arm'", hint: "А is the first letter — like in 'аз' (I)." },
            { problem: "Б б", solution: "sound: /b/ as in 'ball'", hint: "Б sounds like English B — 'баща' means father." },
            { problem: "В в", solution: "sound: /v/ as in 'van'", hint: "В sounds like English V — 'вода' means water." },
          ],
          tip: "🔤 Practice writing each letter in the air with your finger!",
        },
        high: {
          title: "The Bulgarian Alphabet",
          explanation: "The Bulgarian Cyrillic alphabet has 30 letters. Some letters have soft and hard variants. Knowing every letter and its pronunciation is essential for reading fluently.",
          examples: [
            { problem: "Ъ ъ", solution: "unique Bulgarian vowel /ə/", hint: "ъ is in 'ъгъл' (corner) — a deep sound from the throat." },
            { problem: "Ь ь", solution: "softening sign", hint: "ь softens the consonant before it — 'шофьор' (driver)." },
            { problem: "Щ щ", solution: "sound: /sht/", hint: "'щастие' means happiness — hear the /sht/ sound?" },
          ],
          tip: "📖 Read Bulgarian text aloud every day to master all 30 letters!",
        },
      },
      bg: {
        low: {
          title: "Азбука",
          explanation: "Българската азбука се казва кирилица. Тя има 30 букви. Всяка буква има свой звук. Ако знаеш буквите и звуковете им, можеш да четеш и пишеш на български.",
          examples: [
            { problem: "А а", solution: "звук: /а/", hint: "А е първата буква — като в думата 'аз'." },
            { problem: "Б б", solution: "звук: /б/", hint: "Б е като в думата 'баща'." },
            { problem: "В в", solution: "звук: /в/", hint: "В е като в думата 'вода'." },
          ],
          tip: "🔤 Упражнявай се да рисуваш всяка буква с пръст във въздуха!",
        },
        high: {
          title: "Азбука",
          explanation: "Кирилицата има 30 букви. Някои букви имат мека и твърда форма. Знанието на всяка буква и произношението й е ключово за четенето.",
          examples: [
            { problem: "Ъ ъ", solution: "уникална гласна /ъ/", hint: "ъ е в 'ъгъл' — дълбок звук от гърлото." },
            { problem: "Ь ь", solution: "смекчаваща буква", hint: "ь смекчава съгласната пред нея — 'шофьор'." },
            { problem: "Щ щ", solution: "звук: /шт/", hint: "'щастие' — чуваш ли звука /шт/?" },
          ],
          tip: "📖 Чети на глас всеки ден, за да овладееш всичките 30 букви!",
        },
      },
      es: {
        low: {
          title: "El Alfabeto Búlgaro",
          explanation: "El alfabeto búlgaro se llama cirílico. Tiene 30 letras. Cada letra tiene su propio sonido. Aprender cada letra y su sonido te ayuda a leer y escribir en búlgaro.",
          examples: [
            { problem: "А а", solution: "sonido: /a/", hint: "А es la primera letra — como en 'аз' (yo)." },
            { problem: "Б б", solution: "sonido: /b/", hint: "Б suena como la B en español — 'баща' significa padre." },
            { problem: "В в", solution: "sonido: /v/", hint: "В suena como la V — 'вода' significa agua." },
          ],
          tip: "🔤 ¡Practica escribir cada letra en el aire con el dedo!",
        },
        high: {
          title: "El Alfabeto Búlgaro",
          explanation: "El cirílico búlgaro tiene 30 letras. Algunas tienen variantes suaves y duras. Conocer cada letra y su pronunciación es esencial para leer con fluidez.",
          examples: [
            { problem: "Ъ ъ", solution: "vocal única /ə/", hint: "ъ aparece en 'ъгъл' (esquina) — un sonido profundo." },
            { problem: "Ь ь", solution: "signo suavizante", hint: "ь suaviza la consonante anterior — 'шофьор' (conductor)." },
            { problem: "Щ щ", solution: "sonido: /sht/", hint: "'щастие' significa felicidad — ¿oyes el sonido /sht/?" },
          ],
          tip: "📖 ¡Lee texto búlgaro en voz alta cada día para dominar las 30 letras!",
        },
      },
    },

    /* ── LOGIC ── */
    "logic-thinking/patterns": {
      en: {
        low: {
          title: "Patterns",
          explanation: "A pattern is something that repeats in a predictable way. Patterns can be shapes, colors, numbers, or sounds. To find the next item, figure out the rule of the pattern.",
          examples: [
            { problem: "🔴 🔵 🔴 🔵 🔴 __", solution: "🔵", hint: "The colors alternate: red, blue, red, blue..." },
            { problem: "1, 3, 5, 7, __", solution: "9", hint: "Each number increases by 2 — these are odd numbers!" },
            { problem: "△ △△ △△△ __", solution: "△△△△", hint: "Each step adds one more triangle." },
          ],
          tip: "👁️ First find the repeating unit, then apply the rule to predict what comes next!",
        },
        high: {
          title: "Patterns & Sequences",
          explanation: "Sequences can grow by adding (arithmetic), multiplying (geometric), or following complex rules. Find the rule and you can predict any term in the sequence.",
          examples: [
            { problem: "2, 4, 8, 16, __", solution: "32", hint: "Each term is ×2 the previous — a geometric sequence!" },
            { problem: "1, 4, 9, 16, __", solution: "25", hint: "These are square numbers: 1², 2², 3², 4², 5²" },
            { problem: "1, 1, 2, 3, 5, __", solution: "8", hint: "Each term is the sum of the two before it — Fibonacci!" },
          ],
          tip: "🔢 Try finding the difference between consecutive terms first — that often reveals the rule!",
        },
      },
      bg: {
        low: {
          title: "Закономерности",
          explanation: "Закономерността е нещо, което се повтаря по предвидим начин. Закономерностите могат да бъдат фигури, цветове, числа или звуци. За да намериш следващото, открий правилото.",
          examples: [
            { problem: "🔴 🔵 🔴 🔵 🔴 __", solution: "🔵", hint: "Цветовете се редуват: червен, син, червен, син..." },
            { problem: "1, 3, 5, 7, __", solution: "9", hint: "Всяко следващо число е с 2 по-голямо — нечетни числа!" },
            { problem: "△ △△ △△△ __", solution: "△△△△", hint: "На всяка стъпка се добавя по един триъгълник." },
          ],
          tip: "👁️ Първо намери повтарящата се единица, после приложи правилото!",
        },
        high: {
          title: "Закономерности и редици",
          explanation: "Редиците могат да растат чрез събиране (аритметични), умножение (геометрични) или по сложни правила. Намери правилото и можеш да предвидиш всеки член.",
          examples: [
            { problem: "2, 4, 8, 16, __", solution: "32", hint: "Всеки член е ×2 предишния — геометрична редица!" },
            { problem: "1, 4, 9, 16, __", solution: "25", hint: "Квадратни числа: 1², 2², 3², 4², 5²" },
            { problem: "1, 1, 2, 3, 5, __", solution: "8", hint: "Всеки член е сумата от двата предишни — Фибоначи!" },
          ],
          tip: "🔢 Опитай да намериш разликата между последователни членове — това разкрива правилото!",
        },
      },
      es: {
        low: {
          title: "Patrones",
          explanation: "Un patrón es algo que se repite de manera predecible. Los patrones pueden ser formas, colores, números o sonidos. Para encontrar el siguiente, descubre la regla del patrón.",
          examples: [
            { problem: "🔴 🔵 🔴 🔵 🔴 __", solution: "🔵", hint: "Los colores se alternan: rojo, azul, rojo, azul..." },
            { problem: "1, 3, 5, 7, __", solution: "9", hint: "¡Cada número aumenta en 2 — son números impares!" },
            { problem: "△ △△ △△△ __", solution: "△△△△", hint: "En cada paso se añade un triángulo más." },
          ],
          tip: "👁️ ¡Primero encuentra la unidad que se repite, luego aplica la regla!",
        },
        high: {
          title: "Patrones y Secuencias",
          explanation: "Las secuencias pueden crecer sumando (aritméticas), multiplicando (geométricas) o siguiendo reglas complejas. Encuentra la regla y podrás predecir cualquier término.",
          examples: [
            { problem: "2, 4, 8, 16, __", solution: "32", hint: "¡Cada término es ×2 el anterior — secuencia geométrica!" },
            { problem: "1, 4, 9, 16, __", solution: "25", hint: "Son números cuadrados: 1², 2², 3², 4², 5²" },
            { problem: "1, 1, 2, 3, 5, __", solution: "8", hint: "¡Cada término es la suma de los dos anteriores — Fibonacci!" },
          ],
          tip: "🔢 ¡Intenta encontrar la diferencia entre términos consecutivos — eso suele revelar la regla!",
        },
      },
    },

    /* ── NATURE ── */
    "nature-science/plants": {
      en: {
        low: {
          title: "Plants",
          explanation: "Plants are living things that make their own food using sunlight, water, and air. Most plants have roots (to drink water), a stem (to carry food), leaves (to catch sunlight), and flowers (to make seeds).",
          examples: [
            { problem: "What do roots do?", solution: "They absorb water and minerals from the soil.", hint: "Think of roots as the plant's drinking straw underground." },
            { problem: "Why are leaves green?", solution: "Because they contain chlorophyll — a pigment that captures sunlight.", hint: "Chlorophyll turns sunlight into food for the plant." },
            { problem: "What is photosynthesis?", solution: "Plants use sunlight + water + CO₂ to make food and oxygen.", hint: "Light + water + air → food + oxygen ☀️" },
          ],
          tip: "🌱 Try growing a bean in a cup of soil — watch it sprout in a few days!",
        },
        high: {
          title: "Plants",
          explanation: "Plants carry out photosynthesis to produce glucose (their food) and oxygen. They have specialised organs: roots, stems, leaves, flowers, and seeds. Plants are producers at the bottom of every food chain.",
          examples: [
            { problem: "What is the formula for photosynthesis?", solution: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂", hint: "Carbon dioxide + water + light energy → glucose + oxygen." },
            { problem: "What do xylem and phloem do?", solution: "Xylem carries water up; phloem carries food (glucose) around the plant.", hint: "X = up for water; P = distributes products of photosynthesis." },
            { problem: "Name the stages of a plant life cycle.", solution: "Seed → Germination → Seedling → Mature plant → Flower → Pollination → Seed", hint: "It's a cycle — seeds create new seeds!" },
          ],
          tip: "🌿 Compare a cross-section of a leaf under a magnifying glass with your diagram!",
        },
      },
      bg: {
        low: {
          title: "Растения",
          explanation: "Растенията са живи същества, които сами си правят храна от слънчева светлина, вода и въздух. Повечето растения имат корен, стъбло, листа и цвят.",
          examples: [
            { problem: "Какво правят корените?", solution: "Поемат вода и минерали от почвата.", hint: "Коренът е като сламка на растението в земята." },
            { problem: "Защо листата са зелени?", solution: "Защото съдържат хлорофил — пигмент, улавящ слънчева светлина.", hint: "Хлорофилът превръща светлината в храна за растението." },
            { problem: "Какво е фотосинтезата?", solution: "Растенията използват светлина + вода + CO₂, за да произведат храна и кислород.", hint: "Светлина + вода + въздух → храна + кислород ☀️" },
          ],
          tip: "🌱 Засади боб в чашка с пръст — след дни ще видиш как покълва!",
        },
        high: {
          title: "Растения",
          explanation: "Растенията извършват фотосинтеза, за да произведат глюкоза (своята храна) и кислород. Те имат специализирани органи: корен, стъбло, листа, цветове и семена.",
          examples: [
            { problem: "Формулата на фотосинтезата?", solution: "6CO₂ + 6H₂O + светлина → C₆H₁₂O₆ + 6O₂", hint: "Въглероден диоксид + вода + светлина → глюкоза + кислород." },
            { problem: "Какво правят ксилемът и флоемът?", solution: "Ксилемът пренася вода нагоре; флоемът разпределя хранителни вещества.", hint: "К = вода нагоре; Ф = разпределя продуктите на фотосинтезата." },
            { problem: "Изброй стадиите на жизнения цикъл на растение.", solution: "Семе → Поникване → Разсад → Зряло растение → Цвят → Опрашване → Семе", hint: "Цикълът е затворен — семената създават нови семена!" },
          ],
          tip: "🌿 Разгледай напречен разрез на лист с лупа!",
        },
      },
      es: {
        low: {
          title: "Las Plantas",
          explanation: "Las plantas son seres vivos que fabrican su propio alimento usando la luz solar, el agua y el aire. La mayoría tienen raíces, tallo, hojas y flor.",
          examples: [
            { problem: "¿Qué hacen las raíces?", solution: "Absorben agua y minerales del suelo.", hint: "Imagina las raíces como una pajita de la planta bajo tierra." },
            { problem: "¿Por qué las hojas son verdes?", solution: "Porque contienen clorofila, un pigmento que capta la luz solar.", hint: "La clorofila transforma la luz en alimento para la planta." },
            { problem: "¿Qué es la fotosíntesis?", solution: "Las plantas usan luz + agua + CO₂ para producir alimento y oxígeno.", hint: "Luz + agua + aire → alimento + oxígeno ☀️" },
          ],
          tip: "🌱 ¡Planta una judía en un vaso de tierra y observa cómo brota en pocos días!",
        },
        high: {
          title: "Las Plantas",
          explanation: "Las plantas realizan la fotosíntesis para producir glucosa y oxígeno. Tienen órganos especializados: raíces, tallo, hojas, flores y semillas.",
          examples: [
            { problem: "¿La fórmula de la fotosíntesis?", solution: "6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂", hint: "Dióxido de carbono + agua + luz → glucosa + oxígeno." },
            { problem: "¿Qué hacen el xilema y el floema?", solution: "El xilema lleva agua hacia arriba; el floema distribuye los nutrientes.", hint: "X = agua hacia arriba; F = distribuye los productos de la fotosíntesis." },
            { problem: "Nombra las fases del ciclo de vida de una planta.", solution: "Semilla → Germinación → Plántula → Planta adulta → Flor → Polinización → Semilla", hint: "¡Es un ciclo — las semillas crean nuevas semillas!" },
          ],
          tip: "🌿 ¡Mira un corte transversal de hoja con una lupa!",
        },
      },
    },

    /* ── ENGLISH LANGUAGE ── */
    "english-language/vocabulary": {
      en: {
        low: {
          title: "Vocabulary",
          explanation: "Vocabulary is all the words you know! The more words you learn, the better you can read, write, and talk. Let's learn some everyday words.",
          examples: [
            { problem: "home", solution: "a place where you live", hint: "Think: 'I live at home with my family.'" },
            { problem: "friend", solution: "someone you like and enjoy being with", hint: "Think: 'My friend and I play together.'" },
            { problem: "learn", solution: "to get new knowledge or a new skill", hint: "Think: 'I learn new things at school.'" },
          ],
          tip: "📒 Keep a word diary — write 3 new words every week with their meaning!",
        },
        high: {
          title: "Vocabulary",
          explanation: "A rich vocabulary helps you understand everything you read and express yourself clearly. Learn word roots and prefixes to unlock hundreds of new words at once.",
          examples: [
            { problem: "prefix: 'un-'", solution: "means 'not' — unhappy, unclear, undo", hint: "Add 'un-' to any adjective or verb to reverse it." },
            { problem: "root: 'graph'", solution: "means 'write' — photograph, paragraph, autograph", hint: "'photo-graph' = light-write → a picture made by light!" },
            { problem: "suffix: '-tion'", solution: "turns a verb into a noun — act → action, invent → invention", hint: "When you add '-tion', the action becomes a thing." },
          ],
          tip: "🔍 When you meet an unknown word, look for familiar roots, prefixes, and suffixes!",
        },
      },
      bg: {
        low: {
          title: "Речников запас",
          explanation: "Речниковият запас е всички думи, които знаеш на английски! Колкото повече думи знаеш, толкова по-добре можеш да четеш и говориш. Нека научим някои ежедневни думи.",
          examples: [
            { problem: "home", solution: "дом — място, където живееш", hint: "Изречение: 'I live at home.' (Живея у дома.)" },
            { problem: "friend", solution: "приятел — някой, когото обичаш да виждаш", hint: "Изречение: 'She is my friend.' (Тя е моя приятелка.)" },
            { problem: "learn", solution: "уча — придобиваш нови знания", hint: "Изречение: 'I learn at school.' (Уча се в училище.)" },
          ],
          tip: "📒 Води речников тефтер — записвай 3 нови думи всяка седмица с превода им!",
        },
        high: {
          title: "Речников запас",
          explanation: "Богатият речников запас ти помага да разбираш всичко, което четеш, и да се изразяваш ясно. Научи словообразувателните елементи, за да отключиш стотици нови думи наведнъж.",
          examples: [
            { problem: "представка: 'un-'", solution: "означава 'не' — unhappy, unclear, undo", hint: "Добави 'un-' към прилагателно или глагол, за да го обърнеш." },
            { problem: "корен: 'graph'", solution: "означава 'пиша' — photograph, paragraph, autograph", hint: "'photo-graph' = светлина-пиша → картина, направена от светлина!" },
            { problem: "наставка: '-tion'", solution: "превръща глагол в съществително — act→action, invent→invention", hint: "Когато добавиш '-tion', действието става предмет." },
          ],
          tip: "🔍 Когато срещнеш непозната дума, потърси познати корени и представки!",
        },
      },
      es: {
        low: {
          title: "Vocabulario",
          explanation: "El vocabulario son todas las palabras que conoces en inglés. Cuantas más palabras aprendas, mejor podrás leer, escribir y hablar. ¡Aprendamos algunas palabras cotidianas!",
          examples: [
            { problem: "home", solution: "hogar — lugar donde vives", hint: "Frase: 'I live at home.' (Vivo en casa.)" },
            { problem: "friend", solution: "amigo/a — alguien que te gusta ver", hint: "Frase: 'She is my friend.' (Ella es mi amiga.)" },
            { problem: "learn", solution: "aprender — obtener nuevos conocimientos", hint: "Frase: 'I learn at school.' (Aprendo en la escuela.)" },
          ],
          tip: "📒 ¡Lleva un diario de palabras — anota 3 palabras nuevas cada semana con su significado!",
        },
        high: {
          title: "Vocabulario",
          explanation: "Un vocabulario rico te ayuda a entender todo lo que lees y a expresarte con claridad. Aprende raíces y prefijos para descubrir cientos de palabras nuevas de golpe.",
          examples: [
            { problem: "prefijo: 'un-'", solution: "significa 'no' — unhappy, unclear, undo", hint: "Añade 'un-' a cualquier adjetivo o verbo para invertirlo." },
            { problem: "raíz: 'graph'", solution: "significa 'escribir' — photograph, paragraph, autograph", hint: "'photo-graph' = luz-escribir → ¡una imagen hecha de luz!" },
            { problem: "sufijo: '-tion'", solution: "convierte un verbo en sustantivo — act→action, invent→invention", hint: "Cuando añades '-tion', la acción se convierte en cosa." },
          ],
          tip: "🔍 ¡Cuando veas una palabra desconocida, busca raíces, prefijos y sufijos conocidos!",
        },
      },
    },

    /* ── MATHEMATICS / WORD PROBLEMS ── */
    "mathematics/word-problems": {
      en: {
        low: {
          title: "Word Problems",
          explanation: "Word problems tell a story with numbers. Read carefully to find what you need to add, subtract, multiply, or divide. Look for key words like 'altogether', 'left', 'each', and 'how many'.",
          examples: [
            { problem: "Maria has 8 apples. She gives 3 to her friend. How many does she have left?", solution: "5 apples", hint: "The key word is 'left' — this means subtract: 8 − 3 = 5" },
            { problem: "There are 4 children. Each child gets 2 cookies. How many cookies in total?", solution: "8 cookies", hint: "The key word is 'each' — this means multiply: 4 × 2 = 8" },
            { problem: "Jon has 15 stickers. He buys 5 more. How many does he have now?", solution: "20 stickers", hint: "The key word is 'more' — this means add: 15 + 5 = 20" },
          ],
          tip: "🔑 Read the problem twice. Circle the numbers. Underline the question. Then solve!",
        },
        high: {
          title: "Word Problems",
          explanation: "Solve real-world problems by identifying what operation you need (add, subtract, multiply, divide). Two-step problems require two operations. Always check your answer makes sense.",
          examples: [
            { problem: "A store has 48 apples in 6 baskets equally. How many apples per basket?", solution: "8 apples per basket", hint: "Divide 48 ÷ 6 = 8. Check: 8 × 6 = 48 ✓" },
            { problem: "Tom reads 12 pages a day for 5 days, then 3 more pages. Total?", solution: "63 pages", hint: "Two steps: 12 × 5 = 60, then 60 + 3 = 63" },
            { problem: "A farmer plants 25 rows of carrots with 8 plants per row. How many total?", solution: "200 plants", hint: "Multiply: 25 × 8 = 200" },
          ],
          tip: "✅ Always reread the question to make sure your answer answers it!",
        },
      },
      bg: {
        low: {
          title: "Текстови задачи",
          explanation: "Текстовите задачи разказват история с числа. Прочети внимателно, за да намериш какво трябва да събереш, извадиш, умножиш или разделиш. Потърси ключови думи като 'общо', 'останаха', 'всяко' и 'колко'.",
          examples: [
            { problem: "Мария има 8 ябълки. Дава 3 на приятелка. Колко й останаха?", solution: "5 ябълки", hint: "Ключовата дума е 'останаха' — това е изваждане: 8 − 3 = 5" },
            { problem: "Има 4 деца. Всяко дете получава 2 бисквитки. Колко бисквитки общо?", solution: "8 бисквитки", hint: "Ключовата дума е 'всяко' — това е умножение: 4 × 2 = 8" },
            { problem: "Йон има 15 стикера. Купува 5 повече. Колко има сега?", solution: "20 стикера", hint: "Ключовата дума е 'повече' — това е събиране: 15 + 5 = 20" },
          ],
          tip: "🔑 Прочети задачата два пъти. Оградете числата. Подчертай въпроса. После реши!",
        },
        high: {
          title: "Текстови задачи",
          explanation: "При текстови задачи: прочети, реши кое действие е нужно, извърши го и провери дали отговорът има смисъл. Задачи с два стъпала изискват две действия.",
          examples: [
            { problem: "Магазин има 48 ябълки в 6 кошници поравно. По колко ябълки в кошница?", solution: "8 ябълки в кошница", hint: "Дели: 48 ÷ 6 = 8. Проверка: 8 × 6 = 48 ✓" },
            { problem: "Том чете 12 страници на ден за 5 дни, после 3 страници повече. Общо?", solution: "63 страници", hint: "Два стъпки: 12 × 5 = 60, после 60 + 3 = 63." },
            { problem: "Фермер засява 25 реда моркови с по 8 растения. Колко общо?", solution: "200 растения", hint: "Умножи: 25 × 8 = 200." },
          ],
          tip: "✅ Прочети отново въпроса накрая — провери дали отговорът ти го отговаря!",
        },
      },
      es: {
        low: {
          title: "Problemas de palabras",
          explanation: "Los problemas de palabras cuentan una historia con números. Lee con cuidado para encontrar qué debes sumar, restar, multiplicar o dividir. Busca palabras clave como 'total', 'quedan', 'cada' y 'cuántos'.",
          examples: [
            { problem: "María tiene 8 manzanas. Le da 3 a su amiga. ¿Cuántas le quedan?", solution: "5 manzanas", hint: "La palabra clave es 'quedan' — esto es resta: 8 − 3 = 5" },
            { problem: "Hay 4 niños. Cada niño recibe 2 galletas. ¿Cuántas galletas en total?", solution: "8 galletas", hint: "La palabra clave es 'cada' — esto es multiplicación: 4 × 2 = 8" },
            { problem: "Jon tiene 15 pegatinas. Compra 5 más. ¿Cuántas tiene ahora?", solution: "20 pegatinas", hint: "La palabra clave es 'más' — esto es suma: 15 + 5 = 20" },
          ],
          tip: "🔑 ¡Lee el problema dos veces! Rodea los números. Subraya la pregunta. ¡Luego resuelve!",
        },
        high: {
          title: "Problemas de palabras",
          explanation: "Resuelve problemas del mundo real identificando qué operación necesitas (suma, resta, multiplicación, división). Los problemas de dos pasos requieren dos operaciones. ¡Siempre verifica que tu respuesta tenga sentido!",
          examples: [
            { problem: "Una tienda tiene 48 manzanas en 6 canastas iguales. ¿Cuántas por canasta?", solution: "8 manzanas por canasta", hint: "Divide: 48 ÷ 6 = 8. Comprobación: 8 × 6 = 48 ✓" },
            { problem: "Tom lee 12 páginas al día durante 5 días, luego 3 páginas más. ¿Total?", solution: "63 páginas", hint: "Dos pasos: 12 × 5 = 60, luego 60 + 3 = 63" },
            { problem: "Un granjero planta 25 filas de zanahorias con 8 plantas por fila. ¿Cuántas?", solution: "200 plantas", hint: "Multiplica: 25 × 8 = 200" },
          ],
          tip: "✅ ¡Siempre relee la pregunta para asegurarte de que tu respuesta la responde!",
        },
      },
    },

    /* ── BULGARIAN LANGUAGE / READING ── */
    "bulgarian-language/reading": {
      en: {
        low: {
          title: "Reading in Bulgarian",
          explanation: "Reading Bulgarian texts helps you learn the language naturally. Start with short, simple stories and focus on finding new words. Read once for the main idea, then again for details.",
          examples: [
            { problem: "Прочети: 'На поляна живее малко мече.'", solution: "Main idea: A small bear lives in a meadow.", hint: "'На поляна' = in a meadow, 'мече' = bear, 'живее' = lives" },
            { problem: "Прочети: 'Момичето чете книга в училище.'", solution: "Main idea: The girl reads a book at school.", hint: "'Момичето' = girl, 'чете' = reads, 'книга' = book, 'училище' = school" },
            { problem: "Прочети: 'Котето е гладно и иска храна.'", solution: "Main idea: The kitten is hungry and wants food.", hint: "'Котето' = kitten, 'гладно' = hungry, 'иска' = wants, 'храна' = food" },
          ],
          tip: "📖 After reading, close the book and retell the story in your own words!",
        },
        high: {
          title: "Reading in Bulgarian",
          explanation: "Read longer Bulgarian texts with different sentence structures. Look for the main idea and supporting details. Make predictions about what happens next and ask questions.",
          examples: [
            { problem: "Прочети: 'Момчето отиде в гора и видя красива птица. Птицата пееше прелестно.'", solution: "The boy went to the forest, saw a beautiful bird singing.", hint: "Sequence: отиде (went) → видя (saw) → пееше (sang)" },
            { problem: "Прочети: 'На село живеят интересни животни. Всяко животно е различно.'", solution: "Different animals live in the village, each is unique.", hint: "Focus on 'интересни' (interesting) and 'различно' (different)" },
            { problem: "Прочети: 'Децата играха в парка целия ден.'", solution: "The children played in the park all day.", hint: "'Целия ден' = all day — shows how long" },
          ],
          tip: "❓ Ask yourself: Who? What? When? Where? Why? after every paragraph!",
        },
      },
      bg: {
        low: {
          title: "Четене на български",
          explanation: "Четем, за да разберем какво се случва в текста. Прочети веднъж и отговори: За кого е? Какво прави? Прочети втори път и търси подробности.",
          examples: [
            { problem: "Прочети: 'На поляна живее малко мече.'", solution: "Основна идея: Малко мече живее на поляна.", hint: "Кой? — мечето. Къде? — на поляната. Какво прави? — живее там." },
            { problem: "Прочети: 'Момичето чете книга в училище.'", solution: "Момичето чете книга. То е в училище.", hint: "Кой? — момичето. Какво прави? — чете. Къде? — в училище." },
            { problem: "Прочети: 'Котето е гладно и иска храна.'", solution: "Котето е гладно и иска да яде.", hint: "Как е котето? — гладно. Какво иска? — храна." },
          ],
          tip: "📖 След четенето затвори книгата и преразкажи историята със своите думи!",
        },
        high: {
          title: "Четене на български",
          explanation: "При по-дълги текстове търси: основна идея, главен герой, случки и края. Задавай си въпроси: Защо се случи това? Какво иска да каже авторът?",
          examples: [
            { problem: "Прочети: 'Момчето отиде в гора и видя красива птица. Птицата пееше прелестно.'", solution: "Момчето видя в гората красива птица, която пееше.", hint: "Последователност: отиде (първо) → видя (второ) → пееше (трето)." },
            { problem: "Прочети: 'На село живеят интересни животни. Всяко животно е различно.'", solution: "В селото живеят разнообразни животни — всяко е различно.", hint: "Основна мисъл: разнообразието на животните в селото." },
            { problem: "Прочети: 'Децата играха в парка целия ден.'", solution: "Децата прекараха целия ден играейки в парка.", hint: "'Целия ден' показва колко дълго — от сутрин до вечер." },
          ],
          tip: "❓ Попитай себе си: Кой? Какво? Кога? Къде? Защо? след всеки абзац!",
        },
      },
      es: {
        low: {
          title: "Lectura en búlgaro",
          explanation: "Leer textos en búlgaro te ayuda a aprender el idioma naturalmente. Comienza con historias cortas y simples, enfocándote en encontrar palabras nuevas. Lee una vez para la idea principal, luego nuevamente para detalles.",
          examples: [
            { problem: "Lee: 'На поляна живее малко мече.'", solution: "Idea principal: Un pequeño oso vive en un prado.", hint: "'На поляна' = en un prado, 'мече' = oso, 'живее' = vive" },
            { problem: "Lee: 'Момичето чете книга в училище.'", solution: "Idea principal: La niña lee un libro en la escuela.", hint: "'Момичето' = niña, 'чете' = lee, 'книга' = libro, 'училище' = escuela" },
            { problem: "Lee: 'Котето е гладно и иска храна.'", solution: "Idea principal: El gatito tiene hambre y quiere comida.", hint: "'Котето' = gatito, 'гладно' = hambriento, 'иска' = quiere, 'храна' = comida" },
          ],
          tip: "📖 ¡Después de leer, cierra el libro y recontar la historia con tus propias palabras!",
        },
        high: {
          title: "Lectura en búlgaro",
          explanation: "Lee textos búlgaros más largos con diferentes estructuras de oraciones. Busca la idea principal y los detalles de apoyo. Haz predicciones sobre qué sucede después y formula preguntas.",
          examples: [
            { problem: "Lee: 'Момчето отиде в гора и видя красива птица. Птицата пееше прелестно.'", solution: "El niño fue al bosque, vio un pájaro hermoso cantando.", hint: "Secuencia: отиде (fue) → видя (vio) → пееше (cantaba)" },
            { problem: "Lee: 'На село живеят интересни животни. Всяко животно е различно.'", solution: "Animales interesantes viven en el pueblo, cada uno es diferente.", hint: "Enfoque en 'интересни' (interesantes) y 'различно' (diferente)" },
            { problem: "Lee: 'Децата играха в парка целия ден.'", solution: "Los niños jugaron en el parque todo el día.", hint: "'Целия ден' = todo el día — muestra la duración" },
          ],
          tip: "❓ ¡Pregúntate: ¿Quién? ¿Qué? ¿Cuándo? ¿Dónde? ¿Por qué? después de cada párrafo!",
        },
      },
    },

    /* ── BULGARIAN LANGUAGE / WRITING ── */
    "bulgarian-language/writing": {
      en: {
        low: {
          title: "Writing in Bulgarian",
          explanation: "Writing in Bulgarian means forming sentences from ideas. Start with simple sentences: subject + verb + object. Remember Bulgarian word order. Use capital letters at the start and periods at the end.",
          examples: [
            { problem: "Write a simple sentence: 'I am happy.'", solution: "Аз съм щастлив/щастлива.", hint: "'Аз' = I, 'съм' = am, 'щастлив/а' = happy. Word order: subject-verb-adjective" },
            { problem: "Write: 'The cat drinks milk.'", solution: "Котката пие мляко.", hint: "'Котката' = the cat, 'пие' = drinks, 'мляко' = milk. Bulgarian uses definite article 'та'" },
            { problem: "Write: 'I play in the park.'", solution: "Аз играя в парка.", hint: "'Играя' = I play, 'в' = in, 'парка' = the park" },
          ],
          tip: "✍️ Write 3 simple sentences every day. Start with: 'Аз съм...', 'Мен нравя...', 'Днес...'",
        },
        high: {
          title: "Writing in Bulgarian",
          explanation: "Write longer sentences and combine them with 'и' (and), 'защото' (because), 'но' (but). Focus on using correct verb forms and adjective agreement. Check spelling and punctuation.",
          examples: [
            { problem: "Write a compound sentence: 'I am happy and I play.'", solution: "Аз съм щастлив/а и играя.", hint: "'И' = and — joins two ideas. Keep verb tense consistent" },
            { problem: "Write: 'The girl reads because she likes books.'", solution: "Момичето чета защото й харесват книгите.", hint: "'Защото' = because — explains why. 'Харесват' agrees with 'книгите' (plural)" },
            { problem: "Write: 'The day is beautiful but cold.'", solution: "Денят е прекрасен но студен.", hint: "'Но' = but — shows contrast. Both adjectives agree with 'денят' (masculine)" },
          ],
          tip: "📝 Write a short paragraph (5 sentences) about your favorite animal or day!",
        },
      },
      bg: {
        low: {
          title: "Пишем изречения",
          explanation: "Изречението изразява пълна мисъл. Започва с главна буква и завършва с точка. Прости изречения: Кой? + Какво прави?",
          examples: [
            { problem: "Напиши изречение за коте.", solution: "Котето играе с топка.", hint: "Кой? → котето. Какво прави? → играе. Добави подробност — с какво?" },
            { problem: "Напиши изречение за слънцето.", solution: "Слънцето грее ярко.", hint: "Кой/Какво? → слънцето. Какво прави? → грее. Как? → ярко." },
            { problem: "Напиши изречение за себе си.", solution: "Аз обичам да чета книги.", hint: "Кой? → аз. Какво правя? → обичам. Какво? → да чета книги." },
          ],
          tip: "✍️ Всяко изречение — главна буква в началото и точка накрая!",
        },
        high: {
          title: "Пишем изречения",
          explanation: "Свързвай изречения с думите: 'и', 'но', 'защото', 'когато'. Съгласувай прилагателните с думата, която описват. Проверявай правописа!",
          examples: [
            { problem: "Свържи две изречения с 'и': 'Учех. Получих отличен.'", solution: "Учех много и получих отличен.", hint: "'И' свързва две действия в едно изречение." },
            { problem: "Свържи с 'защото': 'Харесвам четенето. Научавам нови думи.'", solution: "Харесвам четенето, защото научавам нови думи.", hint: "'Защото' обяснява причината — защо харесваш четенето?" },
            { problem: "Свържи с 'но': 'Денят е хубав. Вали.'", solution: "Денят е хубав, но вали.", hint: "'Но' показва противоположност — нещо хубаво и нещо лошо." },
          ],
          tip: "📝 Напиши 5 изречения за твоя любим ден — свърже ги с 'и', 'но', 'защото'!",
        },
      },
      es: {
        low: {
          title: "Escritura en búlgaro",
          explanation: "Escribir en búlgaro significa formar oraciones a partir de ideas. Comienza con oraciones simples: sujeto + verbo + objeto. Recuerda el orden de palabras búlgaro. Usa letras mayúsculas al inicio y puntos al final.",
          examples: [
            { problem: "Escribe una oración simple: 'I am happy.'", solution: "Аз съм щастлив/щастлива.", hint: "'Аз' = yo, 'съм' = soy, 'щастлив' = feliz. Orden: sujeto-verbo-adjetivo" },
            { problem: "Escribe: 'The cat drinks milk.'", solution: "Котката пие мляко.", hint: "'Котката' = el gato, 'пие' = bebe, 'мляко' = leche. El búlgaro usa artículo 'та'" },
            { problem: "Escribe: 'I play in the park.'", solution: "Аз играя в парка.", hint: "'Играя' = juego, 'в' = en, 'парка' = el parque" },
          ],
          tip: "✍️ ¡Escribe 3 oraciones simples cada día! Comienza con: 'Аз съм...', 'На мен харесва...', 'Днес...'",
        },
        high: {
          title: "Escritura en búlgaro",
          explanation: "Escribe oraciones más largas y combínalas con 'и' (y), 'защото' (porque), 'но' (pero). Enfócate en usar formas verbales correctas y acuerdo de adjetivos. Verifica ortografía y puntuación.",
          examples: [
            { problem: "Escribe una oración compuesta: 'I am happy and I play.'", solution: "Аз съм щастлив/а и играя.", hint: "'И' = y — une dos ideas. Mantén el tiempo verbal consistente" },
            { problem: "Escribe: 'The girl reads because she likes books.'", solution: "Момичето чета защото й харесват книгите.", hint: "'Защото' = porque — explica por qué. 'Харесват' concuerda con 'книгите' (plural)" },
            { problem: "Escribe: 'The day is beautiful but cold.'", solution: "Денят е прекрасен но студен.", hint: "'Но' = pero — muestra contraste. Ambos adjetivos concuerdan con 'денят'" },
          ],
          tip: "📝 ¡Escribe un párrafo corto (5 oraciones) sobre tu animal o día favorito!",
        },
      },
    },

    /* ── BULGARIAN LANGUAGE / GRAMMAR ── */
    "bulgarian-language/grammar": {
      en: {
        low: {
          title: "Grammar Basics",
          explanation: "Bulgarian grammar includes nouns (people, places, things), verbs (actions), and adjectives (descriptions). Every noun has a gender: masculine, feminine, or neuter. Articles change based on gender.",
          examples: [
            { problem: "Identify the noun: 'Момче playing.'", solution: "'Момче' = noun (boy). Gender: neuter (doesn't change in nominative)", hint: "Nouns name people, places, or things. This is a boy." },
            { problem: "Identify the verb: 'Момче ЧЕТЕ.'", solution: "'Чете' = verb (reads). It's an action word.", hint: "Verbs show what someone does. Reading is an action." },
            { problem: "Identify the adjective: 'ПРЕКРАСЕН ден'", solution: "'Прекрасен' = adjective (beautiful). It describes the noun 'ден' (day).", hint: "Adjectives describe nouns. Beautiful describes the day." },
          ],
          tip: "🔤 Parts of speech: Nouns (people/places/things), Verbs (actions), Adjectives (descriptions)",
        },
        high: {
          title: "Grammar Basics",
          explanation: "Learn about gender agreement (masculine, feminine, neuter), case endings, and verb conjugation. Bulgarian has three verb tenses: present, past, future. Adjectives must agree with their nouns.",
          examples: [
            { problem: "Make agreement: 'ПРЕКРАСЕН ден' (beautiful day, masculine)", solution: "'Прекрасна жена' (beautiful woman, feminine). Gender changes the adjective form.", hint: "Adjectives agree with noun gender: -ен/-на/-но" },
            { problem: "Conjugate: 'Аз ИГРАЯ' (I play)", solution: "'Той ИГРАЕ' (He plays). Different subject = different verb form.", hint: "Present tense: -ам/-аш/-а/-ем/-ете/-ят" },
            { problem: "Form past: 'Аз чета' (I read, present)", solution: "'Аз четох' (I read, past). Add suffix -х for past.", hint: "Past tense often adds -х or -л to the root" },
          ],
          tip: "📚 Key rule: Adjectives must AGREE with nouns in gender, number, and case!",
        },
      },
      bg: {
        low: {
          title: "Основна граматика",
          explanation: "Българската граматика включва съществителни (хора, места, неща), глаголи (действия) и прилагателни (описания). Всяко съществително има род: мъжки, женски или среден. Артиклите се променят в зависимост от рода.",
          examples: [
            { problem: "Идентифицирай съществително: 'Момче ЖИВЕЕ.'", solution: "'Момче' = съществително (дете). Род: среден (не се променя в именителен падеж)", hint: "Съществителни означават хора, места или неща. Това е дете." },
            { problem: "Идентифицирай глагол: 'Момче ЧЕТЕ.'", solution: "'Чете' = глагол (чита). То е действие.", hint: "Глаголите показват какво прави някой. Четенето е действие." },
            { problem: "Идентифицирай прилагателно: 'ПРЕКРАСЕН ден'", solution: "'Прекрасен' = прилагателно (хубав). Описва съществително 'ден'.", hint: "Прилагателни описват съществителни. Хубав описва денят." },
          ],
          tip: "🔤 Части на реч: Съществителни (хора/места/неща), Глаголи (действия), Прилагателни (описания)",
        },
        high: {
          title: "Основна граматика",
          explanation: "Научи се на съгласуване по род (мъжки, женски, среден), падежни окончания и спрежение на глаголи. Българският има три време: настояще, минало, бъдеще. Прилагателните трябва да се съгласуват със съществителните.",
          examples: [
            { problem: "Направи съгласуване: 'ПРЕКРАСЕН ден' (мъжки род)", solution: "'Прекрасна жена' (женски род). Род променя формата на прилагателното.", hint: "Прилагателни се съгласуват по род: -ен/-на/-но" },
            { problem: "Спрегни: 'Аз ИГРАЯ' (правя се, настояще)", solution: "'Той ИГРАЕ' (той прави се). Различен подлог = различна форма на глагол.", hint: "Настояще: -ам/-аш/-а/-ем/-ете/-ят" },
            { problem: "Образуй минало: 'Аз чета' (четя, настояще)", solution: "'Аз четох' (четях, минало). Добави наставка -х за минало.", hint: "Минало често добавя -х или -л към корена" },
          ],
          tip: "📚 Ключово правило: Прилагателни трябва да се СЪГЛАСУВАТ със съществителни по род, число и падеж!",
        },
      },
      es: {
        low: {
          title: "Gramática básica",
          explanation: "La gramática búlgara incluye sustantivos (personas, lugares, cosas), verbos (acciones) y adjetivos (descripciones). Todo sustantivo tiene un género: masculino, femenino o neutro. Los artículos cambian según el género.",
          examples: [
            { problem: "Identifica el sustantivo: 'Момче VIVE.'", solution: "'Момче' = sustantivo (niño). Género: neutro (no cambia en nominativo)", hint: "Los sustantivos nombran personas, lugares o cosas. Este es un niño." },
            { problem: "Identifica el verbo: 'Момче ЧЕТЕ.'", solution: "'Чете' = verbo (lee). Es una palabra de acción.", hint: "Los verbos muestran lo que alguien hace. Leer es una acción." },
            { problem: "Identifica el adjetivo: 'ПРЕКРАСЕН ден'", solution: "'Прекрасен' = adjetivo (hermoso). Describe el sustantivo 'ден' (día).", hint: "Los adjetivos describen sustantivos. Hermoso describe el día." },
          ],
          tip: "🔤 Partes del habla: Sustantivos (personas/lugares/cosas), Verbos (acciones), Adjetivos (descripciones)",
        },
        high: {
          title: "Gramática básica",
          explanation: "Aprende sobre la concordancia de género (masculino, femenino, neutro), terminaciones de caso y conjugación de verbos. El búlgaro tiene tres tiempos: presente, pasado, futuro. Los adjetivos deben concordar con sus sustantivos.",
          examples: [
            { problem: "Haz concordancia: 'ПРЕКРАСЕН ден' (día hermoso, masculino)", solution: "'Прекрасна жена' (mujer hermosa, femenino). El género cambia la forma del adjetivo.", hint: "Los adjetivos concuerdan con el género del sustantivo: -ен/-на/-но" },
            { problem: "Conjuga: 'Аз ИГРАЯ' (Juego, presente)", solution: "'Той ИГРАЕ' (Él juega). Sujeto diferente = forma verbal diferente.", hint: "Presente: -ам/-аш/-а/-ем/-ете/-ят" },
            { problem: "Forma pasado: 'Аз чета' (leo, presente)", solution: "'Аз четох' (leí, pasado). Añade -х para pasado.", hint: "El pasado a menudo añade -х o -л a la raíz" },
          ],
          tip: "📚 ¡Regla clave: Los adjetivos deben CONCORDAR con sustantivos en género, número y caso!",
        },
      },
    },

    /* ── READING LITERATURE / STORIES ── */
    "reading-literature/stories": {
      en: {
        low: {
          title: "Stories",
          explanation: "A story has characters (people), a setting (place and time), and a plot (what happens). Good stories have a beginning, middle, and end. They teach lessons and make us feel things.",
          examples: [
            { problem: "Identify the character: 'Little Red Riding Hood'", solution: "Character: Little Red Riding Hood (a girl). Setting: Forest. Plot: She visits grandmother.", hint: "Characters are the people or animals in the story." },
            { problem: "Identify the setting: 'The three little pigs built houses'", solution: "Setting: Outside/field where pigs built homes. When: Once upon a time.", hint: "Setting tells WHERE and WHEN the story happens." },
            { problem: "Identify the plot: 'Goldilocks enters a house, tries porridge, and escapes'", solution: "Plot: Goldilocks explores, eats, sleeps, then flees. Beginning→Middle→End.", hint: "Plot is the SEQUENCE of events — what happens first, then, finally." },
          ],
          tip: "📖 Remember: Character (WHO), Setting (WHERE/WHEN), Plot (WHAT HAPPENS)",
        },
        high: {
          title: "Stories",
          explanation: "Analyze story elements: conflict (problem), resolution (solution), and theme (lesson). Compare characters and settings across different stories. Predict what happens based on clues.",
          examples: [
            { problem: "What's the conflict in 'Cinderella'?", solution: "Conflict: Poor Cinderella is mistreated by her stepfamily. She wants to go to the ball.", hint: "Conflict is the PROBLEM the character faces." },
            { problem: "What's the theme in 'The Boy Who Cried Wolf'?", solution: "Theme: Honesty matters; lying loses trust. Lesson learned.", hint: "Theme is the MAIN LESSON or message of the story." },
            { problem: "Why does the wolf come at the end of 'Cry Wolf'?", solution: "BECAUSE the boy lied before, no one believed him when danger was real.", hint: "Connect events: Earlier lies → No trust → Danger → Consequence" },
          ],
          tip: "💡 Stories teach lessons! Ask: What is the character learning? What should I learn?",
        },
      },
      bg: {
        low: {
          title: "Разкази",
          explanation: "Един разказ има герои (хора), обстановка (място и време) и сюжет (какво се случава). Добрите разкази имат начало, средина и край. Те учат уроци и ни карат да чувстваме.",
          examples: [
            { problem: "Идентифицирай героя: 'Червената шапчица'", solution: "Герой: Червената шапчица (момиче). Място: Гора. Сюжет: Нейната баба живее в гората.", hint: "Героите са хора или животни в разказа." },
            { problem: "Идентифицирай обстановката: 'Трите малки прасенца построиха къщи'", solution: "Място: На поле, където прасенцата строят. Време: Веднъж давно.", hint: "Обстановката казва КЪД и КОГА се случва разказа." },
            { problem: "Идентифицирай сюжета: 'Злато влезе, опита каша, спа и избяга'", solution: "Сюжет: Злато изследва, яде, спи, слиза. Начало→Средина→Край.", hint: "Сюжетът е ПОСЛЕДОВАТЕЛНОСТТА на събитията — какво се случва първо, после, накрая." },
          ],
          tip: "📖 Помни: Герой (КОЙ), Обстановка (КЪД/КОГА), Сюжет (КАКВО)",
        },
        high: {
          title: "Разкази",
          explanation: "Анализирай елементи на разказа: конфликт (проблем), разрешение (решение) и тема (урок). Сравнявай героите и местата в различни разкази. Прави прогнози какво ще се случи на основата на улики.",
          examples: [
            { problem: "Какъв е конфликтът в 'Пепеляшка'?", solution: "Конфликт: Бедна Пепеляшка е зле третирана от мачехата. Иска да отиде на бала.", hint: "Конфликтът е ПРОБЛЕМЪТ, с който се сблъсква героя." },
            { problem: "Какво е темата в 'Момчето, което креща вълк'?", solution: "Тема: Честността е важна; лъжата загубва доверието. Урок научен.", hint: "Темата е ГЛАВНИЯТ УРОК или съобщение на разказа." },
            { problem: "Защо дохожда вълк в края на 'Крещи вълк'?", solution: "ЗАЩОТО момчето лъжа преди, никой не му вярва когато опасността е реална.", hint: "Свързуй събитията: Преди лъжи → Няма доверие → Опасност → Последица" },
          ],
          tip: "💡 Разказите учат уроци! Попитай себе си: Какво научава героят? Какво да науча аз?",
        },
      },
      es: {
        low: {
          title: "Historias",
          explanation: "Una historia tiene personajes (personas), un escenario (lugar y tiempo) y una trama (qué sucede). Las buenas historias tienen un comienzo, un medio y un final. Enseñan lecciones y nos hacen sentir cosas.",
          examples: [
            { problem: "Identifica al personaje: 'Caperucita Roja'", solution: "Personaje: Caperucita Roja (una niña). Lugar: Bosque. Trama: Visita a su abuela.", hint: "Los personajes son las personas o animales en la historia." },
            { problem: "Identifica el escenario: 'Los tres cerditos construyeron casas'", solution: "Lugar: Campo/exterior donde los cerditos construyen. Cuándo: Érase una vez.", hint: "El escenario dice DÓNDE y CUÁNDO sucede la historia." },
            { problem: "Identifica la trama: 'Ricitos de Oro entra, prueba la papilla, duerme'", solution: "Trama: Ricitos explora, come, duerme, huye. Comienzo→Medio→Final.", hint: "La trama es la SECUENCIA de eventos — qué pasa primero, luego, finalmente." },
          ],
          tip: "📖 Recuerda: Personaje (QUIÉN), Escenario (DÓNDE/CUÁNDO), Trama (QUÉ OCURRE)",
        },
        high: {
          title: "Historias",
          explanation: "Analiza elementos de la historia: conflicto (problema), resolución (solución) y tema (lección). Compara personajes y escenarios en diferentes historias. Predice lo que sucede según las pistas.",
          examples: [
            { problem: "¿Cuál es el conflicto en 'Cenicienta'?", solution: "Conflicto: Cenicienta pobre es maltratada por su madrastra. Quiere ir al baile.", hint: "El conflicto es el PROBLEMA que enfrenta el personaje." },
            { problem: "¿Cuál es el tema en 'El niño que gritó lobo'?", solution: "Tema: La honestidad importa; mentir pierde confianza. Lección aprendida.", hint: "El tema es la LECCIÓN PRINCIPAL o mensaje de la historia." },
            { problem: "¿Por qué viene el lobo al final de 'Gritó lobo'?", solution: "PORQUE el niño mintió antes, nadie le creyó cuando el peligro era real.", hint: "Conecta eventos: Mentiras anteriores → Sin confianza → Peligro → Consecuencia" },
          ],
          tip: "💡 ¡Las historias enseñan lecciones! Pregúntate: ¿Qué aprende el personaje? ¿Qué debo aprender?",
        },
      },
    },

    /* ── READING LITERATURE / COMPREHENSION ── */
    "reading-literature/comprehension": {
      en: {
        low: {
          title: "Reading Comprehension",
          explanation: "Comprehension means understanding what you read. Ask questions WHILE reading: Who? What? Where? When? Why? Reread sentences that confuse you. Draw pictures of what happens.",
          examples: [
            { problem: "Read: 'The cat sat on the mat.'  Question: Where did the cat sit?", solution: "Answer: On the mat.", hint: "Look for WHERE: 'on the mat' tells the location." },
            { problem: "Read: 'Maya ate an apple before school.' Question: When did Maya eat?", solution: "Answer: Before school.", hint: "Look for WHEN: 'before school' tells the time." },
            { problem: "Read: 'Tom ran because he was late.' Question: Why did Tom run?", solution: "Answer: Because he was late.", hint: "Look for WHY: 'because' explains the reason." },
          ],
          tip: "❓ Ask yourself these questions: Who? What? Where? When? Why? How?",
        },
        high: {
          title: "Reading Comprehension",
          explanation: "Deep comprehension includes finding the main idea, supporting details, and author's purpose. Infer (figure out) information not directly stated. Compare and contrast characters and events.",
          examples: [
            { problem: "Text: 'Birds have wings. Some birds fly. Some birds swim.' Main idea?", solution: "Main idea: Not all birds fly; different birds have different abilities.", hint: "Main idea is the BIGGEST, most important point." },
            { problem: "Text: 'Jack was sad. His dog ran away. He looked everywhere.' Inference?", solution: "Inference: Jack loves his dog and misses him.", hint: "Inference = reading between the lines. Not stated directly, but strongly suggested." },
            { problem: "Compare: Tiger swims well. Lion hunts on land. Similarity?", solution: "Both are big cats that are good hunters.", hint: "Find what's the SAME (similarity) and DIFFERENT (contrast)." },
          ],
          tip: "🧠 Deep reading: Find the main idea, understand reasons, and infer hidden meaning!",
        },
      },
      bg: {
        low: {
          title: "Разбиране при четене",
          explanation: "Разбирането означава да разбереш какво четеш. Задавай въпроси ДОКхатом четеш: Кой? Какво? Къде? Кога? Защо? Преread изречения, които те объркват. Рисувай картинки на това, което се случва.",
          examples: [
            { problem: "Прочети: 'Котката седи на мат.' Въпрос: Къде седи котката?", solution: "Отговор: На мат.", hint: "Потърси КЪД: 'на мат' казва местоположението." },
            { problem: "Прочети: 'Мая яде ябълка преди училище.' Въпрос: Кога яде Мая?", solution: "Отговор: Преди училище.", hint: "Потърси КОГА: 'преди училище' казва времето." },
            { problem: "Прочети: 'Том тича защото закъснява.' Въпрос: Защо тича Том?", solution: "Отговор: Защото закъснява.", hint: "Потърси ЗАЩО: 'защото' обяснява причината." },
          ],
          tip: "❓ Попитай себе си: Кой? Какво? Къде? Кога? Защо? Как?",
        },
        high: {
          title: "Разбиране при четене",
          explanation: "Дълбокото разбиране включва намиране на главната идея, поддържащи детайли и цел на автора. Интуирай (разбери) информация, която не е пряко казана. Сравнявай и противопоставяй героите и събитията.",
          examples: [
            { problem: "Текст: 'Птиците имат крила. Някои птици летят. Някои птици плуват.' Главна идея?", solution: "Главна идея: Не всички птици летят; различни птици имат различни способности.", hint: "Главната идея е НАЙ-ГОЛЯМАТА, най-важна точка." },
            { problem: "Текст: 'Джак е тъжен. Неговото куче избяга. Той ги потърсихсър.' Интуиция?", solution: "Интуиция: Джак обича своето куче и го пропуска.", hint: "Интуиция = четене между редовете. Не е казано пряко, но силно намекнато." },
            { problem: "Сравни: Тигър плува добре. Лъв ловува на суша. Сходство?", solution: "И двамата са големи котки, които са добри ловци.", hint: "Намери какво е СЪЩОТО (сходство) и РАЗЛИЧНО (противопоставяние)." },
          ],
          tip: "🧠 Дълбоко четене: Намери главната идея, разбери причините и интуирай скритото значение!",
        },
      },
      es: {
        low: {
          title: "Comprensión de lectura",
          explanation: "Comprensión significa entender lo que lees. Haz preguntas MIENTRAS lees: ¿Quién? ¿Qué? ¿Dónde? ¿Cuándo? ¿Por qué? Relee oraciones que te confundan. Dibuja lo que sucede.",
          examples: [
            { problem: "Lee: 'El gato se sentó en la alfombra.' Pregunta: ¿Dónde se sentó el gato?", solution: "Respuesta: En la alfombra.", hint: "Busca DÓNDE: 'en la alfombra' dice la ubicación." },
            { problem: "Lee: 'Maya comió una manzana antes de la escuela.' Pregunta: ¿Cuándo comió Maya?", solution: "Respuesta: Antes de la escuela.", hint: "Busca CUÁNDO: 'antes de la escuela' dice la hora." },
            { problem: "Lee: 'Tom corrió porque llegaba tarde.' Pregunta: ¿Por qué corrió Tom?", solution: "Respuesta: Porque llegaba tarde.", hint: "Busca POR QUÉ: 'porque' explica la razón." },
          ],
          tip: "❓ Pregúntate: ¿Quién? ¿Qué? ¿Dónde? ¿Cuándo? ¿Por qué? ¿Cómo?",
        },
        high: {
          title: "Comprensión de lectura",
          explanation: "La comprensión profunda incluye encontrar la idea principal, detalles de apoyo y propósito del autor. Infiere (deduce) información no declarada directamente. Compara y contrasta personajes y eventos.",
          examples: [
            { problem: "Texto: 'Los pájaros tienen alas. Algunos pájaros vuelan. Algunos pájaros nadan.' ¿Idea principal?", solution: "Idea principal: No todos los pájaros vuelan; diferentes pájaros tienen diferentes habilidades.", hint: "La idea principal es el punto MÁS GRANDE y más importante." },
            { problem: "Texto: 'Jack estaba triste. Su perro desapareció. Buscó en todas partes.' ¿Inferencia?", solution: "Inferencia: Jack ama a su perro y lo extraña.", hint: "Inferencia = leer entre líneas. No se dice directamente, pero se sugiere fuertemente." },
            { problem: "Compara: El tigre nada bien. El león caza en tierra. ¿Similitud?", solution: "Ambos son felinos grandes que son buenos cazadores.", hint: "Encuentra qué es IGUAL (similitud) y DIFERENTE (contraste)." },
          ],
          tip: "🧠 ¡Lectura profunda: encuentra la idea principal, entiende razones e infiere significados ocultos!",
        },
      },
    },

    /* ── LOGIC THINKING / PUZZLES ── */
    "logic-thinking/puzzles": {
      en: {
        low: {
          title: "Puzzles & Logic",
          explanation: "A puzzle is a problem that needs clever thinking to solve. Look at all the clues, think carefully, and you can find the answer!",
          examples: [
            { problem: "I have 2 legs in the morning, 4 legs at noon, and 3 legs in the evening. What am I?", solution: "A person (baby crawls, adult walks, elderly uses a cane)", hint: "Think about stages of life, not real creatures!" },
            { problem: "Which is heavier: 1 kg of feathers or 1 kg of iron?", solution: "They weigh the same — both are 1 kg!", hint: "Read carefully — the trick is in the question." },
            { problem: "There are 3 apples. You take 2. How many do YOU have?", solution: "2 (you took 2 apples)", hint: "The question asks what YOU have, not what's left." },
          ],
          tip: "🧩 Read the puzzle twice. The trick is usually in the wording!",
        },
        high: {
          title: "Logic Puzzles",
          explanation: "Logic puzzles use if-then reasoning. Read every clue, eliminate wrong answers, and use what you know to reach the right conclusion.",
          examples: [
            { problem: "All cats are animals. Whiskers is a cat. What is Whiskers?", solution: "Whiskers is an animal.", hint: "If A=B and C=A, then C=B. This is logical deduction!" },
            { problem: "Anna is older than Ben. Ben is older than Carla. Who is youngest?", solution: "Carla is youngest.", hint: "Build a chain: Anna > Ben > Carla." },
            { problem: "A man has 3 daughters. Each daughter has 1 brother. How many children?", solution: "4 children (3 daughters + 1 son)", hint: "All daughters share the same brother." },
          ],
          tip: "🔎 Draw a diagram or list clues in order — it makes complex logic much easier!",
        },
      },
      bg: {
        low: {
          title: "Пъзели и логика",
          explanation: "Пъзелът е задача, която изисква умно мислене. Погледни всички улики, мисли внимателно и ще намериш отговора!",
          examples: [
            { problem: "Сутринта имам 2 крака, на обед — 4, вечер — 3. Какво съм?", solution: "Човек (бебе пълзи, възрастен ходи, старец с бастун)", hint: "Мисли за етапите на живота, не за реални животни!" },
            { problem: "Кое е по-тежко: 1 кг перушина или 1 кг желязо?", solution: "Те тежат еднакво — и двете са 1 кг!", hint: "Прочети внимателно — хитростта е в въпроса." },
            { problem: "Има 3 ябълки. Вземаш 2. Колко ТИ имаш?", solution: "2 (ти взе 2 ябълки)", hint: "Въпросът е какво ТИ имаш, не какво е останало." },
          ],
          tip: "🧩 Прочети пъзела два пъти. Хитростта е обикновено в думите!",
        },
        high: {
          title: "Логически задачи",
          explanation: "Логическите задачи използват разсъждение 'ако-тогава'. Прочети всяка улика, изключи грешните отговори и стигни до верния извод.",
          examples: [
            { problem: "Всички котки са животни. Мишка е котка. Какво е Мишка?", solution: "Мишка е животно.", hint: "Ако А=Б и В=А, тогава В=Б. Това е логическо заключение!" },
            { problem: "Анна е по-голяма от Бен. Бен е по-голям от Карла. Кой е най-малък?", solution: "Карла е най-малката.", hint: "Построй верига: Анна > Бен > Карла." },
            { problem: "Мъж има 3 дъщери. Всяка дъщеря има 1 брат. Колко деца има?", solution: "4 деца (3 дъщери + 1 син)", hint: "Всички дъщери споделят един и същ брат." },
          ],
          tip: "🔎 Нарисувай схема или изпиши уликите по ред — така логиката става много по-лесна!",
        },
      },
      es: {
        low: {
          title: "Puzles y lógica",
          explanation: "Un puzle es un problema que necesita pensamiento inteligente para resolverse. ¡Mira todas las pistas, piensa con cuidado y encontrarás la respuesta!",
          examples: [
            { problem: "Por la mañana tengo 2 patas, al mediodía 4 y por la noche 3. ¿Qué soy?", solution: "Una persona (bebé gatea, adulto camina, anciano usa bastón)", hint: "¡Piensa en las etapas de la vida, no en criaturas reales!" },
            { problem: "¿Qué pesa más: 1 kg de plumas o 1 kg de hierro?", solution: "¡Pesan lo mismo — ambos son 1 kg!", hint: "Lee con cuidado — el truco está en la pregunta." },
            { problem: "Hay 3 manzanas. Tomas 2. ¿Cuántas TIENES TÚ?", solution: "2 (tú tomaste 2 manzanas)", hint: "La pregunta es cuántas tienes TÚ, no cuántas quedan." },
          ],
          tip: "🧩 ¡Lee el puzle dos veces. El truco suele estar en la redacción!",
        },
        high: {
          title: "Puzles lógicos",
          explanation: "Los puzles lógicos usan el razonamiento si-entonces. Lee cada pista, elimina las respuestas incorrectas y usa lo que sabes para llegar a la conclusión correcta.",
          examples: [
            { problem: "Todos los gatos son animales. Bigotes es un gato. ¿Qué es Bigotes?", solution: "Bigotes es un animal.", hint: "Si A=B y C=A, entonces C=B. ¡Esto es deducción lógica!" },
            { problem: "Ana es mayor que Ben. Ben es mayor que Carla. ¿Quién es el más joven?", solution: "Carla es la más joven.", hint: "Construye una cadena: Ana > Ben > Carla." },
            { problem: "Un hombre tiene 3 hijas. Cada hija tiene 1 hermano. ¿Cuántos hijos tiene?", solution: "4 hijos (3 hijas + 1 hijo)", hint: "Todas las hijas comparten el mismo hermano." },
          ],
          tip: "🔎 ¡Dibuja un diagrama o lista las pistas en orden — hace que la lógica compleja sea mucho más fácil!",
        },
      },
    },

    /* ── NATURE SCIENCE / ANIMALS ── */
    "nature-science/animals": {
      en: {
        low: {
          title: "Animals",
          explanation: "Animals are living things that can move on their own. They eat food, grow, breathe, and have babies. Animals can live on land, in water, or both!",
          examples: [
            { problem: "Name 3 animals that live in the sea.", solution: "Fish, dolphin, whale (many correct answers)", hint: "Think about creatures that swim in the ocean." },
            { problem: "What do herbivores eat?", solution: "Only plants (grass, leaves, fruit)", hint: "Herb = plant. Herbivore = plant eater!" },
            { problem: "Name a mammal that lives in water.", solution: "Dolphin, whale, seal (any are correct)", hint: "Mammals breathe air even if they live in water." },
          ],
          tip: "🐾 Animals are grouped: mammals, birds, fish, reptiles, amphibians, insects!",
        },
        high: {
          title: "Animal Classification",
          explanation: "Scientists classify animals into groups: vertebrates (with a backbone) and invertebrates (without). Vertebrates include mammals, birds, fish, reptiles, and amphibians. Each group has special features.",
          examples: [
            { problem: "What makes mammals different from other animals?", solution: "Mammals have fur/hair, are warm-blooded, and feed young with milk.", hint: "Key mammal features: warm-blooded, fur, live birth, milk for young." },
            { problem: "What is the difference between a frog (amphibian) and a lizard (reptile)?", solution: "Frogs live both in water and on land; lizards are fully land animals with scales.", hint: "Amphi = both sides (water and land)." },
            { problem: "Give an example of an invertebrate.", solution: "Insects, spiders, worms, jellyfish (no backbone)", hint: "Invert = turned inward; invertebrates have no backbone." },
          ],
          tip: "🔬 The animal kingdom is divided into 35+ phyla — vertebrates are just one small group!",
        },
      },
      bg: {
        low: {
          title: "Животни",
          explanation: "Животните са живи същества, които могат да се движат сами. Те се хранят, растат, дишат и имат малки. Животните могат да живеят на сушата, във водата или и на двете!",
          examples: [
            { problem: "Назови 3 животни, които живеят в морето.", solution: "Риба, делфин, кит (много верни отговори)", hint: "Мисли за същества, които плуват в океана." },
            { problem: "Какво ядат тревопасните?", solution: "Само растения (трева, листа, плодове)", hint: "Тревопасни = ядат трева и растения!" },
            { problem: "Назови бозайник, който живее във водата.", solution: "Делфин, кит, тюлен (всеки е верен)", hint: "Бозайниците дишат въздух, дори ако живеят във вода." },
          ],
          tip: "🐾 Животните се делят на: бозайници, птици, риби, влечуги, земноводни, насекоми!",
        },
        high: {
          title: "Класификация на животните",
          explanation: "Учените класифицират животните на групи: гръбначни (с гръбначен стълб) и безгръбначни (без). Гръбначните включват бозайници, птици, риби, влечуги и земноводни. Всяка група има специални белези.",
          examples: [
            { problem: "Какво отличава бозайниците от другите животни?", solution: "Бозайниците имат козина, са топлокръвни и кърмят малките си.", hint: "Ключови белези: топлокръвни, козина, живо раждане, кърмене." },
            { problem: "Каква е разликата между жаба (земноводно) и гущер (влечуго)?", solution: "Жабите живеят и във вода, и на суша; гущерите са сухоземни с люспи.", hint: "Земноводни = живеят и в двете среди." },
            { problem: "Дай пример за безгръбначно животно.", solution: "Насекоми, паяци, червеи, медузи (без гръбначен стълб)", hint: "Безгръбначни = нямат гръбначен стълб." },
          ],
          tip: "🔬 Животинското царство е разделено на 35+ типа — гръбначните са само малка група!",
        },
      },
      es: {
        low: {
          title: "Animales",
          explanation: "Los animales son seres vivos que pueden moverse solos. Comen, crecen, respiran y tienen crías. ¡Los animales pueden vivir en tierra, en el agua o en ambos!",
          examples: [
            { problem: "Nombra 3 animales que viven en el mar.", solution: "Pez, delfín, ballena (muchas respuestas correctas)", hint: "Piensa en criaturas que nadan en el océano." },
            { problem: "¿Qué comen los herbívoros?", solution: "Solo plantas (hierba, hojas, fruta)", hint: "Herbívoro = comedor de plantas (hierba)." },
            { problem: "Nombra un mamífero que viva en el agua.", solution: "Delfín, ballena, foca (cualquiera es correcto)", hint: "Los mamíferos respiran aire aunque vivan en el agua." },
          ],
          tip: "🐾 ¡Los animales se agrupan en: mamíferos, aves, peces, reptiles, anfibios, insectos!",
        },
        high: {
          title: "Clasificación de animales",
          explanation: "Los científicos clasifican los animales en grupos: vertebrados (con columna vertebral) e invertebrados (sin ella). Los vertebrados incluyen mamíferos, aves, peces, reptiles y anfibios. Cada grupo tiene características especiales.",
          examples: [
            { problem: "¿Qué distingue a los mamíferos de otros animales?", solution: "Los mamíferos tienen pelo/piel, son de sangre caliente y alimentan a sus crías con leche.", hint: "Características clave: sangre caliente, pelo, nacimiento vivo, leche para crías." },
            { problem: "¿Cuál es la diferencia entre una rana (anfibio) y un lagarto (reptil)?", solution: "Las ranas viven en agua y tierra; los lagartos son terrestres con escamas.", hint: "Anfibio = vive en ambos medios (agua y tierra)." },
            { problem: "Da un ejemplo de invertebrado.", solution: "Insectos, arañas, gusanos, medusas (sin columna vertebral)", hint: "Invertebrado = sin columna vertebral." },
          ],
          tip: "🔬 ¡El reino animal está dividido en más de 35 filos — los vertebrados son solo un pequeño grupo!",
        },
      },
    },

    /* ── NATURE SCIENCE / EARTH ── */
    "nature-science/earth": {
      en: {
        low: {
          title: "Our Earth",
          explanation: "Earth is our planet — the place where we all live. It has land, oceans, mountains, rivers, and sky. The Earth moves around the Sun, which gives us day and night and the seasons.",
          examples: [
            { problem: "What are the four seasons?", solution: "Spring, Summer, Autumn (Fall), Winter", hint: "Think about how the weather changes throughout the year." },
            { problem: "What covers most of Earth's surface?", solution: "Water (oceans cover about 71% of Earth)", hint: "Look at a globe — most of it is blue!" },
            { problem: "What gives us day and night?", solution: "Earth spinning (rotating) on its axis", hint: "When your side faces the Sun = day. Away from Sun = night." },
          ],
          tip: "🌍 Earth is the only planet we know of with liquid water and living things!",
        },
        high: {
          title: "Earth Science",
          explanation: "Earth is made of layers: crust, mantle, outer core, and inner core. The surface is shaped by tectonic plates, volcanoes, and erosion. Earth orbits the Sun in 365 days — one year.",
          examples: [
            { problem: "Name the four layers of the Earth from outside to centre.", solution: "Crust → Mantle → Outer core → Inner core", hint: "Remember: C-M-OC-IC or think of a hard-boiled egg (shell, white, yolk)." },
            { problem: "What causes earthquakes?", solution: "Movement of tectonic plates along fault lines", hint: "Tectonic plates are huge pieces of Earth's crust that move slowly." },
            { problem: "Why does Earth have seasons?", solution: "Because Earth is tilted on its axis as it orbits the Sun", hint: "When your hemisphere tilts toward the Sun = summer. Away = winter." },
          ],
          tip: "🌋 The rock cycle, water cycle, and carbon cycle are three key Earth systems — all interconnected!",
        },
      },
      bg: {
        low: {
          title: "Нашата Земя",
          explanation: "Земята е нашата планета — мястото, където всички живеем. Тя има суша, океани, планини, реки и небе. Земята се върти около Слънцето, което ни дава ден и нощ и сезоните.",
          examples: [
            { problem: "Кои са четирите сезона?", solution: "Пролет, Лято, Есен, Зима", hint: "Мисли как се сменя времето през годината." },
            { problem: "Какво покрива повечето от повърхността на Земята?", solution: "Вода (океаните покриват около 71% от Земята)", hint: "Погледни глобус — по-голямата му част е синя!" },
            { problem: "Какво ни дава ден и нощ?", solution: "Въртенето (ротацията) на Земята около оста й", hint: "Когато твоята страна е обърната към Слънцето = ден. Обратно = нощ." },
          ],
          tip: "🌍 Земята е единствената планета, за която знаем, че има течна вода и живи същества!",
        },
        high: {
          title: "Науката за Земята",
          explanation: "Земята е изградена от слоеве: земна кора, мантия, външно ядро и вътрешно ядро. Повърхността е оформена от тектонски плочи, вулкани и ерозия. Земята обикаля Слънцето за 365 дни — една година.",
          examples: [
            { problem: "Назови четирите слоя на Земята отвън към центъра.", solution: "Земна кора → Мантия → Външно ядро → Вътрешно ядро", hint: "Помни: К-М-ВЯ-ВЯ или мисли за сварено яйце (черупка, белтък, жълтък)." },
            { problem: "Какво предизвиква земетресенията?", solution: "Движението на тектонските плочи по разломи", hint: "Тектонските плочи са огромни парчета от земната кора, които се движат бавно." },
            { problem: "Защо Земята има сезони?", solution: "Защото Земята е наклонена на оста си, докато обикаля Слънцето", hint: "Когато твоят полукълб е наклонен към Слънцето = лято. Обратно = зима." },
          ],
          tip: "🌋 Цикълът на скалите, водният цикъл и въглеродният цикъл са три ключови земни системи — всички взаимосвързани!",
        },
      },
      es: {
        low: {
          title: "Nuestra Tierra",
          explanation: "La Tierra es nuestro planeta — el lugar donde todos vivimos. Tiene tierra, océanos, montañas, ríos y cielo. La Tierra se mueve alrededor del Sol, lo que nos da el día y la noche y las estaciones.",
          examples: [
            { problem: "¿Cuáles son las cuatro estaciones?", solution: "Primavera, Verano, Otoño, Invierno", hint: "Piensa en cómo cambia el tiempo durante el año." },
            { problem: "¿Qué cubre la mayor parte de la superficie de la Tierra?", solution: "Agua (los océanos cubren aproximadamente el 71% de la Tierra)", hint: "¡Mira un globo terráqueo — la mayor parte es azul!" },
            { problem: "¿Qué nos da el día y la noche?", solution: "La rotación de la Tierra sobre su eje", hint: "Cuando tu lado apunta al Sol = día. Lejos del Sol = noche." },
          ],
          tip: "🌍 ¡La Tierra es el único planeta que conocemos con agua líquida y seres vivos!",
        },
        high: {
          title: "Ciencias de la Tierra",
          explanation: "La Tierra está formada por capas: corteza, manto, núcleo externo y núcleo interno. La superficie está moldeada por placas tectónicas, volcanes y erosión. La Tierra orbita alrededor del Sol en 365 días — un año.",
          examples: [
            { problem: "Nombra las cuatro capas de la Tierra de afuera hacia el centro.", solution: "Corteza → Manto → Núcleo externo → Núcleo interno", hint: "Recuerda: C-M-NE-NI o piensa en un huevo duro (cáscara, clara, yema)." },
            { problem: "¿Qué causa los terremotos?", solution: "El movimiento de las placas tectónicas a lo largo de las fallas", hint: "Las placas tectónicas son enormes trozos de la corteza terrestre que se mueven lentamente." },
            { problem: "¿Por qué la Tierra tiene estaciones?", solution: "Porque la Tierra está inclinada en su eje mientras orbita alrededor del Sol", hint: "Cuando tu hemisferio se inclina hacia el Sol = verano. Lejos = invierno." },
          ],
          tip: "🌋 ¡El ciclo de las rocas, el ciclo del agua y el ciclo del carbono son tres sistemas terrestres clave — todos interconectados!",
        },
      },
    },

    /* ── ENGLISH LANGUAGE / SIMPLE SENTENCES ── */
    "english-language/simple-sentences": {
      en: {
        low: {
          title: "Simple Sentences",
          explanation: "A sentence is a group of words that makes a complete thought. Every sentence needs a subject (who/what) and a verb (action). It starts with a capital letter and ends with a full stop.",
          examples: [
            { problem: "Build a sentence: [dog] [runs]", solution: "The dog runs.", hint: "Subject + verb = simple sentence. Add 'The' at the start!" },
            { problem: "Is this a sentence? 'Big red ball.'", solution: "No — it has no verb (action word).", hint: "A sentence must have an action: 'The big red ball bounces.'" },
            { problem: "Fix the sentence: 'the cat is happy'", solution: "'The cat is happy.' (capital T, full stop)", hint: "Capital letter at start, punctuation at end!" },
          ],
          tip: "✍️ Subject + Verb + (Object) = a sentence! Example: 'Maria eats an apple.'",
        },
        high: {
          title: "Simple & Compound Sentences",
          explanation: "A simple sentence has one independent clause. A compound sentence joins two simple sentences with a conjunction (and, but, or, so). Complex sentences use subordinating conjunctions (because, although, when).",
          examples: [
            { problem: "Join into one sentence: 'I was tired.' + 'I went to bed early.'", solution: "I was tired, so I went to bed early.", hint: "Use 'so' (result) to join cause and effect." },
            { problem: "Identify the conjunction: 'She studied hard but still failed.'", solution: "Conjunction: 'but' (showing contrast)", hint: "Conjunctions join ideas: and (addition), but (contrast), or (choice), so (result)." },
            { problem: "Add a subordinate clause: 'I eat breakfast ___ I go to school.'", solution: "I eat breakfast before I go to school.", hint: "Subordinating conjunctions: because, before, after, although, when, if." },
          ],
          tip: "📝 Vary your sentences! Short sentences create impact. Longer sentences build detail and flow.",
        },
      },
      bg: {
        low: {
          title: "Прости изречения на английски",
          explanation: "Изречението е група думи, която изразява пълна мисъл. Всяко изречение се нуждае от подлог (кой/какво) и сказуемо (действие). Започва с главна буква и завършва с точка.",
          examples: [
            { problem: "Построй изречение: [dog] [runs]", solution: "The dog runs.", hint: "Подлог + сказуемо = просто изречение. Добави 'The' в началото!" },
            { problem: "Изречение ли е? 'Big red ball.'", solution: "Не — няма глагол (сказуемо).", hint: "Изречението трябва да има действие: 'The big red ball bounces.'" },
            { problem: "Поправи: 'the cat is happy'", solution: "'The cat is happy.' (главна Т, точка)", hint: "Главна буква в началото, пунктуация в края!" },
          ],
          tip: "✍️ Подлог + Сказуемо + (Допълнение) = изречение! Пример: 'Maria eats an apple.'",
        },
        high: {
          title: "Прости и съставни изречения",
          explanation: "Простото изречение има едно главно изречение. Съставното изречение съединява две прости с съюз (and, but, or, so). Сложните изречения използват подчинителни съюзи (because, although, when).",
          examples: [
            { problem: "Съедини в едно: 'I was tired.' + 'I went to bed early.'", solution: "I was tired, so I went to bed early.", hint: "Използвай 'so' (резултат) за причина и следствие." },
            { problem: "Намери съюза: 'She studied hard but still failed.'", solution: "Съюз: 'but' (контраст)", hint: "Съюзи: and (добавяне), but (контраст), or (избор), so (резултат)." },
            { problem: "Добави подчинено изречение: 'I eat breakfast ___ I go to school.'", solution: "I eat breakfast before I go to school.", hint: "Подчинителни съюзи: because, before, after, although, when, if." },
          ],
          tip: "📝 Редувай изреченията! Кратките изречения създават удар. По-дългите добавят детайл.",
        },
      },
      es: {
        low: {
          title: "Oraciones simples en inglés",
          explanation: "Una oración es un grupo de palabras que expresa un pensamiento completo. Cada oración necesita un sujeto (quién/qué) y un verbo (acción). Empieza con mayúscula y termina con punto.",
          examples: [
            { problem: "Construye una oración: [dog] [runs]", solution: "The dog runs.", hint: "Sujeto + verbo = oración simple. ¡Añade 'The' al principio!" },
            { problem: "¿Es una oración? 'Big red ball.'", solution: "No — no tiene verbo (palabra de acción).", hint: "Una oración debe tener acción: 'The big red ball bounces.'" },
            { problem: "Corrige: 'the cat is happy'", solution: "'The cat is happy.' (mayúscula T, punto final)", hint: "¡Mayúscula al inicio, puntuación al final!" },
          ],
          tip: "✍️ ¡Sujeto + Verbo + (Objeto) = oración! Ejemplo: 'Maria eats an apple.'",
        },
        high: {
          title: "Oraciones simples y compuestas",
          explanation: "Una oración simple tiene una cláusula independiente. Una oración compuesta une dos simples con una conjunción (and, but, or, so). Las oraciones complejas usan conjunciones subordinantes (because, although, when).",
          examples: [
            { problem: "Une en una sola: 'I was tired.' + 'I went to bed early.'", solution: "I was tired, so I went to bed early.", hint: "Usa 'so' (resultado) para unir causa y efecto." },
            { problem: "Identifica la conjunción: 'She studied hard but still failed.'", solution: "Conjunción: 'but' (contraste)", hint: "Conjunciones: and (adición), but (contraste), or (elección), so (resultado)." },
            { problem: "Añade una cláusula subordinada: 'I eat breakfast ___ I go to school.'", solution: "I eat breakfast before I go to school.", hint: "Conjunciones subordinantes: because, before, after, although, when, if." },
          ],
          tip: "📝 ¡Varía tus oraciones! Las cortas crean impacto. Las más largas añaden detalle y fluidez.",
        },
      },
    },
    /* ── MATHEMATICS / FRACTIONS ── */
    "mathematics/fractions": {
      en: {
        low: {
          title: "Fractions",
          explanation: "A fraction is a part of a whole. When we cut a pizza into 4 equal slices, each slice is one quarter (1/4). The bottom number (denominator) tells us how many equal parts the whole is cut into. The top number (numerator) tells us how many parts we have.",
          examples: [
            { problem: "A pizza is cut into 2 equal halves. You eat 1 piece. What fraction did you eat?", solution: "1/2 (one half)", hint: "Top number = parts you have. Bottom number = total equal parts." },
            { problem: "A chocolate bar has 4 equal squares. You eat 1. What fraction remains?", solution: "3/4 (three quarters)", hint: "4 total − 1 eaten = 3 remaining. 3 out of 4 → 3/4." },
            { problem: "Which is bigger: 1/2 or 1/4?", solution: "1/2 is bigger — halves are larger pieces than quarters.", hint: "The bigger the denominator, the smaller each piece." },
          ],
          tip: "🍕 Think of fractions as pizza slices — the denominator is how many slices the pizza was cut into!",
        },
        high: {
          title: "Fractions and Equivalents",
          explanation: "Fractions show parts of a whole. Equivalent fractions are different fractions that represent the same value: 1/2 = 2/4 = 4/8. To compare fractions, it helps to find a common denominator. You can also add and subtract fractions that share the same denominator.",
          examples: [
            { problem: "Are 2/4 and 1/2 equivalent?", solution: "Yes — 2/4 = 1/2 because 2 ÷ 2 = 1 and 4 ÷ 2 = 2.", hint: "Divide numerator and denominator by the same number to simplify." },
            { problem: "Add: 1/5 + 2/5 = ?", solution: "3/5 — add numerators, keep denominator: 1+2=3, denominator stays 5.", hint: "Only add numerators when denominators are the same!" },
            { problem: "Which is larger: 3/8 or 5/8?", solution: "5/8 — same denominator, compare numerators: 5 > 3.", hint: "Same denominator? The fraction with the larger numerator is bigger." },
          ],
          tip: "📐 Equivalent fractions: multiply or divide both numerator AND denominator by the same number.",
        },
      },
      bg: {
        low: {
          title: "Дроби",
          explanation: "Дробта е част от цяло. Когато разрежем пица на 4 равни части, всяка парче е една четвърт (1/4). Долното число (знаменател) казва на колко равни части е разделено цялото. Горното число (числител) казва колко части имаме.",
          examples: [
            { problem: "Пица е разрязана на 2 равни половини. Изяждаш 1 парче. Каква дроб изяде?", solution: "1/2 (една втора)", hint: "Горно число = части, които имаш. Долно число = общо равни части." },
            { problem: "Шоколад има 4 равни квадратчета. Изяждаш 1. Каква дроб остава?", solution: "3/4 (три четвърти)", hint: "4 общо − 1 изядено = 3 останало. 3 от 4 → 3/4." },
            { problem: "Кое е по-голямо: 1/2 или 1/4?", solution: "1/2 е по-голямо — половините са по-големи парчета от четвъртините.", hint: "Колкото по-голям е знаменателят, толкова по-малко е всяко парче." },
          ],
          tip: "🍕 Мисли за дробите като парчета пица — знаменателят показва на колко парчета е разрязана!",
        },
        high: {
          title: "Дроби и равностойни дроби",
          explanation: "Дробите показват части от цяло. Равностойните дроби са различни дроби с еднаква стойност: 1/2 = 2/4 = 4/8. За да сравним дроби, помага да намерим общ знаменател. Можем да събираме и изваждаме дроби с еднакъв знаменател.",
          examples: [
            { problem: "Равностойни ли са 2/4 и 1/2?", solution: "Да — 2/4 = 1/2, защото 2 ÷ 2 = 1 и 4 ÷ 2 = 2.", hint: "Раздели числителя и знаменателя на едно и също число, за да съкратиш." },
            { problem: "Събери: 1/5 + 2/5 = ?", solution: "3/5 — събери числителите, запази знаменателя: 1+2=3, знаменателят е 5.", hint: "Събирай само числителите, когато знаменателите са еднакви!" },
            { problem: "Кое е по-голямо: 3/8 или 5/8?", solution: "5/8 — еднакъв знаменател, сравни числителите: 5 > 3.", hint: "Еднакъв знаменател? Дробта с по-голям числител е по-голяма." },
          ],
          tip: "📐 Равностойни дроби: умножи или раздели ЕДНОВРЕМЕННО числителя И знаменателя на едно и също число.",
        },
      },
      es: {
        low: {
          title: "Fracciones",
          explanation: "Una fracción es una parte de un todo. Cuando cortamos una pizza en 4 partes iguales, cada trozo es un cuarto (1/4). El número de abajo (denominador) dice en cuántas partes iguales está dividido el todo. El número de arriba (numerador) dice cuántas partes tenemos.",
          examples: [
            { problem: "Una pizza se corta en 2 mitades iguales. Comes 1 trozo. ¿Qué fracción comiste?", solution: "1/2 (una mitad)", hint: "Número de arriba = partes que tienes. Número de abajo = total de partes iguales." },
            { problem: "Una tableta de chocolate tiene 4 cuadraditos iguales. Comes 1. ¿Qué fracción queda?", solution: "3/4 (tres cuartos)", hint: "4 total − 1 comido = 3 restante. 3 de 4 → 3/4." },
            { problem: "¿Cuál es mayor: 1/2 o 1/4?", solution: "1/2 es mayor — los medios son trozos más grandes que los cuartos.", hint: "Cuanto mayor es el denominador, más pequeño es cada trozo." },
          ],
          tip: "🍕 ¡Piensa en las fracciones como trozos de pizza — el denominador es en cuántos trozos se cortó!",
        },
        high: {
          title: "Fracciones equivalentes",
          explanation: "Las fracciones muestran partes de un todo. Las fracciones equivalentes son diferentes fracciones que representan el mismo valor: 1/2 = 2/4 = 4/8. Para comparar fracciones, ayuda encontrar un denominador común. También puedes sumar y restar fracciones con el mismo denominador.",
          examples: [
            { problem: "¿Son equivalentes 2/4 y 1/2?", solution: "Sí — 2/4 = 1/2 porque 2 ÷ 2 = 1 y 4 ÷ 2 = 2.", hint: "Divide numerador y denominador por el mismo número para simplificar." },
            { problem: "Suma: 1/5 + 2/5 = ?", solution: "3/5 — suma los numeradores, mantén el denominador: 1+2=3, denominador sigue siendo 5.", hint: "¡Solo suma los numeradores cuando los denominadores son iguales!" },
            { problem: "¿Cuál es mayor: 3/8 o 5/8?", solution: "5/8 — mismo denominador, compara numeradores: 5 > 3.", hint: "¿Mismo denominador? La fracción con mayor numerador es más grande." },
          ],
          tip: "📐 Fracciones equivalentes: multiplica o divide TANTO el numerador COMO el denominador por el mismo número.",
        },
      },
    },

    /* ── MATHEMATICS / GEOMETRY ── */
    "mathematics/geometry": {
      en: {
        low: {
          title: "Shapes and Geometry",
          explanation: "Geometry is the study of shapes, sizes, and positions. Basic 2D shapes include circles, squares, rectangles, and triangles. A circle has no corners. A square has 4 equal sides and 4 corners. A triangle has 3 sides and 3 corners.",
          examples: [
            { problem: "How many sides does a rectangle have?", solution: "4 sides — 2 long sides and 2 short sides (opposite sides are equal).", hint: "A square is a special rectangle where ALL 4 sides are equal." },
            { problem: "What shape has 3 sides and 3 corners?", solution: "A triangle!", hint: "Tri- means three. Triangle = 3 angles." },
            { problem: "How are a square and rectangle different?", solution: "A square has 4 equal sides; a rectangle has 2 long and 2 short sides.", hint: "Every square is a rectangle, but not every rectangle is a square." },
          ],
          tip: "🔷 Count the sides and corners to identify any shape!",
        },
        high: {
          title: "2D and 3D Shapes",
          explanation: "2D shapes are flat (circle, square, triangle, pentagon). 3D shapes have depth (cube, sphere, cylinder, cone, pyramid). Perimeter is the total distance around a 2D shape. Area is the space inside a shape, measured in square units.",
          examples: [
            { problem: "Find the perimeter of a square with sides 5 cm.", solution: "20 cm — perimeter = 4 × side = 4 × 5 = 20 cm.", hint: "Perimeter = sum of ALL sides." },
            { problem: "What 3D shape is a ball?", solution: "A sphere — it is perfectly round in all directions.", hint: "A sphere has no edges or corners." },
            { problem: "A rectangle is 6 cm long and 3 cm wide. Find its area.", solution: "18 cm² — area = length × width = 6 × 3 = 18.", hint: "Area = length × width. Measured in square units (cm²)." },
          ],
          tip: "📐 Perimeter = add all sides. Area = length × width (for rectangles).",
        },
      },
      bg: {
        low: {
          title: "Фигури и геометрия",
          explanation: "Геометрията изучава фигури, размери и положения. Основните 2D фигури включват: окръжност, квадрат, правоъгълник и триъгълник. Окръжността няма ъгли. Квадратът има 4 равни страни и 4 ъгъла. Триъгълникът има 3 страни и 3 ъгъла.",
          examples: [
            { problem: "Колко страни има правоъгълникът?", solution: "4 страни — 2 дълги и 2 къси (срещуположните страни са равни).", hint: "Квадратът е специален правоъгълник, при който ВСИЧКИТЕ 4 страни са равни." },
            { problem: "Коя фигура има 3 страни и 3 ъгъла?", solution: "Триъгълник!", hint: "Три страни → триъгълник." },
            { problem: "С какво се различават квадратът и правоъгълникът?", solution: "Квадратът има 4 равни страни; правоъгълникът има 2 дълги и 2 къси страни.", hint: "Всеки квадрат е правоъгълник, но не всеки правоъгълник е квадрат." },
          ],
          tip: "🔷 Брой страните и ъглите, за да разпознаеш всяка фигура!",
        },
        high: {
          title: "2D и 3D фигури",
          explanation: "2D фигурите са плоски (окръжност, квадрат, триъгълник, петоъгълник). 3D фигурите имат дълбочина (куб, сфера, цилиндър, конус, пирамида). Периметърът е общото разстояние около 2D фигура. Лицето е пространството вътре в фигурата, измерено в квадратни единици.",
          examples: [
            { problem: "Намери периметъра на квадрат със страна 5 см.", solution: "20 см — периметър = 4 × страна = 4 × 5 = 20 см.", hint: "Периметърът = сбор на ВСИЧКИ страни." },
            { problem: "Каква 3D фигура е топката?", solution: "Сфера — тя е напълно кръгла във всички посоки.", hint: "Сферата няма ребра или ъгли." },
            { problem: "Правоъгълник е 6 см дълъг и 3 см широк. Намери лицето му.", solution: "18 см² — лице = дължина × ширина = 6 × 3 = 18.", hint: "Лице = дължина × ширина. Измерва се в квадратни единици (см²)." },
          ],
          tip: "📐 Периметър = сбор на всички страни. Лице = дължина × ширина (за правоъгълници).",
        },
      },
      es: {
        low: {
          title: "Figuras y geometría",
          explanation: "La geometría estudia figuras, tamaños y posiciones. Las figuras 2D básicas incluyen: círculo, cuadrado, rectángulo y triángulo. El círculo no tiene esquinas. El cuadrado tiene 4 lados iguales y 4 esquinas. El triángulo tiene 3 lados y 3 esquinas.",
          examples: [
            { problem: "¿Cuántos lados tiene un rectángulo?", solution: "4 lados — 2 lados largos y 2 cortos (los lados opuestos son iguales).", hint: "Un cuadrado es un rectángulo especial donde TODOS los 4 lados son iguales." },
            { problem: "¿Qué figura tiene 3 lados y 3 esquinas?", solution: "¡Un triángulo!", hint: "Tri- significa tres. Triángulo = 3 ángulos." },
            { problem: "¿En qué se diferencian el cuadrado y el rectángulo?", solution: "El cuadrado tiene 4 lados iguales; el rectángulo tiene 2 lados largos y 2 cortos.", hint: "Todo cuadrado es un rectángulo, pero no todo rectángulo es un cuadrado." },
          ],
          tip: "🔷 ¡Cuenta los lados y las esquinas para identificar cualquier figura!",
        },
        high: {
          title: "Figuras 2D y 3D",
          explanation: "Las figuras 2D son planas (círculo, cuadrado, triángulo, pentágono). Las figuras 3D tienen profundidad (cubo, esfera, cilindro, cono, pirámide). El perímetro es la distancia total alrededor de una figura 2D. El área es el espacio dentro de una figura, medida en unidades cuadradas.",
          examples: [
            { problem: "Halla el perímetro de un cuadrado con lados de 5 cm.", solution: "20 cm — perímetro = 4 × lado = 4 × 5 = 20 cm.", hint: "Perímetro = suma de TODOS los lados." },
            { problem: "¿Qué figura 3D es una pelota?", solution: "Una esfera — es perfectamente redonda en todas las direcciones.", hint: "Una esfera no tiene aristas ni esquinas." },
            { problem: "Un rectángulo mide 6 cm de largo y 3 cm de ancho. Halla su área.", solution: "18 cm² — área = largo × ancho = 6 × 3 = 18.", hint: "Área = largo × ancho. Se mide en unidades cuadradas (cm²)." },
          ],
          tip: "📐 Perímetro = suma todos los lados. Área = largo × ancho (para rectángulos).",
        },
      },
    },

    /* ── MATHEMATICS / MEASUREMENT ── */
    "mathematics/measurement": {
      en: {
        low: {
          title: "Measurement",
          explanation: "We measure things to find out how long, heavy, or how much time has passed. Length uses centimetres (cm) and metres (m). Weight uses grams (g) and kilograms (kg). Time uses seconds, minutes, and hours. 100 cm = 1 metre. 1000 g = 1 kilogram.",
          examples: [
            { problem: "A pencil is 15 cm long. A ruler is 30 cm long. How much longer is the ruler?", solution: "15 cm longer — 30 − 15 = 15 cm.", hint: "Subtract the shorter length from the longer one." },
            { problem: "A bag of flour weighs 2 kg. How many grams is that?", solution: "2000 g — because 1 kg = 1000 g, so 2 kg = 2 × 1000 = 2000 g.", hint: "Multiply kg by 1000 to get grams." },
            { problem: "A lesson starts at 9:00 and lasts 45 minutes. When does it end?", solution: "9:45 — 9:00 + 45 minutes = 9:45.", hint: "Add the minutes to the starting time." },
          ],
          tip: "📏 Remember: 100 cm = 1 m and 1000 g = 1 kg!",
        },
        high: {
          title: "Units and Conversions",
          explanation: "Measurement involves choosing the right unit and converting between them. Length: mm, cm, m, km (10 mm=1 cm, 100 cm=1 m, 1000 m=1 km). Weight: g, kg (1000 g=1 kg). Capacity: ml, L (1000 ml=1 L). Time: seconds, minutes, hours, days.",
          examples: [
            { problem: "Convert 3.5 km to metres.", solution: "3500 m — 3.5 × 1000 = 3500 m.", hint: "Multiply km by 1000 to get metres." },
            { problem: "A bottle holds 1.5 litres. How many ml is that?", solution: "1500 ml — 1.5 × 1000 = 1500 ml.", hint: "1 litre = 1000 millilitres." },
            { problem: "A journey takes 2 hours and 30 minutes. How many minutes total?", solution: "150 minutes — 2 × 60 = 120 minutes + 30 = 150 minutes.", hint: "Convert hours to minutes (×60) then add extra minutes." },
          ],
          tip: "🔢 Conversion trick: ×1000 to go smaller (km→m, kg→g, L→ml). ÷1000 to go bigger.",
        },
      },
      bg: {
        low: {
          title: "Мерене",
          explanation: "Измерваме нещата, за да разберем колко са дълги, тежки или колко време е минало. Дължината се измерва в сантиметри (см) и метри (м). Теглото — в грамове (г) и килограми (кг). Времето — в секунди, минути и часове. 100 см = 1 метър. 1000 г = 1 килограм.",
          examples: [
            { problem: "Молив е 15 см дълъг. Линийка е 30 см дълга. С колко е по-дълга линийката?", solution: "С 15 см — 30 − 15 = 15 см.", hint: "Извади по-краткото от по-дългото." },
            { problem: "Торба брашно тежи 2 кг. Колко грама е това?", solution: "2000 г — защото 1 кг = 1000 г, затова 2 кг = 2 × 1000 = 2000 г.", hint: "Умножи кг по 1000, за да получиш грамовете." },
            { problem: "Урок започва в 9:00 и трае 45 минути. Кога свършва?", solution: "В 9:45 — 9:00 + 45 минути = 9:45.", hint: "Прибави минутите към началния час." },
          ],
          tip: "📏 Помни: 100 см = 1 м и 1000 г = 1 кг!",
        },
        high: {
          title: "Мерни единици и преобразуване",
          explanation: "Измерването включва избор на правилна единица и преобразуване между тях. Дължина: мм, см, м, км (10 мм=1 см, 100 см=1 м, 1000 м=1 км). Тегло: г, кг (1000 г=1 кг). Обем: мл, л (1000 мл=1 л). Време: секунди, минути, часове, дни.",
          examples: [
            { problem: "Преобразувай 3,5 км в метри.", solution: "3500 м — 3,5 × 1000 = 3500 м.", hint: "Умножи км по 1000, за да получиш метри." },
            { problem: "Бутилка побира 1,5 литра. Колко мл е това?", solution: "1500 мл — 1,5 × 1000 = 1500 мл.", hint: "1 литър = 1000 милилитра." },
            { problem: "Пътуване трае 2 часа и 30 минути. Колко минути са общо?", solution: "150 минути — 2 × 60 = 120 минути + 30 = 150 минути.", hint: "Преобразувай часовете в минути (×60) и добави допълнителните." },
          ],
          tip: "🔢 Трик за преобразуване: ×1000 за по-малки единици (км→м, кг→г, л→мл). ÷1000 за по-големи.",
        },
      },
      es: {
        low: {
          title: "Medición",
          explanation: "Medimos cosas para saber cuánto miden, pesan o cuánto tiempo ha pasado. La longitud usa centímetros (cm) y metros (m). El peso usa gramos (g) y kilogramos (kg). El tiempo usa segundos, minutos y horas. 100 cm = 1 metro. 1000 g = 1 kilogramo.",
          examples: [
            { problem: "Un lápiz mide 15 cm. Una regla mide 30 cm. ¿Cuánto más larga es la regla?", solution: "15 cm más — 30 − 15 = 15 cm.", hint: "Resta la longitud más corta de la más larga." },
            { problem: "Una bolsa de harina pesa 2 kg. ¿Cuántos gramos son?", solution: "2000 g — porque 1 kg = 1000 g, entonces 2 kg = 2 × 1000 = 2000 g.", hint: "Multiplica los kg por 1000 para obtener gramos." },
            { problem: "Una clase empieza a las 9:00 y dura 45 minutos. ¿Cuándo termina?", solution: "A las 9:45 — 9:00 + 45 minutos = 9:45.", hint: "Suma los minutos a la hora de inicio." },
          ],
          tip: "📏 ¡Recuerda: 100 cm = 1 m y 1000 g = 1 kg!",
        },
        high: {
          title: "Unidades y conversiones",
          explanation: "Medir implica elegir la unidad correcta y convertir entre ellas. Longitud: mm, cm, m, km (10 mm=1 cm, 100 cm=1 m, 1000 m=1 km). Peso: g, kg (1000 g=1 kg). Capacidad: ml, L (1000 ml=1 L). Tiempo: segundos, minutos, horas, días.",
          examples: [
            { problem: "Convierte 3,5 km en metros.", solution: "3500 m — 3,5 × 1000 = 3500 m.", hint: "Multiplica km por 1000 para obtener metros." },
            { problem: "Una botella contiene 1,5 litros. ¿Cuántos ml son?", solution: "1500 ml — 1,5 × 1000 = 1500 ml.", hint: "1 litro = 1000 mililitros." },
            { problem: "Un viaje dura 2 horas y 30 minutos. ¿Cuántos minutos son en total?", solution: "150 minutos — 2 × 60 = 120 minutos + 30 = 150 minutos.", hint: "Convierte las horas en minutos (×60) y suma los minutos extra." },
          ],
          tip: "🔢 Truco de conversión: ×1000 para ir a unidades más pequeñas (km→m, kg→g, L→ml). ÷1000 para unidades más grandes.",
        },
      },
    },

    /* ── BULGARIAN LANGUAGE / SPELLING ── */
    "bulgarian-language/spelling": {
      en: {
        low: {
          title: "Spelling",
          explanation: "Spelling means writing words with the correct letters in the correct order. In Bulgarian, every letter has one sound, which makes spelling predictable. Key rules: always capitalize the first word of a sentence and proper names. Double-check words with 'ъ' and 'я' sounds.",
          examples: [
            { problem: "Which is correct: 'ябалка' or 'ябълка'?", solution: "'ябълка' — the middle sound is 'ъ' not 'а'.", hint: "Say the word slowly: я-БЪЛ-ка. Listen for each sound." },
            { problem: "Should 'мария' be written with a capital M?", solution: "Yes — 'Мария' — it is a proper name (person's name).", hint: "Names of people and places always start with a capital letter." },
            { problem: "Complete the word: 'ч_ша' (meaning 'cup')", solution: "чаша — the missing letter is 'а'.", hint: "Pronounce it: ча-ша." },
          ],
          tip: "✏️ Read your writing aloud — you will catch many spelling mistakes by ear!",
        },
        high: {
          title: "Spelling Rules",
          explanation: "Advanced spelling involves rules for 'ь' (soft sign), double letters, and correct use of 'я/а' after soft consonants. The soft sign 'ь' appears in words like 'пясък', 'любов'. Proper nouns, the first word in a sentence, and the pronoun 'Аз' (in formal contexts) use capital letters.",
          examples: [
            { problem: "Correct the spelling: 'любов' or 'лубов'?", solution: "'любов' — contains 'ю' (soft 'u' sound), not 'у'.", hint: "Listen for soft vowel sounds: ю, я, ьо." },
            { problem: "When do we use capital letters in Bulgarian?", solution: "At the start of a sentence, for names of people, cities, countries, and rivers.", hint: "Sofia, Дунав, Иван, България — all start with capitals." },
            { problem: "Correct: 'слонъ' or 'слон'?", solution: "'слон' — the old letter 'ъ' at the end of masculine nouns was dropped in modern Bulgarian.", hint: "Modern Bulgarian doesn't use 'ъ' at the end of masculine nouns." },
          ],
          tip: "📖 When in doubt, say the word aloud slowly and write each sound you hear.",
        },
      },
      bg: {
        low: {
          title: "Правопис",
          explanation: "Правописът означава писане на думите с правилните букви в правилния ред. В българския всяка буква има един звук, което прави правописа предвидим. Основни правила: главна буква в началото на изречение и за собствени имена. Внимавай с думите с 'ъ' и 'я'.",
          examples: [
            { problem: "Кое е правилно: 'ябалка' или 'ябълка'?", solution: "'ябълка' — средният звук е 'ъ', не 'а'.", hint: "Кажи думата бавно: я-БЪЛ-ка. Чуй всеки звук." },
            { problem: "Трябва ли 'мария' да се пише с главна М?", solution: "Да — 'Мария' — това е собствено име (лично).", hint: "Имената на хора и места се пишат с главна буква." },
            { problem: "Допълни думата: 'ч_ша' (значи 'cup')", solution: "чаша — липсващата буква е 'а'.", hint: "Произнеси: ча-ша." },
          ],
          tip: "✏️ Прочети написаното на глас — ще чуеш много правописни грешки!",
        },
        high: {
          title: "Правописни правила",
          explanation: "Напредналият правопис включва правила за 'ь' (мека гласна), удвоени букви и правилна употреба на 'я/а' след меки съгласни. Меката гласна 'ь' се появява в думи като 'пясък', 'любов'. Собствените имена, първата дума на изречение и местоимението 'Аз' (в официален контекст) се пишат с главна буква.",
          examples: [
            { problem: "Правилно ли е: 'любов' или 'лубов'?", solution: "'любов' — съдържа 'ю' (мек звук), не 'у'.", hint: "Чувай меките гласни: ю, я, ьо." },
            { problem: "Кога в български се пишат главни букви?", solution: "В началото на изречение, за имена на хора, градове, страни и реки.", hint: "София, Дунав, Иван, България — всички с главна буква." },
            { problem: "Правилно: 'слонъ' или 'слон'?", solution: "'слон' — старата буква 'ъ' в края на мъжки съществителни беше премахната от съвременния български.", hint: "Съвременният български не ползва 'ъ' в края на мъжки съществителни." },
          ],
          tip: "📖 При съмнение кажи думата на глас бавно и запиши всеки звук, който чуваш.",
        },
      },
      es: {
        low: {
          title: "Ortografía",
          explanation: "La ortografía significa escribir palabras con las letras correctas en el orden correcto. En búlgaro, cada letra tiene un sonido, lo que hace la ortografía predecible. Reglas clave: siempre usa mayúscula al inicio de una oración y para nombres propios. Ten cuidado con las palabras con 'ъ' y 'я'.",
          examples: [
            { problem: "¿Cuál es correcta: 'ябалка' o 'ябълка'?", solution: "'ябълка' — el sonido del medio es 'ъ', no 'а'.", hint: "Di la palabra despacio: я-БЪЛ-ка. Escucha cada sonido." },
            { problem: "¿Debe 'мария' escribirse con M mayúscula?", solution: "Sí — 'Мария' — es un nombre propio (nombre de persona).", hint: "Los nombres de personas y lugares siempre empiezan con mayúscula." },
            { problem: "Completa la palabra: 'ч_ша' (significa 'taza')", solution: "чаша — la letra que falta es 'а'.", hint: "Pronúnciala: ча-ша." },
          ],
          tip: "✏️ ¡Lee lo que escribiste en voz alta — escucharás muchos errores ortográficos!",
        },
        high: {
          title: "Reglas ortográficas",
          explanation: "La ortografía avanzada incluye reglas para la 'ь' (signo suave), letras dobles y el uso correcto de 'я/а' después de consonantes suaves. La señal suave 'ь' aparece en palabras como 'пясък', 'любов'. Los nombres propios, la primera palabra de una oración usan mayúscula.",
          examples: [
            { problem: "¿Es correcto: 'любов' o 'лубов'?", solution: "'любов' — contiene 'ю' (sonido suave), no 'у'.", hint: "Escucha los sonidos vocálicos suaves: ю, я, ьо." },
            { problem: "¿Cuándo se usan mayúsculas en búlgaro?", solution: "Al inicio de oración, para nombres de personas, ciudades, países y ríos.", hint: "София, Дунав, Иван, България — todos con mayúscula." },
            { problem: "¿Correcto: 'слонъ' o 'слон'?", solution: "'слон' — la antigua letra 'ъ' al final de sustantivos masculinos fue eliminada del búlgaro moderno.", hint: "El búlgaro moderno no usa 'ъ' al final de sustantivos masculinos." },
          ],
          tip: "📖 Cuando dudes, di la palabra en voz alta despacio y escribe cada sonido que oigas.",
        },
      },
    },

    /* ── BULGARIAN LANGUAGE / WORD STUDY ── */
    "bulgarian-language/word-study": {
      en: {
        low: {
          title: "Vocabulary",
          explanation: "Vocabulary is all the words we know and use. Learning new words helps us read, write, and understand better. Synonyms are words with similar meanings (big/large). Antonyms are opposite-meaning words (big/small). Context clues help us guess the meaning of unknown words.",
          examples: [
            { problem: "What does 'слон' mean? Use the hint: it is a large grey animal with a trunk.", solution: "Elephant (слон)", hint: "Use the description to picture the animal." },
            { problem: "Give a synonym for 'голям' (big).", solution: "огромен (huge), едър (large), грамаден (enormous)", hint: "A synonym means almost the same thing." },
            { problem: "What is the opposite (antonym) of 'топъл' (warm)?", solution: "студен (cold)", hint: "An antonym means the opposite." },
          ],
          tip: "📚 Read every day — new words stick best when you see them in a story!",
        },
        high: {
          title: "Word Families and Context",
          explanation: "Word families share the same root: учи (learns), учител (teacher), ученик (student), учебник (textbook). Prefixes and suffixes change word meaning: пре- (re-), без- (without), -ен/-на (adjective ending). Use context — the words around an unknown word — to guess its meaning.",
          examples: [
            { problem: "What word family does 'пишa' (write) belong to? Give 2 related words.", solution: "писател (writer), писмо (letter/writing), писалка (pen)", hint: "Think of people, objects, or actions connected to 'writing'." },
            { problem: "What does the prefix 'пре-' mean? Example: 'превеждам' (translate)", solution: "'пре-' means 'across, over, re-' — translate = carry meaning across languages.", hint: "Other examples: преписвам (copy/rewrite), прекарвам (spend time)." },
            { problem: "Guess the meaning of 'непознат' using parts: не- (not) + познат (known).", solution: "Unknown / unfamiliar / stranger", hint: "не- = not, познат = known → not known." },
          ],
          tip: "🔍 When you see an unknown word, break it into parts: root + prefix + suffix.",
        },
      },
      bg: {
        low: {
          title: "Речник",
          explanation: "Речникът са всички думи, които знаем и използваме. Научаването на нови думи ни помага да четем, пишем и разбираме по-добре. Синонимите са думи с близко значение (голям/едър). Антонимите са думи с противоположно значение (голям/малък). Контекстът ни помага да отгатнем значението на непознати думи.",
          examples: [
            { problem: "Какво означава 'слон'? Подсказка: голямо сиво животно с хобот.", solution: "Elephant (слон)", hint: "Използвай описанието, за да си представиш животното." },
            { problem: "Дай синоним на 'голям'.", solution: "огромен, едър, грамаден", hint: "Синонимът означава почти същото." },
            { problem: "Какво е антонимът на 'топъл'?", solution: "студен", hint: "Антонимът означава противоположното." },
          ],
          tip: "📚 Чети всеки ден — новите думи се запомнят най-добре в история!",
        },
        high: {
          title: "Словообразуване и контекст",
          explanation: "Словните семейства споделят един корен: учи, учител, ученик, учебник. Представките и наставките променят значението: пре-, без-, -ен/-на. Използвай контекста — думите около непознатата дума — за да отгатнеш значението й.",
          examples: [
            { problem: "Към кое словно семейство спада 'пиша'? Дай 2 свързани думи.", solution: "писател, писмо, писалка", hint: "Мисли за хора, предмети или действия, свързани с 'писане'." },
            { problem: "Какво означава представката 'пре-'? Пример: 'превеждам'", solution: "'пре-' означава 'от едната страна на другата' — превеждам = пренасяш значение между езици.", hint: "Примери: преписвам, прекарвам." },
            { problem: "Отгатни значението на 'непознат' по частите: не- + познат.", solution: "Непознат / чужд / непреставен", hint: "не- = отрицание, познат = известен → не е известен." },
          ],
          tip: "🔍 Когато срещнеш непозната дума, раздели я на части: корен + представка + наставка.",
        },
      },
      es: {
        low: {
          title: "Vocabulario",
          explanation: "El vocabulario son todas las palabras que conocemos y usamos. Aprender palabras nuevas nos ayuda a leer, escribir y comprender mejor. Los sinónimos son palabras con significados similares (grande/enorme). Los antónimos son palabras de significado opuesto (grande/pequeño). El contexto nos ayuda a adivinar el significado de palabras desconocidas.",
          examples: [
            { problem: "¿Qué significa 'слон'? Pista: es un gran animal gris con trompa.", solution: "Elefante (слон)", hint: "Usa la descripción para imaginar el animal." },
            { problem: "Da un sinónimo de 'голям' (grande).", solution: "огромен (enorme), едър (grande), грамаден (gigantesco)", hint: "Un sinónimo significa casi lo mismo." },
            { problem: "¿Cuál es el antónimo de 'топъл' (cálido)?", solution: "студен (frío)", hint: "Un antónimo significa lo opuesto." },
          ],
          tip: "📚 ¡Lee todos los días — las palabras nuevas se fijan mejor cuando las ves en una historia!",
        },
        high: {
          title: "Familias de palabras y contexto",
          explanation: "Las familias de palabras comparten la misma raíz: учи (aprende), учител (maestro), ученик (alumno), учебник (libro de texto). Los prefijos y sufijos cambian el significado: пре- (re-), без- (sin), -ен/-на (terminación adjetiva). Usa el contexto para adivinar el significado de palabras desconocidas.",
          examples: [
            { problem: "¿A qué familia de palabras pertenece 'пишa' (escribir)? Da 2 palabras relacionadas.", solution: "писател (escritor), писмо (carta/escrito), писалка (bolígrafo)", hint: "Piensa en personas, objetos o acciones relacionadas con 'escribir'." },
            { problem: "¿Qué significa el prefijo 'пре-'? Ejemplo: 'превеждам' (traducir)", solution: "'пре-' significa 'a través, re-' — traducir = llevar el significado a otro idioma.", hint: "Otros ejemplos: преписвам (copiar/reescribir)." },
            { problem: "Adivina el significado de 'непознат' usando sus partes: не- (no) + познат (conocido).", solution: "Desconocido / extraño", hint: "не- = no, познат = conocido → no conocido." },
          ],
          tip: "🔍 Cuando veas una palabra desconocida, divídela en partes: raíz + prefijo + sufijo.",
        },
      },
    },

    /* ── BULGARIAN LANGUAGE / PUNCTUATION ── */
    "bulgarian-language/punctuation": {
      en: {
        low: {
          title: "Punctuation",
          explanation: "Punctuation marks help us read correctly by showing where sentences start and end. A full stop (.) ends a statement. A question mark (?) ends a question. An exclamation mark (!) shows strong feeling. A comma (,) is a short pause inside a sentence.",
          examples: [
            { problem: "Add the correct punctuation: 'What is your name'", solution: "What is your name? (question mark because it is a question)", hint: "If the sentence asks something, it ends with ?" },
            { problem: "Add punctuation: 'I love football'", solution: "I love football! or I love football. (exclamation for strong feeling; full stop for plain statement)", hint: "Exclamation = strong feeling. Full stop = calm statement." },
            { problem: "Where does the comma go? 'I like apples oranges and bananas.'", solution: "I like apples, oranges, and bananas.", hint: "Use commas to separate items in a list." },
          ],
          tip: "🛑 Think of a full stop as a red light (stop!), a comma as a yellow light (pause).",
        },
        high: {
          title: "Punctuation and Clauses",
          explanation: "Punctuation controls meaning. Commas separate clauses, list items, and direct speech markers. A colon (:) introduces a list or explanation. A semicolon (;) links two related independent clauses. Quotation marks show direct speech. An apostrophe (') shows possession or missing letters.",
          examples: [
            { problem: "Punctuate: 'Maria said I am happy'", solution: "Maria said, \"I am happy.\" — comma before speech, quotes around spoken words.", hint: "Direct speech: name + said, + \"speech marks around words spoken.\"" },
            { problem: "When do you use a colon?", solution: "Before a list or explanation: 'I need three things: bread, milk, and eggs.'", hint: "Colon = 'here comes the list or explanation'." },
            { problem: "Correct: 'Its raining' vs 'It's raining'", solution: "'It's raining' — apostrophe replaces the missing letter 'i' in 'it is'.", hint: "It's = it is. Its = belonging to it (no apostrophe)." },
          ],
          tip: "💬 Punctuation is like a road map for the reader — it tells them where to stop, pause, and turn.",
        },
      },
      bg: {
        low: {
          title: "Пунктуация",
          explanation: "Препинателните знаци ни помагат да четем правилно, като показват къде започват и свършват изреченията. Точката (.) завършва изявително изречение. Въпросителният знак (?) завършва въпрос. Удивителният знак (!) показва силно чувство. Запетаята (,) е кратка пауза вътре в изречение.",
          examples: [
            { problem: "Добави правилния знак: 'Как се казваш'", solution: "Как се казваш? (въпросителен знак — това е въпрос)", hint: "Ако изречението пита нещо, завършва с ?" },
            { problem: "Добави препинателен знак: 'Обичам футбол'", solution: "Обичам футбол! или Обичам футбол. (удивителна за силно чувство; точка за спокойно изявление)", hint: "Удивителна = силно чувство. Точка = спокойно изявление." },
            { problem: "Къде отива запетаята? 'Обичам ябълки портокали и банани.'", solution: "Обичам ябълки, портокали и банани.", hint: "Употребявай запетаи за разделяне на елементи в изброяване." },
          ],
          tip: "🛑 Мисли за точката като червена светлина (спри!), за запетаята — жълта (пауза).",
        },
        high: {
          title: "Пунктуация и изречения",
          explanation: "Пунктуацията управлява смисъла. Запетаите разделят части на изречения, изброявания и реч. Двоеточието (:) въвежда изброяване или обяснение. Точката и запетаята (;) свързва две самостоятелни части. Кавичките показват пряка реч. Апострофът (') показва притежание или изпусната буква.",
          examples: [
            { problem: "Препинателни знаци: 'Мария каза радвам се'", solution: "Мария каза: <<Радвам се.>> — двоеточие преди речта, кавички около казаното.", hint: "Пряка реч: Кой каза: <<Думи в кавички.>>" },
            { problem: "Кога се употребява двоеточие?", solution: "Преди изброяване или обяснение: 'Имам нужда от три неща: хляб, мляко и яйца.'", hint: "Двоеточие = 'следва изброяване или обяснение'." },
            { problem: "Каква е разликата между 'Ивановата' и 'Ивановата'?", solution: "Притежателните форми в bulgarian се образуват с наставки, не с апостроф, за разлика от английски.", hint: "В Bulgarian: Иванов + ата = Ивановата книга (Ivan's book)." },
          ],
          tip: "💬 Пунктуацията е като пътна карта за читателя — показва къде да спре, да направи пауза.",
        },
      },
      es: {
        low: {
          title: "Puntuación",
          explanation: "Los signos de puntuación nos ayudan a leer correctamente al mostrar dónde empiezan y terminan las oraciones. El punto (.) termina una afirmación. El signo de interrogación (¿?) termina una pregunta. El signo de exclamación (¡!) muestra sentimientos fuertes. La coma (,) es una pausa breve dentro de una oración.",
          examples: [
            { problem: "Añade la puntuación correcta: '¿Cómo te llamas'", solution: "¿Cómo te llamas? (signo de interrogación — es una pregunta)", hint: "Si la oración pregunta algo, termina con ?" },
            { problem: "Añade puntuación: 'Me encanta el fútbol'", solution: "¡Me encanta el fútbol! o Me encanta el fútbol. (exclamación para sentimiento fuerte; punto para afirmación sencilla)", hint: "Exclamación = sentimiento fuerte. Punto = afirmación tranquila." },
            { problem: "¿Dónde va la coma? 'Me gustan las manzanas las naranjas y los plátanos.'", solution: "Me gustan las manzanas, las naranjas y los plátanos.", hint: "Usa comas para separar elementos de una lista." },
          ],
          tip: "🛑 Piensa en el punto como un semáforo rojo (¡stop!), y en la coma como uno amarillo (pausa).",
        },
        high: {
          title: "Puntuación y cláusulas",
          explanation: "La puntuación controla el significado. Las comas separan cláusulas, elementos de listas y el estilo directo. Los dos puntos (:) introducen una lista o explicación. El punto y coma (;) une dos cláusulas independientes relacionadas. Las comillas muestran el discurso directo.",
          examples: [
            { problem: "Puntúa: 'María dijo estoy feliz'", solution: "María dijo: «Estoy feliz.» — dos puntos antes del discurso, comillas alrededor de las palabras dichas.", hint: "Discurso directo: nombre + dijo: + «palabras entre comillas.»" },
            { problem: "¿Cuándo se usan los dos puntos?", solution: "Antes de una lista o explicación: 'Necesito tres cosas: pan, leche y huevos.'", hint: "Dos puntos = 'aquí viene la lista o explicación'." },
            { problem: "¿Cuándo se usa el punto y coma?", solution: "Para unir dos ideas independientes relacionadas: 'Estudié mucho; aprobé el examen.'", hint: "Punto y coma = dos ideas completas pero relacionadas." },
          ],
          tip: "💬 La puntuación es como un mapa de carreteras para el lector — le dice dónde parar, hacer pausa y girar.",
        },
      },
    },

    /* ── BULGARIAN LANGUAGE / NOUNS-VERBS ── */
    "bulgarian-language/nouns-verbs": {
      en: {
        low: {
          title: "Nouns and Verbs",
          explanation: "Nouns are words for people, places, animals, or things: dog, school, Maria, book. Verbs are action or state words: run, eat, sleep, is. Every sentence needs at least one noun and one verb. Nouns answer 'Who?' or 'What?'. Verbs answer 'What does it do?'",
          examples: [
            { problem: "Identify the noun and verb: 'The cat sleeps.'", solution: "Noun: cat. Verb: sleeps.", hint: "Cat = thing (noun). Sleeps = action (verb)." },
            { problem: "Is 'beautiful' a noun or verb?", solution: "Neither — 'beautiful' is an adjective (it describes a noun).", hint: "Nouns = things. Verbs = actions. Adjectives = descriptions." },
            { problem: "Give the verb for: 'The child ___ in the park.' (plays/book/big)", solution: "plays — it is an action word.", hint: "Choose the word that shows what the child is doing." },
          ],
          tip: "🏃 Verbs = action words! Nouns = name words! Every sentence needs both.",
        },
        high: {
          title: "Nouns, Verbs, and Tenses",
          explanation: "Nouns can be singular (one) or plural (many): child/children, leaf/leaves. Verbs change with tense: I walk (present), I walked (past), I will walk (future). Subject-verb agreement: 'She walks' ✅, 'She walk' ❌. In Bulgarian, verb endings change depending on the subject.",
          examples: [
            { problem: "Change to past tense: 'The dog barks.'", solution: "The dog barked. (add -ed for regular verbs)", hint: "Present → Past: bark→barked, walk→walked, play→played." },
            { problem: "Make plural: 'The child runs in the park.'", solution: "The children run in the park. (child→children; run agrees with plural)", hint: "child → children (irregular plural). Plural subjects use 'run' not 'runs'." },
            { problem: "Fix the agreement: 'She eat an apple every day.'", solution: "'She eats an apple every day.' — 3rd person singular needs -s.", hint: "He/She/It: add -s to the verb. I/You/We/They: no -s." },
          ],
          tip: "📝 Subject + Verb must always agree in number (singular/plural).",
        },
      },
      bg: {
        low: {
          title: "Съществителни и глаголи",
          explanation: "Съществителните имена са думи за хора, места, животни или предмети: куче, училище, Мария, книга. Глаголите са думи за действие или състояние: тичам, ям, спя, съм. Всяко изречение се нуждае от поне едно съществително и един глагол. Съществителните отговарят на 'Кой?' или 'Какво?'. Глаголите — на 'Какво прави?'",
          examples: [
            { problem: "Намери съществителното и глагола: 'Котката спи.'", solution: "Съществително: котката. Глагол: спи.", hint: "Котка = нещо (съществително). Спи = действие (глагол)." },
            { problem: "Прилагателно ли е, съществително ли е или глагол е 'красива'?", solution: "Нито едното — 'красива' е прилагателно (описва съществително).", hint: "Съществителни = неща. Глаголи = действия. Прилагателни = описания." },
            { problem: "Избери глагола: 'Детето ___ в парка.' (играе/книга/голяма)", solution: "играе — действие.", hint: "Избери думата, която показва какво прави детето." },
          ],
          tip: "🏃 Глаголите = думи за действие! Съществителните = имена! Всяко изречение се нуждае от двете.",
        },
        high: {
          title: "Съществителни, глаголи и глаголни времена",
          explanation: "Съществителните могат да са в единствено или множествено число: дете/деца, лист/листа. Глаголите се изменят по време: вървя (сегашно), вървях (минало), ще вървя (бъдеще). Глаголното окончание в българския се мени според лицето: аз вървя, той върви.",
          examples: [
            { problem: "Поставете в минало: 'Кучето лае.'", solution: "Кучето лаеше. (или: изла) — глаголна форма за минало несвършено.", hint: "Сегашно → Минало несвършено: тичам → тичах, играя → играех." },
            { problem: "Направи множествено: 'Детето тича в парка.'", solution: "Децата тичат в парка. (дете→деца; тичат за мн.ч.)", hint: "дете → деца (неправилно мн.ч.). Мн.ч. изисква 'тичат'." },
            { problem: "Разпознай времето: 'Тя пееше цяло лято.'", solution: "Минало несвършено — описва продължително минало действие.", hint: "Минало несвършено = -еше/-аше/-яше: пееше, говореше, тичаше." },
          ],
          tip: "📝 Глаголното лице и число трябва да съвпадат с подлога.",
        },
      },
      es: {
        low: {
          title: "Sustantivos y verbos",
          explanation: "Los sustantivos son palabras para personas, lugares, animales o cosas: perro, escuela, María, libro. Los verbos son palabras de acción o estado: correr, comer, dormir, ser. Cada oración necesita al menos un sustantivo y un verbo. Los sustantivos responden '¿Quién?' o '¿Qué?'. Los verbos responden '¿Qué hace?'",
          examples: [
            { problem: "Identifica el sustantivo y el verbo: 'El gato duerme.'", solution: "Sustantivo: gato. Verbo: duerme.", hint: "Gato = cosa (sustantivo). Duerme = acción (verbo)." },
            { problem: "¿Es 'hermoso' un sustantivo o un verbo?", solution: "Ninguno — 'hermoso' es un adjetivo (describe a un sustantivo).", hint: "Sustantivos = cosas. Verbos = acciones. Adjetivos = descripciones." },
            { problem: "Elige el verbo: 'El niño ___ en el parque.' (juega/libro/grande)", solution: "juega — es una palabra de acción.", hint: "Elige la palabra que muestra qué hace el niño." },
          ],
          tip: "🏃 ¡Los verbos = palabras de acción! ¡Los sustantivos = palabras de nombre! Toda oración necesita ambos.",
        },
        high: {
          title: "Sustantivos, verbos y tiempos",
          explanation: "Los sustantivos pueden ser singulares (uno) o plurales (muchos): niño/niños, hoja/hojas. Los verbos cambian con el tiempo: camino (presente), caminé (pasado), caminaré (futuro). Concordancia sujeto-verbo: 'Ella camina' ✅, 'Ella caminan' ❌.",
          examples: [
            { problem: "Cambia al pasado: 'El perro ladra.'", solution: "El perro ladró. (pretérito indefinido para acción completa)", hint: "Presente → Pasado: ladra→ladró, corre→corrió, juega→jugó." },
            { problem: "Pon en plural: 'El niño corre en el parque.'", solution: "Los niños corren en el parque.", hint: "niño → niños. El verbo también cambia: corre → corren." },
            { problem: "Corrige la concordancia: 'Ella comen una manzana.'", solution: "'Ella come una manzana.' — 3ª persona singular termina en -e/-a.", hint: "Ella/Él → comer: come. Ellos → comen." },
          ],
          tip: "📝 El sujeto y el verbo siempre deben concordar en número (singular/plural).",
        },
      },
    },

    /* ── READING LITERATURE / POETRY ── */
    "reading-literature/poetry": {
      en: {
        low: {
          title: "Poetry",
          explanation: "A poem is a special kind of writing that uses beautiful language, rhythm, and sometimes rhyme. Poems are arranged in stanzas (groups of lines). Rhyme is when the ends of lines sound the same (cat/hat, run/fun). Rhythm is the musical beat you feel when you read a poem aloud.",
          examples: [
            { problem: "In the poem: 'The cat sat on a mat / It was wearing a tiny hat' — what words rhyme?", solution: "mat / hat — both end in the same '-at' sound.", hint: "Rhyming words sound the same at the end." },
            { problem: "What is a stanza?", solution: "A group of lines in a poem, like a paragraph in a story.", hint: "Poems are divided into stanzas; stories are divided into paragraphs." },
            { problem: "Read aloud: 'One, two, buckle my shoe / Three, four, knock at the door.' — can you feel the rhythm?", solution: "Yes — the strong and weak beats create a regular pattern, like music.", hint: "Clap along as you read — clap on the strong beats." },
          ],
          tip: "🎵 Read poetry aloud — the rhythm and rhyme come alive with your voice!",
        },
        high: {
          title: "Poetry: Form and Language",
          explanation: "Poets use special techniques: simile (comparing using 'like' or 'as': 'brave as a lion'), metaphor (saying one thing IS another: 'life is a journey'), personification (giving human qualities to objects: 'the wind whispered'). Free verse poems have no fixed rhyme or rhythm. Haiku has 3 lines: 5, 7, 5 syllables.",
          examples: [
            { problem: "Identify the technique: 'The moon is a silver coin.'", solution: "Metaphor — the moon is compared to a silver coin without using 'like' or 'as'.", hint: "Metaphor = A IS B (no 'like' or 'as')." },
            { problem: "Write a simile about the sun.", solution: "Example: 'The sun is as warm as a hug.' or 'The sun shines like a golden lamp.'", hint: "Simile = A is LIKE B, or A is AS [adjective] AS B." },
            { problem: "A haiku: 'An old silent pond / A frog jumps into the pond / Splash! Silence again.' Count the syllables.", solution: "Line 1: An-old-si-lent-pond = 5. Line 2: A-frog-jumps-in-to-the-pond = 7. Line 3: Splash-si-lence-a-gain = 5. ✅", hint: "Count each syllable carefully by clapping." },
          ],
          tip: "🌟 Simile uses 'like/as'. Metaphor says one thing IS another. Personification gives objects human qualities.",
        },
      },
      bg: {
        low: {
          title: "Поезия",
          explanation: "Стихотворението е особен вид текст, който използва красив език, ритъм и понякога рима. Стихотворенията са наредени в строфи (групи от редове). Римата е когато краищата на редовете звучат еднакво (котка/бостан). Ритъмът е музикалният такт, който усещаш, когато четеш стихотворение на глас.",
          examples: [
            { problem: "В стихотворението: 'Котката седна на рогозка / Тя носеше малка шапка' — кои думи се римуват?", solution: "рогозка / шапка — завършват на подобен звук (в оригинала: mat/hat).", hint: "Думите, които се римуват, звучат еднакво в края." },
            { problem: "Какво е строфа?", solution: "Група от редове в стихотворение, като абзац в разказ.", hint: "Стихотворенията са разделени на строфи; разказите — на абзаци." },
            { problem: "Можеш ли да усетиш ритъма в: 'Дойде пролет весела / С цветя и с песни'?", solution: "Да — силните и слабите срички се редуват в правилен ритъм.", hint: "Пляскай в такт с четенето — пляскай на силните срички." },
          ],
          tip: "🎵 Чети поезия на глас — ритъмът и римата оживяват с гласа ти!",
        },
        high: {
          title: "Поезия: форма и изразни средства",
          explanation: "Поетите използват специални похвати: сравнение (с 'като': 'храбър като лъв'), метафора (едно нещо е друго: 'животът е пътешествие'), олицетворение (давам човешки качества на предмети: 'вятърът шептеше'). Свободният стих няма фиксирана рима или ритъм.",
          examples: [
            { problem: "Определи похвата: 'Луната е сребърна монета.'", solution: "Метафора — луната се сравнява с монета без да се ползва 'като'.", hint: "Метафора = А е Б (без 'като')." },
            { problem: "Напиши сравнение за слънцето.", solution: "Пример: 'Слънцето е топло като прегръдка.' или 'Слънцето свети като златна лампа.'", hint: "Сравнение = А е КАТО Б." },
            { problem: "Намери олицетворението: 'Реката пее сред камъните.'", solution: "Олицетворение — реката 'пее', сякаш е жива. Пеенето е човешко/животинско действие.", hint: "Олицетворение = предмет извършва човешко действие." },
          ],
          tip: "🌟 Сравнение = 'като'. Метафора = едното е другото. Олицетворение = предметът е жив.",
        },
      },
      es: {
        low: {
          title: "Poesía",
          explanation: "Un poema es un tipo especial de escritura que usa lenguaje hermoso, ritmo y a veces rima. Los poemas se organizan en estrofas (grupos de versos). La rima es cuando el final de los versos suena igual (gato/pato). El ritmo es el compás musical que sientes al leer un poema en voz alta.",
          examples: [
            { problem: "En el poema: 'El gato se sentó en la alfombra / Llevaba un sombrero con sombra' — ¿qué palabras riman?", solution: "alfombra / sombra — terminan con el mismo sonido.", hint: "Las palabras que riman suenan igual al final." },
            { problem: "¿Qué es una estrofa?", solution: "Un grupo de versos en un poema, como un párrafo en una historia.", hint: "Los poemas se dividen en estrofas; las historias en párrafos." },
            { problem: "¿Puedes sentir el ritmo en: 'Uno, dos, tres, / pisé un ciempiés'?", solution: "Sí — los acentos fuertes y débiles se alternan en un patrón regular.", hint: "Aplaude al leer — aplaude en los acentos fuertes." },
          ],
          tip: "🎵 ¡Lee poesía en voz alta — el ritmo y la rima cobran vida con tu voz!",
        },
        high: {
          title: "Poesía: forma y lenguaje",
          explanation: "Los poetas usan técnicas especiales: símil (comparar con 'como': 'valiente como un león'), metáfora (decir que algo ES otra cosa: 'la vida es un viaje'), personificación (dar cualidades humanas a objetos: 'el viento susurró'). El verso libre no tiene rima ni ritmo fijo.",
          examples: [
            { problem: "Identifica la técnica: 'La luna es una moneda de plata.'", solution: "Metáfora — la luna se compara con una moneda sin usar 'como'.", hint: "Metáfora = A ES B (sin 'como')." },
            { problem: "Escribe un símil sobre el sol.", solution: "Ejemplo: 'El sol es tan cálido como un abrazo.' o 'El sol brilla como una lámpara dorada.'", hint: "Símil = A es COMO B." },
            { problem: "Encuentra la personificación: 'El río canta entre las piedras.'", solution: "Personificación — el río 'canta', como si estuviera vivo. Cantar es una acción humana.", hint: "Personificación = un objeto hace algo humano." },
          ],
          tip: "🌟 Símil usa 'como'. Metáfora dice que algo ES otra cosa. Personificación da vida a los objetos.",
        },
      },
    },

    /* ── READING LITERATURE / MAIN-IDEA ── */
    "reading-literature/main-idea": {
      en: {
        low: {
          title: "Finding the Main Idea",
          explanation: "The main idea is what a text is mostly about. Every paragraph or passage has one main idea. Supporting details are facts or examples that explain or prove the main idea. Ask yourself: 'What is the author mainly talking about?' The main idea is often in the first or last sentence of a paragraph.",
          examples: [
            { problem: "Read: 'Dogs make great pets. They are loyal, fun to play with, and they protect their owners.' What is the main idea?", solution: "Dogs make great pets — the other sentences are supporting details.", hint: "The first sentence often states the main idea. The rest explain it." },
            { problem: "What is a 'supporting detail'?", solution: "A fact or example that gives more information about the main idea.", hint: "Supporting details answer: Why? How? What evidence?" },
            { problem: "Read: 'Lions live in Africa. They hunt in groups called prides. They are the kings of the savanna.' What is the main idea?", solution: "Lions are powerful animals that live and hunt in groups in Africa.", hint: "Combine the ideas: Where do they live? How do they behave?" },
          ],
          tip: "🔍 Ask: 'What is this MOSTLY about?' — that is the main idea!",
        },
        high: {
          title: "Main Idea and Theme",
          explanation: "The main idea is the central point of a non-fiction text. The theme is the underlying message of a story or poem (e.g., friendship, courage, honesty). To find the theme, ask: 'What lesson does the character learn?' or 'What message does the author want to share?' Main idea is stated; theme is implied.",
          examples: [
            { problem: "A story: A fox tries many times to reach grapes but fails and says 'They were probably sour anyway.' What is the theme?", solution: "People sometimes make excuses when they fail instead of accepting failure honestly.", hint: "What lesson or truth does this story show about human behaviour?" },
            { problem: "Difference between main idea and theme?", solution: "Main idea: what the text says (topic + what about it). Theme: what the text means (life lesson or message).", hint: "Main idea is explicit; theme is the lesson you infer." },
            { problem: "Find the theme: A story where a tortoise beats a rabbit in a race by being slow and steady.", solution: "Theme: persistence and consistency beat speed and overconfidence.", hint: "What life lesson does this familiar story teach?" },
          ],
          tip: "🌟 Main idea = what it says. Theme = what it means (the deeper lesson).",
        },
      },
      bg: {
        low: {
          title: "Намиране на основната идея",
          explanation: "Основната идея е за какво най-вече говори текстът. Всеки абзац или текст има по една основна идея. Допълнителните детайли са факти или примери, обясняващи основната идея. Питай се: 'За какво говори авторът основно?' Основната идея често е в първото или последното изречение.",
          examples: [
            { problem: "Прочети: 'Кучетата са чудесни домашни любимци. Те са верни, забавни и пазят стопаните си.' Коя е основната идея?", solution: "Кучетата са чудесни домашни любимци — останалите изречения са допълнителни детайли.", hint: "Първото изречение обикновено съдържа основната идея." },
            { problem: "Какво е 'допълнителен детайл'?", solution: "Факт или пример, даващ повече информация за основната идея.", hint: "Допълнителните детайли отговарят на: Защо? Как? Какви доказателства?" },
            { problem: "Прочети: 'Лъвовете живеят в Африка. Те ловуват в групи. Те са царете на саваната.' Коя е основната идея?", solution: "Лъвовете са мощни животни, живеещи и ловуващи заедно в Африка.", hint: "Комбинирай идеите: Където живеят? Как се държат?" },
          ],
          tip: "🔍 Питай се: 'За какво е ОСНОВНО текстът?' — това е основната идея!",
        },
        high: {
          title: "Основна идея и тема",
          explanation: "Основната идея е централната мисъл на нехудожествен текст. Темата е скритото послание на разказ или стихотворение (например: приятелство, смелост, честност). За да намериш темата, питай: 'Какъв урок научава героят?' или 'Какво послание иска да сподели авторът?'",
          examples: [
            { problem: "Разказ: Лисица се опитва многократно да стигне грозде, не успява и казва 'Те вероятно са кисели.' Коя е темата?", solution: "Хората понякога намират оправдания при провал вместо честно да го признаят.", hint: "Какъв урок/истина показва тази история за човешкото поведение?" },
            { problem: "Разлика между основна идея и тема?", solution: "Основна идея: какво казва текстът. Тема: какво означава текстът (житейски урок или послание).", hint: "Основната идея е явна; темата е урокът, до който стигаш сам." },
            { problem: "Намери темата: Костенурка побеждава заек в надбягване, като върви бавно и упорито.", solution: "Тема: постоянството и усърдието побеждават скоростта и самоувереността.", hint: "Какъв житейски урок преподава тази позната история?" },
          ],
          tip: "🌟 Основна идея = какво казва текстът. Тема = какво означава (по-дълбокото послание).",
        },
      },
      es: {
        low: {
          title: "Encontrar la idea principal",
          explanation: "La idea principal es de qué trata principalmente un texto. Cada párrafo o pasaje tiene una idea principal. Los detalles de apoyo son hechos o ejemplos que explican o prueban la idea principal. Pregúntate: '¿De qué habla principalmente el autor?' La idea principal suele estar en la primera o última oración.",
          examples: [
            { problem: "Lee: 'Los perros son mascotas estupendas. Son leales, divertidos y protegen a sus dueños.' ¿Cuál es la idea principal?", solution: "Los perros son mascotas estupendas — las demás oraciones son detalles de apoyo.", hint: "La primera oración a menudo indica la idea principal. Las demás la explican." },
            { problem: "¿Qué es un 'detalle de apoyo'?", solution: "Un hecho o ejemplo que da más información sobre la idea principal.", hint: "Los detalles de apoyo responden: ¿Por qué? ¿Cómo? ¿Qué evidencia?" },
            { problem: "Lee: 'Los leones viven en África. Cazan en grupos llamados manadas. Son los reyes de la sabana.' ¿Cuál es la idea principal?", solution: "Los leones son animales poderosos que viven y cazan en grupos en África.", hint: "Combina las ideas: ¿Dónde viven? ¿Cómo se comportan?" },
          ],
          tip: "🔍 ¡Pregunta: '¿De qué trata PRINCIPALMENTE?' — ¡esa es la idea principal!",
        },
        high: {
          title: "Idea principal y tema",
          explanation: "La idea principal es el punto central de un texto no ficticio. El tema es el mensaje subyacente de una historia o poema (p. ej.: amistad, valentía, honestidad). Para encontrar el tema, pregunta: '¿Qué aprende el personaje?' o '¿Qué mensaje quiere transmitir el autor?'",
          examples: [
            { problem: "Una historia: Un zorro intenta alcanzar unas uvas muchas veces pero falla y dice 'Probablemente estaban agrias.' ¿Cuál es el tema?", solution: "Las personas a veces buscan excusas cuando fracasan en lugar de aceptar el fracaso honestamente.", hint: "¿Qué lección o verdad muestra esta historia sobre el comportamiento humano?" },
            { problem: "¿Diferencia entre idea principal y tema?", solution: "Idea principal: lo que dice el texto. Tema: lo que significa el texto (lección de vida o mensaje).", hint: "La idea principal es explícita; el tema es la lección que infières." },
            { problem: "Encuentra el tema: Una tortuga gana una carrera a un conejo siendo lenta y constante.", solution: "Tema: la perseverancia y constancia vencen a la velocidad y a la soberbia.", hint: "¿Qué lección de vida enseña esta historia tan conocida?" },
          ],
          tip: "🌟 Idea principal = lo que dice. Tema = lo que significa (la lección más profunda).",
        },
      },
    },

    /* ── READING LITERATURE / CHARACTERS ── */
    "reading-literature/characters": {
      en: {
        low: {
          title: "Story Characters",
          explanation: "Characters are the people or animals in a story. The main character (protagonist) is the one the story is mostly about. Characters have traits — qualities that describe what they are like: brave, kind, selfish, clever. We learn about characters from what they say, do, and think.",
          examples: [
            { problem: "In 'Little Red Riding Hood', who is the protagonist?", solution: "Little Red Riding Hood — the story is mostly about her journey.", hint: "The protagonist is the main character the story follows." },
            { problem: "Read: 'Tom always helped his classmates with homework and shared his lunch.' What character trait does Tom show?", solution: "Kindness / generosity — he helps others and shares.", hint: "Character traits: what does the character DO that tells you what they're LIKE?" },
            { problem: "How do we learn about a character's personality?", solution: "From what they say (dialogue), what they do (actions), and what they think (thoughts).", hint: "Author's method: show, don't tell — actions reveal character." },
          ],
          tip: "👀 Watch what characters DO — actions reveal personality better than words!",
        },
        high: {
          title: "Character Development",
          explanation: "Characters change as a story progresses — this is called character development. A round character is complex and realistic (has strengths and flaws). A flat character has only one or two traits and does not change. The protagonist faces a conflict; how they respond reveals their character. Characters can be compared using Venn diagrams.",
          examples: [
            { problem: "What is the difference between a round and flat character?", solution: "Round: complex, changes, has many traits (like a real person). Flat: simple, unchanging, one-dimensional (often a minor character).", hint: "Round = 3D person. Flat = cardboard cutout." },
            { problem: "In a story, a shy girl speaks up to stop bullying. What type of character change is this?", solution: "Positive character development — she overcomes her shyness to show courage.", hint: "How does the character CHANGE from beginning to end?" },
            { problem: "Compare two characters: Hero A is brave but reckless; Hero B is cautious but lacks confidence. What do they have in common?", solution: "Both have a strength paired with a weakness — both are round/complex characters.", hint: "Round characters have both strengths AND flaws." },
          ],
          tip: "📊 Compare characters with: How are they alike? How are they different? How do they change?",
        },
      },
      bg: {
        low: {
          title: "Герои в разказа",
          explanation: "Героите са хората или животните в разказа. Главният герой (протагонист) е този, за когото разказът е основно. Героите имат черти — качества, описващи какви са: смел, добър, егоистичен, умен. Научаваме за героите от това, което казват, правят и мислят.",
          examples: [
            { problem: "В 'Червената шапчица' кой е протагонистът?", solution: "Червената шапчица — разказът е основно за нейното пътуване.", hint: "Протагонистът е главният герой, когото следваме." },
            { problem: "Прочети: 'Том винаги помагаше на съучениците си и споделяше обяда си.' Каква черта показва Том?", solution: "Доброта/щедрост — помага на другите и споделя.", hint: "Черти на характера: Какво ПРАВИ героят, което ни казва какъв е?" },
            { problem: "Как научаваме за личността на героя?", solution: "От това, което казва (диалог), прави (действия) и мисли.", hint: "Методът на автора: показвай, а не казвай — действията разкриват характера." },
          ],
          tip: "👀 Гледай какво ПРАВЯТ героите — действията разкриват личността по-добре от думите!",
        },
        high: {
          title: "Развитие на героя",
          explanation: "Героите се променят в хода на разказа — това се нарича развитие на образа. Обемният образ е сложен и реалистичен (има силни страни и слабости). Плоският образ има само една-две черти и не се променя. Протагонистът среща конфликт; начинът му на реакция разкрива характера му.",
          examples: [
            { problem: "Каква е разликата между обемен и плосък образ?", solution: "Обемен: сложен, променя се, има много черти (като истински човек). Плосък: прост, непроменящ се, еднопластов.", hint: "Обемен = 3D личност. Плосък = картонена фигура." },
            { problem: "В разказ, срамежливо момиче проговаря, за да спре тормоза. Какъв вид развитие е това?", solution: "Положително развитие на характера — тя преодолява срамежливостта, за да прояви смелост.", hint: "Как героят се ИЗМЕНЯ от началото до края?" },
            { problem: "Сравни двама герои: Герой А е смел, но безразсъден; Герой Б е внимателен, но не му достига увереност. Какво е общото им?", solution: "И двамата имат силна страна плюс слабост — и двамата са обемни/сложни образи.", hint: "Обемните образи имат и предимства, И недостатъци." },
          ],
          tip: "📊 Сравни героите: По какво си приличат? По какво се различават? Как се променят?",
        },
      },
      es: {
        low: {
          title: "Personajes de la historia",
          explanation: "Los personajes son las personas o animales de una historia. El personaje principal (protagonista) es aquel sobre quien trata principalmente la historia. Los personajes tienen rasgos — cualidades que describen cómo son: valiente, amable, egoísta, inteligente. Aprendemos sobre los personajes por lo que dicen, hacen y piensan.",
          examples: [
            { problem: "En 'Caperucita Roja', ¿quién es el protagonista?", solution: "Caperucita Roja — la historia trata principalmente sobre su viaje.", hint: "El protagonista es el personaje principal que seguimos." },
            { problem: "Lee: 'Tomás siempre ayudaba a sus compañeros con los deberes y compartía su almuerzo.' ¿Qué rasgo muestra Tomás?", solution: "Bondad / generosidad — ayuda a los demás y comparte.", hint: "Rasgos de carácter: ¿Qué HACE el personaje que nos dice cómo ES?" },
            { problem: "¿Cómo aprendemos sobre la personalidad de un personaje?", solution: "Por lo que dice (diálogo), hace (acciones) y piensa (pensamientos).", hint: "Método del autor: mostrar, no contar — las acciones revelan el carácter." },
          ],
          tip: "👀 ¡Observa lo que HACEN los personajes — las acciones revelan la personalidad mejor que las palabras!",
        },
        high: {
          title: "Desarrollo del personaje",
          explanation: "Los personajes cambian a medida que avanza la historia — esto se llama desarrollo del personaje. Un personaje redondo es complejo y realista (tiene fortalezas y defectos). Un personaje plano tiene uno o dos rasgos y no cambia. El protagonista enfrenta un conflicto; su respuesta revela su carácter.",
          examples: [
            { problem: "¿Cuál es la diferencia entre un personaje redondo y uno plano?", solution: "Redondo: complejo, cambia, tiene muchos rasgos (como una persona real). Plano: simple, no cambia, unidimensional.", hint: "Redondo = persona 3D. Plano = recorte de cartón." },
            { problem: "En una historia, una niña tímida habla para detener el acoso. ¿Qué tipo de cambio es este?", solution: "Desarrollo positivo del personaje — supera su timidez para mostrar valentía.", hint: "¿Cómo CAMBIA el personaje del principio al final?" },
            { problem: "Compara dos personajes: Héroe A es valiente pero imprudente; Héroe B es cauteloso pero le falta confianza. ¿Qué tienen en común?", solution: "Ambos tienen una fortaleza junto con una debilidad — ambos son personajes redondos/complejos.", hint: "Los personajes redondos tienen tanto fortalezas COMO defectos." },
          ],
          tip: "📊 Compara personajes con: ¿En qué se parecen? ¿En qué se diferencian? ¿Cómo cambian?",
        },
      },
    },

    /* ── READING LITERATURE / RETELLING ── */
    "reading-literature/retelling": {
      en: {
        low: {
          title: "Retelling a Story",
          explanation: "Retelling means telling a story again in your own words. A good retelling includes: who the characters are, where and when the story happens (setting), what the problem is (conflict), what happens (events in order), and how the problem is solved (resolution). Use sequence words: first, then, next, after that, finally.",
          examples: [
            { problem: "What are the 5 key elements to include in a story retelling?", solution: "1. Characters 2. Setting 3. Problem/conflict 4. Events in order 5. Resolution/ending", hint: "Think: Who? Where/When? Problem? What happened? How did it end?" },
            { problem: "Use 'first, then, finally' to retell: Goldilocks enters the house, eats porridge, and falls asleep.", solution: "First, Goldilocks entered the house. Then she ate the porridge. Finally, she fell asleep.", hint: "Sequence words: first, next, then, after that, finally." },
            { problem: "What is the 'resolution' of a story?", solution: "The resolution is how the problem is solved at the end of the story.", hint: "Resolution = the ending where things are sorted out." },
          ],
          tip: "📖 Use 5 fingers: Who? Where? Problem? Events? How did it end? — one finger per retelling element!",
        },
        high: {
          title: "Retelling and Summarising",
          explanation: "Retelling includes all key details; summarising focuses only on the most important points. A summary answers: What happened? Why did it matter? A good retelling uses sequence words and own language (not copied sentences). When retelling non-fiction, focus on main idea + 3 key facts.",
          examples: [
            { problem: "Difference between retelling and summarising?", solution: "Retelling: includes characters, setting, events, resolution in detail. Summarising: shorter — only the most important points, no small details.", hint: "Retell = full story. Summarise = key points only." },
            { problem: "Summarise in 2 sentences: 'The tortoise challenged the hare to a race. The hare was faster but napped. The tortoise kept going and won.'", solution: "A tortoise and hare raced. The hare lost because he napped, while the slow tortoise kept going and won.", hint: "Keep: who, what happened, result. Remove: small details." },
            { problem: "Retell a non-fiction text about bees in 3 sentences.", solution: "Example: Bees are insects that live in hives and make honey. Worker bees collect nectar from flowers and bring it back to the hive. Bees are important because they pollinate plants.", hint: "Main idea + 2 supporting facts." },
          ],
          tip: "✂️ Summarise = cut the story to its skeleton: main characters + main event + result.",
        },
      },
      bg: {
        low: {
          title: "Преразказ",
          explanation: "Преразказът означава разказване на история отново със свои думи. Добрият преразказ включва: кои са героите, къде и кога се развива (обстановка), какъв е проблемът (конфликт), какво се случва (събитията по ред) и как проблемът се решава (развръзка). Ползвай думи за последователност: първо, после, накрая.",
          examples: [
            { problem: "Кои са 5-те ключови елемента на преразказа?", solution: "1. Герои 2. Обстановка 3. Проблем/конфликт 4. Събития по ред 5. Развръзка/край", hint: "Мисли: Кой? Къде/Кога? Проблем? Какво стана? Как свърши?" },
            { problem: "Ползвай 'първо, после, накрая' за преразказ: Жълтокосата влиза в къщата, яде каша, заспива.", solution: "Първо, Жълтокосата влезе в къщата. После изяде кашата. Накрая заспа.", hint: "Думи за последователност: първо, после, тогава, накрая." },
            { problem: "Какво е 'развръзка' на разказ?", solution: "Развръзката е как проблемът се решава в края на разказа.", hint: "Развръзка = краят, в който нещата се наредват." },
          ],
          tip: "📖 Ползвай 5 пръста: Кой? Къде? Проблем? Събития? Как свърши? — по един пръст за всеки елемент!",
        },
        high: {
          title: "Преразказ и резюме",
          explanation: "Преразказът включва всички ключови детайли; резюмето се фокусира само върху най-важните моменти. Резюмето отговаря: Какво стана? Защо е важно? Добрият преразказ ползва думи за последователност и собствен език.",
          examples: [
            { problem: "Разлика между преразказ и резюме?", solution: "Преразказ: включва герои, обстановка, събития, развръзка в детайли. Резюме: по-кратко — само най-важните моменти, без малки детайли.", hint: "Преразказ = пълна история. Резюме = само ключовите моменти." },
            { problem: "Резюмирай в 2 изречения: 'Костенурката предизвика заека. Заекът беше по-бърз, но задряма. Костенурката вървеше и спечели.'", solution: "Костенурка и заек се надбягаха. Заекът загуби, защото задряма, а бавната костенурка продължи и спечели.", hint: "Запази: кой, какво стана, резултат. Извади: малките детайли." },
            { problem: "Преразкажи нехудожествен текст за пчелите в 3 изречения.", solution: "Пчелите са насекоми, живеещи в кошери и произвеждащи мед. Работничките събират нектар от цветя и го донасят в кошера. Пчелите са важни, защото опрашват растенията.", hint: "Основна идея + 2 допълнителни факта." },
          ],
          tip: "✂️ Резюме = съкрати историята до скелета: главни герои + главно събитие + резултат.",
        },
      },
      es: {
        low: {
          title: "Resumen oral",
          explanation: "Hacer un resumen oral significa contar una historia otra vez con tus propias palabras. Un buen resumen incluye: quiénes son los personajes, dónde y cuándo ocurre (escenario), cuál es el problema (conflicto), qué sucede (eventos en orden) y cómo se resuelve el problema (resolución). Usa palabras de secuencia: primero, luego, después, finalmente.",
          examples: [
            { problem: "¿Cuáles son los 5 elementos clave de un resumen oral?", solution: "1. Personajes 2. Escenario 3. Problema/conflicto 4. Eventos en orden 5. Resolución/final", hint: "Piensa: ¿Quién? ¿Dónde/Cuándo? ¿Problema? ¿Qué pasó? ¿Cómo terminó?" },
            { problem: "Usa 'primero, luego, finalmente' para resumir: Rizos de Oro entra en la casa, come papilla y se queda dormida.", solution: "Primero, Rizos de Oro entró en la casa. Luego comió la papilla. Finalmente, se quedó dormida.", hint: "Palabras de secuencia: primero, luego, después, por último, finalmente." },
            { problem: "¿Qué es la 'resolución' de una historia?", solution: "La resolución es cómo se resuelve el problema al final de la historia.", hint: "Resolución = el final donde todo se arregla." },
          ],
          tip: "📖 ¡Usa 5 dedos: ¿Quién? ¿Dónde? ¿Problema? ¿Eventos? ¿Cómo terminó? — ¡un dedo por elemento!",
        },
        high: {
          title: "Resumen oral y escrito",
          explanation: "El resumen oral incluye todos los detalles clave; el resumen escrito se centra solo en los puntos más importantes. Un resumen responde: ¿Qué pasó? ¿Por qué importó? Un buen resumen usa palabras de secuencia y lenguaje propio.",
          examples: [
            { problem: "¿Diferencia entre resumen oral y resumen escrito?", solution: "Resumen oral: incluye personajes, escenario, eventos, resolución en detalle. Resumen escrito: más corto — solo los puntos más importantes.", hint: "Oral = historia completa. Escrito = puntos clave." },
            { problem: "Resume en 2 oraciones: 'La tortuga desafió a la liebre a una carrera. La liebre era más rápida pero se echó una siesta. La tortuga siguió y ganó.'", solution: "Una tortuga y una liebre compitieron en una carrera. La liebre perdió porque se durmió, mientras la lenta tortuga siguió adelante y ganó.", hint: "Conserva: quién, qué pasó, resultado. Elimina: detalles menores." },
            { problem: "Resume un texto de no ficción sobre las abejas en 3 oraciones.", solution: "Las abejas son insectos que viven en colmenas y hacen miel. Las abejas obreras recogen néctar de flores y lo traen a la colmena. Las abejas son importantes porque polinizan las plantas.", hint: "Idea principal + 2 hechos de apoyo." },
          ],
          tip: "✂️ Resumir = reducir la historia a su esqueleto: personajes principales + evento principal + resultado.",
        },
      },
    },
  };

  // Fallback for topics not fully authored
  const fallbackText: TopicText = {
    title: topicId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    explanation: lang === "bg"
      ? "Тази тема е подходяща за вашия клас и ще ви помогне да научите нови неща. Питай AYA за помощ!"
      : lang === "es"
      ? "Este tema es adecuado para tu curso y te ayudará a aprender cosas nuevas. ¡Pregunta a AYA!"
      : "This topic is suitable for your grade and will help you learn new things. Ask AYA for help!",
    examples: [
      { problem: "?", solution: "Ask AYA", hint: "Type your question in the chat!" },
    ],
    tip: lang === "bg" ? "💬 Питай AYA за повече примери и обяснения!" : lang === "es" ? "💬 ¡Pregunta a AYA por más ejemplos!" : "💬 Ask AYA for more examples and explanations!",
  };

  return content[key]?.[lang]?.[b] ?? fallbackText;
}

/* ─── Instructions (localised) ────────────────────────────────── */

function practiceInstructions(lang: LangCode): string {
  if (lang === "bg") return "Реши следните задачи. Напиши отговора си и провери!";
  if (lang === "es") return "Resuelve los siguientes ejercicios. ¡Escribe tu respuesta y comprueba!";
  return "Solve the following problems. Write your answer and check!";
}

function quizInstructions(lang: LangCode): string {
  if (lang === "bg") return "Избери верния отговор за всеки въпрос. Успех!";
  if (lang === "es") return "Elige la respuesta correcta para cada pregunta. ¡Buena suerte!";
  return "Choose the correct answer for each question. Good luck!";
}

/* ─── Non-math practice (text-based Q&A) ─────────────────────── */

function textPractice(topicId: string, lang: LangCode, grade: number): Array<{ question: string; answer: string }> {
  const b = band(grade);
  // Pull from lesson examples converted into Q&A
  const key = topicId;
  const pools: Record<string, Record<LangCode, Array<{ question: string; answer: string }>>> = {
    alphabet: {
      en: [
        { question: "What sound does the letter 'А' make?", answer: "/a/" },
        { question: "What sound does the letter 'Б' make?", answer: "/b/" },
        { question: "What sound does 'В' make?", answer: "/v/" },
        { question: "How many letters are in the Bulgarian alphabet?", answer: "30" },
        { question: "What is the Bulgarian alphabet script called?", answer: "Cyrillic" },
      ],
      bg: [
        { question: "Какъв звук издава буквата 'А'?", answer: "/а/" },
        { question: "Какъв звук издава буквата 'Б'?", answer: "/б/" },
        { question: "Колко букви има в българската азбука?", answer: "30" },
        { question: "Как се казва българската азбука?", answer: "Кирилица" },
        { question: "Какъв звук издава буквата 'В'?", answer: "/в/" },
      ],
      es: [
        { question: "¿Qué sonido hace la letra 'А'?", answer: "/a/" },
        { question: "¿Cuántas letras tiene el alfabeto búlgaro?", answer: "30" },
        { question: "¿Cómo se llama el alfabeto búlgaro?", answer: "Cirílico" },
        { question: "¿Qué sonido hace la letra 'Б'?", answer: "/b/" },
        { question: "¿Qué sonido hace la letra 'В'?", answer: "/v/" },
      ],
    },
    patterns: {
      en: [
        { question: "What comes next? 2, 4, 6, 8, __", answer: "10" },
        { question: "What comes next? 5, 10, 15, 20, __", answer: "25" },
        { question: "What comes next? 1, 4, 9, 16, __", answer: "25" },
        { question: "What comes next? 3, 6, 9, 12, __", answer: "15" },
        { question: "What comes next? 100, 90, 80, 70, __", answer: "60" },
      ],
      bg: [
        { question: "Какво следва? 2, 4, 6, 8, __", answer: "10" },
        { question: "Какво следва? 5, 10, 15, 20, __", answer: "25" },
        { question: "Какво следва? 1, 4, 9, 16, __", answer: "25" },
        { question: "Какво следва? 3, 6, 9, 12, __", answer: "15" },
        { question: "Какво следва? 100, 90, 80, 70, __", answer: "60" },
      ],
      es: [
        { question: "¿Qué sigue? 2, 4, 6, 8, __", answer: "10" },
        { question: "¿Qué sigue? 5, 10, 15, 20, __", answer: "25" },
        { question: "¿Qué sigue? 1, 4, 9, 16, __", answer: "25" },
        { question: "¿Qué sigue? 3, 6, 9, 12, __", answer: "15" },
        { question: "¿Qué sigue? 100, 90, 80, 70, __", answer: "60" },
      ],
    },
    plants: {
      en: [
        { question: "What do roots absorb from the soil?", answer: "water and minerals" },
        { question: "What green pigment is in leaves?", answer: "chlorophyll" },
        { question: "What gas do plants release during photosynthesis?", answer: "oxygen" },
        { question: "What do plants use sunlight for?", answer: "to make food (photosynthesis)" },
        { question: "Name one part of a plant.", answer: "root / stem / leaf / flower" },
      ],
      bg: [
        { question: "Какво поемат корените от почвата?", answer: "вода и минерали" },
        { question: "Кой зелен пигмент се намира в листата?", answer: "хлорофил" },
        { question: "Какъв газ отделят растенията по време на фотосинтезата?", answer: "кислород" },
        { question: "За какво използват растенията слънчевата светлина?", answer: "за фотосинтеза (правят храна)" },
        { question: "Назови една част на растение.", answer: "корен / стъбло / лист / цвят" },
      ],
      es: [
        { question: "¿Qué absorben las raíces del suelo?", answer: "agua y minerales" },
        { question: "¿Qué pigmento verde hay en las hojas?", answer: "clorofila" },
        { question: "¿Qué gas liberan las plantas en la fotosíntesis?", answer: "oxígeno" },
        { question: "¿Para qué usan las plantas la luz solar?", answer: "para hacer alimento (fotosíntesis)" },
        { question: "Nombra una parte de una planta.", answer: "raíz / tallo / hoja / flor" },
      ],
    },
    vocabulary: {
      en: [
        { question: "What does 'home' mean?", answer: "a place where you live" },
        { question: "What does 'friend' mean?", answer: "someone you like and enjoy being with" },
        { question: "What does 'learn' mean?", answer: "to get new knowledge or skill" },
        { question: "What does prefix 'un-' mean?", answer: "not" },
        { question: "What does the root 'graph' mean?", answer: "write" },
      ],
      bg: [
        { question: "Какво означава 'home'?", answer: "дом" },
        { question: "Какво означава 'friend'?", answer: "приятел" },
        { question: "Какво означава 'learn'?", answer: "уча" },
        { question: "Какво означава представката 'un-'?", answer: "не-" },
        { question: "Какво означава коренът 'graph'?", answer: "пиша" },
      ],
      es: [
        { question: "¿Qué significa 'home'?", answer: "hogar" },
        { question: "¿Qué significa 'friend'?", answer: "amigo/a" },
        { question: "¿Qué significa 'learn'?", answer: "aprender" },
        { question: "¿Qué significa el prefijo 'un-'?", answer: "no" },
        { question: "¿Qué significa la raíz 'graph'?", answer: "escribir" },
      ],
    },
    "word-problems": {
      en: [
        { question: "Maria has 8 apples. She gives 3 away. How many left?", answer: "5" },
        { question: "There are 4 children. Each gets 2 cookies. Total?", answer: "8" },
        { question: "Jon has 15 stickers and buys 5 more. Total?", answer: "20" },
        { question: "A store has 48 apples in 6 baskets. Per basket?", answer: "8" },
        { question: "Tom reads 12 pages daily for 5 days, then 3 more. Total?", answer: "63" },
      ],
      bg: [
        { question: "Мария има 8 ябълки. Дава 3 на приятелка. Колко остават?", answer: "5" },
        { question: "Има 4 деца. Всяко получава 2 бисквитки. Общо?", answer: "8" },
        { question: "Йон има 15 стикера и купува 5 повече. Общо?", answer: "20" },
        { question: "Магазин има 48 ябълки в 6 кошници. По колко в кошница?", answer: "8" },
        { question: "Том чита 12 страни дневно за 5 дни, после 3 повече. Общо?", answer: "63" },
      ],
      es: [
        { question: "María tiene 8 manzanas. Le da 3. ¿Cuántas le quedan?", answer: "5" },
        { question: "Hay 4 niños. Cada uno recibe 2 galletas. ¿Total?", answer: "8" },
        { question: "Jon tiene 15 pegatinas y compra 5 más. ¿Total?", answer: "20" },
        { question: "Una tienda tiene 48 manzanas en 6 canastas. ¿Por canasta?", answer: "8" },
        { question: "Tom lee 12 páginas diarias durante 5 días, luego 3 más. ¿Total?", answer: "63" },
      ],
    },
    reading: {
      en: [
        { question: "What is the main topic of a story called?", answer: "the main idea or theme" },
        { question: "Who are the people in a story called?", answer: "characters" },
        { question: "Where and when a story happens is called?", answer: "the setting" },
        { question: "What happens in a story is called?", answer: "the plot" },
        { question: "What should you do if you don't understand a sentence?", answer: "reread it" },
      ],
      bg: [
        { question: "Как се казва основната идея на разказ?", answer: "тема или главна идея" },
        { question: "Как се казват хората в разказа?", answer: "герои" },
        { question: "Как се казва къде и кога се случва разказа?", answer: "обстановка" },
        { question: "Как се казва това, което се случва в разказа?", answer: "сюжет" },
        { question: "Какво трябва да направиш, ако не разбираш изречение?", answer: "прочети го отново" },
      ],
      es: [
        { question: "¿Cómo se llama la idea principal de una historia?", answer: "el tema o la idea principal" },
        { question: "¿Cómo se llaman las personas en una historia?", answer: "personajes" },
        { question: "¿Cómo se llama dónde y cuándo sucede una historia?", answer: "el escenario" },
        { question: "¿Cómo se llama lo que sucede en una historia?", answer: "la trama" },
        { question: "¿Qué deberías hacer si no entiendes una oración?", answer: "releerla" },
      ],
    },
    writing: {
      en: [
        { question: "What is a group of words that expresses a complete thought?", answer: "a sentence" },
        { question: "What comes at the end of a sentence?", answer: "a period (.) or punctuation" },
        { question: "What is a noun?", answer: "a person, place, or thing" },
        { question: "What is a verb?", answer: "an action word" },
        { question: "What is the first word of a sentence supposed to be?", answer: "capitalized" },
      ],
      bg: [
        { question: "Какво е група думи, която изразява пълна мисъл?", answer: "изречение" },
        { question: "Какво идва в края на изречението?", answer: "точка или пунктуация" },
        { question: "Какво е съществително?", answer: "човек, място или нещо" },
        { question: "Какво е глагол?", answer: "дейност или действие" },
        { question: "Първата дума на изречението трябва ли да бъде главна буква?", answer: "да" },
      ],
      es: [
        { question: "¿Qué es un grupo de palabras que expresa un pensamiento completo?", answer: "una oración" },
        { question: "¿Qué va al final de una oración?", answer: "un punto (.) o puntuación" },
        { question: "¿Qué es un sustantivo?", answer: "una persona, lugar o cosa" },
        { question: "¿Qué es un verbo?", answer: "una palabra de acción" },
        { question: "¿Se debe capitalizar la primera palabra de una oración?", answer: "sí" },
      ],
    },
    grammar: {
      en: [
        { question: "How many genders are in Bulgarian nouns?", answer: "three: masculine, feminine, neuter" },
        { question: "What must agree with a noun in gender?", answer: "adjectives and articles" },
        { question: "What is a word that describes a noun called?", answer: "an adjective" },
        { question: "How many main tenses are in Bulgarian?", answer: "three: present, past, future" },
        { question: "When a sentence begins, what must you use?", answer: "a capital letter" },
      ],
      bg: [
        { question: "Колко рода имат българските съществителни?", answer: "три: мъжки, женски, среден" },
        { question: "Какво трябва да се съгласува със съществително по род?", answer: "прилагателни и артикли" },
        { question: "Как се казва дума, която описва съществително?", answer: "прилагателно" },
        { question: "Колко основни времена има в български?", answer: "три: настояще, минало, бъдеще" },
        { question: "Какво използваш в началото на изречение?", answer: "главна буква" },
      ],
      es: [
        { question: "¿Cuántos géneros tienen los sustantivos búlgaros?", answer: "tres: masculino, femenino, neutro" },
        { question: "¿Qué debe concordar con un sustantivo en género?", answer: "adjetivos y artículos" },
        { question: "¿Cómo se llama una palabra que describe un sustantivo?", answer: "un adjetivo" },
        { question: "¿Cuántos tiempos principales hay en búlgaro?", answer: "tres: presente, pasado, futuro" },
        { question: "¿Qué debes usar al comenzar una oración?", answer: "una letra mayúscula" },
      ],
    },
    stories: {
      en: [
        { question: "What are the people in a story called?", answer: "characters" },
        { question: "What is the problem in a story called?", answer: "conflict" },
        { question: "What is the lesson in a story called?", answer: "theme or moral" },
        { question: "What are the beginning, middle, and end called?", answer: "plot" },
        { question: "What do you call where and when a story happens?", answer: "setting" },
      ],
      bg: [
        { question: "Как се казват хората в разказа?", answer: "герои" },
        { question: "Как се казва проблемът в разказа?", answer: "конфликт" },
        { question: "Как се казва урокът в разказа?", answer: "тема или мораль" },
        { question: "Как се казва началото, средината и краят?", answer: "сюжет" },
        { question: "Как се казва къде и кога се случва разказа?", answer: "обстановка" },
      ],
      es: [
        { question: "¿Cómo se llaman las personas en una historia?", answer: "personajes" },
        { question: "¿Cómo se llama el problema en una historia?", answer: "conflicto" },
        { question: "¿Cómo se llama la lección en una historia?", answer: "tema o moraleja" },
        { question: "¿Cómo se llaman el principio, el medio y el final?", answer: "trama" },
        { question: "¿Cómo se llama dónde y cuándo sucede una historia?", answer: "escenario" },
      ],
    },
    comprehension: {
      en: [
        { question: "What should you ask while reading a text?", answer: "Who, What, Where, When, Why" },
        { question: "What is understanding what you read called?", answer: "comprehension" },
        { question: "What is figuring out information not directly stated called?", answer: "inference" },
        { question: "What is the biggest, most important point in a text called?", answer: "the main idea" },
        { question: "What should you do if you don't understand a sentence?", answer: "reread it" },
      ],
      bg: [
        { question: "Какво трябва да задаваш докато четеш?", answer: "Кой, Какво, Къде, Кога, Защо" },
        { question: "Как се казва разбирането на това, което четеш?", answer: "разбиране" },
        { question: "Как се казва разбиране на информация, която не е казана пряко?", answer: "интуиция" },
        { question: "Как се казва най-голямата, най-важна точка в текста?", answer: "главна идея" },
        { question: "Какво трябва да направиш, ако не разбираш изречение?", answer: "прочети го отново" },
      ],
      es: [
        { question: "¿Qué deberías preguntar mientras lees?", answer: "Quién, Qué, Dónde, Cuándo, Por qué" },
        { question: "¿Cómo se llama entender lo que lees?", answer: "comprensión" },
        { question: "¿Cómo se llama deducir información no dicha directamente?", answer: "inferencia" },
        { question: "¿Cómo se llama el punto más grande e importante de un texto?", answer: "la idea principal" },
        { question: "¿Qué deberías hacer si no entiendes una oración?", answer: "releerla" },
      ],
    },
    puzzles: {
      en: [
        { question: "I have 2 legs in the morning, 4 at noon, 3 in the evening. What am I?", answer: "a person" },
        { question: "Which is heavier: 1 kg of feathers or 1 kg of iron?", answer: "they weigh the same" },
        { question: "There are 3 apples. You take 2. How many do YOU have?", answer: "2" },
        { question: "All cats are animals. Whiskers is a cat. What is Whiskers?", answer: "an animal" },
        { question: "A man has 3 daughters. Each daughter has 1 brother. How many children total?", answer: "4" },
      ],
      bg: [
        { question: "Сутринта имам 2 крака, на обед — 4, вечер — 3. Какво съм?", answer: "човек" },
        { question: "Кое е по-тежко: 1 кг перушина или 1 кг желязо?", answer: "еднакво тежки" },
        { question: "Има 3 ябълки. Ти вземаш 2. Колко ТИ имаш?", answer: "2" },
        { question: "Всички котки са животни. Мишка е котка. Какво е Мишка?", answer: "животно" },
        { question: "Мъж има 3 дъщери. Всяка дъщеря има 1 брат. Колко деца общо?", answer: "4" },
      ],
      es: [
        { question: "Por la mañana tengo 2 patas, al mediodía 4 y por la noche 3. ¿Qué soy?", answer: "una persona" },
        { question: "¿Qué pesa más: 1 kg de plumas o 1 kg de hierro?", answer: "pesan lo mismo" },
        { question: "Hay 3 manzanas. Tomas 2. ¿Cuántas TIENES TÚ?", answer: "2" },
        { question: "Todos los gatos son animales. Bigotes es un gato. ¿Qué es Bigotes?", answer: "un animal" },
        { question: "Un hombre tiene 3 hijas. Cada hija tiene 1 hermano. ¿Cuántos hijos en total?", answer: "4" },
      ],
    },
    animals: {
      en: [
        { question: "What do herbivores eat?", answer: "only plants" },
        { question: "Name one mammal that lives in water.", answer: "dolphin / whale / seal" },
        { question: "What makes mammals unique?", answer: "warm-blooded, have fur, feed young with milk" },
        { question: "Are fish vertebrates or invertebrates?", answer: "vertebrates" },
        { question: "What is an example of an invertebrate?", answer: "insect / spider / worm / jellyfish" },
      ],
      bg: [
        { question: "Какво ядат тревопасните?", answer: "само растения" },
        { question: "Назови един бозайник, живеещ във вода.", answer: "делфин / кит / тюлен" },
        { question: "Какво прави бозайниците уникални?", answer: "топлокръвни, козина, кърмят малките" },
        { question: "Рибите гръбначни или безгръбначни ли са?", answer: "гръбначни" },
        { question: "Дай пример за безгръбначно животно.", answer: "насекомо / паяк / червей / медуза" },
      ],
      es: [
        { question: "¿Qué comen los herbívoros?", answer: "solo plantas" },
        { question: "Nombra un mamífero que viva en el agua.", answer: "delfín / ballena / foca" },
        { question: "¿Qué hace únicos a los mamíferos?", answer: "sangre caliente, pelo, alimentan crías con leche" },
        { question: "¿Los peces son vertebrados o invertebrados?", answer: "vertebrados" },
        { question: "Da un ejemplo de invertebrado.", answer: "insecto / araña / gusano / medusa" },
      ],
    },
    earth: {
      en: [
        { question: "Name the four seasons.", answer: "spring, summer, autumn, winter" },
        { question: "What covers most of Earth's surface?", answer: "water (oceans)" },
        { question: "What causes day and night?", answer: "Earth rotating on its axis" },
        { question: "Name the four layers of Earth from outside to centre.", answer: "crust, mantle, outer core, inner core" },
        { question: "What causes earthquakes?", answer: "movement of tectonic plates" },
      ],
      bg: [
        { question: "Назови четирите сезона.", answer: "пролет, лято, есен, зима" },
        { question: "Какво покрива по-голямата част от Земята?", answer: "вода (океани)" },
        { question: "Какво причинява ден и нощ?", answer: "въртенето на Земята около оста й" },
        { question: "Назови четирите слоя на Земята отвън към центъра.", answer: "земна кора, мантия, външно ядро, вътрешно ядро" },
        { question: "Какво причинява земетресенията?", answer: "движение на тектонски плочи" },
      ],
      es: [
        { question: "Nombra las cuatro estaciones.", answer: "primavera, verano, otoño, invierno" },
        { question: "¿Qué cubre la mayor parte de la Tierra?", answer: "agua (océanos)" },
        { question: "¿Qué causa el día y la noche?", answer: "la rotación de la Tierra sobre su eje" },
        { question: "Nombra las cuatro capas de la Tierra de afuera hacia el centro.", answer: "corteza, manto, núcleo externo, núcleo interno" },
        { question: "¿Qué causa los terremotos?", answer: "movimiento de las placas tectónicas" },
      ],
    },
    "simple-sentences": {
      en: [
        { question: "What two parts does every sentence need?", answer: "a subject and a verb" },
        { question: "What letter must start a sentence?", answer: "a capital letter" },
        { question: "What punctuation ends a statement?", answer: "a full stop (period)" },
        { question: "Which word joins two ideas with contrast: 'I was tired ___ I stayed up.'", answer: "but" },
        { question: "Name a subordinating conjunction.", answer: "because / when / although / before / after / if" },
      ],
      bg: [
        { question: "От какви две части се нуждае всяко изречение?", answer: "подлог и сказуемо" },
        { question: "С каква буква трябва да започва изречение?", answer: "главна буква" },
        { question: "Каква пунктуация завършва изявително изречение?", answer: "точка" },
        { question: "Коя дума свързва две идеи с контраст: 'Бях уморен ___ останах буден.'", answer: "но (but)" },
        { question: "Назови подчинителен съюз.", answer: "because / when / although / before / after / if" },
      ],
      es: [
        { question: "¿Qué dos partes necesita cada oración?", answer: "sujeto y verbo" },
        { question: "¿Con qué letra debe comenzar una oración?", answer: "mayúscula" },
        { question: "¿Qué signo de puntuación termina una afirmación?", answer: "punto final" },
        { question: "¿Qué palabra une dos ideas con contraste: 'Estaba cansado ___ me quedé despierto.'?", answer: "but (pero)" },
        { question: "Nombra una conjunción subordinante.", answer: "because / when / although / before / after / if" },
      ],
    },
    fractions: {
      en: [
        { question: "What does the denominator (bottom number) of a fraction tell us?", answer: "how many equal parts the whole is divided into" },
        { question: "Write 'one half' as a fraction.", answer: "1/2" },
        { question: "Which is bigger: 1/2 or 1/4?", answer: "1/2 — the more parts, the smaller each piece" },
        { question: "A pizza is cut into 4 slices and you eat 2. What fraction did you eat?", answer: "2/4 (or simplified: 1/2)" },
        { question: "What is the numerator in 3/5?", answer: "3 — the top number, showing how many parts you have" },
      ],
      bg: [
        { question: "Какво показва знаменателят (долното число) на дробта?", answer: "на колко равни части е разделено цялото" },
        { question: "Запиши 'една втора' като дроб.", answer: "1/2" },
        { question: "Кое е по-голямо: 1/2 или 1/4?", answer: "1/2 — колкото повече части, толкова по-малко е всяко парче" },
        { question: "Пица е разрязана на 4 парчета и изяждаш 2. Каква дроб изяде?", answer: "2/4 (или съкратено: 1/2)" },
        { question: "Какъв е числителят на 3/5?", answer: "3 — горното число, показващо колко части имаш" },
      ],
      es: [
        { question: "¿Qué nos dice el denominador (número de abajo) de una fracción?", answer: "en cuántas partes iguales está dividido el todo" },
        { question: "Escribe 'una mitad' como fracción.", answer: "1/2" },
        { question: "¿Cuál es mayor: 1/2 o 1/4?", answer: "1/2 — cuantas más partes, más pequeña es cada una" },
        { question: "Una pizza se corta en 4 trozos y comes 2. ¿Qué fracción comiste?", answer: "2/4 (o simplificado: 1/2)" },
        { question: "¿Cuál es el numerador en 3/5?", answer: "3 — el número de arriba, que muestra cuántas partes tienes" },
      ],
    },
    geometry: {
      en: [
        { question: "How many sides does a triangle have?", answer: "3 sides" },
        { question: "What shape has 4 equal sides and 4 right angles?", answer: "a square" },
        { question: "What is the perimeter of a square with sides 6 cm?", answer: "24 cm (4 × 6 = 24)" },
        { question: "Name a 3D shape that is perfectly round.", answer: "a sphere" },
        { question: "How is a square different from a rectangle?", answer: "all 4 sides are equal in a square; rectangles have 2 long and 2 short sides" },
      ],
      bg: [
        { question: "Колко страни има триъгълникът?", answer: "3 страни" },
        { question: "Коя фигура има 4 равни страни и 4 прави ъгъла?", answer: "квадрат" },
        { question: "Какъв е периметърът на квадрат със страна 6 см?", answer: "24 см (4 × 6 = 24)" },
        { question: "Назови 3D фигура, която е напълно кръгла.", answer: "сфера" },
        { question: "С какво се различава квадратът от правоъгълника?", answer: "в квадрата всичките 4 страни са равни; правоъгълникът има 2 дълги и 2 къси страни" },
      ],
      es: [
        { question: "¿Cuántos lados tiene un triángulo?", answer: "3 lados" },
        { question: "¿Qué figura tiene 4 lados iguales y 4 ángulos rectos?", answer: "un cuadrado" },
        { question: "¿Cuál es el perímetro de un cuadrado con lados de 6 cm?", answer: "24 cm (4 × 6 = 24)" },
        { question: "Nombra una figura 3D que sea perfectamente redonda.", answer: "una esfera" },
        { question: "¿En qué se diferencia un cuadrado de un rectángulo?", answer: "en un cuadrado todos los lados son iguales; un rectángulo tiene 2 lados largos y 2 cortos" },
      ],
    },
    measurement: {
      en: [
        { question: "How many centimetres are in 1 metre?", answer: "100 cm" },
        { question: "How many grams are in 1 kilogram?", answer: "1000 g" },
        { question: "A pencil is 18 cm. A pen is 14 cm. How much longer is the pencil?", answer: "4 cm (18 − 14 = 4)" },
        { question: "Convert 2 kg into grams.", answer: "2000 g (2 × 1000)" },
        { question: "A film starts at 3:00 and lasts 90 minutes. When does it end?", answer: "4:30 (3:00 + 90 min = 4:30)" },
      ],
      bg: [
        { question: "Колко сантиметра има в 1 метър?", answer: "100 см" },
        { question: "Колко грама има в 1 килограм?", answer: "1000 г" },
        { question: "Молив е 18 см, писалка е 14 см. С колко е по-дълъг моливът?", answer: "4 см (18 − 14 = 4)" },
        { question: "Преобразувай 2 кг в грамове.", answer: "2000 г (2 × 1000)" },
        { question: "Филм започва в 15:00 и трае 90 минути. Кога свършва?", answer: "16:30 (15:00 + 90 мин = 16:30)" },
      ],
      es: [
        { question: "¿Cuántos centímetros hay en 1 metro?", answer: "100 cm" },
        { question: "¿Cuántos gramos hay en 1 kilogramo?", answer: "1000 g" },
        { question: "Un lápiz mide 18 cm. Un bolígrafo mide 14 cm. ¿Cuánto más largo es el lápiz?", answer: "4 cm (18 − 14 = 4)" },
        { question: "Convierte 2 kg en gramos.", answer: "2000 g (2 × 1000)" },
        { question: "Una película empieza a las 15:00 y dura 90 minutos. ¿Cuándo termina?", answer: "16:30 (15:00 + 90 min = 16:30)" },
      ],
    },
    spelling: {
      en: [
        { question: "Should a person's name start with a capital or lowercase letter?", answer: "capital letter — e.g. 'Maria', not 'maria'" },
        { question: "Correct the spelling: 'ябалка'", answer: "'ябълка' — the middle vowel is 'ъ'" },
        { question: "Which letter is missing? 'ч_ша' (cup)", answer: "'а' → 'чаша'" },
        { question: "Should the first word of a sentence be capitalized?", answer: "Yes — always capitalize the first word of a sentence." },
        { question: "How do you check your spelling?", answer: "Read aloud slowly and listen to each sound; check a dictionary." },
      ],
      bg: [
        { question: "Трябва ли собственото лично име да е с главна или малка буква?", answer: "главна буква — напр. 'Мария', не 'мария'" },
        { question: "Поправи правописа: 'ябалка'", answer: "'ябълка' — средната гласна е 'ъ'" },
        { question: "Коя буква липсва? 'ч_ша' (cup)", answer: "'а' → 'чаша'" },
        { question: "Трябва ли първата дума на изречение да е с главна буква?", answer: "Да — винаги с главна." },
        { question: "Как проверяваш правописа?", answer: "Четеш на глас бавно и слушаш всеки звук; проверяваш в речник." },
      ],
      es: [
        { question: "¿El nombre de una persona empieza con mayúscula o minúscula?", answer: "mayúscula — p. ej. 'María', no 'maría'" },
        { question: "Corrige la ortografía: 'ябалка'", answer: "'ябълка' — la vocal del medio es 'ъ'" },
        { question: "¿Qué letra falta? 'ч_ша' (taza)", answer: "'а' → 'чаша'" },
        { question: "¿Debe la primera palabra de una oración llevar mayúscula?", answer: "Sí — siempre se escribe con mayúscula." },
        { question: "¿Cómo revisas tu ortografía?", answer: "Lee en voz alta despacio y escucha cada sonido; consulta un diccionario." },
      ],
    },
    "word-study": {
      en: [
        { question: "What is a synonym?", answer: "a word with a similar meaning (e.g. big / large / huge)" },
        { question: "What is an antonym?", answer: "a word with the opposite meaning (e.g. hot / cold)" },
        { question: "Give a synonym for 'happy'.", answer: "joyful, glad, cheerful, pleased, delighted" },
        { question: "Give an antonym for 'fast'.", answer: "slow" },
        { question: "How can you find the meaning of an unknown word?", answer: "use context clues, a dictionary, or ask someone" },
      ],
      bg: [
        { question: "Какво е синоним?", answer: "дума с близко значение (напр. голям / едър / огромен)" },
        { question: "Какво е антоним?", answer: "дума с противоположно значение (напр. топъл / студен)" },
        { question: "Дай синоним на 'щастлив'.", answer: "радостен, весел, доволен, щастлив" },
        { question: "Дай антоним на 'бърз'.", answer: "бавен" },
        { question: "Как можеш да намериш значението на непозната дума?", answer: "контекстни подсказки, речник или попитай някой" },
      ],
      es: [
        { question: "¿Qué es un sinónimo?", answer: "una palabra con significado similar (p. ej. grande / enorme / gigante)" },
        { question: "¿Qué es un antónimo?", answer: "una palabra con significado opuesto (p. ej. caliente / frío)" },
        { question: "Da un sinónimo de 'feliz'.", answer: "alegre, contento, dichoso, satisfecho" },
        { question: "Da un antónimo de 'rápido'.", answer: "lento" },
        { question: "¿Cómo puedes encontrar el significado de una palabra desconocida?", answer: "pistas del contexto, diccionario o preguntarle a alguien" },
      ],
    },
    punctuation: {
      en: [
        { question: "What punctuation ends a question?", answer: "a question mark (?)" },
        { question: "What punctuation ends a strong feeling or exclamation?", answer: "an exclamation mark (!)" },
        { question: "What do commas separate in a list?", answer: "items in a list (e.g. apples, oranges, and bananas)" },
        { question: "Punctuate this sentence: 'What is your name'", answer: "What is your name?" },
        { question: "What does a full stop signal to the reader?", answer: "the sentence has ended — a full stop (pause / stop)" },
      ],
      bg: [
        { question: "Каква пунктуация завършва въпрос?", answer: "въпросителен знак (?)" },
        { question: "Каква пунктуация завършва силно чувство?", answer: "удивителен знак (!)" },
        { question: "Какво разделят запетаите в изброяване?", answer: "елементите в изброяването (напр. ябълки, портокали и банани)" },
        { question: "Постави пунктуацията: 'Как се казваш'", answer: "Как се казваш?" },
        { question: "Какво означава точката за читателя?", answer: "изречението е свършило — пауза / спиране" },
      ],
      es: [
        { question: "¿Qué signo de puntuación termina una pregunta?", answer: "un signo de interrogación (?)" },
        { question: "¿Qué signo termina una exclamación o sentimiento fuerte?", answer: "un signo de exclamación (!)" },
        { question: "¿Qué separan las comas en una lista?", answer: "los elementos de la lista (p. ej. manzanas, naranjas y plátanos)" },
        { question: "Puntúa esta oración: '¿Cómo te llamas'", answer: "¿Cómo te llamas?" },
        { question: "¿Qué indica el punto al lector?", answer: "la oración ha terminado — una pausa / stop" },
      ],
    },
    "nouns-verbs": {
      en: [
        { question: "What is a noun?", answer: "a word for a person, place, animal, or thing (e.g. dog, school, Maria)" },
        { question: "What is a verb?", answer: "an action or state word (e.g. run, eat, sleep, is)" },
        { question: "Identify the noun: 'The cat sleeps.'", answer: "cat (it is a thing/animal)" },
        { question: "Identify the verb: 'The child runs.'", answer: "runs (it is an action)" },
        { question: "Is 'beautiful' a noun, verb, or adjective?", answer: "adjective — it describes a noun" },
      ],
      bg: [
        { question: "Какво е съществително?", answer: "дума за лице, място, животно или предмет (напр. куче, училище, Мария)" },
        { question: "Какво е глагол?", answer: "дума за действие или състояние (напр. тичам, ям, спя, съм)" },
        { question: "Намери съществителното: 'Котката спи.'", answer: "котката (животно/предмет)" },
        { question: "Намери глагола: 'Детето тича.'", answer: "тича (действие)" },
        { question: "Прилагателно, съществително или глагол ли е 'красива'?", answer: "прилагателно — описва съществително" },
      ],
      es: [
        { question: "¿Qué es un sustantivo?", answer: "una palabra para persona, lugar, animal o cosa (p. ej. perro, escuela, María)" },
        { question: "¿Qué es un verbo?", answer: "una palabra de acción o estado (p. ej. correr, comer, dormir, ser)" },
        { question: "Identifica el sustantivo: 'El gato duerme.'", answer: "gato (es un animal/cosa)" },
        { question: "Identifica el verbo: 'El niño corre.'", answer: "corre (es una acción)" },
        { question: "¿Es 'hermoso' un sustantivo, verbo o adjetivo?", answer: "adjetivo — describe a un sustantivo" },
      ],
    },
    poetry: {
      en: [
        { question: "What is rhyme in poetry?", answer: "when the end sounds of two lines match (e.g. cat/hat, moon/spoon)" },
        { question: "What is a stanza?", answer: "a group of lines in a poem (like a paragraph in a story)" },
        { question: "What is rhythm in a poem?", answer: "the musical beat pattern you feel when reading aloud" },
        { question: "Name a poetic technique that compares using 'like' or 'as'.", answer: "simile — e.g. 'brave as a lion'" },
        { question: "What is personification?", answer: "giving human qualities to objects — e.g. 'the wind whispered'" },
      ],
      bg: [
        { question: "Какво е рима в поезията?", answer: "когато краищата на два реда звучат еднакво (напр. котка/лодка)" },
        { question: "Какво е строфа?", answer: "група от редове в стихотворение (като абзац в разказ)" },
        { question: "Какво е ритъм в стихотворение?", answer: "музикалният такт, усещан при четене на глас" },
        { question: "Назови поетичен похват, сравняващ с 'като'.", answer: "сравнение — напр. 'храбър като лъв'" },
        { question: "Какво е олицетворение?", answer: "давам човешки качества на предмети — напр. 'вятърът шептеше'" },
      ],
      es: [
        { question: "¿Qué es la rima en poesía?", answer: "cuando el final de dos versos suena igual (p. ej. gato/pato, luna/cuna)" },
        { question: "¿Qué es una estrofa?", answer: "un grupo de versos en un poema (como un párrafo en una historia)" },
        { question: "¿Qué es el ritmo en un poema?", answer: "el patrón musical que sientes al leer en voz alta" },
        { question: "Nombra una figura poética que compara usando 'como'.", answer: "símil — p. ej. 'valiente como un león'" },
        { question: "¿Qué es la personificación?", answer: "dar cualidades humanas a objetos — p. ej. 'el viento susurró'" },
      ],
    },
    "main-idea": {
      en: [
        { question: "What is the main idea of a text?", answer: "what the text is mostly about — the central point" },
        { question: "What is a supporting detail?", answer: "a fact or example that explains or proves the main idea" },
        { question: "Where is the main idea often found in a paragraph?", answer: "in the first or last sentence" },
        { question: "What is the difference between main idea and theme?", answer: "main idea = what the text says (topic); theme = the deeper lesson or message" },
        { question: "How do you find the main idea? Ask yourself:", answer: "'What is this MOSTLY about?' — that is the main idea." },
      ],
      bg: [
        { question: "Какво е основната идея на текст?", answer: "за какво е основно текстът — централната мисъл" },
        { question: "Какво е допълнителен детайл?", answer: "факт или пример, обясняващ или доказващ основната идея" },
        { question: "Където обикновено се намира основната идея в абзац?", answer: "в първото или последното изречение" },
        { question: "Каква е разликата между основна идея и тема?", answer: "основна идея = какво казва текстът; тема = по-дълбокото послание или урок" },
        { question: "Как намираш основната идея? Питай:", answer: "'За какво е ОСНОВНО текстът?' — това е основната идея." },
      ],
      es: [
        { question: "¿Qué es la idea principal de un texto?", answer: "de qué trata principalmente el texto — el punto central" },
        { question: "¿Qué es un detalle de apoyo?", answer: "un hecho o ejemplo que explica o prueba la idea principal" },
        { question: "¿Dónde suele encontrarse la idea principal en un párrafo?", answer: "en la primera o última oración" },
        { question: "¿Cuál es la diferencia entre idea principal y tema?", answer: "idea principal = lo que dice el texto; tema = la lección o mensaje más profundo" },
        { question: "¿Cómo encuentras la idea principal? Pregúntate:", answer: "'¿De qué trata PRINCIPALMENTE?' — esa es la idea principal." },
      ],
    },
    characters: {
      en: [
        { question: "What is the protagonist?", answer: "the main character the story is mostly about" },
        { question: "How do we learn about a character's personality?", answer: "from what they say, do, and think" },
        { question: "What is a character trait?", answer: "a quality that describes what a character is like (e.g. brave, kind, selfish)" },
        { question: "What is the difference between a round and flat character?", answer: "round: complex and changes; flat: simple and doesn't change" },
        { question: "Name a character trait shown by someone who shares their lunch.", answer: "kindness / generosity" },
      ],
      bg: [
        { question: "Какво е протагонист?", answer: "главният герой, за когото е основно разказът" },
        { question: "Как научаваме за личността на героя?", answer: "от това, което казва, прави и мисли" },
        { question: "Какво е черта на характера?", answer: "качество, описващо какъв е героят (напр. смел, добър, егоистичен)" },
        { question: "Каква е разликата между обемен и плосък образ?", answer: "обемен: сложен и се изменя; плосък: прост и не се изменя" },
        { question: "Назови черта на характера, показана от някой, споделящ обяда си.", answer: "доброта / щедрост" },
      ],
      es: [
        { question: "¿Qué es el protagonista?", answer: "el personaje principal sobre quien trata principalmente la historia" },
        { question: "¿Cómo aprendemos sobre la personalidad de un personaje?", answer: "por lo que dice, hace y piensa" },
        { question: "¿Qué es un rasgo de carácter?", answer: "una cualidad que describe cómo es un personaje (p. ej. valiente, amable, egoísta)" },
        { question: "¿Cuál es la diferencia entre personaje redondo y plano?", answer: "redondo: complejo y cambia; plano: simple y no cambia" },
        { question: "Nombra un rasgo de carácter mostrado por alguien que comparte su almuerzo.", answer: "bondad / generosidad" },
      ],
    },
    retelling: {
      en: [
        { question: "What are the 5 elements of a story retelling?", answer: "characters, setting, problem, events in order, resolution" },
        { question: "What is the 'resolution' of a story?", answer: "how the problem is solved at the end" },
        { question: "What sequence word means 'at the end'?", answer: "finally / at last / in the end" },
        { question: "Difference between retelling and summarising?", answer: "retelling = full story in detail; summarising = only the most important points" },
        { question: "What question helps you find the setting?", answer: "'Where and when does the story take place?'" },
      ],
      bg: [
        { question: "Кои са 5-те елемента на преразказа?", answer: "герои, обстановка, проблем, събития по ред, развръзка" },
        { question: "Какво е 'развръзка' на разказ?", answer: "как проблемът се решава в края" },
        { question: "Коя дума за последователност означава 'накрая'?", answer: "накрая / в края на краищата" },
        { question: "Разлика между преразказ и резюме?", answer: "преразказ = пълна история с детайли; резюме = само най-важните моменти" },
        { question: "Какъв въпрос помага за намиране на обстановката?", answer: "'Къде и кога се развива историята?'" },
      ],
      es: [
        { question: "¿Cuáles son los 5 elementos de un resumen oral?", answer: "personajes, escenario, problema, eventos en orden, resolución" },
        { question: "¿Qué es la 'resolución' de una historia?", answer: "cómo se resuelve el problema al final" },
        { question: "¿Qué palabra de secuencia significa 'al final'?", answer: "finalmente / por último / al final" },
        { question: "¿Diferencia entre resumen oral y resumen escrito?", answer: "oral = historia completa con detalles; escrito = solo los puntos más importantes" },
        { question: "¿Qué pregunta ayuda a encontrar el escenario?", answer: "'¿Dónde y cuándo ocurre la historia?'" },
      ],
    },
  };

  // Grade-band-sensitive: add harder items for high band
  const base = pools[key]?.[lang] ?? [
    { question: lang === "bg" ? "Питай AYA за задачи!" : lang === "es" ? "¡Pregunta a AYA!" : "Ask AYA for practice questions!", answer: "—" },
  ];
  return base.slice(0, 5);
}

function textQuiz(topicId: string, lang: LangCode): QuizQuestion[] {
  const pools: Record<string, Record<LangCode, QuizQuestion[]>> = {
    alphabet: {
      en: [
        { question: "How many letters are in the Bulgarian alphabet?", options: ["26", "28", "30", "32"], correctIndex: 2 },
        { question: "What is the Bulgarian script called?", options: ["Latin", "Arabic", "Cyrillic", "Greek"], correctIndex: 2 },
        { question: "What sound does 'А' make?", options: ["/e/", "/a/", "/o/", "/u/"], correctIndex: 1 },
      ],
      bg: [
        { question: "Колко букви има в азбуката?", options: ["26", "28", "30", "32"], correctIndex: 2 },
        { question: "Как се казва азбуката ни?", options: ["Латиница", "Арабица", "Кирилица", "Гръцка"], correctIndex: 2 },
        { question: "Какъв звук издава 'А'?", options: ["/е/", "/а/", "/о/", "/у/"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Cuántas letras tiene el alfabeto búlgaro?", options: ["26", "28", "30", "32"], correctIndex: 2 },
        { question: "¿Cómo se llama el alfabeto búlgaro?", options: ["Latino", "Árabe", "Cirílico", "Griego"], correctIndex: 2 },
        { question: "¿Qué sonido hace 'А'?", options: ["/e/", "/a/", "/o/", "/u/"], correctIndex: 1 },
      ],
    },
    patterns: {
      en: [
        { question: "What comes next in: 2, 4, 6, 8, __?", options: ["9", "10", "11", "12"], correctIndex: 1 },
        { question: "What comes next in: 1, 4, 9, 16, __?", options: ["20", "23", "25", "27"], correctIndex: 2 },
        { question: "What comes next in: 3, 6, 9, 12, __?", options: ["14", "15", "16", "18"], correctIndex: 1 },
      ],
      bg: [
        { question: "Какво следва: 2, 4, 6, 8, __?", options: ["9", "10", "11", "12"], correctIndex: 1 },
        { question: "Какво следва: 1, 4, 9, 16, __?", options: ["20", "23", "25", "27"], correctIndex: 2 },
        { question: "Какво следва: 3, 6, 9, 12, __?", options: ["14", "15", "16", "18"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Qué sigue en: 2, 4, 6, 8, __?", options: ["9", "10", "11", "12"], correctIndex: 1 },
        { question: "¿Qué sigue en: 1, 4, 9, 16, __?", options: ["20", "23", "25", "27"], correctIndex: 2 },
        { question: "¿Qué sigue en: 3, 6, 9, 12, __?", options: ["14", "15", "16", "18"], correctIndex: 1 },
      ],
    },
    plants: {
      en: [
        { question: "What do roots absorb?", options: ["Sunlight", "Water & minerals", "Oxygen", "Carbon dioxide"], correctIndex: 1 },
        { question: "Which pigment makes leaves green?", options: ["Carotene", "Melanin", "Chlorophyll", "Hemoglobin"], correctIndex: 2 },
        { question: "What gas do plants release?", options: ["CO₂", "Nitrogen", "Oxygen", "Hydrogen"], correctIndex: 2 },
      ],
      bg: [
        { question: "Какво поемат корените?", options: ["Слънчева светлина", "Вода и минерали", "Кислород", "Въглероден диоксид"], correctIndex: 1 },
        { question: "Кой пигмент прави листата зелени?", options: ["Каротен", "Меланин", "Хлорофил", "Хемоглобин"], correctIndex: 2 },
        { question: "Какъв газ отделят растенията?", options: ["CO₂", "Азот", "Кислород", "Водород"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué absorben las raíces?", options: ["Luz solar", "Agua y minerales", "Oxígeno", "Dióxido de carbono"], correctIndex: 1 },
        { question: "¿Qué pigmento hace verdes las hojas?", options: ["Caroteno", "Melanina", "Clorofila", "Hemoglobina"], correctIndex: 2 },
        { question: "¿Qué gas liberan las plantas?", options: ["CO₂", "Nitrógeno", "Oxígeno", "Hidrógeno"], correctIndex: 2 },
      ],
    },
    vocabulary: {
      en: [
        { question: "What does 'home' mean?", options: ["school", "park", "a place where you live", "a shop"], correctIndex: 2 },
        { question: "What does the prefix 'un-' mean?", options: ["again", "before", "not", "after"], correctIndex: 2 },
        { question: "What does the root 'graph' mean?", options: ["draw", "write", "speak", "read"], correctIndex: 1 },
      ],
      bg: [
        { question: "Какво означава 'home'?", options: ["училище", "парк", "дом", "магазин"], correctIndex: 2 },
        { question: "Какво означава представката 'un-'?", options: ["отново", "преди", "не-", "след"], correctIndex: 2 },
        { question: "Какво означава 'graph'?", options: ["рисувам", "пиша", "говоря", "чета"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Qué significa 'home'?", options: ["escuela", "parque", "hogar", "tienda"], correctIndex: 2 },
        { question: "¿Qué significa el prefijo 'un-'?", options: ["de nuevo", "antes", "no", "después"], correctIndex: 2 },
        { question: "¿Qué significa 'graph'?", options: ["dibujar", "escribir", "hablar", "leer"], correctIndex: 1 },
      ],
    },
    reading: {
      en: [
        { question: "Who are the people in a story called?", options: ["setting", "plot", "characters", "theme"], correctIndex: 2 },
        { question: "Where and when a story happens is the...?", options: ["plot", "setting", "character", "climax"], correctIndex: 1 },
        { question: "What is the lesson of a story called?", options: ["setting", "characters", "plot", "theme"], correctIndex: 3 },
        { question: "What should you do if you don't understand a sentence?", options: ["skip it", "guess", "reread it", "ask someone"], correctIndex: 2 },
      ],
      bg: [
        { question: "Как се казват хората в разказа?", options: ["обстановка", "сюжет", "герои", "тема"], correctIndex: 2 },
        { question: "Как се казва къде и кога се случва разказа?", options: ["сюжет", "обстановка", "герой", "кулминация"], correctIndex: 1 },
        { question: "Как се казва урокът на разказа?", options: ["обстановка", "герои", "сюжет", "тема"], correctIndex: 3 },
        { question: "Какво трябва да направиш, ако не разбираш изречение?", options: ["прескочи го", "познай", "прочети отново", "попитай"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Cómo se llaman las personas en una historia?", options: ["escenario", "trama", "personajes", "tema"], correctIndex: 2 },
        { question: "¿Cómo se llama dónde y cuándo ocurre una historia?", options: ["trama", "escenario", "personaje", "clímax"], correctIndex: 1 },
        { question: "¿Cómo se llama la lección de una historia?", options: ["escenario", "personajes", "trama", "tema"], correctIndex: 3 },
        { question: "¿Qué deberías hacer si no entiendes una oración?", options: ["saltarla", "adivinar", "releerla", "preguntar"], correctIndex: 2 },
      ],
    },
    writing: {
      en: [
        { question: "What is a group of words that expresses a complete thought?", options: ["a paragraph", "a sentence", "a word", "a letter"], correctIndex: 1 },
        { question: "What is a noun?", options: ["an action word", "a describing word", "a person, place, or thing", "a connecting word"], correctIndex: 2 },
        { question: "What is a verb?", options: ["a person, place, or thing", "an action word", "a describing word", "a number"], correctIndex: 1 },
        { question: "What must start every sentence?", options: ["a small letter", "a capital letter", "a comma", "a full stop"], correctIndex: 1 },
      ],
      bg: [
        { question: "Какво е група думи, изразяваща пълна мисъл?", options: ["абзац", "изречение", "дума", "буква"], correctIndex: 1 },
        { question: "Какво е съществително?", options: ["действие", "описание", "човек, място или нещо", "свързваща дума"], correctIndex: 2 },
        { question: "Какво е глагол?", options: ["човек, място или нещо", "дума за действие", "описателна дума", "число"], correctIndex: 1 },
        { question: "С какво трябва да започва всяко изречение?", options: ["малка буква", "главна буква", "запетая", "точка"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Qué es un grupo de palabras que expresa un pensamiento completo?", options: ["un párrafo", "una oración", "una palabra", "una letra"], correctIndex: 1 },
        { question: "¿Qué es un sustantivo?", options: ["una palabra de acción", "una palabra descriptiva", "una persona, lugar o cosa", "una palabra de enlace"], correctIndex: 2 },
        { question: "¿Qué es un verbo?", options: ["una persona, lugar o cosa", "una palabra de acción", "una palabra descriptiva", "un número"], correctIndex: 1 },
        { question: "¿Con qué debe comenzar cada oración?", options: ["una letra minúscula", "una letra mayúscula", "una coma", "un punto"], correctIndex: 1 },
      ],
    },
    grammar: {
      en: [
        { question: "How many genders do Bulgarian nouns have?", options: ["one", "two", "three", "four"], correctIndex: 2 },
        { question: "What is a word that describes a noun?", options: ["a verb", "an adjective", "a pronoun", "a conjunction"], correctIndex: 1 },
        { question: "How many main tenses are there in Bulgarian?", options: ["two", "three", "four", "five"], correctIndex: 1 },
        { question: "What must agree with a noun in gender?", options: ["verbs only", "pronouns only", "adjectives and articles", "conjunctions"], correctIndex: 2 },
      ],
      bg: [
        { question: "Колко рода имат българските съществителни?", options: ["един", "два", "три", "четири"], correctIndex: 2 },
        { question: "Каква дума описва съществително?", options: ["глагол", "прилагателно", "местоимение", "съюз"], correctIndex: 1 },
        { question: "Колко основни времена има в български?", options: ["две", "три", "четири", "пет"], correctIndex: 1 },
        { question: "Какво трябва да се съгласува по род със съществителното?", options: ["само глаголи", "само местоимения", "прилагателни и членове", "съюзи"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Cuántos géneros tienen los sustantivos búlgaros?", options: ["uno", "dos", "tres", "cuatro"], correctIndex: 2 },
        { question: "¿Qué palabra describe a un sustantivo?", options: ["un verbo", "un adjetivo", "un pronombre", "una conjunción"], correctIndex: 1 },
        { question: "¿Cuántos tiempos principales hay en búlgaro?", options: ["dos", "tres", "cuatro", "cinco"], correctIndex: 1 },
        { question: "¿Qué debe concordar en género con un sustantivo?", options: ["solo verbos", "solo pronombres", "adjetivos y artículos", "conjunciones"], correctIndex: 2 },
      ],
    },
    stories: {
      en: [
        { question: "What are the people in a story called?", options: ["settings", "plots", "characters", "themes"], correctIndex: 2 },
        { question: "What is the problem in a story called?", options: ["resolution", "setting", "conflict", "theme"], correctIndex: 2 },
        { question: "What are the beginning, middle, and end of a story called?", options: ["setting", "character", "plot", "theme"], correctIndex: 2 },
        { question: "What is the lesson of a story called?", options: ["plot", "character", "setting", "theme or moral"], correctIndex: 3 },
      ],
      bg: [
        { question: "Как се казват хората в разказа?", options: ["обстановка", "сюжет", "герои", "тема"], correctIndex: 2 },
        { question: "Как се казва проблемът в разказа?", options: ["развръзка", "обстановка", "конфликт", "тема"], correctIndex: 2 },
        { question: "Как се казват началото, средината и краят?", options: ["обстановка", "герой", "сюжет", "тема"], correctIndex: 2 },
        { question: "Как се казва урокът на разказа?", options: ["сюжет", "герой", "обстановка", "тема или мораль"], correctIndex: 3 },
      ],
      es: [
        { question: "¿Cómo se llaman las personas en una historia?", options: ["escenarios", "tramas", "personajes", "temas"], correctIndex: 2 },
        { question: "¿Cómo se llama el problema en una historia?", options: ["resolución", "escenario", "conflicto", "tema"], correctIndex: 2 },
        { question: "¿Cómo se llaman el principio, el medio y el final?", options: ["escenario", "personaje", "trama", "tema"], correctIndex: 2 },
        { question: "¿Cómo se llama la lección de una historia?", options: ["trama", "personaje", "escenario", "tema o moraleja"], correctIndex: 3 },
      ],
    },
    comprehension: {
      en: [
        { question: "What is understanding what you read called?", options: ["narration", "fiction", "comprehension", "inference"], correctIndex: 2 },
        { question: "What is figuring out unstated information called?", options: ["copying", "inference", "summary", "recalling"], correctIndex: 1 },
        { question: "What is the most important point in a text called?", options: ["a detail", "an example", "the main idea", "the conclusion"], correctIndex: 2 },
        { question: "What questions help you understand a text?", options: ["Where, Why, How", "What, When, Where", "Who, What, Where, When, Why", "Only Why"], correctIndex: 2 },
      ],
      bg: [
        { question: "Как се казва разбирането на прочетеното?", options: ["разказване", "измислица", "разбиране", "извод"], correctIndex: 2 },
        { question: "Как се казва разбирането на неказана пряко информация?", options: ["копиране", "интуиция/извод", "резюме", "припомняне"], correctIndex: 1 },
        { question: "Как се казва най-важната точка в текста?", options: ["детайл", "пример", "главна идея", "заключение"], correctIndex: 2 },
        { question: "Кои въпроси помагат да разбереш текст?", options: ["Където, Защо, Как", "Какво, Кога, Където", "Кой, Какво, Където, Кога, Защо", "Само Защо"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Cómo se llama entender lo que lees?", options: ["narración", "ficción", "comprensión", "inferencia"], correctIndex: 2 },
        { question: "¿Cómo se llama deducir información no dicha?", options: ["copiar", "inferencia", "resumen", "recordar"], correctIndex: 1 },
        { question: "¿Cómo se llama el punto más importante de un texto?", options: ["un detalle", "un ejemplo", "la idea principal", "la conclusión"], correctIndex: 2 },
        { question: "¿Qué preguntas ayudan a entender un texto?", options: ["Dónde, Por qué, Cómo", "Qué, Cuándo, Dónde", "Quién, Qué, Dónde, Cuándo, Por qué", "Solo Por qué"], correctIndex: 2 },
      ],
    },
    puzzles: {
      en: [
        { question: "I have 2 legs in the morning, 4 at noon, 3 in the evening. What am I?", options: ["a dog", "a person", "a chair", "a cat"], correctIndex: 1 },
        { question: "Which is heavier: 1 kg of feathers or 1 kg of iron?", options: ["feathers", "iron", "they weigh the same", "impossible to say"], correctIndex: 2 },
        { question: "All cats are animals. Whiskers is a cat. What is Whiskers?", options: ["a dog", "a fish", "an animal", "a human"], correctIndex: 2 },
        { question: "Anna > Ben > Carla in age. Who is youngest?", options: ["Anna", "Ben", "Carla", "They're the same"], correctIndex: 2 },
      ],
      bg: [
        { question: "Сутринта — 2 крака, обед — 4, вечер — 3. Какво съм?", options: ["куче", "човек", "стол", "котка"], correctIndex: 1 },
        { question: "Кое е по-тежко: 1 кг перушина или 1 кг желязо?", options: ["перушина", "желязо", "еднакво", "невъзможно"], correctIndex: 2 },
        { question: "Всички котки са животни. Мишка е котка. Какво е Мишка?", options: ["куче", "риба", "животно", "човек"], correctIndex: 2 },
        { question: "Анна > Бен > Карла по възраст. Кой е най-малък?", options: ["Анна", "Бен", "Карла", "Еднакви"], correctIndex: 2 },
      ],
      es: [
        { question: "Mañana 2 patas, mediodía 4, noche 3. ¿Qué soy?", options: ["un perro", "una persona", "una silla", "un gato"], correctIndex: 1 },
        { question: "¿Qué pesa más: 1 kg de plumas o 1 kg de hierro?", options: ["plumas", "hierro", "pesan lo mismo", "imposible saber"], correctIndex: 2 },
        { question: "Todos los gatos son animales. Bigotes es un gato. ¿Qué es Bigotes?", options: ["un perro", "un pez", "un animal", "un humano"], correctIndex: 2 },
        { question: "Ana > Ben > Carla en edad. ¿Quién es el más joven?", options: ["Ana", "Ben", "Carla", "Todos iguales"], correctIndex: 2 },
      ],
    },
    animals: {
      en: [
        { question: "What do herbivores eat?", options: ["only meat", "only plants", "meat and plants", "insects only"], correctIndex: 1 },
        { question: "What makes mammals unique?", options: ["they lay eggs", "they are cold-blooded", "they feed young with milk", "they have scales"], correctIndex: 2 },
        { question: "Are fish vertebrates or invertebrates?", options: ["invertebrates", "vertebrates", "both", "neither"], correctIndex: 1 },
        { question: "Which is an invertebrate?", options: ["a dog", "a fish", "a bird", "a spider"], correctIndex: 3 },
      ],
      bg: [
        { question: "Какво ядат тревопасните?", options: ["само месо", "само растения", "месо и растения", "само насекоми"], correctIndex: 1 },
        { question: "Какво прави бозайниците уникални?", options: ["снасят яйца", "студенокръвни са", "кърмят малките", "имат люспи"], correctIndex: 2 },
        { question: "Рибите гръбначни или безгръбначни?", options: ["безгръбначни", "гръбначни", "и двете", "нито едното"], correctIndex: 1 },
        { question: "Кое е безгръбначно?", options: ["куче", "риба", "птица", "паяк"], correctIndex: 3 },
      ],
      es: [
        { question: "¿Qué comen los herbívoros?", options: ["solo carne", "solo plantas", "carne y plantas", "solo insectos"], correctIndex: 1 },
        { question: "¿Qué hace únicos a los mamíferos?", options: ["ponen huevos", "son de sangre fría", "alimentan crías con leche", "tienen escamas"], correctIndex: 2 },
        { question: "¿Los peces son vertebrados o invertebrados?", options: ["invertebrados", "vertebrados", "ambos", "ninguno"], correctIndex: 1 },
        { question: "¿Cuál es un invertebrado?", options: ["un perro", "un pez", "un pájaro", "una araña"], correctIndex: 3 },
      ],
    },
    earth: {
      en: [
        { question: "What covers most of Earth's surface?", options: ["land", "ice", "water", "forest"], correctIndex: 2 },
        { question: "What causes day and night?", options: ["Earth orbiting the Sun", "the Moon's shadow", "Earth rotating on its axis", "clouds blocking sunlight"], correctIndex: 2 },
        { question: "What is the outermost layer of Earth?", options: ["mantle", "inner core", "outer core", "crust"], correctIndex: 3 },
        { question: "What causes earthquakes?", options: ["heavy rain", "volcanic eruptions only", "tectonic plate movement", "the Moon's gravity"], correctIndex: 2 },
      ],
      bg: [
        { question: "Какво покрива по-голямата част от Земята?", options: ["суша", "лед", "вода", "гора"], correctIndex: 2 },
        { question: "Какво причинява ден и нощ?", options: ["обиколката на Земята", "сянката на Луната", "въртенето на Земята", "облаци"], correctIndex: 2 },
        { question: "Кой е най-горният слой на Земята?", options: ["мантия", "вътрешно ядро", "външно ядро", "земна кора"], correctIndex: 3 },
        { question: "Какво причинява земетресенията?", options: ["силен дъжд", "само вулкани", "движение на тектонски плочи", "гравитацията на Луната"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué cubre la mayor parte de la Tierra?", options: ["tierra", "hielo", "agua", "bosque"], correctIndex: 2 },
        { question: "¿Qué causa el día y la noche?", options: ["la órbita de la Tierra", "la sombra de la Luna", "la rotación de la Tierra", "nubes"], correctIndex: 2 },
        { question: "¿Cuál es la capa más externa de la Tierra?", options: ["manto", "núcleo interno", "núcleo externo", "corteza"], correctIndex: 3 },
        { question: "¿Qué causa los terremotos?", options: ["lluvias fuertes", "solo volcanes", "movimiento de placas tectónicas", "gravedad lunar"], correctIndex: 2 },
      ],
    },
    "simple-sentences": {
      en: [
        { question: "What two parts does every sentence need?", options: ["noun and adjective", "subject and verb", "question and answer", "start and end"], correctIndex: 1 },
        { question: "Which word joins with contrast: 'I was tired ___ I went out.'?", options: ["and", "or", "but", "so"], correctIndex: 2 },
        { question: "What must the first word of a sentence be?", options: ["a verb", "capitalized", "a noun", "short"], correctIndex: 1 },
        { question: "What punctuation ends a statement?", options: ["comma", "question mark", "exclamation mark", "full stop"], correctIndex: 3 },
      ],
      bg: [
        { question: "От какви две части трябва да се състои всяко изречение?", options: ["съществително и прилагателно", "подлог и сказуемо", "въпрос и отговор", "начало и край"], correctIndex: 1 },
        { question: "Коя дума свързва с контраст: 'Бях уморен ___ излязох.'?", options: ["и", "или", "но", "затова"], correctIndex: 2 },
        { question: "Каква трябва да е първата дума на изречение?", options: ["глагол", "с главна буква", "съществително", "кратка"], correctIndex: 1 },
        { question: "Каква пунктуация завършва изявително изречение?", options: ["запетая", "въпросителна", "удивителна", "точка"], correctIndex: 3 },
      ],
      es: [
        { question: "¿Qué dos partes necesita cada oración?", options: ["sustantivo y adjetivo", "sujeto y verbo", "pregunta y respuesta", "inicio y fin"], correctIndex: 1 },
        { question: "¿Qué palabra une con contraste: 'Estaba cansado ___ salí.'?", options: ["and", "or", "but", "so"], correctIndex: 2 },
        { question: "¿Cómo debe ser la primera palabra de una oración?", options: ["un verbo", "con mayúscula", "un sustantivo", "corta"], correctIndex: 1 },
        { question: "¿Qué signo de puntuación termina una afirmación?", options: ["coma", "signo de interrogación", "signo de exclamación", "punto final"], correctIndex: 3 },
      ],
    },
    fractions: {
      en: [
        { question: "What does the denominator tell us?", options: ["total parts you have", "how many equal parts the whole is divided into", "the value of the fraction", "the number on top"], correctIndex: 1 },
        { question: "Which fraction is bigger?", options: ["1/4", "1/8", "1/2", "1/6"], correctIndex: 2 },
        { question: "A pizza cut into 4 slices — you eat 1. What fraction is left?", options: ["1/4", "2/4", "3/4", "4/4"], correctIndex: 2 },
        { question: "What is the numerator in 3/5?", options: ["5", "3", "8", "2"], correctIndex: 1 },
      ],
      bg: [
        { question: "Какво ни казва знаменателят?", options: ["колко части имаш", "на колко равни части е разделено цялото", "стойността на дробта", "горното число"], correctIndex: 1 },
        { question: "Коя дроб е по-голяма?", options: ["1/4", "1/8", "1/2", "1/6"], correctIndex: 2 },
        { question: "Пица е разрязана на 4 парчета — изяждаш 1. Каква дроб остава?", options: ["1/4", "2/4", "3/4", "4/4"], correctIndex: 2 },
        { question: "Какъв е числителят на 3/5?", options: ["5", "3", "8", "2"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Qué nos dice el denominador?", options: ["cuántas partes tienes", "en cuántas partes iguales está dividido el todo", "el valor de la fracción", "el número de arriba"], correctIndex: 1 },
        { question: "¿Qué fracción es mayor?", options: ["1/4", "1/8", "1/2", "1/6"], correctIndex: 2 },
        { question: "Una pizza cortada en 4 trozos — comes 1. ¿Qué fracción queda?", options: ["1/4", "2/4", "3/4", "4/4"], correctIndex: 2 },
        { question: "¿Cuál es el numerador en 3/5?", options: ["5", "3", "8", "2"], correctIndex: 1 },
      ],
    },
    geometry: {
      en: [
        { question: "How many sides does a triangle have?", options: ["2", "3", "4", "5"], correctIndex: 1 },
        { question: "What shape has 4 equal sides and 4 right angles?", options: ["rectangle", "rhombus", "square", "triangle"], correctIndex: 2 },
        { question: "What is the perimeter of a square with sides of 5 cm?", options: ["10 cm", "15 cm", "20 cm", "25 cm"], correctIndex: 2 },
        { question: "Which 3D shape is perfectly round in all directions?", options: ["cube", "cylinder", "cone", "sphere"], correctIndex: 3 },
      ],
      bg: [
        { question: "Колко страни има триъгълникът?", options: ["2", "3", "4", "5"], correctIndex: 1 },
        { question: "Коя фигура има 4 равни страни и 4 прави ъгъла?", options: ["правоъгълник", "ромб", "квадрат", "триъгълник"], correctIndex: 2 },
        { question: "Какъв е периметърът на квадрат със страна 5 см?", options: ["10 см", "15 см", "20 см", "25 см"], correctIndex: 2 },
        { question: "Коя 3D фигура е напълно кръгла?", options: ["куб", "цилиндър", "конус", "сфера"], correctIndex: 3 },
      ],
      es: [
        { question: "¿Cuántos lados tiene un triángulo?", options: ["2", "3", "4", "5"], correctIndex: 1 },
        { question: "¿Qué figura tiene 4 lados iguales y 4 ángulos rectos?", options: ["rectángulo", "rombo", "cuadrado", "triángulo"], correctIndex: 2 },
        { question: "¿Cuál es el perímetro de un cuadrado con lados de 5 cm?", options: ["10 cm", "15 cm", "20 cm", "25 cm"], correctIndex: 2 },
        { question: "¿Qué figura 3D es perfectamente redonda en todas las direcciones?", options: ["cubo", "cilindro", "cono", "esfera"], correctIndex: 3 },
      ],
    },
    measurement: {
      en: [
        { question: "How many centimetres are in 1 metre?", options: ["10", "100", "1000", "50"], correctIndex: 1 },
        { question: "How many grams are in 1 kilogram?", options: ["100", "500", "1000", "10"], correctIndex: 2 },
        { question: "Convert 3 kg to grams.", options: ["300 g", "3000 g", "30 g", "300 kg"], correctIndex: 1 },
        { question: "A class starts at 9:00 and lasts 45 minutes. When does it end?", options: ["9:30", "9:45", "10:00", "10:15"], correctIndex: 1 },
      ],
      bg: [
        { question: "Колко сантиметра има в 1 метър?", options: ["10", "100", "1000", "50"], correctIndex: 1 },
        { question: "Колко грама има в 1 килограм?", options: ["100", "500", "1000", "10"], correctIndex: 2 },
        { question: "Преобразувай 3 кг в грамове.", options: ["300 г", "3000 г", "30 г", "300 кг"], correctIndex: 1 },
        { question: "Урок започва в 9:00 и трае 45 минути. Кога свършва?", options: ["9:30", "9:45", "10:00", "10:15"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Cuántos centímetros hay en 1 metro?", options: ["10", "100", "1000", "50"], correctIndex: 1 },
        { question: "¿Cuántos gramos hay en 1 kilogramo?", options: ["100", "500", "1000", "10"], correctIndex: 2 },
        { question: "Convierte 3 kg en gramos.", options: ["300 g", "3000 g", "30 g", "300 kg"], correctIndex: 1 },
        { question: "Una clase empieza a las 9:00 y dura 45 minutos. ¿Cuándo termina?", options: ["9:30", "9:45", "10:00", "10:15"], correctIndex: 1 },
      ],
    },
    spelling: {
      en: [
        { question: "Which letter do Bulgarian names start with?", options: ["lowercase", "capital", "any letter", "a vowel"], correctIndex: 1 },
        { question: "Which is the correct spelling?", options: ["ябалка", "ябълка", "ябулка", "ябeлка"], correctIndex: 1 },
        { question: "What should you do to check your spelling?", options: ["guess randomly", "read aloud slowly", "skip difficult words", "copy a friend"], correctIndex: 1 },
        { question: "The first word of a sentence must be:", options: ["a noun", "a verb", "capitalised", "short"], correctIndex: 2 },
      ],
      bg: [
        { question: "С каква буква се пишат имената в Bulgarian?", options: ["малка", "главна", "произволна", "гласна"], correctIndex: 1 },
        { question: "Кое е правилното изписване?", options: ["ябалка", "ябълка", "ябулка", "ябeлка"], correctIndex: 1 },
        { question: "Какво да направиш, за да провериш правописа си?", options: ["познай на случаен принцип", "чети на глас бавно", "пропусни трудните думи", "копирай от съсед"], correctIndex: 1 },
        { question: "Първата дума на изречение трябва да е:", options: ["съществително", "глагол", "с главна буква", "кратка"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Con qué letra se escriben los nombres en búlgaro?", options: ["minúscula", "mayúscula", "cualquier letra", "vocal"], correctIndex: 1 },
        { question: "¿Cuál es la ortografía correcta?", options: ["ябалка", "ябълка", "ябулка", "ябeлка"], correctIndex: 1 },
        { question: "¿Qué debes hacer para revisar tu ortografía?", options: ["adivinar al azar", "leer en voz alta despacio", "saltarte las palabras difíciles", "copiar de un compañero"], correctIndex: 1 },
        { question: "La primera palabra de una oración debe estar:", options: ["en sustantivo", "en verbo", "en mayúscula", "corta"], correctIndex: 2 },
      ],
    },
    "word-study": {
      en: [
        { question: "What is a synonym?", options: ["opposite word", "similar word", "rhyming word", "longer word"], correctIndex: 1 },
        { question: "What is an antonym?", options: ["similar word", "opposite word", "rhyming word", "compound word"], correctIndex: 1 },
        { question: "Which is an antonym of 'fast'?", options: ["quick", "speedy", "slow", "rapid"], correctIndex: 2 },
        { question: "Which is a synonym of 'happy'?", options: ["sad", "angry", "joyful", "tired"], correctIndex: 2 },
      ],
      bg: [
        { question: "Какво е синоним?", options: ["противоположна дума", "дума с близко значение", "римуваща дума", "по-дълга дума"], correctIndex: 1 },
        { question: "Какво е антоним?", options: ["дума с близко значение", "дума с противоположно значение", "римуваща дума", "сложна дума"], correctIndex: 1 },
        { question: "Кое е антонимът на 'бърз'?", options: ["бързоходен", "скоростен", "бавен", "пъргав"], correctIndex: 2 },
        { question: "Кое е синонимът на 'щастлив'?", options: ["тъжен", "ядосан", "радостен", "уморен"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué es un sinónimo?", options: ["palabra opuesta", "palabra similar", "palabra que rima", "palabra más larga"], correctIndex: 1 },
        { question: "¿Qué es un antónimo?", options: ["palabra similar", "palabra opuesta", "palabra que rima", "palabra compuesta"], correctIndex: 1 },
        { question: "¿Cuál es el antónimo de 'rápido'?", options: ["veloz", "veloz", "lento", "ágil"], correctIndex: 2 },
        { question: "¿Cuál es el sinónimo de 'feliz'?", options: ["triste", "enojado", "alegre", "cansado"], correctIndex: 2 },
      ],
    },
    punctuation: {
      en: [
        { question: "Which punctuation ends a question?", options: ["full stop", "comma", "question mark", "exclamation mark"], correctIndex: 2 },
        { question: "Which punctuation shows strong feeling?", options: ["comma", "full stop", "question mark", "exclamation mark"], correctIndex: 3 },
        { question: "Commas are used to separate items in a:", options: ["question", "list", "title", "name"], correctIndex: 1 },
        { question: "Which is correct: 'What is your name_'", options: [".", ",", "?", "!"], correctIndex: 2 },
      ],
      bg: [
        { question: "Кой препинателен знак завършва въпрос?", options: ["точка", "запетая", "въпросителен знак", "удивителен знак"], correctIndex: 2 },
        { question: "Кой знак показва силно чувство?", options: ["запетая", "точка", "въпросителен знак", "удивителен знак"], correctIndex: 3 },
        { question: "Запетаите се използват за разделяне на елементи в:", options: ["въпрос", "изброяване", "заглавие", "лично име"], correctIndex: 1 },
        { question: "Кое е правилно: 'Как се казваш_'", options: [".", ",", "?", "!"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué signo de puntuación termina una pregunta?", options: ["punto", "coma", "signo de interrogación", "signo de exclamación"], correctIndex: 2 },
        { question: "¿Qué signo muestra un sentimiento fuerte?", options: ["coma", "punto", "signo de interrogación", "signo de exclamación"], correctIndex: 3 },
        { question: "Las comas se usan para separar elementos en una:", options: ["pregunta", "lista", "título", "nombre"], correctIndex: 1 },
        { question: "¿Cuál es correcto: '¿Cómo te llamas_'", options: [".", ",", "?", "!"], correctIndex: 2 },
      ],
    },
    "nouns-verbs": {
      en: [
        { question: "Which word is a noun?", options: ["run", "quickly", "cat", "beautiful"], correctIndex: 2 },
        { question: "Which word is a verb?", options: ["house", "slowly", "blue", "jump"], correctIndex: 3 },
        { question: "In 'The dog barks', what is the verb?", options: ["the", "dog", "barks", "none"], correctIndex: 2 },
        { question: "Nouns are words for:", options: ["actions", "feelings only", "people, places, animals, or things", "descriptions"], correctIndex: 2 },
      ],
      bg: [
        { question: "Коя дума е съществително?", options: ["тичам", "бързо", "котка", "красива"], correctIndex: 2 },
        { question: "Коя дума е глагол?", options: ["къща", "бавно", "синьо", "скачам"], correctIndex: 3 },
        { question: "В 'Кучето лае' кое е сказуемото (глагол)?", options: ["кучето", "лае", "нито едно", "the"], correctIndex: 1 },
        { question: "Съществителните са думи за:", options: ["действия", "само чувства", "хора, места, животни или предмети", "описания"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué palabra es un sustantivo?", options: ["correr", "rápidamente", "gato", "hermoso"], correctIndex: 2 },
        { question: "¿Qué palabra es un verbo?", options: ["casa", "lentamente", "azul", "saltar"], correctIndex: 3 },
        { question: "En 'El perro ladra', ¿cuál es el verbo?", options: ["el", "perro", "ladra", "ninguno"], correctIndex: 2 },
        { question: "Los sustantivos son palabras para:", options: ["acciones", "solo sentimientos", "personas, lugares, animales o cosas", "descripciones"], correctIndex: 2 },
      ],
    },
    poetry: {
      en: [
        { question: "What is rhyme in a poem?", options: ["when lines are long", "when line endings sound the same", "when words are repeated", "when stanzas are equal"], correctIndex: 1 },
        { question: "What is a stanza?", options: ["a type of rhyme", "a group of lines in a poem", "the title of a poem", "a poetic technique"], correctIndex: 1 },
        { question: "Which technique compares using 'like' or 'as'?", options: ["metaphor", "personification", "simile", "rhyme"], correctIndex: 2 },
        { question: "'The wind whispered through the trees' — which technique is used?", options: ["simile", "metaphor", "personification", "stanza"], correctIndex: 2 },
      ],
      bg: [
        { question: "Какво е рима в стихотворение?", options: ["когато редовете са дълги", "когато краищата на редовете звучат еднакво", "когато думите се повтарят", "когато строфите са равни"], correctIndex: 1 },
        { question: "Какво е строфа?", options: ["вид рима", "група от редове в стихотворение", "заглавие на стихотворение", "поетичен похват"], correctIndex: 1 },
        { question: "Кой похват сравнява с 'като'?", options: ["метафора", "олицетворение", "сравнение", "рима"], correctIndex: 2 },
        { question: "'Вятърът шептеше сред дърветата' — кой похват е използван?", options: ["сравнение", "метафора", "олицетворение", "строфа"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué es la rima en un poema?", options: ["cuando los versos son largos", "cuando el final de los versos suena igual", "cuando las palabras se repiten", "cuando las estrofas son iguales"], correctIndex: 1 },
        { question: "¿Qué es una estrofa?", options: ["un tipo de rima", "un grupo de versos en un poema", "el título de un poema", "una técnica poética"], correctIndex: 1 },
        { question: "¿Qué técnica compara usando 'como'?", options: ["metáfora", "personificación", "símil", "rima"], correctIndex: 2 },
        { question: "'El viento susurró entre los árboles' — ¿qué técnica se usa?", options: ["símil", "metáfora", "personificación", "estrofa"], correctIndex: 2 },
      ],
    },
    "main-idea": {
      en: [
        { question: "The main idea is:", options: ["a supporting detail", "what the text is mostly about", "the last sentence always", "a character in the story"], correctIndex: 1 },
        { question: "Supporting details:", options: ["are the main idea", "explain or prove the main idea", "are always in the first sentence", "replace the main idea"], correctIndex: 1 },
        { question: "Where is the main idea often found?", options: ["in the middle of a paragraph", "in the first or last sentence", "always at the end", "never in the text"], correctIndex: 1 },
        { question: "The theme of a story is:", options: ["the main character's name", "the setting of the story", "the deeper lesson or message", "the first event"], correctIndex: 2 },
      ],
      bg: [
        { question: "Основната идея е:", options: ["допълнителен детайл", "за какво основно е текстът", "винаги последното изречение", "герой от историята"], correctIndex: 1 },
        { question: "Допълнителните детайли:", options: ["са основната идея", "обясняват или доказват основната идея", "винаги са в първото изречение", "заменят основната идея"], correctIndex: 1 },
        { question: "Където обикновено се намира основната идея?", options: ["в средата на абзаца", "в първото или последното изречение", "винаги в края", "никога не е в текста"], correctIndex: 1 },
        { question: "Темата на разказ е:", options: ["името на главния герой", "обстановката на историята", "по-дълбокото послание или урок", "първото събитие"], correctIndex: 2 },
      ],
      es: [
        { question: "La idea principal es:", options: ["un detalle de apoyo", "de qué trata principalmente el texto", "siempre la última oración", "un personaje de la historia"], correctIndex: 1 },
        { question: "Los detalles de apoyo:", options: ["son la idea principal", "explican o prueban la idea principal", "siempre están en la primera oración", "reemplazan la idea principal"], correctIndex: 1 },
        { question: "¿Dónde suele encontrarse la idea principal?", options: ["en el centro del párrafo", "en la primera o última oración", "siempre al final", "nunca en el texto"], correctIndex: 1 },
        { question: "El tema de una historia es:", options: ["el nombre del personaje principal", "el escenario de la historia", "la lección o mensaje más profundo", "el primer evento"], correctIndex: 2 },
      ],
    },
    characters: {
      en: [
        { question: "The protagonist is:", options: ["the villain", "the main character the story follows", "any animal in the story", "the narrator"], correctIndex: 1 },
        { question: "We learn about characters through:", options: ["only their appearance", "what they say, do, and think", "only the author's description", "only dialogue"], correctIndex: 1 },
        { question: "A round character is:", options: ["shaped like a circle", "simple with one trait", "complex, realistic, and changes", "always the hero"], correctIndex: 2 },
        { question: "What is a character trait?", options: ["a character's appearance", "a quality describing what a character is like", "the character's goal", "the plot twist"], correctIndex: 1 },
      ],
      bg: [
        { question: "Протагонистът е:", options: ["злодеят", "главният герой, когото следваме", "всяко животно в историята", "разказвачът"], correctIndex: 1 },
        { question: "Научаваме за героите чрез:", options: ["само външния им вид", "какво казват, правят и мислят", "само описанието на автора", "само диалога"], correctIndex: 1 },
        { question: "Обемният образ е:", options: ["кръгла форма", "прост с една черта", "сложен, реалистичен и се изменя", "винаги героят"], correctIndex: 2 },
        { question: "Какво е черта на характера?", options: ["외видът на героя", "качество, описващо какъв е героят", "целта на героя", "обрата в сюжета"], correctIndex: 1 },
      ],
      es: [
        { question: "El protagonista es:", options: ["el villano", "el personaje principal que seguimos", "cualquier animal de la historia", "el narrador"], correctIndex: 1 },
        { question: "Aprendemos sobre los personajes a través de:", options: ["solo su apariencia", "lo que dicen, hacen y piensan", "solo la descripción del autor", "solo el diálogo"], correctIndex: 1 },
        { question: "Un personaje redondo es:", options: ["con forma de círculo", "simple con un solo rasgo", "complejo, realista y que cambia", "siempre el héroe"], correctIndex: 2 },
        { question: "¿Qué es un rasgo de carácter?", options: ["la apariencia del personaje", "una cualidad que describe cómo es el personaje", "el objetivo del personaje", "el giro del argumento"], correctIndex: 1 },
      ],
    },
    retelling: {
      en: [
        { question: "Which is NOT one of the 5 story retelling elements?", options: ["characters", "setting", "the author's name", "resolution"], correctIndex: 2 },
        { question: "What sequence word means 'at the end'?", options: ["first", "then", "next", "finally"], correctIndex: 3 },
        { question: "The resolution of a story is:", options: ["the opening scene", "where the story takes place", "how the problem is solved", "the main character's name"], correctIndex: 2 },
        { question: "Summarising differs from retelling because a summary:", options: ["is longer", "includes all details", "only covers the most important points", "retells from a different character's view"], correctIndex: 2 },
      ],
      bg: [
        { question: "Кое НЕ е от 5-те елемента на преразказа?", options: ["герои", "обстановка", "името на автора", "развръзка"], correctIndex: 2 },
        { question: "Коя дума за последователност означава 'в края'?", options: ["първо", "после", "след това", "накрая"], correctIndex: 3 },
        { question: "Развръзката на разказ е:", options: ["началната сцена", "където се развива историята", "как проблемът се решава", "името на главния герой"], correctIndex: 2 },
        { question: "Резюмето се различава от преразказа, защото резюмето:", options: ["е по-дълго", "включва всички детайли", "съдържа само най-важните моменти", "преразказва от гледна точка на друг герой"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Cuál NO es uno de los 5 elementos del resumen oral?", options: ["personajes", "escenario", "el nombre del autor", "resolución"], correctIndex: 2 },
        { question: "¿Qué palabra de secuencia significa 'al final'?", options: ["primero", "luego", "después", "finalmente"], correctIndex: 3 },
        { question: "La resolución de una historia es:", options: ["la escena inicial", "dónde ocurre la historia", "cómo se resuelve el problema", "el nombre del personaje principal"], correctIndex: 2 },
        { question: "El resumen escrito se diferencia del oral porque el escrito:", options: ["es más largo", "incluye todos los detalles", "solo cubre los puntos más importantes", "narra desde el punto de vista de otro personaje"], correctIndex: 2 },
      ],
    },
  };

  return pools[topicId]?.[lang] ?? [
    {
      question: lang === "bg" ? "Питай AYA!" : lang === "es" ? "¡Pregunta a AYA!" : "Ask AYA!",
      options: ["A", "B", "C", "D"],
      correctIndex: 0,
    },
  ];
}

/* ─── Math quiz helper ─────────────────────────────────────────── */

function mathQuizQuestions(topicId: string, grade: number): QuizQuestion[] {
  const gen = mathProblemFn(topicId, grade, "en"); // lang doesn't matter for number problems
  return Array.from({ length: 3 }, () => {
    const prob = gen();
    const correct = parseInt(prob.answer, 10);
    const spread = Math.max(5, Math.ceil(Math.abs(correct) * 0.2));
    const { options, correctIndex } = mcOptions(correct, spread);
    return { question: prob.question, options, correctIndex };
  });
}

/* ─── Main export ─────────────────────────────────────────────── */

const MATH_SUBJECTS = new Set(["addition", "subtraction", "multiplication", "division", "word-problems"]);

export function getLessonContent(
  subjectId: string,
  topicId: string,
  grade: number,
  lang: LangCode,
): LessonContent {
  const isMath = subjectId === "mathematics" && MATH_SUBJECTS.has(topicId);
  const topicText = getTopicText(subjectId, topicId, grade, lang);

  // Practice problems
  const practiceProblems = isMath
    ? Array.from({ length: 5 }, () => mathProblemFn(topicId, grade, lang)())
    : textPractice(topicId, lang, grade);

  // Quiz questions
  const quizQuestions = isMath
    ? mathQuizQuestions(topicId, grade)
    : textQuiz(topicId, lang);

  return {
    lesson: {
      title: topicText.title,
      explanation: topicText.explanation,
      examples: topicText.examples,
      tip: topicText.tip,
    },
    practice: {
      instructions: practiceInstructions(lang),
      problems: practiceProblems,
    },
    quiz: {
      instructions: quizInstructions(lang),
      questions: quizQuestions,
    },
  };
}
