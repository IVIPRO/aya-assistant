/**
 * AYA Junior Avatar
 *
 * Displays a cartoon avatar of AYA (9-year-old girl with curly hair and glasses)
 * reacting to lesson states with different emotions.
 *
 * Falls back silently if an image asset is missing — the app continues normally.
 */

import { useState } from "react";

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

export interface AyaAvatarProps {
  /** Which emotional state to display. */
  emotion: AyaEmotion;
  /** Whether the avatar is visible. When false, renders nothing. */
  visible: boolean;
  /** Optional speech bubble text shown beside the avatar. */
  text?: string | null;
  /** Extra CSS classes on the root container. */
  className?: string;
}

export function AyaAvatar({ emotion, visible, text, className = "" }: AyaAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!visible) return null;

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-label={`AYA Avatar — ${emotion}`}
    >
      {/* Avatar image */}
      <div
        className="relative flex-shrink-0 transition-transform duration-300"
        style={{ transform: emotion === "celebrate" ? "scale(1.08)" : emotion === "happy" ? "scale(1.04)" : "scale(1)" }}
      >
        {!imgFailed ? (
          <img
            key={emotion}
            src={AVATAR_PATHS[emotion]}
            alt={EMOTION_LABELS[emotion]}
            width={64}
            height={75}
            className="w-16 h-[4.7rem] object-contain drop-shadow-md transition-opacity duration-300"
            onError={() => setImgFailed(true)}
          />
        ) : (
          /* Fallback: plain emoji when SVG fails to load */
          <div className="w-16 h-[4.7rem] flex items-center justify-center text-4xl select-none">
            {emotion === "happy" ? "😊" :
             emotion === "thinking" ? "🤔" :
             emotion === "encourage" ? "💪" :
             emotion === "celebrate" ? "🎉" : "🙂"}
          </div>
        )}
      </div>

      {/* Optional speech bubble */}
      {text && (
        <div className="relative max-w-[200px]">
          <div className="bg-white border-2 border-yellow-300 rounded-2xl rounded-tl-sm px-3 py-2 shadow-md">
            <p className="text-xs font-semibold text-gray-700 leading-snug">{text}</p>
          </div>
          {/* Bubble pointer */}
          <div className="absolute left-0 top-3 w-3 h-3 bg-yellow-300 rotate-45 -translate-x-1.5 rounded-sm" />
        </div>
      )}
    </div>
  );
}
