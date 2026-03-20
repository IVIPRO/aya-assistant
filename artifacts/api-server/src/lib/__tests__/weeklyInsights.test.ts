/**
 * Tests for Weekly Insights Helper — Phase 2A
 */

import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import { buildWeeklyInsights } from "../weeklyInsights.js";
import {
  updateAdaptiveProfile,
  getAdaptiveProfile,
} from "../studentAdaptiveProfile.js";

const TEST_USER_ID = 999;

describe("Weekly Insights Helper — Phase 2A", () => {
  let TEST_CHILD_ID: number;
  beforeEach(() => {
    TEST_CHILD_ID = 76000 + Math.floor(Math.random() * 10000);
  });

  test("strong math + weak Bulgarian weekly profile", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Strong math: 10 correct addition
    for (let i = 0; i < 10; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true
      );
    }

    // Weak Bulgarian: spelling 5 attempts, 1 correct
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

    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Should have math data
    assert.ok(insights.subjects.mathematics);
    assert.equal(insights.subjects.mathematics!.attempts, 10);

    // Should have Bulgarian data
    assert.ok(insights.subjects.bulgarian_language);
    assert.ok(insights.subjects.bulgarian_language!.weakTopics.length > 0);

    // Should reflect in wins/support
    assert.ok(
      insights.weeklyWins.includes("addition"),
      "addition should be in wins"
    );
    assert.ok(
      insights.weeklyNeedsSupport.some(s => s.includes("spelling")),
      "spelling should be in needs support"
    );
  });

  test("weak multiplication appears in weeklyNeedsSupport and home practice", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Weak multiplication: 5 attempts, 0 correct
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "multiplication",
        false
      );
    }

    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Should appear in needs support
    assert.ok(
      insights.weeklyNeedsSupport.some(s => s.includes("multiplication")),
      "multiplication should be in weeklyNeedsSupport"
    );

    // Should have multiplication-specific home practice
    assert.ok(
      insights.recommendedHomePractice.some(r => 
        r.toLowerCase().includes("умножение") || r.toLowerCase().includes("таблица")
      ),
      "Should recommend multiplication practice"
    );
  });

  test("strong reading comprehension appears in weeklyWins", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Strong reading: 6 correct on reading_comprehension_basic
    for (let i = 0; i < 6; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_comprehension_basic",
        true
      );
    }

    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Should be in wins
    assert.ok(
      insights.weeklyWins.some(w => w.includes("reading")),
      "reading_comprehension should be in weeklyWins"
    );

    // Should be in strong topics
    assert.ok(
      insights.subjects.bulgarian_language?.strongestTopics.some(t =>
        t.includes("reading")
      ),
      "reading should be in strongestTopics"
    );
  });

  test("no-data / low-data case does not crash", async () => {
    // Fresh child with no activity
    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Should return valid structure
    assert.ok(insights.childId === TEST_CHILD_ID);
    assert.ok(typeof insights.period === "string");
    assert.ok(Array.isArray(insights.weeklyWins));
    assert.ok(Array.isArray(insights.weeklyNeedsSupport));
    assert.ok(Array.isArray(insights.recommendedHomePractice));
    assert.ok(typeof insights.parentMessageBg === "string");

    // Should have empty/minimal data
    assert.ok(Object.keys(insights.subjects).length === 0 || insights.weeklyWins.length === 0);
  });

  test("parentMessageBg stays short and readable", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Mixed performance
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        i > 0 // 4 correct, 1 wrong
      );
    }

    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Should be under 300 chars
    assert.ok(
      insights.parentMessageBg.length < 300,
      "Parent message should be concise"
    );

    // Should be readable
    assert.ok(
      insights.parentMessageBg.length > 10,
      "Parent message should not be empty"
    );

    // Should not have technical terms
    assert.ok(
      !insights.parentMessageBg.includes("streak"),
      "Should not expose technical terms"
    );
  });

  test("deterministic output for same input", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Set up data
    for (let i = 0; i < 7; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "division",
        i % 2 === 0
      );
    }

    // Get insights twice
    const insights1 = await buildWeeklyInsights(TEST_CHILD_ID);
    const insights2 = await buildWeeklyInsights(TEST_CHILD_ID);

    // Should be identical
    assert.deepEqual(insights1.subjects, insights2.subjects);
    assert.deepEqual(insights1.weeklyWins, insights2.weeklyWins);
    assert.deepEqual(insights1.weeklyNeedsSupport, insights2.weeklyNeedsSupport);
    assert.equal(
      insights1.parentMessageBg,
      insights2.parentMessageBg,
      "Parent message should be identical"
    );
  });

  test("recommended home practice is capped at 3", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create many weak topics
    const topics = [
      "addition",
      "subtraction",
      "multiplication",
      "reading_basic",
      "spelling_basic",
    ];

    for (const topic of topics) {
      for (let i = 0; i < 5; i++) {
        profile = await updateAdaptiveProfile(
          TEST_USER_ID,
          TEST_CHILD_ID,
          topic.startsWith("reading") || topic.startsWith("spelling")
            ? "bulgarian_language"
            : "mathematics",
          topic,
          false
        );
      }
    }

    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    assert.ok(
      insights.recommendedHomePractice.length <= 3,
      "Home practice should be capped at 3"
    );
  });

  test("period is correctly set to 7d", async () => {
    const insights = await buildWeeklyInsights(TEST_CHILD_ID);
    assert.equal(insights.period, "7d");
  });

  test("includes weekly wins only for strong areas", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create one strong, one weak
    for (let i = 0; i < 8; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true // All correct
      );
    }

    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "subtraction",
        false // All wrong
      );
    }

    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Addition should be in wins
    assert.ok(
      insights.weeklyWins.some(w => w.includes("addition")),
      "addition should be in wins"
    );

    // Subtraction should be in needs support
    assert.ok(
      insights.weeklyNeedsSupport.some(s => s.includes("subtraction")),
      "subtraction should be in needs support"
    );
  });
});
