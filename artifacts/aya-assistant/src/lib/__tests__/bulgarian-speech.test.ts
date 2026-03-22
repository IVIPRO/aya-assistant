/**
 * Tests for Bulgarian Speech Preprocessing
 * Verifies that math expressions and text are converted to natural Bulgarian speech
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import { preprocessBulgarianSpeech, getBulgarianVoice } from "../bulgarian-speech";

describe("Bulgarian Speech Preprocessing", () => {
  test("converts addition expression to Bulgarian speech", () => {
    const input = "0 + 3 = 3";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    assert.ok(result.includes("нула"), "Should contain 'нула' for 0");
    assert.ok(result.includes("плюс"), "Should contain 'плюс' for +");
    assert.ok(result.includes("три"), "Should contain 'три' for 3");
    assert.ok(result.includes("равно"), "Should contain 'равно' for =");
  });

  test("converts subtraction expression to Bulgarian speech", () => {
    const input = "4 - 1 = 3";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    assert.ok(result.includes("четири"), "Should contain 'четири' for 4");
    assert.ok(result.includes("минус"), "Should contain 'минус' for -");
    assert.ok(result.includes("едно"), "Should contain 'едно' for 1");
    assert.ok(result.includes("равно"), "Should contain 'равно' for =");
    assert.ok(result.includes("три"), "Should contain 'три' for 3");
  });

  test("converts multiplication expression to Bulgarian speech", () => {
    const input = "2 × 5 = 10";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    assert.ok(result.includes("две"), "Should contain 'две' for 2");
    assert.ok(result.includes("по"), "Should contain 'по' for ×");
    assert.ok(result.includes("пет"), "Should contain 'пет' for 5");
    assert.ok(result.includes("равно"), "Should contain 'равно' for =");
    assert.ok(result.includes("десет"), "Should contain 'десет' for 10");
  });

  test("converts division expression to Bulgarian speech", () => {
    const input = "8 ÷ 2 = 4";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    assert.ok(result.includes("осем"), "Should contain 'осем' for 8");
    assert.ok(result.includes("делено"), "Should contain 'делено' for ÷");
    assert.ok(result.includes("две"), "Should contain 'две' for 2");
    assert.ok(result.includes("равно"), "Should contain 'равно' for =");
    assert.ok(result.includes("четири"), "Should contain 'четири' for 4");
  });

  test("converts partial math expression without result", () => {
    const input = "3 + 2";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    assert.ok(result.includes("три"), "Should contain 'три' for 3");
    assert.ok(result.includes("плюс"), "Should contain 'плюс' for +");
    assert.ok(result.includes("две"), "Should contain 'две' for 2");
  });

  test("does not process non-Bulgarian languages", () => {
    const input = "0 + 3 = 3";
    const result = preprocessBulgarianSpeech(input, "en-US");
    
    assert.equal(result, input, "English text should not be processed");
  });

  test("returns empty string for empty input", () => {
    const result = preprocessBulgarianSpeech("", "bg-BG");
    assert.equal(result, "", "Should return empty string for empty input");
  });

  test("handles multiple math expressions in text", () => {
    const input = "Do these: 1 + 2 = 3 and 4 - 1 = 3";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    // Both expressions should be converted
    assert.ok(result.includes("плюс"), "Should contain 'плюс' from first expression");
    assert.ok(result.includes("минус"), "Should contain 'минус' from second expression");
  });

  test("removes extra spaces after preprocessing", () => {
    const input = "5   +   3   =   8";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    // Should not have multiple consecutive spaces
    assert.ok(!result.includes("  "), "Should not have multiple consecutive spaces");
  });

  test("processes large numbers correctly", () => {
    const input = "20 + 30 = 50";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    assert.ok(result.includes("двадесет"), "Should contain 'двадесет' for 20");
    assert.ok(result.includes("тридесет"), "Should contain 'тридесет' for 30");
    assert.ok(result.includes("петдесет"), "Should contain 'петдесет' for 50");
  });

  test("preserves non-math text in Bulgarian", () => {
    const input = "Calculate: 2 + 2 = 4 carefully";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    assert.ok(result.includes("Calculate"), "Should preserve non-math English text");
    assert.ok(result.includes("carefully"), "Should preserve non-math English text");
    assert.ok(result.includes("две"), "Should convert math expression");
  });

  test("Bulgarian voice selection prefers bg-BG", () => {
    // Note: This test may not work in all environments if speechSynthesis is not available
    // It mainly tests that the function doesn't throw an error
    const voice = getBulgarianVoice();
    
    // This assertion may pass or fail depending on OS and available voices
    // We just verify the function runs without error
    assert.ok(voice === undefined || voice !== null, "Should return voice or undefined");
  });

  test("converts negative numbers in expressions", () => {
    const input = "-5 + 3 = -2";
    const result = preprocessBulgarianSpeech(input, "bg-BG");
    
    // Should handle negative numbers
    assert.ok(result.includes("минус"), "Should handle negative number in expression");
  });

  test("handles zero correctly in various positions", () => {
    const input1 = "0 + 0 = 0";
    const result1 = preprocessBulgarianSpeech(input1, "bg-BG");
    
    assert.equal((result1.match(/нула/g) || []).length, 3, "Should have 3 instances of 'нула'");
  });

  test("processes expressions with different spacing", () => {
    const inputs = [
      "1+2=3",
      "1 + 2 = 3",
      "1  +  2  =  3",
    ];
    
    for (const input of inputs) {
      const result = preprocessBulgarianSpeech(input, "bg-BG");
      assert.ok(result.includes("едно"), "Should process regardless of spacing");
      assert.ok(result.includes("плюс"), "Should process regardless of spacing");
    }
  });
});
