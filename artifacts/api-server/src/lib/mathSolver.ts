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

/**
 * Detects simple arithmetic patterns (e.g., "5 + 7", "23+14", "9 - 4")
 */
function detectSimpleMathExpression(text: string): SimpleMathResult {
  // Clean text: trim, remove equals sign at end, normalize spaces
  let cleaned = text.trim();
  // Remove trailing "=" and any surrounding spaces
  cleaned = cleaned.replace(/\s*=\s*$/, "").trim();
  // Normalize internal spaces to single spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  console.log("[AYA_HOMEWORK] detectSimpleMathExpression input:", text);
  console.log("[AYA_HOMEWORK] cleaned text:", cleaned);

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
            console.log("[AYA_HOMEWORK] division by zero detected");
            return { detected: true, expression: `${num1} ${displayOp} ${num2}`, error: "division_by_zero" };
          }
          result = num1 / num2;
        } else {
          return { detected: false };
        }

        // Format expression for display
        const expression = `${num1} ${displayOp} ${num2}`;

        console.log("[AYA_HOMEWORK] math detected: expression =", expression, "answer =", result);
        return { detected: true, expression, answer: result };
      } catch {
        console.log("[AYA_HOMEWORK] calculation error");
        return { detected: true, expression: `${num1} ${displayOp} ${num2}`, error: "calculation_error" };
      }
    }
  }

  console.log("[AYA_HOMEWORK] no simple math detected in:", cleaned);
  return { detected: false };
}

/**
 * Generates localized response for simple math detection
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
): Promise<string | null> {
  console.log("[AYA_HOMEWORK] ===== STAGE 1: Simple Math Solver =====");
  console.log("[AYA_HOMEWORK] language:", lang);
  
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

    console.log("[AYA_HOMEWORK] sending extraction request to vision API...");
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
    console.log("[AYA_HOMEWORK] extracted text from image:", extractedText);

    // Check if image was unclear
    if (extractedText.toUpperCase().includes("UNCLEAR") || extractedText.toUpperCase().includes("POCO CLARO") || extractedText.toUpperCase().includes("НЕЯСНО")) {
      console.log("[AYA_HOMEWORK] image unclear detected");
      const unclearMsg = getUnclearImageMessage(lang);
      console.log("[AYA_HOMEWORK] returning unclear message:", unclearMsg);
      return unclearMsg;
    }

    // Try to detect and solve simple math
    const mathResult = detectSimpleMathExpression(extractedText);

    if (mathResult.detected && mathResult.expression) {
      const response = getLocalizedMathResponse(lang, mathResult.expression, mathResult.answer, mathResult.error);
      if (response) {
        console.log("[AYA_HOMEWORK] STAGE 1 SUCCESS - returning math response:", response);
        return response;
      }
    }

    // Not simple math detected - return null to use full vision analysis
    console.log("[AYA_HOMEWORK] not simple math - falling back to full vision analysis");
    return null;
  } catch (error) {
    // If extraction fails, return null to fall back to full vision analysis
    console.log("[AYA_HOMEWORK] extraction error:", error);
    console.log("[AYA_HOMEWORK] falling back to full vision analysis");
    return null;
  }
}

export type { SimpleMathResult };
export { detectSimpleMathExpression, getLocalizedMathResponse, getUnclearImageMessage, trySimpleMathSolve };
