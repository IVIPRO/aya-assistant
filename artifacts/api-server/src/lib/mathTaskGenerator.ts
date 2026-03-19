/**
 * AYA Mission Generator v1
 * Generates math tasks locally (no AI, no API calls)
 * Supports: Addition, Subtraction, Multiplication
 */

export interface MathTask {
  id: string;
  expression: string;
  answer: number;
  type: "addition" | "subtraction" | "multiplication" | "word-problem";
  difficulty: "easy" | "medium" | "hard";
  number1: number;
  number2: number;
  operator: "+"|"-"|"*";
}

export interface MissionDefinition {
  id: string;
  titleBg: string;
  titleEn: string;
  titleEs: string;
  taskCount: number;
  generate: () => MathTask;
}

/**
 * Generate random integer in range [min, max]
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Track recently generated tasks to avoid repetition
 */
const taskHistoryMap: Record<string, string[]> = {};

function getTaskHash(n1: number, n2: number, op: string): string {
  return `${n1}${op}${n2}`;
}

function wasRecentlyGenerated(missionId: string, hash: string): boolean {
  const history = taskHistoryMap[missionId] ?? [];
  return history.includes(hash);
}

function addToHistory(missionId: string, hash: string): void {
  if (!taskHistoryMap[missionId]) {
    taskHistoryMap[missionId] = [];
  }
  taskHistoryMap[missionId].push(hash);
  // Keep only last 5 tasks
  if (taskHistoryMap[missionId].length > 5) {
    taskHistoryMap[missionId].shift();
  }
}

function resetHistory(missionId: string): void {
  taskHistoryMap[missionId] = [];
}

/**
 * Mission 1: Събиране до 10 (Addition up to 10)
 * Rules: number1 [0-10], number2 [0-10], sum <= 10
 */
function generateAddition10(): MathTask {
  let n1, n2, hash;
  const missionId = "m1";
  
  // Generate unique task
  do {
    n1 = randomInt(0, 10);
    n2 = randomInt(0, 10);
    hash = getTaskHash(n1, n2, "+");
  } while (n1 + n2 > 10 || wasRecentlyGenerated(missionId, hash));

  addToHistory(missionId, hash);

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    expression: `${n1} + ${n2}`,
    answer: n1 + n2,
    type: "addition",
    difficulty: "easy",
    number1: n1,
    number2: n2,
    operator: "+",
  };
}

/**
 * Mission 2: Изваждане до 10 (Subtraction up to 10)
 * Rules: number1 [1-10], number2 [0-number1], result >= 0
 */
function generateSubtraction10(): MathTask {
  let n1, n2, hash;
  const missionId = "m2";
  
  // Generate unique task
  do {
    n1 = randomInt(1, 10);
    n2 = randomInt(0, n1);
    hash = getTaskHash(n1, n2, "-");
  } while (wasRecentlyGenerated(missionId, hash));

  addToHistory(missionId, hash);

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    expression: `${n1} - ${n2}`,
    answer: n1 - n2,
    type: "subtraction",
    difficulty: "easy",
    number1: n1,
    number2: n2,
    operator: "-",
  };
}

/**
 * Mission 3: Събиране до 20 (Addition up to 20)
 * Rules: number1 [0-20], number2 [0-20], sum <= 20
 */
function generateAddition20(): MathTask {
  let n1, n2, hash;
  const missionId = "m3";
  
  // Generate unique task
  do {
    n1 = randomInt(0, 20);
    n2 = randomInt(0, 20);
    hash = getTaskHash(n1, n2, "+");
  } while (n1 + n2 > 20 || wasRecentlyGenerated(missionId, hash));

  addToHistory(missionId, hash);

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    expression: `${n1} + ${n2}`,
    answer: n1 + n2,
    type: "addition",
    difficulty: "easy",
    number1: n1,
    number2: n2,
    operator: "+",
  };
}

/**
 * Mission 4: Умножение в таблицата (Multiplication 1-5)
 * Rules: number1 [1-5], number2 [1-5]
 */
function generateMultiplication5(): MathTask {
  let n1, n2, hash;
  const missionId = "m4";
  
  do {
    n1 = randomInt(1, 5);
    n2 = randomInt(1, 5);
    hash = getTaskHash(n1, n2, "*");
  } while (wasRecentlyGenerated(missionId, hash));

  addToHistory(missionId, hash);

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    expression: `${n1} × ${n2}`,
    answer: n1 * n2,
    type: "multiplication",
    difficulty: "easy",
    number1: n1,
    number2: n2,
    operator: "*",
  };
}

/**
 * Mission 5: Задача с думи (Word Problems)
 * Simple addition/subtraction word problems for Grade 2
 */
function generateWordProblem(): MathTask {
  const missionId = "m5";
  
  // Word problem templates in Bulgarian
  const templates = [
    // Addition problems
    { name: "Maria has X apples, gets Y more", genFunc: () => {
      const x = randomInt(5, 15);
      const y = randomInt(1, 10);
      return {
        expression: `Мария има ${x} ябълки и получава още ${y}. Колко ябълки има сега?`,
        answer: x + y,
        op: "+"
      };
    }},
    { name: "X books, Y more books", genFunc: () => {
      const x = randomInt(3, 12);
      const y = randomInt(1, 8);
      return {
        expression: `Има ${x} книги и ${y} още книги. Колко книги са всичко?`,
        answer: x + y,
        op: "+"
      };
    }},
    // Subtraction problems
    { name: "X apples, give away Y", genFunc: () => {
      const x = randomInt(10, 20);
      const y = randomInt(1, x - 3);
      return {
        expression: `Мария има ${x} ябълки и дава ${y} на приятел. Колко остават?`,
        answer: x - y,
        op: "-"
      };
    }},
    { name: "X items, Y are taken away", genFunc: () => {
      const x = randomInt(8, 18);
      const y = randomInt(1, x - 2);
      return {
        expression: `На масата има ${x} играчки. Зафиксирани са ${y} от тях. Колко остават?`,
        answer: x - y,
        op: "-"
      };
    }},
  ];
  
  // Pick random template
  const template = templates[Math.floor(Math.random() * templates.length)];
  const problem = template.genFunc();
  
  const hash = getTaskHash(problem.answer, 0, problem.op);
  if (wasRecentlyGenerated(missionId, hash)) {
    // If recently generated, try again
    return generateWordProblem();
  }
  
  addToHistory(missionId, problem.answer.toString());
  
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    expression: problem.expression,
    answer: problem.answer,
    type: "word-problem",
    difficulty: "easy",
    number1: 0,
    number2: 0,
    operator: problem.op as "+"|"-"|"*",
  };
}

/**
 * Available missions
 */
export const MISSIONS: Record<string, MissionDefinition> = {
  m1: {
    id: "m1",
    titleBg: "Събиране до 10",
    titleEn: "Addition up to 10",
    titleEs: "Suma hasta 10",
    taskCount: 5,
    generate: generateAddition10,
  },
  m2: {
    id: "m2",
    titleBg: "Изваждане до 10",
    titleEn: "Subtraction up to 10",
    titleEs: "Resta hasta 10",
    taskCount: 5,
    generate: generateSubtraction10,
  },
  m3: {
    id: "m3",
    titleBg: "Събиране до 20",
    titleEn: "Addition up to 20",
    titleEs: "Suma hasta 20",
    taskCount: 6,
    generate: generateAddition20,
  },
  m4: {
    id: "m4",
    titleBg: "Умножение в таблицата",
    titleEn: "Multiplication Table",
    titleEs: "Tabla de multiplicación",
    taskCount: 5,
    generate: generateMultiplication5,
  },
  m5: {
    id: "m5",
    titleBg: "Задача с думи",
    titleEn: "Word Problems",
    titleEs: "Problemas de palabras",
    taskCount: 5,
    generate: generateWordProblem,
  },
};

/**
 * Generate initial tasks for a mission
 */
export function generateMissionTasks(missionId: string, count: number): MathTask[] {
  const mission = MISSIONS[missionId];
  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  resetHistory(missionId);
  const tasks: MathTask[] = [];
  for (let i = 0; i < count; i++) {
    tasks.push(mission.generate());
  }
  return tasks;
}

/**
 * Generate next task for a mission
 */
export function generateNextTask(missionId: string): MathTask {
  const mission = MISSIONS[missionId];
  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }
  return mission.generate();
}

/**
 * Check if answer is correct
 */
export function checkAnswer(task: MathTask, userAnswer: number): boolean {
  // Normalize both values to ensure proper numeric comparison
  const normalizedExpected = Number(task.answer);
  const normalizedSubmitted = Number(userAnswer);
  const isCorrect = normalizedSubmitted === normalizedExpected;
  return isCorrect;
}

/**
 * Get teacher response for correct answer (Bulgarian)
 */
export function getCorrectAnswerResponseBg(task: MathTask): string {
  const encouragements = [
    "Браво!",
    "Отлично!",
    "Супер!",
    "Напълно вярно!",
    "Разбра си!",
  ];
  const random = encouragements[Math.floor(Math.random() * encouragements.length)];
  return `${random}\n${task.expression} = ${task.answer} ⭐`;
}

/**
 * Get teacher response for correct answer (English)
 */
export function getCorrectAnswerResponseEn(task: MathTask): string {
  const encouragements = [
    "Excellent!",
    "Perfect!",
    "Great job!",
    "Well done!",
    "That's right!",
  ];
  const random = encouragements[Math.floor(Math.random() * encouragements.length)];
  return `${random}\n${task.expression} = ${task.answer} ⭐`;
}

/**
 * Get teacher response for correct answer (Spanish)
 */
export function getCorrectAnswerResponseEs(task: MathTask): string {
  const encouragements = [
    "¡Bravo!",
    "¡Excelente!",
    "¡Muy bien!",
    "¡Correcto!",
    "¡Lo hiciste!",
  ];
  const random = encouragements[Math.floor(Math.random() * encouragements.length)];
  return `${random}\n${task.expression} = ${task.answer} ⭐`;
}

/**
 * Get teacher response for incorrect answer (Bulgarian)
 */
export function getIncorrectAnswerResponseBg(): string {
  return "Опитай отново. Помисли още малко.";
}

/**
 * Get teacher response for incorrect answer (English)
 */
export function getIncorrectAnswerResponseEn(): string {
  return "Try again. Think a bit more.";
}

/**
 * Get teacher response for incorrect answer (Spanish)
 */
export function getIncorrectAnswerResponseEs(): string {
  return "Intenta de nuevo. Piensa un poco más.";
}

/**
 * Get mission complete message (Bulgarian)
 */
export function getMissionCompleteMessageBg(missionTitle: string): string {
  return `🎉 Мисията "${missionTitle}" е изпълнена!\n\nПолучаваш:\n⭐ +30 XP`;
}

/**
 * Get mission complete message (English)
 */
export function getMissionCompleteMessageEn(missionTitle: string): string {
  return `🎉 Mission "${missionTitle}" completed!\n\nYou earned:\n⭐ +30 XP`;
}

/**
 * Get mission complete message (Spanish)
 */
export function getMissionCompleteMessageEs(missionTitle: string): string {
  return `🎉 ¡Misión "${missionTitle}" completada!\n\nGanaste:\n⭐ +30 XP`;
}

/**
 * Get task prompt (Bulgarian)
 */
export function getTaskPromptBg(task: MathTask): string {
  return `Нека решим задача.\n\n${task.expression}\n\nКакъв според теб е отговорът?`;
}

/**
 * Get task prompt (English)
 */
export function getTaskPromptEn(task: MathTask): string {
  return `Let's solve a problem.\n\n${task.expression}\n\nWhat do you think the answer is?`;
}

/**
 * Get task prompt (Spanish)
 */
export function getTaskPromptEs(task: MathTask): string {
  return `Vamos a resolver un problema.\n\n${task.expression}\n\n¿Cuál crees que es la respuesta?`;
}
