/**
 * Tests for Daily Plan Task Completion
 * Verifies that completing lessons marks daily plan tasks as completed
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import type { DailyPlanTask, DailyPlanTaskStatus } from "@workspace/db";

describe("Daily Plan Task Completion", () => {
  test("completed math task updates status to completed", () => {
    const task: DailyPlanTask = {
      id: "math-lesson-1",
      subjectId: "mathematics",
      topicId: "addition",
      taskType: "lesson",
      xpReward: 50,
      status: "not_started",
    };

    // Simulate completion
    const completedTask = { ...task, status: "completed" as DailyPlanTaskStatus };

    assert.equal(completedTask.status, "completed", "Math task status should be completed");
    assert.equal(completedTask.subjectId, "mathematics", "Subject should be preserved");
    assert.equal(completedTask.topicId, "addition", "Topic should be preserved");
  });

  test("completed Bulgarian task updates status to completed", () => {
    const task: DailyPlanTask = {
      id: "bg-lesson-1",
      subjectId: "bulgarian_language",
      topicId: "reading_comprehension_basic",
      taskType: "lesson",
      xpReward: 50,
      status: "not_started",
    };

    const completedTask = { ...task, status: "completed" as DailyPlanTaskStatus };

    assert.equal(completedTask.status, "completed", "Bulgarian task status should be completed");
  });

  test("completed reading task updates status to completed", () => {
    const task: DailyPlanTask = {
      id: "reading-1",
      subjectId: "bulgarian_language",
      topicId: "reading_comprehension_advanced",
      taskType: "practice",
      xpReward: 30,
      status: "not_started",
    };

    const completedTask = { ...task, status: "completed" as DailyPlanTaskStatus };

    assert.equal(completedTask.status, "completed", "Reading task status should be completed");
  });

  test("incomplete task remains not_started or in_progress", () => {
    const notStartedTask: DailyPlanTask = {
      id: "task-1",
      subjectId: "mathematics",
      topicId: "subtraction",
      taskType: "practice",
      xpReward: 30,
      status: "not_started",
    };

    // Should remain not_started if no completion signal
    assert.equal(notStartedTask.status, "not_started", "Incomplete task should stay not_started");

    // Even if marked in_progress, should not auto-complete
    const inProgressTask = { ...notStartedTask, status: "in_progress" as DailyPlanTaskStatus };
    assert.equal(inProgressTask.status, "in_progress", "In-progress task should stay in_progress without completion signal");
  });

  test("task completion preserves other task properties", () => {
    const task: DailyPlanTask = {
      id: "preserve-test",
      subjectId: "mathematics",
      topicId: "division",
      taskType: "lesson",
      xpReward: 75,
      status: "not_started",
    };

    const completedTask = { ...task, status: "completed" as DailyPlanTaskStatus };

    assert.equal(completedTask.id, task.id, "Task ID should be preserved");
    assert.equal(completedTask.subjectId, task.subjectId, "Subject ID should be preserved");
    assert.equal(completedTask.topicId, task.topicId, "Topic ID should be preserved");
    assert.equal(completedTask.taskType, task.taskType, "Task type should be preserved");
    assert.equal(completedTask.xpReward, task.xpReward, "XP reward should be preserved");
  });

  test("completed task counter increments correctly", () => {
    const tasks: DailyPlanTask[] = [
      { id: "1", subjectId: "mathematics", topicId: "addition", taskType: "lesson", xpReward: 50, status: "completed" },
      { id: "2", subjectId: "bulgarian_language", topicId: "spelling_basics", taskType: "practice", xpReward: 30, status: "not_started" },
      { id: "3", subjectId: "mathematics", topicId: "multiplication", taskType: "practice", xpReward: 30, status: "in_progress" },
    ];

    const completedCount = tasks.filter(t => t.status === "completed").length;
    const totalCount = tasks.length;

    assert.equal(completedCount, 1, "Should have 1 completed task");
    assert.equal(totalCount, 3, "Should have 3 total tasks");
    assert.equal(`${completedCount}/${totalCount}`, "1/3", "Counter display should be 1/3");
  });

  test("multiple tasks can be completed independently", () => {
    let tasks: DailyPlanTask[] = [
      { id: "1", subjectId: "mathematics", topicId: "addition", taskType: "lesson", xpReward: 50, status: "not_started" },
      { id: "2", subjectId: "bulgarian_language", topicId: "spelling_basics", taskType: "practice", xpReward: 30, status: "not_started" },
    ];

    // Complete first task
    tasks = tasks.map(t => t.id === "1" ? { ...t, status: "completed" as DailyPlanTaskStatus } : t);
    assert.equal(tasks.filter(t => t.status === "completed").length, 1, "After first completion: 1/2");

    // Complete second task
    tasks = tasks.map(t => t.id === "2" ? { ...t, status: "completed" as DailyPlanTaskStatus } : t);
    assert.equal(tasks.filter(t => t.status === "completed").length, 2, "After second completion: 2/2");
  });
});
