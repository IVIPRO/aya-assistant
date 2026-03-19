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
}

interface SimpleMathMultiResult {
  mode: "single" | "multi" | "none";
  problems?: SimpleMathProblem[];
}

/**
 * Detects simple arithmetic patterns (e.g., "5 + 7", "23+14", "9 - 4")
 */
function detectSimpleMathExpression(text: string, requestId?: string): SimpleMathResult {
  const reqId = requestId || "unknown";
  // Clean text: trim, remove equals sign at end, normalize spaces
  let cleaned = text.trim();
  // Remove trailing "=" and any surrounding spaces
  cleaned = cleaned.replace(/\s*=\s*$/, "").trim();
  // Normalize internal spaces to single spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  console.log(`[AYA_HOMEWORK] ${reqId} detectSimpleMathExpression input: "${text}"`);
  console.log(`[AYA_HOMEWORK] ${reqId} cleaned text: "${cleaned}"`);

  // Pattern: number operator number
  // Supports: +, -, *, /, x (for multiplication)
  // Examples: "5 + 7", "5+7", "23 + 14", "6x3", "12 / 4"
  const patterns = [
    // Full pattern with optional spaces: "5 + 7", "5+7", "23 + 14", etc.
    /^(\d+)\s*([+\-*\/x])\s*(\d+)$/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const [, num1Str, opStr, num2Str] = match;
      const num1 = parseFloat(num1Str);
      const num2 = parseFloat(num2Str);

      // Normalize operator
      let op = opStr.toLowerCase();
      const displayOp = op === "x" ? "×" : op;
      if (op === "x") op = "*";

      // Validate it's a simple operation
      if (!["+", "-", "*", "/"].includes(op)) {
        continue;
      }

      // Try to solve
      let result: number;
      try {
        if (op === "+") result = num1 + num2;
        else if (op === "-") result = num1 - num2;
        else if (op === "*") result = num1 * num2;
        else if (op === "/") {
          if (num2 === 0) {
            console.log(`[AYA_HOMEWORK] ${reqId} division by zero detected`);
            return { detected: true, expression: `${num1} ${displayOp} ${num2}`, error: "division_by_zero" };
          }
          result = num1 / num2;
        } else {
          return { detected: false };
        }

        // Format expression for display
        const expression = `${num1} ${displayOp} ${num2}`;

        console.log(`[AYA_HOMEWORK] ${reqId} math detected: expression = ${expression}, answer = ${result}`);
        return { detected: true, expression, answer: result };
      } catch {
        console.log(`[AYA_HOMEWORK] ${reqId} calculation error`);
        return { detected: true, expression: `${num1} ${displayOp} ${num2}`, error: "calculation_error" };
      }
    }
  }

  console.log(`[AYA_HOMEWORK] ${reqId} no simple math detected in: "${cleaned}"`);
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
 * Returns structured list of problems with answers
 */
function detectMultipleSimpleMathProblems(extractedText: string): SimpleMathMultiResult {
  const lines = extractedText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  // Try to detect math on each line
  const problems: SimpleMathProblem[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const mathResult = detectSimpleMathExpression(line);
    
    if (mathResult.detected && mathResult.expression && mathResult.answer !== undefined) {
      problems.push({
        lineNumber: i + 1,
        expression: mathResult.expression,
        answer: mathResult.answer,
        error: mathResult.error,
      });
    }
  }
  
  // Determine mode based on number of problems detected
  if (problems.length === 0) {
    return { mode: "none" };
  } else if (problems.length === 1) {
    return { mode: "single", problems };
  } else {
    return { mode: "multi", problems };
  }
}

/**
 * Generates multi-problem teacher response
 * Lists all problems and encourages thinking first
 */
function generateMultiProblemResponse(
  lang: "bg" | "es" | "en",
  problems: SimpleMathProblem[]
): string {
  if (problems.length === 0) return "";

  const labels = {
    bg: {
      intro: "На снимката виждам няколко задачи:",
      think: "Хайде да помислим заедно.",
      question: "Как мислиш, колко е?",
      answers: "Ето и отговорите:",
    },
    es: {
      intro: "Veo varios ejercicios en la imagen:",
      think: "Vamos a pensarlo juntos.",
      question: "¿Cuál crees que es la respuesta?",
      answers: "Aquí están las respuestas:",
    },
    en: {
      intro: "I can see several problems in the image:",
      think: "Let's think together.",
      question: "What do you think the answer is?",
      answers: "Here are the answers:",
    },
  };

  const lbl = labels[lang];
  
  // Part 1: List all problems and encourage thinking
  let response = lbl.intro + "\n\n";
  
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    response += `${i + 1}. ${problem.expression}\n`;
  }
  
  response += "\n" + lbl.think + "\n\n";
  
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    response += `${i + 1}) ${problem.expression}\n`;
    response += lbl.question + "\n\n";
  }
  
  // Part 2: Provide answers
  response += lbl.answers + "\n\n";
  
  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    response += `${i + 1}) ${problem.expression} = ${problem.answer}\n`;
  }
  
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
    const extractionPrompt =
      lang === "bg"
        ? "Извлечи само видимия математически израз или числа от снимката. Отговори с израза точно както е написан (например: '5 + 7' или '23+14'). Ако вижда текст, който не е математика, отговори със една дума 'НЕЯСНО'."
        : lang === "es"
        ? "Extrae solo la expresión matemática visible o números de la foto. Responde con la expresión exactamente como está escrita (por ejemplo: '5 + 7' o '23+14'). Si ves texto que no es matemáticas, responde con una palabra 'POCO CLARO'."
        : "Extract only the visible math expression or numbers from the image. Respond with the expression exactly as written (for example: '5 + 7' or '23+14'). If you see text that is not math, respond with one word 'UNCLEAR'.";

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

    if (multiResult.mode === "none") {
      // No valid math problems detected - return null to use full vision analysis
      console.log(`[AYA_HOMEWORK] ${reqId} no simple math detected - falling back to full vision analysis`);
      return null;
    } else if (multiResult.mode === "single" && multiResult.problems && multiResult.problems.length === 1) {
      // Single problem detected - use single-problem teacher mode
      const problem = multiResult.problems[0];
      console.log(`[AYA_HOMEWORK] ${reqId} STAGE_1_SUCCESS (single problem)`);
      console.log(`[AYA_HOMEWORK] ${reqId} expression: ${problem.expression}, answer: ${problem.answer}`);
      const response = getLocalizedMathResponse(lang, problem.expression, problem.answer, problem.error);
      return response;
    } else if (multiResult.mode === "multi" && multiResult.problems && multiResult.problems.length > 1) {
      // Multiple problems detected - use multi-problem teacher mode
      console.log(`[AYA_HOMEWORK] ${reqId} STAGE_1_SUCCESS (multi-problem mode)`);
      console.log(`[AYA_HOMEWORK] ${reqId} total problems: ${multiResult.problems.length}`);
      multiResult.problems.forEach((p, i) => {
        console.log(`[AYA_HOMEWORK] ${reqId} problem ${i + 1}: ${p.expression} = ${p.answer}`);
      });
      const response = generateMultiProblemResponse(lang, multiResult.problems);
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
