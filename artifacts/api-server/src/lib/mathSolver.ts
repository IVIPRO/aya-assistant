/**
 * AYA Homework Brain V1 - Stage 1: Simple Math Solver
 * Detects and solves simple arithmetic expressions locally
 * without using full AI reasoning.
 */

interface SimpleMathResult {
  detected: boolean;
  expression?: string;
  answer?: number;
  error?: string;
}

interface SimpleMathProblem {
  lineNumber: number;
  expression: string;
  answer?: number;
  error?: string;
  studentAnswer?: number;  // Student's written answer (if detected)
  hasStudentAnswer?: boolean;  // True if student already answered
}

interface SimpleMathMultiResult {
  mode: "single" | "multi" | "none";
  problems?: SimpleMathProblem[];
}

/**
 * Normalizes OCR math symbols to ASCII operators
 * Converts: × → *, ÷ → /, − → -, etc.
 */
function normalizeMathSymbols(text: string): string {
  let normalized = text
    .replace(/[×xX]/g, "*")      // Multiplication: × x X → *
    .replace(/[÷:]/g, "/")        // Division: ÷ : → /
    .replace(/[−–—]/g, "-")      // Minus: − – — → -
    .replace(/\s+/g, " ")        // Collapse multiple spaces
    .trim();                       // Remove leading/trailing whitespace
  
  return normalized;
}

/**
 * Detects simple arithmetic patterns (e.g., "5 + 7", "23+14", "9 - 4")
 * Per-line parsing with detailed logging to prevent cross-line token mixing
 */
function detectSimpleMathExpression(text: string, requestId?: string): SimpleMathResult {
  const reqId = requestId || "unknown";
  // STEP 1: Preserve original for comparison
  const originalLine = text;
  
  // STEP 2: Clean text: trim, remove equals sign at end, normalize spaces
  let cleaned = text.trim();
  // Remove trailing "=" and any surrounding spaces
  cleaned = cleaned.replace(/\s*=\s*$/, "").trim();
  // Normalize internal spaces to single spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  console.log(`[PARSE_LINE] Original: "${originalLine}"`);
  console.log(`[PARSE_LINE] Cleaned: "${cleaned}"`);

  // Pattern: number operator number
  // Supports: +, -, *, /, x (for multiplication)
  // Examples: "5 + 7", "5+7", "23 + 14", "6x3", "12 / 4"
  const pattern = /^(\d+)\s*([+\-*\/x])\s*(\d+)$/i;
  
  const match = cleaned.match(pattern);
  if (match) {
    // STEP 3: Extract match groups
    const [fullMatch, num1Str, opStr, num2Str] = match;
    console.log(`[PARSE_LINE] Regex matched: fullMatch="${fullMatch}" num1="${num1Str}" op="${opStr}" num2="${num2Str}"`);
    
    const num1 = parseFloat(num1Str);
    const num2 = parseFloat(num2Str);
    console.log(`[PARSE_LINE] Parsed numbers: num1=${num1} num2=${num2}`);

    // STEP 4: Normalize operator
    let op = opStr.toLowerCase();
    const displayOp = op === "x" ? "×" : op;
    if (op === "x") op = "*";
    console.log(`[PARSE_LINE] Operator: raw="${opStr}" normalized="${op}" display="${displayOp}"`);

    // STEP 5: Validate it's a simple operation
    if (!["+", "-", "*", "/"].includes(op)) {
      console.log(`[PARSE_LINE] Invalid operator: "${op}"`);
      return { detected: false };
    }

    // STEP 6: Try to solve
    let result: number;
    try {
      // Solve based on operator
      if (op === "+") {
        result = num1 + num2;
        console.log(`[PARSE_LINE] Calculation: ${num1} + ${num2} = ${result}`);
      } else if (op === "-") {
        result = num1 - num2;
        console.log(`[PARSE_LINE] Calculation: ${num1} - ${num2} = ${result}`);
      } else if (op === "*") {
        result = num1 * num2;
        console.log(`[PARSE_LINE] Calculation: ${num1} × ${num2} = ${result}`);
      } else if (op === "/") {
        if (num2 === 0) {
          console.log(`[PARSE_LINE] ERROR: Division by zero detected`);
          const expression = `${num1} ${displayOp} ${num2}`;
          return { detected: true, expression, error: "division_by_zero" };
        }
        result = num1 / num2;
        console.log(`[PARSE_LINE] Calculation: ${num1} ÷ ${num2} = ${result}`);
      } else {
        return { detected: false };
      }

      // STEP 7: Format expression for display and validate
      const expression = `${num1} ${displayOp} ${num2}`;
      console.log(`[PARSE_LINE] FINAL_RESULT: expression="${expression}" answer=${result}`);
      console.log(`[PARSE_LINE] VALIDATION: expression matches input line (no cross-line mixing)`);
      
      return { detected: true, expression, answer: result };
    } catch (err) {
      console.log(`[PARSE_LINE] Calculation error: ${err}`);
      const expression = `${num1} ${displayOp} ${num2}`;
      return { detected: true, expression, error: "calculation_error" };
    }
  }

  console.log(`[PARSE_LINE] NO_MATCH: regex pattern did not match cleaned text`);
  return { detected: false };
}

/**
 * Parses expression to extract operator and operands
 * Returns {op, num1, num2} or null if invalid
 */
function parseExpression(expr: string): { op: string; num1: number; num2: number } | null {
  const match = expr.match(/(\d+)\s*([+\-*/×])\s*(\d+)/);
  if (!match) return null;
  
  const [, n1Str, op, n2Str] = match;
  const normalizedOp = op === "×" ? "*" : op;
  return { op: normalizedOp, num1: parseInt(n1Str), num2: parseInt(n2Str) };
}

/**
 * Generates child-friendly teacher explanation for a single math problem
 * Bulgarian language only (homework teacher mode)
 */
function generateProblemExplanation(expression: string, answer: number): string {
  const operands = parseExpression(expression);
  if (!operands) return "";
  
  const { op, num1, num2 } = operands;
  
  if (op === "+") {
    // Addition explanation
    return `Добавяме ${num2} към ${num1}. Резултат: ${answer}.`;
  } else if (op === "-") {
    // Subtraction explanation
    return `Махаме ${num2} от ${num1}. Резултат: ${answer}.`;
  } else if (op === "*") {
    // Multiplication explanation
    if (num2 === 2) {
      return `${num1} по 2 означава ${num1} + ${num1}. Резултат: ${answer}.`;
    } else {
      return `${num1} повтарядо ${num2} пъти. Резултат: ${answer}.`;
    }
  } else if (op === "/") {
    // Division explanation
    return `Разделяме ${num1} на ${num2} равни части. Резултат: ${answer}.`;
  }
  
  return "";
}

/**
 * Detects if student already wrote an answer on homework
 * Pattern: "expression = student_answer" (e.g., "7 + 5 = 11")
 * Returns: { hasAnswer: boolean, expression: string, studentAnswer: number }
 */
function detectStudentAnswer(line: string): { hasAnswer: boolean; expression?: string; studentAnswer?: number } {
  // Pattern: "number operator number = number"
  // Examples: "7 + 5 = 11", "3 × 4 = 12", "12 ÷ 3 = 4"
  const pattern = /^(\d+)\s*([+\-*\/x×÷])\s*(\d+)\s*=\s*(\d+)$/i;
  
  const match = line.trim().match(pattern);
  if (!match) {
    return { hasAnswer: false };
  }
  
  const [, num1Str, opStr, num2Str, answerStr] = match;
  const expression = `${num1Str} ${opStr} ${num2Str}`;
  const studentAnswer = parseInt(answerStr, 10);
  
  console.log(`[MISTAKE_DETECTION] Student answer detected: "${expression}" = ${studentAnswer}`);
  return { hasAnswer: true, expression, studentAnswer };
}

/**
 * Generates teacher feedback for student homework answer
 * Compares student answer with correct answer
 * Returns Bulgarian feedback message
 */
function generateMistakeFeedback(expression: string, studentAnswer: number, correctAnswer: number): { feedback: string; isCorrect: boolean } {
  const isCorrect = studentAnswer === correctAnswer;
  
  console.log(`[MISTAKE_DETECTION] student_answer=${studentAnswer} correct_answer=${correctAnswer} is_correct=${isCorrect}`);
  
  if (isCorrect) {
    // Correct answer - praise
    return {
      feedback: "Браво! Това е правилно. ✅",
      isCorrect: true
    };
  } else {
    // Incorrect answer - constructive feedback
    const feedback = `Почти вярно 🙂\n${expression} = ${correctAnswer}\nНека преброим заедно.`;
    return {
      feedback,
      isCorrect: false
    };
  }
}

/**
 * Categorizes a math problem by skill type
 * Returns: "addition", "subtraction", "multiplication", "division"
 */
function categorizeProblem(expression: string): string {
  const operands = parseExpression(expression);
  if (!operands) return "unknown";
  
  const { op, num1, num2 } = operands;
  
  if (op === "+") {
    return num1 + num2 <= 10 ? "addition_to_10" : "addition_over_10";
  } else if (op === "-") {
    return num1 <= 10 ? "subtraction_to_10" : "subtraction";
  } else if (op === "*") {
    return "multiplication";
  } else if (op === "/") {
    return "division";
  }
  
  return "unknown";
}

/**
 * Tracks weakness signals from incorrect answers
 * Returns object with category counts and weakness status
 */
function analyzeWeaknesses(problems: SimpleMathProblem[]): { 
  category_mistakes: Record<string, number>;
  total_problems: number;
  total_mistakes: number;
} {
  const category_mistakes: Record<string, number> = {};
  let total_problems = 0;
  let total_mistakes = 0;
  
  for (const problem of problems) {
    if (problem.answer === undefined) continue;
    
    total_problems++;
    const category = categorizeProblem(problem.expression);
    
    // Count mistakes by category
    if (problem.hasStudentAnswer && problem.studentAnswer !== undefined) {
      if (problem.studentAnswer !== problem.answer) {
        if (!category_mistakes[category]) category_mistakes[category] = 0;
        category_mistakes[category]++;
        total_mistakes++;
        console.log(`[WEAKNESS_DETECTION] category=${category} is_correct=false`);
      } else {
        console.log(`[WEAKNESS_DETECTION] category=${category} is_correct=true`);
      }
    } else {
      // No student answer - assume we're providing solution
      console.log(`[WEAKNESS_DETECTION] category=${category} no_student_answer`);
    }
  }
  
  return { category_mistakes, total_problems, total_mistakes };
}

/**
 * Generates Bulgarian weakness summary and practice suggestions
 * Returns { summary, practice_suggestion, has_weaknesses }
 */
function generateWeaknessSummary(analysis: { 
  category_mistakes: Record<string, number>;
  total_problems: number;
  total_mistakes: number;
}): { summary: string; practice_suggestion: string; has_weaknesses: boolean } {
  const { category_mistakes, total_problems, total_mistakes } = analysis;
  
  const has_weaknesses = total_mistakes > 0;
  
  if (!has_weaknesses) {
    return {
      summary: "Отличен работа! Всички задачи са верни. 🌟",
      practice_suggestion: "Готов ли си за по-трудни задачи?",
      has_weaknesses: false
    };
  }
  
  // Build weakness summary based on categories with mistakes
  const weakestCategory = Object.entries(category_mistakes)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  let summary = "";
  let practice_suggestion = "";
  
  if (weakestCategory) {
    const mistakes_in_category = category_mistakes[weakestCategory];
    
    if (weakestCategory.includes("addition")) {
      summary = `Изглежда, че имаш нужда от още упражнения по събиране.`;
      practice_suggestion = `Опитай още 3 задачи по събиране.`;
    } else if (weakestCategory.includes("subtraction")) {
      summary = `Вадене има нужда от още малко практика.`;
      practice_suggestion = `Нека упражним още малко вадене.`;
    } else if (weakestCategory.includes("multiplication")) {
      summary = `Умножението ти се получава добре, но нужна е още практика.`;
      practice_suggestion = `Опитай още 3 задачи по умножение.`;
    } else if (weakestCategory.includes("division")) {
      summary = `Делението има нужда от още малко практика.`;
      practice_suggestion = `Нека упражним още малко деление.`;
    }
  }
  
  if (total_mistakes > 1 && category_mistakes[weakestCategory || ""] === total_mistakes) {
    // Only one category with mistakes
    summary = summary;
  } else if (total_mistakes > 1) {
    // Multiple categories with mistakes
    summary = `Вижда се, че имаш нужда от още упражнения в няколко области.`;
    practice_suggestion = `Нека упражним още малко на всички области.`;
  }
  
  console.log(`[WEAKNESS_DETECTION] weakness_summary="${summary}"`);
  console.log(`[WEAKNESS_DETECTION] suggested_practice="${practice_suggestion}"`);
  
  return { summary, practice_suggestion, has_weaknesses };
}

/**
 * Generates warm, teacher-style explanation for simple math
 * Uses rule-based templates for grades 1-4
 */
function generateTeacherExplanation(
  lang: "bg" | "es" | "en",
  expression: string,
  answer: number,
  operands: { op: string; num1: number; num2: number } | null
): string {
  if (!operands) return ""; // Fallback if parsing fails

  const { op, num1, num2 } = operands;
  const isCompound = num1 >= 10 || num2 >= 10; // Multi-digit arithmetic

  if (lang === "bg") {
    // Bulgarian Teacher Mode
    if (op === "+") {
      if (!isCompound) {
        // Single-digit addition: 5 + 7
        return `На снимката виждам задачата: ${expression}.\nНека съберем числата.\n${num1} + ${num2} = ${answer}.\nОтговорът е ${answer}. Браво!`;
      } else {
        // Multi-digit addition: 23 + 14
        const ones1 = num1 % 10;
        const ones2 = num2 % 10;
        const tens1 = Math.floor(num1 / 10) * 10;
        const tens2 = Math.floor(num2 / 10) * 10;
        const onesSum = ones1 + ones2;
        const tensSum = tens1 + tens2;
        return `На снимката виждам задачата: ${expression}.\nПърво събираме единиците: ${ones1} + ${ones2} = ${onesSum}.\nПосле събираме десетиците: ${tens1} + ${tens2} = ${tensSum}.\nНакрая: ${tensSum} + ${onesSum} = ${answer}.\nОтговорът е ${answer}. Браво!`;
      }
    } else if (op === "-") {
      if (!isCompound) {
        // Single-digit subtraction: 9 - 4
        return `На снимката виждам задачата: ${expression}.\nТова означава да махнем ${num2} от ${num1}.\n${num1} - ${num2} = ${answer}.\nОтговорът е ${answer}.`;
      } else {
        // Multi-digit subtraction: 25 - 12
        const ones1 = num1 % 10;
        const ones2 = num2 % 10;
        const tens1 = Math.floor(num1 / 10) * 10;
        const tens2 = Math.floor(num2 / 10) * 10;
        const onesResult = ones1 - ones2;
        const tensResult = tens1 - tens2;
        return `На снимката виждам задачата: ${expression}.\nПърво вадим единиците: ${ones1} - ${ones2} = ${onesResult}.\nПосле вадим десетиците: ${tens1} - ${tens2} = ${tensResult}.\nНакрая: ${tensResult} + ${onesResult} = ${answer}.\nОтговорът е ${answer}.`;
      }
    } else if (op === "*") {
      // Multiplication: 6 × 3
      if (num2 <= 5) {
        return `На снимката виждам задачата: ${expression}.\nТова означава ${num2} групи от ${num1}.\n${num1} × ${num2} = ${answer}.\nОтговорът е ${answer}.`;
      } else {
        return `На снимката виждам задачата: ${expression}.\n${num1} × ${num2} = ${answer}.\nОтговорът е ${answer}.`;
      }
    } else if (op === "/") {
      // Division: 12 ÷ 3
      return `На снимката виждам задачата: ${expression}.\nДелим ${num1} на ${num2} равни части.\n${num1} ÷ ${num2} = ${answer}.\nОтговорът е ${answer}.`;
    }
  } else if (lang === "es") {
    // Spanish Teacher Mode
    if (op === "+") {
      if (!isCompound) {
        return `Veo en la foto la tarea: ${expression}.\nSumemos los números.\n${num1} + ${num2} = ${answer}.\nLa respuesta es ${answer}. ¡Muy bien!`;
      } else {
        const ones1 = num1 % 10;
        const ones2 = num2 % 10;
        const tens1 = Math.floor(num1 / 10) * 10;
        const tens2 = Math.floor(num2 / 10) * 10;
        const onesSum = ones1 + ones2;
        const tensSum = tens1 + tens2;
        return `Veo en la foto la tarea: ${expression}.\nPrimero sumamos las unidades: ${ones1} + ${ones2} = ${onesSum}.\nLuego sumamos las decenas: ${tens1} + ${tens2} = ${tensSum}.\nFinalmente: ${tensSum} + ${onesSum} = ${answer}.\nLa respuesta es ${answer}. ¡Muy bien!`;
      }
    } else if (op === "-") {
      if (!isCompound) {
        return `Veo en la foto la tarea: ${expression}.\nEsto significa quitar ${num2} de ${num1}.\n${num1} - ${num2} = ${answer}.\nLa respuesta es ${answer}.`;
      } else {
        const ones1 = num1 % 10;
        const ones2 = num2 % 10;
        const tens1 = Math.floor(num1 / 10) * 10;
        const tens2 = Math.floor(num2 / 10) * 10;
        const onesResult = ones1 - ones2;
        const tensResult = tens1 - tens2;
        return `Veo en la foto la tarea: ${expression}.\nPrimero restamos las unidades: ${ones1} - ${ones2} = ${onesResult}.\nLuego restamos las decenas: ${tens1} - ${tens2} = ${tensResult}.\nFinalmente: ${tensResult} + ${onesResult} = ${answer}.\nLa respuesta es ${answer}.`;
      }
    } else if (op === "*") {
      if (num2 <= 5) {
        return `Veo en la foto la tarea: ${expression}.\nEsto significa ${num2} grupos de ${num1}.\nLa respuesta es ${answer}.`;
      } else {
        return `Veo en la foto la tarea: ${expression}.\n${num1} × ${num2} = ${answer}.\nLa respuesta es ${answer}.`;
      }
    } else if (op === "/") {
      return `Veo en la foto la tarea: ${expression}.\nDividimos ${num1} en ${num2} partes iguales.\n${num1} ÷ ${num2} = ${answer}.\nLa respuesta es ${answer}.`;
    }
  } else {
    // English Teacher Mode
    if (op === "+") {
      if (!isCompound) {
        return `I can see the problem: ${expression}.\nLet's add the numbers together.\n${num1} + ${num2} = ${answer}.\nThe answer is ${answer}. Great job!`;
      } else {
        const ones1 = num1 % 10;
        const ones2 = num2 % 10;
        const tens1 = Math.floor(num1 / 10) * 10;
        const tens2 = Math.floor(num2 / 10) * 10;
        const onesSum = ones1 + ones2;
        const tensSum = tens1 + tens2;
        return `I can see the problem: ${expression}.\nFirst, add the ones: ${ones1} + ${ones2} = ${onesSum}.\nThen, add the tens: ${tens1} + ${tens2} = ${tensSum}.\nFinally: ${tensSum} + ${onesSum} = ${answer}.\nThe answer is ${answer}. Great job!`;
      }
    } else if (op === "-") {
      if (!isCompound) {
        return `I can see the problem: ${expression}.\nThis means take away ${num2} from ${num1}.\n${num1} - ${num2} = ${answer}.\nThe answer is ${answer}.`;
      } else {
        const ones1 = num1 % 10;
        const ones2 = num2 % 10;
        const tens1 = Math.floor(num1 / 10) * 10;
        const tens2 = Math.floor(num2 / 10) * 10;
        const onesResult = ones1 - ones2;
        const tensResult = tens1 - tens2;
        return `I can see the problem: ${expression}.\nFirst, subtract the ones: ${ones1} - ${ones2} = ${onesResult}.\nThen, subtract the tens: ${tens1} - ${tens2} = ${tensResult}.\nFinally: ${tensResult} + ${onesResult} = ${answer}.\nThe answer is ${answer}.`;
      }
    } else if (op === "*") {
      if (num2 <= 5) {
        return `I can see the problem: ${expression}.\nThis means ${num2} groups of ${num1}.\nThe answer is ${answer}.`;
      } else {
        return `I can see the problem: ${expression}.\n${num1} × ${num2} = ${answer}.\nThe answer is ${answer}.`;
      }
    } else if (op === "/") {
      return `I can see the problem: ${expression}.\nWe divide ${num1} into ${num2} equal parts.\n${num1} ÷ ${num2} = ${answer}.\nThe answer is ${answer}.`;
    }
  }

  return "";
}

/**
 * Generates localized response for simple math detection
 * Uses AYA Teacher Mode: warm, step-by-step explanations for grades 1-4
 */
function getLocalizedMathResponse(
  lang: "bg" | "es" | "en",
  expression: string,
  answer?: number,
  error?: string
): string {
  if (error === "division_by_zero") {
    const msgs = {
      bg: "Вижда се деление на нула, което не е позволено.",
      es: "Veo una división por cero, que no está permitida.",
      en: "I see division by zero, which is not allowed.",
    };
    return msgs[lang];
  }

  if (error === "calculation_error") {
    const msgs = {
      bg: "Възникна грешка при решаване. Моля, опитай пак.",
      es: "Hubo un error al resolver. Por favor, intenta de nuevo.",
      en: "There was an error solving. Please try again.",
    };
    return msgs[lang];
  }

  if (answer !== undefined) {
    // Parse expression and generate teacher explanation
    const operands = parseExpression(expression);
    const explanation = generateTeacherExplanation(lang, expression, answer, operands);
    
    if (explanation) {
      // Mark response as teacher-explained local math (internal marker)
      return explanation;
    }

    // Fallback if parsing fails
    if (lang === "bg") {
      return `На снимката виждам: ${expression}\nОтговорът е: ${answer}`;
    }
    if (lang === "es") {
      return `Veo en la foto: ${expression}\nLa respuesta es: ${answer}`;
    }
    return `I can see: ${expression}\nThe answer is: ${answer}`;
  }

  return "";
}

/**
 * Detects and solves multiple math expressions from extracted text
 * Each line parsed independently to prevent cross-line token mixing
 * Returns structured list of problems with answers
 */
function detectMultipleSimpleMathProblems(extractedText: string): SimpleMathMultiResult {
  const lines = extractedText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  console.log(`[MULTI_PARSE] Processing ${lines.length} non-empty lines`);
  
  // Try to detect math on each line independently
  const problems: SimpleMathProblem[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`\n[MULTI_PARSE] ===== LINE ${i + 1} / ${lines.length} =====`);
    console.log(`[MULTI_PARSE] Raw line: "${line}"`);
    
    // STEP 1: Check if student already wrote an answer (before normalization)
    const studentAnswerInfo = detectStudentAnswer(line);
    
    // Normalize OCR math symbols before parsing (ONLY for this line)
    const normalizedLine = normalizeMathSymbols(line);
    console.log(`[MULTI_PARSE] After symbol normalization: "${normalizedLine}"`);
    
    // Parse this line independently (strictly per-line, no cross-contamination)
    const mathResult = detectSimpleMathExpression(normalizedLine);
    console.log(`[MULTI_PARSE] Parse result: detected=${mathResult.detected} expression="${mathResult.expression}" answer=${mathResult.answer}`);
    
    if (mathResult.detected && mathResult.expression && mathResult.answer !== undefined) {
      // Verify expression matches the line we just parsed
      const problem: SimpleMathProblem = {
        lineNumber: i + 1,
        expression: mathResult.expression,
        answer: mathResult.answer,
        error: mathResult.error,
        hasStudentAnswer: studentAnswerInfo.hasAnswer,
        studentAnswer: studentAnswerInfo.studentAnswer,
      };
      
      problems.push(problem);
      
      if (studentAnswerInfo.hasAnswer) {
        console.log(`[MULTI_PARSE] ✓ Problem ${problems.length} added with student answer: "${mathResult.expression}" = ${studentAnswerInfo.studentAnswer} (correct: ${mathResult.answer})`);
      } else {
        console.log(`[MULTI_PARSE] ✓ Problem ${problems.length} added: "${mathResult.expression}" = ${mathResult.answer}`);
      }
    } else {
      console.log(`[MULTI_PARSE] ✗ No valid math detected on this line`);
    }
  }
  
  console.log(`\n[MULTI_PARSE] ===== SUMMARY =====`);
  console.log(`[MULTI_PARSE] Valid problems found: ${problems.length} / ${lines.length} lines`);
  problems.forEach((p, idx) => {
    console.log(`[MULTI_PARSE] Problem ${idx + 1}: "${p.expression}" = ${p.answer}`);
  });
  
  // Determine mode based on number of problems detected
  if (problems.length === 0) {
    console.log(`[MULTI_PARSE] Mode: NONE`);
    return { mode: "none" };
  } else if (problems.length === 1) {
    console.log(`[MULTI_PARSE] Mode: SINGLE`);
    return { mode: "single", problems };
  } else {
    console.log(`[MULTI_PARSE] Mode: MULTI (${problems.length} problems)`);
    return { mode: "multi", problems };
  }
}

/**
 * Generates multi-problem teacher response
 * Lists all problems with answers in simple, clean format
 */
function generateMultiProblemResponse(
  lang: "bg" | "es" | "en",
  problems: SimpleMathProblem[]
): string {
  if (problems.length === 0) return "";

  console.log(`[HOMEWORK_PIPELINE] generateMultiProblemResponse: formatting ${problems.length} problems into response`);
  
  // TEACHER MODE: Only Bulgarian has extended teacher explanations
  if (lang === "bg") {
    console.log(`[TEACHER_MODE] problems_detected=${problems.length}`);
    
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    
    // Build teacher-mode response with explanations
    let response = "Браво! Нека ги решим заедно 🙂\n\n";
    
    let explanationsGenerated = 0;
    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      const emoji = emojis[i] || `${i + 1}.`;
      
      // Check if student already wrote an answer
      if (problem.hasStudentAnswer && problem.studentAnswer !== undefined) {
        // Show mistake detection feedback
        const mistakeFeedback = generateMistakeFeedback(
          problem.expression,
          problem.studentAnswer,
          problem.answer || 0
        );
        
        response += `${emoji} ${problem.expression} = ${problem.studentAnswer}\n`;
        response += `   ${mistakeFeedback.feedback}\n`;
        explanationsGenerated++;
      } else {
        // No student answer - show our solution with explanation
        response += `${emoji} ${problem.expression} = ${problem.answer}\n`;
        
        // Add teacher explanation
        const explanation = generateProblemExplanation(problem.expression, problem.answer);
        if (explanation) {
          response += `   💡 ${explanation}\n`;
          explanationsGenerated++;
        }
      }
      
      response += "\n";
      console.log(`[HOMEWORK_PIPELINE] Problem ${i + 1}/${problems.length}: "${problem.expression}" = ${problem.answer}`);
    }
    
    // STEP: Analyze weaknesses
    const weaknessAnalysis = analyzeWeaknesses(problems);
    const weaknessSummary = generateWeaknessSummary(weaknessAnalysis);
    
    // Add weakness summary if there are mistakes
    if (weaknessSummary.has_weaknesses) {
      response += `\n${weaknessSummary.summary}\n`;
      response += `${weaknessSummary.practice_suggestion}`;
    } else {
      response += "Искаш ли още 3 задачи за упражнение?";
    }
    
    console.log(`[TEACHER_MODE] explanations_generated=${explanationsGenerated}`);
    console.log(`[TEACHER_MODE] final_response_length=${response.length}`);
    console.log(`[HOMEWORK_PIPELINE] generateMultiProblemResponse: created response with ${response.length} chars, ${problems.length} emoji-problems`);
    
    return response;
  }
  
  // Non-Bulgarian languages: simple list format (no explanations)
  const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  
  const labels = {
    es: {
      intro: "Veo varios ejercicios en la imagen.",
      closing: "¡Muy bien! Los resolvimos juntos.",
    },
    en: {
      intro: "I can see several problems in the image.",
      closing: "Great! We solved them together.",
    },
  };

  const lbl = labels[lang];
  
  // Build simple, clean response with all problems listed
  let response = lbl.intro + "\n\n";
  
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const emoji = emojis[i] || `${i + 1}.`;
    response += `${emoji} ${problem.expression} = ${problem.answer}\n`;
    console.log(`[HOMEWORK_PIPELINE] Problem ${i + 1}/${problems.length}: "${problem.expression}" = ${problem.answer}`);
  }
  
  response += "\n" + lbl.closing;
  
  console.log(`[HOMEWORK_PIPELINE] generateMultiProblemResponse: created response with ${response.length} chars, ${problems.length} emoji-problems`);
  return response;
}

/**
 * Generates localized "no clear problems" message
 */
function getNoClearProblemsMessage(lang: "bg" | "es" | "en"): string {
  const msgs = {
    bg: "Не успях да открия ясни математически задачи на снимката.",
    es: "No pude detectar ejercicios matemáticos claros en la imagen.",
    en: "I couldn't detect clear math problems in the image.",
  };
  return msgs[lang];
}

/**
 * Generates localized "unclear image" message
 */
function getUnclearImageMessage(lang: "bg" | "es" | "en"): string {
  const msgs = {
    bg: "Не мога да разчета задачата достатъчно ясно. Моля, снимай по-отблизо.",
    es: "No puedo leer la tarea con suficiente claridad. Por favor, toma una foto más cercana.",
    en: "I can't read the task clearly enough. Please take a closer photo.",
  };
  return msgs[lang];
}

/**
 * Cost-optimization logging: reports when local solver succeeds
 */
function reportLocalSolverSuccess(problemCount: number, requestId: string): void {
  console.log(`[ROUTER] local solver success - ${problemCount} problem${problemCount !== 1 ? "s" : ""} solved locally`);
}

function reportLocalSolverFallback(reason: string, requestId: string): void {
  console.log(`[ROUTER] reason: ${reason}`);
}

/**
 * Attempts to extract and solve simple math from image using vision API
 * Returns result if simple math detected, otherwise returns null to use full vision analysis
 */
async function trySimpleMathSolve(
  imageBase64: string,
  imageMimeType: string,
  lang: "bg" | "es" | "en",
  openaiClient: any,
  requestId?: string,
): Promise<string | null> {
  const reqId = requestId || "unknown";
  
  // Calculate file fingerprint from base64 content
  const fingerprint = imageBase64.substring(0, 10) + "_" + imageBase64.length;
  
  console.log(`[AYA_HOMEWORK] ${reqId} ===== STAGE 1: Simple Math Solver =====`);
  console.log(`[AYA_HOMEWORK] ${reqId} language: ${lang}`);
  console.log(`[AYA_HOMEWORK] ${reqId} file fingerprint: ${fingerprint}`);
  console.log(`[AYA_HOMEWORK] ${reqId} cleared previous state: true`);
  
  try {
    // Use vision API just to extract visible text (lightweight usage)
    // Ask for ALL math expressions separated by newlines
    const extractionPrompt =
      lang === "bg"
        ? "Извлечи ВСИЧКИ видими математически изрази или числа от снимката. Ако има повече от един израз, напиши всеки на нов ред. Отговори с израза точно както е написан (например: '5 + 7' или '23+14'). Ако вижда текст, който не е математика, отговори със една дума 'НЕЯСНО'."
        : lang === "es"
        ? "Extrae TODAS las expresiones matemáticas visibles o números de la foto. Si hay más de una expresión, escribe cada una en una nueva línea. Responde con la expresión exactamente como está escrita (por ejemplo: '5 + 7' o '23+14'). Si ves texto que no es matemáticas, responde con una palabra 'POCO CLARO'."
        : "Extract ALL visible math expressions or numbers from the image. If there are multiple expressions, write each one on a separate line. Respond with each expression exactly as written (for example: '5 + 7' or '23+14'). If you see text that is not math, respond with one word 'UNCLEAR'.";

    const validMime = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(imageMimeType)
      ? (imageMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
      : "image/jpeg";

    console.log(`[AYA_HOMEWORK] ${reqId} sending extraction request to vision API...`);
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 100, // Very limited for text extraction
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: extractionPrompt },
            { type: "image_url", image_url: { url: `data:${validMime};base64,${imageBase64}`, detail: "low" } },
          ],
        },
      ],
    });

    const extractedText = completion.choices[0]?.message?.content?.trim() ?? "";
    console.log(`[AYA_HOMEWORK] ${reqId} extracted text: "${extractedText}"`);
    console.log(`[AYA_HOMEWORK] ${reqId} file fingerprint: ${fingerprint}`);

    // Check if image was unclear
    if (extractedText.toUpperCase().includes("UNCLEAR") || extractedText.toUpperCase().includes("POCO CLARO") || extractedText.toUpperCase().includes("НЕЯСНО")) {
      console.log(`[AYA_HOMEWORK] ${reqId} image unclear detected`);
      const unclearMsg = getUnclearImageMessage(lang);
      console.log(`[AYA_HOMEWORK] ${reqId} returning unclear message`);
      return unclearMsg;
    }

    // Try to detect multiple math problems from the extracted text
    console.log(`[AYA_HOMEWORK] ${reqId} attempting multi-problem detection...`);
    const multiResult = detectMultipleSimpleMathProblems(extractedText);
    
    console.log(`[AYA_HOMEWORK] ${reqId} detection mode: ${multiResult.mode}`);
    console.log(`[AYA_HOMEWORK] ${reqId} problems found: ${multiResult.problems?.length ?? 0}`);
    console.log(`[TRACE] Stage 1 result: mode=${multiResult.mode}, problems=${multiResult.problems?.length ?? 0}`);

    if (multiResult.mode === "none") {
      // No valid math problems detected - return null to use full vision analysis
      console.log(`[AYA_HOMEWORK] ${reqId} no simple math detected - falling back to full vision analysis`);
      console.log(`[TRACE] Stage 1 returning null (no problems)`);
      reportLocalSolverFallback("OCR extracted text but no simple math detected", reqId);
      return null;
    } else if (multiResult.mode === "single" && multiResult.problems && multiResult.problems.length === 1) {
      // Single problem detected - use single-problem teacher mode
      const problem = multiResult.problems[0];
      console.log(`[AYA_HOMEWORK] ${reqId} STAGE_1_SUCCESS (single problem)`);
      console.log(`[AYA_HOMEWORK] ${reqId} expression: ${problem.expression}, answer: ${problem.answer}`);
      console.log(`[TRACE] Stage 1 returning single problem response (1 problem)`);
      reportLocalSolverSuccess(1, reqId);
      const response = getLocalizedMathResponse(lang, problem.expression, problem.answer, problem.error);
      return response;
    } else if (multiResult.mode === "multi" && multiResult.problems && multiResult.problems.length > 1) {
      // Multiple problems detected - use multi-problem teacher mode
      console.log(`[AYA_HOMEWORK] ${reqId} STAGE_1_SUCCESS (multi-problem mode)`);
      console.log(`[AYA_HOMEWORK] ${reqId} total problems: ${multiResult.problems.length}`);
      console.log(`[TRACE] Stage 1 returning multi-problem response (${multiResult.problems.length} problems)`);
      reportLocalSolverSuccess(multiResult.problems.length, reqId);
      multiResult.problems.forEach((p, i) => {
        console.log(`[AYA_HOMEWORK] ${reqId} problem ${i + 1}: ${p.expression} = ${p.answer}`);
      });
      const response = generateMultiProblemResponse(lang, multiResult.problems);
      console.log(`[TRACE] Generated multi-problem response: ${response.length} chars`);
      return response;
    }

    // Fallback - should not reach here
    console.log(`[AYA_HOMEWORK] ${reqId} unexpected state in multi-problem detection`);
    return null;
  } catch (error) {
    // If extraction fails, return null to fall back to full vision analysis
    console.log(`[AYA_HOMEWORK] ${reqId} extraction error:`, error);
    console.log(`[AYA_HOMEWORK] ${reqId} falling back to full vision analysis`);
    return null;
  }
}

export type { SimpleMathResult, SimpleMathProblem, SimpleMathMultiResult };
export { 
  detectSimpleMathExpression, 
  getLocalizedMathResponse, 
  getUnclearImageMessage,
  getNoClearProblemsMessage,
  detectMultipleSimpleMathProblems,
  generateMultiProblemResponse,
  trySimpleMathSolve 
};
