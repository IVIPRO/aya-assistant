import { useState, useEffect, useRef } from "react";
import type { Badge } from "@workspace/api-client-react";

export interface Celebration {
  type: "badge" | "streak" | "level";
  badgeIcon?: string;
  badgeTitle?: string;
  streakDays?: number;
  newLevel?: number;
}

interface CelebrationState {
  active: boolean;
  celebration: Celebration | null;
}

const STREAK_MILESTONES = [3, 5, 7];
const CELEBRATION_DURATION = 3000; // 3 seconds

/**
 * Hook to detect and trigger celebrations for badge unlocks, streak milestones, and level-ups.
 * Only triggers once per new event, not on every render.
 */
export function useCelebration(
  badges: Badge[],
  streak: number,
  level: number
): CelebrationState {
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [active, setActive] = useState(false);

  const prevBadgeCountRef = useRef(badges.length);
  const prevStreakRef = useRef(streak);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    // Detect new badge unlock
    if (badges.length > prevBadgeCountRef.current) {
      const newBadges = badges.slice(prevBadgeCountRef.current);
      const latestBadge = newBadges[newBadges.length - 1];
      if (latestBadge) {
        setCelebration({
          type: "badge",
          badgeIcon: latestBadge.icon,
          badgeTitle: latestBadge.title,
        });
        setActive(true);
      }
      prevBadgeCountRef.current = badges.length;
    }

    // Detect streak milestone
    if (streak > prevStreakRef.current && STREAK_MILESTONES.includes(streak)) {
      setCelebration({
        type: "streak",
        streakDays: streak,
      });
      setActive(true);
      prevStreakRef.current = streak;
    }

    // Detect level increase
    if (level > prevLevelRef.current) {
      setCelebration({
        type: "level",
        newLevel: level,
      });
      setActive(true);
      prevLevelRef.current = level;
    }

    // Auto-dismiss celebration after duration
    if (active && celebration) {
      const timer = setTimeout(() => {
        setActive(false);
      }, CELEBRATION_DURATION);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [badges, streak, level, active, celebration]);

  return { active, celebration };
}
