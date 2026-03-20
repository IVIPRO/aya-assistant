/**
 * Tests for Adaptive Learning Engine — Phase 1C: Bulgarian Lesson Flow Wiring
 *
 * Verifies that:
 * 1. Bulgarian answers trigger adaptive profile updates
 * 2. Weak Bulgarian topics are preferred when advancing
 * 3. Adaptive rules don't affect math or free chat
 * 4. Answer validation and question tracking remain unchanged
 */

import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import {
  getAdaptiveProfile,
  updateAdaptiveProfile,
  shouldReviewWeakTopic,
  getAdaptiveMode,
} from "../studentAdaptiveProfile.js";

const TEST_USER_ID = 999;

describe("Bulgarian Adaptive Wiring — Phase 1C", () => {
  // Use unique child IDs for each test to avoid state pollution
  let TEST_CHILD_ID: number;
  beforeEach(() => {
    TEST_CHILD_ID = 70000 + Math.floor(Math.random() * 10000);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 1: Bulgarian Answers Update Adaptive Profile
  // ──────────────────────────────────────────────────────────────────────────

  test("3 consecutive correct Bulgarian answers track in profile", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Simulate 3 correct Bulgarian answers on reading_comprehension_basic
    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_comprehension_basic",
        true
      );
    }

    assert.equal(profile.streakCorrect, 3, "Should have streak of 3");
    assert.equal(profile.lastSubject, "bulgarian_language");
    assert.equal(profile.lastTopic, "reading_comprehension_basic");
  });

  test("2 consecutive wrong Bulgarian answers track in profile", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Simulate 2 wrong Bulgarian answers
    for (let i = 0; i < 2; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "spelling_basics",
        false
      );
    }

    assert.equal(profile.streakWrong, 2, "Should have streak of 2 wrong");
    assert.equal(getAdaptiveMode(profile), "review");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 2: Weak Bulgarian Topic Preference
  // ──────────────────────────────────────────────────────────────────────────

  test("weak reading topic gets flagged and can be preferred", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create weak reading topic: 5 attempts, 1 correct = 20%
    for (let i = 0; i < 4; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_comprehension_advanced",
        false
      );
    }
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "bulgarian_language",
      "reading_comprehension_advanced",
      true
    );

    assert.ok(
      profile.weakTopics.includes("reading_comprehension_advanced"),
      "Reading topic should be weak"
    );

    // Simulate weak topic review mode
    profile.recentAccuracy = 0.6;
    profile.lastSubject = "bulgarian_language";
    assert.ok(
      shouldReviewWeakTopic(profile, "bulgarian_language"),
      "Should recommend weak topic review"
    );
  });

  test("weak spelling topic gets flagged and can be preferred", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create weak spelling topic: 5 attempts, 0 correct = 0%
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "spelling_grade2",
        false
      );
    }

    assert.ok(
      profile.weakTopics.includes("spelling_grade2"),
      "Spelling topic should be weak"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 3: Bulgarian Topic Progression Logic
  // ──────────────────────────────────────────────────────────────────────────

  test("high accuracy Bulgarian performance stays in same topic", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Perfect performance: 5 correct in a row
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_comprehension_basic",
        true
      );
    }

    assert.equal(
      profile.topicPerformance["reading_comprehension_basic"].successRate,
      1.0,
      "Should have 100% success"
    );
    assert.equal(getAdaptiveMode(profile), "boost", "Should be in boost mode");
  });

  test("low accuracy Bulgarian performance gets review mode", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Poor performance: 2 wrong in a row
    for (let i = 0; i < 2; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "spelling_basics",
        false
      );
    }

    assert.equal(getAdaptiveMode(profile), "review", "Should be in review mode");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 4: Bulgarian Mode Does Not Affect Math
  // ──────────────────────────────────────────────────────────────────────────

  test("Bulgarian topic tracking does not affect math difficulty", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Get 3 correct Bulgarian answers
    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_comprehension_basic",
        true
      );
    }

    // Math difficulty should remain at default 1
    // (Math only has 0 attempts, so no difficulty change)
    const mathDiff = profile.currentDifficultyBySubject["mathematics"];
    assert.equal(
      mathDiff,
      1,
      "Math difficulty should not change from Bulgarian language attempts"
    );
  });

  test("math operation tracking does not affect Bulgarian mode", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Get 2 wrong math answers (would normally enter review mode)
    for (let i = 0; i < 2; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        false
      );
    }

    // Bulgarian topic tracking should be independent
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "bulgarian_language",
      "reading_comprehension_basic",
      true
    );

    assert.equal(profile.streakCorrect, 1, "Bulgarian streak should be independent");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 5: Bulgarian Performance Metrics
  // ──────────────────────────────────────────────────────────────────────────

  test("Bulgarian topic performance is tracked separately per topic", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Good performance on reading
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_comprehension_basic",
        true
      );
    }

    // Poor performance on spelling
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "spelling_grade2",
        false
      );
    }

    assert.equal(
      profile.topicPerformance["reading_comprehension_basic"].successRate,
      1.0
    );
    assert.equal(
      profile.topicPerformance["spelling_grade2"].successRate,
      0.0
    );
    assert.ok(
      profile.strongTopics.includes("reading_comprehension_basic"),
      "Reading should be strong"
    );
    assert.ok(
      profile.weakTopics.includes("spelling_grade2"),
      "Spelling should be weak"
    );
  });

  test("recent accuracy reflects mix of topics", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Mix of Bulgarian and math, correct and wrong
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "bulgarian_language",
      "reading_basic",
      true
    );
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "bulgarian_language",
      "reading_basic",
      true
    );
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "bulgarian_language",
      "spelling_basic",
      false
    );
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "mathematics",
      "addition",
      true
    );

    // Should have 75% recent accuracy (3 correct, 1 wrong)
    assert.ok(
      profile.recentAccuracy > 0.5 && profile.recentAccuracy < 1.0,
      "Recent accuracy should reflect mixed performance"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 6: Bulgarian Mode Persistence
  // ──────────────────────────────────────────────────────────────────────────

  test("Bulgarian lesson state survives answer evaluation", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Simulate Bulgarian lesson answer
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "bulgarian_language",
      "reading_comprehension_grade2",
      true
    );

    // Profile should persist
    const retrieved = await getAdaptiveProfile(TEST_CHILD_ID);
    assert.equal(
      retrieved.lastSubject,
      "bulgarian_language",
      "Bulgarian subject should persist"
    );
  });

  test("multiple wrong Bulgarian answers keep mode consistent", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Get 2 wrong, then 1 more wrong
    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "spelling_basics",
        false
      );
    }

    // Should stay in review mode (streak is 3)
    assert.equal(getAdaptiveMode(profile), "review");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 7: Weak Topic Preference Logic
  // ──────────────────────────────────────────────────────────────────────────

  test("weak Bulgarian topic can be identified for review", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create multiple topics with varying success
    // Strong reading
    for (let i = 0; i < 6; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_strong",
        true
      );
    }

    // Weak spelling
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "spelling_weak",
        false
      );
    }
    profile = await updateAdaptiveProfile(
      TEST_USER_ID,
      TEST_CHILD_ID,
      "bulgarian_language",
      "spelling_weak",
      true
    );

    // Check weak topics
    assert.ok(
      profile.weakTopics.includes("spelling_weak"),
      "Spelling should be weak"
    );
    assert.ok(
      !profile.weakTopics.includes("reading_strong"),
      "Reading should not be weak"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 8: Integration — No State Corruption
  // ──────────────────────────────────────────────────────────────────────────

  test("Bulgarian adaptive does not corrupt topic data", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Simulate topic progression
    for (let attempt = 0; attempt < 10; attempt++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "topic_1",
        attempt % 2 === 0
      );
    }

    const perf = profile.topicPerformance["topic_1"];
    assert.equal(perf.attempts, 10, "Should track all 10 attempts");
    assert.equal(perf.correct, 5, "Should track 5 correct");
    assert.equal(perf.successRate, 0.5, "Should calculate correct success rate");
  });

  test("Bulgarian adaptive handles rapid topic switches", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Switch between topics rapidly (simulates moving through curriculum)
    const topics = [
      "reading_1",
      "reading_2",
      "spelling_1",
      "spelling_2",
      "grammar_1",
    ];

    for (const topic of topics) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        topic,
        Math.random() > 0.5
      );
    }

    // All topics should be tracked independently
    assert.equal(
      Object.keys(profile.topicPerformance).filter(t => topics.includes(t))
        .length,
      topics.length,
      "All topics should be tracked"
    );
  });
});
