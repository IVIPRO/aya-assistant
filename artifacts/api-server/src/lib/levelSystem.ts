import type { BadgeRecord, ChildTopicProgress } from "@workspace/db";

/* ─── Level thresholds ─────────────────────────────────────────── */
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400];

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelXpRange(level: number): { from: number; to: number | null } {
  const from = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const to = LEVEL_THRESHOLDS[level] ?? null;
  return { from, to };
}

/* ─── XP award amounts ─────────────────────────────────────────── */
export const XP_AWARDS = {
  lesson: 10,
  practice: 15,
  quiz: 20,
  correctAnswer: 5,
  streak: 10,
} as const;

/* ─── Badge system (lesson-aware) ──────────────────────────────── */
export interface LessonBadgeStats {
  mathLessons: number;
  readingLessons: number;
  logicActivities: number;
  totalLessons: number;
  streakDays: number;
}

export interface NewBadge {
  id: string;
  title: string;
  icon: string;
  description: string;
  earnedAt: string;
}

const LESSON_BADGE_DEFS: Array<{
  id: string;
  title: string;
  icon: string;
  description: string;
  check: (s: LessonBadgeStats) => boolean;
}> = [
  {
    id: "math_explorer",
    title: "Math Explorer",
    icon: "🔢",
    description: "Completed 5 math lessons",
    check: (s) => s.mathLessons >= 5,
  },
  {
    id: "reading_star",
    title: "Reading Star",
    icon: "📚",
    description: "Completed 3 reading lessons",
    check: (s) => s.readingLessons >= 3,
  },
  {
    id: "logic_master",
    title: "Logic Master",
    icon: "🧩",
    description: "Completed 5 logic exercises",
    check: (s) => s.logicActivities >= 5,
  },
  {
    id: "seven_day_streak",
    title: "7 Day Streak",
    icon: "🔥",
    description: "Studied 7 days in a row",
    check: (s) => s.streakDays >= 7,
  },
  {
    id: "first_lesson",
    title: "First Steps",
    icon: "🌟",
    description: "Completed your very first lesson",
    check: (s) => s.totalLessons >= 1,
  },
  {
    id: "lesson_master",
    title: "Lesson Master",
    icon: "🏆",
    description: "Completed 10 lessons",
    check: (s) => s.totalLessons >= 10,
  },
];

export function computeLessonBadgeStats(
  topicProgress: ChildTopicProgress[],
  streakDays: number,
): LessonBadgeStats {
  const mathLessons = topicProgress.filter(
    (r) => r.subjectId === "mathematics" && r.lessonDone,
  ).length;

  const readingLessons = topicProgress.filter(
    (r) => r.subjectId === "reading-literature" && r.lessonDone,
  ).length;

  const logicActivities = topicProgress.filter(
    (r) =>
      r.subjectId === "logic-thinking" &&
      (r.lessonDone || r.practiceDone || r.quizPassed),
  ).length;

  const totalLessons = topicProgress.filter((r) => r.lessonDone).length;

  return { mathLessons, readingLessons, logicActivities, totalLessons, streakDays };
}

export function evaluateLessonBadges(
  stats: LessonBadgeStats,
  existingBadges: BadgeRecord[],
): NewBadge[] {
  const existingIds = new Set(existingBadges.map((b) => b.id));
  const now = new Date().toISOString();
  const newBadges: NewBadge[] = [];

  for (const def of LESSON_BADGE_DEFS) {
    if (!existingIds.has(def.id) && def.check(stats)) {
      newBadges.push({
        id: def.id,
        title: def.title,
        icon: def.icon,
        description: def.description,
        earnedAt: now,
      });
    }
  }
  return newBadges;
}

/* ─── Streak computation ───────────────────────────────────────── */
/** Returns number of consecutive days (ending today) with at least one learning activity. */
export function computeStreak(activityDates: Date[]): number {
  if (activityDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Unique calendar days in UTC
  const daySet = new Set<string>();
  for (const d of activityDates) {
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    daySet.add(key);
  }

  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!daySet.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
