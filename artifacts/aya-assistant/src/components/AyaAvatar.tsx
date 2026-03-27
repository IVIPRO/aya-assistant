/**
 * AYA Junior Animated Avatar
 *
 * Displays a cartoon avatar of AYA (9-year-old girl, curly hair, glasses)
 * with lightweight CSS-only animations:
 *   - aya-idle     : subtle floating / breathing (always active)
 *   - aya-speaking : gentle bounce while TTS is speaking
 *   - aya-blink    : quick eye-close, fired every 4-6 seconds by a JS timer
 *
 * No heavy animation libraries — pure CSS keyframes + React state/effects.
 * Falls back silently if image assets are missing (emoji shown instead).
 * If CSS injection fails the avatar still renders statically.
 */

import { useState, useEffect, useRef } from "react";

/* ── Emotion types ──────────────────────────────────────────────── */

export type AyaEmotion = "neutral" | "happy" | "thinking" | "encourage" | "celebrate";

const AVATAR_PATHS: Record<AyaEmotion, string> = {
  neutral:   "/aya-avatar/aya-neutral.svg",
  happy:     "/aya-avatar/aya-happy.svg",
  thinking:  "/aya-avatar/aya-thinking.svg",
  encourage: "/aya-avatar/aya-encourage.svg",
  celebrate: "/aya-avatar/aya-celebrate.svg",
};

const EMOTION_LABELS: Record<AyaEmotion, string> = {
  neutral:   "AYA",
  happy:     "AYA 🌟",
  thinking:  "AYA 💭",
  encourage: "AYA ✨",
  celebrate: "AYA 🎉",
};

const EMOJI_FALLBACK: Record<AyaEmotion, string> = {
  neutral:   "🙂",
  happy:     "😊",
  thinking:  "🤔",
  encourage: "💪",
  celebrate: "🎉",
};

/* ── CSS keyframes (injected once into document <head>) ─────────── */

const AYA_STYLE_ID = "aya-avatar-styles";

const AYA_KEYFRAMES = `
/* AYA Junior Animated Avatar — lightweight CSS animations */

/* Idle: gentle vertical float (3 s cycle) */
@keyframes aya-float {
  0%, 100% { transform: translateY(0px) scale(1); }
  50%       { transform: translateY(-5px) scale(1.01); }
}

/* Speaking: faster subtle bounce (0.5 s cycle) */
@keyframes aya-speak {
  0%, 100% { transform: translateY(0px) scale(1); }
  50%       { transform: translateY(-3px) scale(1.02); }
}

/* Celebrate: joyful pop-bounce (1 s cycle) */
@keyframes aya-celebrate {
  0%, 100% { transform: translateY(0px) scale(1.08); }
  30%       { transform: translateY(-9px) scale(1.13); }
  60%       { transform: translateY(-4px) scale(1.10); }
}

/* Blink: quick vertical squish of the image, simulating eyes closing */
@keyframes aya-blink {
  0%, 30%, 100% { transform: scaleY(1); }
  15%            { transform: scaleY(0.87); }
}

/* Pulse: one-shot gentle pop when emotion changes — child-friendly, no jank */
@keyframes aya-pulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.09) translateY(-3px); }
  70%  { transform: scale(1.04) translateY(-1px); }
  100% { transform: scale(1); }
}

/* Speaking mouth dots — staggered bounce */
@keyframes aya-dot {
  0%, 100% { transform: translateY(0);   opacity: 0.35; }
  40%       { transform: translateY(-4px); opacity: 1;    }
}

/* Utility classes applied from JS */
.aya-idle {
  animation: aya-float 3.2s ease-in-out infinite;
  transform-origin: center bottom;
}
.aya-speaking {
  animation: aya-speak 0.5s ease-in-out infinite !important;
  transform-origin: center bottom;
}
.aya-celebrate {
  animation: aya-celebrate 0.9s ease-in-out infinite !important;
  transform-origin: center bottom;
}
.aya-blink {
  animation: aya-blink 0.16s ease-in-out !important;
}
.aya-pulse {
  animation: aya-pulse 0.38s ease-out !important;
  transform-origin: center bottom;
}
.aya-dot-1 { animation: aya-dot 0.8s ease-in-out infinite 0s;    }
.aya-dot-2 { animation: aya-dot 0.8s ease-in-out infinite 0.15s; }
.aya-dot-3 { animation: aya-dot 0.8s ease-in-out infinite 0.30s; }
`;

function injectAyaStyles(): void {
  try {
    if (typeof document === "undefined") return;
    if (document.getElementById(AYA_STYLE_ID)) return; // already injected
    const el = document.createElement("style");
    el.id = AYA_STYLE_ID;
    el.textContent = AYA_KEYFRAMES;
    document.head.appendChild(el);
  } catch {
    /* Injection failed — animations degrade gracefully to static image */
  }
}

/* ── Props ──────────────────────────────────────────────────────── */

export interface AyaAvatarProps {
  /** Which emotional state to display. */
  emotion: AyaEmotion;
  /** Whether the avatar is visible. When false, renders nothing. */
  visible: boolean;
  /** True while TTS is speaking — triggers speaking mouth animation. */
  speaking?: boolean;
  /** Optional speech bubble text shown beside the avatar. */
  text?: string | null;
  /** Extra CSS classes on the root container. */
  className?: string;
}

/* ── Component ──────────────────────────────────────────────────── */

export function AyaAvatar({
  emotion,
  visible,
  speaking = false,
  text,
  className = "",
}: AyaAvatarProps) {
  const [imgFailed,        setImgFailed]        = useState(false);
  const [isBlinking,       setIsBlinking]       = useState(false);
  const [isEmotionChanged, setIsEmotionChanged] = useState(false);
  const blinkTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkResetRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEmotionRef     = useRef<AyaEmotion>(emotion);

  /* Inject CSS keyframes once on first mount */
  useEffect(() => {
    injectAyaStyles();
  }, []);

  /**
   * Blink timer — fires every 4–6 s (random within that range).
   * Sets isBlinking=true for 160 ms (matches the aya-blink keyframe duration),
   * then clears itself so the CSS animation plays only once per blink.
   * Cleanup on unmount prevents stale state updates.
   */
  useEffect(() => {
    if (!visible) return;

    function scheduleBlink() {
      const delay = 4000 + Math.random() * 2000; // 4–6 s
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        blinkResetRef.current = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink(); // queue next blink
        }, 160);
      }, delay);
    }

    scheduleBlink();

    return () => {
      if (blinkTimerRef.current)  clearTimeout(blinkTimerRef.current);
      if (blinkResetRef.current)  clearTimeout(blinkResetRef.current);
    };
  }, [visible]);

  /**
   * Emotion-change pulse — fires a 380 ms one-shot pop whenever the
   * emotion prop changes to something non-neutral and different from before.
   * Skipped for idle/neutral changes to avoid noise.
   */
  useEffect(() => {
    if (emotion === prevEmotionRef.current) return;
    prevEmotionRef.current = emotion;
    if (emotion === "neutral") return; // no pulse for going back to idle
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    setIsEmotionChanged(true);
    pulseTimerRef.current = setTimeout(() => setIsEmotionChanged(false), 400);
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [emotion]);

  if (!visible) return null;

  /* Determine which animation class to apply to the image wrapper.
   * Priority (highest first): blink → celebrate → pulse → speaking → idle */
  const isCelebrating = emotion === "celebrate";
  const animClass = isBlinking
    ? "aya-blink"
    : isCelebrating
    ? "aya-celebrate"
    : isEmotionChanged
    ? "aya-pulse"
    : speaking
    ? "aya-speaking"
    : "aya-idle";

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-label={`AYA Avatar — ${emotion}`}
    >
      {/* ── Avatar image with animation ────────────────────────── */}
      <div className="relative flex-shrink-0 flex flex-col items-center gap-0.5">
        <div
          className={animClass}
          style={{ willChange: "transform", transformOrigin: "center bottom" }}
        >
          {!imgFailed ? (
            <img
              key={emotion}
              src={AVATAR_PATHS[emotion]}
              alt={EMOTION_LABELS[emotion]}
              width={64}
              height={75}
              className="w-16 h-[4.7rem] object-contain drop-shadow-md"
              onError={() => setImgFailed(true)}
            />
          ) : (
            /* Emoji fallback when SVG cannot load */
            <div className="w-16 h-[4.7rem] flex items-center justify-center text-4xl select-none">
              {EMOJI_FALLBACK[emotion]}
            </div>
          )}
        </div>

        {/* Speaking indicator — 3 bouncing dots below avatar mouth area */}
        {speaking && (
          <div
            className="flex items-end gap-1 h-3"
            aria-hidden="true"
            title="AYA is speaking"
          >
            <span className="aya-dot-1 w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
            <span className="aya-dot-2 w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
            <span className="aya-dot-3 w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
          </div>
        )}
      </div>

      {/* ── Optional speech bubble ──────────────────────────────── */}
      {text && (
        <div className="relative max-w-[200px]">
          <div className="bg-white border-2 border-yellow-300 rounded-2xl rounded-tl-sm px-3 py-2 shadow-md">
            <p className="text-xs font-semibold text-gray-700 leading-snug">{text}</p>
          </div>
          {/* Bubble pointer arrow */}
          <div className="absolute left-0 top-3 w-3 h-3 bg-yellow-300 rotate-45 -translate-x-1.5 rounded-sm" />
        </div>
      )}
    </div>
  );
}
