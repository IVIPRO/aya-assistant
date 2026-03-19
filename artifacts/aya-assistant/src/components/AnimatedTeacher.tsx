import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

export type TeacherState = "idle" | "talking" | "happy" | "thinking" | "encouraging";
export type LangCode = "en" | "bg" | "es";

/* ── Message bank ──────────────────────────────────────────────────────── */

const MESSAGES: Record<TeacherState, Record<LangCode, string[]>> = {
  idle: {
    en: [
      "What shall we explore today? 🌟",
      "I'm here whenever you need me!",
      "Ready for a new adventure?",
      "Let's go step by step.",
    ],
    bg: [
      "Какво ще изследваме днес? 🌟",
      "Тук съм, когато ме потрябваш!",
      "Нека опитаме стъпка по стъпка.",
      "Готов/а за ново приключение?",
    ],
    es: [
      "¿Qué exploraremos hoy? 🌟",
      "¡Aquí estoy cuando me necesites!",
      "Vamos paso a paso.",
      "¿Listo para una nueva aventura?",
    ],
  },
  talking: {
    en: [
      "Let's solve this together!",
      "I'm listening — go ahead!",
      "Let's go step by step.",
      "Ask me anything you like!",
    ],
    bg: [
      "Хайде да решим задачата заедно!",
      "Слушам те — говори смело!",
      "Нека опитаме стъпка по стъпка.",
      "Питай ме каквото искаш!",
    ],
    es: [
      "¡Vamos a resolverlo juntos!",
      "¡Te escucho — adelante!",
      "Vamos paso a paso.",
      "¡Pregúntame lo que quieras!",
    ],
  },
  happy: {
    en: [
      "Great job! You're amazing! ⭐",
      "Brilliant work! Keep it up!",
      "You can do it! I knew it! 🎉",
      "Well done! Keep going!",
    ],
    bg: [
      "Браво! Отлична работа! ⭐",
      "Великолепно! Продължавай така!",
      "Ти можеш! Знаех, че ще успееш! 🎉",
      "Чудесно! Продължавай напред!",
    ],
    es: [
      "¡Muy bien! ¡Eres increíble! ⭐",
      "¡Trabajo brillante! ¡Sigue así!",
      "¡Tú puedes! ¡Lo sabía! 🎉",
      "¡Excelente! ¡Sigue adelante!",
    ],
  },
  thinking: {
    en: [
      "Think a little more. 💭",
      "What clues do you see here?",
      "Hmm… let's try another way.",
      "Take your time — no rush!",
    ],
    bg: [
      "Помисли още малко. 💭",
      "Какви улики виждаш тук?",
      "Хм… нека опитаме по друг начин.",
      "Не бързай — имаш всичкото време!",
    ],
    es: [
      "Piensa un poco más. 💭",
      "¿Qué pistas ves aquí?",
      "Hmm… probemos de otra manera.",
      "Tómate tu tiempo, sin prisas.",
    ],
  },
  encouraging: {
    en: [
      "You can do it! Keep going! ✨",
      "Almost there — don't give up!",
      "Every step counts — well done!",
      "Try one more time — you've got this!",
    ],
    bg: [
      "Ти можеш! Продължавай! ✨",
      "Почти — не се отказвай!",
      "Всяка стъпка е важна — браво!",
      "Опитай още веднъж — справяш се!",
    ],
    es: [
      "¡Tú puedes! ¡Sigue! ✨",
      "¡Casi — no te rindas!",
      "¡Cada paso cuenta — bien hecho!",
      "¡Inténtalo una vez más — puedes lograrlo!",
    ],
  },
};

/* ── Overlay indicators per state ─────────────────────────────────────── */

const STATE_OVERLAY: Record<TeacherState, string> = {
  idle:        "",
  talking:     "",
  happy:       "⭐",
  thinking:    "💭",
  encouraging: "✨",
};

/* ── Framer Motion variants per state ────────────────────────────────── */

const EMOJI_VARIANTS: Record<TeacherState, { animate: object; transition: object }> = {
  idle: {
    animate:    { y: [0, -5, 0], scale: [1, 1.03, 1] },
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
  },
  talking: {
    animate:    { y: [0, -7, 0, -4, 0] },
    transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" },
  },
  happy: {
    animate:    { y: [0, -22, 0], scale: [1, 1.25, 1], rotate: [-4, 4, -4, 4, 0] },
    transition: { duration: 0.65, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" },
  },
  thinking: {
    animate:    { rotate: [-3, 3, -3], y: [0, -3, 0], scale: [1, 1.02, 1] },
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
  encouraging: {
    animate:    { y: [0, -9, 0, -6, 0, -3, 0] },
    transition: { duration: 1.6, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" },
  },
};

/* ── Sparkle particles (happy state) ─────────────────────────────────── */

const SPARKLE_POSITIONS = [
  { x: -26, y: -34, delay: 0 },
  { x: 22,  y: -42, delay: 0.1 },
  { x: -38, y: -16, delay: 0.15 },
  { x: 30,  y: -22, delay: 0.05 },
  { x: -8,  y: -50, delay: 0.2 },
];

function Sparkles({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && SPARKLE_POSITIONS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute text-sm pointer-events-none select-none"
          style={{ left: "50%", top: "0%" }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], x: s.x, y: s.y, scale: [0, 1.2, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: s.delay, repeat: Infinity, repeatDelay: 1.8 }}
        >
          ⭐
        </motion.span>
      ))}
    </AnimatePresence>
  );
}

/* ── Blink animation (idle only) ─────────────────────────────────────── */

function BlinkingEyes({ active }: { active: boolean }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!active) return;
    const schedule = () => {
      const delay = 3000 + Math.random() * 4000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 140);
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, [active]);

  if (!active || !blink) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-full h-full rounded-full bg-yellow-100/60" />
    </div>
  );
}

/* ── Props ────────────────────────────────────────────────────────────── */

export interface AnimatedTeacherProps {
  characterEmoji?: string;
  characterName?: string;
  lang?: LangCode;
  /** Primary state prop */
  state?: TeacherState;
  /** Alias for state (spec-compatible) */
  mood?: TeacherState;
  /** Force-display a specific message (overrides auto-cycle) */
  message?: string | null;
  /** Auto-cycle messages from pool (default true) */
  autoMessage?: boolean;
  /** Hide/show entire component with animation */
  visible?: boolean;
  /** Smaller avatar (56px → 40px) for tighter layouts */
  compact?: boolean;
  className?: string;
}

/* ── Component ────────────────────────────────────────────────────────── */

export function AnimatedTeacher({
  characterEmoji = "🐼",
  characterName  = "AYA Panda",
  lang           = "en",
  state: stateProp,
  mood,
  message,
  autoMessage    = true,
  visible        = true,
  compact        = false,
  className      = "",
}: AnimatedTeacherProps) {
  // mood is an alias for state
  const state: TeacherState = mood ?? stateProp ?? "idle";

  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);
  const [dismissed, setDismissed]           = useState(false);
  const cycleRef = useRef<ReturnType<typeof setInterval>  | null>(null);
  const hideRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pool = MESSAGES[state]?.[lang] ?? MESSAGES[state]?.en ?? [];

  const showNext = useCallback(() => {
    setVisibleMessage(prev => {
      const idx   = pool.indexOf(prev ?? "");
      const next  = (idx + 1) % pool.length;
      return pool[next] ?? null;
    });
    setDismissed(false);
  }, [pool]);

  /* Auto-cycle messages whenever state / lang changes */
  useEffect(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    if (hideRef.current)  clearTimeout(hideRef.current);

    if (message !== undefined) {
      setVisibleMessage(message);
      setDismissed(false);
      return;
    }

    if (!autoMessage) {
      setVisibleMessage(null);
      return;
    }

    const SHOW_DURATION  = 4800;
    const CYCLE_INTERVAL = 10000;

    setVisibleMessage(pool[0] ?? null);
    setDismissed(false);

    hideRef.current = setTimeout(() => setVisibleMessage(null), SHOW_DURATION);

    cycleRef.current = setInterval(() => {
      showNext();
      if (hideRef.current) clearTimeout(hideRef.current);
      hideRef.current = setTimeout(() => setVisibleMessage(null), SHOW_DURATION);
    }, CYCLE_INTERVAL);

    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
      if (hideRef.current)  clearTimeout(hideRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, lang, autoMessage, message]);

  /* When a forced message prop changes, display immediately */
  useEffect(() => {
    if (message !== undefined && message !== null) {
      setVisibleMessage(message);
      setDismissed(false);
    }
  }, [message]);

  const v          = EMOJI_VARIANTS[state];
  const overlay    = STATE_OVERLAY[state];
  const displayMsg = dismissed ? null : visibleMessage;
  const avatarSize = compact ? "w-10 h-10 text-2xl border-[3px]" : "w-14 h-14 text-3xl border-4";
  const bubbleMax  = compact ? "max-w-[170px]" : "max-w-[210px]";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="teacher-root"
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1,   y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className={`fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2 pointer-events-none ${className}`}
        >
          {/* ── Speech bubble ─────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {displayMsg && (
              <motion.div
                key={displayMsg}
                initial={{ opacity: 0, y: 10,  scale: 0.88 }}
                animate={{ opacity: 1, y: 0,   scale: 1 }}
                exit={{   opacity: 0, y: 8,    scale: 0.9 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className={`pointer-events-auto ${bubbleMax}`}
              >
                <div className="relative bg-white border-2 border-yellow-300 rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg">
                  <p className="text-xs font-semibold text-gray-700 leading-snug">{displayMsg}</p>
                  <button
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 text-[10px] flex items-center justify-center transition-colors shadow-sm"
                    onClick={() => setDismissed(true)}
                    aria-label="dismiss"
                  >
                    ×
                  </button>
                </div>
                {/* speech pointer */}
                <div className="w-3 h-3 bg-yellow-300 rotate-45 ml-auto mr-5 -mt-1.5 rounded-sm shadow-sm" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Avatar ────────────────────────────────────────────────── */}
          <motion.div
            className="relative pointer-events-auto cursor-pointer select-none"
            onClick={() => {
              if (dismissed || !displayMsg) showNext();
              else setDismissed(true);
            }}
            title={characterName}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            animate={v.animate as never}
            transition={v.transition as never}
          >
            <Sparkles active={state === "happy"} />

            <div className={`relative rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300 shadow-xl flex items-center justify-center ${avatarSize}`}>
              <BlinkingEyes active={state === "idle"} />
              <span className="relative z-10">{characterEmoji}</span>
            </div>

            {/* State overlay badge */}
            {overlay && (
              <motion.span
                key={overlay}
                className="absolute -top-2 -right-1 text-base leading-none pointer-events-none"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 16 }}
              >
                {overlay}
              </motion.span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
