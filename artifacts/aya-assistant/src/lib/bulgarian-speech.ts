/**
 * Bulgarian Speech Preprocessing
 * Converts mathematical expressions and text into natural Bulgarian speech
 */

// Bulgarian digit words
const BULGARIAN_NUMBERS = {
  0: "нула",
  1: "едно",
  2: "две",
  3: "три",
  4: "четири",
  5: "пет",
  6: "шест",
  7: "седем",
  8: "осем",
  9: "девет",
  10: "десет",
  11: "единадесет",
  12: "дванадесет",
  13: "тринадесет",
  14: "четиринадесет",
  15: "петнадесет",
  16: "шеснадесет",
  17: "седемнадесет",
  18: "осемнадесет",
  19: "деветнадесет",
  20: "двадесет",
  30: "тридесет",
  40: "четиридесет",
  50: "петдесет",
  60: "шестдесет",
  70: "седемдесет",
  80: "осемдесет",
  90: "деветдесет",
  100: "сто",
};

/**
 * Convert a single number to Bulgarian words
 */
function numberToBulgarian(num: number): string {
  if (num < 0) return "минус " + numberToBulgarian(-num);
  if (num in BULGARIAN_NUMBERS) return BULGARIAN_NUMBERS[num as keyof typeof BULGARIAN_NUMBERS];
  if (num < 100) {
    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;
    return BULGARIAN_NUMBERS[tens as keyof typeof BULGARIAN_NUMBERS] + (ones > 0 ? " " + BULGARIAN_NUMBERS[ones as keyof typeof BULGARIAN_NUMBERS] : "");
  }
  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    let result = (hundreds === 1 ? "сто" : numberToBulgarian(hundreds) + " сто");
    if (remainder > 0) result += " " + numberToBulgarian(remainder);
    return result;
  }
  return num.toString(); // Fallback for very large numbers
}

/**
 * Preprocess Bulgarian text to convert math expressions to natural speech
 * Examples:
 *   "0 + 3 = 3" -> "нула плюс три е равно на три"
 *   "4 - 1 = 3" -> "четири минус едно е равно на три"
 *   "2 × 5 = 10" -> "две по пет е равно на десет"
 *   "8 ÷ 2 = 4" -> "осем делено на две е равно на четири"
 */
export function preprocessBulgarianSpeech(text: string, lang: string): string {
  if (!text) return "";
  
  // Only process if language is Bulgarian
  if (!lang.startsWith("bg")) return text;
  
  let result = text;
  
  // Pattern: "number operator number = number"
  // Match: 0 + 3 = 3, 4 - 1 = 3, 2 × 5 = 10, 8 ÷ 2 = 4
  const mathPattern = /(\d+)\s*([+\-×÷])\s*(\d+)\s*=\s*(\d+)/g;
  
  result = result.replace(mathPattern, (match, num1, op, num2, result_num) => {
    const n1 = parseInt(num1, 10);
    const n2 = parseInt(num2, 10);
    const nResult = parseInt(result_num, 10);
    
    let opText = "";
    switch (op) {
      case "+":
        opText = "плюс";
        break;
      case "-":
        opText = "минус";
        break;
      case "×":
        opText = "по";
        break;
      case "÷":
        opText = "делено на";
        break;
      default:
        opText = op;
    }
    
    return `${numberToBulgarian(n1)} ${opText} ${numberToBulgarian(n2)} е равно на ${numberToBulgarian(nResult)}`;
  });
  
  // Pattern: "number operator number" (without result)
  // This handles partial expressions like "3 + 2"
  const partialMathPattern = /(\d+)\s*([+\-×÷])\s*(\d+)(?!\s*=)/g;
  
  result = result.replace(partialMathPattern, (match, num1, op, num2) => {
    const n1 = parseInt(num1, 10);
    const n2 = parseInt(num2, 10);
    
    let opText = "";
    switch (op) {
      case "+":
        opText = "плюс";
        break;
      case "-":
        opText = "минус";
        break;
      case "×":
        opText = "по";
        break;
      case "÷":
        opText = "делено на";
        break;
      default:
        opText = op;
    }
    
    return `${numberToBulgarian(n1)} ${opText} ${numberToBulgarian(n2)}`;
  });
  
  // Remove multiple spaces
  result = result.replace(/\s+/g, " ").trim();
  
  return result;
}

/**
 * Get the best Bulgarian voice from available voices
 * Prefers bg-BG if available
 */
export function getBulgarianVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return undefined;
  }
  
  const voices = window.speechSynthesis.getVoices();
  
  // First, try to find bg-BG voice
  const bgBgVoice = voices.find(v => v.lang === "bg-BG");
  if (bgBgVoice) return bgBgVoice;
  
  // Then, try to find any Bulgarian voice
  const anyBgVoice = voices.find(v => v.lang.startsWith("bg"));
  if (anyBgVoice) return anyBgVoice;
  
  // If no Bulgarian voice, return undefined
  return undefined;
}

/**
 * Set Bulgarian voice on a speech utterance if available
 */
export function setBulgarianVoice(utterance: SpeechSynthesisUtterance, lang: string): void {
  if (!lang.startsWith("bg")) return;
  
  const voice = getBulgarianVoice();
  if (voice) {
    utterance.voice = voice;
  }
}
