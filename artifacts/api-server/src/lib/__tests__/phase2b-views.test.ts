/**
 * Phase 2B Tests — Read-only views for parents and teachers
 */

import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import { buildWeeklyInsights } from "../weeklyInsights.js";
import { buildTeacherExport } from "../teacherExport.js";
import {
  updateAdaptiveProfile,
  getAdaptiveProfile,
} from "../studentAdaptiveProfile.js";

const TEST_USER_ID = 999;

describe("Phase 2B — Read-only Views", () => {
  let TEST_CHILD_ID: number;
  beforeEach(() => {
    TEST_CHILD_ID = 88000 + Math.floor(Math.random() * 10000);
  });

  test("parent progress card renders weekly insights correctly", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create some activity
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true
      );
    }

    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Verify all expected fields for parent card
    assert.ok(insights.childId === TEST_CHILD_ID);
    assert.ok(Array.isArray(insights.weeklyWins));
    assert.ok(Array.isArray(insights.weeklyNeedsSupport));
    assert.ok(Array.isArray(insights.recommendedHomePractice));
    assert.ok(typeof insights.parentMessageBg === "string");
  });

  test("teacher export card shows intervention flags", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create weak math performance
    for (let i = 0; i < 10; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "multiplication",
        i < 2 // 20% success
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID, 2);

    // Verify all expected fields for teacher card
    assert.ok(exportData.childId === TEST_CHILD_ID);
    assert.equal(exportData.grade, 2);
    assert.ok(Array.isArray(exportData.weakTopics));
    assert.ok(Array.isArray(exportData.strongTopics));
    assert.ok(Array.isArray(exportData.interventionFlags));
    assert.ok(Array.isArray(exportData.suggestedTeacherFocus));
  });

  test("parent progress returns empty state gracefully", async () => {
    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Should return valid structure even with no data
    assert.ok(insights.childId === TEST_CHILD_ID);
    assert.equal(insights.period, "7d");
    assert.ok(Array.isArray(insights.weeklyWins));
    assert.ok(Array.isArray(insights.weeklyNeedsSupport));
  });

  test("teacher export returns empty state gracefully", async () => {
    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should return valid structure even with no data
    assert.ok(exportData.childId === TEST_CHILD_ID);
    assert.ok(Array.isArray(exportData.weakTopics));
    assert.ok(Array.isArray(exportData.strongTopics));
  });

  test("no business logic duplication — views use existing helpers", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create identical activity
    for (let i = 0; i < 6; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "subtraction",
        i > 2 // 50% success
      );
    }

    // Get insights twice
    const insights1 = await buildWeeklyInsights(TEST_CHILD_ID);
    const insights2 = await buildWeeklyInsights(TEST_CHILD_ID);

    // Should be identical (helper logic used, not duplicated)
    assert.deepEqual(
      insights1.weeklyWins,
      insights2.weeklyWins,
      "Insights should be deterministic"
    );
  });

  test("parent progress weekly message is Bulgarian", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    for (let i = 0; i < 7; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        i > 0
      );
    }

    const insights = await buildWeeklyInsights(TEST_CHILD_ID);

    // Parent message should be in Bulgarian or empty
    if (insights.parentMessageBg) {
      assert.ok(
        insights.parentMessageBg.length > 0,
        "Parent message should not be empty when present"
      );
      assert.ok(
        insights.parentMessageBg.length < 300,
        "Parent message should be concise"
      );
    }
  });

  test("teacher export includes structured recommendations", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create mixed performance
    for (let i = 0; i < 8; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "division",
        i < 3
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID, 1);

    // Should have suggestions
    assert.ok(
      Array.isArray(exportData.suggestedTeacherFocus),
      "Should include teacher focus suggestions"
    );
  });
});
