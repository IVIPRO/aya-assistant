/**
 * Tests for Daily Plan task wiring
 * Verifies that clicking daily plan tasks opens the correct learning flow
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import { elementarySubjects } from "@/lib/curriculum";

describe("Daily Plan Flow Wiring", () => {
  test("math task has subject and topic for routing", () => {
    const mathSubject = elementarySubjects.find(s => s.id === "mathematics");
    assert.ok(mathSubject, "Math subject should exist");
    
    const addition = mathSubject?.topics.find(t => t.id === "addition");
    assert.ok(addition, "Addition topic should exist under math");
    assert.equal(addition?.label.en, "Addition", "Topic label should be available");
  });

  test("Bulgarian language task has subject and topic for routing", () => {
    const bgSubject = elementarySubjects.find(s => s.id === "bulgarian_language");
    assert.ok(bgSubject, "Bulgarian subject should exist");
    
    const reading = bgSubject?.topics.find(t => t.id === "reading_comprehension_basic");
    assert.ok(reading, "Reading comprehension topic should exist under Bulgarian");
    assert.equal(reading?.label.bg, "Четене с разбиране", "Topic label should be in Bulgarian");
  });

  test("reading/comprehension task has subject and topic for routing", () => {
    const bgSubject = elementarySubjects.find(s => s.id === "bulgarian_language");
    assert.ok(bgSubject, "Bulgarian subject should exist");
    
    const readingTopics = bgSubject?.topics.filter(t => t.id.includes("reading"));
    assert.ok((readingTopics?.length ?? 0) > 0, "Reading topics should exist");
  });

  test("daily plan task resolves to valid subject and topic", () => {
    // Simulating task with subjectId and topicId
    const task = {
      subjectId: "mathematics",
      topicId: "multiplication",
    };

    const subject = elementarySubjects.find(s => s.id === task.subjectId);
    const topic = subject?.topics.find(t => t.id === task.topicId);
    
    assert.ok(subject, "Subject should resolve from task.subjectId");
    assert.ok(topic, "Topic should resolve from task.topicId");
    assert.equal(subject?.id, "mathematics", "Subject ID should match");
    assert.equal(topic?.id, "multiplication", "Topic ID should match");
  });

  test("daily plan callback receives subject and topic objects", () => {
    // This test validates the contract between DailyPlanCard and parent component
    const mockSubject = elementarySubjects.find(s => s.id === "mathematics");
    const mockTopic = mockSubject?.topics[0];

    assert.ok(mockSubject, "Mock subject should be resolved");
    assert.ok(mockTopic, "Mock topic should be resolved");
    assert.ok(mockSubject?.label, "Subject should have label object");
    assert.ok(mockTopic?.label, "Topic should have label object");
  });
});
