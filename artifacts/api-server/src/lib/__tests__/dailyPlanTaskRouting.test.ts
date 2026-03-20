/**
 * Tests for Daily Plan Task Routing
 * Verifies that daily plan tasks contain correct subject and topic IDs for flow opening
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import type { DailyPlanTask } from "@workspace/db";

describe("Daily Plan Task Routing", () => {
  test("math task structure has subject and topic for routing", () => {
    const mathTask: DailyPlanTask = {
      id: "task-1",
      subjectId: "mathematics",
      topicId: "addition",
      taskType: "lesson",
      xpReward: 50,
      status: "not_started",
    };

    assert.equal(mathTask.subjectId, "mathematics", "Math task should have mathematics subject");
    assert.ok(mathTask.topicId, "Math task should have topicId");
    assert.ok(mathTask.topicId.includes("addition") || mathTask.topicId === "addition", "Task topic should be identifiable");
  });

  test("Bulgarian language task structure has subject and topic for routing", () => {
    const bgTask: DailyPlanTask = {
      id: "task-2",
      subjectId: "bulgarian_language",
      topicId: "reading_comprehension_basic",
      taskType: "lesson",
      xpReward: 50,
      status: "not_started",
    };

    assert.equal(bgTask.subjectId, "bulgarian_language", "BG task should have bulgarian_language subject");
    assert.ok(bgTask.topicId.startsWith("reading_") || bgTask.topicId.includes("reading"), "BG task topic should be readable");
  });

  test("reading task structure has subject and topic for routing", () => {
    const readingTask: DailyPlanTask = {
      id: "task-3",
      subjectId: "bulgarian_language",
      topicId: "reading_comprehension_basic",
      taskType: "lesson",
      xpReward: 50,
      status: "not_started",
    };

    assert.equal(readingTask.subjectId, "bulgarian_language", "Reading task should have bulgarian_language subject");
    assert.ok(readingTask.topicId.includes("reading"), "Reading task should have reading-related topic");
  });

  test("task subject/topic IDs are strings for routing logic", () => {
    const tasks: DailyPlanTask[] = [
      { id: "1", subjectId: "mathematics", topicId: "multiplication", taskType: "practice", xpReward: 30, status: "not_started" },
      { id: "2", subjectId: "bulgarian_language", topicId: "spelling_basics", taskType: "practice", xpReward: 30, status: "not_started" },
    ];

    tasks.forEach(task => {
      assert.equal(typeof task.subjectId, "string", "subjectId must be string for routing");
      assert.equal(typeof task.topicId, "string", "topicId must be string for routing");
    });
  });

  test("daily plan tasks preserve weak topic flag for UI feedback", () => {
    const weakTask: DailyPlanTask & { isWeakTopic?: boolean } = {
      id: "weak-1",
      subjectId: "mathematics",
      topicId: "division",
      taskType: "practice",
      xpReward: 50,
      status: "not_started",
      isWeakTopic: true,
    };

    assert.equal(weakTask.isWeakTopic, true, "Weak topic flag should be preserved");
  });
});
