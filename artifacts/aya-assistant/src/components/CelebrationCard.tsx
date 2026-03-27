import { motion, AnimatePresence } from "framer-motion";
import type { Celebration } from "@/hooks/use-celebration";

interface CelebrationCardProps {
  celebration: Celebration | null;
  active: boolean;
}

const CELEBRATION_MESSAGES = {
  badge: {
    en: "🎉 Badge Unlocked!",
    bg: "🎉 Нова значка!",
    es: "🎉 ¡Insignia desbloqueada!",
  },
  streak: {
    en: (days: number) => `🔥 ${days} Day Streak!`,
    bg: (days: number) => `🔥 ${days} дни поред!`,
    es: (days: number) => `🔥 ¡${days} días seguidos!`,
  },
  level: {
    en: (lvl: number) => `⭐ Level ${lvl}!`,
    bg: (lvl: number) => `⭐ Ниво ${lvl}!`,
    es: (lvl: number) => `⭐ ¡Nivel ${lvl}!`,
  },
};

const PANDA_MESSAGES = {
  badge: {
    en: "You did it! Keep up the amazing work.",
    bg: "Справи се! Продължавай отличната работа.",
    es: "¡Lo hiciste! Sigue con el excelente trabajo.",
  },
  streak: {
    en: "You're on fire! Keep learning every day.",
    bg: "Невероятно! Продължавай да учиш всеки ден.",
    es: "¡Estás en fuego! Sigue aprendiendo cada día.",
  },
  level: {
    en: "You leveled up! You're getting stronger.",
    bg: "Повишение! Становиш се по-силен.",
    es: "¡Subiste de nivel! Te estás volviendo más fuerte.",
  },
};

export function CelebrationCard({ celebration, active }: CelebrationCardProps) {
  // Default to English if lang not available
  const lang = "en" as const;

  if (!celebration || !active) return null;

  const getTitle = () => {
    if (celebration.type === "badge") {
      return CELEBRATION_MESSAGES.badge[lang];
    } else if (celebration.type === "streak") {
      return CELEBRATION_MESSAGES.streak[lang](celebration.streakDays || 0);
    } else {
      return CELEBRATION_MESSAGES.level[lang](celebration.newLevel || 0);
    }
  };

  const getMessage = () => {
    if (celebration.type === "badge") {
      return PANDA_MESSAGES.badge[lang];
    } else if (celebration.type === "streak") {
      return PANDA_MESSAGES.streak[lang];
    } else {
      return PANDA_MESSAGES.level[lang];
    }
  };

  const getEmoji = () => {
    if (celebration.type === "badge") {
      return celebration.badgeIcon || "🎖️";
    } else if (celebration.type === "streak") {
      return "🔥";
    } else {
      return "⭐";
    }
  };

  const bgColor =
    celebration.type === "badge"
      ? "from-purple-100 to-blue-100 border-purple-300"
      : celebration.type === "streak"
      ? "from-orange-100 to-red-100 border-orange-300"
      : "from-yellow-100 to-amber-100 border-yellow-300";

  return (
    <AnimatePresence>
      {active && celebration && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-xs pointer-events-auto`}
        >
          <div
            className={`bg-gradient-to-br ${bgColor} rounded-2xl border-2 shadow-lg overflow-hidden`}
          >
            <div className="px-6 py-4">
              <div className="text-center mb-2">
                <div className="text-4xl mb-1">{getEmoji()}</div>
                <h2 className="text-lg font-bold text-gray-800">
                  {getTitle()}
                </h2>
              </div>

              <div className="flex items-start gap-2 bg-white/60 rounded-lg px-3 py-2">
                <span className="text-xl flex-shrink-0">👧</span>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {getMessage()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
