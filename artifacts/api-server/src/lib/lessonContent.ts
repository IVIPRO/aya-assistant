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
          tip: "🔑 Прочети задачата два пъти. Оградиоnúmeros. Подчертай въпроса. После реши!",
        },
        high: {
          title: "Текстови задачи",
          explanation: "Решавай задачи от реалния свят, като определиш кое действие трябва (събиране, изваждане, умножение, деление). Двойните задачи нуждаят се от два операции. Винаги проверявай, че отговорът има смисъл.",
          examples: [
            { problem: "Магазин има 48 ябълки в 6 кошници поравно. По колко ябълки в кошница?", solution: "8 ябълки в кошница", hint: "Дели: 48 ÷ 6 = 8. Проверка: 8 × 6 = 48 ✓" },
            { problem: "Том чита 12 страни в ден за 5 дни, после 3 страни повече. Общо?", solution: "63 страни", hint: "Два стъпа: 12 × 5 = 60, после 60 + 3 = 63" },
            { problem: "Фермер засява 25 реда моркови с по 8 растения. Колко общо?", solution: "200 растения", hint: "Умножи: 25 × 8 = 200" },
          ],
          tip: "✅ Винаги прочети отново въпроса, за да проверишче отговорът го отговаря!",
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
          explanation: "Четенето на български текстове те помага да научиш езика естествено. Начни с кратки, прости разкази и се фокусирай да намираш нови думи. Прочети един път за основната идея, после отново за подробности.",
          examples: [
            { problem: "Прочети: 'На поляна живее малко мече.'", solution: "Основна идея: Малко мече живее на поляна.", hint: "'На поляна' = поле, 'мече' = животно, 'живее' = е там" },
            { problem: "Прочети: 'Момичето чете книга в училище.'", solution: "Момичето чита вкъщи книга в класната стая.", hint: "'Момичето' = дете, 'чете' = чита, 'книга' = текст, 'училище' = школа" },
            { problem: "Прочети: 'Котето е гладно и иска храна.'", solution: "Котката е гладна и иска да яде.", hint: "'Котето' = малко коте, 'гладно' = има нужда от храна, 'иска' = желае" },
          ],
          tip: "📖 След четенето затвори книгата и преразкажи историята със своите думи!",
        },
        high: {
          title: "Четене на български",
          explanation: "Чети по-дълги български текстове с различни структури на изреченията. Потърси основната идея и подробностите. Прависпрогнози какво ще се случи после и задавай въпроси.",
          examples: [
            { problem: "Прочети: 'Момчето отиде в гора и видя красива птица. Птицата пееше прелестно.'", solution: "Момчето видя птица в гората, която пееше красиво.", hint: "Последователност: отиде (першо) → видя (второ) → пееше (третьо)" },
            { problem: "Прочети: 'На село живеят интересни животни. Всяко животно е различно.'", solution: "Интересни животни живеят на село, всяко е уникално.", hint: "'Интересни' = привлекателни, 'различно' = неодинаково" },
            { problem: "Прочети: 'Децата играха в парка целия ден.'", solution: "Децата прекараха целия ден играещи в парка.", hint: "'Целия ден' = от сутрин до вечер — показва времето" },
          ],
          tip: "❓ Попросебе: Кой? Какво? Кога? Къде? Защо? след всеки абзац!",
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
          title: "Писане на български",
          explanation: "Писането на български означава да формираш изречения от идеи. Началото е с прости изречения: подлог + глагол + предлог. Помни редоледа на думите. Използвай главни букви в началото и точка в края.",
          examples: [
            { problem: "Напиши просто изречение: 'I am happy.'", solution: "Аз съм щастлив/щастлива.", hint: "'Аз' = аз, 'съм' = е, 'щастлив' = доволен. Ред: подлог-глагол-прилагателно" },
            { problem: "Напиши: 'The cat drinks milk.'", solution: "Котката пие мляко.", hint: "'Котката' = животното, 'пие' = пиче, 'мляко' = течност. Ползваме артикъл 'та'" },
            { problem: "Напиши: 'I play in the park.'", solution: "Аз играя в парка.", hint: "'Играя' = реша се, 'в' = вътре, 'парка' = място" },
          ],
          tip: "✍️ Напиши 3 прости изречения всеки ден. Начни с: 'Аз съм...', 'На мен харесва...', 'Днес...'",
        },
        high: {
          title: "Писане на български",
          explanation: "Пишеи по-дълги изречения и ги съединяй със 'и' (и), 'защото' (защото), 'но' (но). Внимавай на правилното използване на глаголи и съгласуване на прилагателни. Проверявай правопис и пунктуация.",
          examples: [
            { problem: "Напиши сложно изречение: 'I am happy and I play.'", solution: "Аз съм щастлив/а и играя.", hint: "'И' = съединител — свързва две идеи. Глаголите са в един вид време" },
            { problem: "Напиши: 'The girl reads because she likes books.'", solution: "Момичето чета защото й харесват книгите.", hint: "'Защото' = причина — обяснява защо. 'Харесват' се съгласува с 'книгите' (множество)" },
            { problem: "Напиши: 'The day is beautiful but cold.'", solution: "Денят е прекрасен но студен.", hint: "'Но' = противопоставяне — показва контраст. Двете прилагателни се съгласуват с 'денят'" },
          ],
          tip: "📝 Напиши кратък абзац (5 изречения) за твоето любимо животно или ден!",
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
          tip: "💡 Разказите учат уроци! Попросебе: Какво научава героя? Какво трябва да науча?",
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
          tip: "❓ Попросебе на тези въпроси: Кой? Какво? Къде? Кога? Защо? Как?",
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
