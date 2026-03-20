/**
 * Tests for Smart Task Sequencing (Daily Plan enhancement)
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import { applySmartSequencing, calculateSuccessRate, type TaskWithMetadata } from "../smartTaskSequencing.js";

describe("Smart Task Sequencing — Daily Plan Enhancement", () => {
  test("weak topics ordered first in daily plan", () => {
    const tasks: TaskWithMetadata[] = [
      {
        subjectId: "mathematics",
        topicId: "addition",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 30,
        xpReward: 30,
      },
      {
        subjectId: "bulgarian-language",
        topicId: "reading",
        taskType: "lesson",
        isWeakTopic: true, // Weak!
        baseXp: 35,
        xpReward: 35,
      },
      {
        subjectId: "logic-thinking",
        topicId: "puzzles",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 35,
        xpReward: 35,
      },
    ];

    const context = {
      recentSuccessRate: 60,
      subjectSuccessRates: {} as Record<string, number>,
    };

    const sequenced = applySmartSequencing(tasks, context);

    // Weak topic should be first (index 0)
    assert.equal(
      sequenced[0].topicId,
      "reading",
      "Weak topic should appear first in sequenced plan"
    );
    assert.ok(sequenced[0].isWeakTopic);
  });

  test("review tasks (lesson) appear before practice tasks", () => {
    const tasks: TaskWithMetadata[] = [
      {
        subjectId: "mathematics",
        topicId: "subtraction",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 30,
        xpReward: 30,
      },
      {
        subjectId: "bulgarian-language",
        topicId: "grammar",
        taskType: "lesson", // Review
        isWeakTopic: false,
        baseXp: 40,
        xpReward: 40,
      },
      {
        subjectId: "reading-literature",
        topicId: "stories",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 35,
        xpReward: 35,
      },
    ];

    const context = {
      recentSuccessRate: 70,
      subjectSuccessRates: {} as Record<string, number>,
    };

    const sequenced = applySmartSequencing(tasks, context);

    // Lesson task should come before practice tasks if no weak topics
    const lessonIndex = sequenced.findIndex(t => t.taskType === "lesson");
    const practiceIndices = sequenced
      .map((t, i) => (t.taskType === "practice" ? i : -1))
      .filter(i => i !== -1);

    if (lessonIndex !== -1 && practiceIndices.length > 0) {
      assert.ok(
        lessonIndex < Math.min(...practiceIndices),
        "Review tasks should appear before practice tasks"
      );
    }
  });

  test("low success rate reduces difficulty for today", () => {
    const task: TaskWithMetadata = {
      subjectId: "mathematics",
      topicId: "multiplication",
      taskType: "practice",
      isWeakTopic: false,
      baseXp: 40,
      xpReward: 40,
    };

    const tasks = [task];

    // Low success context
    const lowContext = {
      recentSuccessRate: 40, // Low
      subjectSuccessRates: {},
    };

    const sequencedLow = applySmartSequencing(tasks, lowContext);

    // High success context
    const highContext = {
      recentSuccessRate: 85, // High
      subjectSuccessRates: {},
    };

    const sequencedHigh = applySmartSequencing(tasks, highContext);

    // Low success rate should have reduced XP (difficulty)
    assert.ok(
      sequencedLow[0].xpReward < sequencedHigh[0].xpReward,
      "Low success rate should result in lower XP (easier task) for today"
    );

    // Verify reduced reward
    assert.ok(
      sequencedLow[0].xpReward === Math.round(40 * 0.8),
      "Low success should reduce XP to 80% of base"
    );
  });

  test("high success rate allows harder task later in plan", () => {
    const tasks: TaskWithMetadata[] = [
      {
        subjectId: "mathematics",
        topicId: "addition",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 30,
        xpReward: 30,
      },
      {
        subjectId: "bulgarian-language",
        topicId: "reading",
        taskType: "lesson",
        isWeakTopic: false,
        baseXp: 35,
        xpReward: 35,
      },
      {
        subjectId: "logic-thinking",
        topicId: "puzzles",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 35,
        xpReward: 35,
      },
    ];

    const highContext = {
      recentSuccessRate: 85, // High success
      subjectSuccessRates: {},
    };

    const sequenced = applySmartSequencing(tasks, highContext);

    // Third task (position 2) should have boosted XP if recent success is high
    if (sequenced.length === 3) {
      const thirdTask = sequenced[2];
      // High success + position 2 = 1.2x boost
      const expectedXp = Math.round(thirdTask.baseXp * 1.2);
      assert.equal(
        thirdTask.xpReward,
        expectedXp,
        "High success rate should allow bonus difficulty for third task"
      );
    }
  });

  test("existing daily plan UI structure preserved", () => {
    const tasks: TaskWithMetadata[] = [
      {
        subjectId: "mathematics",
        topicId: "addition",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 30,
        xpReward: 30,
      },
      {
        subjectId: "bulgarian-language",
        topicId: "reading",
        taskType: "lesson",
        isWeakTopic: true,
        baseXp: 35,
        xpReward: 35,
      },
      {
        subjectId: "logic-thinking",
        topicId: "puzzles",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 35,
        xpReward: 35,
      },
    ];

    const context = {
      recentSuccessRate: 60,
      subjectSuccessRates: {} as Record<string, number>,
    };

    const sequenced = applySmartSequencing(tasks, context);

    // Verify structure is preserved
    assert.ok(sequenced.length > 0 && sequenced.length <= 3, "Should return up to 3 tasks");
    sequenced.forEach(t => {
      assert.ok(t.subjectId, "Task should have subjectId");
      assert.ok(t.topicId, "Task should have topicId");
      assert.ok(["lesson", "practice"].includes(t.taskType), "Task should have valid taskType");
      assert.ok(typeof t.xpReward === "number", "Task should have xpReward");
      assert.ok(typeof t.isWeakTopic === "boolean", "Task should have isWeakTopic flag");
    });
  });

  test("success rate calculation is correct", () => {
    const scores1 = [50, 50, 50]; // 100% success (all 50 XP earned)
    const rate1 = calculateSuccessRate(scores1);
    assert.equal(rate1, 100, "Perfect success should be 100%");

    const scores2 = [25, 25, 25]; // 50% success
    const rate2 = calculateSuccessRate(scores2);
    assert.equal(rate2, 50, "Half average should be 50%");

    const scores3 = [0, 0, 0]; // 0% success
    const rate3 = calculateSuccessRate(scores3);
    assert.equal(rate3, 0, "No success should be 0%");

    const scores4: number[] = [];
    const rate4 = calculateSuccessRate(scores4);
    assert.equal(rate4, 0, "Empty scores should be 0%");
  });

  test("maintains 3-task limit for daily plans", () => {
    const tasks: TaskWithMetadata[] = [
      {
        subjectId: "mathematics",
        topicId: "addition",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 30,
        xpReward: 30,
      },
      {
        subjectId: "bulgarian-language",
        topicId: "reading",
        taskType: "lesson",
        isWeakTopic: false,
        baseXp: 35,
        xpReward: 35,
      },
      {
        subjectId: "logic-thinking",
        topicId: "puzzles",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 35,
        xpReward: 35,
      },
      {
        subjectId: "reading-literature",
        topicId: "stories",
        taskType: "practice",
        isWeakTopic: false,
        baseXp: 35,
        xpReward: 35,
      },
      {
        subjectId: "nature-science",
        topicId: "plants",
        taskType: "lesson",
        isWeakTopic: false,
        baseXp: 30,
        xpReward: 30,
      },
    ];

    const context = {
      recentSuccessRate: 60,
      subjectSuccessRates: {} as Record<string, number>,
    };

    const sequenced = applySmartSequencing(tasks, context);

    // Should not exceed 3 tasks
    assert.ok(
      sequenced.length <= 3,
      "Smart sequencing should maintain 3-task limit for child-friendly plans"
    );
  });
});
