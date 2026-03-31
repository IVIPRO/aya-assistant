/**
 * Adaptive Difficulty System
 * 
 * Adjusts task difficulty based on student performance streaks.
 * Reuses existing curriculum difficulty levels: beginner, intermediate, advanced
 * 
 * Scope: Grades 2 & 5 mathematics
 */

import type { Grade } from "./curriculumMap";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface AdaptiveProfileState {
  correctStreak: number; // consecutive correct answers
  wrongStreak: number; // consecutive wrong answers
  totalAttempts: number; // all attempts in session
  correctCount: number; // total correct
  recentAnswers: boolean[]; // last 5 answers (true=correct)
}

export interface AdaptiveDifficultyParams {
  grade: Grade;
  topic: string;
  baseDifficulty: DifficultyLevel; // from curriculum
  profile: AdaptiveProfileState;
}

export interface DifficultyAdjustment {
  difficulty: DifficultyLevel;
  reason: string; // why difficulty changed
  confidence: "high" | "medium" | "low";
}

/* ── Grade 2 Adaptive Rules ── */

const getGrade2AdaptiveDifficulty = (
  topic: string,
  baseDifficulty: DifficultyLevel,
  profile: AdaptiveProfileState
): DifficultyAdjustment => {
  // Start with base difficulty from curriculum
  let difficulty = baseDifficulty;
  let reason = "base curriculum difficulty";
  let confidence: "high" | "medium" | "low" = "medium";

  // Rule 1: 3+ correct in a row → increase difficulty
  if (profile.correctStreak >= 3) {
    if (difficulty === "beginner") {
      difficulty = "intermediate";
      reason = "3 correct answers - challenge time!";
      confidence = "high";
    }
    // Can't go above intermediate for grade 2
  }

  // Rule 2: 2+ wrong in a row → decrease difficulty
  if (profile.wrongStreak >= 2) {
    if (difficulty === "intermediate" || difficulty === "advanced") {
      difficulty = "beginner";
      reason = "2 wrong answers - let's slow down";
      confidence = "high";
    }
  }

  // Rule 3: 50%+ success rate on 5+ attempts → increase slightly
  if (profile.totalAttempts >= 5) {
    const successRate = profile.correctCount / profile.totalAttempts;
    if (successRate >= 0.8 && difficulty === "beginner") {
      difficulty = "intermediate";
      reason = "high success rate (80%+) - ready for challenge";
      confidence = "medium";
    }
    if (successRate < 0.5 && difficulty === "intermediate") {
      difficulty = "beginner";
      reason = "low success rate (<50%) - practicing basics";
      confidence = "medium";
    }
  }

  return { difficulty, reason, confidence };
};

/* ── Grade 5 Adaptive Rules ── */

const getGrade5AdaptiveDifficulty = (
  topic: string,
  baseDifficulty: DifficultyLevel,
  profile: AdaptiveProfileState
): DifficultyAdjustment => {
  let difficulty = baseDifficulty;
  let reason = "base curriculum difficulty";
  let confidence: "high" | "medium" | "low" = "medium";

  // Rule 1: 4+ correct in a row → increase difficulty
  if (profile.correctStreak >= 4) {
    if (difficulty === "beginner") {
      difficulty = "intermediate";
      reason = "4 correct answers - stepping up";
      confidence = "high";
    } else if (difficulty === "intermediate") {
      difficulty = "advanced";
      reason = "4+ correct - time for advanced";
      confidence = "high";
    }
  }

  // Rule 2: 3+ wrong in a row → decrease difficulty
  if (profile.wrongStreak >= 3) {
    if (difficulty === "advanced") {
      difficulty = "intermediate";
      reason = "3 wrong answers - back to intermediate";
      confidence = "high";
    } else if (difficulty === "intermediate") {
      difficulty = "beginner";
      reason = "3+ wrong - practicing basics";
      confidence = "high";
    }
  }

  // Rule 3: Success rate tracking for decimals/fractions/algebra
  if (profile.totalAttempts >= 5) {
    const successRate = profile.correctCount / profile.totalAttempts;

    // Advanced topics need higher success threshold
    if (
      (topic.includes("decimal") ||
        topic.includes("fraction") ||
        topic.includes("algebra")) &&
      successRate < 0.6 &&
      difficulty === "intermediate"
    ) {
      difficulty = "beginner";
      reason = "low success on complex topic - practicing foundation";
      confidence = "medium";
    }

    // High success unlocks advanced
    if (successRate >= 0.85 && difficulty === "intermediate") {
      difficulty = "advanced";
      reason = "mastery level (85%+) - advanced content ready";
      confidence = "medium";
    }
  }

  // Rule 4: Word problems need special handling
  if (topic.includes("word-problem")) {
    // After 2 correct word problems, students are ready for harder ones
    if (profile.correctStreak >= 2 && difficulty === "beginner") {
      difficulty = "intermediate";
      reason = "word problem progress - more complex stories";
      confidence = "medium";
    }
  }

  return { difficulty, reason, confidence };
};

/* ── Main Adaptive Difficulty Function ── */

export const getAdaptiveDifficulty = (
  params: AdaptiveDifficultyParams
): DifficultyAdjustment => {
  try {
    if (params.grade === 2) {
      return getGrade2AdaptiveDifficulty(params.topic, params.baseDifficulty, params.profile);
    }

    if (params.grade === 5) {
      return getGrade5AdaptiveDifficulty(params.topic, params.baseDifficulty, params.profile);
    }

    // Fallback for other grades
    return {
      difficulty: params.baseDifficulty,
      reason: "grade not in adaptive scope",
      confidence: "low",
    };
  } catch (error) {
    // Never crash - return base difficulty
    console.debug("[Adaptive] Error computing difficulty:", error);
    return {
      difficulty: params.baseDifficulty,
      reason: "error in adaptive calculation",
      confidence: "low",
    };
  }
};

/**
 * Build adaptive profile state from session data
 */
export const buildAdaptiveProfile = (
  recentAnswers: boolean[], // last N answers (true=correct)
  totalCorrect: number,
  totalAttempts: number
): AdaptiveProfileState => {
  // Calculate streaks from recent answers
  let correctStreak = 0;
  let wrongStreak = 0;

  // Count correct streak from end
  for (let i = recentAnswers.length - 1; i >= 0; i--) {
    if (recentAnswers[i]) {
      correctStreak++;
    } else {
      break;
    }
  }

  // Count wrong streak from end
  for (let i = recentAnswers.length - 1; i >= 0; i--) {
    if (!recentAnswers[i]) {
      wrongStreak++;
    } else {
      break;
    }
  }

  return {
    correctStreak,
    wrongStreak,
    totalAttempts,
    correctCount: totalCorrect,
    recentAnswers,
  };
};

/**
 * Determine if difficulty change should be shown to user
 */
export const shouldNotifyDifficultyChange = (
  adjustment: DifficultyAdjustment,
  previousDifficulty: DifficultyLevel
): boolean => {
  return adjustment.difficulty !== previousDifficulty && adjustment.confidence === "high";
};
