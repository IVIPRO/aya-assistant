/**
 * Smart Task Sequencing for Daily Plans
 * Reorders daily plan tasks intelligently while preserving UI and task structure
 */

export interface TaskWithMetadata {
  subjectId: string;
  topicId: string;
  taskType: "lesson" | "practice";
  isWeakTopic: boolean;
  successRate?: number;
  baseXp: number;
  xpReward: number;
}

export interface SequencingContext {
  recentSuccessRate: number; // 0-100 overall success rate from last 30 days
  subjectSuccessRates: Record<string, number>; // per-subject success rates
}

/**
 * Score a task for ordering priority
 * Higher score = earlier in the plan
 */
function scoreTaskForSequencing(
  task: TaskWithMetadata,
  context: SequencingContext
): number {
  let score = 0;

  // 1. Weak topics appear FIRST (+1000)
  if (task.isWeakTopic) {
    score += 1000;
  }

  // 2. Review tasks (lesson mode) before practice tasks (+500)
  if (task.taskType === "lesson") {
    score += 500;
  }

  // 3. Boost by subject-specific success (if available)
  const subjectSuccess = context.subjectSuccessRates[task.subjectId] ?? context.recentSuccessRate;
  if (subjectSuccess < 60) {
    score += 300; // Low-success subjects get higher priority
  } else if (subjectSuccess > 80) {
    score += 50; // High-success subjects still get minor boost for variety
  }

  return score;
}

/**
 * Adjust task difficulty based on recent performance
 * Returns adjusted XP reward
 */
function adjustDifficultyBySuccess(
  task: TaskWithMetadata,
  context: SequencingContext,
  positionInPlan: number
): number {
  let adjustedXp = task.xpReward;

  // Low success rate → reduce difficulty for today
  if (context.recentSuccessRate < 50) {
    adjustedXp = Math.round(task.xpReward * 0.8);
  }

  // High success rate + later position → allow harder task as bonus
  if (context.recentSuccessRate > 80 && positionInPlan === 2) {
    // Third task (index 2) can be harder if child is doing well
    adjustedXp = Math.round(task.xpReward * 1.2);
  }

  return adjustedXp;
}

/**
 * Reorder and adjust a daily plan with smart sequencing
 * Maintains 3-task limit and all existing UI properties
 */
export function applySmartSequencing(
  tasks: TaskWithMetadata[],
  context: SequencingContext
): TaskWithMetadata[] {
  if (tasks.length === 0) return [];

  // Score and sort tasks
  const scored = tasks.map((t, idx) => ({
    task: t,
    score: scoreTaskForSequencing(t, context),
    originalIndex: idx,
  }));

  // Sort by score descending (highest priority first)
  scored.sort((a, b) => b.score - a.score);

  // Maintain 3-task limit
  const selected = scored.slice(0, 3).map((s, positionInPlan) => {
    const task = s.task;
    const adjustedXp = adjustDifficultyBySuccess(task, context, positionInPlan);
    return { ...task, xpReward: adjustedXp };
  });

  return selected;
}

/**
 * Classify task type for ordering (review vs. new learning)
 */
export function isReviewTask(task: TaskWithMetadata): boolean {
  return task.taskType === "lesson" || task.isWeakTopic;
}

/**
 * Calculate overall success rate from progress scores
 */
export function calculateSuccessRate(scores: number[]): number {
  if (scores.length === 0) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  // Assume scores are 0-100 XP, convert to success percentage
  return Math.min(100, Math.round((avg / 50) * 100));
}
