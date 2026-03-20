/**
 * Teacher Export Helper — Phase 2A: Structured Data for Teachers
 *
 * Builds deterministic, teacher-ready export data from adaptive profiles and progress.
 * No UI, no PDF generation, pure data structure only.
 */

import { getAdaptiveProfile } from "./studentAdaptiveProfile.js";

export interface TeacherExportData {
  childId: number;
  grade?: number;
  activeSubject: string | null;
  subjectProgress: {
    mathematics?: {
      attempts: number;
      successRate: number;
      strongTopics: string[];
      weakTopics: string[];
      lastActivity?: string; // Topic name
    };
    bulgarian_language?: {
      attempts: number;
      successRate: number;
      strongTopics: string[];
      weakTopics: string[];
      lastActivity?: string; // Topic name
    };
  };
  weakTopics: string[];
  strongTopics: string[];
  recentSessions: Array<{
    subject: string;
    topic: string;
    attempts: number;
    successRate: number;
  }>;
  interventionFlags: string[]; // e.g. "repeated_low_success_math"
  suggestedTeacherFocus: string[];
}

/**
 * Build teacher-ready export data for a child.
 * Deterministic only, no AI, no overflags.
 */
export async function buildTeacherExport(
  childId: number,
  grade?: number
): Promise<TeacherExportData> {
  const profile = await getAdaptiveProfile(childId);

  // Extract and organize mathematics topics
  const mathTopics = Object.entries(profile.topicPerformance)
    .filter(([topic]) =>
      topic.startsWith("addition") ||
      topic.startsWith("subtraction") ||
      topic.startsWith("multiplication") ||
      topic.startsWith("division")
    )
    .map(([topic, perf]) => ({
      topic,
      perf,
      successRate: perf.attempts > 0 ? perf.correct / perf.attempts : 0,
    }));

  const mathTotalAttempts = mathTopics.reduce((sum, t) => sum + t.perf.attempts, 0);
  const mathTotalCorrect = mathTopics.reduce((sum, t) => sum + t.perf.correct, 0);
  const mathSuccessRate =
    mathTotalAttempts > 0 ? mathTotalCorrect / mathTotalAttempts : 0;

  // Extract and organize Bulgarian topics
  const bgTopics = Object.entries(profile.topicPerformance)
    .filter(([topic]) =>
      topic.startsWith("reading_") ||
      topic.startsWith("spelling_") ||
      topic.startsWith("grammar_")
    )
    .map(([topic, perf]) => ({
      topic,
      perf,
      successRate: perf.attempts > 0 ? perf.correct / perf.attempts : 0,
    }));

  const bgTotalAttempts = bgTopics.reduce((sum, t) => sum + t.perf.attempts, 0);
  const bgTotalCorrect = bgTopics.reduce((sum, t) => sum + t.perf.correct, 0);
  const bgSuccessRate = bgTotalAttempts > 0 ? bgTotalCorrect / bgTotalAttempts : 0;

  // Find strong topics (>80% success on 5+ attempts)
  const strongTopics = Object.entries(profile.topicPerformance)
    .filter(([_, perf]) => perf.attempts >= 5 && perf.successRate > 0.8)
    .map(([topic]) => topic);

  // Weak topics from profile
  const weakTopics = profile.weakTopics;

  // Build subject progress
  const subjectProgress: TeacherExportData["subjectProgress"] = {};
  if (mathTotalAttempts > 0) {
    subjectProgress.mathematics = {
      attempts: mathTotalAttempts,
      successRate: mathSuccessRate,
      strongTopics: mathTopics
        .filter(t => t.successRate > 0.8 && t.perf.attempts >= 5)
        .map(t => t.topic),
      weakTopics: mathTopics
        .filter(t => t.successRate < 0.4 && t.perf.attempts >= 5)
        .map(t => t.topic),
      lastActivity: mathTopics[mathTopics.length - 1]?.topic,
    };
  }
  if (bgTotalAttempts > 0) {
    subjectProgress.bulgarian_language = {
      attempts: bgTotalAttempts,
      successRate: bgSuccessRate,
      strongTopics: bgTopics
        .filter(t => t.successRate > 0.8 && t.perf.attempts >= 5)
        .map(t => t.topic),
      weakTopics: bgTopics
        .filter(t => t.successRate < 0.4 && t.perf.attempts >= 5)
        .map(t => t.topic),
      lastActivity: bgTopics[bgTopics.length - 1]?.topic,
    };
  }

  // Build recent sessions (last 5 topics worked on)
  const recentSessions = Object.entries(profile.topicPerformance)
    .slice(-5)
    .map(([topic, perf]) => ({
      subject: getSubjectFromTopic(topic),
      topic,
      attempts: perf.attempts,
      successRate: perf.attempts > 0 ? perf.correct / perf.attempts : 0,
    }));

  // Calculate intervention flags
  const interventionFlags = calculateInterventionFlags(
    mathSuccessRate,
    bgSuccessRate,
    weakTopics,
    profile
  );

  // Calculate suggested teacher focus
  const suggestedTeacherFocus = calculateTeacherFocus(
    mathSuccessRate,
    bgSuccessRate,
    mathTopics,
    bgTopics,
    weakTopics
  );

  return {
    childId,
    grade,
    activeSubject: profile.lastSubject,
    subjectProgress,
    weakTopics,
    strongTopics,
    recentSessions,
    interventionFlags,
    suggestedTeacherFocus,
  };
}

/**
 * Determine subject from topic name.
 */
function getSubjectFromTopic(topic: string): string {
  if (
    topic.startsWith("addition") ||
    topic.startsWith("subtraction") ||
    topic.startsWith("multiplication") ||
    topic.startsWith("division")
  ) {
    return "mathematics";
  }
  return "bulgarian_language";
}

/**
 * Calculate intervention flags based on performance thresholds.
 * Only flag when clear thresholds are met (not overly aggressive).
 */
function calculateInterventionFlags(
  mathSuccessRate: number,
  bgSuccessRate: number,
  weakTopics: string[],
  profile: Awaited<ReturnType<typeof getAdaptiveProfile>>
): string[] {
  const flags: string[] = [];

  // Flag repeated low success in math (< 50% on 10+ attempts total)
  if (mathSuccessRate < 0.5 && profile.topicPerformance) {
    const mathAttempts = Object.entries(profile.topicPerformance)
      .filter(([t]) =>
        t.startsWith("addition") ||
        t.startsWith("subtraction") ||
        t.startsWith("multiplication") ||
        t.startsWith("division")
      )
      .reduce((sum, [_, p]) => sum + p.attempts, 0);

    if (mathAttempts >= 10) {
      flags.push("repeated_low_success_math");
    }
  }

  // Flag repeated low success in Bulgarian (< 50% on 10+ attempts total)
  if (bgSuccessRate < 0.5 && profile.topicPerformance) {
    const bgAttempts = Object.entries(profile.topicPerformance)
      .filter(([t]) =>
        t.startsWith("reading_") ||
        t.startsWith("spelling_") ||
        t.startsWith("grammar_")
      )
      .reduce((sum, [_, p]) => sum + p.attempts, 0);

    if (bgAttempts >= 10) {
      flags.push("repeated_low_success_bulgarian");
    }
  }

  // Flag if multiple weak topics identified
  if (weakTopics.length >= 3) {
    flags.push("multiple_weak_areas_identified");
  }

  // Flag if needs review before advancing (review mode)
  if (profile.recommendedMode === "review") {
    flags.push("needs_review_before_advancing");
  }

  return flags;
}

/**
 * Calculate suggested curriculum-aligned teacher focus areas.
 */
function calculateTeacherFocus(
  mathSuccessRate: number,
  bgSuccessRate: number,
  mathTopics: Array<{ topic: string; successRate: number; perf: any }>,
  bgTopics: Array<{ topic: string; successRate: number; perf: any }>,
  weakTopics: string[]
): string[] {
  const focus: string[] = [];

  // Math focus
  if (mathSuccessRate < 0.6) {
    const weakMath = mathTopics.find(t => t.successRate < 0.4);
    if (weakMath) {
      focus.push(`Reinforcement needed in ${weakMath.topic}`);
    }
  } else if (mathSuccessRate > 0.8) {
    focus.push("Consider introducing next-level math operations");
  }

  // Bulgarian focus
  if (bgSuccessRate < 0.6) {
    const weakBg = bgTopics.find(t => t.successRate < 0.4);
    if (weakBg) {
      focus.push(`Reinforcement needed in ${weakBg.topic}`);
    }
  } else if (bgSuccessRate > 0.8) {
    focus.push("Consider advancing Bulgarian language complexity");
  }

  return focus.slice(0, 3);
}
