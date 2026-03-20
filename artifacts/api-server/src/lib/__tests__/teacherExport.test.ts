/**
 * Tests for Teacher Export Helper — Phase 2A
 */

import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import { buildTeacherExport } from "../teacherExport.js";
import { updateAdaptiveProfile, getAdaptiveProfile } from "../studentAdaptiveProfile.js";

const TEST_USER_ID = 999;

describe("Teacher Export Helper — Phase 2A", () => {
  let TEST_CHILD_ID: number;
  beforeEach(() => {
    TEST_CHILD_ID = 77000 + Math.floor(Math.random() * 10000);
  });

  test("teacher export includes recentSessions and suggestedTeacherFocus", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create activity
    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true
      );
    }
    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "bulgarian_language",
        "reading_basic",
        true
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID, 2);

    // Should have recent sessions
    assert.ok(
      Array.isArray(exportData.recentSessions),
      "Should have recentSessions array"
    );
    assert.ok(
      exportData.recentSessions.length > 0,
      "Should have at least one recent session"
    );

    // Should have suggested focus
    assert.ok(
      Array.isArray(exportData.suggestedTeacherFocus),
      "Should have suggestedTeacherFocus array"
    );

    // Each session should have required fields
    for (const session of exportData.recentSessions) {
      assert.ok(session.subject);
      assert.ok(session.topic);
      assert.ok(typeof session.attempts === "number");
      assert.ok(typeof session.successRate === "number");
    }
  });

  test("intervention flag appears only when threshold reached", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Low success math: 10 attempts, 2 correct = 20%
    for (let i = 0; i < 10; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "multiplication",
        i < 2
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should have intervention flag for low math success
    assert.ok(
      exportData.interventionFlags.includes("repeated_low_success_math"),
      "Should flag repeated low success in math when < 50%"
    );
  });

  test("no intervention flag with good performance", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Good math: 8 correct, 2 wrong = 80%
    for (let i = 0; i < 10; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        i < 8
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should not flag low success
    assert.ok(
      !exportData.interventionFlags.includes("repeated_low_success_math"),
      "Should not flag low success with 80% success rate"
    );
  });

  test("multiple weak areas triggers intervention flag", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create 3 weak topics
    const weakTopics = ["addition", "subtraction", "multiplication"];
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

    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should have multiple weak areas flag
    assert.ok(
      exportData.interventionFlags.includes("multiple_weak_areas_identified"),
      "Should flag multiple weak areas"
    );
  });

  test("review mode generates needs_review_before_advancing flag", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Trigger review mode: 2 wrong answers
    for (let i = 0; i < 2; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "division",
        false
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should flag review mode
    assert.ok(
      exportData.interventionFlags.includes("needs_review_before_advancing"),
      "Should flag review mode"
    );
  });

  test("strong topics appear in export", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Strong math: 10 correct additions
    for (let i = 0; i < 10; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "addition",
        true
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should be in strong topics
    assert.ok(
      exportData.strongTopics.includes("addition"),
      "addition should be in strongTopics"
    );

    // Should also be in subject progress
    assert.ok(
      exportData.subjectProgress.mathematics?.strongTopics.includes("addition"),
      "addition should be in mathematics strongTopics"
    );
  });

  test("weak topics appear in export", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Weak division: 5 attempts, 0 correct
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "division",
        false
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should be in weak topics
    assert.ok(
      exportData.weakTopics.includes("division"),
      "division should be in weakTopics"
    );
  });

  test("no-data case does not crash", async () => {
    // Fresh child
    const exportData = await buildTeacherExport(TEST_CHILD_ID, 1);

    // Should return valid structure
    assert.ok(exportData.childId === TEST_CHILD_ID);
    assert.ok(Array.isArray(exportData.weakTopics));
    assert.ok(Array.isArray(exportData.strongTopics));
    assert.ok(Array.isArray(exportData.recentSessions));
    assert.ok(Array.isArray(exportData.interventionFlags));
    assert.ok(Array.isArray(exportData.suggestedTeacherFocus));
  });

  test("activeSubject and subjectProgress are included", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    for (let i = 0; i < 3; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "subtraction",
        i > 0
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should have active subject
    assert.ok(
      exportData.activeSubject,
      "Should have activeSubject"
    );

    // Should have subject progress for math
    assert.ok(
      exportData.subjectProgress.mathematics,
      "Should have mathematics progress"
    );

    // Should include lastActivity
    assert.ok(
      exportData.subjectProgress.mathematics?.lastActivity,
      "Should have lastActivity for mathematics"
    );
  });

  test("deterministic output", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Create some activity
    for (let i = 0; i < 5; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "multiplication",
        i % 2 === 0
      );
    }

    // Get export twice
    const export1 = await buildTeacherExport(TEST_CHILD_ID, 2);
    const export2 = await buildTeacherExport(TEST_CHILD_ID, 2);

    // Should be identical
    assert.deepEqual(export1.subjectProgress, export2.subjectProgress);
    assert.deepEqual(export1.weakTopics, export2.weakTopics);
    assert.deepEqual(export1.strongTopics, export2.strongTopics);
    assert.deepEqual(export1.interventionFlags, export2.interventionFlags);
  });

  test("suggested focus includes curriculum-aligned recommendations", async () => {
    let profile = await getAdaptiveProfile(TEST_CHILD_ID);

    // Weak math (low success rate overall)
    for (let i = 0; i < 10; i++) {
      profile = await updateAdaptiveProfile(
        TEST_USER_ID,
        TEST_CHILD_ID,
        "mathematics",
        "division",
        i < 3 // 30% success
      );
    }

    const exportData = await buildTeacherExport(TEST_CHILD_ID);

    // Should suggest reinforcement
    assert.ok(
      exportData.suggestedTeacherFocus.length > 0,
      "Should have teacher focus suggestions"
    );

    // Should include reinforcement message for weak area
    const focusText = exportData.suggestedTeacherFocus.join(" ");
    assert.ok(
      focusText.toLowerCase().includes("reinforcement") ||
        focusText.toLowerCase().includes("division"),
      "Should suggest reinforcement for weak area"
    );
  });

  test("export includes grade when provided", async () => {
    const exportData = await buildTeacherExport(TEST_CHILD_ID, 3);

    assert.equal(exportData.grade, 3, "Should include provided grade");
  });
});
