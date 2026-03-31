type LangCode = "en" | "bg" | "es";

export interface LessonExample {
  problem: string;
  solution: string;
  hint: string;
  steps?: string[];
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

/* ─── Smart hint generation for addition ─────────────────────────── */
function generateAdditionHint(problem: string, answer: string, lang: string, grade: number): string {
  // Extract numbers from problem like "13 + 26"
  const match = problem.match(/(\d+)\s*\+\s*(\d+)/);
  if (!match) return "";
  
  const a = parseInt(match[1]);
  const b = parseInt(match[2]);
  
  if (lang === "bg") {
    // One-digit addition (grade 1)
    if (a < 10 && b < 10) {
      if (a === b) {
        return `Две еднакви групи от ${a} — това е ${answer}!`;
      }
      return `Събери ${a} и ${b}. Можеш да броиш на пръсти или да ния́сяш от ${a}.`;
    }
    
    // Two-digit addition (grade 2+)
    const aOnes = a % 10;
    const aTens = Math.floor(a / 10);
    const bOnes = b % 10;
    const bTens = Math.floor(b / 10);
    
    const onesSum = aOnes + bOnes;
    const tensSum = aTens + bTens;
    const hasCarry = onesSum >= 10;
    
    if (hasCarry) {
      return `${a} = ${aTens} дес. и ${aOnes} един., ${b} = ${bTens} дес. и ${bOnes} един.` +
             `\nЕдиници: ${aOnes} + ${bOnes} = ${onesSum} (пиши ${onesSum % 10}, пренасяй 1)` +
             `\nДесетици: ${aTens} + ${bTens} + 1 = ${tensSum + 1}` +
             `\nОтговор: ${answer}`;
    } else {
      return `${a} = ${aTens} дес. и ${aOnes} един., ${b} = ${bTens} дес. и ${bOnes} един.` +
             `\nЕдиници: ${aOnes} + ${bOnes} = ${onesSum}` +
             `\nДесетици: ${aTens} + ${bTens} = ${tensSum}` +
             `\nОтговор: ${answer}`;
    }
  }
  
  // English fallback
  if (a < 10 && b < 10) {
    if (a === b) {
      return `Two equal groups of ${a} — that's ${answer}!`;
    }
    return `Count ${a} and ${b} together.`;
  }
  
  const aOnes = a % 10;
  const aTens = Math.floor(a / 10);
  const bOnes = b % 10;
  const bTens = Math.floor(b / 10);
  const onesSum = aOnes + bOnes;
  const hasCarry = onesSum >= 10;
  
  if (hasCarry) {
    return `${a} = ${aTens} tens and ${aOnes}, ${b} = ${bTens} tens and ${bOnes}.` +
           ` Add ones: ${aOnes} + ${bOnes} = ${onesSum} (write ${onesSum % 10}, carry 1).` +
           ` Add tens: ${aTens} + ${bTens} + 1 = ${Math.floor(answer as any / 10)}.`;
  }
  
  return `${a} = ${aTens} tens and ${aOnes}, ${b} = ${bTens} tens and ${bOnes}.` +
         ` Add ones: ${aOnes} + ${bOnes} = ${onesSum}.` +
         ` Add tens: ${aTens} + ${bTens} = ${Math.floor(answer as any / 10)}.`;
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

function algebraProb(grade: number): MathProblem {
  // Simple algebra: x + a = b → find x
  // or: a × x = b → find x
  if (Math.random() < 0.5) {
    // Addition/subtraction: x + a = b
    const x = rnd(1, 20);
    const a = rnd(1, 15);
    const b = x + a;
    return { question: `x + ${a} = ${b}`, answer: String(x) };
  } else {
    // Multiplication: a × x = b
    const x = rnd(2, 12);
    const a = rnd(2, 8);
    const b = x * a;
    return { question: `${a} × x = ${b}`, answer: String(x) };
  }
}

function fractionsProb(grade: number): MathProblem {
  // Fractions problems: identify fractions, simplify, or compare
  const type = rnd(0, 2);
  if (type === 0) {
    // Identify fraction: "What fraction is X out of Y?"
    const total = rnd(4, 12);
    const shaded = rnd(1, total - 1);
    return { question: `What fraction is ${shaded} out of ${total} equal parts?`, answer: `${shaded}/${total}` };
  } else if (type === 1) {
    // Simplify fraction: "Simplify X/Y"
    const pairs = [[2,4], [2,6], [3,6], [3,9], [4,8], [4,12], [5,10], [6,9]];
    const [num, den] = pairs[rnd(0, pairs.length - 1)];
    const gcd = num === den ? num : num === 2 && den === 4 ? 2 : num === 2 && den === 6 ? 2 : num === 3 && den === 6 ? 3 : num === 3 && den === 9 ? 3 : num === 4 && den === 8 ? 4 : num === 4 && den === 12 ? 4 : num === 5 && den === 10 ? 5 : num === 6 && den === 9 ? 3 : 1;
    const simpNum = num / gcd;
    const simpDen = den / gcd;
    return { question: `Simplify ${num}/${den}`, answer: `${simpNum}/${simpDen}` };
  } else {
    // Equivalent fractions: "Are X/Y and A/B equal?"
    const pairs = [[1,2,2,4], [1,3,2,6], [2,3,4,6], [1,4,2,8], [3,4,6,8]];
    const [n1, d1, n2, d2] = pairs[rnd(0, pairs.length - 1)];
    return { question: `Are ${n1}/${d1} and ${n2}/${d2} equal?`, answer: "Yes" };
  }
}

function naturalNumbersProb(grade: number): MathProblem {
  const type = rnd(0, 1);
  if (type === 0) {
    const a = rnd(5, 30), b = rnd(10, 50);
    return { question: `Which number is natural: ${-a}, ${rnd(1, 20)}, 0?`, answer: String(rnd(1, 20)) };
  } else {
    const a = rnd(1, 10);
    return { question: `Write 3 natural numbers greater than ${a}`, answer: String(a+1) + ", " + String(a+2) + ", " + String(a+3) };
  }
}

function divisibilityProb(grade: number): MathProblem {
  const nums = [12, 15, 20, 24, 30, 35, 40, 45, 50];
  const n = nums[rnd(0, nums.length - 1)];
  const divisors = [[12, 2], [12, 3], [12, 4], [15, 3], [15, 5], [20, 4], [20, 5], [24, 6], [30, 5], [30, 6]];
  const [num, div] = divisors[rnd(0, divisors.length - 1)];
  return { question: `Is ${num} divisible by ${div}?`, answer: (num % div === 0 ? "Yes" : "No") };
}

function commonFractionsProb(grade: number): MathProblem {
  const pairs = [[1,2], [1,4], [3,4], [2,5], [3,8]];
  const [num, den] = pairs[rnd(0, pairs.length - 1)];
  return { question: `What fraction is ${num} out of ${den} equal parts?`, answer: `${num}/${den}` };
}

function decimalFractionsProb(grade: number): MathProblem {
  const type = rnd(0, 4);
  if (type === 0) {
    // Addition of decimals
    const a = rnd(1, 5), b = rnd(1, 9), c = rnd(1, 5), d = rnd(1, 9);
    const result = (a + b/10 + c + d/10).toFixed(1);
    return { question: `Събери: ${a}.${b} + ${c}.${d}`, answer: result };
  } else if (type === 1) {
    // Subtraction of decimals
    const a = rnd(4, 8), b = rnd(1, 9), c = rnd(1, 4), d = rnd(1, 9);
    const result = (a + b/10 - c - d/10).toFixed(1);
    return { question: `Извади: ${a}.${b} − ${c}.${d}`, answer: result };
  } else if (type === 2) {
    // Comparison of decimals
    const nums = [[3.4, "3.04"], [2.5, "2.50"], [1.8, "1.80"], [4.6, "4.06"], [5.2, "5.20"]];
    const [n1, n2] = nums[rnd(0, nums.length - 1)];
    return { question: `Кое число е по-голямо: ${n1} или ${n2}?`, answer: String(n1) };
  } else if (type === 3) {
    // Rounding decimals
    const a = rnd(2, 9), b = rnd(1, 9);
    const rounded = Math.round(a + b/10);
    return { question: `Закръгли ${a}.${b} до най-близкото цяло число.`, answer: String(rounded) };
  } else {
    // Decimal to fraction conversion
    const pairs = [[0.5, "1/2"], [0.25, "1/4"], [0.75, "3/4"], [0.2, "1/5"], [0.1, "1/10"]];
    const [dec, frac] = pairs[rnd(0, pairs.length - 1)];
    return { question: `Преобразувай ${dec} в обикновена дроб.`, answer: frac };
  }
}

function geometricFiguresProb(grade: number): MathProblem {
  const shapes = [
    { q: "How many sides does a triangle have?", a: "3" },
    { q: "How many sides does a square have?", a: "4" },
    { q: "How many sides does a pentagon have?", a: "5" },
    { q: "How many sides does a hexagon have?", a: "6" }
  ];
  const { q, a } = shapes[rnd(0, shapes.length - 1)];
  return { question: q, answer: a };
}

function perimeterAreaProb(grade: number): MathProblem {
  const type = rnd(0, 1);
  if (type === 0) {
    const side = rnd(3, 8);
    return { question: `Perimeter of a square with side ${side} cm?`, answer: String(4 * side) + " cm" };
  } else {
    const len = rnd(4, 8), width = rnd(2, 6);
    return { question: `Area of rectangle: length ${len} cm, width ${width} cm?`, answer: String(len * width) + " cm²" };
  }
}

function percentageProb(grade: number): MathProblem {
  const type = rnd(0, 1);
  if (type === 0) {
    const n = [50, 100, 200];
    const num = n[rnd(0, n.length - 1)];
    return { question: `What is 50% of ${num}?`, answer: String(num * 0.5) };
  } else {
    const n = [100, 200, 400];
    const num = n[rnd(0, n.length - 1)];
    return { question: `What is 25% of ${num}?`, answer: String(num * 0.25) };
  }
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
    case "addition":         return () => addProb(grade);
    case "subtraction":      return () => subProb(grade);
    case "multiplication":   return () => mulProb(grade);
    case "division":         return () => divProb(grade);
    case "word-problems":    return () => wordProb(grade, lang);
    case "algebra-basics":   return () => algebraProb(grade);
    case "fractions-adv":    return () => fractionsProb(grade);
    case "natural-numbers":  return () => naturalNumbersProb(grade);
    case "divisibility":     return () => divisibilityProb(grade);
    case "common-fractions": return () => commonFractionsProb(grade);
    case "decimal-fractions": return () => decimalFractionsProb(grade);
    case "geometric-figures": return () => geometricFiguresProb(grade);
    case "perimeter-area":   return () => perimeterAreaProb(grade);
    case "percentage-5grade": return () => percentageProb(grade);
    case "word-problems-5grade": return () => wordProb(grade, lang);
    default:                 return () => addProb(grade);
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
            { problem: "13 + 26", solution: "= 39", hint: "13 = 1 дес. и 3 един., 26 = 2 дес. и 6 един.\nЕдиници: 3 + 6 = 9\nДесетици: 1 + 2 = 3\nОтговор: 39", steps: ["Разложи числата по разряди", "Събери единиците: 3 + 6 = 9", "Събери десетиците: 1 + 2 = 3", "Получаваш: 30 + 9 = 39"] },
            { problem: "24 + 15", solution: "= 39", hint: "24 = 2 дес. и 4 един., 15 = 1 дес. и 5 един.\nЕдиници: 4 + 5 = 9\nДесетици: 2 + 1 = 3\nОтговор: 39", steps: ["Разложи числата по разряди", "Събери единиците: 4 + 5 = 9", "Събери десетиците: 2 + 1 = 3", "Получаваш: 30 + 9 = 39"] },
            { problem: "18 + 17", solution: "= 35", hint: "18 = 1 дес. и 8 един., 17 = 1 дес. и 7 един.\nЕдиници: 8 + 7 = 15 (пиши 5, пренасяй 1)\nДесетици: 1 + 1 + 1 = 3\nОтговор: 35", steps: ["Разложи числата по разряди", "Събери единиците: 8 + 7 = 15", "Единиците: пиши 5, пренасяй 1 в десетиците", "Десетици: 1 + 1 + 1 = 3", "Получаваш: 30 + 5 = 35"] },
          ],
          tip: "🖐️ При малки числа можеш да броиш на пръсти! При по-големи ги раздели по разряди.",
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
    /* ── NATURE-SCIENCE / SEASONS ── */
    "nature-science/seasons": {
      en: {
        low: {
          title: "The Four Seasons",
          explanation: "There are four seasons in a year: spring, summer, autumn, and winter. Each season has its own weather, plants, and activities. Spring is warm and flowers bloom. Summer is hot and sunny. Autumn is cool and leaves fall. Winter is cold and it can snow.",
          examples: [
            { problem: "What are the four seasons?", solution: "Spring, Summer, Autumn, Winter.", hint: "Think: what weather do you know? Cold, hot, warm, cool..." },
            { problem: "In which season do flowers bloom?", solution: "Spring — it gets warm after winter, plants wake up and flowers open.", hint: "Think: after cold winter, what comes?" },
            { problem: "Name one thing you can do in summer.", solution: "Swim in the sea or river, play outside, eat ice cream — because summer is warm and sunny.", hint: "Summer is the hottest season." },
          ],
          tip: "🌸❄️ Remember the seasons with colours: Spring = green, Summer = yellow, Autumn = orange, Winter = white!",
        },
        high: {
          title: "Seasons and Changes in Nature",
          explanation: "The seasons change because the Earth orbits the Sun. When your part of the Earth tilts toward the Sun, it is warmer — summer. When it tilts away, it is colder — winter. Each season brings changes: animals migrate, plants grow or lose leaves, days get longer or shorter.",
          examples: [
            { problem: "Why does summer have longer days than winter?", solution: "In summer the Earth is tilted toward the Sun, so the Sun is up for more hours each day.", hint: "Think about how long it stays light outside in summer vs winter." },
            { problem: "What do deciduous trees do in autumn?", solution: "They lose their leaves — the tree saves energy for winter when there is less sunlight.", hint: "Deciduous = trees that shed leaves. Oak, beech, maple." },
            { problem: "Name one way animals adapt to winter.", solution: "Bears hibernate (sleep all winter). Birds migrate south. Rabbits grow thicker white fur.", hint: "Animals survive winter by storing food, sleeping, or moving somewhere warmer." },
          ],
          tip: "🌍 The Earth's tilt causes seasons — not how far it is from the Sun!",
        },
      },
      bg: {
        low: {
          title: "Четирите годишни времена",
          explanation: "Годината има четири сезона: пролет, лято, есен и зима. Всеки сезон има различно време, различни растения и различни занимания. Пролетта е топла и цветята цъфтят. Лятото е горещо и слънчево. Есента е хладна и листата падат. Зимата е студена и може да вали сняг.",
          examples: [
            { problem: "Кои са четирите годишни времена?", solution: "Пролет, лято, есен, зима.", hint: "Сетни кое е студено, горещо, топло, хладно..." },
            { problem: "Кога цъфтят цветята?", solution: "Напролет — след студената зима природата се събужда и цветята отварят.", hint: "Мисли: след зимата какво идва?" },
            { problem: "Назови едно нещо, което правиш лятото.", solution: "Плувам, играя навън, ям сладолед — защото лятото е топло и слънчево.", hint: "Лятото е най-горещото годишно време." },
          ],
          tip: "🌸❄️ Запомни сезоните с цветове: пролет = зелено, лято = жълто, есен = оранжево, зима = бяло!",
        },
        high: {
          title: "Сезоните и промените в природата",
          explanation: "Сезоните се сменят, защото Земята се върти около Слънцето. Когато твоята страна е наклонена към Слънцето — е лято и е по-топло. Когато е наклонена встрани — е зима и е студено. Всеки сезон носи промени: животните мигрират, растенията растат или губят листа, дните стават по-дълги или по-къси.",
          examples: [
            { problem: "Защо лятото има по-дълги дни от зимата?", solution: "Лятото Земята е наклонена към Слънцето — затова то грее повече часове на ден.", hint: "Сетни колко дълго е светло лятото спрямо зимата." },
            { problem: "Какво правят листопадните дървета есента?", solution: "Губят листата си — дървото пести енергия за зимата, когато слънчевата светлина е по-малко.", hint: "Листопадни = дървета, които губят листата си. Дъб, бук, клен." },
            { problem: "Назови един начин, по който животните се приспособяват към зимата.", solution: "Мечките зимуват (спят цяла зима). Птиците мигрират на юг. Зайците израстват по-гъста бяла козина.", hint: "Животните оцеляват зимата като трупат храна, спят или се преместват на по-топло място." },
          ],
          tip: "🌍 Наклонът на Земята причинява сезоните — не разстоянието до Слънцето!",
        },
      },
      es: {
        low: {
          title: "Las cuatro estaciones",
          explanation: "El año tiene cuatro estaciones: primavera, verano, otoño e invierno. Cada estación tiene su propio clima, plantas y actividades. La primavera es cálida y florecen las flores. El verano es caliente y soleado. El otoño es fresco y las hojas caen. El invierno es frío y puede nevar.",
          examples: [
            { problem: "¿Cuáles son las cuatro estaciones?", solution: "Primavera, Verano, Otoño, Invierno.", hint: "Piensa: ¿qué tiempo conoces? Frío, caliente, cálido, fresco..." },
            { problem: "¿En qué estación florecen las flores?", solution: "En primavera — después del frío invierno, la naturaleza despierta y las flores se abren.", hint: "Piensa: después del invierno frío, ¿qué viene?" },
            { problem: "Nombra algo que puedes hacer en verano.", solution: "Nadar en el mar, jugar afuera, comer helado — porque el verano es cálido y soleado.", hint: "El verano es la estación más caliente." },
          ],
          tip: "🌸❄️ Recuerda las estaciones con colores: Primavera = verde, Verano = amarillo, Otoño = naranja, Invierno = blanco!",
        },
        high: {
          title: "Las estaciones y los cambios en la naturaleza",
          explanation: "Las estaciones cambian porque la Tierra orbita alrededor del Sol. Cuando tu parte de la Tierra se inclina hacia el Sol, es más cálido — verano. Cuando se inclina hacia el otro lado, es más frío — invierno. Cada estación trae cambios: los animales migran, las plantas crecen o pierden hojas.",
          examples: [
            { problem: "¿Por qué el verano tiene días más largos que el invierno?", solution: "En verano la Tierra está inclinada hacia el Sol, por lo que el Sol permanece arriba más horas al día.", hint: "Piensa en cuánto tiempo permanece luminoso en verano vs. invierno." },
            { problem: "¿Qué hacen los árboles caducos en otoño?", solution: "Pierden sus hojas — el árbol ahorra energía para el invierno cuando hay menos luz solar.", hint: "Caducos = árboles que pierden sus hojas. Roble, haya, arce." },
            { problem: "Nombra una forma en que los animales se adaptan al invierno.", solution: "Los osos hibernan (duermen todo el invierno). Las aves migran al sur. Los conejos crecen pelo más grueso y blanco.", hint: "Los animales sobreviven el invierno almacenando comida, durmiendo o moviéndose a lugares más cálidos." },
          ],
          tip: "🌍 ¡La inclinación de la Tierra causa las estaciones — no la distancia al Sol!",
        },
      },
    },

    /* ── NATURE-SCIENCE / WEATHER ── */
    "nature-science/weather": {
      en: {
        low: {
          title: "What Is the Weather?",
          explanation: "Weather tells us what the sky and air are like outside right now. Is it sunny or cloudy? Warm or cold? Windy or calm? Rainy or dry? We can describe weather using words like: sunny, rainy, snowy, windy, cloudy, foggy, stormy. A thermometer measures temperature — how hot or cold it is.",
          examples: [
            { problem: "Name 3 weather types.", solution: "Sunny, rainy, snowy, windy, cloudy, foggy, stormy — any 3 are correct!", hint: "Look out the window — what do you see?" },
            { problem: "What tool measures temperature?", solution: "A thermometer. It shows how hot or cold the air is, usually in degrees Celsius (°C).", hint: "Thermo = heat. Meter = measure." },
            { problem: "What should you wear when it rains?", solution: "A raincoat or jacket and boots — to stay warm and dry.", hint: "Think: how do you protect yourself from rain?" },
          ],
          tip: "🌤️ Check the weather every morning! It helps you decide what to wear and what to bring.",
        },
        high: {
          title: "Weather Patterns and Climate",
          explanation: "Weather is what the atmosphere does each day. Climate is the average weather of a region over many years. Clouds form when water vapour rises, cools, and condenses into tiny droplets. Rain falls when cloud droplets combine and get heavy. Bulgaria has a temperate continental climate — cold winters, warm summers.",
          examples: [
            { problem: "What is the difference between weather and climate?", solution: "Weather = what happens on a specific day. Climate = the typical weather of a region over 30+ years.", hint: "Weather changes daily; climate changes very slowly over decades." },
            { problem: "How do clouds form?", solution: "Water on Earth evaporates (becomes water vapour), rises into cool air, condenses into tiny droplets, and forms clouds.", hint: "Think of steam from hot soup — that is water vapour condensing as it cools." },
            { problem: "Name the stages of the water cycle.", solution: "1. Evaporation — water becomes vapour. 2. Condensation — vapour forms clouds. 3. Precipitation — rain/snow falls. 4. Collection — water collects in rivers and seas.", hint: "Sun → evaporation → cloud → rain → river → sea → repeat." },
          ],
          tip: "💧 The water cycle has no beginning or end — water is constantly moving between land, sea, and sky!",
        },
      },
      bg: {
        low: {
          title: "Какво е времето?",
          explanation: "Времето ни казва какво е небето и въздухът навън в момента. Слънчево ли е или облачно? Топло или студено? Ветровито или тихо? Дъждовно или сухо? Можем да опишем времето с думи като: слънчево, дъждовно, снежно, ветровито, облачно, мъгливо, бурно. Термометърът измерва температурата.",
          examples: [
            { problem: "Назови 3 вида времето.", solution: "Слънчево, дъждовно, снежно, ветровито, облачно, мъгливо, бурно — всеки 3 са верни!", hint: "Погледни навън — какво виждаш?" },
            { problem: "С какво се мери температурата?", solution: "С термометър. Той показва колко е топъл или студен въздухът, обикновено в градуси по Целзий (°C).", hint: "Термо = топлина. Метър = мярка." },
            { problem: "Какво трябва да облечеш, когато вали дъжд?", solution: "Дъждобран или яке и гумени ботуши — за да останеш топъл и сух.", hint: "Как се предпазваш от дъжда?" },
          ],
          tip: "🌤️ Проверявай времето всяка сутрин! Ще знаеш какво да облечеш и какво да вземеш.",
        },
        high: {
          title: "Времето и климатът",
          explanation: "Времето е това, което атмосферата прави всеки ден. Климатът е средното време за даден регион за много години. Облаците се образуват, когато водната пара се издига, охлажда и кондензира в малки капчици. Дъждът пада, когато капчиците се събират и стават тежки. България има умерено-континентален климат — студени зими, топли лета.",
          examples: [
            { problem: "Каква е разликата между времето и климата?", solution: "Времето = какво се случва конкретен ден. Климат = типичното за даден регион за 30+ години.", hint: "Времето се мени всеки ден; климатът се мени много бавно — за десетилетия." },
            { problem: "Как се образуват облаците?", solution: "Водата изпарява (става водна пара), издига се нагоре, охлажда се и кондензира в малки капчици, образувайки облак.", hint: "Като парата от горещ чай — кондензира, когато се охлади." },
            { problem: "Назови стъпките на водния цикъл.", solution: "1. Изпарение — водата се превръща в пара. 2. Кондензация — парата образува облаци. 3. Валеж — пада дъжд или сняг. 4. Събиране — водата тече в реки и морета.", hint: "Слънце → изпарение → облак → дъжд → река → море → отново." },
          ],
          tip: "💧 Водният цикъл няма начало или край — водата непрекъснато се движи между сушата, морето и небето!",
        },
      },
      es: {
        low: {
          title: "¿Qué es el tiempo?",
          explanation: "El tiempo nos dice cómo está el cielo y el aire fuera ahora mismo. ¿Está soleado o nublado? ¿Cálido o frío? ¿Ventoso o tranquilo? ¿Lluvioso o seco? Podemos describir el tiempo con palabras como: soleado, lluvioso, nevado, ventoso, nublado, brumoso, tormentoso. Un termómetro mide la temperatura.",
          examples: [
            { problem: "Nombra 3 tipos de tiempo.", solution: "Soleado, lluvioso, nevado, ventoso, nublado, brumoso, tormentoso — ¡cualquier 3 son correctos!", hint: "Mira afuera, ¿qué ves?" },
            { problem: "¿Qué herramienta mide la temperatura?", solution: "Un termómetro. Muestra qué tan caliente o frío está el aire, generalmente en grados Celsius (°C).", hint: "Thermo = calor. Metro = medida." },
            { problem: "¿Qué deberías usar cuando llueve?", solution: "Un impermeable o chaqueta y botas — para mantenerte cálido y seco.", hint: "¿Cómo te proteges de la lluvia?" },
          ],
          tip: "🌤️ ¡Revisa el tiempo cada mañana! Te ayudará a decidir qué usar y qué llevar.",
        },
        high: {
          title: "Patrones del tiempo y clima",
          explanation: "El tiempo es lo que hace la atmósfera cada día. El clima es el tiempo típico de una región durante muchos años. Las nubes se forman cuando el vapor de agua sube, se enfría y condensa en pequeñas gotas. La lluvia cae cuando las gotas se combinan y se vuelven pesadas.",
          examples: [
            { problem: "¿Cuál es la diferencia entre tiempo y clima?", solution: "Tiempo = qué ocurre en un día específico. Clima = el tiempo típico de una región durante 30+ años.", hint: "El tiempo cambia a diario; el clima cambia muy lentamente." },
            { problem: "¿Cómo se forman las nubes?", solution: "El agua se evapora (se convierte en vapor), sube al aire frío, se condensa en pequeñas gotas y forma nubes.", hint: "Como el vapor del té caliente — se condensa al enfriarse." },
            { problem: "Nombra las etapas del ciclo del agua.", solution: "1. Evaporación. 2. Condensación. 3. Precipitación. 4. Recolección en ríos y mares.", hint: "Sol → evaporación → nube → lluvia → río → mar → repetir." },
          ],
          tip: "💧 ¡El ciclo del agua no tiene principio ni fin — el agua se mueve constantemente!",
        },
      },
    },

    /* ── LOGIC-THINKING / COMPARISON ── */
    "logic-thinking/comparison": {
      en: {
        low: {
          title: "Comparing Things",
          explanation: "We compare things to find out how they are the same or different. We use words like: bigger, smaller, heavier, lighter, longer, shorter, more, fewer, faster, slower. To compare, look at ONE thing at a time: size, colour, shape, weight, speed, number. Always say WHAT you are comparing: 'A cat is smaller THAN a dog.'",
          examples: [
            { problem: "Which is bigger: a mouse or an elephant?", solution: "An elephant is much bigger than a mouse. Compare: size. Elephant — huge. Mouse — tiny.", hint: "Use 'bigger than' or 'smaller than' to compare." },
            { problem: "Anna has 5 apples. Bobi has 3 apples. Who has more?", solution: "Anna has more apples. 5 > 3. Bobi has fewer apples.", hint: "Compare the numbers: which is greater?" },
            { problem: "A car and a bicycle: which is faster?", solution: "A car is faster than a bicycle. A bicycle is slower than a car.", hint: "Think about how quickly each one travels." },
          ],
          tip: "🔍 Compare one property at a time: first size, then colour, then weight. Don't mix them up!",
        },
        high: {
          title: "Comparing with Multiple Attributes",
          explanation: "We can compare things by many attributes at once. A Venn diagram shows two overlapping circles: the left has things only one item has, the right has things only the other has, and the middle shows what they share. When comparing, use: 'Both... but...', 'Unlike X, Y has...', 'They share... but differ in...'",
          examples: [
            { problem: "Compare a fish and a bird: similarities and differences.", solution: "Both: animals, have eyes, need food and water. Fish: lives in water, has scales, breathes with gills. Bird: lives on land/air, has feathers and wings, breathes with lungs.", hint: "List both: what do they share? What is different?" },
            { problem: "3 is to 9 as 4 is to __?", solution: "12. Pattern: 3×3=9, so 4×3=12.", hint: "Find the relationship between the first pair, then apply it." },
            { problem: "Which statement is correct? A) All cats are animals. B) All animals are cats.", solution: "A is correct. All cats are animals, but not all animals are cats (dogs, birds, fish are animals too).", hint: "Can you think of an animal that is NOT a cat?" },
          ],
          tip: "🔵🟡 Venn diagrams are great for comparing: draw two overlapping circles and sort the features!",
        },
      },
      bg: {
        low: {
          title: "Сравняване",
          explanation: "Сравняваме неща, за да разберем в какво си приличат или се различават. Използваме думи като: по-голям, по-малък, по-тежък, по-лек, по-дълъг, по-къс, повече, по-малко, по-бърз, по-бавен. При сравнение гледаме ЕДНО нещо наведнъж: размер, цвят, форма, тегло, скорост. Винаги казваме КАЗваме какво сравняваме: 'Котката е по-малка ОТ кучето.'",
          examples: [
            { problem: "Кое е по-голямо: мишка или слон?", solution: "Слонът е много по-голям от мишката. Сравняваме: размер. Слон — огромен. Мишка — малка.", hint: "Използвай 'по-голям от' или 'по-малък от'." },
            { problem: "Анна има 5 ябълки. Боби има 3 ябълки. Кой има повече?", solution: "Анна има повече ябълки. 5 > 3. Боби има по-малко ябълки.", hint: "Сравни числата: кое е по-голямо?" },
            { problem: "Кола и велосипед: кое е по-бързо?", solution: "Колата е по-бърза от велосипеда. Велосипедът е по-бавен от колата.", hint: "Помисли колко бързо се движи всяко едно." },
          ],
          tip: "🔍 Сравнявай по едно свойство наведнъж: първо размер, после цвят, после тегло. Не ги бъркай!",
        },
        high: {
          title: "Сравняване по много белези",
          explanation: "Можем да сравняваме неща по много белези едновременно. Диаграмата на Вен показва два припокриващи се кръга: левият има само за едното, десният — само за другото, а в средата е общото. При сравнение използвай: 'И двете... но...', 'За разлика от Х, Y има...', 'Приличат си по... но се различават по...'",
          examples: [
            { problem: "Сравни риба и птица: прилики и разлики.", solution: "Общо: животни, имат очи, нуждаят се от храна и вода. Риба: живее във вода, има люспи, диша с хриле. Птица: живее на сушата/въздуха, има пера и крила, диша с бели дробове.", hint: "Изброй: какво имат общо? Какво е различно?" },
            { problem: "3 е към 9 като 4 е към __?", solution: "12. Закономерност: 3×3=9, значи 4×3=12.", hint: "Намери връзката в първата двойка, после я приложи." },
            { problem: "Кое твърдение е вярно? А) Всички котки са животни. Б) Всички животни са котки.", solution: "А е вярно. Всички котки са животни, но не всички животни са котки (кучета, птици, риби също са животни).", hint: "Можеш ли да измислиш животно, което не е котка?" },
          ],
          tip: "🔵🟡 Диаграмата на Вен е чудесна за сравнение: нарисувай два припокриващи се кръга и сортирай белезите!",
        },
      },
      es: {
        low: {
          title: "Comparar cosas",
          explanation: "Comparamos cosas para ver en qué se parecen o en qué se diferencian. Usamos palabras como: más grande, más pequeño, más pesado, más ligero, más largo, más corto, más, menos, más rápido, más lento. Para comparar, mira UNA cosa a la vez: tamaño, color, forma, peso, velocidad. Siempre di QUÉ comparas: 'Un gato es más pequeño QUE un perro.'",
          examples: [
            { problem: "¿Cuál es más grande: un ratón o un elefante?", solution: "Un elefante es mucho más grande que un ratón. Comparamos: tamaño. Elefante — enorme. Ratón — diminuto.", hint: "Usa 'más grande que' o 'más pequeño que' para comparar." },
            { problem: "Ana tiene 5 manzanas. Bobi tiene 3 manzanas. ¿Quién tiene más?", solution: "Ana tiene más manzanas. 5 > 3. Bobi tiene menos manzanas.", hint: "Compara los números: ¿cuál es mayor?" },
            { problem: "Un coche y una bicicleta: ¿cuál es más rápido?", solution: "Un coche es más rápido que una bicicleta. Una bicicleta es más lenta que un coche.", hint: "Piensa en qué tan rápido se mueve cada uno." },
          ],
          tip: "🔍 ¡Compara una propiedad a la vez: primero tamaño, luego color, luego peso. No los mezcles!",
        },
        high: {
          title: "Comparar con múltiples atributos",
          explanation: "Podemos comparar cosas por muchos atributos a la vez. Un diagrama de Venn muestra dos círculos superpuestos: el izquierdo tiene lo que solo tiene uno, el derecho lo que solo tiene el otro, y el medio muestra lo que comparten. Al comparar usa: 'Ambos... pero...', 'A diferencia de X, Y tiene...', 'Se parecen en... pero se diferencian en...'",
          examples: [
            { problem: "Compara un pez y un pájaro: similitudes y diferencias.", solution: "Ambos: animales, tienen ojos, necesitan comida y agua. Pez: vive en agua, tiene escamas, respira con branquias. Pájaro: vive en tierra/aire, tiene plumas y alas, respira con pulmones.", hint: "Lista: ¿qué tienen en común? ¿Qué es diferente?" },
            { problem: "3 es a 9 como 4 es a __?", solution: "12. Patrón: 3×3=9, entonces 4×3=12.", hint: "Encuentra la relación en el primer par, luego aplícala." },
            { problem: "¿Qué afirmación es correcta? A) Todos los gatos son animales. B) Todos los animales son gatos.", solution: "A es correcta. Todos los gatos son animales, pero no todos los animales son gatos.", hint: "¿Puedes pensar en un animal que NO sea un gato?" },
          ],
          tip: "🔵🟡 ¡Los diagramas de Venn son geniales para comparar: dibuja dos círculos superpuestos y clasifica las características!",
        },
      },
    },

    /* ── LOGIC-THINKING / SEQUENCING ── */
    "logic-thinking/sequencing": {
      en: {
        low: {
          title: "Putting Things in Order",
          explanation: "Sequencing means putting events or steps in the RIGHT order — from first to last. We use order words: first, then, next, after that, finally, last. The order matters! If you put on shoes before socks, something is wrong. Look for what must come BEFORE and what must come AFTER.",
          examples: [
            { problem: "Put in the right order: 3) Eat the apple. 1) Pick up the apple. 2) Wash the apple.", solution: "1. Pick up the apple. 2. Wash the apple. 3. Eat the apple. You must wash before eating!", hint: "What do you need to do first? You can't eat it before washing." },
            { problem: "What is missing? Plant seed → __ → Flower blooms.", solution: "Water the plant / the plant grows — after planting, the seed needs water and time to grow before it blooms.", hint: "What happens between planting and flowering?" },
            { problem: "Use sequence words to describe getting dressed: socks, trousers, shirt, shoes.", solution: "First, put on your socks. Then, put on your trousers. Next, put on your shirt. Finally, put on your shoes.", hint: "Which goes under which? Socks go before shoes!" },
          ],
          tip: "1️⃣2️⃣3️⃣ Use the words FIRST, THEN, NEXT, FINALLY to keep your sequence clear!",
        },
        high: {
          title: "Sequencing and Cause & Effect",
          explanation: "Advanced sequencing links events as causes and effects: A happens, BECAUSE of A, B happens, BECAUSE of B, C happens. Understanding sequence helps you follow instructions, solve problems, and write stories. Signal words: consequently, as a result, therefore, which led to, due to.",
          examples: [
            { problem: "Put in order: C) The cat chases the mouse. A) The mouse steals the cheese. B) The farmer sees the mouse.", solution: "A → B → C. The mouse steals cheese → farmer sees it → cat chases the mouse. Each event causes the next!", hint: "Ask: what causes what? A leads to B, B leads to C." },
            { problem: "Identify cause and effect: 'It rained heavily, so the river flooded.'", solution: "Cause: heavy rain. Effect: river flooded. Key word 'so' shows the cause-effect link.", hint: "Cause = why it happened. Effect = what happened as a result." },
            { problem: "Write 3 steps for making a sandwich using sequence words.", solution: "First, take two slices of bread. Then, spread butter or filling on one slice. Finally, place the second slice on top and press gently.", hint: "Steps: bread → filling → close. Use: First, Then, Finally." },
          ],
          tip: "🔗 Every effect becomes the cause of the next event — that's a chain of events!",
        },
      },
      bg: {
        low: {
          title: "Наредба — правилният ред",
          explanation: "Наредбата означава да наредим събитията или стъпките в ПРАВИЛНИЯ ред — от първото до последното. Използваме думи за ред: първо, после, след това, накрая. Редът е важен! Ако обуеш обувките преди чорапите — нещо не е наред. Гледай какво трябва да е ПРЕДИ и какво — СЛЕД.",
          examples: [
            { problem: "Наредете правилно: 3) Изяжда ябълката. 1) Взима ябълката. 2) Мие ябълката.", solution: "1. Взима ябълката. 2. Мие ябълката. 3. Изяжда ябълката. Трябва да измием преди да изядем!", hint: "Какво се прави първо? Не можеш да изядеш преди да измиеш." },
            { problem: "Какво липсва? Засаждам семе → __ → Цветето цъфти.", solution: "Поливам растението / то расте — след засаждането семето се нуждае от вода и време да порасне, преди да разцъфти.", hint: "Какво се случва между засаждането и цъфтежа?" },
            { problem: "Опиши обличането с думи за ред: чорапи, панталон, риза, обувки.", solution: "Първо слагам чорапите. После слагам панталона. След това слагам ризата. Накрая слагам обувките.", hint: "Кое е под кое? Чорапите са преди обувките!" },
          ],
          tip: "1️⃣2️⃣3️⃣ Използвай ПЪРВО, ПОСЛЕ, СЛЕД ТОВА, НАКРАЯ, за да е ясен редът!",
        },
        high: {
          title: "Наредба и причинно-следствени връзки",
          explanation: "Напредналата наредба свързва събитията като причина и следствие: А се случва, ЗАЩОТО А — следва Б, ЗАЩОТО Б — следва В. Разбирането на реда помага да следваш инструкции, да решаваш задачи и да пишеш разкази. Думи-сигнали: затова, в резултат, вследствие, поради това.",
          examples: [
            { problem: "Наредете: В) Котката гони мишката. А) Мишката краде сиренето. Б) Земеделецът вижда мишката.", solution: "А → Б → В. Мишката краде сиреното → земеделецът я вижда → котката я гони. Всяко събитие причинява следващото!", hint: "Питай: кое причинява кое? А води до Б, Б води до В." },
            { problem: "Определи причина и следствие: 'Валя силно, затова реката се разля.'", solution: "Причина: силен дъжд. Следствие: реката се разля. Думата 'затова' показва причинно-следствената връзка.", hint: "Причина = защо се случи. Следствие = какво се случи в резултат." },
            { problem: "Напиши 3 стъпки за правене на сандвич с думи за ред.", solution: "Първо взимам два филийки хляб. После намазвам масло или пълнеж на едната. Накрая слагам втората отгоре и натискам леко.", hint: "Стъпки: хляб → пълнеж → затваряне. Използвай: Първо, После, Накрая." },
          ],
          tip: "🔗 Всяко следствие се превръща в причина за следващото събитие — това е верига от събития!",
        },
      },
      es: {
        low: {
          title: "Ordenar las cosas",
          explanation: "Secuenciar significa poner eventos o pasos en el ORDEN CORRECTO — de primero a último. Usamos palabras de orden: primero, luego, después, a continuación, finalmente. ¡El orden importa! Si te pones los zapatos antes que los calcetines, algo está mal. Busca qué debe venir ANTES y qué debe venir DESPUÉS.",
          examples: [
            { problem: "Ordena correctamente: 3) Come la manzana. 1) Agarra la manzana. 2) Lava la manzana.", solution: "1. Agarrar. 2. Lavar. 3. Comer. ¡Debes lavar antes de comer!", hint: "¿Qué debes hacer primero? No puedes comer antes de lavar." },
            { problem: "¿Qué falta? Plantar semilla → __ → La flor florece.", solution: "Regar la planta / que la planta crezca — después de plantar, la semilla necesita agua y tiempo para crecer antes de florecer.", hint: "¿Qué pasa entre plantar y florecer?" },
            { problem: "Describe vestirse con palabras de secuencia: calcetines, pantalón, camisa, zapatos.", solution: "Primero, ponte los calcetines. Luego, ponte el pantalón. A continuación, ponte la camisa. Finalmente, ponte los zapatos.", hint: "¿Qué va debajo de qué? ¡Los calcetines van antes que los zapatos!" },
          ],
          tip: "1️⃣2️⃣3️⃣ ¡Usa PRIMERO, LUEGO, DESPUÉS, FINALMENTE para que tu secuencia sea clara!",
        },
        high: {
          title: "Secuencias y causa y efecto",
          explanation: "La secuenciación avanzada conecta eventos como causas y efectos: A ocurre, DEBIDO A A, ocurre B, DEBIDO A B, ocurre C. Palabras clave: consecuentemente, como resultado, por lo tanto, lo que llevó a, debido a.",
          examples: [
            { problem: "Ordena: C) El gato persigue al ratón. A) El ratón roba el queso. B) El granjero ve al ratón.", solution: "A → B → C. El ratón roba el queso → el granjero lo ve → el gato persigue al ratón. ¡Cada evento causa el siguiente!", hint: "Pregunta: ¿qué causa qué? A lleva a B, B lleva a C." },
            { problem: "Identifica causa y efecto: 'Llovió mucho, así que el río se desbordó.'", solution: "Causa: lluvia fuerte. Efecto: el río se desbordó. La palabra 'así que' muestra el vínculo causa-efecto.", hint: "Causa = por qué ocurrió. Efecto = qué ocurrió como resultado." },
            { problem: "Escribe 3 pasos para hacer un sándwich usando palabras de secuencia.", solution: "Primero, toma dos rebanadas de pan. Luego, unta mantequilla en una rebanada. Finalmente, coloca la segunda rebanada encima.", hint: "Pasos: pan → relleno → cerrar. Usa: Primero, Luego, Finalmente." },
          ],
          tip: "🔗 ¡Todo efecto se convierte en la causa del siguiente evento — ¡eso es una cadena de eventos!",
        },
      },
    },

    /* ── SOCIAL-STUDIES / FAMILY-COMMUNITY ── */
    "social-studies/family-community": {
      en: {
        low: {
          title: "Family and Community",
          explanation: "A family is a group of people who love and care for each other. Families can look different: some have a mother and father, some have grandparents too, some are big, some are small. A community is all the people who live in the same town or neighbourhood. Everyone in a community helps each other — teachers, doctors, firefighters, shopkeepers.",
          examples: [
            { problem: "Name 4 members of a typical family.", solution: "Mother, father, sister, brother — or grandparents (babà, dyado in Bulgarian), aunts, uncles.", hint: "Think of the people who live in your home or who you visit." },
            { problem: "Who helps you if you are sick?", solution: "A doctor (лекар) at a clinic or hospital. Your family also takes care of you.", hint: "Think of community helpers: doctor, nurse, pharmacist." },
            { problem: "Name 3 community helpers and what they do.", solution: "Teacher — teaches children. Firefighter — puts out fires and saves people. Police officer — keeps people safe.", hint: "Think of who helps your neighbourhood every day." },
          ],
          tip: "❤️ A community works because everyone does their part — including you!",
        },
        high: {
          title: "Roles in Family and Community",
          explanation: "Every family member has a role: parents provide food, shelter and love; children learn and help with chores; grandparents share wisdom. In a community, people have roles too: a mayor leads the town, teachers educate, doctors heal, builders construct, farmers grow food. Society works when everyone does their role responsibly.",
          examples: [
            { problem: "What responsibilities might a child have at home?", solution: "Tidying their room, helping wash dishes, feeding a pet, doing homework, being kind to siblings.", hint: "Responsibilities = things you are expected to do." },
            { problem: "Why do communities need rules?", solution: "Rules help people live together safely and fairly. Without rules, there would be chaos — people could get hurt or treated unfairly.", hint: "Think: what would happen if there were no traffic rules?" },
            { problem: "How is a community different from a family?", solution: "A family = a small group connected by love and kinship. A community = a larger group sharing a place (town, school, neighbourhood) — members may not know each other personally.", hint: "Family = small and personal. Community = larger and shared space." },
          ],
          tip: "🏘️ A strong community is built by people who respect each other and help when needed!",
        },
      },
      bg: {
        low: {
          title: "Семейство и общество",
          explanation: "Семейството е група от хора, които се обичат и се грижат един за друг. Семействата могат да изглеждат различно: някои имат майка и татко, при някои живеят и баба и дядо, едни са по-малки, а други по-големи. Обществото са всички хора, живеещи в едно населено място. Всеки помага: учители, лекари, пожарникари, продавачи.",
          examples: [
            { problem: "Назови 4 члена на семейство.", solution: "Майка, татко, сестра, брат — или баба, дядо, леля, чичо.", hint: "Помисли за хората, с които живееш или при които ходиш на гости." },
            { problem: "Кой те помага, ако си болен?", solution: "Лекарят — в поликлиника или болница. Семейството ти също се грижи за теб.", hint: "Помисли за помощниците в обществото: лекар, медицинска сестра, фармацевт." },
            { problem: "Назови 3 помощника в обществото и какво правят.", solution: "Учителят — учи децата. Пожарникарят — гаси пожари и спасява хора. Полицаят — пази обществената сигурност.", hint: "Кой помага на твоя квартал всеки ден?" },
          ],
          tip: "❤️ Обществото работи добре, когато всеки дава своя принос — включително и ти!",
        },
        high: {
          title: "Роли в семейството и обществото",
          explanation: "Всеки член на семейството има роля: родителите осигуряват храна, дом и любов; децата учат и помагат; бабите и дядовците споделят мъдрост. В обществото хората също имат роли: кметът ръководи общината, учителите образоват, лекарите лекуват, строителите строят, земеделците отглеждат храна. Обществото работи, когато всеки изпълнява ролята си отговорно.",
          examples: [
            { problem: "Какви задължения може да има едно дете у дома?", solution: "Да нарежда стаята си, да помага при миенето на чиниите, да храни домашния любимец, да учи, да е внимателно към братчето или сестричето си.", hint: "Задължения = нещата, за които се очаква да ги направиш." },
            { problem: "Защо обществото се нуждае от правила?", solution: "Правилата помагат на хората да живеят заедно безопасно и справедливо. Без правила би имало хаос — хората биха се наранявали или отнасяли несправедливо.", hint: "Помисли: какво би станало, ако нямаше правила за движение по пътищата?" },
            { problem: "Как се различава общността от семейството?", solution: "Семейство = малка група, свързана с любов и родство. Общност = по-голяма група, споделяща населено място — членовете може да не се познават лично.", hint: "Семейство = малко и лично. Общност = по-голямо и споделено пространство." },
          ],
          tip: "🏘️ Силната общност се изгражда от хора, уважаващи се взаимно и помагащи при нужда!",
        },
      },
      es: {
        low: {
          title: "Familia y comunidad",
          explanation: "Una familia es un grupo de personas que se aman y cuidan mutuamente. Las familias pueden ser diferentes: algunas tienen madre y padre, algunas también tienen abuelos, unas son grandes y otras pequeñas. Una comunidad es toda la gente que vive en el mismo pueblo o barrio. Todos en la comunidad se ayudan: maestros, médicos, bomberos, tenderos.",
          examples: [
            { problem: "Nombra 4 miembros de una familia típica.", solution: "Madre, padre, hermana, hermano — o abuelos, tías, tíos.", hint: "Piensa en las personas con quienes vives o visitas." },
            { problem: "¿Quién te ayuda si estás enfermo?", solution: "Un médico en una clínica u hospital. Tu familia también cuida de ti.", hint: "Piensa en los ayudantes de la comunidad: médico, enfermera, farmacéutico." },
            { problem: "Nombra 3 ayudantes de la comunidad y qué hacen.", solution: "Maestro — enseña a los niños. Bombero — apaga incendios y salva personas. Policía — mantiene a la gente segura.", hint: "¿Quién ayuda a tu barrio cada día?" },
          ],
          tip: "❤️ ¡Una comunidad funciona porque todos hacen su parte — incluyéndote a ti!",
        },
        high: {
          title: "Roles en familia y comunidad",
          explanation: "Cada miembro de la familia tiene un rol: los padres proveen comida, hogar y amor; los niños aprenden y ayudan; los abuelos comparten sabiduría. En la comunidad, las personas también tienen roles: el alcalde dirige la ciudad, los maestros educan, los médicos curan. La sociedad funciona cuando todos hacen su rol responsablemente.",
          examples: [
            { problem: "¿Qué responsabilidades puede tener un niño en casa?", solution: "Ordenar su habitación, ayudar a lavar los platos, alimentar a la mascota, hacer la tarea, ser amable con los hermanos.", hint: "Responsabilidades = cosas que se espera que hagas." },
            { problem: "¿Por qué las comunidades necesitan reglas?", solution: "Las reglas ayudan a las personas a vivir juntas de forma segura y justa. Sin reglas habría caos.", hint: "Piensa: ¿qué pasaría si no hubiera reglas de tráfico?" },
            { problem: "¿En qué se diferencia una comunidad de una familia?", solution: "Familia = grupo pequeño conectado por amor y parentesco. Comunidad = grupo más grande que comparte un lugar.", hint: "Familia = pequeño y personal. Comunidad = más grande y espacio compartido." },
          ],
          tip: "🏘️ ¡Una comunidad fuerte se construye con personas que se respetan y ayudan cuando es necesario!",
        },
      },
    },

    /* ── SOCIAL-STUDIES / MY-HOMELAND ── */
    "social-studies/my-homeland": {
      en: {
        low: {
          title: "My Hometown and Region",
          explanation: "Your hometown (родно място) is the place where you were born and grew up. It can be a big city (град) or a small village (село). Every place has special things: nature, buildings, streets, parks, and stories. Learn the name of your municipality (община), district (област), and nearby landmarks (забележителности).",
          examples: [
            { problem: "What is the difference between a city and a village?", solution: "A city is large — many people, lots of buildings, traffic, shops, schools. A village is small — fewer people, more nature, quieter.", hint: "Think: where do more people live together?" },
            { problem: "Name 2 things that make your hometown special.", solution: "It could be a river, a mountain, a church, a museum, a festival, or a local market — every town has something special!", hint: "What do visitors or tourists come to see in your town?" },
            { problem: "What is a municipality (община)?", solution: "A municipality is the area managed by a local government. The head of a municipality is called a mayor (кмет).", hint: "Think of a municipality as a 'mini-country' with its own local government." },
          ],
          tip: "📍 Ask your parents or grandparents: 'What is special about where we live?' — every place has stories!",
        },
        high: {
          title: "My Region and Its Features",
          explanation: "Bulgaria is divided into 28 districts (области) and many municipalities (общини). Each region has its own geography (mountains, rivers, plains), economy (farming, industry, tourism), and cultural traditions. Understanding your region helps you feel connected to your roots and your country.",
          examples: [
            { problem: "Name the 3 main types of terrain in Bulgaria.", solution: "Mountains (Rila, Balkan, Rhodope), valleys and plains (Thracian plain, Danubian plain), and the Black Sea coast.", hint: "Think: mountains, flat lands, sea." },
            { problem: "How does geography affect how people live in a region?", solution: "In mountain areas people farm animals and harvest timber; in plains they grow crops; on the coast they fish and work in tourism.", hint: "Geography shapes the jobs and lifestyle of people in each area." },
            { problem: "What is a landmark? Give an example from Bulgaria.", solution: "A landmark is a famous or recognisable feature of a place. Example: The Rila Monastery — a UNESCO heritage site in the Rila mountains.", hint: "Landmarks can be natural (mountain, lake) or man-made (monument, church)." },
          ],
          tip: "🗺️ Bulgaria is a small country but has incredible variety — mountains, plains, sea, forests, and ancient history all in one!",
        },
      },
      bg: {
        low: {
          title: "Моят роден край",
          explanation: "Твоят роден край е мястото, където си роден и израснал. Може да е голям град или малко село. Всяко място има нещо специално: природа, сгради, улици, паркове и истории. Научи името на своята община, своята област и близките забележителности.",
          examples: [
            { problem: "Каква е разликата между град и село?", solution: "Градът е голям — много хора, много сгради, трафик, магазини, училища. Селото е малко — по-малко хора, повече природа, по-тихо.", hint: "Помисли: къде живеят повече хора заедно?" },
            { problem: "Назови 2 неща, с които се отличава твоят роден край.", solution: "Може да е река, планина, църква, музей, местен фестивал или пазар — всяко населено място има нещо специално!", hint: "Какво идват да видят гостите или туристите в твоя град?" },
            { problem: "Какво е община?", solution: "Общината е административна единица, управлявана от местно самоуправление. Начело на общината стои кметът.", hint: "Мисли за общината като за 'малка страна' с местно управление." },
          ],
          tip: "📍 Попитай родителите или баба и дядо: 'Какво е специалното в нашия роден край?' — всяко място крие истории!",
        },
        high: {
          title: "Моят регион и неговите особености",
          explanation: "България е разделена на 28 области и много общини. Всеки регион има своя география (планини, реки, равнини), стопанство (земеделие, промишленост, туризъм) и културни традиции. Опознаването на своя регион те свързва с корените ти и с твоята страна.",
          examples: [
            { problem: "Назови 3-те основни вида релеф в България.", solution: "Планини (Рила, Стара планина, Родопи), долини и равнини (Тракийска низина, Дунавска равнина) и Черноморско крайбрежие.", hint: "Помисли: планини, равни земи, море." },
            { problem: "Как географията влияе на начина на живот в даден регион?", solution: "В планинските райони хората отглеждат животни и добиват дървесина; в равнините отглеждат зърно и зеленчуци; по крайбрежието се занимават с риболов и туризъм.", hint: "Географията определя поминъка и начина на живот на хората." },
            { problem: "Какво е забележителност? Дай пример от България.", solution: "Забележителност е известен обект на дадено място. Пример: Рилският манастир — обект на ЮНЕСКО в Рила планина.", hint: "Забележителностите могат да са природни (планина, езеро) или създадени от хора (паметник, църква)." },
          ],
          tip: "🗺️ България е малка страна, но с невероятно разнообразие — планини, равнини, море, гори и древна история — всичко наведнъж!",
        },
      },
      es: {
        low: {
          title: "Mi ciudad natal y región",
          explanation: "Tu ciudad natal es el lugar donde naciste y creciste. Puede ser una gran ciudad o un pequeño pueblo. Cada lugar tiene cosas especiales: naturaleza, edificios, calles, parques e historias. Aprende el nombre de tu municipio, provincia y los puntos de referencia cercanos.",
          examples: [
            { problem: "¿Cuál es la diferencia entre una ciudad y un pueblo?", solution: "Una ciudad es grande — mucha gente, muchos edificios, tráfico, tiendas, escuelas. Un pueblo es pequeño — menos gente, más naturaleza, más tranquilo.", hint: "Piensa: ¿dónde vive más gente junta?" },
            { problem: "Nombra 2 cosas que hacen especial a tu ciudad natal.", solution: "Podría ser un río, una montaña, una iglesia, un museo, un festival o un mercado — ¡cada lugar tiene algo especial!", hint: "¿Qué vienen a ver los visitantes o turistas a tu ciudad?" },
            { problem: "¿Qué es un municipio?", solution: "Un municipio es el área gestionada por un gobierno local. El jefe del municipio se llama alcalde.", hint: "Piensa en un municipio como un 'mini-país' con su propio gobierno local." },
          ],
          tip: "📍 ¡Pregunta a tus padres o abuelos: '¿Qué tiene de especial nuestra ciudad?' — ¡cada lugar tiene historias!",
        },
        high: {
          title: "Mi región y sus características",
          explanation: "Bulgaria está dividida en 28 provincias y muchos municipios. Cada región tiene su propia geografía (montañas, ríos, llanuras), economía (agricultura, industria, turismo) y tradiciones culturales. Comprender tu región te ayuda a sentirte conectado con tus raíces.",
          examples: [
            { problem: "Nombra los 3 tipos principales de terreno en Bulgaria.", solution: "Montañas (Rila, Balcán, Ródope), valles y llanuras (llanura tracia, llanura danubiana) y la costa del Mar Negro.", hint: "Piensa: montañas, tierras planas, mar." },
            { problem: "¿Cómo afecta la geografía a la vida de las personas en una región?", solution: "En zonas montañosas crían animales y explotan madera; en las llanuras cultivan; en la costa pescan y trabajan en turismo.", hint: "La geografía moldea los empleos y el estilo de vida de las personas." },
            { problem: "¿Qué es un punto de referencia? Da un ejemplo de Bulgaria.", solution: "Un punto de referencia es un lugar famoso o reconocible. Ejemplo: El Monasterio de Rila — patrimonio de la UNESCO.", hint: "Los puntos de referencia pueden ser naturales (montaña, lago) o artificiales (monumento, iglesia)." },
          ],
          tip: "🗺️ ¡Bulgaria es un país pequeño pero con increíble variedad — montañas, llanuras, mar, bosques e historia antigua, todo en uno!",
        },
      },
    },

    /* ── SOCIAL-STUDIES / BULGARIA ── */
    "social-studies/bulgaria": {
      en: {
        low: {
          title: "Our Country — Bulgaria",
          explanation: "Bulgaria is a country in southeastern Europe. The capital city is Sofia (София). The Bulgarian flag has three colours: white (белo), green (зелено), and red (червено) from top to bottom. The national anthem is 'Mila Rodino' (Dear Homeland). Bulgaria has mountains, plains, rivers, and a Black Sea coast.",
          examples: [
            { problem: "What is the capital of Bulgaria?", solution: "Sofia (София) — it is the largest city and the seat of government.", hint: "Sofia is in western Bulgaria, near the Vitosha mountain." },
            { problem: "Name the 3 colours of the Bulgarian flag in order.", solution: "White (top), Green (middle), Red (bottom) — horizontal stripes.", hint: "The colours go from top to bottom: white, green, red." },
            { problem: "Name 2 mountains in Bulgaria.", solution: "Rila (with Musala — the highest peak in the Balkans), Vitosha (near Sofia), Balkan mountain (Stara Planina), Rhodope mountains.", hint: "Bulgaria has many mountains! The highest is Musala in Rila." },
          ],
          tip: "🇧🇬 Remember Bulgaria's flag: White-Green-Red — top to bottom!",
        },
        high: {
          title: "Bulgaria: History, Geography and Culture",
          explanation: "Bulgaria was founded in 681 AD by Khan Asparuh. The Bulgarian alphabet (Cyrillic) was created by Saints Cyril and Methodius and their disciples in the 9th century. Bulgaria joined the European Union in 2007. It has a rich culture: rose oil (атар от рози), yogurt (кисело мляко), Kukeri rituals, and many UNESCO heritage sites.",
          examples: [
            { problem: "When was Bulgaria founded and by whom?", solution: "Bulgaria was founded in 681 AD by Khan Asparuh — this makes it one of the oldest countries in Europe.", hint: "681 AD — that's over 1300 years ago!" },
            { problem: "Who created the Cyrillic alphabet and why is it important?", solution: "Saints Cyril and Methodius and their disciples (especially Kliment Ohridski) created the Glagolitic and then Cyrillic alphabet so that Slavic peoples could read and write in their own language.", hint: "Cyrillic is used today by Bulgarian, Russian, Serbian, Ukrainian and many other languages." },
            { problem: "Name 2 things Bulgaria is famous for worldwide.", solution: "Rose oil (used in perfumes — Bulgaria produces most of the world's rose oil). Yogurt — the bacteria Lactobacillus bulgaricus was named after Bulgaria. Kukeri — ancient ritual to scare away evil spirits.", hint: "Think: what does the world know about Bulgaria?" },
          ],
          tip: "🌹 Bulgaria is one of the oldest countries in Europe — over 1300 years of history!",
        },
      },
      bg: {
        low: {
          title: "Нашата страна — България",
          explanation: "България е страна в Югоизточна Европа. Столицата е София. Българското знаме има три цвята: бяло, зелено и червено — от горе надолу. Националният химн е 'Мила Родино'. България има планини, равнини, реки и Черноморско крайбрежие.",
          examples: [
            { problem: "Коя е столицата на България?", solution: "София — тя е най-големият град и седалище на управлението.", hint: "София е в западна България, близо до планината Витоша." },
            { problem: "Назови 3-те цвята на българския флаг по ред.", solution: "Бяло (горе), Зелено (в средата), Червено (долу) — хоризонтални ивици.", hint: "Цветовете от горе надолу: бяло, зелено, червено." },
            { problem: "Назови 2 планини в България.", solution: "Рила (с връх Мусала — най-висок в Балканите), Витоша (до София), Стара планина, Родопите.", hint: "България има много планини! Най-високата е Мусала в Рила." },
          ],
          tip: "🇧🇬 Запомни флага на България: Бяло-Зелено-Червено — от горе надолу!",
        },
        high: {
          title: "България: история, география и култура",
          explanation: "България е основана през 681 г. от хан Аспарух. Кирилицата е създадена от св. Кирил и Методий и техните ученици през 9-ти век. България е член на ЕС от 2007 г. Богата е с розово масло, кисело мляко, кукерски ритуали и множество обекти под закрилата на ЮНЕСКО.",
          examples: [
            { problem: "Кога е основана България и от кого?", solution: "България е основана през 681 г. от хан Аспарух — това я прави една от най-старите страни в Европа.", hint: "681 г. — преди повече от 1300 години!" },
            { problem: "Кой е създал кирилицата и защо е важна?", solution: "Св. Кирил и Методий и техните ученици (особено Климент Охридски) са създали глаголицата, а после кирилицата — за да могат славянските народи да четат и пишат на своя език.", hint: "Кирилицата се ползва и днес — на български, руски, сръбски, украински и много други езици." },
            { problem: "Назови 2 неща, с които България е известна по света.", solution: "Розово масло (използва се в парфюмерията — България произвежда по-голямата част от световното розово масло). Кисело мляко — бактерията Lactobacillus bulgaricus е кръстена на България. Кукерите — древен ритуал за прогонване на злите духове.", hint: "Помисли: с какво светът познава България?" },
          ],
          tip: "🌹 България е една от най-старите страни в Европа — над 1300 години история!",
        },
      },
      es: {
        low: {
          title: "Nuestro país — Bulgaria",
          explanation: "Bulgaria es un país en el sureste de Europa. La capital es Sofía. La bandera búlgara tiene tres colores: blanco, verde y rojo — de arriba hacia abajo. El himno nacional es 'Mila Rodino' (Querida Patria). Bulgaria tiene montañas, llanuras, ríos y la costa del Mar Negro.",
          examples: [
            { problem: "¿Cuál es la capital de Bulgaria?", solution: "Sofía — es la ciudad más grande y la sede del gobierno.", hint: "Sofía está en el oeste de Bulgaria, cerca de la montaña Vitosha." },
            { problem: "Nombra los 3 colores de la bandera búlgara en orden.", solution: "Blanco (arriba), Verde (medio), Rojo (abajo) — franjas horizontales.", hint: "Los colores de arriba abajo: blanco, verde, rojo." },
            { problem: "Nombra 2 montañas en Bulgaria.", solution: "Rila (con Musala — el pico más alto de los Balcanes), Vitosha (cerca de Sofía), los Balcanes, los Ródope.", hint: "¡Bulgaria tiene muchas montañas! La más alta es Musala en Rila." },
          ],
          tip: "🇧🇬 ¡Recuerda la bandera de Bulgaria: Blanco-Verde-Rojo — de arriba hacia abajo!",
        },
        high: {
          title: "Bulgaria: historia, geografía y cultura",
          explanation: "Bulgaria fue fundada en 681 d.C. por el Khan Asparuh. El alfabeto cirílico fue creado por los Santos Cirilo y Metodio y sus discípulos en el siglo IX. Bulgaria se unió a la UE en 2007. Tiene rica cultura: aceite de rosa, yogur, rituales kukeri y sitios patrimonio de la UNESCO.",
          examples: [
            { problem: "¿Cuándo fue fundada Bulgaria y por quién?", solution: "Bulgaria fue fundada en 681 d.C. por el Khan Asparuh — esto la convierte en uno de los países más antiguos de Europa.", hint: "¡681 d.C. — hace más de 1300 años!" },
            { problem: "¿Quién creó el alfabeto cirílico y por qué es importante?", solution: "Los Santos Cirilo y Metodio y sus discípulos crearon el alfabeto cirílico para que los pueblos eslavos pudieran leer y escribir en su propio idioma.", hint: "El cirílico se usa hoy en búlgaro, ruso, serbio, ucraniano y muchos otros idiomas." },
            { problem: "Nombra 2 cosas por las que Bulgaria es famosa en el mundo.", solution: "Aceite de rosa (Bulgaria produce la mayor parte del aceite de rosa mundial). Yogur — la bacteria Lactobacillus bulgaricus lleva el nombre de Bulgaria. Kukeri — ritual antiguo para espantar los malos espíritus.", hint: "Piensa: ¿por qué el mundo conoce Bulgaria?" },
          ],
          tip: "🌹 ¡Bulgaria es uno de los países más antiguos de Europa — más de 1300 años de historia!",
        },
      },
    },

    /* ── SOCIAL-STUDIES / RIGHTS-DUTIES ── */
    "social-studies/rights-duties": {
      en: {
        low: {
          title: "Rights and Duties",
          explanation: "Every child has RIGHTS — things you are entitled to. And every child has DUTIES — things you are responsible for. Rights: the right to go to school, to play, to be safe, to have a home, to be loved. Duties: to study, to help at home, to be kind, to follow rules, to respect others.",
          examples: [
            { problem: "Name 3 rights that every child has.", solution: "The right to education, to play, to be safe (from danger), to have food and shelter, to be loved and cared for.", hint: "Rights = things you deserve by being human." },
            { problem: "Name 3 duties that children have at school.", solution: "To attend school, to listen to the teacher, to do homework, to be kind to classmates, to follow school rules.", hint: "Duties = things you are responsible to do." },
            { problem: "Why do we have traffic rules?", solution: "Traffic rules keep everyone safe — drivers, cyclists and pedestrians. Without them, accidents would happen all the time.", hint: "Rules protect people — they are there for everyone's safety." },
          ],
          tip: "⚖️ Rights and duties go together — if you have the right to play, you also have the duty to let others play too!",
        },
        high: {
          title: "Children's Rights and Civic Duties",
          explanation: "The United Nations Convention on the Rights of the Child (1989) lists rights every child has: survival, development, protection, and participation. In Bulgaria these are protected by law. With rights come responsibilities: if you have the right to education, you have the duty to study and respect your school. A good citizen uses their rights wisely and fulfils their duties.",
          examples: [
            { problem: "What is the UN Convention on the Rights of the Child?", solution: "An international agreement (1989) signed by most countries that lists rights every child has — to be safe, educated, healthy, and to have their voice heard.", hint: "Convention = an international agreement between countries." },
            { problem: "Give an example of how a right and a duty are connected.", solution: "Right: the right to education. Duty: to attend school, study, and do homework. Right: the right to a clean environment. Duty: to not litter and to recycle.", hint: "For each right, think: 'What is my responsibility that comes with it?'" },
            { problem: "What can you do if you see a classmate being bullied?", solution: "Tell a teacher or trusted adult immediately. You have both the RIGHT to be safe and the DUTY to help others be safe too.", hint: "Civic duty = doing what is right for your community, not just for yourself." },
          ],
          tip: "📜 Every right comes with a matching duty — knowing both makes you a responsible citizen!",
        },
      },
      bg: {
        low: {
          title: "Права и задължения",
          explanation: "Всяко дете има ПРАВА — неща, на които имаш право. И всяко дете има ЗАДЪЛЖЕНИЯ — неща, за които си отговорен. Права: правото да ходиш на училище, да се играеш, да си в безопасност, да имаш дом, да бъдеш обичан. Задължения: да учиш, да помагаш у дома, да си добро, да спазваш правилата, да уважаваш другите.",
          examples: [
            { problem: "Назови 3 права, които всяко дете има.", solution: "Правото на образование, на игра, на безопасност (от опасност), на храна и дом, на обич и грижа.", hint: "Права = нещата, на които имаш право просто защото си човек." },
            { problem: "Назови 3 задължения, които децата имат в училище.", solution: "Да ходят на училище, да слушат учителя, да си пишат домашното, да са добри към съучениците, да спазват правилника.", hint: "Задължения = нещата, за които си отговорен да ги направиш." },
            { problem: "Защо имаме правила за движение по пътищата?", solution: "Правилата за движение пазят всички — шофьори, колоездачи и пешеходци. Без тях катастрофите щяха да са ежедневие.", hint: "Правилата предпазват хората — те са за безопасността на всички." },
          ],
          tip: "⚖️ Правата и задълженията вървят заедно — ако имаш право да играеш, имаш и задължение да оставяш другите да играят!",
        },
        high: {
          title: "Права на детето и граждански задължения",
          explanation: "Конвенцията на ООН за правата на детето (1989 г.) изброява правата, на които има право всяко дете: оцеляване, развитие, закрила и участие. В България те са защитени от закона. С правата идват и отговорности: ако имаш право на образование, имаш и задължение да учиш и да уважаваш училището. Добрият гражданин ползва правата си разумно и изпълнява задълженията си.",
          examples: [
            { problem: "Какво е Конвенцията на ООН за правата на детето?", solution: "Международно споразумение (1989 г.), подписано от повечето страни, което изброява правата на всяко дете — да бъде в безопасност, образовано, здраво и чуто.", hint: "Конвенция = международно споразумение между страните." },
            { problem: "Дай пример как едно право и едно задължение са свързани.", solution: "Право: правото на образование. Задължение: да ходиш на училище, да учиш, да пишеш домашното. Право: правото на чиста природа. Задължение: да не замърсяваш и да рециклираш.", hint: "За всяко право помисли: 'Каква е моята отговорност, която идва с него?'" },
            { problem: "Какво можеш да направиш, ако видиш съученик да бъде тормозен?", solution: "Незабавно разкажи на учител или доверен възрастен. Имаш и ПРАВОТО да си в безопасност, и ЗАДЪЛЖЕНИЕТО да помагаш на другите да са в безопасност.", hint: "Гражданско задължение = да правиш правилното за своята общност, не само за себе си." },
          ],
          tip: "📜 С всяко право идва съответстващо задължение — знанието и на двете те прави отговорен гражданин!",
        },
      },
      es: {
        low: {
          title: "Derechos y deberes",
          explanation: "Cada niño tiene DERECHOS — cosas a las que tienes derecho. Y cada niño tiene DEBERES — cosas de las que eres responsable. Derechos: el derecho a ir a la escuela, a jugar, a estar seguro, a tener un hogar, a ser amado. Deberes: estudiar, ayudar en casa, ser amable, seguir las reglas, respetar a los demás.",
          examples: [
            { problem: "Nombra 3 derechos que tiene todo niño.", solution: "El derecho a la educación, al juego, a la seguridad, a tener comida y hogar, a ser amado y cuidado.", hint: "Derechos = cosas a las que tienes derecho por ser humano." },
            { problem: "Nombra 3 deberes que los niños tienen en la escuela.", solution: "Asistir a la escuela, escuchar al maestro, hacer la tarea, ser amable con los compañeros, seguir las reglas escolares.", hint: "Deberes = cosas de las que eres responsable de hacer." },
            { problem: "¿Por qué tenemos reglas de tráfico?", solution: "Las reglas de tráfico mantienen seguros a todos — conductores, ciclistas y peatones. Sin ellas, habría accidentes constantemente.", hint: "Las reglas protegen a las personas — existen para la seguridad de todos." },
          ],
          tip: "⚖️ ¡Los derechos y los deberes van juntos — si tienes el derecho de jugar, también tienes el deber de dejar jugar a otros!",
        },
        high: {
          title: "Derechos del niño y deberes cívicos",
          explanation: "La Convención de la ONU sobre los Derechos del Niño (1989) enumera los derechos de todo niño: supervivencia, desarrollo, protección y participación. Con los derechos vienen responsabilidades: si tienes el derecho a la educación, tienes el deber de estudiar y respetar tu escuela.",
          examples: [
            { problem: "¿Qué es la Convención de la ONU sobre los Derechos del Niño?", solution: "Un acuerdo internacional (1989) firmado por la mayoría de países que enumera los derechos de todo niño — estar seguro, educado, sano y ser escuchado.", hint: "Convención = acuerdo internacional entre países." },
            { problem: "Da un ejemplo de cómo un derecho y un deber están conectados.", solution: "Derecho: a la educación. Deber: asistir a la escuela, estudiar, hacer la tarea. Derecho: a un ambiente limpio. Deber: no tirar basura y reciclar.", hint: "Para cada derecho, piensa: '¿Cuál es mi responsabilidad que viene con él?'" },
            { problem: "¿Qué puedes hacer si ves a un compañero siendo intimidado?", solution: "Díselo inmediatamente a un maestro o adulto de confianza. Tienes el DERECHO a estar seguro y el DEBER de ayudar a otros a estarlo también.", hint: "Deber cívico = hacer lo correcto para tu comunidad, no solo para ti." },
          ],
          tip: "📜 ¡Cada derecho viene con un deber correspondiente — conocer ambos te hace un ciudadano responsable!",
        },
      },
    },

    /* ── SOCIAL-STUDIES / TRADITIONS ── */
    "social-studies/traditions": {
      en: {
        low: {
          title: "Bulgarian Holidays and Traditions",
          explanation: "Bulgaria has many beautiful traditions and national holidays. Baba Marta (Grandma Marta, 1 March) — we tie red-and-white martenitsi for health and happiness. Bŭdni Vecher (Christmas Eve, 24 December) — the family gathers for a meatless meal. Vassilvaden (New Year, 1 January) — children tap adults with cornel branches for health. Tryphon Zarezan (1 February) — celebration of vineyards.",
          examples: [
            { problem: "What is a martenitsa and when do we give it?", solution: "A martenitsa is a red-and-white decoration (bracelet or figure). We give it on 1 March (Baba Marta Day) for health and the coming of spring.", hint: "Red and white twisted together — worn until you see a stork or a blossoming tree." },
            { problem: "What do Bulgarian families do on Bŭdni Vecher (Christmas Eve)?", solution: "The family gathers for a meatless dinner with an odd number of dishes (7, 9, or 12). They share the ritual bread (пита) and sometimes crack nuts to predict the coming year.", hint: "Christmas Eve in Bulgaria is a family and religious celebration — meat is not eaten." },
            { problem: "What is the national holiday of Bulgaria?", solution: "3 March — Liberation Day (Ден на Освобождението). On 3 March 1878 Bulgaria was liberated from Ottoman rule after the Russo-Turkish War.", hint: "3 March 1878 — the signing of the San Stefano Peace Treaty." },
          ],
          tip: "🩺 Bulgarian traditions connect us to our ancestors and to each other — they keep our culture alive!",
        },
        high: {
          title: "Bulgarian Cultural Traditions and Their Meaning",
          explanation: "Bulgarian traditions blend pre-Christian (pagan), Orthodox Christian, and folk elements. Kukeri: men dress in scary costumes with bells to scare away evil spirits — done in late winter. Lazaruvane: young girls sing folk songs at neighbours' doors on Lazarus Saturday before Easter. Nestinarstvo: fire dancing on hot coals — a UNESCO Intangible Heritage ritual from the Strandzha region. Traditions carry community memory and identity.",
          examples: [
            { problem: "What are Kukeri and what is their purpose?", solution: "Kukeri are men dressed in animal fur costumes with large bells. They dance through villages in late winter to chase away evil spirits and bring good crops and health for the new year.", hint: "Kukeri = a pre-Christian ritual meant to protect the community." },
            { problem: "What is Nestinarstvo and why is it special?", solution: "Nestinarstvo is a ritual where people dance barefoot on hot embers (fire) in a trance state. It comes from the Strandzha region and is recognised by UNESCO as Intangible Cultural Heritage.", hint: "Nestinarstvo blends Thracian and Christian traditions — very unique to Bulgaria." },
            { problem: "How does a tradition differ from a habit?", solution: "A habit is personal (e.g. brushing teeth). A tradition is shared by a community or culture across generations — it has cultural meaning and story behind it.", hint: "Tradition = shared across a community + passed down through generations." },
          ],
          tip: "🎭 Every Bulgarian tradition tells a story — understanding them connects you to thousands of years of culture!",
        },
      },
      bg: {
        low: {
          title: "Български празници и традиции",
          explanation: "България има много красиви традиции и национални празници. Баба Марта (1 март) — завързваме мартеници за здраве и щастие. Бъдни вечер (24 декември) — семейството се събира за постна вечеря. Васильовден (1 януари) — децата потупват с дренова клонка за здраве. Трифон Зарезан (1 февруари) — празник на лозята.",
          examples: [
            { problem: "Какво е мартеница и кога я даваме?", solution: "Мартеницата е червено-бяла украса (гривна или фигурки). Даваме я на 1 март (Баба Марта) за здраве и настъпването на пролетта.", hint: "Червено и бяло усукани заедно — носим я, докато не видим щъркел или цъфнало дърво." },
            { problem: "Какво правят българските семейства на Бъдни вечер?", solution: "Семейството се събира за постна вечеря с нечетен брой ястия (7, 9 или 12). Чупят пита и ядки, за да предрекат идващата година.", hint: "Бъдни вечер в България е семеен и религиозен празник — не се яде месо." },
            { problem: "Кой е националният празник на България?", solution: "3 март — Ден на Освобождението. На 3 март 1878 г. България е освободена от османско владичество след Руско-турската война.", hint: "3 март 1878 г. — подписването на Санстефанския мирен договор." },
          ],
          tip: "🎀 Българските традиции ни свързват с прадедите ни и помежду ни — те пазят нашата култура жива!",
        },
        high: {
          title: "Български културни традиции и тяхното значение",
          explanation: "Българските традиции съчетават предхристиянски (езически), православни и народни елементи. Кукери: мъже с наплашващи костюми и камбани прогонват злите духове — ритуалът е в края на зимата. Лазаруване: млади момичета пеят народни песни по домовете на съседите на Лазарица преди Великден. Нестинарство: танцуване по горещи въглени — ритуал от Странджа, признат от ЮНЕСКО.",
          examples: [
            { problem: "Какво са кукерите и каква е тяхната цел?", solution: "Кукерите са мъже, облечени в животински кожи с огромни камбани. Те танцуват из селата в края на зимата, за да прогонят злите духове и да донесат богата реколта и здраве.", hint: "Кукерите са предхристиянски ритуал за закрила на общността." },
            { problem: "Какво е нестинарство и защо е специално?", solution: "Нестинарството е ритуал, при който хора танцуват боси върху горещи въглени в транс. Идва от Странджа и е признато от ЮНЕСКО за нематериално културно наследство.", hint: "Нестинарството съчетава тракийски и православни традиции — уникално за България." },
            { problem: "Как се различава традицията от навика?", solution: "Навикът е личен (напр. миене на зъби). Традицията е споделена от общност или култура в продължение на поколения — тя носи културен смисъл и история.", hint: "Традиция = споделена от общността + предавана от поколение на поколение." },
          ],
          tip: "🎭 Всяка българска традиция разказва история — разбирането им те свързва с хиляди години култура!",
        },
      },
      es: {
        low: {
          title: "Festividades y tradiciones búlgaras",
          explanation: "Bulgaria tiene muchas hermosas tradiciones y festividades nacionales. Baba Marta (1 de marzo) — atamos martenitsas rojas y blancas para la salud. Bŭdni Vecher (Nochebuena, 24 de diciembre) — la familia se reúne para una cena sin carne. Vassilvaden (Año Nuevo, 1 de enero). Tryphon Zarezan (1 de febrero) — celebración de los viñedos.",
          examples: [
            { problem: "¿Qué es una martenitsa y cuándo la damos?", solution: "Una martenitsa es una decoración roja y blanca (pulsera o figura). La damos el 1 de marzo (Día de Baba Marta) para la salud y la llegada de la primavera.", hint: "Rojo y blanco entrelazados — se lleva hasta ver una cigüeña o un árbol en flor." },
            { problem: "¿Qué hacen las familias búlgaras en Nochebuena?", solution: "La familia se reúne para una cena sin carne con un número impar de platos (7, 9 o 12). Comparten el pan ritual y a veces rompen nueces para predecir el año venidero.", hint: "La Nochebuena en Bulgaria es una celebración familiar y religiosa — no se come carne." },
            { problem: "¿Cuál es el día festivo nacional de Bulgaria?", solution: "El 3 de marzo — Día de la Liberación. El 3 de marzo de 1878 Bulgaria fue liberada del dominio otomano tras la guerra ruso-turca.", hint: "3 de marzo de 1878 — la firma del Tratado de Paz de San Stefano." },
          ],
          tip: "🎀 ¡Las tradiciones búlgaras nos conectan con nuestros antepasados y entre nosotros — mantienen viva nuestra cultura!",
        },
        high: {
          title: "Tradiciones culturales búlgaras y su significado",
          explanation: "Las tradiciones búlgaras mezclan elementos precristianos (paganos), ortodoxos y folclóricos. Kukeri: hombres disfrazados con pieles y campanas para ahuyentar espíritus malignos. Lazaruvane: chicas jóvenes cantan canciones folclóricas en los sábados de Lázaro. Nestinarstvo: danza en carbones ardientes — Patrimonio Inmaterial de la UNESCO de la región de Strandja.",
          examples: [
            { problem: "¿Qué son los Kukeri y cuál es su propósito?", solution: "Los Kukeri son hombres disfrazados con pieles de animales y grandes campanas. Danzan por los pueblos a finales del invierno para ahuyentar los malos espíritus y traer buenas cosechas.", hint: "Kukeri = un ritual precristiano para proteger a la comunidad." },
            { problem: "¿Qué es Nestinarstvo y por qué es especial?", solution: "El Nestinarstvo es un ritual donde personas danzan descalzas sobre brasas ardientes en estado de trance. Proviene de la región de Strandja y es reconocido por la UNESCO.", hint: "El Nestinarstvo mezcla tradiciones tracias y cristianas — muy único de Bulgaria." },
            { problem: "¿Cómo se diferencia una tradición de un hábito?", solution: "Un hábito es personal (p. ej. cepillarse los dientes). Una tradición es compartida por una comunidad a través de generaciones — tiene significado cultural e historia.", hint: "Tradición = compartida por la comunidad + transmitida de generación en generación." },
          ],
          tip: "🎭 ¡Cada tradición búlgara cuenta una historia — comprenderlas te conecta con miles de años de cultura!",
        },
      },
    },

    /* ── NATURAL-SCIENCE / LIVING-THINGS ── */
    "natural-science/living-things": {
      en: {
        low: {
          title: "Living Things",
          explanation: "A living thing is alive — it grows, breathes, needs food and water, moves, and can make more of itself (reproduce). Plants, animals, fungi, and bacteria are all living things. Non-living things (like rocks, chairs, water) do not grow, breathe, or reproduce. Remember the 7 signs of life: MRS GREN — Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition.",
          examples: [
            { problem: "Is a rock a living thing? Why or why not?", solution: "No — a rock does not grow, breathe, eat, or reproduce. It shows none of the 7 signs of life.", hint: "Check: does it grow? breathe? reproduce? If no to all — it is non-living." },
            { problem: "Name 2 things that ALL living things need.", solution: "All living things need food/energy and water to survive.", hint: "Think: what do you, a plant, and a dog all need every day?" },
            { problem: "How is a plant different from an animal as a living thing?", solution: "Plants make their own food using sunlight (photosynthesis). Animals cannot make their own food — they must eat plants or other animals.", hint: "Plants = producers. Animals = consumers." },
          ],
          tip: "🌱 MRS GREN: Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition — all 7 = living!",
        },
        high: {
          title: "Characteristics of Living Organisms",
          explanation: "All living organisms share 7 life processes (MRS GREN). Scientists classify living things into kingdoms: Animals, Plants, Fungi, Bacteria, Protists. Cells are the basic unit of life — every living thing is made of one or more cells. Plant cells have a cell wall and chloroplasts (for photosynthesis). Animal cells do not have a cell wall.",
          examples: [
            { problem: "What are the 5 kingdoms of living things?", solution: "1. Animalia (animals) 2. Plantae (plants) 3. Fungi (mushrooms, mould) 4. Bacteria 5. Protists (e.g. amoeba)", hint: "We use classification to organise the huge variety of life on Earth." },
            { problem: "What is photosynthesis?", solution: "The process by which plants make their own food using sunlight, water and carbon dioxide: sunlight + water + CO₂ → glucose + oxygen.", hint: "Photo = light. Synthesis = making. Plants make food using light energy." },
            { problem: "What is the difference between a plant cell and an animal cell?", solution: "Plant cell: has a cell wall, chloroplasts (for photosynthesis), and a large vacuole. Animal cell: no cell wall, no chloroplasts.", hint: "The cell wall gives plants their rigid shape." },
          ],
          tip: "🔬 Every living thing, from bacteria to blue whales, is made of cells — the building blocks of life!",
        },
      },
      bg: {
        low: {
          title: "Живи организми",
          explanation: "Живият организъм е жив — расте, диша, нуждае се от храна и вода, движи се и може да се размножава. Растенията, животните, гъбите и бактериите са живи организми. Неживите неща (камъни, столове, вода) не растат, не дишат и не се размножават. Запомни 7-те признака на живота: движение, дишане, раздразнимост, растеж, размножаване, отделяне, хранене.",
          examples: [
            { problem: "Камъкът жив организъм ли е? Защо?", solution: "Не — камъкът не расте, не диша, не се храни и не се размножава. Не показва нито един от 7-те признака на живота.", hint: "Провери: расте ли? Диша ли? Размножава ли се? Ако не на всичко — не е жив." },
            { problem: "Назови 2 неща, от които се нуждаят ВСИЧКИ живи организми.", solution: "Всички живи организми се нуждаят от храна/енергия и вода, за да оцелеят.", hint: "Помисли: от какво се нуждаят ежедневно ти, едно растение и едно куче?" },
            { problem: "Как се различава растението от животното като жив организъм?", solution: "Растенията си правят сами храна чрез фотосинтеза (използват слънчева светлина). Животните не могат сами да правят храна — трябва да ядат растения или други животни.", hint: "Растения = производители. Животни = потребители." },
          ],
          tip: "🌱 7-те признака на живота: движение, дишане, раздразнимост, растеж, размножаване, отделяне, хранене — всичките 7 = жив!",
        },
        high: {
          title: "Признаци на живите организми",
          explanation: "Всички живи организми споделят 7 жизнени процеса. Учените класифицират живите организми в царства: Животни, Растения, Гъби, Бактерии, Протисти. Клетката е основна единица на живота — всеки жив организъм е изграден от една или повече клетки. Растителните клетки имат клетъчна стена и хлоропласти (за фотосинтеза). Животинските клетки нямат клетъчна стена.",
          examples: [
            { problem: "Кои са 5-те царства на живите организми?", solution: "1. Животни 2. Растения 3. Гъби 4. Бактерии 5. Протисти (напр. амеба)", hint: "Класификацията ни помага да наредим огромното разнообразие на живота на Земята." },
            { problem: "Какво е фотосинтеза?", solution: "Процесът, чрез който растенията правят сами храна, използвайки слънчева светлина, вода и въглероден двуокис: светлина + вода + CO₂ → глюкоза + кислород.", hint: "Фото = светлина. Синтеза = създаване. Растенията правят храна чрез светлинна енергия." },
            { problem: "Каква е разликата между растителна и животинска клетка?", solution: "Растителна клетка: има клетъчна стена, хлоропласти (за фотосинтеза) и голяма вакуола. Животинска клетка: няма клетъчна стена, няма хлоропласти.", hint: "Клетъчната стена дава на растенията твърдата им форма." },
          ],
          tip: "🔬 Всеки жив организъм, от бактерия до синия кит, е изграден от клетки — основните градивни единици на живота!",
        },
      },
      es: {
        low: {
          title: "Seres vivos",
          explanation: "Un ser vivo está vivo — crece, respira, necesita comida y agua, se mueve y puede reproducirse. Plantas, animales, hongos y bacterias son seres vivos. Los objetos sin vida (como piedras, sillas, agua) no crecen, respiran ni se reproducen. Recuerda los 7 signos de vida: movimiento, respiración, sensibilidad, crecimiento, reproducción, excreción, nutrición.",
          examples: [
            { problem: "¿Es una piedra un ser vivo? ¿Por qué?", solution: "No — una piedra no crece, no respira, no come ni se reproduce. No muestra ninguno de los 7 signos de vida.", hint: "Comprueba: ¿crece? ¿respira? ¿se reproduce? Si no a todo — no está vivo." },
            { problem: "Nombra 2 cosas que necesitan TODOS los seres vivos.", solution: "Todos los seres vivos necesitan comida/energía y agua para sobrevivir.", hint: "Piensa: ¿qué necesitan diariamente tú, una planta y un perro?" },
            { problem: "¿En qué se diferencia una planta de un animal como ser vivo?", solution: "Las plantas producen su propio alimento usando luz solar (fotosíntesis). Los animales no pueden producir su propio alimento — deben comer plantas u otros animales.", hint: "Plantas = productores. Animales = consumidores." },
          ],
          tip: "🌱 Los 7 signos de vida: movimiento, respiración, sensibilidad, crecimiento, reproducción, excreción, nutrición — ¡los 7 = vivo!",
        },
        high: {
          title: "Características de los organismos vivos",
          explanation: "Todos los organismos vivos comparten 7 procesos vitales. Los científicos clasifican a los seres vivos en reinos: Animales, Plantas, Hongos, Bacterias, Protistas. La célula es la unidad básica de la vida. Las células vegetales tienen pared celular y cloroplastos. Las células animales no tienen pared celular.",
          examples: [
            { problem: "¿Cuáles son los 5 reinos de los seres vivos?", solution: "1. Animalia (animales) 2. Plantae (plantas) 3. Fungi (hongos) 4. Bacteria 5. Protistas (p. ej. ameba)", hint: "Usamos la clasificación para organizar la enorme variedad de vida en la Tierra." },
            { problem: "¿Qué es la fotosíntesis?", solution: "El proceso por el cual las plantas producen su propio alimento usando luz solar, agua y dióxido de carbono: luz + agua + CO₂ → glucosa + oxígeno.", hint: "Foto = luz. Síntesis = producción. Las plantas producen alimento usando energía luminosa." },
            { problem: "¿Cuál es la diferencia entre una célula vegetal y una animal?", solution: "Célula vegetal: tiene pared celular, cloroplastos y una gran vacuola. Célula animal: sin pared celular, sin cloroplastos.", hint: "La pared celular da a las plantas su forma rígida." },
          ],
          tip: "🔬 ¡Todos los seres vivos, desde bacterias hasta ballenas azules, están hechos de células — los bloques de construcción de la vida!",
        },
      },
    },

    /* ── NATURAL-SCIENCE / MATERIALS ── */
    "natural-science/materials": {
      en: {
        low: {
          title: "Materials and Their Properties",
          explanation: "Everything around us is made of materials. Materials have properties — features that describe what they are like: hard or soft, rough or smooth, transparent (see-through) or opaque (cannot see through), flexible or rigid, heavy or light. We choose materials based on their properties: glass is transparent so we use it for windows; rubber is flexible so we use it for tyres.",
          examples: [
            { problem: "Name 2 properties of glass.", solution: "Glass is transparent (you can see through it) and hard (rigid, does not bend). It can also break — it is brittle.", hint: "Think of a window — what can you do with glass? See through it? Bend it?" },
            { problem: "Why is rubber used for tyres?", solution: "Rubber is flexible (it bends without breaking), waterproof, and durable — perfect for tyres that must grip the road and survive bumps.", hint: "Tyres must grip, stretch a little, and not break. Which material can do that?" },
            { problem: "Is wood natural or man-made?", solution: "Wood is a NATURAL material — it comes from trees. Plastic is man-made.", hint: "Natural = comes from nature (plants, animals, earth). Man-made = made in a factory." },
          ],
          tip: "🔍 Scientists describe materials by their PROPERTIES — always ask: Is it hard? Heavy? Transparent? Flexible?",
        },
        high: {
          title: "Materials: Natural, Synthetic and Their Uses",
          explanation: "Materials are classified as natural (wood, stone, cotton, wool, water) or synthetic/man-made (plastic, nylon, glass, steel, concrete). Synthetic materials are often made from natural ones (plastic from oil). Scientists test materials by properties: strength (can it hold weight?), hardness (can it be scratched?), conductivity (does it carry electricity?), transparency.",
          examples: [
            { problem: "What is the difference between a natural and a synthetic material?", solution: "Natural: found in nature — wood, stone, cotton, wool, leather. Synthetic: made by humans in factories — plastic, nylon, polyester, concrete.", hint: "Synthetic usually means: made in a factory from chemical processes." },
            { problem: "Why is steel used for bridges and buildings?", solution: "Steel is very strong (high tensile strength), durable, and can be shaped — it can hold enormous weight without breaking.", hint: "Bridges must hold heavy vehicles. What property does the material need?" },
            { problem: "Name a material that conducts electricity and one that does not.", solution: "Conducts: copper (used in wires), aluminium, iron — metals generally conduct electricity. Does NOT conduct (insulators): rubber, plastic, wood, glass.", hint: "Conductors let electricity flow. Insulators block it." },
          ],
          tip: "⚡ Metals conduct electricity; non-metals mostly don't — that's why wires are copper but covered in plastic!",
        },
      },
      bg: {
        low: {
          title: "Материали и техните свойства",
          explanation: "Всичко около нас е направено от материали. Материалите имат свойства — характеристики, описващи какви са: твърди или меки, грапави или гладки, прозрачни или непрозрачни, гъвкави или твърди, тежки или леки. Избираме материали според свойствата им: стъклото е прозрачно, затова го използваме за прозорци; гумата е гъвкава, затова я използваме за гуми на коли.",
          examples: [
            { problem: "Назови 2 свойства на стъклото.", solution: "Стъклото е прозрачно (може да се вижда през него) и твърдо (не се огъва). То може и да се чупи — крехко е.", hint: "Помисли за прозорец — какво може да правиш с него? Виждаш ли през него? Огъва ли се?" },
            { problem: "Защо гумата се използва за автомобилни гуми?", solution: "Гумата е гъвкава (огъва се, без да се чупи), водонепропусклива и издръжлива — идеална за гуми, нуждаещи се от сцепление с пътя.", hint: "Гумите трябва да се захващат за пътя, да се огъват малко и да не се чупят. Кой материал може да прави това?" },
            { problem: "Дървото природен или изкуствен материал ли е?", solution: "Дървото е ПРИРОДЕН материал — идва от дърветата. Пластмасата е изкуствен материал.", hint: "Природен = идва от природата (растения, животни, земя). Изкуствен = направен в завод." },
          ],
          tip: "🔍 Учените описват материалите чрез СВОЙСТВАТА им — винаги питай: Твърд ли е? Тежък ли е? Прозрачен ли е? Гъвкав ли е?",
        },
        high: {
          title: "Материали: природни, изкуствени и тяхното приложение",
          explanation: "Материалите се делят на природни (дърво, камък, памук, вълна, вода) и изкуствени/синтетични (пластмаса, найлон, стъкло, стомана, бетон). Синтетичните материали често се правят от природни (пластмасата — от нефт). Учените изследват материалите по свойства: якост, твърдост, електропроводимост, прозрачност.",
          examples: [
            { problem: "Каква е разликата между природен и синтетичен материал?", solution: "Природен: намиран в природата — дърво, камък, памук, вълна, кожа. Синтетичен: направен от хората в заводи — пластмаса, найлон, полиестер, бетон.", hint: "Синтетичен обикновено означава: направен в завод чрез химически процеси." },
            { problem: "Защо стоманата се използва за мостове и сгради?", solution: "Стоманата е много яка (висока опъна якост), издръжлива и може да се оформя — може да издържа огромно тегло, без да се чупи.", hint: "Мостовете трябва да издържат тежки превозни средства. Какво свойство трябва да има материалът?" },
            { problem: "Назови материал, провеждащ електричество, и такъв, който не провежда.", solution: "Провежда: мед (използва се в кабели), алуминий, желязо — металите като цяло провеждат електричество. НЕ провежда (изолатор): гума, пластмаса, дърво, стъкло.", hint: "Проводниците пускат електричеството да тече. Изолаторите го блокират." },
          ],
          tip: "⚡ Металите провеждат електричество; неметалите — обикновено не — затова жиците са медни, но обвити в пластмаса!",
        },
      },
      es: {
        low: {
          title: "Materiales y sus propiedades",
          explanation: "Todo lo que nos rodea está hecho de materiales. Los materiales tienen propiedades: duro o blando, rugoso o liso, transparente u opaco, flexible o rígido, pesado o ligero. Elegimos materiales según sus propiedades: el vidrio es transparente, por eso lo usamos para ventanas; el caucho es flexible, por eso lo usamos para neumáticos.",
          examples: [
            { problem: "Nombra 2 propiedades del vidrio.", solution: "El vidrio es transparente (puedes ver a través de él) y duro (rígido, no se dobla). También puede romperse — es frágil.", hint: "Piensa en una ventana — ¿qué puedes hacer con el vidrio? ¿Ver a través de él? ¿Doblarlo?" },
            { problem: "¿Por qué se usa caucho para los neumáticos?", solution: "El caucho es flexible (se dobla sin romperse), impermeable y duradero — perfecto para neumáticos que deben agarrar la carretera.", hint: "Los neumáticos deben agarrar, estirarse un poco y no romperse. ¿Qué material puede hacer eso?" },
            { problem: "¿Es la madera natural o artificial?", solution: "La madera es un material NATURAL — proviene de los árboles. El plástico es artificial.", hint: "Natural = viene de la naturaleza. Artificial = fabricado en una fábrica." },
          ],
          tip: "🔍 ¡Los científicos describen los materiales por sus PROPIEDADES — siempre pregunta: ¿Es duro? ¿Pesado? ¿Transparente? ¿Flexible?",
        },
        high: {
          title: "Materiales: naturales, sintéticos y sus usos",
          explanation: "Los materiales se clasifican en naturales (madera, piedra, algodón, lana, agua) o sintéticos/artificiales (plástico, nailón, vidrio, acero, hormigón). Los materiales sintéticos a menudo se fabrican a partir de naturales (el plástico del petróleo). Los científicos prueban materiales por propiedades: resistencia, dureza, conductividad, transparencia.",
          examples: [
            { problem: "¿Cuál es la diferencia entre material natural y sintético?", solution: "Natural: encontrado en la naturaleza — madera, piedra, algodón, lana, cuero. Sintético: hecho por humanos en fábricas — plástico, nailón, poliéster, hormigón.", hint: "Sintético generalmente significa: fabricado en una fábrica mediante procesos químicos." },
            { problem: "¿Por qué se usa acero para puentes y edificios?", solution: "El acero es muy resistente, duradero y puede moldearse — puede soportar un peso enorme sin romperse.", hint: "Los puentes deben soportar vehículos pesados. ¿Qué propiedad necesita el material?" },
            { problem: "Nombra un material que conduce electricidad y uno que no.", solution: "Conduce: cobre (usado en cables), aluminio, hierro — los metales generalmente conducen. No conduce: caucho, plástico, madera, vidrio.", hint: "Los conductores dejan fluir la electricidad. Los aislantes la bloquean." },
          ],
          tip: "⚡ ¡Los metales conducen electricidad; los no metales generalmente no — por eso los cables son de cobre pero cubiertos de plástico!",
        },
      },
    },

    /* ── NATURAL-SCIENCE / LIGHT-SOUND ── */
    "natural-science/light-sound": {
      en: {
        low: {
          title: "Light and Sound",
          explanation: "Light allows us to see. Light comes from sources: the Sun (natural), a lamp or candle (artificial). Light travels in straight lines. When light hits a surface, it can reflect (bounce back) — that is why you see yourself in a mirror. Sound is made when something vibrates. Sound travels through air, water, and solid objects. Loud sounds have strong vibrations; quiet sounds have gentle vibrations.",
          examples: [
            { problem: "Name 2 natural and 2 artificial sources of light.", solution: "Natural: the Sun, fire, lightning, glowing animals (firefly). Artificial: electric lamp, candle, torch, phone screen.", hint: "Natural = exists in nature without humans. Artificial = made by humans." },
            { problem: "Why do you see yourself in a mirror?", solution: "Mirrors are very smooth and shiny — they reflect light in a regular pattern so the image is clear. Your face reflects light into the mirror, which reflects it back to your eyes.", hint: "Reflection = light bounces off a smooth surface." },
            { problem: "Why can you hear a sound even in a different room?", solution: "Sound travels through air as vibrations (sound waves). Walls and floors also carry vibrations, allowing sound to pass through to other rooms.", hint: "Sound needs a medium (air, water, solid) to travel through. It cannot travel in a vacuum." },
          ],
          tip: "💡 Light travels straight. Sound travels in all directions as waves — that's why you can hear around corners!",
        },
        high: {
          title: "Properties of Light and Sound",
          explanation: "Light travels at 300,000 km per second — the fastest thing in the universe. Sound travels at only 340 m/s in air (much slower). Shadows form when opaque objects block light. Refraction happens when light bends as it passes from air into water (why a straw looks bent). Sound pitch depends on frequency — high frequency = high pitch (whistle). Loudness depends on amplitude.",
          examples: [
            { problem: "Why does a straw look bent in a glass of water?", solution: "Refraction — light bends when it passes from air into water (different densities). This makes the straw appear to be in a different position than it actually is.", hint: "Refraction = bending of light when passing between materials." },
            { problem: "What is the difference between pitch and volume of sound?", solution: "Pitch = how high or low a sound is (frequency). A whistle is high-pitched; thunder is low-pitched. Volume = how loud or quiet (amplitude of vibration).", hint: "Pitch = high/low tone. Volume = loud/quiet." },
            { problem: "Why do you see lightning before you hear thunder?", solution: "Light travels much faster than sound. Lightning reaches your eyes almost instantly. Thunder (the sound) follows more slowly — about 3 seconds per kilometre away.", hint: "Light speed: 300,000 km/s. Sound speed: 340 m/s. Light wins by a huge margin!" },
          ],
          tip: "⚡ Count the seconds between lightning and thunder — every 3 seconds = 1 km away!",
        },
      },
      bg: {
        low: {
          title: "Светлина и звук",
          explanation: "Светлината ни позволява да виждаме. Светлината идва от източници: Слънцето (естествен), лампа или свещ (изкуствен). Светлината се разпространява праволинейно. Когато светлината удари повърхност, тя може да се отрази — затова се виждаш в огледалото. Звукът се получава, когато нещо вибрира. Звукът се разпространява през въздух, вода и твърди тела. Силните звуци имат силни вибрации; тихите — слаби.",
          examples: [
            { problem: "Назови 2 естествени и 2 изкуствени източници на светлина.", solution: "Естествени: Слънцето, огънят, мълнията, светещи животни (светулка). Изкуствени: електрическа лампа, свещ, фенерче, екран на телефон.", hint: "Естествен = съществува в природата без хора. Изкуствен = направен от хора." },
            { problem: "Защо се виждаш в огледалото?", solution: "Огледалата са много гладки и блестящи — те отразяват светлината по правилен начин, така че образът е ясен. Лицето ти отразява светлина към огледалото, а то я отразява обратно към очите ти.", hint: "Отражение = светлината отскача от гладка повърхност." },
            { problem: "Защо чуваш звук дори в друга стая?", solution: "Звукът пътува през въздуха като вибрации (звукови вълни). Стените и подовете също пренасят вибрации, позволявайки на звука да премине в другите стаи.", hint: "Звукът се нуждае от среда (въздух, вода, твърдо тяло), за да се разпространява. Не може да пътува във вакуум." },
          ],
          tip: "💡 Светлината пътува праволинейно. Звукът пътува във всички посоки като вълни — затова чуваш зад ъгъла!",
        },
        high: {
          title: "Свойства на светлината и звука",
          explanation: "Светлината пътува с 300 000 км/с — най-бързото нещо в Вселената. Звукът пътува само с 340 м/с във въздуха (много по-бавно). Сенките се образуват, когато непрозрачни предмети блокират светлината. Пречупването на светлината се получава, когато тя преминава от въздух към вода (затова сламката изглежда огъната). Височината на звука зависи от честотата — висока честота = висок звук.",
          examples: [
            { problem: "Защо сламката изглежда огъната в чаша с вода?", solution: "Пречупване — светлината се огъва, когато преминава от въздух в вода (различни плътности). Това кара сламката да изглежда в различна позиция, отколкото е в действителност.", hint: "Пречупване = огъване на светлината при преминаване между материали." },
            { problem: "Каква е разликата между тон и сила на звука?", solution: "Тон = колко висок или нисък е звукът (честота). Свирката е висок тон; гръмотевицата е нисък тон. Сила = колко силен или тих е (амплитуда на вибрацията).", hint: "Тон = висок/нисък. Сила = силен/тих." },
            { problem: "Защо виждаш мълния преди да чуеш гърма?", solution: "Светлината пътува много по-бързо от звука. Мълнията достига до очите ти почти мигновено. Гърмът (звукът) следва по-бавно — около 3 секунди на километър разстояние.", hint: "Скорост на светлина: 300 000 км/с. Скорост на звук: 340 м/с. Светлината е много по-бърза!" },
          ],
          tip: "⚡ Брой секундите между мълнията и гърма — всеки 3 секунди = 1 км разстояние!",
        },
      },
      es: {
        low: {
          title: "Luz y sonido",
          explanation: "La luz nos permite ver. La luz viene de fuentes: el Sol (natural), una lámpara o vela (artificial). La luz viaja en línea recta. Cuando la luz golpea una superficie puede reflejarse — por eso te ves en un espejo. El sonido se produce cuando algo vibra. El sonido viaja por el aire, el agua y los sólidos.",
          examples: [
            { problem: "Nombra 2 fuentes naturales y 2 artificiales de luz.", solution: "Naturales: el Sol, fuego, rayo, animales luminosos (luciérnaga). Artificiales: lámpara eléctrica, vela, linterna, pantalla de teléfono.", hint: "Natural = existe en la naturaleza sin humanos. Artificial = fabricado por humanos." },
            { problem: "¿Por qué te ves en un espejo?", solution: "Los espejos son muy lisos y brillantes — reflejan la luz de manera ordenada para que la imagen sea clara.", hint: "Reflexión = la luz rebota en una superficie lisa." },
            { problem: "¿Por qué puedes oír un sonido incluso en otra habitación?", solution: "El sonido viaja por el aire como vibraciones (ondas sonoras). Las paredes y los pisos también transportan vibraciones, permitiendo que el sonido pase.", hint: "El sonido necesita un medio (aire, agua, sólido) para viajar." },
          ],
          tip: "💡 ¡La luz viaja en línea recta. El sonido viaja en todas las direcciones como ondas — por eso puedes oír doblar las esquinas!",
        },
        high: {
          title: "Propiedades de la luz y el sonido",
          explanation: "La luz viaja a 300,000 km/s — lo más rápido del universo. El sonido viaja a solo 340 m/s en el aire. Las sombras se forman cuando objetos opacos bloquean la luz. La refracción ocurre cuando la luz se dobla al pasar del aire al agua. El tono del sonido depende de la frecuencia.",
          examples: [
            { problem: "¿Por qué una pajita parece doblada en un vaso de agua?", solution: "Refracción — la luz se dobla al pasar del aire al agua (diferentes densidades). Esto hace que la pajita parezca estar en una posición diferente.", hint: "Refracción = doblamiento de la luz al pasar entre materiales." },
            { problem: "¿Cuál es la diferencia entre el tono y el volumen del sonido?", solution: "Tono = qué tan alto o bajo es un sonido (frecuencia). Un silbato tiene tono alto; el trueno tiene tono bajo. Volumen = qué tan fuerte o suave (amplitud).", hint: "Tono = alto/bajo. Volumen = fuerte/suave." },
            { problem: "¿Por qué ves el relámpago antes de escuchar el trueno?", solution: "La luz viaja mucho más rápido que el sonido. El relámpago llega a tus ojos casi instantáneamente. El trueno sigue más lentamente — unos 3 segundos por kilómetro de distancia.", hint: "Velocidad de la luz: 300,000 km/s. Velocidad del sonido: 340 m/s." },
          ],
          tip: "⚡ ¡Cuenta los segundos entre el relámpago y el trueno — cada 3 segundos = 1 km de distancia!",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / ALGEBRA-BASICS ── */
    "mathematics-advanced/algebra-basics": {
      en: {
        low: {
          title: "Algebra Basics",
          explanation: "Algebra uses letters (variables) like x and y to represent unknown numbers. We use equations to show relationships. An equation is a statement where two expressions are equal. To solve an equation, we find the value of the variable that makes the equation true.",
          examples: [
            { problem: "x + 5 = 12. Find x.", solution: "x = 7", hint: "Think: what number plus 5 equals 12? Try: 12 − 5 = 7", steps: ["x + 5 = 12", "x = 12 − 5", "x = 7"] },
            { problem: "3 × x = 18. Find x.", solution: "x = 6", hint: "What number multiplied by 3 equals 18? Try: 18 ÷ 3 = 6", steps: ["3 × x = 18", "x = 18 ÷ 3", "x = 6"] },
            { problem: "x − 4 = 9. Find x.", solution: "x = 13", hint: "What number minus 4 equals 9? Try: 9 + 4 = 13", steps: ["x − 4 = 9", "x = 9 + 4", "x = 13"] },
          ],
          tip: "🔤 Think of algebra as a puzzle: the variable x is the hidden piece, and we solve to find it!",
        },
        high: {
          title: "Algebra Basics",
          explanation: "In algebra, we use variables (x, y, z) to represent unknown numbers and create equations to solve problems. The key principle is to keep both sides of an equation balanced — whatever we do to one side, we must do to the other. This is called 'inverse operations': addition ↔ subtraction, multiplication ↔ division.",
          examples: [
            { problem: "2x + 3 = 11. Solve for x.", solution: "x = 4", hint: "Subtract 3 from both sides: 2x = 8. Divide both sides by 2: x = 4", steps: ["2x + 3 = 11", "2x = 11 − 3", "2x = 8", "x = 8 ÷ 2", "x = 4"] },
            { problem: "x ÷ 2 = 5. Solve for x.", solution: "x = 10", hint: "Multiply both sides by 2: x = 10", steps: ["x ÷ 2 = 5", "x = 5 × 2", "x = 10"] },
            { problem: "5(x + 2) = 35. Solve for x.", solution: "x = 5", hint: "Divide both sides by 5: x + 2 = 7. Subtract 2: x = 5", steps: ["5(x + 2) = 35", "x + 2 = 35 ÷ 5", "x + 2 = 7", "x = 7 − 2", "x = 5"] },
          ],
          tip: "⚖️ Equations are like a balance scale — keep both sides equal!",
        },
      },
      bg: {
        low: {
          title: "Алгебра",
          explanation: "В алгебрата използваме буквите (променливите) като x и y, за да представим неизвестни числа. Уравнението показва равенство между две групи. За да решим уравнение, трябва да намерим стойността на променливата, която прави уравнението вярно.",
          examples: [
            { problem: "x + 5 = 12. Намери x.", solution: "x = 7", hint: "Кое число плюс 5 е равно на 12? Опитай: 12 − 5 = 7", steps: ["x + 5 = 12", "x = 12 − 5", "x = 7"] },
            { problem: "3 × x = 18. Намери x.", solution: "x = 6", hint: "Кое число по 3 е равно на 18? Опитай: 18 ÷ 3 = 6", steps: ["3 × x = 18", "x = 18 ÷ 3", "x = 6"] },
            { problem: "x − 4 = 9. Намери x.", solution: "x = 13", hint: "Кое число минус 4 е равно на 9? Опитай: 9 + 4 = 13", steps: ["x − 4 = 9", "x = 9 + 4", "x = 13"] },
          ],
          tip: "🔤 Мисли на алгебрата като пъзел: x е скритото число, което трябва да намериш!",
        },
        high: {
          title: "Алгебра",
          explanation: "В алгебрата използваме променливи (x, y, z), за да представим неизвестни числа и да решим задачи. Ключният принцип е да держим уравнението в баланс — каквото направим от едната страна, трябва да направим и от другата. Това са обратни операции: събиране ↔ изваждане, умножение ↔ деление.",
          examples: [
            { problem: "2x + 3 = 11. Реши за x.", solution: "x = 4", hint: "Извади 3 от двете страни: 2x = 8. Раздели двете страни на 2: x = 4", steps: ["2x + 3 = 11", "2x = 11 − 3", "2x = 8", "x = 8 ÷ 2", "x = 4"] },
            { problem: "x ÷ 2 = 5. Реши за x.", solution: "x = 10", hint: "Умножи двете страни по 2: x = 10", steps: ["x ÷ 2 = 5", "x = 5 × 2", "x = 10"] },
            { problem: "5(x + 2) = 35. Реши за x.", solution: "x = 5", hint: "Раздели двете страни на 5: x + 2 = 7. Извади 2: x = 5", steps: ["5(x + 2) = 35", "x + 2 = 35 ÷ 5", "x + 2 = 7", "x = 7 − 2", "x = 5"] },
          ],
          tip: "⚖️ Уравненията са като везна — держи двете страни в баланс!",
        },
      },
      es: {
        low: {
          title: "Álgebra Básica",
          explanation: "En álgebra, usamos letras (variables) como x e y para representar números desconocidos. Una ecuación muestra igualdad entre dos expresiones. Para resolver una ecuación, encontramos el valor de la variable que hace verdadera la ecuación.",
          examples: [
            { problem: "x + 5 = 12. Encuentra x.", solution: "x = 7", hint: "¿Qué número más 5 es igual a 12? Intenta: 12 − 5 = 7", steps: ["x + 5 = 12", "x = 12 − 5", "x = 7"] },
            { problem: "3 × x = 18. Encuentra x.", solution: "x = 6", hint: "¿Qué número por 3 es igual a 18? Intenta: 18 ÷ 3 = 6", steps: ["3 × x = 18", "x = 18 ÷ 3", "x = 6"] },
            { problem: "x − 4 = 9. Encuentra x.", solution: "x = 13", hint: "¿Qué número menos 4 es igual a 9? Intenta: 9 + 4 = 13", steps: ["x − 4 = 9", "x = 9 + 4", "x = 13"] },
          ],
          tip: "🔤 ¡Piensa en el álgebra como un rompecabezas: x es la pieza oculta que debes encontrar!",
        },
        high: {
          title: "Álgebra Básica",
          explanation: "En álgebra, usamos variables (x, y, z) para representar números desconocidos y crear ecuaciones para resolver problemas. El principio clave es mantener el equilibrio de la ecuación: lo que hacemos en un lado, debemos hacerlo en el otro. Estas son operaciones inversas: suma ↔ resta, multiplicación ↔ división.",
          examples: [
            { problem: "2x + 3 = 11. Resuelve para x.", solution: "x = 4", hint: "Resta 3 de ambos lados: 2x = 8. Divide ambos lados entre 2: x = 4", steps: ["2x + 3 = 11", "2x = 11 − 3", "2x = 8", "x = 8 ÷ 2", "x = 4"] },
            { problem: "x ÷ 2 = 5. Resuelve para x.", solution: "x = 10", hint: "Multiplica ambos lados por 2: x = 10", steps: ["x ÷ 2 = 5", "x = 5 × 2", "x = 10"] },
            { problem: "5(x + 2) = 35. Resuelve para x.", solution: "x = 5", hint: "Divide ambos lados entre 5: x + 2 = 7. Resta 2: x = 5", steps: ["5(x + 2) = 35", "x + 2 = 35 ÷ 5", "x + 2 = 7", "x = 7 − 2", "x = 5"] },
          ],
          tip: "⚖️ ¡Las ecuaciones son como una balanza — mantén ambos lados equilibrados!",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / FRACTIONS-ADV ── */
    "mathematics-advanced/fractions-adv": {
      en: {
        low: {
          title: "Fractions",
          explanation: "A fraction is a part of a whole. It shows how many equal parts we have out of the total. A fraction has two parts: the numerator (top number) tells us how many parts we have, and the denominator (bottom number) tells us how many equal parts the whole is divided into. For example, 3/4 means we have 3 out of 4 equal parts.",
          examples: [
            { problem: "What fraction is shaded in a circle divided into 4 equal parts with 1 part shaded?", solution: "1/4", hint: "Count the shaded parts (1) and total parts (4). Write as 1/4." },
            { problem: "If a pizza is cut into 8 slices and you eat 2 slices, what fraction did you eat?", solution: "2/8 or 1/4", hint: "Shaded parts = 2, Total parts = 8. So 2/8 (simplified to 1/4)." },
            { problem: "What fraction is 3 out of 5 equal parts?", solution: "3/5", hint: "Parts we have = 3, Total parts = 5. Write as 3/5." },
          ],
          tip: "🔢 Remember: the line between the numbers means 'out of' — so 3/5 means 3 out of 5 parts!",
        },
        high: {
          title: "Fractions",
          explanation: "Fractions represent parts of a whole. The numerator is the top number (how many parts we have), and the denominator is the bottom number (how many equal parts the whole is divided into). Equal fractions are fractions that represent the same amount, like 1/2 and 2/4. We can simplify fractions by dividing both the numerator and denominator by their greatest common factor.",
          examples: [
            { problem: "Simplify the fraction 4/8.", solution: "1/2", hint: "Both 4 and 8 are divisible by 4. 4÷4=1, 8÷4=2. So 4/8 = 1/2." },
            { problem: "Are the fractions 2/3 and 4/6 equal? Show your work.", solution: "Yes, they are equal", hint: "Multiply 2/3 by 2/2: (2×2)/(3×2) = 4/6. Or simplify 4/6 by dividing by 2: 4÷2=2, 6÷2=3, so 4/6 = 2/3." },
            { problem: "What is the fraction in simplest form for 6/9?", solution: "2/3", hint: "Both numbers are divisible by 3. 6÷3=2, 9÷3=3. So 6/9 = 2/3 in simplest form." },
          ],
          tip: "📐 A fraction in simplest form has no common factors between numerator and denominator (except 1)!",
        },
      },
      bg: {
        low: {
          title: "Дроби",
          explanation: "Дробта показва част от едно цяло. Тя има две части: числител (горното число) показва колко части имаме, а знаменател (долното число) показва на колко равни части е разделено цялото. Например, 3/4 означава, че имаме 3 от 4 равни части.",
          examples: [
            { problem: "Каква дроб е оцветена в кръг, разделен на 4 равни части с 1 оцветена част?", solution: "1/4", hint: "Преброй оцветените части (1) и всички части (4). Пиши като 1/4." },
            { problem: "Ако пица е нарязана на 8 парчета и ти изяла 2 парчета, каква дроб си изяла?", solution: "2/8 или 1/4", hint: "Оцветени части = 2, Всички части = 8. Значи 2/8 (опростено 1/4)." },
            { problem: "Каква дроб е 3 от 5 равни части?", solution: "3/5", hint: "Части, които имаме = 3, Всички части = 5. Пиши като 3/5." },
          ],
          tip: "🔢 Помни: линията между числата означава 'от' — 3/5 означава 3 от 5 части!",
        },
        high: {
          title: "Дроби",
          explanation: "Дробата показва част от едно цяло. Числителят е горното число (колко части имаме), а знаменателят е долното число (на колко равни части е разделено цялото). Равни дроби са дроби, които представляват един и същ размер, как 1/2 и 2/4. Можем да опростим дробите чрез делене на числител и знаменател на техния най-голям общ делител.",
          examples: [
            { problem: "Опрости дробта 4/8.", solution: "1/2", hint: "И 4, и 8 се делят на 4. 4÷4=1, 8÷4=2. Значи 4/8 = 1/2." },
            { problem: "Дробите 2/3 и 4/6 равни ли са? Покажи как си сигурен.", solution: "Да, те са равни", hint: "Умножи 2/3 по 2/2: (2×2)/(3×2) = 4/6. Или опрости 4/6 чрез деление на 2: 4÷2=2, 6÷2=3, значи 4/6 = 2/3." },
            { problem: "Каква е дробта в най-проста форма за 6/9?", solution: "2/3", hint: "И двете числа се делят на 3. 6÷3=2, 9÷3=3. Значи 6/9 = 2/3 в най-проста форма." },
          ],
          tip: "📐 Дроба в най-проста форма няма общи делители между числител и знаменател (освен 1)!",
        },
      },
      es: {
        low: {
          title: "Fracciones",
          explanation: "Una fracción es una parte de un todo. Muestra cuántas partes iguales tenemos del total. Una fracción tiene dos partes: el numerador (número de arriba) nos dice cuántas partes tenemos, y el denominador (número de abajo) nos dice en cuántas partes iguales se divide el todo. Por ejemplo, 3/4 significa que tenemos 3 de 4 partes iguales.",
          examples: [
            { problem: "¿Qué fracción está sombreada en un círculo dividido en 4 partes iguales con 1 parte sombreada?", solution: "1/4", hint: "Cuenta las partes sombreadas (1) y todas las partes (4). Escribe como 1/4." },
            { problem: "Si una pizza se corta en 8 rebanadas y comes 2, ¿qué fracción comiste?", solution: "2/8 o 1/4", hint: "Partes sombreadas = 2, Todas las partes = 8. Entonces 2/8 (simplificado a 1/4)." },
            { problem: "¿Qué fracción es 3 de 5 partes iguales?", solution: "3/5", hint: "Partes que tenemos = 3, Todas las partes = 5. Escribe como 3/5." },
          ],
          tip: "🔢 ¡Recuerda: la línea entre los números significa 'de' — 3/5 significa 3 de 5 partes!",
        },
        high: {
          title: "Fracciones",
          explanation: "Las fracciones representan partes de un todo. El numerador es el número de arriba (cuántas partes tenemos), y el denominador es el número de abajo (en cuántas partes iguales se divide el todo). Las fracciones equivalentes son fracciones que representan la misma cantidad, como 1/2 y 2/4. Podemos simplificar fracciones dividiendo el numerador y el denominador por su máximo común divisor.",
          examples: [
            { problem: "Simplifica la fracción 4/8.", solution: "1/2", hint: "Tanto 4 como 8 son divisibles por 4. 4÷4=1, 8÷4=2. Entonces 4/8 = 1/2." },
            { problem: "¿Las fracciones 2/3 y 4/6 son iguales? Muestra tu trabajo.", solution: "Sí, son iguales", hint: "Multiplica 2/3 por 2/2: (2×2)/(3×2) = 4/6. O simplifica 4/6 dividiendo por 2: 4÷2=2, 6÷2=3, entonces 4/6 = 2/3." },
            { problem: "¿Cuál es la fracción en forma simplificada para 6/9?", solution: "2/3", hint: "Ambos números son divisibles por 3. 6÷3=2, 9÷3=3. Entonces 6/9 = 2/3 en forma simplificada." },
          ],
          tip: "📐 ¡Una fracción en forma simplificada no tiene factores comunes entre numerador y denominador (excepto 1)!",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / NATURAL-NUMBERS ── */
    "mathematics-advanced/natural-numbers": {
      bg: {
        low: {
          title: "Натурални числа",
          explanation: "Натурални числа са числата, които използваме за броене: 1, 2, 3, 4, 5... Най-малкото натурално число е 1. Някои дефиниции включват и 0 като естествено число, но традиционно броим от 1. Натурални числа используме при всекидневни дейности — брой ябълки, брой децата, брой чаши вода.",
          examples: [
            { problem: "Кои са натурални числа от следния списък: 0, 1, 2, 3, -1?", solution: "1, 2, 3", hint: "Натурални числа са само положителните цели числа за броене. 0 и -1 не са натурални." },
            { problem: "Напиши 5 натурални числа, които са по-големи от 10.", solution: "11, 12, 13, 14, 15 (или други подходящи числа)", hint: "Всяко число, което е по-голямо от 10 и е цяло положително число, е натурално." },
            { problem: "Наименуй натурални числа, които са между 5 и 10.", solution: "6, 7, 8, 9", hint: "Числа, които се намират между 5 и 10 (без самите 5 и 10)." },
          ],
          tip: "🔢 Натурални числа = числа за броене: 1, 2, 3, 4, 5, 6...",
        },
        high: {
          title: "Натурални числа и операции",
          explanation: "Натурални числа образуват множество N = {1, 2, 3, 4...}. С натурални числа можем да извършваме операции: събиране, изваждане (когато резултатът е натурално число), умножение и деление. Свойства: събиране е комутативно (a+b=b+a), ассоциативно ((a+b)+c=a+(b+c)). Умножението е също комутативно и ассоциативно.",
          examples: [
            { problem: "Калкулирай: (5 + 3) + 2 и 5 + (3 + 2). Какво забелязваш?", solution: "И двата резултата са 10. Събиране е ассоциативно: (a+b)+c = a+(b+c)", hint: "Можеш да групираш добавяемите по различни начини — резултатът е същия." },
            { problem: "Какво е 4 × 7 и 7 × 4?", solution: "И двата резултата са 28. Умножение е комутативно: a×b = b×a", hint: "Редът на множенето не влияе на резултата." },
            { problem: "Проверка: Естественото число ли е 15 ÷ 3?", solution: "Да, резултатът е 5, което е натурално число.", hint: "Ако делението дава цяло число, резултатът е натурално число." },
          ],
          tip: "⚙️ Натурални числа са затворени при събиране и умножение (резултатът е винаги натурално число).",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / DIVISIBILITY ── */
    "mathematics-advanced/divisibility": {
      bg: {
        low: {
          title: "Делимост",
          explanation: "Число a е делимо на число b, ако a се дели на b без остатък. Например: 12 е делимо на 3, защото 12 ÷ 3 = 4 (без остатък). Ако число не се дели нацяло, има остатък. Например: 13 ÷ 3 = 4 с остатък 1. Делимост помага в математиката да проверим дали числата се делят без остатък.",
          examples: [
            { problem: "Делимо ли е 20 на 4?", solution: "Да, защото 20 ÷ 4 = 5 без остатък.", hint: "Проверка: 5 × 4 = 20. Изчисли резултата от делението." },
            { problem: "Делимо ли е 17 на 3?", solution: "Не, защото 17 ÷ 3 = 5 с остатък 2.", hint: "17 = 3 × 5 + 2. Има остатък, значи 17 не е делимо на 3." },
            { problem: "Назови числа, които са делими на 5.", solution: "5, 10, 15, 20, 25, 30...", hint: "Числата, делими на 5, завършват на 0 или 5." },
          ],
          tip: "✂️ Число е делимо на друго, ако делението е нацяло (без остатък).",
        },
        high: {
          title: "Делимост и делители",
          explanation: "Делител на число a е число b, което дели a без остатък. Например делителите на 12 са: 1, 2, 3, 4, 6, 12. Правила за делимост: число е делимо на 2, ако е четно (завършва на 0, 2, 4, 6, 8). Делимо на 5 — завършва на 0 или 5. Делимо на 10 — завършва на 0. На 3 — сумата на цифрите е делима на 3.",
          examples: [
            { problem: "Намери всички делители на 24.", solution: "1, 2, 3, 4, 6, 8, 12, 24", hint: "Делители на 24: 1×24, 2×12, 3×8, 4×6." },
            { problem: "Делимо ли е 147 на 3? Използвай правило за делимост.", solution: "Да, защото 1+4+7=12, което е делимо на 3.", hint: "Правило: число е делимо на 3, ако сумата на цифрите му е делима на 3." },
            { problem: "Кои числа от 25, 32, 45, 60 са делими на 5?", solution: "25, 45, 60", hint: "Делимо на 5: завършва на 0 или 5." },
          ],
          tip: "🔍 Делимост помага да разбром числата на техните делители — важно за дроби и опростяване.",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / COMMON-FRACTIONS ── */
    "mathematics-advanced/common-fractions": {
      bg: {
        low: {
          title: "Обикновени дроби",
          explanation: "Обикновена дроб показва част от едно цяло. Например 3/4 означава: цялото е разделено на 4 равни части, и ние имаме 3 от тях. Числител (горното число) показва колко части имаме. Знаменател (долното число) показва на колко равни части е разделено цялото. Обикновени дроби използваме всеки ден — половина пица (1/2), три четвърти чаша вода (3/4).",
          examples: [
            { problem: "Напиши дробта за половин килограм.", solution: "1/2", hint: "Половин = 1 от 2 равни части, значи 1/2." },
            { problem: "Ако пица е разрязана на 8 парчета и ти изяда 3 парчета, каква дроб изяда?", solution: "3/8", hint: "Числител = парчета, които си изял (3). Знаменател = всички парчета (8)." },
            { problem: "Опрости дробта 4/8.", solution: "1/2", hint: "И 4, и 8 са делими на 4. 4÷4=1, 8÷4=2. Значи 4/8 = 1/2." },
          ],
          tip: "🍕 Дроба = част от цяло. Числител казва 'колко', знаменател казва 'от колко'.",
        },
        high: {
          title: "Обикновени дроби (разширено)",
          explanation: "Обикновена дроб a/b: a е числител, b е знаменател. Правилна дроб: числител < знаменател (напр. 3/4). Неправилна дроб: числител ≥ знаменател (напр. 5/4). Смесено число: цяло число + дроб (напр. 1 1/4). Равни дроби: 1/2 = 2/4 = 3/6 (разширяме или опростяваме). Събиране: същия знаменател — събираме числителите. За различни знаменатели — намираме общ знаменател.",
          examples: [
            { problem: "Преобразувай 5/4 в смесено число.", solution: "1 1/4", hint: "5÷4 = 1 с остатък 1. Смесено число = 1 + 1/4 = 1 1/4." },
            { problem: "Събери: 2/5 + 1/5.", solution: "3/5", hint: "Знаменателите са еднакви. Събери числителите: 2+1=3, знаменател остава 5." },
            { problem: "Намери еквивалентна дроб: 2/3 = ?/9.", solution: "6/9", hint: "За преминаване от 3 на 9, умножаваме по 3. Значи 2×3 = 6. Ответ: 6/9." },
          ],
          tip: "🔀 Равни дроби: умножи или раздели числител и знаменател на същото число.",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / DECIMAL-FRACTIONS ── */
    "mathematics-advanced/decimal-fractions": {
      bg: {
        low: {
          title: "Десетични дроби",
          explanation: "Десетична дроб е число с десетична точка (или запетая в някои страни). Например: 0.5 = половина, 0.25 = четвърт, 0.75 = три четвърти. След десетичната точка имаме десетите (0.1), стотни (0.01), хилядни (0.001) и т.н. Десетични дроби използваме за деньги (2.50 лева), измервания (1.75 метра), маса (2.5 килограма).",
          examples: [
            { problem: "Какво е десетичното представяне на 1/2?", solution: "0.5", hint: "1÷2 = 0.5", steps: ["Дроба 1/2 означава 1 ÷ 2", "1 ÷ 2 = 0.5", "Резултат: 0.5"] },
            { problem: "Какво е десетичното представяне на 1/4?", solution: "0.25", hint: "1÷4 = 0.25", steps: ["Дроба 1/4 означава 1 ÷ 4", "1 ÷ 4 = 0.25", "Резултат: 0.25"] },
            { problem: "Напиши десетичната дроб за три лева и 50 стотинки.", solution: "3.50 или 3.5", hint: "3 лева (цяло число) и 50 стотинки (0.50) = 3.50", steps: ["Целата част: 3 лева", "Частната част: 50 стотинки = 0.50", "Комбинираме целата и частната част: 3 + 0.50", "Резултат: 3.50 (или 3.5)"] },
          ],
          tip: "💰 Десетични дроби = число с точка. След точката идват десети, стотни, хилядни...",
        },
        high: {
          title: "Десетични дроби (операции)",
          explanation: "Десетична дроб = обикновена дроб с знаменател 10, 100, 1000... Събиране и изваждане: подравни десетичните точки. Умножение: умножи числата, после преброй цифрите след точката и постави точката на правилното място. Деление: преработи към цяло число, умножи по 10 докато знаменателят не е цяло, след това дели.",
          examples: [
            { problem: "Събери: 2.5 + 1.3", solution: "3.8", hint: "2.5 + 1.3: подравни точките, събери: 2+1=3, 5+3=8. Резултат: 3.8", steps: ["Подравяме числата по десетичната точка:", "  2.5", "+ 1.3", "Събираме целите части: 2 + 1 = 3", "Събираме десетите: 0.5 + 0.3 = 0.8", "Резултат: 3.8"] },
            { problem: "Умножи: 0.5 × 4", solution: "2.0 или 2", hint: "0.5 × 4 = 2. Или: половина от 4 е 2.", steps: ["0.5 = половина (1/2)", "Половина от 4 = 4 ÷ 2 = 2", "Резултат: 2.0 или 2"] },
            { problem: "Раздели: 3 ÷ 0.5", solution: "6", hint: "3 ÷ 0.5 = 3 ÷ (1/2) = 3 × 2 = 6", steps: ["0.5 = 1/2 (обикновена дроб)", "3 ÷ (1/2) = 3 × 2 (деление на дроб = умножение с обратна дроб)", "3 × 2 = 6", "Резултат: 6"] },
          ],
          tip: "🔢 Десетични операции: подравни точките за събиране/изваждане, брой цифри за умножение.",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / GEOMETRIC-FIGURES ── */
    "mathematics-advanced/geometric-figures": {
      bg: {
        low: {
          title: "Геометрични фигури",
          explanation: "Геометричните фигури са форми, които видим в природата и в математиката. Основни фигури: триъгълник (3 страни), правоъгълник (4 страни, всички ъгли 90°), квадрат (4 равни страни, всички ъгли 90°), окръжност (кръгла форма). Правоъгълник е фигура с 4 страни, където противоположните страни са равни. Квадрат е специален правоъгълник, където всички 4 страни са равни.",
          examples: [
            { problem: "Колко страни има триъгълник?", solution: "3 страни", hint: "Триъгълник = 'три ъгъла' = 3 върха = 3 страни." },
            { problem: "Какво е разликата между квадрат и правоъгълник?", solution: "Квадратът има всички 4 страни равни. Правоъгълникът има само противоположните страни равни.", hint: "Квадратът е специален правоъгълник." },
            { problem: "Назови геометрични фигури, които видиш всеки ден.", solution: "Куче → триъгълник, врата → правоъгълник, чаша → цилиндър, монета → окръжност", hint: "Природата е пълна с геометрични форми!" },
          ],
          tip: "📐 Основни фигури: триъгълник (3), квадрат (4 равни), правоъгълник (4), окръжност (0 страни).",
        },
        high: {
          title: "Геометрични фигури (2D и 3D)",
          explanation: "2D фигури (плоски): триъгълник, квадрат, правоъгълник, паралелограм, ромб, трапец, многоъгълник, окръжност. 3D фигури (пространствени): куб, правоъгълен паралелепипед, триъгълна пирамида, прямоъгълна пирамида, цилиндър, сфера, конус. Всяка фигура има определени свойства: число на страни, ъгли, симетрия.",
          examples: [
            { problem: "Назови разликата между 2D и 3D фигура.", solution: "2D = плоска (квадрат, триъгълник). 3D = пространствена (куб, пирамида). 3D има височина, ширина и дълбочина.", hint: "2D = рисунка на хартия. 3D = обект, който можеш да поднесеш." },
            { problem: "Какви плоски фигури образуват куба?", solution: "6 квадрата", hint: "Кубът се състои от 6 квадратни лица." },
            { problem: "Назови триъгълник, който има два равни странични края.", solution: "Равнобедрен триъгълник", hint: "Равнобедрен = две равни страни. Равностранен = три равни страни." },
          ],
          tip: "🧊 3D фигури имат дълбочина — можеш да ги държиш в ръцете си!",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / PERIMETER-AREA ── */
    "mathematics-advanced/perimeter-area": {
      bg: {
        low: {
          title: "Периметър и лице",
          explanation: "Периметър е дължината около фигурата — сумата на всички страни. За квадрат със страна a: P = 4a. За правоъгълник: P = 2(дължина + ширина). Лице (площ) е колко място заема фигурата. За квадрат: A = a². За правоъгълник: A = дължина × ширина. За триъгълник: A = (основа × височина) ÷ 2.",
          examples: [
            { problem: "Намери периметъра на квадрат със страна 5 см.", solution: "P = 4 × 5 = 20 см", hint: "Всички 4 страни на квадрата са равни, значи събери 5+5+5+5 = 20" },
            { problem: "Намери лицето на правоъгълник с дължина 6 см и ширина 4 см.", solution: "A = 6 × 4 = 24 см²", hint: "Лице = дължина × ширина" },
            { problem: "Периметърът на правоъгълник е 20 см. Дължина е 6 см. Каква е ширина?", solution: "Ширина = 4 см", hint: "20 = 2(6 + ширина). 10 = 6 + ширина. Ширина = 4" },
          ],
          tip: "📏 Периметър = около фигурата (събери страни). Лице = вътрешното пространство (умножи).",
        },
        high: {
          title: "Периметър и лице (разширено)",
          explanation: "Периметър: P = сума на всички страни. За различни фигури се изчислява различно. Лице (площ): A = вътре в фигурата. Формули: квадрат A=a², правоъгълник A=l×w, триъгълник A=(b×h)÷2, паралелограм A=b×h, трапец A=((a+b)×h)÷2, окръжност A=πr². Мерни единици: периметър (м, см), лице (м², см², дм²).",
          examples: [
            { problem: "Намери лицето на триъгълник с основа 8 см и височина 5 см.", solution: "A = (8 × 5) ÷ 2 = 20 см²", hint: "Триъгълник = половин правоъгълник" },
            { problem: "Периметърът на квадрат е 24 см. Какво е лицето?", solution: "Страна = 6 см. Лице = 6² = 36 см²", hint: "P = 4a, значи a = 24÷4 = 6. Лице = a²" },
            { problem: "Намери лицето на паралелограм с основа 7 см и височина 4 см.", solution: "A = 7 × 4 = 28 см²", hint: "Паралелограм: лице = основа × височина (прилежаща на основата)" },
          ],
          tip: "📐 Височина винаги е перпендикулярна на основата, не е страната на фигурата!",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / PERCENTAGE-5GRADE ── */
    "mathematics-advanced/percentage-5grade": {
      bg: {
        low: {
          title: "Проценти",
          explanation: "Процент (%) показва част от 100. 1% = 1/100. Например, ако един клас има 20 ученика и 5 са момичета, то момичетата са 5÷20 = 1/4 = 0.25 = 25% от класа. Проценти използваме в магазинах (намаления), в училище (оценки), в здравеопазване (статистика). 50% = половина. 25% = четвърт. 100% = цяло.",
          examples: [
            { problem: "Какво е 50% от 40?", solution: "20", hint: "50% = половина. Половина от 40 е 20." },
            { problem: "Какво е 25% от 100?", solution: "25", hint: "25% = четвърт. Четвърт от 100 е 25." },
            { problem: "Ако пицата има 8 парчета и ти изяда 2, каква е это на процентах?", solution: "2÷8 = 1/4 = 25%", hint: "2 от 8 = 1/4 = 25%" },
          ],
          tip: "% = част от 100. 50% = половина, 25% = четвърт, 100% = цяло.",
        },
        high: {
          title: "Проценти (операции)",
          explanation: "Процент p от число n: (p/100) × n. Например: 20% от 50 = (20/100) × 50 = 10. За намаления: намалената цена = оригинална × (100% - процент намаление). За приращение: нова цена = оригинална × (100% + процент приращение). Процент от цяло: (част/цяло) × 100.",
          examples: [
            { problem: "Намери 30% от 200.", solution: "60", hint: "(30/100) × 200 = 0.3 × 200 = 60" },
            { problem: "Дреха струва 100 лева. След намаление от 20%, каква е новата цена?", solution: "80 лева", hint: "Намалена цена = 100 × (100-20)% = 100 × 80% = 100 × 0.8 = 80" },
            { problem: "Ако изяде 3 парчета от 12, каква част е това на проценти?", solution: "25%", hint: "(3÷12) × 100 = 0.25 × 100 = 25%" },
          ],
          tip: "💰 Намаления и приращения: използвай (100% - намаление)% или (100% + приращение)%.",
        },
      },
    },

    /* ── MATHEMATICS-ADVANCED / WORD-PROBLEMS-5GRADE ── */
    "mathematics-advanced/word-problems-5grade": {
      bg: {
        low: {
          title: "Текстови задачи",
          explanation: "Текстова задача е математическа задача, описана с думи. За решаване: прочети задачата внимателно, разбери какво питат, събери информацията (числа и отношения), напиши математическото съответствие (уравнение), реши, провери дали отговорът има смисъл. Текстовите задачи обучават практическо мислене и приложение на математиката.",
          examples: [
            { problem: "Мария има 5 ябълки. Баба й й дава още 3. Колко ябълки има сега?", solution: "5 + 3 = 8 ябълки", hint: "Събиране: начално количество + добавено количество." },
            { problem: "В магазина има 20 булки. Продадени са 7. Колко останаха?", solution: "20 - 7 = 13 булки", hint: "Изваждане: начално количество - продадено количество." },
            { problem: "Един триъгълник има страна 4 см, 5 см и 6 см. Какъв е периметърът?", solution: "4 + 5 + 6 = 15 см", hint: "Периметър = сума на всички страни." },
          ],
          tip: "📖 Текстова задача: прочети → разбери → напиши уравнение → реши → провери.",
        },
        high: {
          title: "Текстови задачи (многоетапни)",
          explanation: "Многоетапна текстова задача изисква няколко операции. Пример: 'Една книга струва 20 лева. За 3 книги има намаление от 10%. Колко трябва да платиш?' Решение: 1) 3 × 20 = 60 лева (всички без намаление). 2) 60 × 10% = 6 лева (намаление). 3) 60 - 6 = 54 лева (финална цена).",
          examples: [
            { problem: "Във фабрика са произведени 300 чаши. 10% са счупени. Колко чаши остават?", solution: "10% от 300 = 30 счупени. 300 - 30 = 270 чаши остават.", hint: "1) Намери 10% от 300. 2) Извади от началното число." },
            { problem: "Цена на платно е 50 лева. След две повишения от по 10%, каква е новата цена?", solution: "50 × 1.1 × 1.1 = 60.5 лева", hint: "Всяко повишение: умножи по 1.1 (100% + 10%)" },
            { problem: "Поле е дълго 80 м и широко 60 м. Земеделец наежда 1/4 от него. Какво лице е наежано?", solution: "Лице = 80 × 60 = 4800 м². Наежано = 4800 × 1/4 = 1200 м²", hint: "1) Намери цялото лице. 2) Намери 1/4 от лицето." },
          ],
          tip: "🔗 Многоетапни: раздели на по-малки стъпки, реши всяка поотделно.",
        },
      },
    },

    /* ── NATURAL-SCIENCE / WATER-AIR ── */
    "natural-science/water-air": {
      en: {
        low: {
          title: "Water and Air",
          explanation: "Water (вода) is essential for all life. It exists in 3 states: solid (ice), liquid (water), gas (steam/water vapour). Air is all around us — we cannot see it, but we can feel the wind. Air is a mixture of gases: mostly nitrogen (78%) and oxygen (21%). We need oxygen to breathe. Plants need carbon dioxide (CO₂) and release oxygen through photosynthesis.",
          examples: [
            { problem: "Name the 3 states of water.", solution: "Solid (ice/snow), Liquid (water), Gas (steam/water vapour). Water changes state when heated or cooled.", hint: "Cold → water freezes to ice. Hot → water evaporates to steam." },
            { problem: "What gas do we need to breathe?", solution: "Oxygen (O₂) — our lungs take in oxygen from the air and release carbon dioxide (CO₂).", hint: "We breathe IN oxygen, breathe OUT carbon dioxide." },
            { problem: "How can you prove that air exists even though you can't see it?", solution: "Feel wind on your face. Blow up a balloon — air fills it. Wave a piece of paper — you feel the air moving.", hint: "Air is invisible but has mass and takes up space." },
          ],
          tip: "💧 Water is the only natural substance that exists in all 3 states (solid, liquid, gas) in everyday conditions on Earth!",
        },
        high: {
          title: "The Properties of Water and Air",
          explanation: "Water is a polar molecule (H₂O) — it dissolves many substances, which is why it is called 'the universal solvent'. The water cycle: evaporation → condensation → precipitation → collection. Air pressure: the weight of air pressing down. At higher altitude, air pressure is lower (less air above) — that's why mountain climbers need extra oxygen. Air pollution harms health and the environment.",
          examples: [
            { problem: "What is the water cycle? Name its 4 stages.", solution: "1. Evaporation: water → vapour (heated by the Sun). 2. Condensation: vapour cools → clouds form. 3. Precipitation: rain/snow falls. 4. Collection: water collects in rivers, lakes, seas.", hint: "Sun heats water → cloud → rain → river → sea → repeats forever." },
            { problem: "Why do we need to keep water clean?", solution: "Polluted water spreads diseases, kills aquatic life, and is unsafe to drink. Clean water is essential for human health, farming, and all living things.", hint: "Think: what happens if the water in rivers is full of chemicals or rubbish?" },
            { problem: "What is air made of?", solution: "Nitrogen (78%), Oxygen (21%), Argon (~1%), Carbon dioxide (0.04%), plus small amounts of other gases.", hint: "78% nitrogen, 21% oxygen — remember: more N than O in air!" },
          ],
          tip: "🌊 70% of Earth's surface is covered by water — yet only 3% is fresh water, and most of that is frozen. Protect it!",
        },
      },
      bg: {
        low: {
          title: "Вода и въздух",
          explanation: "Водата е необходима за целия живот. Тя съществува в 3 състояния: твърдо (лед), течно (вода), газообразно (пара). Въздухът е навсякъде около нас — не го виждаме, но усещаме вятъра. Въздухът е смес от газове: предимно азот (78%) и кислород (21%). Нуждаем се от кислород за дишане. Растенията се нуждаят от въглероден диоксид и отделят кислород чрез фотосинтеза.",
          examples: [
            { problem: "Назови 3-те агрегатни състояния на водата.", solution: "Твърдо (лед/сняг), Течно (вода), Газообразно (водна пара). Водата сменя агрегатното си състояние при нагряване или охлаждане.", hint: "Студено → водата замръзва в лед. Горещо → водата се изпарява в пара." },
            { problem: "Какъв газ ни е необходим за дишане?", solution: "Кислород (O₂) — белите ни дробове поемат кислород от въздуха и отделят въглероден диоксид (CO₂).", hint: "Вдишваме кислород, издишваме въглероден диоксид." },
            { problem: "Как можеш да докажеш, че въздухът съществува, макар да не го виждаш?", solution: "Усети вятъра на лицето си. Надуй балон — въздухът го изпълва. Размаши лист хартия — усещаш как въздухът се движи.", hint: "Въздухът е невидим, но има маса и заема пространство." },
          ],
          tip: "💧 Водата е единственото природно вещество, което на Земята се среща и в трите агрегатни състояния при обикновени условия!",
        },
        high: {
          title: "Свойства на водата и въздуха",
          explanation: "Водата е полярна молекула (H₂O) — разтваря много вещества, затова се нарича 'универсален разтворител'. Водният цикъл: изпарение → кондензация → валеж → събиране. Атмосферното налягане: тежестта на въздуха, натискаща надолу. На по-голяма надморска височина налягането е по-ниско — затова алпинистите се нуждаят от допълнителен кислород.",
          examples: [
            { problem: "Какво е водният цикъл? Назови 4-те му етапа.", solution: "1. Изпарение: вода → пара (нагрята от Слънцето). 2. Кондензация: парата се охлажда → образуват се облаци. 3. Валеж: пада дъжд или сняг. 4. Събиране: водата се стича в реки, езера, морета.", hint: "Слънцето загрява водата → облак → дъжд → река → море → повтаря се вечно." },
            { problem: "Защо трябва да пазим водата чиста?", solution: "Замърсената вода разпространява болести, убива водни организми и е опасна за пиене. Чистата вода е необходима за здравето на хората, земеделието и всички живи организми.", hint: "Помисли: какво се случва, ако водата в реките е пълна с химикали или боклуци?" },
            { problem: "От какво е съставен въздухът?", solution: "Азот (78%), Кислород (21%), Аргон (~1%), Въглероден диоксид (0,04%), плюс малко количество от други газове.", hint: "78% азот, 21% кислород — запомни: повече N от O в атмосферата!" },
          ],
          tip: "🌊 70% от повърхността на Земята е покрита с вода — но само 3% е прясна вода, и голяма част от нея е замръзнала. Пазете я!",
        },
      },
      es: {
        low: {
          title: "Agua y aire",
          explanation: "El agua es esencial para toda la vida. Existe en 3 estados: sólido (hielo), líquido (agua), gas (vapor). El aire está a nuestro alrededor — no podemos verlo, pero podemos sentir el viento. El aire es una mezcla de gases: principalmente nitrógeno (78%) y oxígeno (21%). Necesitamos oxígeno para respirar.",
          examples: [
            { problem: "Nombra los 3 estados del agua.", solution: "Sólido (hielo/nieve), Líquido (agua), Gas (vapor de agua). El agua cambia de estado cuando se calienta o enfría.", hint: "Frío → el agua se congela en hielo. Caliente → el agua se evapora en vapor." },
            { problem: "¿Qué gas necesitamos para respirar?", solution: "Oxígeno (O₂) — nuestros pulmones inhalan oxígeno del aire y exhalan dióxido de carbono (CO₂).", hint: "Inhalamos oxígeno, exhalamos dióxido de carbono." },
            { problem: "¿Cómo puedes demostrar que el aire existe aunque no puedas verlo?", solution: "Siente el viento en tu cara. Infla un globo — el aire lo llena. Agita un papel — sientes el aire moverse.", hint: "El aire es invisible pero tiene masa y ocupa espacio." },
          ],
          tip: "💧 ¡El agua es la única sustancia natural que existe en los 3 estados (sólido, líquido, gas) en condiciones normales en la Tierra!",
        },
        high: {
          title: "Propiedades del agua y el aire",
          explanation: "El agua es una molécula polar (H₂O) — disuelve muchas sustancias, por eso se llama 'solvente universal'. El ciclo del agua: evaporación → condensación → precipitación → recogida. La presión del aire: el peso del aire que empuja hacia abajo. A mayor altitud, menor presión.",
          examples: [
            { problem: "¿Qué es el ciclo del agua? Nombra sus 4 etapas.", solution: "1. Evaporación. 2. Condensación: nubes. 3. Precipitación: lluvia/nieve. 4. Recogida: ríos, lagos, mares.", hint: "Sol calienta agua → nube → lluvia → río → mar → se repite." },
            { problem: "¿Por qué necesitamos mantener el agua limpia?", solution: "El agua contaminada propaga enfermedades, mata organismos acuáticos y es peligrosa para beber. El agua limpia es esencial para la salud humana.", hint: "Piensa: ¿qué pasa si el agua de los ríos está llena de químicos?" },
            { problem: "¿De qué está compuesto el aire?", solution: "Nitrógeno (78%), Oxígeno (21%), Argón (~1%), Dióxido de carbono (0,04%), más pequeñas cantidades de otros gases.", hint: "78% nitrógeno, 21% oxígeno." },
          ],
          tip: "🌊 ¡El 70% de la superficie de la Tierra está cubierta de agua, pero solo el 3% es agua dulce, y gran parte está congelada. ¡Protégela!",
        },
      },
    },

    /* ── NATURAL-SCIENCE / HUMAN-BODY ── */
    "natural-science/human-body": {
      en: {
        low: {
          title: "My Body and Health",
          explanation: "Our body has many parts that work together. The skeleton (bones) gives us shape and protects organs. Muscles help us move. The heart pumps blood. The lungs breathe air. The brain controls everything. Healthy habits keep our body strong: eat vegetables and fruit, drink water, sleep 8-10 hours, exercise, wash hands.",
          examples: [
            { problem: "What does the heart do?", solution: "The heart pumps blood around the body. Blood carries oxygen and nutrients to all organs and removes waste.", hint: "Think of the heart as a pump — it never stops working!" },
            { problem: "Name 3 healthy habits.", solution: "Eating fruits and vegetables, drinking enough water, getting 8-10 hours of sleep, exercising, washing hands, brushing teeth.", hint: "Healthy habits keep your body and mind strong." },
            { problem: "What are bones for?", solution: "Bones make up the skeleton — they give our body its shape, protect organs (skull protects brain, ribs protect lungs and heart), and help us move.", hint: "Without bones we would be like a bag of skin." },
          ],
          tip: "💪 Your body is amazing — it has over 200 bones and 600 muscles working together every second!",
        },
        high: {
          title: "Body Systems and Health",
          explanation: "The human body has systems that work together. Skeletal system: 206 bones give shape and protect organs. Muscular system: 600+ muscles enable movement. Circulatory system: heart + blood vessels carry blood. Respiratory system: lungs take in O₂ and expel CO₂. Digestive system: breaks food into nutrients. Nervous system: brain and nerves control everything.",
          examples: [
            { problem: "Name 3 body systems and their functions.", solution: "1. Circulatory: heart pumps blood carrying O₂ and nutrients. 2. Respiratory: lungs breathe in O₂, breathe out CO₂. 3. Digestive: stomach and intestines break down food into nutrients the body can use.", hint: "Each system has a job. Together they keep you alive and healthy." },
            { problem: "What happens to food in the digestive system?", solution: "Food is chewed and mixed with saliva (mouth) → travels to stomach → stomach acids break it down → small intestine absorbs nutrients → large intestine absorbs water → waste is excreted.", hint: "Follow the path: mouth → stomach → intestines → exit." },
            { problem: "Why is physical exercise important for the body?", solution: "Exercise strengthens muscles and bones, improves heart and lung function, releases chemicals that improve mood, and helps maintain a healthy weight.", hint: "Exercise = stronger heart, stronger muscles, better mood." },
          ],
          tip: "🧠 Your brain uses 20% of your body's energy even though it makes up only 2% of your weight — feed it well with sleep and learning!",
        },
      },
      bg: {
        low: {
          title: "Тялото ми и здравето",
          explanation: "Нашето тяло има много части, работещи заедно. Скелетът (костите) ни дава форма и предпазва органите. Мускулите ни помагат да се движим. Сърцето изпомпва кръвта. Белите дробове дишат въздух. Мозъкът управлява всичко. Здравите навици пазят тялото ни силно: яж зеленчуци и плодове, пий вода, спи 8-10 часа, спортувай, мий ръцете си.",
          examples: [
            { problem: "Какво прави сърцето?", solution: "Сърцето изпомпва кръв из цялото тяло. Кръвта пренася кислород и хранителни вещества до всички органи и извежда отпадъците.", hint: "Мисли за сърцето като за помпа — то никога не спира да работи!" },
            { problem: "Назови 3 здравни навика.", solution: "Да ядем плодове и зеленчуци, да пием достатъчно вода, да спим 8-10 часа, да спортуваме, да мием ръцете си, да мием зъбите си.", hint: "Здравните навици пазят тялото и ума ти силни." },
            { problem: "За какво са костите?", solution: "Костите изграждат скелета — те дават форма на тялото, предпазват органите (черепът защитава мозъка, ребрата защитават белите дробове и сърцето) и ни помагат да се движим.", hint: "Без кости щяхме да сме като торба от кожа." },
          ],
          tip: "💪 Тялото ти е невероятно — има над 200 кости и 600 мускула, работещи заедно всяка секунда!",
        },
        high: {
          title: "Телесни системи и здраве",
          explanation: "Човешкото тяло има системи, работещи заедно. Опорно-двигателна система: 206 кости дават форма и предпазват органи. Мускулна система: 600+ мускула осигуряват движение. Кръвоносна система: сърце + кръвоносни съдове пренасят кръвта. Дихателна система: белите дробове поемат O₂ и отделят CO₂. Храносмилателна система: разгражда храната на хранителни вещества. Нервна система: мозъкът и нервите управляват всичко.",
          examples: [
            { problem: "Назови 3 телесни системи и функциите им.", solution: "1. Кръвоносна: сърцето изпомпва кръв, пренасяща O₂ и хранителни вещества. 2. Дихателна: белите дробове вдишват O₂, издишват CO₂. 3. Храносмилателна: стомахът и червата разграждат храната на полезни вещества.", hint: "Всяка система има задача. Заедно те пазят живота ти." },
            { problem: "Какво се случва с храната в храносмилателната система?", solution: "Храната се сдъвква и смесва со слюнка (уста) → преминава в стомаха → стомашните киселини я разграждат → тънкото черво всмуква хранителните вещества → дебелото черво всмуква водата → отпадъците се извеждат навън.", hint: "Следвай пътя: уста → стомах → черва → изход." },
            { problem: "Защо физическото упражнение е важно за тялото?", solution: "Упражнението укрепва мускулите и костите, подобрява функцията на сърцето и белите дробове, отделя химикали, подобряващи настроението, и помага да се поддържа здравословно тегло.", hint: "Спорт = по-силно сърце, по-силни мускули, по-добро настроение." },
          ],
          tip: "🧠 Мозъкът ти използва 20% от енергията на тялото, въпреки че съставлява само 2% от теглото ти — хранете го добре чрез сън и учене!",
        },
      },
      es: {
        low: {
          title: "Mi cuerpo y la salud",
          explanation: "Nuestro cuerpo tiene muchas partes que trabajan juntas. El esqueleto (huesos) nos da forma y protege los órganos. Los músculos nos ayudan a movernos. El corazón bombea sangre. Los pulmones respiran aire. El cerebro controla todo. Los hábitos saludables mantienen nuestro cuerpo fuerte.",
          examples: [
            { problem: "¿Qué hace el corazón?", solution: "El corazón bombea sangre por todo el cuerpo. La sangre lleva oxígeno y nutrientes a todos los órganos y elimina los desechos.", hint: "Piensa en el corazón como una bomba — ¡nunca deja de trabajar!" },
            { problem: "Nombra 3 hábitos saludables.", solution: "Comer frutas y verduras, beber suficiente agua, dormir 8-10 horas, hacer ejercicio, lavarse las manos, cepillarse los dientes.", hint: "Los hábitos saludables mantienen tu cuerpo y mente fuertes." },
            { problem: "¿Para qué sirven los huesos?", solution: "Los huesos forman el esqueleto — dan forma al cuerpo, protegen órganos y nos ayudan a movernos.", hint: "Sin huesos seríamos como una bolsa de piel." },
          ],
          tip: "💪 ¡Tu cuerpo es increíble — tiene más de 200 huesos y 600 músculos trabajando juntos cada segundo!",
        },
        high: {
          title: "Sistemas del cuerpo y salud",
          explanation: "El cuerpo humano tiene sistemas que trabajan juntos. Sistema esquelético: 206 huesos. Sistema muscular: 600+ músculos. Sistema circulatorio: corazón + vasos sanguíneos. Sistema respiratorio: pulmones. Sistema digestivo: descompone los alimentos. Sistema nervioso: cerebro y nervios.",
          examples: [
            { problem: "Nombra 3 sistemas corporales y sus funciones.", solution: "1. Circulatorio: el corazón bombea sangre con O₂ y nutrientes. 2. Respiratorio: los pulmones inhalan O₂, exhalan CO₂. 3. Digestivo: el estómago e intestinos descomponen los alimentos.", hint: "Cada sistema tiene una función. Juntos te mantienen vivo y sano." },
            { problem: "¿Qué le sucede a la comida en el sistema digestivo?", solution: "La comida se mastica y mezcla con saliva (boca) → viaja al estómago → ácidos estomacales la descomponen → el intestino delgado absorbe nutrientes → el intestino grueso absorbe agua → los desechos se excretan.", hint: "Sigue el camino: boca → estómago → intestinos → salida." },
            { problem: "¿Por qué el ejercicio físico es importante para el cuerpo?", solution: "El ejercicio fortalece músculos y huesos, mejora el funcionamiento del corazón y pulmones, libera sustancias que mejoran el estado de ánimo y ayuda a mantener un peso saludable.", hint: "Ejercicio = corazón más fuerte, músculos más fuertes, mejor humor." },
          ],
          tip: "🧠 ¡Tu cerebro usa el 20% de la energía de tu cuerpo aunque solo representa el 2% de tu peso — aliméntalo bien con sueño y aprendizaje!",
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
    seasons: {
      en: [
        { question: "Name the 4 seasons in order starting from spring.", answer: "Spring, Summer, Autumn, Winter" },
        { question: "In which season do leaves fall from trees?", answer: "Autumn" },
        { question: "Which is the hottest season?", answer: "Summer" },
        { question: "Which is the coldest season?", answer: "Winter" },
        { question: "In which season do flowers bloom and birds return?", answer: "Spring" },
      ],
      bg: [
        { question: "Назови 4-те сезона по ред, като започнеш от пролетта.", answer: "Пролет, Лято, Есен, Зима" },
        { question: "Кое годишно време е листопадът?", answer: "Есен" },
        { question: "Кое е най-горещото годишно време?", answer: "Лято" },
        { question: "Кое е най-студеното годишно време?", answer: "Зима" },
        { question: "Кое годишно време носи цъфтежа и завръщането на птиците?", answer: "Пролет" },
      ],
      es: [
        { question: "Nombra las 4 estaciones en orden empezando por la primavera.", answer: "Primavera, Verano, Otoño, Invierno" },
        { question: "¿En qué estación caen las hojas?", answer: "Otoño" },
        { question: "¿Cuál es la estación más caliente?", answer: "Verano" },
        { question: "¿Cuál es la estación más fría?", answer: "Invierno" },
        { question: "¿En qué estación florecen las flores y vuelven las aves?", answer: "Primavera" },
      ],
    },
    weather: {
      en: [
        { question: "What tool is used to measure temperature?", answer: "thermometer" },
        { question: "Name 2 types of weather.", answer: "Any 2: sunny, rainy, snowy, windy, cloudy, foggy, stormy" },
        { question: "What is the difference between weather and climate?", answer: "Weather = today. Climate = average over many years." },
        { question: "What is the unit for measuring temperature?", answer: "degrees Celsius (°C)" },
        { question: "Name a natural light source used to predict weather.", answer: "Sun — if you can't see it, it may be cloudy or about to rain" },
      ],
      bg: [
        { question: "С какъв инструмент се измерва температурата?", answer: "термометър" },
        { question: "Назови 2 вида времето.", answer: "Всеки 2: слънчево, дъждовно, снежно, ветровито, облачно, мъгливо, бурно" },
        { question: "Каква е разликата между времето и климата?", answer: "Времето = днес. Климатът = средното за много години." },
        { question: "В какви единици се измерва температурата?", answer: "градуси по Целзий (°C)" },
        { question: "От какво се образуват облаците?", answer: "от водна пара, която се охлажда и кондензира" },
      ],
      es: [
        { question: "¿Qué herramienta se usa para medir la temperatura?", answer: "termómetro" },
        { question: "Nombra 2 tipos de tiempo.", answer: "Cualquier 2: soleado, lluvioso, nevado, ventoso, nublado, brumoso, tormentoso" },
        { question: "¿Cuál es la diferencia entre tiempo y clima?", answer: "Tiempo = hoy. Clima = promedio durante muchos años." },
        { question: "¿En qué unidad se mide la temperatura?", answer: "grados Celsius (°C)" },
        { question: "¿De qué se forman las nubes?", answer: "de vapor de agua que se enfría y condensa" },
      ],
    },
    comparison: {
      en: [
        { question: "Which is bigger: a mouse or an elephant?", answer: "an elephant" },
        { question: "Complete: 'A cat is __ than a dog.' (size usually)", answer: "smaller" },
        { question: "Name a word used to compare 2 things.", answer: "bigger, smaller, faster, heavier, taller (etc.)" },
        { question: "A car and a bicycle — which is faster?", answer: "a car" },
        { question: "10 is __ than 5.", answer: "greater (more)" },
      ],
      bg: [
        { question: "Кое е по-голямо: мишка или слон?", answer: "слон" },
        { question: "Попълни: 'Котката е __ от кучето.' (по размер обикновено)", answer: "по-малка" },
        { question: "Назови дума, използвана за сравнение на 2 неща.", answer: "по-голям, по-малък, по-бърз, по-тежък, по-висок (и т.н.)" },
        { question: "Кола и велосипед — кое е по-бързо?", answer: "колата" },
        { question: "10 е __ от 5.", answer: "по-голямо (повече)" },
      ],
      es: [
        { question: "¿Cuál es más grande: un ratón o un elefante?", answer: "un elefante" },
        { question: "Completa: 'Un gato es __ que un perro.' (de tamaño generalmente)", answer: "más pequeño" },
        { question: "Nombra una palabra usada para comparar 2 cosas.", answer: "más grande, más pequeño, más rápido, más pesado (etc.)" },
        { question: "Un coche y una bicicleta — ¿cuál es más rápido?", answer: "un coche" },
        { question: "10 es __ que 5.", answer: "mayor (más)" },
      ],
    },
    sequencing: {
      en: [
        { question: "What word means 'at the beginning of the sequence'?", answer: "first / firstly" },
        { question: "What word means 'at the end of the sequence'?", answer: "finally / last / at last" },
        { question: "Put in order: B) Wash apple. A) Pick up apple. C) Eat apple.", answer: "A → B → C" },
        { question: "What is a sequence?", answer: "events or steps in a specific order from first to last" },
        { question: "Name a sequence word between 'first' and 'finally'.", answer: "then / next / after that" },
      ],
      bg: [
        { question: "Коя дума означава 'в началото на наредбата'?", answer: "първо" },
        { question: "Коя дума означава 'в края на наредбата'?", answer: "накрая" },
        { question: "Наредете: Б) Мие ябълката. А) Взима ябълката. В) Изяжда ябълката.", answer: "А → Б → В" },
        { question: "Какво е наредба?", answer: "събития или стъпки в определен ред от първото до последното" },
        { question: "Назови дума за наредба между 'първо' и 'накрая'.", answer: "после / след това" },
      ],
      es: [
        { question: "¿Qué palabra significa 'al principio de la secuencia'?", answer: "primero / en primer lugar" },
        { question: "¿Qué palabra significa 'al final de la secuencia'?", answer: "finalmente / por último" },
        { question: "Ordena: B) Lavar la manzana. A) Agarrar la manzana. C) Comer la manzana.", answer: "A → B → C" },
        { question: "¿Qué es una secuencia?", answer: "eventos o pasos en un orden específico de primero a último" },
        { question: "Nombra una palabra de secuencia entre 'primero' y 'finalmente'.", answer: "luego / después / a continuación" },
      ],
    },
    "family-community": {
      en: [
        { question: "Name 3 members of a family.", answer: "mother, father, sibling, grandparent, aunt, uncle (any 3)" },
        { question: "Name 2 community helpers and what they do.", answer: "Teacher — teaches. Doctor — heals. Firefighter — puts out fires. Police — keeps people safe. (any 2)" },
        { question: "What do we call the group of people living in the same town?", answer: "community" },
        { question: "Name 2 responsibilities a child has at home.", answer: "tidying room, helping with dishes, feeding pets, doing homework (any 2)" },
        { question: "Why do communities need rules?", answer: "to help people live safely and fairly together" },
      ],
      bg: [
        { question: "Назови 3 члена на семейство.", answer: "майка, татко, брат/сестра, баба, дядо, леля, чичо (всеки 3)" },
        { question: "Назови 2 помощника в обществото и какво правят.", answer: "Учителят — учи. Лекарят — лекува. Пожарникарят — гаси пожари. (всеки 2)" },
        { question: "Как се казват хората, живеещи в едно населено място?", answer: "общност / общество" },
        { question: "Назови 2 задължения на детето у дома.", answer: "да нарежда стаята, да помага при съдовете, да храни домашния любимец (всеки 2)" },
        { question: "Защо обществото се нуждае от правила?", answer: "за да живеят хората заедно безопасно и справедливо" },
      ],
      es: [
        { question: "Nombra 3 miembros de una familia.", answer: "madre, padre, hermano/a, abuelo, abuela, tía, tío (cualquier 3)" },
        { question: "Nombra 2 ayudantes de la comunidad y qué hacen.", answer: "Maestro — enseña. Doctor — cura. Bombero — apaga incendios. (cualquier 2)" },
        { question: "¿Cómo se llama el grupo de personas que viven en el mismo pueblo?", answer: "comunidad" },
        { question: "Nombra 2 responsabilidades de un niño en casa.", answer: "ordenar la habitación, ayudar con los platos, alimentar mascotas (cualquier 2)" },
        { question: "¿Por qué las comunidades necesitan reglas?", answer: "para ayudar a las personas a vivir juntas de forma segura y justa" },
      ],
    },
    "my-homeland": {
      en: [
        { question: "What is the difference between a city and a village?", answer: "City = large, many people, more buildings. Village = small, fewer people, more nature." },
        { question: "What is a municipality?", answer: "An area managed by a local government, headed by a mayor." },
        { question: "What is a landmark? Give 1 example.", answer: "A famous feature of a place. Example: Rila Monastery, Eiffel Tower, Big Ben." },
        { question: "Name the 3 main terrain types in Bulgaria.", answer: "Mountains, plains/valleys, and the Black Sea coast." },
        { question: "What do we call the region where you were born?", answer: "hometown / birthplace / родно място (in Bulgarian)" },
      ],
      bg: [
        { question: "Каква е разликата между град и село?", answer: "Градът е голям, с много хора и сгради. Селото е малко, с по-малко хора и повече природа." },
        { question: "Какво е община?", answer: "Административна единица, управлявана от местно самоуправление, начело с кмет." },
        { question: "Какво е забележителност? Дай 1 пример.", answer: "Известен обект на дадено място. Пример: Рилски манастир, Стари Несебър." },
        { question: "Назови 3-те основни вида релеф в България.", answer: "Планини, равнини/долини и Черноморско крайбрежие." },
        { question: "Как се казва областта, в която си роден?", answer: "родно място / роден край" },
      ],
      es: [
        { question: "¿Cuál es la diferencia entre una ciudad y un pueblo?", answer: "Ciudad = grande, mucha gente, más edificios. Pueblo = pequeño, menos gente, más naturaleza." },
        { question: "¿Qué es un municipio?", answer: "Un área gestionada por un gobierno local, encabezado por un alcalde." },
        { question: "¿Qué es un punto de referencia? Da 1 ejemplo.", answer: "Un lugar famoso de un sitio. Ejemplo: Monasterio de Rila, Torre Eiffel." },
        { question: "Nombra los 3 tipos principales de terreno en Bulgaria.", answer: "Montañas, llanuras/valles y la costa del Mar Negro." },
        { question: "¿Cómo se llama la región donde naciste?", answer: "ciudad natal / lugar de nacimiento" },
      ],
    },
    bulgaria: {
      en: [
        { question: "What is the capital of Bulgaria?", answer: "Sofia" },
        { question: "Name the 3 colors of the Bulgarian flag in order (top to bottom).", answer: "White, Green, Red" },
        { question: "When was Bulgaria founded and by whom?", answer: "681 AD by Khan Asparuh" },
        { question: "Who created the Cyrillic alphabet?", answer: "Saints Cyril and Methodius and their disciples" },
        { question: "What is the national holiday of Bulgaria?", answer: "3 March — Liberation Day (Day of Liberation from Ottoman rule)" },
      ],
      bg: [
        { question: "Коя е столицата на България?", answer: "София" },
        { question: "Назови 3-те цвята на българския флаг по ред (от горе надолу).", answer: "Бяло, Зелено, Червено" },
        { question: "Кога е основана България и от кого?", answer: "681 г. от хан Аспарух" },
        { question: "Кой е създал кирилицата?", answer: "Св. Кирил и Методий и техните ученици" },
        { question: "Кой е националният празник на България?", answer: "3 март — Ден на Освобождението" },
      ],
      es: [
        { question: "¿Cuál es la capital de Bulgaria?", answer: "Sofía" },
        { question: "Nombra los 3 colores de la bandera búlgara en orden (de arriba abajo).", answer: "Blanco, Verde, Rojo" },
        { question: "¿Cuándo fue fundada Bulgaria y por quién?", answer: "681 d.C. por el Khan Asparuh" },
        { question: "¿Quién creó el alfabeto cirílico?", answer: "Los Santos Cirilo y Metodio y sus discípulos" },
        { question: "¿Cuál es el día festivo nacional de Bulgaria?", answer: "3 de marzo — Día de la Liberación" },
      ],
    },
    "rights-duties": {
      en: [
        { question: "Name 2 rights every child has.", answer: "Right to education, to play, to be safe, to have food and shelter (any 2)" },
        { question: "Name 2 duties a child has at school.", answer: "Attend school, listen to the teacher, do homework, follow rules, be kind (any 2)" },
        { question: "Why do we have traffic rules?", answer: "To keep everyone safe — drivers, cyclists and pedestrians." },
        { question: "What does 'duty' mean?", answer: "Something you are responsible to do." },
        { question: "What is the name of the UN agreement on children's rights?", answer: "UN Convention on the Rights of the Child (1989)" },
      ],
      bg: [
        { question: "Назови 2 права, на които има право всяко дете.", answer: "Право на образование, на игра, на безопасност, на дом, на храна (всеки 2)" },
        { question: "Назови 2 задължения на ученика в училище.", answer: "Да ходи на училище, да слуша учителя, да пише домашното, да спазва правилата (всеки 2)" },
        { question: "Защо имаме правила за движение по пътя?", answer: "За да са в безопасност всички — шофьори, колоездачи и пешеходци." },
        { question: "Какво означава 'задължение'?", answer: "Нещо, за което си отговорен да го направиш." },
        { question: "Как се казва международният документ за правата на детето?", answer: "Конвенция на ООН за правата на детето (1989 г.)" },
      ],
      es: [
        { question: "Nombra 2 derechos que tiene todo niño.", answer: "Derecho a la educación, al juego, a la seguridad, a tener comida y hogar (cualquier 2)" },
        { question: "Nombra 2 deberes de un niño en la escuela.", answer: "Asistir a la escuela, escuchar al maestro, hacer la tarea, seguir las reglas (cualquier 2)" },
        { question: "¿Por qué tenemos reglas de tráfico?", answer: "Para mantener a todos seguros — conductores, ciclistas y peatones." },
        { question: "¿Qué significa 'deber'?", answer: "Algo de lo que eres responsable de hacer." },
        { question: "¿Cómo se llama el acuerdo de la ONU sobre los derechos del niño?", answer: "Convención de la ONU sobre los Derechos del Niño (1989)" },
      ],
    },
    traditions: {
      en: [
        { question: "When is Baba Marta Day and what do we give?", answer: "1 March — we give red-and-white martenitsi for health and spring." },
        { question: "When is Bulgarian Liberation Day?", answer: "3 March — liberation from Ottoman rule in 1878." },
        { question: "What do Bulgarians do on Christmas Eve?", answer: "They gather for a meatless dinner with an odd number of dishes." },
        { question: "What are Kukeri?", answer: "Men dressed in scary costumes with bells who chase away evil spirits in late winter." },
        { question: "What is Nestinarstvo?", answer: "A ritual from Strandzha where people dance on hot coals — recognized by UNESCO." },
      ],
      bg: [
        { question: "Кога е Баба Марта и какво даваме?", answer: "1 март — даваме червено-бели мартеници за здраве и пролет." },
        { question: "Кога е Денят на Освобождението на България?", answer: "3 март — освобождение от османско владичество през 1878 г." },
        { question: "Какво правят българите на Бъдни вечер?", answer: "Събират се за постна вечеря с нечетен брой ястия." },
        { question: "Какво са кукерите?", answer: "Мъже с наплашващи костюми и камбани, прогонващи злите духове в края на зимата." },
        { question: "Какво е нестинарство?", answer: "Ритуал от Странджа, при който хора танцуват върху горещи въглени — признат от ЮНЕСКО." },
      ],
      es: [
        { question: "¿Cuándo es el Día de Baba Marta y qué se da?", answer: "1 de marzo — se dan martenitsas rojas y blancas para la salud y la primavera." },
        { question: "¿Cuándo es el Día de la Liberación de Bulgaria?", answer: "3 de marzo — liberación del dominio otomano en 1878." },
        { question: "¿Qué hacen los búlgaros en Nochebuena?", answer: "Se reúnen para una cena sin carne con un número impar de platos." },
        { question: "¿Qué son los Kukeri?", answer: "Hombres disfrazados con trajes aterradores y campanas que ahuyentan espíritus malignos a finales del invierno." },
        { question: "¿Qué es Nestinarstvo?", answer: "Un ritual de Strandja donde la gente baila sobre brasas ardientes — reconocido por la UNESCO." },
      ],
    },
    "living-things": {
      en: [
        { question: "Name 3 signs that something is alive.", answer: "Moves, breathes, eats, grows, reproduces, feels, excretes — any 3" },
        { question: "Is a rock a living thing?", answer: "No — it does not grow, breathe, eat, or reproduce." },
        { question: "Name 2 things all living things need.", answer: "Food/energy and water (also: air/oxygen for most)" },
        { question: "What process do plants use to make their own food?", answer: "Photosynthesis" },
        { question: "Name 3 kingdoms of living things.", answer: "Animals, Plants, Fungi (also: Bacteria, Protists)" },
      ],
      bg: [
        { question: "Назови 3 признака, че нещо е живо.", answer: "Движи се, диша, храни се, расте, размножава се, чувства, отделя — всеки 3" },
        { question: "Камъкът жив ли е?", answer: "Не — не расте, не диша, не се храни и не се размножава." },
        { question: "Назови 2 неща, от които се нуждаят всички живи организми.", answer: "Храна/енергия и вода (също: въздух/кислород за повечето)" },
        { question: "Какъв процес използват растенията, за да правят сами храна?", answer: "Фотосинтеза" },
        { question: "Назови 3 царства на живите организми.", answer: "Животни, Растения, Гъби (и: Бактерии, Протисти)" },
      ],
      es: [
        { question: "Nombra 3 signos de que algo está vivo.", answer: "Se mueve, respira, come, crece, se reproduce, siente, excreta — cualquier 3" },
        { question: "¿Es una piedra un ser vivo?", answer: "No — no crece, no respira, no come ni se reproduce." },
        { question: "Nombra 2 cosas que necesitan todos los seres vivos.", answer: "Comida/energía y agua (también: aire/oxígeno para la mayoría)" },
        { question: "¿Qué proceso usan las plantas para producir su propio alimento?", answer: "Fotosíntesis" },
        { question: "Nombra 3 reinos de los seres vivos.", answer: "Animales, Plantas, Hongos (también: Bacterias, Protistas)" },
      ],
    },
    materials: {
      en: [
        { question: "Name 2 properties used to describe materials.", answer: "Hard/soft, rough/smooth, transparent/opaque, flexible/rigid, heavy/light (any 2)" },
        { question: "Is wood natural or synthetic?", answer: "Natural — it comes from trees." },
        { question: "Why is rubber used for tyres?", answer: "It is flexible, waterproof, and durable." },
        { question: "Name a material that conducts electricity.", answer: "Copper, aluminium, iron — metals generally conduct electricity." },
        { question: "Name a material that does NOT conduct electricity.", answer: "Rubber, plastic, wood, glass — insulators." },
      ],
      bg: [
        { question: "Назови 2 свойства за описване на материали.", answer: "Твърд/мек, грапав/гладък, прозрачен/непрозрачен, гъвкав/твърд, тежък/лек (всеки 2)" },
        { question: "Дървото природен или синтетичен материал ли е?", answer: "Природен — идва от дърветата." },
        { question: "Защо гумата се използва за гуми на коли?", answer: "Тя е гъвкава, водонепропусклива и издръжлива." },
        { question: "Назови материал, провеждащ електричество.", answer: "Мед, алуминий, желязо — металите провеждат електричество." },
        { question: "Назови материал, НЕПРОВЕЖДАЩ електричество.", answer: "Гума, пластмаса, дърво, стъкло — изолатори." },
      ],
      es: [
        { question: "Nombra 2 propiedades para describir materiales.", answer: "Duro/blando, rugoso/liso, transparente/opaco, flexible/rígido, pesado/ligero (cualquier 2)" },
        { question: "¿Es la madera natural o sintética?", answer: "Natural — proviene de los árboles." },
        { question: "¿Por qué se usa caucho para los neumáticos?", answer: "Es flexible, impermeable y duradero." },
        { question: "Nombra un material que conduce electricidad.", answer: "Cobre, aluminio, hierro — los metales generalmente conducen electricidad." },
        { question: "Nombra un material que NO conduce electricidad.", answer: "Caucho, plástico, madera, vidrio — aislantes." },
      ],
    },
    "light-sound": {
      en: [
        { question: "Name 2 natural sources of light.", answer: "Sun, fire, lightning, glowing animals (any 2)" },
        { question: "What happens when light hits a mirror?", answer: "It reflects (bounces back)." },
        { question: "What gas do we breathe in?", answer: "Oxygen (O₂)" },
        { question: "Why do you see lightning before hearing thunder?", answer: "Light travels much faster than sound." },
        { question: "What is pitch in sound?", answer: "How high or low a sound is (determined by frequency)." },
      ],
      bg: [
        { question: "Назови 2 естествени източници на светлина.", answer: "Слънцето, огънят, мълнията, светещи животни (всеки 2)" },
        { question: "Какво се случва, когато светлината удари огледало?", answer: "Тя се отразява (отскача обратно)." },
        { question: "Какъв газ вдишваме?", answer: "Кислород (O₂)" },
        { question: "Защо виждаш мълния преди да чуеш гърма?", answer: "Светлината пътува много по-бързо от звука." },
        { question: "Какво е тон на звука?", answer: "Колко висок или нисък е звукът (определя се от честотата)." },
      ],
      es: [
        { question: "Nombra 2 fuentes naturales de luz.", answer: "Sol, fuego, rayo, animales luminosos (cualquier 2)" },
        { question: "¿Qué ocurre cuando la luz golpea un espejo?", answer: "Se refleja (rebota)." },
        { question: "¿Qué gas inhalamos?", answer: "Oxígeno (O₂)" },
        { question: "¿Por qué ves el relámpago antes de escuchar el trueno?", answer: "La luz viaja mucho más rápido que el sonido." },
        { question: "¿Qué es el tono en el sonido?", answer: "Qué tan alto o bajo es un sonido (determinado por la frecuencia)." },
      ],
    },
    "water-air": {
      en: [
        { question: "Name the 3 states of water.", answer: "Solid (ice), Liquid (water), Gas (steam/vapour)" },
        { question: "What gas do we breathe?", answer: "Oxygen (21% of air)" },
        { question: "What percentage of air is nitrogen?", answer: "78%" },
        { question: "Name the 4 stages of the water cycle.", answer: "Evaporation, Condensation, Precipitation, Collection" },
        { question: "Why is clean water important?", answer: "Polluted water spreads disease and harms living things." },
      ],
      bg: [
        { question: "Назови 3-те агрегатни състояния на водата.", answer: "Твърдо (лед), Течно (вода), Газообразно (водна пара)" },
        { question: "Какъв газ дишаме?", answer: "Кислород (21% от въздуха)" },
        { question: "Какъв е процентът на азот във въздуха?", answer: "78%" },
        { question: "Назови 4-те етапа на водния цикъл.", answer: "Изпарение, Кондензация, Валеж, Събиране" },
        { question: "Защо е важна чистата вода?", answer: "Замърсената вода разпространява болести и вреди на живите организми." },
      ],
      es: [
        { question: "Nombra los 3 estados del agua.", answer: "Sólido (hielo), Líquido (agua), Gas (vapor)" },
        { question: "¿Qué gas respiramos?", answer: "Oxígeno (21% del aire)" },
        { question: "¿Qué porcentaje del aire es nitrógeno?", answer: "78%" },
        { question: "Nombra las 4 etapas del ciclo del agua.", answer: "Evaporación, Condensación, Precipitación, Recogida" },
        { question: "¿Por qué es importante el agua limpia?", answer: "El agua contaminada propaga enfermedades y daña a los seres vivos." },
      ],
    },
    "human-body": {
      en: [
        { question: "What does the heart do?", answer: "It pumps blood carrying oxygen and nutrients around the body." },
        { question: "Name 3 healthy habits.", answer: "Eating vegetables, drinking water, sleeping 8-10 hours, exercising, washing hands (any 3)" },
        { question: "What protects the brain?", answer: "The skull (cranium)." },
        { question: "Name 3 body systems.", answer: "Skeletal, muscular, circulatory, respiratory, digestive, nervous (any 3)" },
        { question: "What happens to food in the digestive system?", answer: "It is broken down into nutrients absorbed by the intestines." },
      ],
      bg: [
        { question: "Какво прави сърцето?", answer: "Изпомпва кръв, пренасяща кислород и хранителни вещества из тялото." },
        { question: "Назови 3 здравни навика.", answer: "Ядем зеленчуци, пием вода, спим 8-10 часа, спортуваме, миемне ръцете (всеки 3)" },
        { question: "Какво предпазва мозъка?", answer: "Черепът." },
        { question: "Назови 3 телесни системи.", answer: "Скелетна, мускулна, кръвоносна, дихателна, храносмилателна, нервна (всеки 3)" },
        { question: "Какво се случва с храната в храносмилателната система?", answer: "Разгражда се на хранителни вещества, всмукани от червата." },
      ],
      es: [
        { question: "¿Qué hace el corazón?", answer: "Bombea sangre que lleva oxígeno y nutrientes por el cuerpo." },
        { question: "Nombra 3 hábitos saludables.", answer: "Comer verduras, beber agua, dormir 8-10 horas, hacer ejercicio, lavarse las manos (cualquier 3)" },
        { question: "¿Qué protege al cerebro?", answer: "El cráneo." },
        { question: "Nombra 3 sistemas del cuerpo.", answer: "Esquelético, muscular, circulatorio, respiratorio, digestivo, nervioso (cualquier 3)" },
        { question: "¿Qué le sucede a la comida en el sistema digestivo?", answer: "Se descompone en nutrientes absorbidos por los intestinos." },
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
    seasons: {
      en: [
        { question: "Which season comes after summer?", options: ["Spring", "Winter", "Autumn", "Summer again"], correctIndex: 2 },
        { question: "In which season do flowers bloom?", options: ["Autumn", "Winter", "Summer", "Spring"], correctIndex: 3 },
        { question: "What causes the seasons to change?", options: ["The Moon orbiting Earth", "Earth orbiting the Sun", "Wind direction", "Ocean currents"], correctIndex: 1 },
      ],
      bg: [
        { question: "Кое годишно време идва след лятото?", options: ["Пролет", "Зима", "Есен", "Пак лято"], correctIndex: 2 },
        { question: "Кое годишно време е цъфтежът на цветята?", options: ["Есен", "Зима", "Лято", "Пролет"], correctIndex: 3 },
        { question: "Какво причинява смяната на сезоните?", options: ["Луната, въртяща се около Земята", "Земята, въртяща се около Слънцето", "Посоката на вятъра", "Океанските течения"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Qué estación viene después del verano?", options: ["Primavera", "Invierno", "Otoño", "Verano otra vez"], correctIndex: 2 },
        { question: "¿En qué estación florecen las flores?", options: ["Otoño", "Invierno", "Verano", "Primavera"], correctIndex: 3 },
        { question: "¿Qué causa el cambio de estaciones?", options: ["La Luna orbitando la Tierra", "La Tierra orbitando el Sol", "La dirección del viento", "Las corrientes oceánicas"], correctIndex: 1 },
      ],
    },
    weather: {
      en: [
        { question: "What tool measures temperature?", options: ["Barometer", "Thermometer", "Ruler", "Scale"], correctIndex: 1 },
        { question: "What is the unit of temperature?", options: ["Kg", "Metres", "Degrees Celsius", "Litres"], correctIndex: 2 },
        { question: "What is climate?", options: ["Today's weather", "Tomorrow's forecast", "The average weather of a region over many years", "The temperature inside a room"], correctIndex: 2 },
      ],
      bg: [
        { question: "Кой инструмент измерва температурата?", options: ["Барометър", "Термометър", "Линийка", "Везна"], correctIndex: 1 },
        { question: "В какви единици се измерва температурата?", options: ["Кг", "Метри", "Градуси Целзий", "Литри"], correctIndex: 2 },
        { question: "Какво е климатът?", options: ["Времето днес", "Прогнозата за утре", "Средното времето за даден регион за много години", "Температурата в стаята"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué instrumento mide la temperatura?", options: ["Barómetro", "Termómetro", "Regla", "Báscula"], correctIndex: 1 },
        { question: "¿En qué unidad se mide la temperatura?", options: ["Kg", "Metros", "Grados Celsius", "Litros"], correctIndex: 2 },
        { question: "¿Qué es el clima?", options: ["El tiempo de hoy", "El pronóstico de mañana", "El tiempo promedio de una región durante muchos años", "La temperatura dentro de una habitación"], correctIndex: 2 },
      ],
    },
    comparison: {
      en: [
        { question: "Which word is used to compare 2 things?", options: ["and", "because", "bigger", "first"], correctIndex: 2 },
        { question: "Anna has 7 sweets, Bobi has 3. Who has MORE?", options: ["Bobi", "Anna", "They have the same", "Cannot tell"], correctIndex: 1 },
        { question: "A car is __ than a bicycle.", options: ["slower", "faster", "smaller", "lighter"], correctIndex: 1 },
      ],
      bg: [
        { question: "Коя дума се използва за сравнение на 2 неща?", options: ["и", "защото", "по-голям", "първо"], correctIndex: 2 },
        { question: "Анна има 7 бонбона, Боби — 3. Кой има ПОВЕЧЕ?", options: ["Боби", "Анна", "Имат еднакво", "Не може да се каже"], correctIndex: 1 },
        { question: "Колата е __ от велосипеда.", options: ["по-бавна", "по-бърза", "по-малка", "по-лека"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Qué palabra se usa para comparar 2 cosas?", options: ["y", "porque", "más grande", "primero"], correctIndex: 2 },
        { question: "Ana tiene 7 dulces, Bobi tiene 3. ¿Quién tiene MÁS?", options: ["Bobi", "Ana", "Tienen igual", "No se puede saber"], correctIndex: 1 },
        { question: "Un coche es __ que una bicicleta.", options: ["más lento", "más rápido", "más pequeño", "más ligero"], correctIndex: 1 },
      ],
    },
    sequencing: {
      en: [
        { question: "Which word means 'at the very beginning'?", options: ["Then", "Finally", "First", "After"], correctIndex: 2 },
        { question: "What is the correct order? A) Eat apple. B) Wash apple. C) Pick up apple.", options: ["A→B→C", "B→C→A", "C→B→A", "C→A→B"], correctIndex: 2 },
        { question: "A sequence puts events in:", options: ["random order", "alphabetical order", "the correct time order", "the shortest to longest order"], correctIndex: 2 },
      ],
      bg: [
        { question: "Коя дума означава 'в самото начало'?", options: ["После", "Накрая", "Първо", "След"], correctIndex: 2 },
        { question: "Кой е верният ред? А) Изяжда ябълката. Б) Мие ябълката. В) Взима ябълката.", options: ["А→Б→В", "Б→В→А", "В→Б→А", "В→А→Б"], correctIndex: 2 },
        { question: "Наредбата нарежда събитията в:", options: ["произволен ред", "азбучен ред", "правилния времеви ред", "от най-кратко до най-дълго"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué palabra significa 'al principio'?", options: ["Luego", "Finalmente", "Primero", "Después"], correctIndex: 2 },
        { question: "¿Cuál es el orden correcto? A) Comer la manzana. B) Lavar la manzana. C) Agarrar la manzana.", options: ["A→B→C", "B→C→A", "C→B→A", "C→A→B"], correctIndex: 2 },
        { question: "Una secuencia ordena los eventos en:", options: ["orden aleatorio", "orden alfabético", "el orden correcto de tiempo", "del más corto al más largo"], correctIndex: 2 },
      ],
    },
    "family-community": {
      en: [
        { question: "A community is:", options: ["just your family", "a group of people sharing a place", "only people at school", "a group of friends"], correctIndex: 1 },
        { question: "Who leads a municipality (local government)?", options: ["A teacher", "A doctor", "A mayor", "A police officer"], correctIndex: 2 },
        { question: "Why do communities need rules?", options: ["To make things boring", "To help people live safely and fairly", "To punish people", "Only adults need rules"], correctIndex: 1 },
      ],
      bg: [
        { question: "Общността е:", options: ["само семейството ти", "група хора, споделящи едно място", "само хора в училище", "група приятели"], correctIndex: 1 },
        { question: "Кой ръководи общината?", options: ["Учител", "Лекар", "Кмет", "Полицай"], correctIndex: 2 },
        { question: "Защо обществото се нуждае от правила?", options: ["За да е скучно", "За да живеят хората безопасно и справедливо", "За да наказват хората", "Само възрастните се нуждаят от правила"], correctIndex: 1 },
      ],
      es: [
        { question: "Una comunidad es:", options: ["solo tu familia", "un grupo de personas que comparten un lugar", "solo personas en la escuela", "un grupo de amigos"], correctIndex: 1 },
        { question: "¿Quién encabeza un municipio (gobierno local)?", options: ["Un maestro", "Un médico", "Un alcalde", "Un policía"], correctIndex: 2 },
        { question: "¿Por qué las comunidades necesitan reglas?", options: ["Para hacer las cosas aburridas", "Para ayudar a las personas a vivir de forma segura y justa", "Para castigar a las personas", "Solo los adultos necesitan reglas"], correctIndex: 1 },
      ],
    },
    "my-homeland": {
      en: [
        { question: "What is the difference between a city and a village?", options: ["A village is bigger", "A city is larger with more people", "They are the same", "A village has more traffic"], correctIndex: 1 },
        { question: "What is the highest mountain in Bulgaria?", options: ["Vitosha", "Balkan", "Musala (Rila)", "Rhodope"], correctIndex: 2 },
        { question: "A landmark is:", options: ["a road sign", "a famous recognisable feature of a place", "a type of map", "a border between countries"], correctIndex: 1 },
      ],
      bg: [
        { question: "Каква е разликата между град и село?", options: ["Селото е по-голямо", "Градът е по-голям с повече хора", "Едни и същи са", "Селото има повече трафик"], correctIndex: 1 },
        { question: "Кой е най-високият връх в България?", options: ["Витоша", "Стара планина", "Мусала (Рила)", "Родопи"], correctIndex: 2 },
        { question: "Забележителността е:", options: ["пътен знак", "известен обект на дадено място", "вид карта", "граница между страни"], correctIndex: 1 },
      ],
      es: [
        { question: "¿Cuál es la diferencia entre una ciudad y un pueblo?", options: ["El pueblo es más grande", "La ciudad es más grande con más gente", "Son lo mismo", "El pueblo tiene más tráfico"], correctIndex: 1 },
        { question: "¿Cuál es la montaña más alta de Bulgaria?", options: ["Vitosha", "Balcán", "Musala (Rila)", "Ródope"], correctIndex: 2 },
        { question: "Un punto de referencia es:", options: ["una señal de tráfico", "un lugar famoso y reconocible de un lugar", "un tipo de mapa", "una frontera entre países"], correctIndex: 1 },
      ],
    },
    bulgaria: {
      en: [
        { question: "What is the capital of Bulgaria?", options: ["Plovdiv", "Varna", "Sofia", "Burgas"], correctIndex: 2 },
        { question: "What are the colours of the Bulgarian flag (top to bottom)?", options: ["Red, White, Green", "White, Green, Red", "Green, White, Red", "Blue, White, Red"], correctIndex: 1 },
        { question: "When was Bulgaria founded?", options: ["918 AD", "681 AD", "1878 AD", "1000 AD"], correctIndex: 1 },
      ],
      bg: [
        { question: "Коя е столицата на България?", options: ["Пловдив", "Варна", "София", "Бургас"], correctIndex: 2 },
        { question: "Кои са цветовете на българския флаг (от горе надолу)?", options: ["Червено, Бяло, Зелено", "Бяло, Зелено, Червено", "Зелено, Бяло, Червено", "Синьо, Бяло, Червено"], correctIndex: 1 },
        { question: "Кога е основана България?", options: ["918 г.", "681 г.", "1878 г.", "1000 г."], correctIndex: 1 },
      ],
      es: [
        { question: "¿Cuál es la capital de Bulgaria?", options: ["Plovdiv", "Varna", "Sofía", "Burgas"], correctIndex: 2 },
        { question: "¿Cuáles son los colores de la bandera búlgara (de arriba abajo)?", options: ["Rojo, Blanco, Verde", "Blanco, Verde, Rojo", "Verde, Blanco, Rojo", "Azul, Blanco, Rojo"], correctIndex: 1 },
        { question: "¿Cuándo fue fundada Bulgaria?", options: ["918 d.C.", "681 d.C.", "1878 d.C.", "1000 d.C."], correctIndex: 1 },
      ],
    },
    "rights-duties": {
      en: [
        { question: "Every child has the right to:", options: ["skip school anytime", "education and safety", "break any rule", "stay up all night"], correctIndex: 1 },
        { question: "A duty is:", options: ["something you want to do", "something you are responsible to do", "a type of holiday", "only for adults"], correctIndex: 1 },
        { question: "Why do we have traffic rules?", options: ["To make roads prettier", "To slow everyone down", "To keep all road users safe", "Only drivers need them"], correctIndex: 2 },
      ],
      bg: [
        { question: "Всяко дете има право на:", options: ["да пропуска учлище кога иска", "образование и безопасност", "да нарушава всяко правило", "да не спи нощем"], correctIndex: 1 },
        { question: "Задължението е:", options: ["нещо, което искаш да правиш", "нещо, за което си отговорен да го правиш", "вид празник", "само за възрастни"], correctIndex: 1 },
        { question: "Защо имаме правила за движение по пътя?", options: ["За да са пътищата по-красиви", "За да забавят всички", "За да са в безопасност всички участници в движението", "Само шофьорите се нуждаят от тях"], correctIndex: 2 },
      ],
      es: [
        { question: "Todo niño tiene derecho a:", options: ["saltarse la escuela cuando quiera", "educación y seguridad", "romper cualquier regla", "quedarse despierto toda la noche"], correctIndex: 1 },
        { question: "Un deber es:", options: ["algo que quieres hacer", "algo de lo que eres responsable de hacer", "un tipo de vacación", "solo para adultos"], correctIndex: 1 },
        { question: "¿Por qué tenemos reglas de tráfico?", options: ["Para hacer las carreteras más bonitas", "Para hacer más lentos a todos", "Para mantener a todos los usuarios de la vía seguros", "Solo los conductores las necesitan"], correctIndex: 2 },
      ],
    },
    traditions: {
      en: [
        { question: "When is Baba Marta Day?", options: ["1 January", "1 March", "3 March", "24 December"], correctIndex: 1 },
        { question: "What colour is a martenitsa?", options: ["Blue and yellow", "Red and white", "Green and white", "Red and blue"], correctIndex: 1 },
        { question: "When is Bulgarian Liberation Day?", options: ["1 March", "24 December", "3 March", "1 January"], correctIndex: 2 },
      ],
      bg: [
        { question: "Кога е Баба Марта?", options: ["1 януари", "1 март", "3 март", "24 декември"], correctIndex: 1 },
        { question: "Какъв цвят е мартеницата?", options: ["Синьо и жълто", "Червено и бяло", "Зелено и бяло", "Червено и синьо"], correctIndex: 1 },
        { question: "Кога е Денят на Освобождението на България?", options: ["1 март", "24 декември", "3 март", "1 януари"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Cuándo es el Día de Baba Marta?", options: ["1 de enero", "1 de marzo", "3 de marzo", "24 de diciembre"], correctIndex: 1 },
        { question: "¿De qué color es una martenitsa?", options: ["Azul y amarillo", "Rojo y blanco", "Verde y blanco", "Rojo y azul"], correctIndex: 1 },
        { question: "¿Cuándo es el Día de la Liberación de Bulgaria?", options: ["1 de marzo", "24 de diciembre", "3 de marzo", "1 de enero"], correctIndex: 2 },
      ],
    },
    "living-things": {
      en: [
        { question: "Which of these is a living thing?", options: ["A rock", "A chair", "A mushroom", "Water"], correctIndex: 2 },
        { question: "What process do plants use to make food?", options: ["Digestion", "Photosynthesis", "Respiration", "Reproduction"], correctIndex: 1 },
        { question: "Which is NOT a sign of life?", options: ["Growth", "Reproduction", "Rusting", "Movement"], correctIndex: 2 },
      ],
      bg: [
        { question: "Кое от тези е жив организъм?", options: ["Камък", "Стол", "Гъба", "Вода"], correctIndex: 2 },
        { question: "Какъв процес използват растенията, за да правят храна?", options: ["Храносмилане", "Фотосинтеза", "Дишане", "Размножаване"], correctIndex: 1 },
        { question: "Кое НЕ е признак на живота?", options: ["Растеж", "Размножаване", "Ръждясване", "Движение"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Cuál de estos es un ser vivo?", options: ["Una roca", "Una silla", "Un hongo", "Agua"], correctIndex: 2 },
        { question: "¿Qué proceso usan las plantas para producir alimento?", options: ["Digestión", "Fotosíntesis", "Respiración", "Reproducción"], correctIndex: 1 },
        { question: "¿Cuál NO es un signo de vida?", options: ["Crecimiento", "Reproducción", "Oxidación", "Movimiento"], correctIndex: 2 },
      ],
    },
    materials: {
      en: [
        { question: "Is wood a natural or synthetic material?", options: ["Synthetic", "Natural", "Both", "Neither"], correctIndex: 1 },
        { question: "Why is glass used for windows?", options: ["It is flexible", "It is transparent", "It is the cheapest", "It is magnetic"], correctIndex: 1 },
        { question: "Which material conducts electricity?", options: ["Wood", "Plastic", "Rubber", "Copper"], correctIndex: 3 },
      ],
      bg: [
        { question: "Дървото природен или синтетичен материал ли е?", options: ["Синтетичен", "Природен", "И двете", "Нито едното"], correctIndex: 1 },
        { question: "Защо стъклото се използва за прозорци?", options: ["Гъвкаво е", "Прозрачно е", "Най-евтиното е", "Магнитно е"], correctIndex: 1 },
        { question: "Кой материал провежда електричество?", options: ["Дърво", "Пластмаса", "Гума", "Мед"], correctIndex: 3 },
      ],
      es: [
        { question: "¿Es la madera un material natural o sintético?", options: ["Sintético", "Natural", "Ambos", "Ninguno"], correctIndex: 1 },
        { question: "¿Por qué se usa vidrio en las ventanas?", options: ["Es flexible", "Es transparente", "Es lo más barato", "Es magnético"], correctIndex: 1 },
        { question: "¿Qué material conduce la electricidad?", options: ["Madera", "Plástico", "Caucho", "Cobre"], correctIndex: 3 },
      ],
    },
    "light-sound": {
      en: [
        { question: "What happens when light hits a mirror?", options: ["It disappears", "It reflects (bounces back)", "It changes colour", "It slows down"], correctIndex: 1 },
        { question: "Why do you see lightning before hearing thunder?", options: ["Thunder travels faster", "Light travels faster than sound", "They travel at the same speed", "Thunder is quieter"], correctIndex: 1 },
        { question: "Which is a natural source of light?", options: ["A candle", "A lamp", "The Sun", "A torch"], correctIndex: 2 },
      ],
      bg: [
        { question: "Какво се случва, когато светлината удари огледало?", options: ["Изчезва", "Отразява се (отскача)", "Сменя цвета си", "Забавя се"], correctIndex: 1 },
        { question: "Защо виждаш мълнията преди да чуеш гърма?", options: ["Гърмът пътува по-бързо", "Светлината пътува по-бързо от звука", "Пътуват с еднаква скорост", "Гърмът е по-тих"], correctIndex: 1 },
        { question: "Кой е естествен източник на светлина?", options: ["Свещ", "Лампа", "Слънцето", "Фенерче"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Qué ocurre cuando la luz golpea un espejo?", options: ["Desaparece", "Se refleja (rebota)", "Cambia de color", "Se ralentiza"], correctIndex: 1 },
        { question: "¿Por qué ves el relámpago antes de escuchar el trueno?", options: ["El trueno viaja más rápido", "La luz viaja más rápido que el sonido", "Viajan a la misma velocidad", "El trueno es más silencioso"], correctIndex: 1 },
        { question: "¿Cuál es una fuente natural de luz?", options: ["Una vela", "Una lámpara", "El Sol", "Una linterna"], correctIndex: 2 },
      ],
    },
    "water-air": {
      en: [
        { question: "What are the 3 states of water?", options: ["Gas, plasma, solid", "Solid, liquid, gas", "Liquid, solid, vapour-gas", "Hot, cold, frozen"], correctIndex: 1 },
        { question: "What percentage of air is oxygen?", options: ["78%", "21%", "1%", "50%"], correctIndex: 1 },
        { question: "What is the first stage of the water cycle?", options: ["Precipitation", "Collection", "Evaporation", "Condensation"], correctIndex: 2 },
      ],
      bg: [
        { question: "Кои са 3-те агрегатни състояния на водата?", options: ["Газ, плазма, твърдо", "Твърдо, течно, газообразно", "Течно, твърдо, пара", "Горещо, студено, замръзнало"], correctIndex: 1 },
        { question: "Какъв е процентът на кислород във въздуха?", options: ["78%", "21%", "1%", "50%"], correctIndex: 1 },
        { question: "Кой е първият етап на водния цикъл?", options: ["Валеж", "Събиране", "Изпарение", "Кондензация"], correctIndex: 2 },
      ],
      es: [
        { question: "¿Cuáles son los 3 estados del agua?", options: ["Gas, plasma, sólido", "Sólido, líquido, gas", "Líquido, sólido, vapor", "Caliente, frío, congelado"], correctIndex: 1 },
        { question: "¿Qué porcentaje del aire es oxígeno?", options: ["78%", "21%", "1%", "50%"], correctIndex: 1 },
        { question: "¿Cuál es la primera etapa del ciclo del agua?", options: ["Precipitación", "Recogida", "Evaporación", "Condensación"], correctIndex: 2 },
      ],
    },
    "human-body": {
      en: [
        { question: "What does the heart do?", options: ["Digests food", "Pumps blood", "Controls thinking", "Breathes air"], correctIndex: 1 },
        { question: "What protects the brain?", options: ["Ribs", "Spine", "Skull", "Muscles"], correctIndex: 2 },
        { question: "Which body system breaks down food?", options: ["Circulatory", "Respiratory", "Skeletal", "Digestive"], correctIndex: 3 },
      ],
      bg: [
        { question: "Какво прави сърцето?", options: ["Смила храна", "Изпомпва кръвта", "Управлява мисленето", "Диша въздух"], correctIndex: 1 },
        { question: "Какво защитава мозъка?", options: ["Ребрата", "Гръбначният стълб", "Черепът", "Мускулите"], correctIndex: 2 },
        { question: "Коя телесна система разгражда храната?", options: ["Кръвоносна", "Дихателна", "Скелетна", "Храносмилателна"], correctIndex: 3 },
      ],
      es: [
        { question: "¿Qué hace el corazón?", options: ["Digiere comida", "Bombea sangre", "Controla el pensamiento", "Respira aire"], correctIndex: 1 },
        { question: "¿Qué protege al cerebro?", options: ["Las costillas", "La columna", "El cráneo", "Los músculos"], correctIndex: 2 },
        { question: "¿Qué sistema corporal descompone los alimentos?", options: ["Circulatorio", "Respiratorio", "Esquelético", "Digestivo"], correctIndex: 3 },
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

const MATH_SUBJECTS = new Set(["addition", "subtraction", "multiplication", "division", "word-problems", "algebra-basics", "fractions-adv", "natural-numbers", "divisibility", "common-fractions", "decimal-fractions", "geometric-figures", "perimeter-area", "percentage-5grade", "word-problems-5grade"]);

export function getLessonContent(
  subjectId: string,
  topicId: string,
  grade: number,
  lang: LangCode,
): LessonContent {
  const isMath = (subjectId === "mathematics" || subjectId === "mathematics-advanced") && MATH_SUBJECTS.has(topicId);
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
