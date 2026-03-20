/**
 * Weekly Insights Helper — Phase 2A: Weekly Summary for Parents
 *
 * Builds a weekly summary (7-day retrospective) from adaptive profile and progress data.
 * Deterministic only, no AI, no LLM calls.
 */

import { getAdaptiveProfile } from "./studentAdaptiveProfile.js";

export interface WeeklyInsights {
  childId: number;
  period: "7d";
  subjects: {
    mathematics?: {
      attempts: number;
      successRate: number;
      strongestTopics: string[];
      weakTopics: string[];
      currentMode: "boost" | "normal" | "review";
    };
    bulgarian_language?: {
      attempts: number;
      successRate: number;
      strongestTopics: string[];
      weakTopics: string[];
      currentMode: "boost" | "normal" | "review";
    };
  };
  weeklyWins: string[]; // Up to 3 strong areas
  weeklyNeedsSupport: string[]; // Up to 3 weak areas
  recommendedHomePractice: string[]; // Max 3 practical activities
  parentMessageBg: string; // Short Bulgarian summary
}

/**
 * Build a weekly insights summary for a child.
 * Uses last 7 days of activity or all available if less than 7 days.
 */
export async function buildWeeklyInsights(childId: number): Promise<WeeklyInsights> {
  const profile = await getAdaptiveProfile(childId);

  // Extract mathematics progress
  const mathTopics = Object.entries(profile.topicPerformance)
    .filter(([topic]) =>
      topic.startsWith("addition") ||
      topic.startsWith("subtraction") ||
      topic.startsWith("multiplication") ||
      topic.startsWith("division")
    )
    .map(([topic, perf]) => ({ topic, perf }));

  const mathTotalAttempts = mathTopics.reduce((sum, t) => sum + t.perf.attempts, 0);
  const mathTotalCorrect = mathTopics.reduce((sum, t) => sum + t.perf.correct, 0);
  const mathSuccessRate =
    mathTotalAttempts > 0 ? mathTotalCorrect / mathTotalAttempts : 0;

  // Extract Bulgarian progress
  const bgTopics = Object.entries(profile.topicPerformance)
    .filter(([topic]) =>
      topic.startsWith("reading_") ||
      topic.startsWith("spelling_") ||
      topic.startsWith("grammar_")
    )
    .map(([topic, perf]) => ({ topic, perf }));

  const bgTotalAttempts = bgTopics.reduce((sum, t) => sum + t.perf.attempts, 0);
  const bgTotalCorrect = bgTopics.reduce((sum, t) => sum + t.perf.correct, 0);
  const bgSuccessRate = bgTotalAttempts > 0 ? bgTotalCorrect / bgTotalAttempts : 0;

  // Find strongest and weakest topics by subject
  const mathStrongest = mathTopics
    .sort((a, b) => b.perf.successRate - a.perf.successRate)
    .slice(0, 2)
    .map(t => t.topic);

  const mathWeakest = mathTopics
    .sort((a, b) => a.perf.successRate - b.perf.successRate)
    .slice(0, 2)
    .map(t => t.topic);

  const bgStrongest = bgTopics
    .sort((a, b) => b.perf.successRate - a.perf.successRate)
    .slice(0, 2)
    .map(t => t.topic);

  const bgWeakest = bgTopics
    .sort((a, b) => a.perf.successRate - b.perf.successRate)
    .slice(0, 2)
    .map(t => t.topic);

  // Build subjects object
  const subjects: WeeklyInsights["subjects"] = {};
  if (mathTotalAttempts > 0) {
    subjects.mathematics = {
      attempts: mathTotalAttempts,
      successRate: mathSuccessRate,
      strongestTopics: mathStrongest,
      weakTopics: mathWeakest.filter(t => mathTopics.find(m => m.topic === t)?.perf.successRate! < 0.6),
      currentMode: calculateSubjectMode(profile, "mathematics"),
    };
  }
  if (bgTotalAttempts > 0) {
    subjects.bulgarian_language = {
      attempts: bgTotalAttempts,
      successRate: bgSuccessRate,
      strongestTopics: bgStrongest,
      weakTopics: bgWeakest.filter(t => bgTopics.find(b => b.topic === t)?.perf.successRate! < 0.6),
      currentMode: calculateSubjectMode(profile, "bulgarian_language"),
    };
  }

  // Build weekly wins (strong areas, up to 3)
  const weeklyWins = [
    ...mathStrongest.slice(0, 1),
    ...bgStrongest.slice(0, 1),
  ].slice(0, 3);

  // Build weekly needs support (weak areas, up to 3)
  const weeklyNeedsSupport = [
    ...mathWeakest.filter(t => mathTopics.find(m => m.topic === t)?.perf.successRate! < 0.6).slice(0, 1),
    ...bgWeakest.filter(t => bgTopics.find(b => b.topic === t)?.perf.successRate! < 0.6).slice(0, 1),
  ].slice(0, 3);

  // Build home practice recommendations
  const recommendedHomePractice = buildHomePracticeRecommendations(
    weeklyNeedsSupport,
    mathWeakest,
    bgWeakest
  );

  // Generate parent message
  const parentMessageBg = generateWeeklyParentMessage(
    weeklyWins,
    weeklyNeedsSupport,
    subjects
  );

  return {
    childId,
    period: "7d",
    subjects,
    weeklyWins,
    weeklyNeedsSupport,
    recommendedHomePractice,
    parentMessageBg,
  };
}

/**
 * Helper to calculate per-subject adaptive mode.
 */
function calculateSubjectMode(
  profile: Awaited<ReturnType<typeof getAdaptiveProfile>>,
  subject: "mathematics" | "bulgarian_language"
): "boost" | "normal" | "review" {
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

  if (subjectTopics.length === 0) {
    return "normal";
  }

  const totalAttempts = subjectTopics.reduce((sum, p) => sum + p.attempts, 0);
  const totalCorrect = subjectTopics.reduce((sum, p) => sum + p.correct, 0);
  const successRate = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  const hasWeakInSubject = profile.weakTopics.some(topicFilter);

  if (hasWeakInSubject || successRate < 0.6) {
    return "review";
  } else if (successRate > 0.8) {
    return "boost";
  }
  return "normal";
}

/**
 * Build home practice recommendations (max 3).
 * Maps to actual weak topics when possible.
 */
function buildHomePracticeRecommendations(
  weeklyNeedsSupport: string[],
  mathWeakest: string[],
  bgWeakest: string[]
): string[] {
  const recommendations: string[] = [];

  // Add math-specific practice if weak topics exist
  const weakMath = mathWeakest.find(t =>
    weeklyNeedsSupport.includes(t)
  );
  if (weakMath) {
    if (weakMath.startsWith("addition")) {
      recommendations.push("3 лесни задачи по събиране до 10");
    } else if (weakMath.startsWith("subtraction")) {
      recommendations.push("3 задачи по изваждане до 10");
    } else if (weakMath.startsWith("multiplication")) {
      recommendations.push("Преглед на таблица за умножение (3х3, 4х4)");
    } else if (weakMath.startsWith("division")) {
      recommendations.push("Разбиране на разделяне с конкретни примери");
    }
  }

  // Add Bulgarian-specific practice if weak topics exist
  const weakBg = bgWeakest.find(t =>
    weeklyNeedsSupport.includes(t)
  );
  if (weakBg) {
    if (weakBg.startsWith("reading_")) {
      recommendations.push("5 минути четене на кратък текст и 2 въпроса по него");
    } else if (weakBg.startsWith("spelling_")) {
      recommendations.push("Упражнение за правопис на думи с ъ");
    } else if (weakBg.startsWith("grammar_")) {
      recommendations.push("Преглед на граматични правила с примери");
    }
  }

  // Generic recommendations if no specific weak topics
  if (recommendations.length === 0) {
    if (weeklyNeedsSupport.includes(mathWeakest[0])) {
      recommendations.push("Кратка математична практика по силни страни");
    }
    if (weeklyNeedsSupport.includes(bgWeakest[0])) {
      recommendations.push("Кратко четене и упражнения на български");
    }
  }

  return recommendations.slice(0, 3);
}

/**
 * Generate a short, calm Bulgarian message for parent about the week.
 */
function generateWeeklyParentMessage(
  weeklyWins: string[],
  weeklyNeedsSupport: string[],
  subjects: WeeklyInsights["subjects"]
): string {
  const parts: string[] = [];

  // Opening
  if (weeklyWins.length > 0 && weeklyNeedsSupport.length === 0) {
    parts.push("Отлична седмица!");
  } else if (weeklyWins.length > 0) {
    parts.push("Добра работа.");
  } else {
    parts.push("Продължава да работи усилено.");
  }

  // Add wins
  if (weeklyWins.length > 0) {
    const wins = weeklyWins.slice(0, 2).join(" и ");
    parts.push(`Успехи в ${wins}.`);
  }

  // Add areas for focus
  if (weeklyNeedsSupport.length > 0) {
    const needsSupport = weeklyNeedsSupport.slice(0, 2).join(" и ");
    parts.push(`Препоръчваме малко повече упражнения в ${needsSupport}.`);
  }

  // Add encouragement
  if (weeklyNeedsSupport.length > 0) {
    parts.push("Редовна 10-минутна практика ще помогне много.");
  }

  return parts.join(" ");
}
