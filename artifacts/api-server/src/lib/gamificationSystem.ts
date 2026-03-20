/**
 * Gamification System: Streaks, Achievements, Celebrations
 * Enhances XP/level system with daily streaks and achievement badges
 */

export interface AchievementBadge {
  id: string;
  title: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export enum BadgeType {
  FIRST_LESSON = "first_lesson_completed",
  FIVE_DAY_STREAK = "five_day_streak",
  TEN_LESSONS = "ten_lessons_completed",
  FIFTY_LESSONS = "fifty_lessons_completed",
}

const BADGE_DEFINITIONS: Record<BadgeType, Omit<AchievementBadge, "earnedAt">> = {
  [BadgeType.FIRST_LESSON]: {
    id: BadgeType.FIRST_LESSON,
    title: "First Steps",
    icon: "🎉",
    description: "Completed your first lesson",
  },
  [BadgeType.FIVE_DAY_STREAK]: {
    id: BadgeType.FIVE_DAY_STREAK,
    title: "On Fire!",
    icon: "🔥",
    description: "5-day learning streak",
  },
  [BadgeType.TEN_LESSONS]: {
    id: BadgeType.TEN_LESSONS,
    title: "Lesson Master",
    icon: "📚",
    description: "Completed 10 lessons",
  },
  [BadgeType.FIFTY_LESSONS]: {
    id: BadgeType.FIFTY_LESSONS,
    title: "Learning Legend",
    icon: "👑",
    description: "Completed 50 lessons",
  },
};

/**
 * Calculate consecutive days of learning activity
 * Uses timestamps to determine actual consecutive days
 */
export function calculateDailyStreak(activityTimestamps: Date[]): number {
  if (activityTimestamps.length === 0) return 0;

  // Sort timestamps in descending order (most recent first)
  const sorted = [...activityTimestamps]
    .map(t => new Date(t))
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if there's activity today or yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = new Date(sorted[0]);
  lastActivity.setHours(0, 0, 0, 0);

  // If no activity today or yesterday, streak is broken
  const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
  if (daysDiff > 1) return 0;

  // Count consecutive days
  let streak = 1;
  let currentDate = new Date(lastActivity);

  for (let i = 1; i < sorted.length; i++) {
    const actDate = new Date(sorted[i]);
    actDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor((currentDate.getTime() - actDate.getTime()) / (24 * 60 * 60 * 1000));

    if (dayDiff === 1) {
      streak++;
      currentDate = actDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Count total lessons completed (from activity count)
 */
export function countLessonsCompleted(progressEntries: number): number {
  // Each progress entry typically represents one lesson completion
  return Math.max(0, progressEntries);
}

/**
 * Determine which badges to award based on achievement
 */
export function evaluateNewBadges(
  dailyStreak: number,
  lessonsCompleted: number,
  previousBadges: AchievementBadge[]
): AchievementBadge[] {
  const previousBadgeIds = new Set(previousBadges.map(b => b.id));
  const newBadges: AchievementBadge[] = [];
  const now = new Date().toISOString();

  // First lesson badge
  if (lessonsCompleted >= 1 && !previousBadgeIds.has(BadgeType.FIRST_LESSON)) {
    newBadges.push({
      ...BADGE_DEFINITIONS[BadgeType.FIRST_LESSON],
      earnedAt: now,
    });
  }

  // 5-day streak badge
  if (dailyStreak >= 5 && !previousBadgeIds.has(BadgeType.FIVE_DAY_STREAK)) {
    newBadges.push({
      ...BADGE_DEFINITIONS[BadgeType.FIVE_DAY_STREAK],
      earnedAt: now,
    });
  }

  // 10 lessons badge
  if (lessonsCompleted >= 10 && !previousBadgeIds.has(BadgeType.TEN_LESSONS)) {
    newBadges.push({
      ...BADGE_DEFINITIONS[BadgeType.TEN_LESSONS],
      earnedAt: now,
    });
  }

  // 50 lessons badge
  if (lessonsCompleted >= 50 && !previousBadgeIds.has(BadgeType.FIFTY_LESSONS)) {
    newBadges.push({
      ...BADGE_DEFINITIONS[BadgeType.FIFTY_LESSONS],
      earnedAt: now,
    });
  }

  return newBadges;
}

/**
 * Generate a completion celebration message
 * Returns child-friendly encouragement with XP earned
 */
export function generateCompletionCelebration(
  childName: string,
  xpEarned: number,
  streakDays: number,
  character: string = "panda"
): { message: string; emoji: string } {
  const messages: Record<string, string[]> = {
    panda: [
      `Wonderful work, ${childName}! 🐼`,
      `You're amazing, ${childName}! 🌟`,
      `Keep it up, ${childName}! 💪`,
      `Fantastic effort! 🎉`,
      `You got this, ${childName}! ✨`,
    ],
    robot: [
      `Excellent output, ${childName}! 🤖`,
      `Processing success! 🎯`,
      `Logical thinking, ${childName}! ⚡`,
      `Efficiency increased! 🚀`,
      `Well calculated, ${childName}! 📊`,
    ],
    fox: [
      `Clever work, ${childName}! 🦊`,
      `Quick thinking! 🎪`,
      `You're on fire, ${childName}! 🔥`,
      `Smart moves! 🎨`,
      `Playful learning, ${childName}! 🌈`,
    ],
    owl: [
      `Wise choice, ${childName}! 🦉`,
      `Thoughtful learning! 💭`,
      `You're wise, ${childName}! 📖`,
      `Peaceful progress! 🌙`,
      `Reflective learning, ${childName}! ✨`,
    ],
  };

  const charMessages = messages[character] || messages.panda;
  const baseMessage = charMessages[Math.floor(Math.random() * charMessages.length)];

  let celebrationMessage = `${baseMessage} You earned ${xpEarned} XP!`;

  if (streakDays > 0) {
    celebrationMessage += ` ${streakDays}-day streak! 🔥`;
  }

  return {
    message: celebrationMessage,
    emoji: character === "panda" ? "🐼" : character === "robot" ? "🤖" : character === "fox" ? "🦊" : "🦉",
  };
}

/**
 * Format streak display text (for UI)
 */
export function formatStreakDisplay(streakDays: number): string {
  if (streakDays === 0) return "No streak yet";
  if (streakDays === 1) return "1 day on fire! 🔥";
  if (streakDays < 7) return `${streakDays} days! 🔥`;
  if (streakDays < 30) return `${streakDays} days! 🔥🔥`;
  return `${streakDays} days! 🔥🔥🔥`;
}

/**
 * Get all badge definitions for UI rendering
 */
export function getAllBadgeDefinitions(): Record<string, AchievementBadge> {
  const definitions: Record<string, AchievementBadge> = {};
  for (const [key, def] of Object.entries(BADGE_DEFINITIONS)) {
    definitions[key] = {
      ...def,
      earnedAt: "", // Placeholder, will be filled by evaluateNewBadges
    };
  }
  return definitions;
}
