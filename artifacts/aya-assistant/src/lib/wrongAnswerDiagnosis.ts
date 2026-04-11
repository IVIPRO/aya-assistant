/**
 * Wrong Answer Diagnosis — Phase 5.2
 * 
 * Rule-based mistake detection for math tasks.
 * Analyzes wrong answers and suggests likely error types.
 * 
 * Scope: Grades 2 & 5 mathematics
 */

import type { Grade } from "./curriculumMap";

export type ErrorType =
  // Grade 2 errors
  | "wrong-counting"
  | "forgot-carrying"
  | "digit-reversal"
  | "wrong-operation-addition"
  | "wrong-operation-subtraction"
  | "word-problem-misunderstanding"
  | "off-by-one"
  | "off-by-ten"
  // Grade 5 errors
  | "decimal-alignment"
  | "decimal-logic"
  | "wrong-operation-general"
  | "algebra-sign-error"
  | "algebra-movement-error"
  | "fraction-confusion"
  | "decimal-comparison"
  | "word-problem-operation"
  | "arithmetic-slip"
  | "unknown";

export interface DiagnosisResult {
  errorType: ErrorType;
  explanation: string; // Bulgarian explanation
  hint?: string; // Optional hint
  confidence: "high" | "medium" | "low"; // How confident is diagnosis
}

/* ── Grade 2 Diagnosis ── */

const diagnoseGrade2Math = (
  topic: string,
  question: string,
  correct: string,
  userAnswer: string
): DiagnosisResult => {
  const correctNum = parseInt(correct);
  const userNum = parseInt(userAnswer);

  // Off-by-one errors
  if (Math.abs(userNum - correctNum) === 1) {
    return {
      errorType: "off-by-one",
      explanation: "Изглежда си отговорил само с един номер повече или по-малко. Мога ли да проверим отново?",
      confidence: "medium",
    };
  }

  // Off-by-ten errors
  if (Math.abs(userNum - correctNum) === 10) {
    return {
      errorType: "off-by-ten",
      explanation: "Изглежда си имал грешка с десетиците. Събирай цифрите на място (единици, десетици).",
      confidence: "high",
    };
  }

  // Multiplication topic — explain as repeated addition (Grade 2 MON curriculum)
  if (topic === "multiplication") {
    const numbers = question.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const mul_a = parseInt(numbers[0]);
      const mul_b = parseInt(numbers[1]);
      const addends = Array(mul_a).fill(mul_b).join(" + ");
      return {
        errorType: "wrong-counting",
        explanation: `Умножението е многократно събиране. ${mul_a} × ${mul_b} означава да добавяш ${mul_b} точно ${mul_a} пъти:\n${addends} = ${mul_a * mul_b}`,
        confidence: "high",
      };
    }
    return {
      errorType: "wrong-counting",
      explanation: "Умножението е многократно събиране. Нека проверим стъпка по стъпка.",
      confidence: "medium",
    };
  }

  // Addition topic
  if (topic === "addition") {
    // Concatenation instead of addition (e.g., 46 + 27 = 613)
    if (userAnswer.includes(question.split("+")[0]?.trim() || "") || userAnswer.length > correct.length + 1) {
      return {
        errorType: "forgot-carrying",
        explanation: "Изглежда си събрал цифрите, но не си подредил единици и десетици правилно. Събирай първо единиците, после десетиците.",
        confidence: "high",
      };
    }

    // Simple wrong counting
    return {
      errorType: "wrong-counting",
      explanation: "Результатът не е верен. Събирам отново стъпка по стъпка: първо единици, после десетици.",
      confidence: "low",
    };
  }

  // Subtraction topic
  if (topic === "subtraction") {
    // Chose addition instead of subtraction
    const numbers = question.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const a = parseInt(numbers[0]);
      const b = parseInt(numbers[1]);
      if (userNum === a + b) {
        return {
          errorType: "wrong-operation-subtraction",
          explanation: "Вероятно си събрал вместо да вадиш. Когато видиш − знак, трябва да ВАДИШ, не да събираш.",
          hint: `${a} − ${b} означава ${a} минус ${b}`,
          confidence: "high",
        };
      }
    }

    return {
      errorType: "wrong-counting",
      explanation: "Резултатът не е верен. Ваделе отново стъпка по стъпка.",
      confidence: "low",
    };
  }

  // Word problems
  if (topic === "word-problems") {
    return {
      errorType: "word-problem-misunderstanding",
      explanation: "Нека прочетем задачата внимателно и да проверим коя операция е нужна (събиране или вадене).",
      confidence: "medium",
    };
  }

  // Default fallback
  return {
    errorType: "unknown",
    explanation: "Нека опитаме стъпка по стъпка и проверим отново.",
    confidence: "low",
  };
};

/* ── Grade 5 Diagnosis ── */

const diagnoseGrade5Math = (
  topic: string,
  question: string,
  correct: string,
  userAnswer: string
): DiagnosisResult => {
  // Decimal topics
  if (topic === "decimal-fractions") {
    // Decimal alignment/shifting (e.g., 3.4 + 3.1 = 34.1)
    if (question.includes(".") && userAnswer.includes(".")) {
      const correctDec = parseFloat(correct);
      const userDec = parseFloat(userAnswer);

      // Check if decimal point is misplaced
      if (Math.abs(userDec - correctDec) > 1 && Math.abs(userDec - correctDec * 10) < 0.1) {
        return {
          errorType: "decimal-alignment",
          explanation: "При десетичните числа събираме цели части с цели части и десети с десети. Подравни запетаите преди събирането.",
          hint: "Запетаята трябва да е всички числа на един и същи ред.",
          confidence: "high",
        };
      }

      // Decimal ignored
      if (!userAnswer.includes(".")) {
        return {
          errorType: "decimal-logic",
          explanation: "Забрави си десетичната запетая. При операции с десетични числа, запетаята е важна!",
          confidence: "high",
        };
      }

      // General decimal mistake
      return {
        errorType: "decimal-logic",
        explanation: "При десетичните числа внимавай на позицията на запетаята. Събирай колона по колона.",
        confidence: "medium",
      };
    }
  }

  // Algebra
  if (topic === "algebra-basics" || topic.includes("algebra")) {
    // Sign errors (e.g., x + 5 = 12, answer 17 instead of 7)
    const equationMatch = question.match(/([+-]?\d+)/g);
    if (equationMatch && equationMatch.length >= 2) {
      const term = parseInt(equationMatch[equationMatch.length - 1]);
      const correctNum = parseInt(correct);
      const userNum = parseInt(userAnswer);

      // Check if student added instead of subtracting (or vice versa)
      if (userNum === correctNum + 2 * term || userNum === correctNum - 2 * term) {
        return {
          errorType: "algebra-sign-error",
          explanation: "При уравнения, трябва да преместиш числото на другата страна и да промениш знака. Ако е +, става −, ако е −, става +.",
          hint: "x + 5 = 12 → x = 12 − 5",
          confidence: "high",
        };
      }
    }

    return {
      errorType: "algebra-sign-error",
      explanation: "При решаване на уравнения, внимавай за знаците. Когато преместваш число, знакът се променя.",
      confidence: "medium",
    };
  }

  // Fractions
  if (topic === "common-fractions" || topic.includes("fraction")) {
    return {
      errorType: "fraction-confusion",
      explanation: "При дроби, числителят е горе (частите), знаменателят е долу (всичко). Събирай числители с числители, знаменатели със знаменатели.",
      confidence: "medium",
    };
  }

  // Word problems
  if (topic === "word-problems" || topic === "word-problems-5grade") {
    return {
      errorType: "word-problem-operation",
      explanation: "Нека прочетем задачата внимателно и да определим коя операция е нужна. Ключови думи: 'разделят' = деление, 'всяка група' = умножение, 'общо' = събиране.",
      confidence: "medium",
    };
  }

  // Multiplication/Division general
  if (topic === "multiplication" || topic === "division") {
    return {
      errorType: "wrong-operation-general",
      explanation: "Резултатът не е верен. Проверим операцията стъпка по стъпка.",
      confidence: "low",
    };
  }

  // Default fallback for grade 5
  return {
    errorType: "unknown",
    explanation: "Нека опитаме стъпка по стъпка и да проверим коя операция е нужна.",
    confidence: "low",
  };
};

/* ── Main Diagnosis Function ── */

export const diagnoseWrongAnswer = (params: {
  grade: Grade;
  topic: string;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  taskType?: "arithmetic" | "word-problem" | "multiple-choice";
}): DiagnosisResult => {
  try {
    if (params.grade === 2) {
      return diagnoseGrade2Math(params.topic, params.question, params.correctAnswer, params.userAnswer);
    }

    if (params.grade === 5) {
      return diagnoseGrade5Math(params.topic, params.question, params.correctAnswer, params.userAnswer);
    }

    // Fallback for other grades (shouldn't happen in Phase 5.2 scope)
    return {
      errorType: "unknown",
      explanation: "Нека проверим отново.",
      confidence: "low",
    };
  } catch (error) {
    // Never crash - return safe diagnosis
    console.debug("[Diagnosis] Error during diagnosis:", error);
    return {
      errorType: "unknown",
      explanation: "Нека опитаме стъпка по стъпка.",
      confidence: "low",
    };
  }
};

/**
 * Format diagnosis result for UI display
 */
export const formatDiagnosisForDisplay = (diagnosis: DiagnosisResult): string => {
  let output = diagnosis.explanation;

  if (diagnosis.hint) {
    output += `\n\n💡 Съвет: ${diagnosis.hint}`;
  }

  return output;
};

/**
 * Determine if diagnosis should be shown (confidence check)
 */
export const shouldShowDiagnosis = (diagnosis: DiagnosisResult): boolean => {
  // Always show diagnosis - even "low confidence" is helpful
  return diagnosis.explanation.length > 0;
};
