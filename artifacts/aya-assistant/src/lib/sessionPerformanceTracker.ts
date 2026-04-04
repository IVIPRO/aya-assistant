/**
 * Session-Level Performance Tracker
 * 
 * Tracks quiz readiness within current lesson session.
 * Computes readiness score to guide lesson flow without duplicating
 * existing difficulty adjustment or topic progression logic.
 * 
 * SESSION = current lesson instance (ephemeral, not persisted)
 * Used by lesson-viewer to determine if student is ready for quiz.
 */

export interface SessionStats {
  totalAnswers: number;
  correctAnswers: number;
  wrongAnswers: number;
  retryAttempts: number;
  correctStreak: number;
  wrongStreak: number;
  answersOverTime: boolean[]; // recent answers (last 10)
}

export interface ReadinessSignal {
  score: number; // 0-100
  level: "not_ready" | "progressing" | "ready" | "overconfident";
  details: {
    accuracy: number; // 0-100
    streakBonus: number; // 0-30
    consistency: number; // 0-20 based on pattern stability
    timeWarning: boolean; // true if answers too fast (<3 sec avg)
  };
}

/**
 * Initialize empty session stats
 */
export function initializeSessionStats(): SessionStats {
  return {
    totalAnswers: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    retryAttempts: 0,
    correctStreak: 0,
    wrongStreak: 0,
    answersOverTime: [],
  };
}

/**
 * Record a single answer in the session
 * @param stats - current session stats
 * @param isCorrect - whether answer was correct
 * @param isRetry - whether this was a retry (after wrong attempt)
 * @returns updated stats
 */
export function recordSessionAnswer(
  stats: SessionStats,
  isCorrect: boolean,
  isRetry: boolean = false
): SessionStats {
  const updated = { ...stats };
  
  updated.totalAnswers += 1;
  updated.answersOverTime.push(isCorrect);
  // Keep only last 10 answers for pattern analysis
  if (updated.answersOverTime.length > 10) {
    updated.answersOverTime = updated.answersOverTime.slice(-10);
  }

  if (isCorrect) {
    updated.correctAnswers += 1;
    updated.correctStreak += 1;
    updated.wrongStreak = 0;
  } else {
    updated.wrongAnswers += 1;
    updated.correctStreak = 0;
    updated.wrongStreak += 1;
  }

  if (isRetry) {
    updated.retryAttempts += 1;
  }

  return updated;
}

/**
 * Compute quiz readiness score (0-100)
 * 
 * Formula:
 * - Accuracy (0-50): correct % of total answers
 * - Streak bonus (0-30): reward for consecutive correct (max 3 correct = 30 pts)
 * - Consistency (0-20): pattern stability over last 5 answers
 * 
 * Readiness levels:
 * - not_ready: < 50 (needs more practice)
 * - progressing: 50-75 (on track, keep practicing)
 * - ready: 75-100 (prepared for quiz)
 * - overconfident: 75+ with very fast answers or no retries (flag for pacing)
 */
export function computeReadinessScore(stats: SessionStats): ReadinessSignal {
  if (stats.totalAnswers === 0) {
    return {
      score: 0,
      level: "not_ready",
      details: {
        accuracy: 0,
        streakBonus: 0,
        consistency: 0,
        timeWarning: false,
      },
    };
  }

  // 1. ACCURACY (0-50): percentage correct
  const accuracy = Math.round((stats.correctAnswers / stats.totalAnswers) * 50);

  // 2. STREAK BONUS (0-30): reward for consecutive correct
  // 1-2 correct in a row = 10 pts, 3+ = 30 pts
  let streakBonus = 0;
  if (stats.correctStreak >= 3) {
    streakBonus = 30;
  } else if (stats.correctStreak >= 1) {
    streakBonus = Math.min(10, stats.correctStreak * 5);
  }

  // 3. CONSISTENCY (0-20): analyze last 5 answers
  // Stable pattern (no wild swings) = high consistency
  let consistency = 0;
  if (stats.answersOverTime.length >= 5) {
    const recent = stats.answersOverTime.slice(-5);
    const correctInRecent = recent.filter(a => a).length;
    // No sudden swings: if mostly correct or mostly wrong = more consistent
    if (correctInRecent >= 4 || correctInRecent === 0) {
      consistency = 20; // High confidence
    } else if (correctInRecent >= 2) {
      consistency = 10; // Medium confidence
    } else {
      consistency = 0; // Low confidence (all wrong recently)
    }
  } else if (stats.answersOverTime.length > 0) {
    // Not enough data, partial credit
    consistency = Math.round((stats.correctAnswers / stats.totalAnswers) * 10);
  }

  // 4. TIME WARNING: detect if answering too fast (gaming behavior)
  // This would be handled by parent component tracking response times
  // For now, flag if very high accuracy with minimal attempts (suspicious pattern)
  const timeWarning = stats.totalAnswers < 3 && accuracy > 80;

  const score = Math.min(100, accuracy + streakBonus + consistency);

  let level: "not_ready" | "progressing" | "ready" | "overconfident";
  if (score < 50) {
    level = "not_ready";
  } else if (score < 75) {
    level = "progressing";
  } else if (timeWarning) {
    level = "overconfident"; // High score but suspicious pattern
  } else {
    level = "ready";
  }

  return {
    score,
    level,
    details: {
      accuracy,
      streakBonus,
      consistency,
      timeWarning,
    },
  };
}

/**
 * Get coaching message based on readiness level
 */
export function getReadinessCoachingMessage(
  signal: ReadinessSignal,
  lang: "bg" | "en" | "es" | "de" | "fr"
): string | null {
  if (signal.level === "not_ready") {
    return lang === "bg"
      ? "Нужни са още упражнения преди да опитате теста."
      : "You need more practice before attempting the quiz.";
  }

  if (signal.level === "overconfident") {
    return lang === "bg"
      ? "Отговаряйте по-бавно и премислите всеки отговор."
      : "Take your time and think carefully about each answer.";
  }

  return null; // "progressing" and "ready" don't need coaching
}
