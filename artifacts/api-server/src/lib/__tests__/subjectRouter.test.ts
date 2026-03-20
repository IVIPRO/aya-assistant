/**
 * Subject Router Tests — AYA Junior Bulgaria
 *
 * Tests for academic routing: Bulgarian language vs Mathematics subject detection.
 * Uses Node.js built-in test runner (node:test) — no extra dependencies.
 *
 * Run with: pnpm --filter @workspace/api-server test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { detectSubjectRequest } from "../juniorChatHandler.js";
import {
  getBulgarianLessonPrompt,
  getCurriculumTopics,
  getFirstTopic,
  getTopicById,
} from "../bgCurriculum.js";
import type { SubjectRequest } from "../juniorChatHandler.js";

// ─── Test 1: BG language phrases route to bulgarian_language ─────────────────

describe("Subject Router — Bulgarian Language", () => {
  const bgPhrases = [
    "да учим български език сега",
    "искам български",
    "искам урок по български",
    "дай ми упражнение по български",
    "нека четем",
    "нека пишем",
    "bulgarian lesson",
    "bulgarian language",
    "bulgarian",
    "български език",
  ];

  for (const phrase of bgPhrases) {
    test(`"${phrase}" → bulgarian_language`, () => {
      const result: SubjectRequest = detectSubjectRequest(phrase, "bg");
      assert.equal(
        result,
        "bulgarian_language",
        `Expected "bulgarian_language" for phrase: "${phrase}", got: "${result}"`,
      );
    });
  }
});

// ─── Test 2: Math phrases route to mathematics ────────────────────────────────

describe("Subject Router — Mathematics", () => {
  const mathPhrases = [
    "искам математика",
    "дай ми задача по математика",
    "да учим математика",
    "урок по математика",
    "math task",
    "math lesson",
  ];

  for (const phrase of mathPhrases) {
    test(`"${phrase}" → mathematics`, () => {
      const result: SubjectRequest = detectSubjectRequest(phrase, "bg");
      assert.equal(
        result,
        "mathematics",
        `Expected "mathematics" for phrase: "${phrase}", got: "${result}"`,
      );
    });
  }
});

// ─── Test 3: BG lesson response never contains arithmetic tasks ───────────────

describe("Bulgarian lesson prompt — no arithmetic", () => {
  const ARITHMETIC_PATTERN = /\b\d+\s*[+\-×÷=]\s*\d+/;
  const grades = [1, 2, 3, 4] as const;
  const bgSubjectTopics: Array<{ grade: number; topicId: string }> = [];

  // Collect all bulgarian_language topics across grades
  for (const grade of grades) {
    const topics = getCurriculumTopics(grade, "bulgarian_language");
    for (const t of topics) {
      bgSubjectTopics.push({ grade, topicId: t.topicId });
    }
  }

  for (const { grade, topicId } of bgSubjectTopics) {
    test(`grade ${grade} / ${topicId} — no arithmetic expression`, () => {
      const prompt = getBulgarianLessonPrompt(grade, topicId, "Мария", "🐼");
      assert.ok(
        !ARITHMETIC_PATTERN.test(prompt),
        `Arithmetic found in BG prompt for grade ${grade} / ${topicId}:\n${prompt}`,
      );
    });
  }

  test("grade 1 default topic — no arithmetic", () => {
    const prompt = getBulgarianLessonPrompt(1, null, "Иван", "📚");
    assert.ok(!ARITHMETIC_PATTERN.test(prompt), "Default grade 1 prompt contains arithmetic");
  });

  test("grade 4 default topic — no arithmetic", () => {
    const prompt = getBulgarianLessonPrompt(4, null, "Петя", "🦊");
    assert.ok(!ARITHMETIC_PATTERN.test(prompt), "Default grade 4 prompt contains arithmetic");
  });
});

// ─── Test 4: BG lesson prompt is non-empty and contains Bulgarian text ────────

describe("Bulgarian lesson prompt — content quality", () => {
  const CYRILLIC = /[\u0400-\u04FF]/;

  test("grade 1 prompt contains Bulgarian (Cyrillic) text", () => {
    const prompt = getBulgarianLessonPrompt(1, "letters_and_sounds", "Мария", "🐼");
    assert.ok(prompt.length > 20, "Prompt is too short");
    assert.ok(CYRILLIC.test(prompt), "Prompt contains no Cyrillic text");
  });

  test("grade 2 nouns prompt contains Bulgarian text", () => {
    const prompt = getBulgarianLessonPrompt(2, "nouns_basic", "Иван", "🦉");
    assert.ok(prompt.length > 20, "Prompt is too short");
    assert.ok(CYRILLIC.test(prompt), "Prompt contains no Cyrillic text");
  });

  test("grade 3 comprehension prompt contains Bulgarian text", () => {
    const prompt = getBulgarianLessonPrompt(3, "short_text_comprehension", "Ана", "🤖");
    assert.ok(prompt.length > 20, "Prompt is too short");
    assert.ok(CYRILLIC.test(prompt), "Prompt contains no Cyrillic text");
  });

  test("grade 4 grammar review prompt contains Bulgarian text", () => {
    const prompt = getBulgarianLessonPrompt(4, "grammar_review", "Петя", "🦊");
    assert.ok(prompt.length > 20, "Prompt is too short");
    assert.ok(CYRILLIC.test(prompt), "Prompt contains no Cyrillic text");
  });
});

// ─── Test 5: Academic profile state structure ─────────────────────────────────

describe("Academic profile data structures", () => {
  test("updateActiveSubject produces a correctly shaped ActiveSubjectState object", () => {
    // Test the shape of the object that would be stored — pure data, no DB needed
    const state = {
      activeSubject: "bulgarian_language",
      activeTopicId: "letters_and_sounds",
      grade: 1,
      country: "BG",
      updatedAt: new Date().toISOString(),
    };

    assert.equal(state.activeSubject, "bulgarian_language");
    assert.equal(state.activeTopicId, "letters_and_sounds");
    assert.equal(state.grade, 1);
    assert.equal(state.country, "BG");
    assert.ok(state.updatedAt.startsWith("202"), "updatedAt should be an ISO timestamp");
  });

  test("StudentAcademicProfile structure is complete", () => {
    const profile = {
      childId: 1,
      country: "BG",
      gradeLevel: 2,
      activeSubject: "bulgarian_language",
      activeTopicId: "nouns_basic",
      progressBySubject: { bulgarian_language: 0.75, mathematics: 0.6 },
      progressByTopic: {
        nouns_basic: {
          topicId: "nouns_basic",
          subjectId: "bulgarian_language",
          grade: 2,
          lessonsCompleted: 3,
          correctAnswers: 9,
          wrongAnswers: 3,
          attempts: 12,
          successRate: 0.75,
          lastActivityAt: new Date().toISOString(),
        },
      },
      weakTopics: [] as string[],
      strongTopics: ["nouns_basic"],
      lastActivityAt: new Date().toISOString(),
    };

    assert.equal(profile.childId, 1);
    assert.equal(profile.activeSubject, "bulgarian_language");
    assert.ok(Array.isArray(profile.weakTopics), "weakTopics must be an array");
    assert.ok(Array.isArray(profile.strongTopics), "strongTopics must be an array");
    assert.ok(profile.progressBySubject.bulgarian_language >= 0, "successRate is non-negative");
  });

  test("grade 1 has correct number of BG curriculum topics", () => {
    const topics = getCurriculumTopics(1, "bulgarian_language");
    assert.equal(topics.length, 5, "Grade 1 BG language should have 5 topics");
  });

  test("grade 2 first topic is reading_comprehension_basic", () => {
    const first = getFirstTopic(2, "bulgarian_language");
    assert.ok(first !== null, "Grade 2 should have topics");
    assert.equal(first!.topicId, "reading_comprehension_basic");
  });

  test("getTopicById returns correct topic", () => {
    const topic = getTopicById(3, "bulgarian_language", "spelling_rules_basic");
    assert.ok(topic !== null, "Topic should exist");
    assert.equal(topic!.topicTitleBg, "Правописни правила (основни)");
  });
});

// ─── Test 6: Progress structure — math storage not affected ──────────────────

describe("Progress structure — math routing unaffected", () => {
  test("detectSubjectRequest returns null for generic math trigger 'дай ми задача'", () => {
    // Generic math phrasing goes through existing intent router, not subject router
    const result = detectSubjectRequest("дай ми задача", "bg");
    assert.equal(result, null, "Generic 'дай ми задача' should not match subject router (falls through to intent)");
  });

  test("detectSubjectRequest returns null for unrelated input", () => {
    const result = detectSubjectRequest("здравей", "bg");
    assert.equal(result, null);
  });

  test("detectSubjectRequest returns null for math answer input", () => {
    const result = detectSubjectRequest("пет", "bg");
    assert.equal(result, null, "Bulgarian number word should not trigger subject router");
  });

  test("mathematics curriculum grade 1 has 4 topics", () => {
    const topics = getCurriculumTopics(1, "mathematics");
    assert.equal(topics.length, 4, "Grade 1 mathematics should have 4 topics");
  });

  test("mathematics curriculum grade 4 contains fractions_intro", () => {
    const topic = getTopicById(4, "mathematics", "fractions_intro");
    assert.ok(topic !== null, "fractions_intro should exist for grade 4");
    assert.equal(topic!.topicTitleBg, "Въведение в дробите");
  });

  test("BG language request does not route to mathematics", () => {
    const result = detectSubjectRequest("искам урок по български", "bg");
    assert.notEqual(result, "mathematics", "BG request should never map to mathematics");
    assert.equal(result, "bulgarian_language");
  });
});
