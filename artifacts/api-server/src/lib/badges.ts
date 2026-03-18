import type { BadgeRecord } from "@workspace/db";

export interface BadgeDefinition {
  id: string;
  title: string;
  icon: string;
  description: string;
  check: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  totalCompleted: number;
  completedBySubject: Record<string, number>;
  completedByZone: Record<string, number>;
  totalXp: number;
}

const BADGE_REGISTRY: BadgeDefinition[] = [
  {
    id: "first_mission",
    title: "First Step",
    icon: "🌟",
    description: "Completed your very first mission!",
    check: (s) => s.totalCompleted >= 1,
  },
  {
    id: "math_star",
    title: "Math Star",
    icon: "🔢",
    description: "Completed 2 Math missions",
    check: (s) => (s.completedBySubject["Math"] ?? 0) + (s.completedBySubject["Математика"] ?? 0) + (s.completedBySubject["Mathematik"] ?? 0) + (s.completedBySubject["Matemáticas"] ?? 0) + (s.completedBySubject["Maths"] ?? 0) >= 2,
  },
  {
    id: "reading_hero",
    title: "Reading Hero",
    icon: "📚",
    description: "Completed 2 Reading missions",
    check: (s) => (s.completedBySubject["Reading"] ?? 0) + (s.completedBySubject["Четене"] ?? 0) + (s.completedBySubject["Deutsch"] ?? 0) + (s.completedBySubject["Lengua"] ?? 0) + (s.completedBySubject["English"] ?? 0) >= 2,
  },
  {
    id: "science_explorer",
    title: "Science Explorer",
    icon: "🔭",
    description: "Completed 2 Science missions",
    check: (s) => (s.completedBySubject["Science"] ?? 0) + (s.completedBySubject["Човекът и природата"] ?? 0) + (s.completedBySubject["Sachkunde"] ?? 0) + (s.completedBySubject["Ciencias Naturales"] ?? 0) >= 2,
  },
  {
    id: "logic_genius",
    title: "Logic Genius",
    icon: "🧩",
    description: "Completed 2 Logic missions",
    check: (s) => (s.completedBySubject["Logic"] ?? 0) + (s.completedBySubject["Логика"] ?? 0) + (s.completedBySubject["Lógica"] ?? 0) >= 2,
  },
  {
    id: "english_champion",
    title: "English Champion",
    icon: "🗣️",
    description: "Completed 2 English missions",
    check: (s) => (s.completedBySubject["English"] ?? 0) + (s.completedBySubject["Английски"] ?? 0) + (s.completedBySubject["Englisch"] ?? 0) + (s.completedBySubject["Inglés"] ?? 0) >= 2,
  },
  {
    id: "zone_explorer",
    title: "Zone Explorer",
    icon: "🗺️",
    description: "Completed missions in 3 different zones",
    check: (s) => Object.keys(s.completedByZone).filter(z => (s.completedByZone[z] ?? 0) >= 1).length >= 3,
  },
  {
    id: "xp_collector",
    title: "XP Collector",
    icon: "⚡",
    description: "Earned 100 XP",
    check: (s) => s.totalXp >= 100,
  },
  {
    id: "mission_master",
    title: "Mission Master",
    icon: "🏆",
    description: "Completed 5 missions",
    check: (s) => s.totalCompleted >= 5,
  },
  {
    id: "all_zones",
    title: "World Explorer",
    icon: "🌍",
    description: "Completed at least one mission in every zone",
    check: (s) => {
      const zones = ["Math Island", "Reading Forest", "Logic Mountain", "English City", "Science Planet"];
      return zones.every(z => (s.completedByZone[z] ?? 0) >= 1);
    },
  },
];

export function evaluateBadges(
  stats: BadgeStats,
  existingBadges: BadgeRecord[]
): BadgeRecord[] {
  const existingIds = new Set(existingBadges.map(b => b.id));
  const newBadges: BadgeRecord[] = [];
  const now = new Date().toISOString();

  for (const def of BADGE_REGISTRY) {
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
