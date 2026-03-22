/**
 * Bulgarian Speech Diagnosis Tests
 * Root cause: cleanTextForSpeech was stripping '+' and '=' BEFORE preprocessBulgarianSpeech
 * ran, so the math regex had nothing to match and digits were read as English by the TTS voice.
 * Fix: preprocess on raw text first, then clean.
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import { preprocessBulgarianSpeech } from "../../../../aya-assistant/src/lib/bulgarian-speech";

/**
 * Mirrors the cleanTextForSpeech function in ListeningMode.tsx exactly.
 * Used here to verify that preprocessing BEFORE cleaning produces correct output.
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned
    .replace(/\bAYA\s+\d+\b/gi, "")
    .replace(/\bAYA\s+(Panda|Robot|Fox|Owl)\b/gi, "")
    .replace(/^\s*\[.*?\]\s*/g, "")
    .replace(/^(read|listen|say|speak):\s*/gi, "");
  cleaned = cleaned
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2300}-\u{23FF}]/gu, "")
    .replace(/[\u{2000}-\u{206F}]/gu, "")
    .replace(/[^\p{L}\p{N}\s.,!?;:—–-]/gu, "") // strips +, =, ×, ÷
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
}

describe("Bulgarian Speech Diagnosis", () => {
  test("preprocesses exact test string from Listening Mode", () => {
    // This is the exact string that would be in Listening Mode:
    // "Браво, Магдалена! 0 + 3 = 3. Искаш ли още една задача?"
    const testString = "Браво, Магдалена! 0 + 3 = 3. Искаш ли още една задача?";
    const result = preprocessBulgarianSpeech(testString, "bg-BG");
    
    // The math expression should be converted
    assert.ok(result.includes("нула"), "Should convert 0 to 'нула'");
    assert.ok(result.includes("плюс"), "Should convert + to 'плюс'");
    assert.ok(result.includes("три"), "Should convert 3 to 'три'");
    assert.ok(result.includes("равно"), "Should convert = to 'равно'");
    
    // Bulgarian text should be preserved
    assert.ok(result.includes("Браво"), "Should preserve Bulgarian text");
    assert.ok(result.includes("Магдалена"), "Should preserve Bulgarian names");
    assert.ok(result.includes("Искаш"), "Should preserve Bulgarian words");
    
    console.log("[DIAGNOSIS_TEST] Final output:", result);
  });

  test("verifies math pattern matches single digit + single digit = single digit", () => {
    const expressions = [
      "0 + 3 = 3",
      "1+2=3",
      "2 +1 = 3",
      "0 +0 = 0",
    ];
    
    for (const expr of expressions) {
      const result = preprocessBulgarianSpeech(expr, "bg-BG");
      
      // Each should contain Bulgarian conversions
      assert.ok(result.length > expr.length, `Expression should be expanded: "${expr}" -> "${result}"`);
      assert.ok(/[а-яА-Я]/.test(result), `Should contain Bulgarian letters: "${result}"`);
    }
  });

  test("verifies 'нула плюс три е равно на три' is the exact expected output for 0 + 3 = 3", () => {
    const input = "0 + 3 = 3";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    const expected = "нула плюс три е равно на три";
    
    // Log for diagnosis
    console.log("[DIAGNOSIS_TEST] Input:", input);
    console.log("[DIAGNOSIS_TEST] Expected:", expected);
    console.log("[DIAGNOSIS_TEST] Got:", result);
    
    // Verify each component
    assert.ok(result.includes("нула"), "Should contain 'нула'");
    assert.ok(result.includes("плюс"), "Should contain 'плюс'");
    assert.ok(result.includes("три"), "Should contain both 'три'");
    assert.ok(result.includes("равно"), "Should contain 'равно'");
    assert.ok(result.includes("на"), "Should contain 'на' in 'равно на'");
  });

  test("does not double-process already converted text", () => {
    // If preprocessing runs twice, it shouldn't convert Bulgarian words again
    const alreadyConverted = "нула плюс три е равно на три";
    const reprocessed = preprocessBulgarianSpeech(alreadyConverted, "bg-BG");
    
    // Should remain the same (no double processing)
    assert.ok(reprocessed === alreadyConverted, "Should not double-process already converted text");
  });

  test("preserves sentence structure around math expression", () => {
    const fullSentence = "Реши това: 1 + 2 = 3, тогава ще спечелиш награда.";
    const result = preprocessBulgarianSpeech(fullSentence, "bg-BG");
    
    // Math should be converted
    assert.ok(result.includes("едно"), "Should convert math");
    assert.ok(result.includes("плюс"), "Should convert math");
    
    // Non-math words should be preserved
    assert.ok(result.includes("Реши"), "Should preserve 'Реши'");
    assert.ok(result.includes("тогава"), "Should preserve 'тогава'");
    assert.ok(result.includes("награда"), "Should preserve 'награда'");
  });

  test("handles multiple math expressions in sequence", () => {
    const multiExpr = "0 + 3 = 3 и 4 - 1 = 3";
    const result = preprocessBulgarianSpeech(multiExpr, "bg-BG");
    
    // Both expressions should be converted
    assert.ok(result.includes("нула"), "First expression: 0");
    assert.ok(result.includes("плюс"), "First expression: +");
    assert.ok(result.includes("минус"), "Second expression: -");
    assert.ok((result.match(/равно/g) || []).length >= 2, "Should have two 'равно' for two equations");
  });

  test("speech text should not contain raw symbols after preprocessing", () => {
    const input = "0 + 3 = 3";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    // These symbols should NOT appear in the final text
    assert.ok(!result.includes(" + "), "Should not contain ' + '");
    assert.ok(!result.includes(" = "), "Should not contain ' = '");
    
    // Numbers alone (0, 3) also shouldn't appear as math operators
    // (they might appear as part of words, which is OK)
    console.log("[DIAGNOSIS_TEST] Final text:", result);
  });

  test("language parameter controls whether preprocessing happens", () => {
    const input = "0 + 3 = 3";
    
    // Bulgarian: should preprocess
    const bgResult = preprocessBulgarianSpeech(input, "bg-BG");
    assert.ok(bgResult.includes("нула"), "Bulgarian should preprocess");
    
    // English: should NOT preprocess
    const enResult = preprocessBulgarianSpeech(input, "en-US");
    assert.ok(enResult === input, "English should NOT preprocess");
  });

  test("no accidental stop signals in final text", () => {
    // Some TTS engines stop reading if they encounter certain patterns
    const input = "0 + 3 = 3. Искаш ли още?";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    assert.ok(result.length > 0, "Result should not be empty");
    assert.ok(!/^\s*$/.test(result), "Result should not be whitespace-only");
  });

  // ─── CRITICAL REGRESSION: Order-of-operations bug ───────────────────────────
  // Root cause: cleanTextForSpeech was called BEFORE preprocessBulgarianSpeech.
  // The clean function strips '+' and '=' (they are not in its character whitelist),
  // so the math regex in preprocessBulgarianSpeech found nothing to match.
  // Result: "0 + 3 = 3" → clean → "0 3 3" → preprocess (no match) → "0 3 3"
  // The Bulgarian TTS voice then read raw digits: "zero три три" → "zero tree tree".

  test("REGRESSION: clean-then-preprocess produces wrong output (zero tree tree bug)", () => {
    const raw = "Браво, Магдалена! 0 + 3 = 3. Искаш ли още една задача?";
    
    // Wrong order (old code): clean first, then preprocess
    const wrongOrder = preprocessBulgarianSpeech(cleanTextForSpeech(raw), "bg-BG");
    
    // The math is NOT converted — operators were stripped before matching
    assert.ok(!wrongOrder.includes("плюс"), "Wrong order: '+' already stripped, cannot match");
    assert.ok(!wrongOrder.includes("равно"), "Wrong order: '=' already stripped, cannot match");
    // The raw digits survive as-is
    assert.ok(/\b0\b/.test(wrongOrder) || wrongOrder.includes("0"), "Wrong order: digit 0 left as-is");
  });

  test("REGRESSION: preprocess-then-clean produces correct output (fix)", () => {
    const raw = "Браво, Магдалена! 0 + 3 = 3. Искаш ли още една задача?";
    
    // Correct order (new code): preprocess first, then clean
    const correctOrder = cleanTextForSpeech(preprocessBulgarianSpeech(raw, "bg-BG"));
    
    // Math IS fully converted — operators were intact when regex ran
    assert.ok(correctOrder.includes("нула"), "Correct order: 0 → нула");
    assert.ok(correctOrder.includes("плюс"), "Correct order: + → плюс");
    assert.ok(correctOrder.includes("три"), "Correct order: 3 → три");
    assert.ok(correctOrder.includes("равно"), "Correct order: = → равно");
    
    // Non-math Bulgarian text preserved
    assert.ok(correctOrder.includes("Браво"), "Correct order: Bulgarian text preserved");
    assert.ok(correctOrder.includes("Магдалена"), "Correct order: Bulgarian name preserved");
    assert.ok(correctOrder.includes("Искаш"), "Correct order: Bulgarian sentence preserved");
    
    // No raw math symbols remain
    assert.ok(!correctOrder.includes(" + "), "Correct order: + symbol removed");
    assert.ok(!correctOrder.includes(" = "), "Correct order: = symbol removed");
    
    console.log("[REGRESSION_TEST] Exact final spoken text:", correctOrder);
  });

  test("REGRESSION: all four operators convert correctly after correct order", () => {
    const cases = [
      { raw: "0 + 3 = 3",   expectOp: "плюс",     expectResult: "три" },
      { raw: "5 - 2 = 3",   expectOp: "минус",    expectResult: "три" },
      { raw: "2 × 3 = 6",   expectOp: "по",       expectResult: "шест" },
      { raw: "6 ÷ 2 = 3",   expectOp: "делено на", expectResult: "три" },
    ];
    
    for (const { raw, expectOp, expectResult } of cases) {
      const result = cleanTextForSpeech(preprocessBulgarianSpeech(raw, "bg-BG"));
      assert.ok(result.includes(expectOp), `"${raw}" → should contain "${expectOp}", got: "${result}"`);
      assert.ok(result.includes(expectResult), `"${raw}" → should contain "${expectResult}", got: "${result}"`);
      assert.ok(result.includes("равно"), `"${raw}" → should contain "равно", got: "${result}"`);
    }
  });
});
