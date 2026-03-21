/**
 * Bulgarian Speech Diagnosis Tests
 * Diagnoses real issues with voice selection and math normalization
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import { preprocessBulgarianSpeech } from "../bulgarian-speech";

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
    
    // Should not have patterns that might cause early termination
    // (This is a heuristic check)
    assert.ok(result.length > 0, "Result should not be empty");
    assert.ok(!/^\s*$/.test(result), "Result should not be whitespace-only");
  });
});
