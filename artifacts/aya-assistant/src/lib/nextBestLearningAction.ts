/**
 * Decision Layer: nextBestLearningAction
 * 
 * Orchestrates all adaptive systems into unified learning recommendations.
 * 
 * Consumes:
 * - sessionPerformanceTracker (readiness score, streaks)
 * - topicConfidenceTracker (persistent mastery estimation)
 * - exerciseDifficultyTracker (difficulty level)
 * - weakTopicMemoryTracker (difficulty decrease patterns)
 * 
 * Produces: Single actionable recommendation for student
 * 
 * PRINCIPLES:
 * - Advisory only (never overrides existing progression rules)
 * - Non-breaking (all recommendations are suggestions)
 * - Evidence-based (uses multiple signals)
 * - Child-friendly (encourages, doesn't criticize)
 */

export type LearningAction = 
  | "continue_lesson"
  | "practice_more_exercises"
  | "ready_for_quiz"
  | "review_weak_topic"
  | "advance_to_next_topic"
  | "take_a_break";

export interface LearningDecision {
  action: LearningAction;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  messageBg: string;  // Bulgarian message
  messageEn: string;  // English fallback
  estimatedReadyIn?: number; // minutes until quiz ready, if action is practice_more
}

export interface DecisionContext {
  // Session-level signals
  sessionReadiness: number; // 0-100
  sessionCorrectStreak: number;
  sessionWrongStreak: number;
  sessionTotalAnswers: number;

  // Topic-level signals
  topicConfidence: number; // 0-100 (derived from successRate, retries, etc.)
  topicAttempts: number;
  topicSuccessRate: number; // 0-100
  topicIsWeak: boolean;
  topicIsStrong: boolean;

  // Difficulty signals
  currentDifficulty: 1 | 2 | 3; // from exerciseDifficultyTracker
  difficultyDecreases: number; // from weakTopicMemoryTracker

  // Context
  phaseName: "greeting" | "practice" | "quiz" | "completion";
  attemptsSoFar: number;
  maxAttempts: number;
}

/**
 * Core decision logic: What should the student do next?
 * 
 * Returns a single actionable recommendation based on all available signals.
 */
export function nextBestLearningAction(ctx: DecisionContext): LearningDecision {
  // 1️⃣ COMPLETION FLOW: Student just finished quiz
  if (ctx.phaseName === "completion") {
    return decidePostCompletion(ctx);
  }

  // 2️⃣ QUIZ READINESS: Should student attempt quiz now?
  if (ctx.phaseName === "practice" && ctx.sessionReadiness >= 75 && ctx.topicConfidence >= 70) {
    return {
      action: "ready_for_quiz",
      confidence: "high",
      reasoning: "Session readiness high + topic confidence good = quiz ready",
      messageBg: "Готов/а си за тест! Спробай да покажеш всичко, което научи.",
      messageEn: "You're ready for the quiz! Show me everything you learned.",
    };
  }

  // 3️⃣ WEAK TOPIC RECOVERY: Needs practice before quiz
  if (ctx.topicIsWeak && ctx.sessionReadiness < 50 && ctx.topicConfidence < 50) {
    const estimatedMin = Math.max(5, 50 - ctx.sessionReadiness) * 2; // Rough estimate
    return {
      action: "practice_more_exercises",
      confidence: "high",
      reasoning: "Topic weak + session unready + low confidence = intensive practice",
      messageBg: "Нека потренираме още малко. Всеки отговор те приближава до успеха!",
      messageEn: "Let's practice a bit more. Every answer brings you closer!",
      estimatedReadyIn: estimatedMin,
    };
  }

  // 4️⃣ DIFFICULTY TRENDING DOWN: Student struggling, provide support
  if (ctx.difficultyDecreases >= 2 && ctx.sessionWrongStreak >= 2) {
    return {
      action: "continue_lesson",
      confidence: "medium",
      reasoning: "Difficulty decreased multiple times + recent wrong streak = provide extra support",
      messageBg: "Виждам, че намираш това предизвиквачко. Отделихме малко време за обяснение.",
      messageEn: "I see this is challenging. Let's take some extra time to explain.",
    };
  }

  // 5️⃣ STRONG LEARNER: Can advance sooner
  if (ctx.topicIsStrong && ctx.topicConfidence >= 80 && ctx.sessionCorrectStreak >= 2) {
    return {
      action: "advance_to_next_topic",
      confidence: "medium",
      reasoning: "Topic strong + high confidence + good streak = ready for next topic",
      messageBg: "Отлично! Този тема я владееш добре. Готов ли си за следващата?",
      messageEn: "Excellent! You've got this topic down. Ready for the next one?",
    };
  }

  // 6️⃣ REVIEW WEAK TOPIC (not current): Suggest review
  if (ctx.topicIsWeak && ctx.topicConfidence < 40) {
    return {
      action: "review_weak_topic",
      confidence: "medium",
      reasoning: "Topic weak + very low confidence = needs review",
      messageBg: "Тази тема нуждае от още малко упражнения. Готов ли си да я повториш?",
      messageEn: "This topic needs a bit more practice. Ready to review it?",
    };
  }

  // 7️⃣ MODERATE PROGRESS: Continue normally
  if (ctx.sessionReadiness >= 50 && ctx.sessionReadiness < 75) {
    return {
      action: "continue_lesson",
      confidence: "high",
      reasoning: "Session progressing normally = continue",
      messageBg: "Отличен прогрес! Продължаваме нататък.",
      messageEn: "Great progress! Let's keep going.",
    };
  }

  // 8️⃣ EARLY STAGE: Just practice
  if (ctx.sessionTotalAnswers < 3) {
    return {
      action: "practice_more_exercises",
      confidence: "high",
      reasoning: "Too early to judge = keep practicing",
      messageBg: "Отговори на няколко повече задачи, за да видим как работиш.",
      messageEn: "Answer a few more questions so I can see how you're doing.",
    };
  }

  // 9️⃣ FATIGUE SIGNAL: Student needs break (wrong streak in later session)
  if (ctx.sessionTotalAnswers > 8 && ctx.sessionWrongStreak >= 3) {
    return {
      action: "take_a_break",
      confidence: "medium",
      reasoning: "Many attempts + long wrong streak = fatigue signal",
      messageBg: "Работиш много добре! Отвори очи малко и се върни след почивка.",
      messageEn: "You're working hard! Take a short break and we'll try again.",
    };
  }

  // ➓ DEFAULT: Continue practicing
  return {
    action: "continue_lesson",
    confidence: "high",
    reasoning: "Default action when no strong signal detected",
    messageBg: "Продължаваме! Всеки отговор е добър учебен момент.",
    messageEn: "Let's continue! Every answer is a great learning moment.",
  };
}

/**
 * Decide what happens after quiz completion
 */
function decidePostCompletion(ctx: DecisionContext): LearningDecision {
  const quizScorePercent = ctx.sessionCorrectStreak; // Using streak as proxy for score
  
  // High mastery: mark for progression
  if (quizScorePercent >= 90 && ctx.topicConfidence >= 85) {
    return {
      action: "advance_to_next_topic",
      confidence: "high",
      reasoning: "Quiz score 90%+ + high confidence = clear mastery",
      messageBg: "🏆 Невероятно! Владееш този материал напълно!",
      messageEn: "🏆 Amazing! You've mastered this topic completely!",
    };
  }

  // Good performance: solid understanding
  if (quizScorePercent >= 70 && ctx.topicConfidence >= 70) {
    return {
      action: "continue_lesson",
      confidence: "high",
      reasoning: "Quiz score 70%+ + good confidence = solid progress",
      messageBg: "⭐ Браво! Научи си темата много добре. Можем да продължим напред!",
      messageEn: "⭐ Well done! You've learned this well. We can move forward!",
    };
  }

  // Moderate performance: needs more practice
  if (quizScorePercent >= 50) {
    return {
      action: "practice_more_exercises",
      confidence: "medium",
      reasoning: "Quiz score 50-70% = needs consolidation",
      messageBg: "💪 Добър старт! Прегледай урока и упражнявай някой път повече.",
      messageEn: "💪 Good start! Review the lesson and practice a bit more.",
    };
  }

  // Low performance: review needed
  return {
    action: "review_weak_topic",
    confidence: "high",
    reasoning: "Quiz score <50% = needs thorough review",
    messageBg: "💭 Хайде да преразгледаме това. Ще ти помогна да го разбереш по-добре.",
    messageEn: "💭 Let's review this together. I'll help you understand it better.",
  };
}

/**
 * Get human-friendly text for an action
 */
export function getActionLabel(action: LearningAction, lang: "bg" | "en"): string {
  const labels: Record<LearningAction, Record<"bg" | "en", string>> = {
    continue_lesson: {
      bg: "Продължаваме урока",
      en: "Continue the lesson",
    },
    practice_more_exercises: {
      bg: "Упражнения",
      en: "Practice more",
    },
    ready_for_quiz: {
      bg: "Тест",
      en: "Quiz",
    },
    review_weak_topic: {
      bg: "Повторение",
      en: "Review",
    },
    advance_to_next_topic: {
      bg: "Следваща тема",
      en: "Next topic",
    },
    take_a_break: {
      bg: "Почивка",
      en: "Take a break",
    },
  };
  return labels[action]?.[lang] ?? labels[action]?.en ?? action;
}

/**
 * Determine if an action is "soft" (advisory) vs "hard" (enforced)
 * Soft actions can be ignored; hard actions shouldn't be bypassed
 */
export function isHardAction(action: LearningAction): boolean {
  const hardActions: Set<LearningAction> = new Set([
    "ready_for_quiz",      // Enable quiz button
    "take_a_break",        // Suggest stopping
  ]);
  return hardActions.has(action);
}
