import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

export type TeacherState = "idle" | "talking" | "happy" | "thinking" | "encouraging";
type LangCode = "en" | "bg" | "es";

const MESSAGES: Record<TeacherState, Record<LangCode, string[]>> = {
  idle: {
    en: [
      "What shall we explore today? 🌟",
      "I'm here whenever you need me!",
      "Ready for a new adventure?",
    ],
    bg: [
      "Какво ще изследваме днес? 🌟",
      "Тук съм, когато ме потрябваш!",
      "Готов/а за ново приключение?",
    ],
    es: [
      "¿Qué exploraremos hoy? 🌟",
      "¡Aquí estoy cuando me necesites!",
      "¿Listo para una nueva aventura?",
    ],
  },
  talking: {
    en: [
      "Let's solve this together!",
      "I'm listening — go ahead!",
      "Ask me anything you like!",
    ],
    bg: [
      "Хайде да решим задачата заедно!",
      "Слушам те — говори смело!",
      "Питай ме каквото искаш!",
    ],
    es: [
      "¡Vamos a resolverlo juntos!",
      "¡Te escucho — adelante!",
      "¡Pregúntame lo que quieras!",
    ],
  },
  happy: {
    en: [
      "Great job! You're amazing! ⭐",
      "Brilliant work! Keep it up!",
      "I knew you could do it! 🎉",
    ],
    bg: [
      "Браво! Отлична работа! ⭐",
      "Великолепно! Продължавай така!",
      "Знаех/знаех, че можеш! 🎉",
    ],
    es: [
      "¡Muy bien! ¡Eres increíble! ⭐",
      "¡Trabajo brillante! ¡Sigue así!",
      "¡Sabía que podías lograrlo! 🎉",
    ],
  },
  thinking: {
    en: [
      "Hmm… try thinking one more time.",
      "What clues do you see here?",
      "Take your time — no rush! 💭",
    ],
    bg: [
      "Хм… помисли още малко.",
      "Какви улики виждаш тук?",
      "Не бързай — имаш време! 💭",
    ],
    es: [
      "Hmm… inténtalo otra vez.",
      "¿Qué pistas ves aquí?",
      "Tómate tu tiempo, sin prisas. 💭",
    ],
  },
  encouraging: {
    en: [
      "You're doing great — keep going!",
      "Almost there! You can do it! ✨",
      "Every step counts — well done!",
    ],
    bg: [
      "Справяш се чудесно — продължавай!",
      "Почти готово! Можеш! ✨",
      "Всяка стъпка е важна — браво!",
    ],
    es: [
      "¡Lo estás haciendo genial — sigue!",
      "¡Casi lo tienes! ¡Tú puedes! ✨",
      "¡Cada paso cuenta — bien hecho!",
    ],
  },
};

const STATE_OVERLAY: Record<TeacherState, string> = {
  idle:        "",
  talking:     "",
  happy:       "⭐",
  thinking:    "💭",
  encouraging: "✨",
};

const EMOJI_VARIANTS: Record<TeacherState, object> = {
  idle: {
    animate: { y: [0, -5, 0], scale: [1, 1.03, 1] },
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
  },
  talking: {
    animate: { y: [0, -7, 0, -4, 0] },
    transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" },
  },
  happy: {
    animate: { y: [0, -22, 0], scale: [1, 1.25, 1], rotate: [-4, 4, -4, 4, 0] },
    transition: { duration: 0.65, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" },
  },
  thinking: {
    animate: { rotate: [-3, 3, -3], y: [0, -3, 0], scale: [1, 1.02, 1] },
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
  encouraging: {
    animate: { y: [0, -9, 0, -6, 0, -3, 0] },
    transition: { duration: 1.6, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" },
  },
};

const SPARKLE_POSITIONS = [
  { x: -24, y: -32, delay: 0 },
  { x: 20,  y: -40, delay: 0.1 },
  { x: -36, y: -16, delay: 0.15 },
  { x: 28,  y: -20, delay: 0.05 },
  { x: -8,  y: -48, delay: 0.2 },
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

export interface AnimatedTeacherProps {
  characterEmoji?: string;
  characterName?: string;
  lang?: LangCode;
  state?: TeacherState;
  message?: string | null;
  autoMessage?: boolean;
  className?: string;
}

export function AnimatedTeacher({
  characterEmoji = "🐼",
  characterName = "AYA",
  lang = "en",
  state = "idle",
  message,
  autoMessage = true,
  className = "",
}: AnimatedTeacherProps) {
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);
  const [msgIndex, setMsgIndex]             = useState(0);
  const [dismissed, setDismissed]           = useState(false);
  const cycleRef                            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideRef                             = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pool = MESSAGES[state]?.[lang] ?? MESSAGES[state]?.en ?? [];

  const showNext = useCallback(() => {
    setMsgIndex(i => {
      const next = (i + 1) % pool.length;
      setVisibleMessage(pool[next]);
      setDismissed(false);
      return next;
    });
  }, [pool]);

  useEffect(() => {
    if (message !== undefined) {
      setVisibleMessage(message);
      setDismissed(false);
      return;
    }

    if (!autoMessage) {
      setVisibleMessage(null);
      return;
    }

    setMsgIndex(0);
    setVisibleMessage(pool[0] ?? null);
    setDismissed(false);

    const SHOW_DURATION = 4500;
    const CYCLE_INTERVAL = 9000;

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
  }, [state, lang, autoMessage, message]);

  const v = EMOJI_VARIANTS[state];
  const overlay = STATE_OVERLAY[state];
  const displayMsg = dismissed ? null : visibleMessage;

  return (
    <div className={`fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2 pointer-events-none ${className}`}>
      <AnimatePresence mode="wait">
        {displayMsg && (
          <motion.div
            key={displayMsg}
            initial={{ opacity: 0, y: 10, scale: 0.88 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 8,  scale: 0.9 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="pointer-events-auto max-w-[200px]"
          >
            <div className="relative bg-white border-2 border-yellow-300 rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg">
              <p className="text-xs font-semibold text-gray-700 leading-snug">{displayMsg}</p>
              <button
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-[10px] flex items-center justify-center transition-colors"
                onClick={() => setDismissed(true)}
                aria-label="dismiss"
              >
                ×
              </button>
            </div>
            <div className="w-3 h-3 bg-yellow-300 rotate-45 ml-auto mr-5 -mt-1.5 rounded-sm shadow-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative pointer-events-auto cursor-pointer select-none"
        onClick={() => {
          if (dismissed || !displayMsg) {
            showNext();
          } else {
            setDismissed(true);
          }
        }}
        title={characterName}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        {...v}
      >
        <Sparkles active={state === "happy"} />

        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-300 shadow-xl flex items-center justify-center text-3xl">
          {characterEmoji}
        </div>

        {overlay && (
          <motion.span
            className="absolute -top-2 -right-1 text-base leading-none pointer-events-none"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {overlay}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
