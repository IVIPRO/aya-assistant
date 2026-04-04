/**
 * Exercise Difficulty Tracker — Smart Difficulty Adjustment
 * 
 * Tracks recent exercise results per student per subject.
 * Adjusts difficulty based on consecutive correct/wrong answers.
 * 
 * Rules:
 * - 3 correct in a row → increase difficulty
 * - 2 wrong in a row → decrease difficulty
 * - Mixed results → maintain difficulty
 */

import type { LessonMode } from "./aiLessonGenerator";

interface AnswerRecord {
  correct: boolean;
  timestamp: number;
}

interface StudentDifficultyState {
  childId: number;
  subject: string;
  lastAnswers: AnswerRecord[];
  difficultyLevel: 1 | 2 | 3; // 1=easy, 2=normal, 3=hard
  lastUpdated: number;
}

/**
 * In-memory store: Map of "childId:subject" → DifficultyState
 * Resets on server restart (acceptable for adaptive learning)
 */
const difficultyStates = new Map<string, StudentDifficultyState>();

const ANSWER_HISTORY_SIZE = 5;
const DIFFICULTY_TIMEOUT = 60 * 60 * 1000; // 1 hour: reset if inactive

/**
 * Convert difficulty level (1-3) to LessonMode
 */
export function difficultyLevelToMode(level: 1 | 2 | 3): LessonMode {
  if (level === 1) return "weak";
  if (level === 3) return "strong";
  return "normal";
}

/**
 * Get or initialize difficulty state for a student
 */
function getOrInitState(childId: number, subject: string): StudentDifficultyState {
  const key = `${childId}:${subject}`;
  
  let state = difficultyStates.get(key);
  
  // If state exists but stale (1 hour), reset
  if (state && Date.now() - state.lastUpdated > DIFFICULTY_TIMEOUT) {
    difficultyStates.delete(key);
    state = undefined;
  }
  
  if (!state) {
    state = {
      childId,
      subject,
      lastAnswers: [],
      difficultyLevel: 2, // Start at normal
      lastUpdated: Date.now(),
    };
    difficultyStates.set(key, state);
  }
  
  return state;
}

/**
 * Count consecutive correct answers at the end of the answer history
 */
function getConsecutiveCorrect(answers: AnswerRecord[]): number {
  let count = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i].correct) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Count consecutive wrong answers at the end of the answer history
 */
function getConsecutiveWrong(answers: AnswerRecord[]): number {
  let count = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (!answers[i].correct) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Update difficulty level based on answer history
 */
function updateDifficultyLevel(state: StudentDifficultyState): void {
  const correctCount = getConsecutiveCorrect(state.lastAnswers);
  const wrongCount = getConsecutiveWrong(state.lastAnswers);
  
  // 3 correct in a row → increase difficulty
  if (correctCount >= 3) {
    if (state.difficultyLevel < 3) {
      state.difficultyLevel = Math.min(3, (state.difficultyLevel + 1) as 1 | 2 | 3);
      console.log(`[DIFFICULTY] childId=${state.childId} subject=${state.subject}: INCREASE to level ${state.difficultyLevel} (${correctCount} correct)`);
    }
  }
  // 2 wrong in a row → decrease difficulty
  else if (wrongCount >= 2) {
    if (state.difficultyLevel > 1) {
      state.difficultyLevel = Math.max(1, (state.difficultyLevel - 1) as 1 | 2 | 3);
      console.log(`[DIFFICULTY] childId=${state.childId} subject=${state.subject}: DECREASE to level ${state.difficultyLevel} (${wrongCount} wrong)`);
    }
  }
  // Mixed results: maintain current level (no change)
}

/**
 * Record an exercise answer and update difficulty tracking
 * Called after recordExerciseResult in pool manager
 */
export function recordAnswer(childId: number, subject: string, correct: boolean): void {
  const state = getOrInitState(childId, subject);
  
  // Add answer to history
  state.lastAnswers.push({
    correct,
    timestamp: Date.now(),
  });
  
  // Keep only recent answers
  if (state.lastAnswers.length > ANSWER_HISTORY_SIZE) {
    state.lastAnswers.shift();
  }
  
  // Update difficulty based on new answer pattern
  updateDifficultyLevel(state);
  state.lastUpdated = Date.now();
}

/**
 * Get the current difficulty mode for a student/subject
 * This overrides the batch-level mode from pool stats
 */
export function getDifficultyMode(childId: number, subject: string): LessonMode {
  const state = getOrInitState(childId, subject);
  return difficultyLevelToMode(state.difficultyLevel);
}

/**
 * Get diagnostic info (for logging/debugging)
 */
export function getDifficultyState(childId: number, subject: string): {
  level: 1 | 2 | 3;
  mode: LessonMode;
  lastAnswers: boolean[];
} {
  const state = getOrInitState(childId, subject);
  return {
    level: state.difficultyLevel,
    mode: difficultyLevelToMode(state.difficultyLevel),
    lastAnswers: state.lastAnswers.map((a) => a.correct),
  };
}
