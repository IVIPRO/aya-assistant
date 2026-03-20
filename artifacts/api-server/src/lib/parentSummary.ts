/**
 * Parent Summary Helper — Phase 1D: Adaptive Learning Summary for Parents
 *
 * Builds concise, deterministic parent-facing summaries from adaptive profile data.
 * No AI, no LLM calls, no schema changes.
 *
 * Returns structured data + Bulgarian parent message suitable for email/dashboard.
 */

import { getAdaptiveProfile, getAdaptiveMode } from "./studentAdaptiveProfile.js";

export interface ParentSummary {
  childId: number;
  grade?: number;
  currentSubject: string | null;
  adaptiveModeBySubject: {
    mathematics: "boost" | "normal" | "review";
    bulgarian_language: "boost" | "normal" | "review";
  };
  strengths: string[]; // Topic names with >80% success
  weakTopics: string[]; // Topic names with <40% success
  recentProgress: {
    mathematics?: {
      successRate: number;
      attempts: number;
    };
    bulgarian_language?: {
      successRate: number;
      attempts: number;
    };
  };
  recommendedNextFocus: string[]; // Up to 3 practical focuses
  parentMessageBg: string; // Short Bulgarian message for parent
}

/**
 * Calculate adaptive mode for a specific subject based on recent performance.
 */
function calculateSubjectMode(
  profile: ReturnType<typeof getAdaptiveProfile> extends Promise<infer T> ? T : never,
  subject: "mathematics" | "bulgarian_language"
): "boost" | "normal" | "review" {
  // Get topics for this subject
  const topicFilter =
    subject === "mathematics"
      ? (t: string) =>
          t.startsWith("addition") ||
          t.startsWith("subtraction") ||
          t.startsWith("multiplication") ||
          t.startsWith("division")
      : (t: string) =>
          t.startsWith("reading_") ||
          t.startsWith("spelling_") ||
          t.startsWith("grammar_");

  const subjectTopics = Object.entries(profile.topicPerformance)
    .filter(([topic]) => topicFilter(topic))
    .map(([_, perf]) => perf);

  // If no data yet, return normal
  if (subjectTopics.length === 0) {
    return "normal";
  }

  // Calculate success rate for subject
  const totalAttempts = subjectTopics.reduce((sum, p) => sum + p.attempts, 0);
  const totalCorrect = subjectTopics.reduce((sum, p) => sum + p.correct, 0);
  const successRate = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  // Check for weak topics in this subject
  const hasWeakInSubject = profile.weakTopics.some(topicFilter);

  // Deterministic mode calculation for this subject
  if (hasWeakInSubject || successRate < 0.6) {
    return "review";
  } else if (successRate > 0.8) {
    return "boost";
  }
  return "normal";
}

/**
 * Build a parent summary from adaptive profile data.
 * Combines weak-topic detection, recent accuracy, and mode info.
 */
export async function buildParentSummary(childId: number, grade?: number): Promise<ParentSummary> {
  const profile = await getAdaptiveProfile(childId);

  // Extract mathematics progress
  const mathTopics = Object.entries(profile.topicPerformance)
    .filter(([topic]) => topic.startsWith("addition") || topic.startsWith("subtraction") || 
                          topic.startsWith("multiplication") || topic.startsWith("division"))
    .map(([topic, perf]) => perf);

  const mathSuccessRate = mathTopics.length > 0
    ? mathTopics.reduce((sum, p) => sum + p.correct, 0) / 
      mathTopics.reduce((sum, p) => sum + p.attempts, 0)
    : 0;

  // Extract Bulgarian progress
  const bgTopics = Object.entries(profile.topicPerformance)
    .filter(([topic]) => topic.startsWith("reading_") || topic.startsWith("spelling_") || 
                         topic.startsWith("grammar_"))
    .map(([topic, perf]) => perf);

  const bgSuccessRate = bgTopics.length > 0
    ? bgTopics.reduce((sum, p) => sum + p.correct, 0) / 
      bgTopics.reduce((sum, p) => sum + p.attempts, 0)
    : 0;

  // Build strengths (>80% success on 5+ attempts)
  const strengths: string[] = [];
  for (const [topic, perf] of Object.entries(profile.topicPerformance)) {
    if (perf.attempts >= 5 && perf.successRate > 0.8) {
      strengths.push(topic);
    }
  }

  // Weak topics already tracked in profile
  const weakTopics = profile.weakTopics;

  // Build adaptive mode for each subject based on recent performance
  const adaptiveModeBySubject = {
    mathematics: calculateSubjectMode(profile, "mathematics"),
    bulgarian_language: calculateSubjectMode(profile, "bulgarian_language"),
  };

  // Build recent progress summary
  const recentProgress: ParentSummary["recentProgress"] = {};
  if (mathTopics.length > 0) {
    const mathAttempts = mathTopics.reduce((sum, p) => sum + p.attempts, 0);
    const mathCorrect = mathTopics.reduce((sum, p) => sum + p.correct, 0);
    recentProgress.mathematics = {
      successRate: mathCorrect / mathAttempts,
      attempts: mathAttempts,
    };
  }
  if (bgTopics.length > 0) {
    const bgAttempts = bgTopics.reduce((sum, p) => sum + p.attempts, 0);
    const bgCorrect = bgTopics.reduce((sum, p) => sum + p.correct, 0);
    recentProgress.bulgarian_language = {
      successRate: bgCorrect / bgAttempts,
      attempts: bgAttempts,
    };
  }

  // Build recommended next focus (up to 3)
  const recommendedNextFocus = buildRecommendedFocus(
    weakTopics,
    strengths,
    profile.lastSubject,
    adaptiveModeBySubject
  );

  // Generate Bulgarian parent message
  const parentMessageBg = generateBulgarianParentMessage(
    strengths,
    weakTopics,
    adaptiveModeBySubject,
    grade
  );

  return {
    childId,
    grade,
    currentSubject: profile.lastSubject,
    adaptiveModeBySubject,
    strengths,
    weakTopics,
    recentProgress,
    recommendedNextFocus,
    parentMessageBg,
  };
}

/**
 * Build recommended next focus items (up to 3).
 * Prioritizes weak topics and suggests practical next steps.
 */
function buildRecommendedFocus(
  weakTopics: string[],
  strengths: string[],
  lastSubject: string | null,
  adaptiveModeBySubject: { mathematics: string; bulgarian_language: string }
): string[] {
  const focus: string[] = [];

  // Add weak math topics
  const weakMath = weakTopics.filter(t =>
    t.startsWith("addition") || t.startsWith("subtraction") ||
    t.startsWith("multiplication") || t.startsWith("division")
  );
  if (weakMath.length > 0) {
    focus.push(`Упражнения по ${weakMath[0]}`);
  }

  // Add weak Bulgarian topics
  const weakBg = weakTopics.filter(t =>
    t.startsWith("reading_") || t.startsWith("spelling_") || t.startsWith("grammar_")
  );
  if (weakBg.length > 0) {
    focus.push(`Практика по ${weakBg[0]}`);
  }

  // If no weak topics, suggest continuing or challenging
  if (focus.length === 0) {
    if (adaptiveModeBySubject.mathematics === "boost") {
      focus.push("Продължи с по-трудни математични задачи");
    }
    if (adaptiveModeBySubject.bulgarian_language === "boost") {
      focus.push("Продължи с по-напреднало четене на български");
    }
  }

  // Cap at 3 items
  return focus.slice(0, 3);
}

/**
 * Generate a short, natural Bulgarian message for parents.
 * Deterministic rules, no AI.
 */
function generateBulgarianParentMessage(
  strengths: string[],
  weakTopics: string[],
  adaptiveModeBySubject: { mathematics: string; bulgarian_language: string },
  grade?: number
): string {
  const parts: string[] = [];

  // Opening based on overall performance
  const hasStrenghts = strengths.length > 0;
  const hasWeakTopics = weakTopics.length > 0;
  const childName = "детето"; // Generic, will be personalized when used

  if (hasStrenghts && !hasWeakTopics) {
    parts.push(`${childName} се справя отлично!`);
  } else if (hasStrenghts) {
    parts.push(`${childName} се справя добре.`);
  } else {
    parts.push(`${childName} работи усилено.`);
  }

  // Add strength details (pick first 1-2)
  if (strengths.length > 0) {
    const strongTopics = strengths.slice(0, 2).join(" и ");
    parts.push(`Е силен/а в ${strongTopics}.`);
  }

  // Add weak topic guidance (pick first 1)
  if (weakTopics.length > 0) {
    const weakTopic = weakTopics[0];
    const topicLabel = weakTopic.startsWith("reading_")
      ? "четенето с разбиране"
      : weakTopic.startsWith("spelling_")
      ? "правописа"
      : weakTopic.startsWith("grammar_")
      ? "граматиката"
      : weakTopic;

    parts.push(`Препоръчваме повече упражнения с ${topicLabel}.`);
  }

  // Add practical suggestion
  if (weakTopics.length > 0) {
    parts.push("Кратка 10-минутна практика ще помогне много.");
  } else if (adaptiveModeBySubject.mathematics === "boost" ||
             adaptiveModeBySubject.bulgarian_language === "boost") {
    parts.push("Готово е за по-трудни предизвикателства!");
  }

  return parts.join(" ");
}
