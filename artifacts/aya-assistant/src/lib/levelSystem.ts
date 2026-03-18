export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400];
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export interface LevelProgress {
  level: number;
  xpInLevel: number;
  xpToNext: number;
  percent: number;
  isMaxLevel: boolean;
}

export function getLevelProgress(xp: number): LevelProgress {
  const level = getLevel(xp);
  const isMaxLevel = level >= MAX_LEVEL;
  const from = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const to = LEVEL_THRESHOLDS[level] ?? null;

  if (isMaxLevel || to === null) {
    return { level, xpInLevel: xp - from, xpToNext: 0, percent: 100, isMaxLevel: true };
  }

  const range = to - from;
  const current = xp - from;
  return {
    level,
    xpInLevel: current,
    xpToNext: range - current,
    percent: Math.min(100, Math.round((current / range) * 100)),
    isMaxLevel: false,
  };
}

export const LEVEL_NAMES: Record<number, { en: string; bg: string; es: string }> = {
  1: { en: "Beginner",   bg: "Начинаещ",   es: "Principiante" },
  2: { en: "Explorer",   bg: "Изследовател", es: "Explorador"   },
  3: { en: "Learner",    bg: "Ученик",      es: "Aprendiz"     },
  4: { en: "Achiever",   bg: "Постигащ",    es: "Logrador"     },
  5: { en: "Champion",   bg: "Шампион",     es: "Campeón"      },
  6: { en: "Master",     bg: "Майстор",     es: "Maestro"      },
};
