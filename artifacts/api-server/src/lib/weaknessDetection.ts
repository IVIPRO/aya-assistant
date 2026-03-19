export const WEAK_SUCCESS_RATE = 70;
export const WEAK_WRONG_ANSWERS = 3;
export const WEAK_RETRY_COUNT = 2;

export type WeaknessLabel = "needs_more_practice" | "weak_topic" | "recommended_review";

export interface WeakTopic {
  subjectId: string;
  topicId: string;
  attempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  successRate: number;
  retryCount: number;
  quizPassed: boolean;
  label: WeaknessLabel;
}

export function detectWeakTopics(
  topics: Array<{
    subjectId: string;
    topicId: string;
    attempts: number;
    correctAnswers: number;
    wrongAnswers: number;
    retryCount: number;
    quizPassed: boolean;
  }>,
): WeakTopic[] {
  const weak: WeakTopic[] = [];

  for (const t of topics) {
    if (t.attempts === 0) continue;

    const successRate = Math.round((t.correctAnswers / t.attempts) * 100);
    const isWeak =
      successRate < WEAK_SUCCESS_RATE ||
      t.wrongAnswers >= WEAK_WRONG_ANSWERS ||
      t.retryCount >= WEAK_RETRY_COUNT ||
      (!t.quizPassed && t.attempts >= 2);

    if (!isWeak) continue;

    let label: WeaknessLabel;
    if (t.wrongAnswers >= WEAK_WRONG_ANSWERS || successRate < 50) {
      label = "weak_topic";
    } else if (t.retryCount >= WEAK_RETRY_COUNT) {
      label = "needs_more_practice";
    } else {
      label = "recommended_review";
    }

    weak.push({
      subjectId: t.subjectId,
      topicId: t.topicId,
      attempts: t.attempts,
      correctAnswers: t.correctAnswers,
      wrongAnswers: t.wrongAnswers,
      successRate,
      retryCount: t.retryCount,
      quizPassed: t.quizPassed,
      label,
    });
  }

  return weak.sort((a, b) => a.successRate - b.successRate);
}
