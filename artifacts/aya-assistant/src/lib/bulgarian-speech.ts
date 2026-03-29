/**
 * Bulgarian Speech Preprocessing
 * Converts mathematical expressions and text into natural Bulgarian speech.
 *
 * Pipeline (applied in order):
 *   1. Brand name transliteration (AYA → "Ей Ай Ей")
 *   2. Math question patterns  (N op N = ? → "Колко е N op N?")
 *   3. Complete equations      (N op N = N → "N op N равно N")
 *   4. Partial expressions     (N op N     → "N op N")
 *   5. Remaining bare operators (+ - × ÷ → думи)
 *   6. Standalone number conversion (bare digits → Bulgarian words)
 *   7. Symbol cleanup          (strip leftover ? = and tidy spaces)
 */

// ─── Bulgarian number lookup table ────────────────────────────────────────────
const ONES: Record<number, string> = {
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
  16: "шестнадесет",
  17: "седемнадесет",
  18: "осемнадесет",
  19: "деветнадесет",
};

const TENS: Record<number, string> = {
  20: "двадесет",
  30: "тридесет",
  40: "четиридесет",
  50: "петдесет",
  60: "шестдесет",
  70: "седемдесет",
  80: "осемдесет",
  90: "деветдесет",
};

const HUNDREDS: Record<number, string> = {
  100: "сто",
  200: "двеста",
  300: "триста",
  400: "четиристотин",
  500: "петстотин",
  600: "шестотин",
  700: "седемстотин",
  800: "осемстотин",
  900: "деветстотин",
};

/**
 * Convert a number (0–9999) to natural Bulgarian words.
 * Uses "и" as the connector between larger and smaller components,
 * as a Bulgarian primary-school teacher would say it.
 *
 * Examples:
 *   21  → "двадесет и едно"
 *   108 → "сто и осем"
 *   234 → "двеста тридесет и четири"
 */
export function numberToBulgarian(num: number): string {
  if (num < 0) return "минус " + numberToBulgarian(-num);

  // Direct lookup for 0–19
  if (num in ONES) return ONES[num];

  // 20–99: tens + optional "и" + ones
  if (num < 100) {
    const tensKey = Math.floor(num / 10) * 10;
    const ones = num % 10;
    const tensWord = TENS[tensKey] ?? String(tensKey);
    return ones > 0 ? `${tensWord} и ${ONES[ones]}` : tensWord;
  }

  // 100–999: hundreds + optional "и" + remainder
  if (num < 1000) {
    const hundredsKey = Math.floor(num / 100) * 100;
    const remainder = num % 100;
    const hundredsWord = HUNDREDS[hundredsKey] ?? `${Math.floor(num / 100)} сто`;
    if (remainder === 0) return hundredsWord;
    // "двеста тридесет и четири" — no "и" between hundreds and tens, but "и" inside tens group
    if (remainder < 20) return `${hundredsWord} и ${numberToBulgarian(remainder)}`;
    return `${hundredsWord} ${numberToBulgarian(remainder)}`;
  }

  // 1000–9999: thousands
  if (num < 10000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    const thousandsWord = thousands === 1 ? "хиляда" : `${numberToBulgarian(thousands)} хиляди`;
    return remainder > 0 ? `${thousandsWord} ${numberToBulgarian(remainder)}` : thousandsWord;
  }

  return String(num); // Fallback for very large numbers
}

// ─── Brand name transliterations ──────────────────────────────────────────────
const BRAND_TRANSLITERATIONS: Record<string, string> = {
  AYA: "Ей Ай Ей",
};

function transliterateBrandNames(text: string): string {
  let result = text;
  const sorted = Object.keys(BRAND_TRANSLITERATIONS).sort((a, b) => b.length - a.length);
  for (const brand of sorted) {
    result = result.replace(new RegExp(`\\b${brand}\\b`, "gi"), BRAND_TRANSLITERATIONS[brand]);
  }
  return result;
}

// ─── Operator → Bulgarian word ─────────────────────────────────────────────────
function opToBg(op: string): string {
  switch (op.trim()) {
    case "+":  return "плюс";
    case "-":  return "минус";
    case "×":
    case "*":  return "по";
    case "÷":
    case "/":  return "разделено на";
    default:   return op;
  }
}

// ─── Main export ───────────────────────────────────────────────────────────────

/**
 * Preprocess Bulgarian text before TTS — converts all math expressions and
 * standalone numbers into natural spoken Bulgarian.
 *
 * Handles:
 *   "8 + 16 = ?"      → "Колко е осем плюс шестнадесет?"
 *   "3 × 7 = ?"       → "Колко е три по седем?"
 *   "? = 4 + 5"       → "Колко е четири плюс пет?"
 *   "4 - 1 = 3"       → "четири минус едно равно три"
 *   "3 + 2"           → "три плюс две"
 *   "В клас има 24"   → "В клас има двадесет и четири"
 */
export function preprocessBulgarianSpeech(text: string, lang: string): string {
  if (!text) return "";
  if (!lang.startsWith("bg")) return text;

  let result = text;

  // Step 1 — Brand names
  result = transliterateBrandNames(result);

  // Step 2 — Math QUESTION patterns (N op N = ?) — must run BEFORE complete equations
  // "8 + 16 = ?" → "Колко е осем плюс шестнадесет?"
  const questionFromLeft = /(\d+)\s*([+\-×÷*/])\s*(\d+)\s*=\s*\?/g;
  result = result.replace(questionFromLeft, (_m, n1, op, n2) =>
    `Колко е ${numberToBulgarian(parseInt(n1, 10))} ${opToBg(op)} ${numberToBulgarian(parseInt(n2, 10))}?`
  );

  // "? = 4 + 5" → "Колко е четири плюс пет?"
  const questionFromRight = /\?\s*=\s*(\d+)\s*([+\-×÷*/])\s*(\d+)/g;
  result = result.replace(questionFromRight, (_m, n1, op, n2) =>
    `Колко е ${numberToBulgarian(parseInt(n1, 10))} ${opToBg(op)} ${numberToBulgarian(parseInt(n2, 10))}?`
  );

  // Step 3 — Complete equations (N op N = N) → "N op N равно N"
  const completeEq = /(\d+)\s*([+\-×÷*/])\s*(\d+)\s*=\s*(\d+)/g;
  result = result.replace(completeEq, (_m, n1, op, n2, nRes) =>
    `${numberToBulgarian(parseInt(n1, 10))} ${opToBg(op)} ${numberToBulgarian(parseInt(n2, 10))} равно ${numberToBulgarian(parseInt(nRes, 10))}`
  );

  // Step 4 — Partial expressions (N op N, not followed by =)
  const partialEq = /(\d+)\s*([+\-×÷*/])\s*(\d+)(?!\s*[=?])/g;
  result = result.replace(partialEq, (_m, n1, op, n2) =>
    `${numberToBulgarian(parseInt(n1, 10))} ${opToBg(op)} ${numberToBulgarian(parseInt(n2, 10))}`
  );

  // Step 5 — Remaining bare operators between non-digit context
  result = result.replace(/\s*\+\s*/g, " плюс ");
  result = result.replace(/\s*×\s*/g, " по ");
  result = result.replace(/\s*÷\s*/g, " разделено на ");
  // Only replace standalone minus (not inside negative numbers or hyphens)
  result = result.replace(/(?<=\s|^)-(?=\s)/g, " минус ");

  // Step 6 — Standalone number conversion (bare digits not already converted)
  // Matches any remaining digit sequence as a word boundary
  result = result.replace(/\b(\d+)\b/g, (_m, numStr) => {
    const n = parseInt(numStr, 10);
    return isNaN(n) ? numStr : numberToBulgarian(n);
  });

  // Step 7 — Bare "=" remaining → "равно"
  result = result.replace(/(?<![=!<>])=(?!=)/g, " равно ");

  // Step 8 — Symbol and punctuation cleanup
  result = result.replace(/\?/g, "?"); // keep question marks (they help TTS intonation)
  result = result.replace(/[*]/g, "");  // strip remaining asterisks
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

// ─── Voice selection helpers (browser TTS fallback) ───────────────────────────

/**
 * Get the best Bulgarian voice from available browser voices.
 * Preference: female (Kalina) → any bg-* → "Bulgarian" in name → undefined
 */
export function getBulgarianVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !window.speechSynthesis) return undefined;

  const voices = window.speechSynthesis.getVoices();
  console.log("[BG_VOICE_SELECTION] Total voices available:", voices.length);

  const bgVoices = voices.filter(v => v.lang.startsWith("bg"));
  if (bgVoices.length > 0) {
    const female = bgVoices.find(v =>
      v.name.toLowerCase().includes("kalina") ||
      v.name.toLowerCase().includes("female")
    );
    if (female) {
      console.log("[BG_VOICE_SELECTION] Selected female Bulgarian voice:", female.name);
      return female;
    }
    console.log("[BG_VOICE_SELECTION] Selected bg-* voice:", bgVoices[0].name);
    return bgVoices[0];
  }

  const byName = voices.find(v => v.name.toLowerCase().includes("bulgarian"));
  if (byName) {
    console.log("[BG_VOICE_SELECTION] Selected Bulgarian-named voice:", byName.name);
    return byName;
  }

  console.log("[BG_VOICE_SELECTION] No Bulgarian voice found — relying on lang=bg-BG");
  return undefined;
}

/**
 * Apply Bulgarian voice to a Web Speech API utterance.
 */
export function setBulgarianVoice(utterance: SpeechSynthesisUtterance, lang: string): void {
  if (!lang.startsWith("bg")) return;
  const voice = getBulgarianVoice();
  if (voice) {
    utterance.voice = voice;
    console.log("[BG_VOICE_SET] Voice set to:", voice.name);
  } else {
    console.log("[BG_VOICE_SET] No Bulgarian voice — using lang attribute:", lang);
  }
}
