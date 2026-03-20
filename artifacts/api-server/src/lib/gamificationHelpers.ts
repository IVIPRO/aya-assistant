/**
 * Phase 1 Gamification Helpers
 * Derives daily streak and badge eligibility from existing progress data
 * No schema changes, no new APIs — uses existing createdAt timestamps only
 */

export interface BadgeDefinition {
  id: string;
  title: string;
  icon: string;
  threshold: number; // lessons count for eligibility
  description: string;
}

export const BADGES: Record<string, BadgeDefinition> = {
  FIRST_LESSON: {
    id: "first_lesson",
    title: "First Steps",
    icon: "🎉",
    threshold: 1,
    description: "Completed your first lesson",
  },
  FIVE_DAY_STREAK: {
    id: "five_day_streak",
    title: "On Fire!",
    icon: "🔥",
    threshold: 5, // days
    description: "5-day learning streak",
  },
  TEN_LESSONS: {
    id: "ten_lessons",
    title: "Lesson Master",
    icon: "📚",
    threshold: 10,
    description: "Completed 10 lessons",
  },
  FIFTY_LESSONS: {
    id: "fifty_lessons",
    title: "Learning Legend",
    icon: "👑",
    threshold: 50,
    description: "Completed 50 lessons",
  },
};

/**
 * Calculate daily streak from progress createdAt timestamps
 * Returns consecutive days of activity ending today or yesterday
 */
export function calculateStreakFromProgress(progressDates: Date[]): number {
  if (progressDates.length === 0) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get unique days from progress dates
  const uniqueDays = new Set<string>();
  progressDates.forEach(date => {
    const d = new Date(date);
    const dayStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    uniqueDays.add(dayStr);
  });

  const sortedDays = Array.from(uniqueDays)
    .map(dayStr => {
      const [year, month, date] = dayStr.split("-").map(Number);
      return new Date(year, month, date);
    })
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if streak starts today or yesterday
  const latestDay = sortedDays[0];
  const daysDiff = Math.floor((today.getTime() - latestDay.getTime()) / (86400000)); // ms per day

  if (daysDiff > 1) return 0; // Streak broken

  // Count consecutive days backward
  let streak = 1;
  let currentDay = new Date(latestDay);

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = sortedDays[i];
    const dayDiff = Math.floor(
      (currentDay.getTime() - prevDay.getTime()) / 86400000
    );

    if (dayDiff === 1) {
      streak++;
      currentDay = new Date(prevDay);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get eligible badges based on lesson count and streak
 */
export function getEligibleBadges(
  lessonCount: number,
  streakDays: number
): BadgeDefinition[] {
  const eligible: BadgeDefinition[] = [];

  if (lessonCount >= BADGES.FIRST_LESSON.threshold) {
    eligible.push(BADGES.FIRST_LESSON);
  }
  if (streakDays >= BADGES.FIVE_DAY_STREAK.threshold) {
    eligible.push(BADGES.FIVE_DAY_STREAK);
  }
  if (lessonCount >= BADGES.TEN_LESSONS.threshold) {
    eligible.push(BADGES.TEN_LESSONS);
  }
  if (lessonCount >= BADGES.FIFTY_LESSONS.threshold) {
    eligible.push(BADGES.FIFTY_LESSONS);
  }

  return eligible;
}

/**
 * Format streak display for UI
 */
export function formatStreakDisplay(streakDays: number): string {
  if (streakDays === 0) return "No streak";
  if (streakDays === 1) return "1 day 🔥";
  if (streakDays < 7) return `${streakDays} days 🔥`;
  return `${streakDays} days 🔥🔥`;
}

/**
 * Format badge for UI display (with icon)
 */
export function formatBadgeDisplay(badge: BadgeDefinition): string {
  return `${badge.icon} ${badge.title}`;
}
