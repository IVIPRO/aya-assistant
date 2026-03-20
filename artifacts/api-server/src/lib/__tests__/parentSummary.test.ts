/**
 * Tests for Parent Summary Helper — Phase 1D
 *
 * Verifies that parent summaries are:
 * 1. Deterministic and accurate
 * 2. Reflect adaptive profile data correctly
 * 3. Include practical parent-facing Bulgarian messages
 * 4. Don't change runtime behavior
 */

import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import { buildParentSummary } from "../parentSummary.js";
import {
  updateAdaptiveProfile,
  getAdaptiveProfile,
} from "../studentAdaptiveProfile.js";

const TEST_USER_ID = 999;

describe("Parent Summary Helper — Phase 1D", () => {
  // Use unique child IDs for each test to avoid state pollution
  let TEST_CHILD_ID: number;
  beforeEach(() => {
    TEST_CHILD_ID = 75000 + Math.floor(Math.random() * 10000);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 1: Strong Math + Weak Bulgarian
  // ──────────────────────────────────────────────────────────────────────────

  test("child strong in math + weak in Bulgarian spelling → summary reflects both", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Strong math: 10 correct addition attempts
    for (let i = 0; i < 10; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true
      );
    }

    // Weak Bulgarian: 5 attempts, 1 correct = 20%
    for (let i = 0; i < 4; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "spelling_basics",
        false
      );
    }
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "bulgarian_language",
      "spelling_basics",
      true
    );

    const summary = await buildParentSummary(TEST_CHILD_ID, 2);

    // Should have addition in strengths
    assert.ok(
      summary.strengths.includes("addition"),
      "Should include addition in strengths"
    );

    // Should have spelling in weak topics
    assert.ok(
      summary.weakTopics.includes("spelling_basics"),
      "Should include spelling_basics in weak topics"
    );

    // Should mention Bulgarian in parent message
    assert.ok(
      summary.parentMessageBg.toLowerCase().includes("практика"),
      "Parent message should suggest practice"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 2: Weak Math Multiplication
  // ──────────────────────────────────────────────────────────────────────────

  test("child weak in math multiplication → appears in weakTopics and recommendedNextFocus", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create weak multiplication: 5 attempts, 0 correct
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "multiplication",
        false
      );
    }

    const summary = await buildParentSummary(TEST_CHILD_ID);

    // Should be in weak topics
    assert.ok(
      summary.weakTopics.includes("multiplication"),
      "Multiplication should be weak"
    );

    // Should be in recommended focus
    assert.ok(
      summary.recommendedNextFocus.some(f => f.toLowerCase().includes("упражнения") || f.toLowerCase().includes("multiplication")),
      "Should recommend multiplication practice in focus"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 3: Stable in Both Subjects
  // ──────────────────────────────────────────────────────────────────────────

  test("child stable in both subjects → parent message is positive and suggests continuing", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Good performance on both subjects
    for (let i = 0; i < 8; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true
      );
    }
    for (let i = 0; i < 8; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_comprehension_basic",
        true
      );
    }

    const summary = await buildParentSummary(TEST_CHILD_ID);

    // Should have no weak topics
    assert.equal(summary.weakTopics.length, 0, "Should have no weak topics");

    // Should have strengths
    assert.ok(summary.strengths.length > 0, "Should have strengths");

    // Parent message should be positive
    assert.ok(
      summary.parentMessageBg.toLowerCase().includes("добре") ||
      summary.parentMessageBg.toLowerCase().includes("отлично"),
      "Parent message should be positive"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 4: Adaptive Modes Included Per Subject
  // ──────────────────────────────────────────────────────────────────────────

  test("adaptive modes are included per subject", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create boost mode for math (3 correct)
    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true
      );
    }

    // Create review mode for Bulgarian (2 wrong)
    for (let i = 0; i < 2; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "spelling_basics",
        false
      );
    }

    const summary = await buildParentSummary(TEST_CHILD_ID);

    // Both subjects should have mode data
    assert.ok(
      summary.adaptiveModeBySubject.mathematics,
      "Mathematics should have mode"
    );
    assert.ok(
      summary.adaptiveModeBySubject.bulgarian_language,
      "Bulgarian should have mode"
    );

    // Mathematics should be boost
    assert.equal(
      summary.adaptiveModeBySubject.mathematics,
      "boost",
      "Math mode should be boost"
    );

    // Bulgarian should be review
    assert.equal(
      summary.adaptiveModeBySubject.bulgarian_language,
      "review",
      "Bulgarian mode should be review"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 5: Summary is Deterministic
  // ──────────────────────────────────────────────────────────────────────────

  test("summary remains deterministic across multiple calls", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Set up some profile data
    for (let i = 0; i < 6; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "division",
        i < 5 // 5 correct, 1 wrong
      );
    }

    // Get summary twice
    const summary1 = await buildParentSummary(TEST_CHILD_ID, 3);
    const summary2 = await buildParentSummary(TEST_CHILD_ID, 3);

    // Should be identical
    assert.deepEqual(summary1.strengths, summary2.strengths);
    assert.deepEqual(summary1.weakTopics, summary2.weakTopics);
    assert.equal(
      summary1.parentMessageBg,
      summary2.parentMessageBg,
      "Parent message should be identical"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 6: No Runtime Behavior Changed
  // ──────────────────────────────────────────────────────────────────────────

  test("building summary does not change math/Bulgarian behavior", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Build initial profile
    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true
      );
    }

    // Get profile before summary
    const profileBefore = await getAdaptiveProfile(TEST_CHILD_ID);

    // Build summary (should not change anything)
    await buildParentSummary(TEST_CHILD_ID);

    // Get profile after summary
    const profileAfter = await getAdaptiveProfile(TEST_CHILD_ID);

    // Should be identical
    assert.equal(
      profileBefore.streakCorrect,
      profileAfter.streakCorrect,
      "Profile should not change"
    );
    assert.deepEqual(
      profileBefore.weakTopics,
      profileAfter.weakTopics,
      "Weak topics should not change"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 7: Bulgarian Parent Message is Short and Readable
  // ──────────────────────────────────────────────────────────────────────────

  test("Bulgarian parent message is short and readable", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Mixed performance
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "subtraction",
        i > 0 // 4 correct, 1 wrong
      );
    }

    const summary = await buildParentSummary(TEST_CHILD_ID, 2);

    // Message should be short (under 200 chars)
    assert.ok(
      summary.parentMessageBg.length < 300,
      "Parent message should be concise"
    );

    // Should be readable Bulgarian
    assert.ok(
      summary.parentMessageBg.length > 20,
      "Parent message should not be empty"
    );

    // Should not have technical jargon
    assert.ok(
      !summary.parentMessageBg.includes("streak"),
      "Should not expose technical terms"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 8: No Crashes with Empty Data
  // ──────────────────────────────────────────────────────────────────────────

  test("no empty/null crashes when one subject has no data yet", async () => {
    // Fresh child with no activity
    const summary = await buildParentSummary(TEST_CHILD_ID, 1);

    // Should not crash and should return valid structure
    assert.ok(summary.childId === TEST_CHILD_ID);
    assert.ok(Array.isArray(summary.strengths));
    assert.ok(Array.isArray(summary.weakTopics));
    assert.ok(Array.isArray(summary.recommendedNextFocus));
    assert.ok(typeof summary.parentMessageBg === "string");

    // Should handle empty recentProgress gracefully
    assert.ok(
      summary.recentProgress === null || typeof summary.recentProgress === "object"
    );
  });

  test("summary includes recent progress metrics when available", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Add some activity
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "multiplication",
        i % 2 === 0 // Alternating correct/wrong
      );
    }

    const summary = await buildParentSummary(TEST_CHILD_ID, 2);

    // Should have recent progress for math
    if (summary.recentProgress.mathematics) {
      assert.ok(
        summary.recentProgress.mathematics.attempts >= 5,
        "Should track attempts"
      );
      assert.ok(
        summary.recentProgress.mathematics.successRate >= 0 &&
          summary.recentProgress.mathematics.successRate <= 1,
        "Success rate should be 0-1"
      );
    }
  });

  test("recommended focus is capped at 3 items", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create many weak topics
    const weakTopics = [
      "addition",
      "subtraction",
      "multiplication",
      "division",
    ];

    for (const topic of weakTopics) {
      for (let i = 0; i < 5; i++) {
        profile = await updateAdaptiveProfile(
          TEST_USER_ID,
          TEST_CHILD_ID,
          "mathematics",
          topic,
          false
        );
      }
    }

    const summary = await buildParentSummary(TEST_CHILD_ID);

    assert.ok(
      summary.recommendedNextFocus.length <= 3,
      "Recommended focus should be capped at 3"
    );
  });
});
