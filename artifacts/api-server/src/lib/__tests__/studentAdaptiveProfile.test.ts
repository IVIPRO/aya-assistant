/**
 * Tests for Adaptive Learning Engine — Phase 1A: Student Profile Data Layer
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import {
  getAdaptiveProfile,
  updateAdaptiveProfile,
  getRecommendedDifficulty,
  shouldReviewWeakTopic,
  getAdaptiveMode,
} from "../studentAdaptiveProfile.js";

// Mock userId for tests
const TEST_USER_ID = 999;
const TEST_CHILD_ID = 888;

describe("Adaptive Learning Engine — Phase 1A", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // Test 1: Default Profile Creation
  // ──────────────────────────────────────────────────────────────────────────

  test("creates default profile on first access", async () => {
    const profile = await getAdaptiveProfile(TEST_CHILD_ID);
    assert.equal(profile.childId, TEST_CHILD_ID);
    assert.equal(profile.recentAccuracy, 0.5);
    assert.equal(profile.streakCorrect, 0);
    assert.equal(profile.streakWrong, 0);
    assert.deepEqual(profile.weakTopics, []);
    assert.deepEqual(profile.strongTopics, []);
    assert.equal(profile.recommendedMode, "normal");
  });

  test("default difficulty is 1 for both subjects", async () => {
    const profile = await getAdaptiveProfile(TEST_CHILD_ID);
    assert.equal(getRecommendedDifficulty(profile, "bulgarian_language"), 1);
    assert.equal(getRecommendedDifficulty(profile, "mathematics"), 1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 2: Streak and Difficulty Rules
  // ──────────────────────────────────────────────────────────────────────────

  test("3 consecutive correct answers raise difficulty by 1", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);
    const startDiff = getRecommendedDifficulty(profile, "bulgarian_language");

    // First correct answer
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "topic_1", true);
    assert.equal(profile.streakCorrect, 1);
    assert.equal(getRecommendedDifficulty(profile, "bulgarian_language"), startDiff);

    // Second correct answer
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "topic_1", true);
    assert.equal(profile.streakCorrect, 2);
    assert.equal(getRecommendedDifficulty(profile, "bulgarian_language"), startDiff);

    // Third correct answer — should raise difficulty
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "topic_1", true);
    assert.equal(profile.streakCorrect, 3);
    assert.equal(getRecommendedDifficulty(profile, "bulgarian_language"), Math.min(5, startDiff + 1));
  });

  test("2 consecutive wrong answers lower difficulty by 1", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);
    // Set initial difficulty to 3
    profile.currentDifficultyBySubject["bulgarian_language"] = 3;

    // First wrong answer
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "topic_2", false);
    assert.equal(profile.streakWrong, 1);
    assert.equal(getRecommendedDifficulty(profile, "bulgarian_language"), 3);

    // Second wrong answer — should lower difficulty
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "topic_2", false);
    assert.equal(profile.streakWrong, 2);
    assert.equal(getRecommendedDifficulty(profile, "bulgarian_language"), 2);
  });

  test("difficulty is capped at min 1 and max 5", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Test min cap (set to 1, try to lower)
    profile.currentDifficultyBySubject["bulgarian_language"] = 1;
    profile.streakWrong = 2;
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "topic_3", false);
    assert.equal(getRecommendedDifficulty(profile, "bulgarian_language"), 1, "Should not go below 1");

    // Test max cap (set to 5, try to raise)
    profile.currentDifficultyBySubject["bulgarian_language"] = 5;
    profile.streakCorrect = 3;
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "topic_3", true);
    assert.equal(getRecommendedDifficulty(profile, "bulgarian_language"), 5, "Should not go above 5");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 3: Weak Topic Detection
  // ──────────────────────────────────────────────────────────────────────────

  test("topic flagged as weak when success rate < 40% after 5+ attempts", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Simulate 5 attempts: 1 correct, 4 wrong = 20% success rate
    for (let i = 0; i < 4; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "weak_topic", false);
    }
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "weak_topic", true);

    assert.ok(
      profile.weakTopics.includes("weak_topic"),
      "Topic should be flagged as weak (20% < 40%)"
    );
  });

  test("weak topic is not flagged with fewer than 5 attempts", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Only 4 attempts with 0% success
    for (let i = 0; i < 4; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "not_yet_weak", false);
    }

    assert.ok(
      !profile.weakTopics.includes("not_yet_weak"),
      "Topic should not be flagged as weak with < 5 attempts"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 4: Strong Topic Detection
  // ──────────────────────────────────────────────────────────────────────────

  test("topic flagged as strong when success rate > 80% after 5+ attempts", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Simulate 5 attempts: 4 correct, 1 wrong = 80% success rate (boundary)
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "mathematics", "strong_topic", false);
    for (let i = 0; i < 4; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "mathematics", "strong_topic", true);
    }

    assert.ok(
      profile.strongTopics.includes("strong_topic"),
      "Topic should be flagged as strong (80% > 80%)"
    );
  });

  test("strong topic not flagged at 80% boundary (need > 80%)", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Exactly 80%: 4 correct, 1 wrong
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "mathematics", "boundary_topic", false);
    for (let i = 0; i < 4; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "mathematics", "boundary_topic", true);
    }

    // At 80% should not be strong (need > 80%)
    assert.ok(
      !profile.strongTopics.includes("boundary_topic"),
      "Topic at exactly 80% should not be flagged as strong"
    );
  });

  test("strong topic flagged at 85% success rate", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Simulate: 17 correct, 3 wrong = 85% success rate
    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "mathematics", "strong_topic_85", false);
    }
    for (let i = 0; i < 17; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "mathematics", "strong_topic_85", true);
    }

    assert.ok(
      profile.strongTopics.includes("strong_topic_85"),
      "Topic should be flagged as strong (85% > 80%)"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 5: Topic Performance Tracking
  // ──────────────────────────────────────────────────────────────────────────

  test("tracks topic attempts and correct count", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "test_topic", true);
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "test_topic", false);
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "test_topic", true);

    const perf = profile.topicPerformance["test_topic"];
    assert.equal(perf.attempts, 3);
    assert.equal(perf.correct, 2);
    assert.equal(perf.successRate, 2 / 3);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 6: Recommended Mode
  // ──────────────────────────────────────────────────────────────────────────

  test("recommended mode is 'boost' when streak >= 3", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "boost_topic", true);
    }

    assert.equal(getAdaptiveMode(profile), "boost");
  });

  test("recommended mode is 'review' when streak wrong >= 2", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    for (let i = 0; i < 2; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "review_topic", false);
    }

    assert.equal(getAdaptiveMode(profile), "review");
  });

  test("recommended mode is 'review' when weak topics exist", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create a weak topic
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "weak_review", i % 5 === 0);
    }

    assert.ok(profile.weakTopics.length > 0, "Should have at least one weak topic");
    assert.equal(getAdaptiveMode(profile), "review");
  });

  test("recommended mode is 'normal' otherwise", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // One correct and one wrong (no streak, no weak topics)
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "normal_topic", true);
    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "normal_topic", false);

    assert.equal(getAdaptiveMode(profile), "normal");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 7: shouldReviewWeakTopic Helper
  // ──────────────────────────────────────────────────────────────────────────

  test("shouldReviewWeakTopic returns true when weak topics exist and accuracy low", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create weak topic
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "review_weak", i % 5 === 0);
    }

    // Set low accuracy
    profile.recentAccuracy = 0.6; // below 70%
    profile.lastSubject = "bulgarian_language";

    assert.ok(
      shouldReviewWeakTopic(profile, "bulgarian_language"),
      "Should recommend weak topic review"
    );
  });

  test("shouldReviewWeakTopic returns false when accuracy is high", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create weak topic
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "high_acc_topic", true);
    }

    profile.recentAccuracy = 0.9; // above 70%
    profile.lastSubject = "bulgarian_language";

    assert.ok(
      !shouldReviewWeakTopic(profile, "bulgarian_language"),
      "Should not recommend review with high accuracy"
    );
  });

  test("shouldReviewWeakTopic returns false when no weak topics", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // No weak topics, low accuracy
    profile.recentAccuracy = 0.6;
    profile.lastSubject = "bulgarian_language";

    assert.ok(
      !shouldReviewWeakTopic(profile, "bulgarian_language"),
      "Should not recommend review without weak topics"
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Test 8: State Persistence
  // ──────────────────────────────────────────────────────────────────────────

  test("profile updates are persisted and retrieval returns same state", async () => {
    // Update profile
    let profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "bulgarian_language", "persist_topic", true);
    const firstDiff = getRecommendedDifficulty(profile, "bulgarian_language");

    // Retrieve again (simulates fresh session)
    const retrieved = await getAdaptiveProfile(TEST_CHILD_ID);
    const retrievedDiff = getRecommendedDifficulty(retrieved, "bulgarian_language");

    assert.equal(retrievedDiff, firstDiff, "Difficulty should persist");
  });

  test("last subject and topic are tracked", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    profile = await updateAdaptiveProfile(TEST_USER_ID, TEST_CHILD_ID, "mathematics", "math_topic_xyz", true);

    assert.equal(profile.lastSubject, "mathematics");
    assert.equal(profile.lastTopic, "math_topic_xyz");
  });
});
