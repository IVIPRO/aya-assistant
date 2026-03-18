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
      (x, y) => ({ q: `На поляна има ${x} птици. Прилетяват ещe ${y}. Колко са общо?`, ans: String(x + y) }),
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
          explanation: "Събирането означава да сложим числа заедно и да намерим тяхната сума. Когато събираме, броим всичките части заедно.",
          examples: [
            { problem: "3 + 4", solution: "= 7", hint: "Нарисувай 3 точки, после 4 точки. Преброй всички заедно." },
            { problem: "6 + 2", solution: "= 8", hint: "Започни от 6 на числовата линия и прескочи 2 стъпки напред." },
            { problem: "5 + 5", solution: "= 10", hint: "Двойните събирания са лесни — две еднакви групи!" },
          ],
          tip: "🖐️ Можеш да използваш пръстите си, когато числата са малки!",
        },
        high: {
          title: "Събиране",
          explanation: "При събиране на по-големи числа ги наредете по разряди (единици, десетици, стотици) и събирайте всяка колона отдясно наляво. Ако сборът е 10 или повече, пренасяме в следващия разряд.",
          examples: [
            { problem: "47 + 35", solution: "= 82", hint: "7+5=12, пишем 2 и пренасяме 1. После 4+3+1=8." },
            { problem: "136 + 248", solution: "= 384", hint: "6+8=14, пишем 4 и пренасяме 1. 3+4+1=8. 1+2=3." },
            { problem: "509 + 374", solution: "= 883", hint: "9+4=13, пишем 3. 0+7+1=8. 5+3=8." },
          ],
          tip: "📐 Винаги наредете цифрите по разряди преди да събирате!",
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
          explanation: "Изваждането означава да вземем от група и да открием колко остава. То е обратното на събирането.",
          examples: [
            { problem: "8 − 3", solution: "= 5", hint: "Започни с 8 предмета, вземи 3. Преброй останалите." },
            { problem: "10 − 4", solution: "= 6", hint: "Брои назад 4 стъпки от 10 на числовата линия." },
            { problem: "7 − 7", solution: "= 0", hint: "Ако вземем всичко, не остава нищо — нула!" },
          ],
          tip: "🔢 При изваждането резултатът не може да е повече от началното число!",
        },
        high: {
          title: "Изваждане",
          explanation: "При изваждане на по-големи числа ги наредете по разряди и изваждайте всяка колона отдясно наляво. Ако горната цифра е по-малка, заемаме 10 от следващия разряд.",
          examples: [
            { problem: "73 − 28", solution: "= 45", hint: "3 < 8, заемаме: 13−8=5. После 6−2=4." },
            { problem: "400 − 156", solution: "= 244", hint: "Заемаме внимателно: 10−6=4, 9−5=4, 3−1=2." },
            { problem: "605 − 237", solution: "= 368", hint: "5−7 → заемаме: 15−7=8. 9−3=6. 5−2=3." },
          ],
          tip: "📝 Когато заемаме от нула, трябва да заемем от две колони!",
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
