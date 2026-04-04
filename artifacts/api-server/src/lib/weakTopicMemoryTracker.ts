/**
 * Weak Topic Memory Tracker — Real-Time Difficulty-Based Weakness Detection
 * 
 * Tracks difficulty decreases per student per topic.
 * Marks a topic as potentially weak if:
 * - Difficulty decreases 2+ times (in "weak" direction)
 * - Combined with low accuracy (> 40% wrong answers)
 * 
 * Works alongside existing detectWeakTopics() function but adds
 * real-time signals based on difficulty adjustment patterns.
 */

import type { LessonMode } from "./aiLessonGenerator";

interface TopicWeakState {
  childId: number;
  subject: string;
  topic: string;
  difficultyDecreaseCount: number; // Times difficulty went down (3→2 or 2→1)
  difficultyIncreaseCount: number; // Times difficulty went up (for recovery tracking)
  lastDifficultyLevel: 1 | 2 | 3;  // 1=easy, 2=normal, 3=hard
  incorrectAnswerCount: number;
  totalAnswerCount: number;
  lastUpdated: number;
}

/**
 * In-memory store: Map of "childId:subject:topic" → WeakState
 * Resets on server restart (acceptable for real-time difficulty tracking)
 */
const weakTopicStates = new Map<string, TopicWeakState>();

const DIFFICULTY_DECREASE_THRESHOLD = 2; // Mark weak if difficulty decreases 2+ times
const ANSWER_COUNT_FOR_DECISION = 5;     // Need at least 5 answers for decision
const WEAK_TIMEOUT = 60 * 60 * 1000;     // 1 hour: reset if inactive

/**
 * Record a difficulty change for a topic
 * Called from exerciseDifficultyTracker when difficulty changes
 */
export function recordDifficultyChange(
  childId: number,
  subject: string,
  topic: string,
  oldLevel: 1 | 2 | 3,
  newLevel: 1 | 2 | 3,
): void {
  const key = `${childId}:${subject}:${topic}`;
  let state = weakTopicStates.get(key);

  // Initialize if missing or stale
  if (!state || Date.now() - state.lastUpdated > WEAK_TIMEOUT) {
    state = {
      childId,
      subject,
      topic,
      difficultyDecreaseCount: 0,
      difficultyIncreaseCount: 0,
      lastDifficultyLevel: 2,  // Assume normal start
      incorrectAnswerCount: 0,
      totalAnswerCount: 0,
      lastUpdated: Date.now(),
    };
    weakTopicStates.set(key, state);
  }

  // Track direction of difficulty change
  if (newLevel < oldLevel) {
    state.difficultyDecreaseCount++;
    console.log(`[WEAK_TOPIC] childId=${childId} subject=${subject} topic=${topic}: DIFFICULTY DOWN (${oldLevel}→${newLevel}) decreases=${state.difficultyDecreaseCount}`);
  } else if (newLevel > oldLevel) {
    state.difficultyIncreaseCount++;
    // Reset decrease counter if student improves
    if (state.difficultyIncreaseCount >= 2) {
      state.difficultyDecreaseCount = Math.max(0, state.difficultyDecreaseCount - 1);
      console.log(`[WEAK_TOPIC] childId=${childId} subject=${subject} topic=${topic}: DIFFICULTY UP (${oldLevel}→${newLevel}) — recovery signal`);
    }
  }

  state.lastDifficultyLevel = newLevel;
  state.lastUpdated = Date.now();
}

/**
 * Record an answer for a topic (correct or incorrect)
 * Called from exercisePoolManager when answer is recorded
 */
export function recordTopicAnswer(
  childId: number,
  subject: string,
  topic: string,
  isCorrect: boolean,
): void {
  const key = `${childId}:${subject}:${topic}`;
  let state = weakTopicStates.get(key);

  if (!state || Date.now() - state.lastUpdated > WEAK_TIMEOUT) {
    state = {
      childId,
      subject,
      topic,
      difficultyDecreaseCount: 0,
      difficultyIncreaseCount: 0,
      lastDifficultyLevel: 2,
      incorrectAnswerCount: 0,
      totalAnswerCount: 0,
      lastUpdated: Date.now(),
    };
    weakTopicStates.set(key, state);
  }

  state.totalAnswerCount++;
  if (!isCorrect) {
    state.incorrectAnswerCount++;
  }
  state.lastUpdated = Date.now();
}

/**
 * Check if a topic should be flagged as weak based on difficulty changes + accuracy
 * Returns: weak = true if meets weakness criteria
 */
export function isTopicPotentiallyWeak(
  childId: number,
  subject: string,
  topic: string,
): boolean {
  const state = weakTopicStates.get(`${childId}:${subject}:${topic}`);
  
  if (!state) return false;
  
  // Not enough answers yet for decision
  if (state.totalAnswerCount < ANSWER_COUNT_FOR_DECISION) return false;

  // Calculate accuracy
  const accuracy = state.totalAnswerCount > 0 
    ? (state.totalAnswerCount - state.incorrectAnswerCount) / state.totalAnswerCount
    : 1.0;

  // Mark weak if:
  // 1. Difficulty decreased 2+ times AND low accuracy (< 60%)
  // 2. OR more than 40% incorrect answers AND difficulty decreased
  const lowAccuracy = accuracy < 0.6;
  const highWrongRate = state.incorrectAnswerCount / state.totalAnswerCount > 0.4;
  const difficultyDown = state.difficultyDecreaseCount >= DIFFICULTY_DECREASE_THRESHOLD;
  const anyDifficultyDown = state.difficultyDecreaseCount >= 1;

  return (difficultyDown && lowAccuracy) || (highWrongRate && anyDifficultyDown);
}

/**
 * Get weakness score (0-100) for a topic
 * Higher = weaker topic
 */
export function getWeakTopicScore(
  childId: number,
  subject: string,
  topic: string,
): number {
  const state = weakTopicStates.get(`${childId}:${subject}:${topic}`);
  
  if (!state || state.totalAnswerCount < ANSWER_COUNT_FOR_DECISION) {
    return 0;
  }

  let score = 0;

  // Difficulty decreases contribute to weakness score
  score += state.difficultyDecreaseCount * 20;

  // Wrong answer rate contributes
  const wrongRate = state.incorrectAnswerCount / state.totalAnswerCount;
  score += wrongRate * 40;

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Get diagnostic info for a topic
 */
export function getWeakTopicState(
  childId: number,
  subject: string,
  topic: string,
): {
  isWeak: boolean;
  score: number;
  difficultyDecreases: number;
  accuracy: number;
  totalAnswers: number;
} {
  const state = weakTopicStates.get(`${childId}:${subject}:${topic}`);
  
  if (!state) {
    return {
      isWeak: false,
      score: 0,
      difficultyDecreases: 0,
      accuracy: 0,
      totalAnswers: 0,
    };
  }

  const accuracy = state.totalAnswerCount > 0
    ? (state.totalAnswerCount - state.incorrectAnswerCount) / state.totalAnswerCount
    : 0;

  return {
    isWeak: isTopicPotentiallyWeak(childId, subject, topic),
    score: getWeakTopicScore(childId, subject, topic),
    difficultyDecreases: state.difficultyDecreaseCount,
    accuracy,
    totalAnswers: state.totalAnswerCount,
  };
}

/**
 * Clear a topic's weakness state (when student improves significantly)
 * Called when success rate improves > 70% (recovery)
 */
export function clearWeakTopicFlag(
  childId: number,
  subject: string,
  topic: string,
): void {
  const key = `${childId}:${subject}:${topic}`;
  weakTopicStates.delete(key);
  console.log(`[WEAK_TOPIC] childId=${childId} subject=${subject} topic=${topic}: WEAKNESS FLAG CLEARED (recovery)`);
}
