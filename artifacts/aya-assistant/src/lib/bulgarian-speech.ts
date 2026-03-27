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
 * Transliterate Latin brand names to Bulgarian phonetic form for proper TTS pronunciation
 * Examples:
 *   "AYA Panda" -> "Ей Ай Ей Панда"
 *   "AYA" -> "Ей Ай Ей"
 */
const BULGARIAN_BRAND_TRANSLITERATIONS: Record<string, string> = {
  "AYA Panda": "Ей Ай Ей Панда",
  "AYA": "Ей Ай Ей",
};

function transliterateBrandNames(text: string): string {
  let result = text;
  // Process longer brand names first to avoid partial replacements
  const sortedBrands = Object.keys(BULGARIAN_BRAND_TRANSLITERATIONS).sort((a, b) => b.length - a.length);
  for (const brand of sortedBrands) {
    const replacement = BULGARIAN_BRAND_TRANSLITERATIONS[brand];
    result = result.replace(new RegExp(`\\b${brand}\\b`, "gi"), replacement);
  }
  return result;
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
  
  // First transliterate brand names for proper TTS pronunciation
  result = transliterateBrandNames(result);
  
  // Helper: convert math operator symbol → Bulgarian word
  function opToBg(op: string): string {
    switch (op) {
      case "+":  return "плюс";
      case "-":  return "минус";
      case "×":
      case "*":  return "по";
      case "÷":
      case "/":  return "разделено на";
      default:   return op;
    }
  }

  // Pattern: "number operator number = number"
  // Handles: +  -  ×  ÷  *  /
  const mathPattern = /(\d+)\s*([+\-×÷*/])\s*(\d+)\s*=\s*(\d+)/g;

  result = result.replace(mathPattern, (_match, num1, op, num2, result_num) => {
    const n1 = parseInt(num1, 10);
    const n2 = parseInt(num2, 10);
    const nResult = parseInt(result_num, 10);
    return `${numberToBulgarian(n1)} ${opToBg(op)} ${numberToBulgarian(n2)} равно ${numberToBulgarian(nResult)}`;
  });

  // Pattern: "number operator number" (without result) — e.g. "3 + 2"
  const partialMathPattern = /(\d+)\s*([+\-×÷*/])\s*(\d+)(?!\s*=)/g;

  result = result.replace(partialMathPattern, (_match, num1, op, num2) => {
    const n1 = parseInt(num1, 10);
    const n2 = parseInt(num2, 10);
    return `${numberToBulgarian(n1)} ${opToBg(op)} ${numberToBulgarian(n2)}`;
  });

  // Fallback: bare "=" remaining in text (e.g. in sentences without surrounding numbers)
  // Only replace if not part of ==, !=, <=, >=
  result = result.replace(/(?<![=!<>])=(?!=)/g, " равно ");

  // Remove multiple spaces
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

/**
 * Get the best Bulgarian voice from available voices
 * Preference order:
 * 1. Female Bulgarian voice (Kalina or "female" in name)
 * 2. Any Bulgarian voice (bg-*)
 * 3. Voice name contains "Bulgarian"
 * 4. Returns undefined to let OS select based on lang attribute
 */
export function getBulgarianVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return undefined;
  }
  
  const voices = window.speechSynthesis.getVoices();
  console.log("[BG_VOICE_SELECTION] Total voices available:", voices.length);
  
  // Strategy 1: Prefer female Bulgarian voice (Kalina or "female" in name)
  const bgVoices = voices.filter(v => v.lang.startsWith("bg"));
  if (bgVoices.length > 0) {
    const femaleBgVoice = bgVoices.find(v => 
      v.name.toLowerCase().includes("kalina") || 
      v.name.toLowerCase().includes("female")
    );
    if (femaleBgVoice) {
      console.log("[BG_VOICE_SELECTION] Selected female Bulgarian voice:", femaleBgVoice.name, "lang:", femaleBgVoice.lang);
      return femaleBgVoice;
    }
    
    // Fallback: Select first bg-* voice
    console.log("[BG_VOICE_SELECTION] Selected bg-* voice:", bgVoices[0].name, "lang:", bgVoices[0].lang);
    return bgVoices[0];
  }
  
  // Strategy 2: Look for "Bulgarian" in voice name (case-insensitive)
  const bgNameVoice = voices.find(v => v.name.toLowerCase().includes("bulgarian"));
  if (bgNameVoice) {
    console.log("[BG_VOICE_SELECTION] Selected Bulgarian-named voice:", bgNameVoice.name, "lang:", bgNameVoice.lang);
    return bgNameVoice;
  }
  
  console.log("[BG_VOICE_SELECTION] No Bulgarian voice found - will rely on lang attribute (bg-BG)");
  return undefined;
}

/**
 * Set Bulgarian voice on a speech utterance if available
 * Even if no Bulgarian voice is found, the lang attribute (bg-BG) helps the OS select the right voice
 */
export function setBulgarianVoice(utterance: SpeechSynthesisUtterance, lang: string): void {
  if (!lang.startsWith("bg")) return;
  
  const voice = getBulgarianVoice();
  if (voice) {
    utterance.voice = voice;
    console.log("[BG_VOICE_SET] Voice set to:", voice.name, "lang:", voice.lang);
  } else {
    console.log("[BG_VOICE_SET] No Bulgarian voice found - utterance.lang is:", lang);
  }
}
