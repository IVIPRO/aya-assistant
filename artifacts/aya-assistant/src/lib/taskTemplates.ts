/**
 * Task Templates — Phase 3
 * 
 * Reusable templates for generating learning tasks by topic and grade.
 * Integrates with curriculumMap and curriculumUtils.
 * 
 * Scope: Grades 2 & 5 mathematics (reference implementations)
 */

import type { Grade } from "./curriculumMap";
import { getTopicDifficulty, isContentTypeAllowed, getMaxNumberForGrade } from "./curriculumUtils";

/* ── Template Types ── */

export type TemplateType = "solved-example" | "guided-practice" | "independent-practice" | "test-task" | "word-problem";

export interface SolvedExample {
  templateType: "solved-example";
  problem: string;
  steps: string[];
  explanation: string;
  finalAnswer: string;
  reasoning: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface GuidedPractice {
  templateType: "guided-practice";
  problem: string;
  hint: string;
  stepGuidance: string[];
  expectedAnswer: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface IndependentPractice {
  templateType: "independent-practice";
  problem: string;
  expectedAnswer: string;
  answerValidation: "exact-match" | "numeric-value" | "order-independent";
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface TestTask {
  templateType: "test-task";
  problem: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface WordProblemTemplate {
  templateType: "word-problem";
  story: string;
  operation: "addition" | "subtraction" | "multiplication" | "division";
  operationDisplay: string; // e.g., "35 + 6"
  stepByStep: string[];
  result: string;
  reasoning: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export type Task = SolvedExample | GuidedPractice | IndependentPractice | TestTask | WordProblemTemplate;

/* ── Template Generation Engine ── */

export interface TaskGenerationContext {
  grade: Grade;
  subject: string; // e.g., "mathematics"
  topic: string; // e.g., "addition"
  templateType: TemplateType;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

/**
 * Generate a task from a template based on context
 * Routes to appropriate template generator for the topic
 */
export const generateTask = (context: TaskGenerationContext): Task | null => {
  // Validate grade and topic
  if (context.grade !== 2 && context.grade !== 5) {
    // Only grades 2 and 5 are currently supported
    return null;
  }

  if (context.subject !== "mathematics") {
    // Only mathematics is currently supported
    return null;
  }

  // Route to topic-specific generator
  switch (context.topic) {
    case "addition":
      return generateAdditionTask(context);
    case "subtraction":
      return generateSubtractionTask(context);
    case "multiplication":
      return generateMultiplicationTask(context);
    case "division":
      return generateDivisionTask(context);
    case "word-problems":
    case "word-problems-5grade":
      return generateWordProblemTask(context);
    case "decimal-fractions":
      return generateDecimalTask(context);
    default:
      return null;
  }
};

/* ── Grade 2 Math Templates ── */

/**
 * Addition template for Grade 2 (max 100)
 */
const generateAdditionTask = (context: TaskGenerationContext): Task | null => {
  if (context.templateType === "solved-example") {
    if (context.grade === 2) {
      return {
        templateType: "solved-example",
        problem: "35 + 6",
        steps: [
          "Разделяме 35 на десетици и единици.",
          "35 = 3 дес. и 5 ед.",
          "Събираме единиците: 5 + 6 = 11",
          "Пишем 1 и пренасяме 1 десетица.",
          "Събираме десетиците: 3 + 1 = 4",
        ],
        explanation: "Събираме първо единиците, после десетиците. Ако единиците дадат повече от 10, пренасяме една десетица.",
        finalAnswer: "41",
        reasoning: "40 + 1 = 41",
        difficulty: "beginner",
      };
    }
    if (context.grade === 5) {
      return {
        templateType: "solved-example",
        problem: "234 + 567",
        steps: [
          "Събираме единиците: 4 + 7 = 11 (пишем 1, пренасяме 1)",
          "Събираме десетиците: 3 + 6 + 1 = 10 (пишем 0, пренасяме 1)",
          "Събираме стотиците: 2 + 5 + 1 = 8",
        ],
        explanation: "Събираме по позиции (единици, десетици, стотици) и пренасяме каато е нужно.",
        finalAnswer: "801",
        reasoning: "200 + 600 + 30 + 60 + 4 + 7 = 801",
        difficulty: "intermediate",
      };
    }
  }

  if (context.templateType === "guided-practice") {
    if (context.grade === 2) {
      return {
        templateType: "guided-practice",
        problem: "24 + 13",
        hint: "Събери единиците си първо: 4 + 3",
        stepGuidance: [
          "Колко е 4 + 3?",
          "Събери десетиците: 2 + 1",
          "Напиши отговора",
        ],
        expectedAnswer: "37",
        difficulty: "beginner",
      };
    }
  }

  if (context.templateType === "independent-practice") {
    if (context.grade === 2) {
      return {
        templateType: "independent-practice",
        problem: "18 + 17",
        expectedAnswer: "35",
        answerValidation: "exact-match",
        difficulty: "beginner",
      };
    }
  }

  if (context.templateType === "test-task") {
    if (context.grade === 2) {
      return {
        templateType: "test-task",
        problem: "25 + 8",
        options: ["32", "33", "34", "35"],
        correctAnswerIndex: 1,
        explanation: "25 + 8: събираме единиците 5 + 8 = 13 (пишем 3, пренасяме 1). Десетиците: 2 + 1 = 3. Отговор: 33",
        difficulty: "beginner",
      };
    }
  }

  return null;
};

/**
 * Subtraction template for Grade 2 (max 100)
 */
const generateSubtractionTask = (context: TaskGenerationContext): Task | null => {
  if (context.templateType === "solved-example") {
    if (context.grade === 2) {
      return {
        templateType: "solved-example",
        problem: "43 − 15",
        steps: [
          "Разделяме 43 на десетици и единици: 4 дес. и 3 ед.",
          "Не можем да извадим 5 от 3.",
          "Позаимствай 1 десетица (10 единици).",
          "Сега имаш 13 единици: 13 − 5 = 8",
          "Остават 3 десетици: 3 − 1 = 2",
        ],
        explanation: "Когато единиците в първото число са по-малки, позаимствай една десетица.",
        finalAnswer: "28",
        reasoning: "40 − 10 + 3 − 5 = 28",
        difficulty: "intermediate",
      };
    }
  }

  if (context.templateType === "test-task") {
    if (context.grade === 2) {
      return {
        templateType: "test-task",
        problem: "32 − 7",
        options: ["24", "25", "26", "27"],
        correctAnswerIndex: 2,
        explanation: "32 − 7: позаимствай 1 десетица. 12 − 7 = 5, и 2 − 1 = 1. Отговор: 25",
        difficulty: "intermediate",
      };
    }
  }

  return null;
};

/**
 * Multiplication template (Grade 2+, Grade 5+)
 */
const generateMultiplicationTask = (context: TaskGenerationContext): Task | null => {
  if (context.grade === 2) {
    if (context.templateType === "solved-example") {
      return {
        templateType: "solved-example",
        problem: "4 реда по 3 стола. Колко стола общо?",
        steps: [
          "Умножението е многократно събиране.",
          "Добавяме 3 точно 4 пъти:",
          "3 + 3 + 3 + 3 = 12",
          "Значи: 4 × 3 = 12",
        ],
        explanation: "Умножението е многократно събиране. Вместо да събираме многократно, използваме знака ×.",
        finalAnswer: "12",
        reasoning: "4 групи по 3 = 3 + 3 + 3 + 3 = 12",
        difficulty: "beginner",
      };
    }
    if (context.templateType === "guided-practice") {
      return {
        templateType: "guided-practice",
        problem: "3 кутии с по 2 бонбона. Колко бонбона?",
        hint: "Помисли: добавяй 2 три пъти: 2 + 2 + 2",
        stepGuidance: [
          "Колко групи имаме?",
          "Колко има във всяка група?",
          "Събери: 2 + 2 + 2 = ?",
          "Запиши: 3 × 2 = ?",
        ],
        expectedAnswer: "6",
        difficulty: "beginner",
      };
    }
    if (context.templateType === "independent-practice") {
      return {
        templateType: "independent-practice",
        problem: "2 × 5 = ?",
        expectedAnswer: "10",
        answerValidation: "exact-match",
        difficulty: "beginner",
      };
    }
    if (context.templateType === "test-task") {
      return {
        templateType: "test-task",
        problem: "5 деца, всяко има по 3 моливи. Колко молива общо?",
        options: ["8", "15", "12", "10"],
        correctAnswerIndex: 1,
        explanation: "5 × 3: добавяме 3 пет пъти: 3 + 3 + 3 + 3 + 3 = 15",
        difficulty: "beginner",
      };
    }
  }

  if (context.grade === 5) {
    if (context.templateType === "solved-example") {
      return {
        templateType: "solved-example",
        problem: "12 × 5",
        steps: [
          "Разделяме 12 на 10 и 2.",
          "10 × 5 = 50",
          "2 × 5 = 10",
          "50 + 10 = 60",
        ],
        explanation: "Разлагаме числото и умножаваме по части.",
        finalAnswer: "60",
        reasoning: "12 × 5 = (10 + 2) × 5 = 50 + 10 = 60",
        difficulty: "intermediate",
      };
    }
  }

  return null;
};

/**
 * Division template (Grade 3+, Grade 5+)
 */
const generateDivisionTask = (context: TaskGenerationContext): Task | null => {
  if (context.grade === 5) {
    if (context.templateType === "solved-example") {
      return {
        templateType: "solved-example",
        problem: "48 ÷ 4",
        steps: [
          "Питаме: 4 влиза в 48 колко пъти?",
          "4 × 10 = 40 (твърде малко)",
          "4 × 12 = 48 (точно!)",
          "Отговор: 12",
        ],
        explanation: "Деленето е обратното на умножението.",
        finalAnswer: "12",
        reasoning: "4 × 12 = 48, следователно 48 ÷ 4 = 12",
        difficulty: "intermediate",
      };
    }
  }

  return null;
};

/**
 * Decimal fractions template (Grade 5)
 */
const generateDecimalTask = (context: TaskGenerationContext): Task | null => {
  if (context.grade === 5) {
    if (context.templateType === "solved-example") {
      return {
        templateType: "solved-example",
        problem: "2.5 + 3.4",
        steps: [
          "Подравняме десетичните запетаи.",
          "Събираме как обикновено: 2.5 + 3.4",
          "Единици: 2 + 3 = 5",
          "Десети: 5 + 4 = 9 десети = 0.9",
        ],
        explanation: "При събиране на десетични дроби подравняме запетаите и събираме по позиции.",
        finalAnswer: "5.9",
        reasoning: "2 + 3 = 5, 0.5 + 0.4 = 0.9, общо 5.9",
        difficulty: "intermediate",
      };
    }
  }

  return null;
};

/**
 * Word problem template (Grade 2 & 5)
 */
const generateWordProblemTask = (context: TaskGenerationContext): Task | null => {
  if (context.templateType === "word-problem") {
    if (context.grade === 2) {
      return {
        templateType: "word-problem",
        story: "Мария имаше 15 стикера. Купи още 8 стикера. Колко стикера има сега?",
        operation: "addition",
        operationDisplay: "15 + 8",
        stepByStep: [
          "Имаме: 15 стикера",
          "Добавяме: 8 стикера",
          "Правим събиране: 15 + 8 = 23",
        ],
        result: "23 стикера",
        reasoning: "Когато добавяме, правим събиране.",
        difficulty: "beginner",
      };
    }

    if (context.grade === 5) {
      return {
        templateType: "word-problem",
        story: "34 стикера се разделят поравно между 26 деца. Колко получава всяко дете?",
        operation: "division",
        operationDisplay: "34 ÷ 26",
        stepByStep: [
          "Имаме 34 стикера",
          "Разделяме между 26 деца",
          "Правим деление: 34 ÷ 26 = 1 остатък 8",
          "26 влиза в 34 → 1 път",
          "26 × 1 = 26",
          "Остават: 34 − 26 = 8",
        ],
        result: "Всяко дете получава 1 стикер, остават 8 стикера",
        reasoning: "Деленето разпределя количеството поравно между групи.",
        difficulty: "intermediate",
      };
    }
  }

  return null;
};

/* ── Template Validation ── */

/**
 * Validate that a template is appropriate for a grade
 */
export const isTemplateValidForGrade = (
  task: Task,
  grade: Grade,
  topicId: string
): boolean => {
  // Check if difficulty matches grade
  const topicDifficulty = getTopicDifficulty(topicId, grade);
  if (!topicDifficulty) return false;

  // Check if content type is allowed for grade
  if (task.templateType === "word-problem") {
    const wordTask = task as WordProblemTemplate;
    // Decimals only for grade 5+
    if (wordTask.operationDisplay.includes(".") && !isContentTypeAllowed(grade, "decimals")) {
      return false;
    }
  }

  return true;
};

/* ── Template Selection Helpers ── */

/**
 * Get appropriate template types for a difficulty level
 */
export const getTemplateTypesForDifficulty = (
  difficulty: "beginner" | "intermediate" | "advanced"
): TemplateType[] => {
  switch (difficulty) {
    case "beginner":
      return ["solved-example", "guided-practice"];
    case "intermediate":
      return ["guided-practice", "independent-practice", "test-task"];
    case "advanced":
      return ["independent-practice", "test-task"];
  }
};

/**
 * Check if a template type is available for a grade and topic
 */
export const isTemplateTypeAvailable = (
  grade: Grade,
  topic: string,
  templateType: TemplateType
): boolean => {
  // Grade 2 math has all basic template types except word-problem (which is separate)
  if (grade === 2 && ["addition", "subtraction", "multiplication"].includes(topic)) {
    return ["solved-example", "guided-practice", "independent-practice", "test-task"].includes(templateType);
  }

  // Grade 5 math has all types
  if (grade === 5) {
    return true;
  }

  return false;
};
