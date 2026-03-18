import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Zap, TrendingUp } from "lucide-react";
import type { LangCode } from "@/lib/i18n";

export interface XpReward {
  xpGained: number;
  starsGained: number;
  levelUp: boolean;
  newLevel?: number;
  newBadges?: Array<{ icon: string; title: string }>;
}

interface XpToastProps {
  reward: XpReward | null;
  lang?: LangCode;
  onDismiss: () => void;
}

const labels: Record<LangCode, { xp: string; stars: string; levelUp: (n: number) => string }> = {
  en: { xp: "XP",      stars: "Stars",    levelUp: (n) => `Level ${n} Reached! 🎉` },
  bg: { xp: "Точки",   stars: "Звезди",   levelUp: (n) => `Ниво ${n} достигнато! 🎉` },
  es: { xp: "Puntos",  stars: "Estrellas", levelUp: (n) => `¡Nivel ${n} alcanzado! 🎉` },
};

export function XpToast({ reward, lang = "en", onDismiss }: XpToastProps) {
  const [visible, setVisible] = useState(false);
  const lbl = labels[lang];

  useEffect(() => {
    if (!reward || reward.xpGained <= 0) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3500);
    return () => clearTimeout(t);
  }, [reward]);

  if (!reward) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-3xl px-6 py-4 shadow-2xl min-w-[200px] text-center">
            {reward.levelUp && reward.newLevel && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-display font-bold text-base">{lbl.levelUp(reward.newLevel)}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-4">
              {reward.xpGained > 0 && (
                <div className="flex items-center gap-1.5">
                  <Zap className="w-5 h-5 fill-white" />
                  <span className="font-display font-bold text-xl">+{reward.xpGained}</span>
                  <span className="text-sm font-semibold opacity-90">{lbl.xp}</span>
                </div>
              )}
              {reward.starsGained > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-white" />
                  <span className="font-display font-bold text-xl">+{reward.starsGained}</span>
                  <span className="text-sm font-semibold opacity-90">{lbl.stars}</span>
                </div>
              )}
            </div>
            {reward.newBadges && reward.newBadges.length > 0 && (
              <div className="mt-2 text-sm font-semibold">
                {reward.newBadges.map((b) => `${b.icon} ${b.title}`).join(" · ")}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
