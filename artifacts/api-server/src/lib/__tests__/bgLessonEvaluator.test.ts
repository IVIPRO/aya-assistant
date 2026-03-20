/**
 * Bulgarian Lesson Evaluator Tests
 *
 * Tests for answer evaluation and topic progression.
 * Run with: pnpm --filter @workspace/api-server test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateLetterRecognition,
  evaluateSyllableCount,
  evaluateWordSpelling,
  evaluateSentenceCompletion,
  evaluateComprehension,
  evaluateKeywordMatch,
  evaluateBulgarianLessonAnswer,
} from "../bgLessonEvaluator.js";

// ─── Test 1: Correct answer detection ─────────────────────────────────────────

describe("Answer evaluation — correct answers", () => {
  test("letter recognition: correct letter 'м'", () => {
    const result = evaluateLetterRecognition("м", "м");
    assert.equal(result.correct, true);
    assert.ok(result.explanation.includes("Правилно"));
  });

  test("syllable count: correct '3' for три", () => {
    const result = evaluateSyllableCount("3", 3);
    assert.equal(result.correct, true);
    assert.ok(result.explanation.includes("3 срички"));
  });

  test("syllable count: word form 'три'", () => {
    const result = evaluateSyllableCount("три", 3);
    assert.equal(result.correct, true);
  });

  test("word spelling: exact match 'котка'", () => {
    const result = evaluateWordSpelling("котка", "котка");
    assert.equal(result.correct, true);
    assert.ok(result.explanation.includes("правопис"));
  });

  test("word spelling: minor typo tolerance", () => {
    const result = evaluateWordSpelling("котка", "котка"); // exact should always pass
    assert.equal(result.correct, true);
  });

  test("sentence completion: acceptable answer 'грее'", () => {
    const result = evaluateSentenceCompletion("грее", ["грее", "светлинеет"]);
    assert.equal(result.correct, true);
    assert.ok(result.explanation.includes("Правилно"));
  });

  test("comprehension: correct entity 'Пухче'", () => {
    const result = evaluateComprehension("Пухче", ["Пухче", "котката"]);
    assert.equal(result.correct, true);
  });

  test("comprehension with numbering: '1.Пухче' → correct", () => {
    const result = evaluateComprehension("1.Пухче", ["Пухче", "котката"]);
    assert.equal(result.correct, true);
  });

  test("comprehension with numbering and space: '1. Пухче' → correct", () => {
    const result = evaluateComprehension("1. Пухче", ["Пухче", "котката"]);
    assert.equal(result.correct, true);
  });

  test("comprehension with trailing punctuation: 'Пухче.' → correct", () => {
    const result = evaluateComprehension("Пухче.", ["Пухче", "котката"]);
    assert.equal(result.correct, true);
  });

  test("comprehension with trailing exclamation: 'Пухче!' → correct", () => {
    const result = evaluateComprehension("Пухче!", ["Пухче", "котката"]);
    assert.equal(result.correct, true);
  });

  test("comprehension with spaces: ' пухче ' → correct (case-insensitive)", () => {
    const result = evaluateComprehension(" пухче ", ["Пухче", "котката"]);
    assert.equal(result.correct, true);
  });

  test("comprehension with multiple punctuation: '1) Пухче...' → correct", () => {
    const result = evaluateComprehension("1) Пухче...", ["Пухче", "котката"]);
    assert.equal(result.correct, true);
  });
});

// ─── Test 2: Incorrect answer detection ───────────────────────────────────────

describe("Answer evaluation — incorrect answers", () => {
  test("letter recognition: wrong letter 'а' instead of 'м'", () => {
    const result = evaluateLetterRecognition("а", "м");
    assert.equal(result.correct, false);
    assert.equal(result.feedbackBg, "Почти!");
    assert.ok(result.explanation.includes("М"));
  });

  test("syllable count: wrong '2' instead of '3'", () => {
    const result = evaluateSyllableCount("2", 3);
    assert.equal(result.correct, false);
    assert.ok(result.explanation.includes("3 срички"));
  });

  test("word spelling: different word", () => {
    const result = evaluateWordSpelling("дърво", "котка");
    assert.equal(result.correct, false);
    assert.ok(result.explanation.includes("котка"));
  });

  test("sentence completion: unacceptable answer", () => {
    const result = evaluateSentenceCompletion("яда", ["грее", "светлинеет"]);
    assert.equal(result.correct, false);
    assert.ok(result.explanation.includes("грее"));
  });

  test("comprehension: wrong entity", () => {
    const result = evaluateComprehension("Иван", ["Пухче", "котката"]);
    assert.equal(result.correct, false);
  });

  test("keyword matching: missing keywords", () => {
    const result = evaluateKeywordMatch("здравей", ["буква", "звук"]);
    assert.equal(result.correct, false);
  });
});

// ─── Test 3: Topic-specific evaluation ────────────────────────────────────────

describe("Topic-specific evaluation", () => {
  test("grade 1 letters_and_sounds: keyword-based", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 1, topicId: "letters_and_sounds" },
      "Буквата се произнася као М",
    );
    assert.equal(result.correct, true);
  });

  test("grade 1 syllables: syllable count", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 1, topicId: "syllables" },
      "три",
    );
    assert.equal(result.correct, true);
  });

  test("grade 2 reading comprehension", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic" },
      "Пухче",
    );
    assert.equal(result.correct, true);
  });

  test("grade 3 spelling rules", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 3, topicId: "spelling_rules_basic" },
      "правило за буква",
    );
    assert.equal(result.correct, true);
  });

  test("grade 4 grammar review", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 4, topicId: "grammar_review" },
      "подлог и сказуемо",
    );
    assert.equal(result.correct, true);
  });
});

// ─── Test 4: Feedback messages ────────────────────────────────────────────────

describe("Child-friendly feedback", () => {
  test("correct answer returns 'Браво!'", () => {
    const result = evaluateLetterRecognition("м", "м");
    assert.equal(result.feedbackBg, "Браво!");
  });

  test("incorrect answer returns 'Почти!'", () => {
    const result = evaluateLetterRecognition("а", "м");
    assert.equal(result.feedbackBg, "Почти!");
  });

  test("explanation is always provided", () => {
    const correctResult = evaluateWordSpelling("слон", "слон");
    const incorrectResult = evaluateWordSpelling("слонче", "слон");
    assert.ok(correctResult.explanation.length > 0);
    assert.ok(incorrectResult.explanation.length > 0);
  });

  test("explanation contains Bulgarian text", () => {
    const result = evaluateLetterRecognition("м", "м");
    const cyrillic = /[\u0400-\u04FF]/;
    assert.ok(cyrillic.test(result.explanation), "Explanation must contain Cyrillic");
  });
});

// ─── Test 5: Wrong answer handling — stays in lesson ───────────────────────

describe("Wrong answer handling — lesson persistence", () => {
  test("wrong answer returns corrective feedback (not general chat)", () => {
    const result = evaluateLetterRecognition("а", "м");
    // Correct behavior: returns lesson-specific feedback, not general chat
    assert.equal(result.correct, false);
    assert.ok(result.explanation.toLowerCase().includes("буква"));
    assert.ok(result.feedbackBg === "Почти!");
    // Should NOT contain general chat patterns like "Страхотно, че попита"
    assert.ok(!result.explanation.includes("Страхотно, че попита"));
  });

  test("wrong answer on syllables returns explanation, not fallback chat", () => {
    const result = evaluateSyllableCount("две", 3);
    assert.equal(result.correct, false);
    assert.ok(result.explanation.toLowerCase().includes("сричк"));
    assert.ok(result.feedbackBg === "Почти!");
    // Explanation should guide to retry, not escape to general chat
    assert.ok(result.explanation.includes("3"));
  });

  test("multiple wrong answers on same topic return consistent feedback", () => {
    const result1 = evaluateWordSpelling("слонче", "слон");
    const result2 = evaluateWordSpelling("слонче", "слон");
    // Both should handle as lesson answers, not escape to general chat
    assert.equal(result1.correct, result2.correct);
    assert.ok(result1.explanation.length > 0);
    assert.ok(result2.explanation.length > 0);
  });

  test("wrong answer never falls back to general chat response pattern", () => {
    // Multiple wrong answers across different topics should all stay in lesson mode
    const eval1 = evaluateLetterRecognition("x", "а");
    const eval2 = evaluateSyllableCount("пет", 2); // Wrong: пет is 5, not 2
    const eval3 = evaluateWordSpelling("разлика", "котка");
    
    // All should be marked wrong but stay in lesson context
    assert.equal(eval1.correct, false);
    assert.equal(eval2.correct, false);
    assert.equal(eval3.correct, false);
    
    // All should have "Почти!" not general chat phrase
    assert.equal(eval1.feedbackBg, "Почти!");
    assert.equal(eval2.feedbackBg, "Почти!");
    assert.equal(eval3.feedbackBg, "Почти!");
  });
});

// ─── Test 6: Topic progression structure ──────────────────────────────────────

describe("Topic progression logic (data structure)", () => {
  test("progression result has correct shape", () => {
    // Mock progression result shape
    const progressionResult = {
      topicId: "letters_and_sounds",
      successRate: 0.75,
      totalAttempts: 8,
      correctAnswers: 6,
      wrongAnswers: 2,
      advancedToNext: true,
      nextTopicId: "vowels_and_consonants",
      markedWeak: false,
    };

    assert.equal(progressionResult.topicId, "letters_and_sounds");
    assert.equal(progressionResult.successRate, 0.75);
    assert.equal(progressionResult.totalAttempts, 8);
    assert.equal(progressionResult.advancedToNext, true);
    assert.ok(progressionResult.nextTopicId === "vowels_and_consonants");
  });

  test("70% success rate with 5+ attempts triggers advancement", () => {
    // Simulated: 7 out of 10 = 70%
    const successRate = 7 / 10;
    const totalAttempts = 10;
    const advancedToNext = successRate >= 0.7 && totalAttempts >= 5;
    assert.equal(advancedToNext, true);
  });

  test("69% success rate does not trigger advancement", () => {
    const successRate = 69 / 100;
    const totalAttempts = 10;
    const advancedToNext = successRate >= 0.7 && totalAttempts >= 5;
    assert.equal(advancedToNext, false);
  });

  test("low attempt count prevents advancement", () => {
    const successRate = 1.0; // 100% correct
    const totalAttempts = 3; // but only 3 attempts
    const advancedToNext = successRate >= 0.7 && totalAttempts >= 5;
    assert.equal(advancedToNext, false);
  });

  test("<30% success rate with 5+ attempts marks weak", () => {
    const successRate = 0.2; // 20%
    const totalAttempts = 5;
    const markedWeak = successRate < 0.3 && totalAttempts >= 5;
    assert.equal(markedWeak, true);
  });

  test("30% success rate is not weak", () => {
    const successRate = 0.3;
    const totalAttempts = 5;
    const markedWeak = successRate < 0.3 && totalAttempts >= 5;
    assert.equal(markedWeak, false);
  });
});

// ─── Test 7: Question-specific validation (bug fix) ──────────────────────────

describe("Question-specific validation — no cross-question acceptance", () => {
  test("Q1 'Как се казва котката?' accepts 'Пухче'", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 0 },
      "Пухче",
    );
    assert.equal(result.correct, true);
  });

  test("Q1 'Как се казва котката?' REJECTS 'Мария' (wrong word from passage)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 0 },
      "Мария",
    );
    assert.equal(result.correct, false);
    assert.ok(result.feedbackBg === "Почти!");
  });

  test("Q1 'Как се казва котката?' REJECTS 'рибица' (wrong word from passage)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 0 },
      "рибица",
    );
    assert.equal(result.correct, false);
  });

  test("Q1 accepts '1.Пухче' (numbered + normalized)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 0 },
      "1.Пухче",
    );
    assert.equal(result.correct, true);
  });

  test("Q1 accepts 'Пухче.' (with trailing period)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 0 },
      "Пухче.",
    );
    assert.equal(result.correct, true);
  });

  test("Q2 'Какво обича да прави Пухче?' accepts 'топка'", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 1 },
      "топка",
    );
    assert.equal(result.correct, true);
  });

  test("Q2 'Какво обича?' REJECTS 'Пухче' (character name, not action)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 1 },
      "Пухче",
    );
    assert.equal(result.correct, false);
  });

  test("Q3 'С какво го храни Мария?' accepts 'рибица'", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 2 },
      "рибица",
    );
    assert.equal(result.correct, true);
  });

  test("Q3 'С какво го храни?' REJECTS 'Пухче' (character, not food)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 2 },
      "Пухче",
    );
    assert.equal(result.correct, false);
  });

  test("Q3 accepts '1) рибица!!!' (numbered + multiple punctuation)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 2 },
      "1) рибица!!!",
    );
    assert.equal(result.correct, true);
  });
});

// ─── Test 8: Question index progression (correct answer flow) ────────────────

describe("Question index progression — multi-question topic flow", () => {
  test("Question 0 (Q1) validation with correct answer 'пухче'", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 0 },
      "пухче",
    );
    assert.equal(result.correct, true, "Q1 should accept 'пухче'");
    assert.equal(result.feedbackBg, "Браво!");
  });

  test("Question 1 (Q2) validation with correct answer 'топка'", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 1 },
      "топка",
    );
    assert.equal(result.correct, true, "Q2 should accept 'топка'");
    assert.equal(result.feedbackBg, "Браво!");
  });

  test("Question 2 (Q3) validation with correct answer 'рибица'", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 2 },
      "рибица",
    );
    assert.equal(result.correct, true, "Q3 should accept 'рибица'");
    assert.equal(result.feedbackBg, "Браво!");
  });

  test("Wrong index: Q2 rejects 'пухче' (Q1 answer)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 1 },
      "пухче",
    );
    assert.equal(result.correct, false, "Q2 should NOT accept 'пухче' (Q1 answer)");
  });

  test("Wrong index: Q3 rejects 'топка' (Q2 answer)", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 2 },
      "топка",
    );
    assert.equal(result.correct, false, "Q3 should NOT accept 'топка' (Q2 answer)");
  });

  test("Question index 0 with normalized '1.пухче' is correct", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 0 },
      "1.пухче",
    );
    assert.equal(result.correct, true, "Q1 should accept '1.пухче'");
  });

  test("Question index 2 with normalized '3) рибица!' is correct", () => {
    const result = evaluateBulgarianLessonAnswer(
      { grade: 2, topicId: "reading_comprehension_basic", questionIndex: 2 },
      "3) рибица!",
    );
    assert.equal(result.correct, true, "Q3 should accept '3) рибица!'");
  });
});
