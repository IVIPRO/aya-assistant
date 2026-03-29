/**
 * AYA Animated Tutor Avatar — v3
 *
 * Unified AYA identity — one avatar everywhere.
 * Visual design matches the official AYA SVG assets:
 *   - Natural long wavy brown hair, center-parted, shoulder length
 *   - Dark rounded-rectangle glasses (#444, light-blue tinted lenses)
 *   - Warm skin tone, round face
 *   - Soft expression, pink cheeks
 *   - Emotion-coloured background circle
 *   - Orange hoodie body
 *
 * Supports emotion states: neutral | happy | thinking | encourage | celebrate
 * Animations: idle float, blink, speaking bob, emotion pulse, celebration bounce
 * All CSS-only — no heavy animation libraries.
 */

import { useState, useEffect, useRef, ReactNode } from "react";

/* ── Types ──────────────────────────────────────────────────────── */

export type AyaEmotion = "neutral" | "happy" | "thinking" | "encourage" | "celebrate";

/* ── CSS keyframes (injected once) ─────────────────────────────── */

const AYA_STYLE_ID = "aya-avatar-styles-v3";

const AYA_CSS = `
@keyframes aya-float {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  33%      { transform: translateY(-4px) rotate(0.4deg); }
  66%      { transform: translateY(-2px) rotate(-0.3deg); }
}
@keyframes aya-speak-bob {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-3px); }
}
@keyframes aya-celebrate-bounce {
  0%,100% { transform: translateY(0) scale(1.05) rotate(0deg); }
  25%      { transform: translateY(-8px) scale(1.1) rotate(1deg); }
  75%      { transform: translateY(-4px) scale(1.08) rotate(-1deg); }
}
@keyframes aya-pulse-in {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.08) translateY(-2px); }
  100% { transform: scale(1); }
}
@keyframes aya-think-tilt {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-2px) rotate(-3deg); }
}
@keyframes aya-dot {
  0%,100% { transform: translateY(0); opacity: 0.4; }
  40%      { transform: translateY(-4px); opacity: 1; }
}
@keyframes aya-star-spin {
  from { transform: rotate(0deg) scale(1); }
  to   { transform: rotate(360deg) scale(1.1); }
}
@keyframes aya-blink-anim {
  0%,100% { transform: scaleY(1); }
  50%      { transform: scaleY(0.08); }
}

.aya-float   { animation: aya-float 3.4s ease-in-out infinite; transform-origin: center bottom; }
.aya-speak   { animation: aya-speak-bob 0.48s ease-in-out infinite; transform-origin: center bottom; }
.aya-celeb   { animation: aya-celebrate-bounce 0.85s ease-in-out infinite; transform-origin: center bottom; }
.aya-pulse   { animation: aya-pulse-in 0.38s ease-out; transform-origin: center bottom; }
.aya-think   { animation: aya-think-tilt 2.2s ease-in-out infinite; transform-origin: center bottom; }
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(AYA_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = AYA_STYLE_ID;
  el.textContent = AYA_CSS;
  document.head.appendChild(el);
}

/* ── Palette ────────────────────────────────────────────────────── */

const C = {
  skin:        "#FFCC99",
  skinDark:    "#F0AD84",
  skinShade:   "#E8976A",
  hair:        "#5D3A1A",
  hairDark:    "#3D2010",
  hairLight:   "#7B4A1E",
  glasses:     "#444444",
  glassesLens: "#E3F2FD",
  hoodie:      "#F07830",
  hoodieDeep:  "#D4611E",
  hoodieLight: "#FF9950",
  white:       "#FFFFFF",
  iris:        "#5D3A1A",
  pupil:       "#1A0800",
  eyebrow:     "#5D3A1A",
  noseTip:     "#E8A87C",
  blush:       "#FFB3A7",
  mouthLine:   "#C0705A",
  mouthFill:   "#FFB3A7",
  teeth:       "#FFFFFF",
  tongue:      "#F08080",
  star:        "#FFD700",
  thought:     "#E0EEFF",
};

/* ── Emotion background colours ─────────────────────────────────── */

const EMOTION_BG: Record<AyaEmotion, string> = {
  neutral:   "#FFF3E0",
  happy:     "#FFFDE7",
  thinking:  "#F3E5F5",
  encourage: "#E8F5E9",
  celebrate: "#FFF9C4",
};

/* ── Emotion face configs ───────────────────────────────────────── */

type EyeState   = "open" | "happy" | "wide" | "look-up";
type MouthState = "smile" | "grin" | "open-joy" | "thinking" | "cheer";
type BrowState  = "neutral" | "raised" | "furrowed" | "one-up" | "happy";

interface FaceConfig {
  eyeState:     EyeState;
  mouthState:   MouthState;
  browState:    BrowState;
  cheekOpacity: number;
  extras?:      ReactNode;
}

const EMOTION_FACE: Record<AyaEmotion, FaceConfig> = {
  neutral: {
    eyeState: "open",
    mouthState: "smile",
    browState: "neutral",
    cheekOpacity: 0.5,
  },
  happy: {
    eyeState: "happy",
    mouthState: "grin",
    browState: "raised",
    cheekOpacity: 0.65,
    extras: <HappyStars />,
  },
  thinking: {
    eyeState: "look-up",
    mouthState: "thinking",
    browState: "one-up",
    cheekOpacity: 0.35,
    extras: <ThoughtBubble />,
  },
  encourage: {
    eyeState: "wide",
    mouthState: "open-joy",
    browState: "raised",
    cheekOpacity: 0.60,
    extras: <Sparkles />,
  },
  celebrate: {
    eyeState: "happy",
    mouthState: "cheer",
    browState: "happy",
    cheekOpacity: 0.75,
    extras: <CelebrationConfetti />,
  },
};

/* ── Eye renderers ──────────────────────────────────────────────── */

function EyeOpen({ cx, cy, blinking }: { cx: number; cy: number; blinking: boolean }) {
  return (
    <g style={blinking ? { animation: "aya-blink-anim 0.14s ease-in-out", transformOrigin: `${cx}px ${cy}px` } : undefined}>
      <ellipse cx={cx} cy={cy} rx={5} ry={5.5} fill={C.pupil} />
      <circle  cx={cx + 1.5} cy={cy - 1.5} r={1.3} fill={C.white} />
    </g>
  );
}

function EyeHappy({ cx, cy }: { cx: number; cy: number }) {
  return (
    <path
      d={`M ${cx - 5} ${cy + 1} Q ${cx} ${cy - 6} ${cx + 5} ${cy + 1}`}
      stroke={C.pupil}
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  );
}

function EyeWide({ cx, cy, blinking }: { cx: number; cy: number; blinking: boolean }) {
  return (
    <g style={blinking ? { animation: "aya-blink-anim 0.14s ease-in-out", transformOrigin: `${cx}px ${cy}px` } : undefined}>
      <ellipse cx={cx} cy={cy} rx={6} ry={6.5} fill={C.pupil} />
      <circle  cx={cx + 2} cy={cy - 2} r={1.5} fill={C.white} />
    </g>
  );
}

function EyeLookUp({ cx, cy }: { cx: number; cy: number }) {
  return (
    <ellipse cx={cx - 0.5} cy={cy - 2} rx={5} ry={5.5} fill={C.pupil} />
  );
}

function renderEyes(state: EyeState, blinking: boolean) {
  /* Eye positions match the centre of the glasses lenses */
  const LX = 39, RX = 81, Y = 70;
  switch (state) {
    case "happy":
      return (<><EyeHappy cx={LX} cy={Y} /><EyeHappy cx={RX} cy={Y} /></>);
    case "wide":
      return (<><EyeWide cx={LX} cy={Y} blinking={blinking} /><EyeWide cx={RX} cy={Y} blinking={blinking} /></>);
    case "look-up":
      return (<><EyeLookUp cx={LX} cy={Y} /><EyeLookUp cx={RX} cy={Y} /></>);
    default:
      return (<><EyeOpen cx={LX} cy={Y} blinking={blinking} /><EyeOpen cx={RX} cy={Y} blinking={blinking} /></>);
  }
}

/* ── Eyebrow renderers ──────────────────────────────────────────── */

function renderBrows(state: BrowState) {
  /* Centred over the lens centres: L=39, R=81 */
  const brow = (cx: number, dy: number, rotate: number) => (
    <path
      d={`M ${cx - 9} ${60 + dy} Q ${cx} ${57 + dy} ${cx + 9} ${60 + dy}`}
      stroke={C.eyebrow}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)`, transformOrigin: `${cx}px ${59 + dy}px` }}
    />
  );
  switch (state) {
    case "raised":   return (<>{brow(39, -3, 0)}{brow(81, -3, 0)}</>);
    case "happy":    return (<>{brow(39, -2, -3)}{brow(81, -2, 3)}</>);
    case "furrowed": return (<>{brow(39, 1, 5)}{brow(81, 1, -5)}</>);
    case "one-up":   return (<>{brow(39, -4, 0)}{brow(81, 1, 0)}</>);
    default:         return (<>{brow(39, 0, 0)}{brow(81, 0, 0)}</>);
  }
}

/* ── Mouth renderers ────────────────────────────────────────────── */

function renderMouth(state: MouthState, isSpeaking: boolean) {
  const baseY = 90;
  if (isSpeaking) {
    return (
      <ellipse cx={60} cy={baseY + 2} rx={8} ry={5} fill={C.mouthFill} stroke={C.mouthLine} strokeWidth="1.5" />
    );
  }
  switch (state) {
    case "grin":
      return (
        <g>
          <path d={`M 47 ${baseY} Q 60 ${baseY + 9} 73 ${baseY}`} fill={C.mouthFill} stroke={C.mouthLine} strokeWidth="1.8" strokeLinecap="round" />
          <rect x={49} y={baseY - 2} width={22} height={4} rx={2} fill={C.teeth} />
        </g>
      );
    case "open-joy":
      return (
        <g>
          <ellipse cx={60} cy={baseY + 3} rx={10} ry={8} fill={C.mouthFill} stroke={C.mouthLine} strokeWidth="1.5" />
          <rect x={51} y={baseY - 4} width={18} height={5} rx={2.5} fill={C.teeth} />
        </g>
      );
    case "cheer":
      return (
        <g>
          <path d={`M 45 ${baseY - 1} Q 60 ${baseY + 11} 75 ${baseY - 1}`} fill={C.mouthFill} stroke={C.mouthLine} strokeWidth="1.8" strokeLinecap="round" />
          <rect x={47} y={baseY - 4} width={26} height={5} rx={2.5} fill={C.teeth} />
        </g>
      );
    case "thinking":
      return (
        <path d={`M 52 ${baseY} Q 60 ${baseY - 3} 68 ${baseY}`} fill="none" stroke={C.mouthLine} strokeWidth="2.5" strokeLinecap="round" />
      );
    default: /* smile */
      return (
        <path d={`M 50 ${baseY} Q 60 ${baseY + 8} 70 ${baseY}`} fill="none" stroke={C.mouthLine} strokeWidth="2.5" strokeLinecap="round" />
      );
  }
}

/* ── Floating extras ────────────────────────────────────────────── */

function ThoughtBubble() {
  return (
    <g opacity={0.9}>
      <circle cx={95} cy={40} r={2} fill={C.thought} stroke="#9BB8E8" strokeWidth="1" />
      <circle cx={101} cy={32} r={3} fill={C.thought} stroke="#9BB8E8" strokeWidth="1" />
      <ellipse cx={109} cy={24} rx={8} ry={7} fill={C.thought} stroke="#9BB8E8" strokeWidth="1.2" />
      <text x={105} y={27} fontSize="8" textAnchor="middle" fill="#7090C0">?</text>
    </g>
  );
}

function HappyStars() {
  return (
    <g>
      <text x="5" y="22" fontSize="11">⭐</text>
      <text x="96" y="24" fontSize="11">⭐</text>
    </g>
  );
}

function Sparkles() {
  const pts = [[8, 38], [104, 44], [10, 58], [108, 50]] as const;
  return (
    <g>
      {pts.map(([x, y], i) => (
        <g key={i} style={{ animation: `aya-star-spin ${1.4 + i * 0.3}s linear infinite`, transformOrigin: `${x}px ${y}px` }}>
          <polygon
            points={`${x},${y - 5} ${x + 1.5},${y - 1.5} ${x + 5},${y - 1.5} ${x + 2.5},${y + 1.5} ${x + 3.5},${y + 5} ${x},${y + 3} ${x - 3.5},${y + 5} ${x - 2.5},${y + 1.5} ${x - 5},${y - 1.5} ${x - 1.5},${y - 1.5}`}
            fill={C.star}
            opacity={0.85}
          />
        </g>
      ))}
    </g>
  );
}

function CelebrationConfetti() {
  return (
    <g>
      <rect x="8" y="10" width="7" height="7" rx="2" fill="#FF5252" transform="rotate(20 8 10)" />
      <rect x="101" y="14" width="7" height="7" rx="2" fill="#FFEB3B" transform="rotate(-15 101 14)" />
      <rect x="18" y="22" width="5" height="5" rx="1" fill="#40C4FF" transform="rotate(35 18 22)" />
      <text x="50" y="14" fontSize="13">🎉</text>
    </g>
  );
}

/* ── Main character SVG ─────────────────────────────────────────── */

function AyaCharacterSVG({
  emotion,
  blinking,
  speaking,
}: {
  emotion: AyaEmotion;
  blinking: boolean;
  speaking: boolean;
}) {
  const face   = EMOTION_FACE[emotion];
  const bgColor = EMOTION_BG[emotion];

  return (
    <svg
      viewBox="0 0 120 155"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      {/* ── Floating extras (stars, confetti, thought) ── */}
      {face.extras}

      {/* ── Emotion background circle ── */}
      <circle cx="60" cy="68" r="54" fill={bgColor} />

      {/* ── BODY / Hoodie ── */}
      <path
        d="M 10 155 L 10 125 Q 12 112 30 108 L 45 104 Q 52 118 59 120 Q 67 118 75 104 L 90 108 Q 108 112 110 125 L 110 155 Z"
        fill={C.hoodie}
      />
      <rect x="45" y="132" width="30" height="18" rx="5" fill={C.hoodieDeep} opacity="0.6" />
      <path d="M 10 130 Q 22 118 38 112 Q 28 124 20 140 Z" fill={C.hoodieLight} opacity="0.3" />

      {/* ── NECK ── */}
      <rect x="51" y="108" width="18" height="12" rx="4" fill={C.skin} />

      {/* ── BACK HAIR — top cap + two open hanging side strands ── */}
      {/* Top cap — sits behind the face, above forehead */}
      <path
        d="M 22 52 C 20 38 24 20 40 14 C 48 11 54 10 60 10
           C 66 10 72 11 80 14 C 96 20 100 38 98 52
           C 86 42 74 37 60 37 C 46 37 34 42 22 52 Z"
        fill={C.hairDark}
      />
      {/* Left hanging strand — open bottom, does NOT cross under chin */}
      <path
        d="M 22 50 C 14 60 10 76 10 96 C 10 114 13 127 20 136
           C 26 141 34 142 38 139
           C 32 128 26 114 24 96 C 22 76 22 62 24 52 Z"
        fill={C.hairDark}
      />
      {/* Left strand lighter inner sheen */}
      <path
        d="M 24 54 C 20 68 18 86 19 104 C 20 118 24 130 30 137
           C 26 126 24 110 24 92 C 24 74 24 62 24 54 Z"
        fill={C.hair} opacity="0.5"
      />
      {/* Right hanging strand — open bottom, does NOT cross under chin */}
      <path
        d="M 98 50 C 106 60 110 76 110 96 C 110 114 107 127 100 136
           C 94 141 86 142 82 139
           C 88 128 94 114 96 96 C 98 76 98 62 96 52 Z"
        fill={C.hairDark}
      />
      {/* Right strand lighter inner sheen */}
      <path
        d="M 96 54 C 100 68 102 86 101 104 C 100 118 96 130 90 137
           C 94 126 96 110 96 92 C 96 74 96 62 96 54 Z"
        fill={C.hair} opacity="0.5"
      />

      {/* ── FACE ── */}
      <ellipse cx="61" cy="72" rx="34" ry="40" fill={C.skinDark} opacity="0.2" />
      <ellipse cx="59" cy="70" rx="34" ry="40" fill={C.skin} />

      {/* ── EARS ── */}
      <ellipse cx="25" cy="71" rx="7" ry="9" fill={C.skinDark} />
      <ellipse cx="25" cy="71" rx="5" ry="7" fill={C.skin} />
      <ellipse cx="95" cy="71" rx="7" ry="9" fill={C.skinDark} />
      <ellipse cx="95" cy="71" rx="5" ry="7" fill={C.skin} />

      {/* ── FRONT HAIR — natural long wavy, center-parted ── */}
      {/* Smooth top dome — slight center part, flows to forehead */}
      <path
        d="M 27 44 C 25 34 30 20 44 15 C 51 12 55 11 60 11
           C 65 11 69 12 76 15 C 90 20 95 34 93 44
           C 87 34 78 25 67 22 C 63 21 61 21 60 21
           C 59 21 57 21 53 22 C 42 25 33 34 27 44 Z"
        fill={C.hair}
      />
      {/* Left front strand — hangs down beside face to shoulder, open at bottom */}
      <path
        d="M 27 44 C 22 55 20 70 20 86 C 20 104 22 118 26 130
           C 30 136 36 138 40 136
           C 34 124 30 108 28 90 C 26 72 26 58 27 46 Z"
        fill={C.hair}
      />
      {/* Right front strand — hangs down beside face to shoulder, open at bottom */}
      <path
        d="M 93 44 C 98 55 100 70 100 86 C 100 104 98 118 94 130
           C 90 136 84 138 80 136
           C 86 124 90 108 92 90 C 94 72 94 58 93 46 Z"
        fill={C.hair}
      />
      {/* Center part — subtle light crease */}
      <path
        d="M 60 11 C 60 14 60 17 60 21"
        fill="none" stroke={C.hairLight} strokeWidth="1.8" strokeLinecap="round" opacity="0.45"
      />
      {/* Natural flow lines — left arc */}
      <path
        d="M 30 36 C 35 28 44 22 54 21"
        fill="none" stroke={C.hairLight} strokeWidth="1.5" strokeLinecap="round" opacity="0.28"
      />
      {/* Natural flow lines — right arc */}
      <path
        d="M 90 36 C 85 28 76 22 66 21"
        fill="none" stroke={C.hairLight} strokeWidth="1.5" strokeLinecap="round" opacity="0.28"
      />
      {/* Wave stroke — left strand, gentle S-curve full length */}
      <path
        d="M 21 56 C 19 68 19 82 21 96 C 20 108 20 120 22 130"
        fill="none" stroke={C.hairLight} strokeWidth="1.8" strokeLinecap="round" opacity="0.22"
      />
      {/* Wave stroke — right strand, gentle S-curve full length */}
      <path
        d="M 99 56 C 101 68 101 82 99 96 C 100 108 100 120 98 130"
        fill="none" stroke={C.hairLight} strokeWidth="1.8" strokeLinecap="round" opacity="0.22"
      />
      {/* Soft shine highlight */}
      <path
        d="M 44 20 Q 52 15 60 15 Q 68 15 76 20 Q 68 17 60 17 Q 52 17 44 20 Z"
        fill={C.white} opacity="0.14"
      />

      {/* ── EYES (behind glasses) ── */}
      <g id="aya-eyes">
        {renderEyes(face.eyeState, blinking)}
      </g>

      {/* ── EYEBROWS ── */}
      <g id="aya-brows">
        {renderBrows(face.browState)}
      </g>

      {/* ── GLASSES — dark rounded rectangles (official AYA design) ── */}
      {/* Left lens */}
      <rect x="27" y="62" width="24" height="16" rx="7"
        stroke={C.glasses} strokeWidth="2.5"
        fill={C.glassesLens} fillOpacity="0.6"
      />
      {/* Right lens */}
      <rect x="69" y="62" width="24" height="16" rx="7"
        stroke={C.glasses} strokeWidth="2.5"
        fill={C.glassesLens} fillOpacity="0.6"
      />
      {/* Bridge */}
      <line x1="51" y1="70" x2="69" y2="70" stroke={C.glasses} strokeWidth="2" />
      {/* Arms to ears */}
      <line x1="27" y1="70" x2="18" y2="68" stroke={C.glasses} strokeWidth="2" strokeLinecap="round" />
      <line x1="93" y1="70" x2="102" y2="68" stroke={C.glasses} strokeWidth="2" strokeLinecap="round" />
      {/* Lens glint */}
      <path d="M 30 65 Q 32 63 35 64" fill="none" stroke={C.white} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M 72 65 Q 74 63 77 64" fill="none" stroke={C.white} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* ── NOSE ── */}
      <ellipse cx="60" cy="82" rx="3" ry="2" fill={C.skinShade} />

      {/* ── MOUTH ── */}
      <g id="aya-mouth">
        {renderMouth(face.mouthState, speaking)}
      </g>

      {/* ── CHEEKS ── */}
      <ellipse cx="38" cy="86" rx="8" ry="5" fill={C.blush} opacity={face.cheekOpacity} />
      <ellipse cx="82" cy="86" rx="8" ry="5" fill={C.blush} opacity={face.cheekOpacity} />
    </svg>
  );
}

/* ── Props ──────────────────────────────────────────────────────── */

export interface AyaAvatarProps {
  emotion:    AyaEmotion;
  visible:    boolean;
  speaking?:  boolean;
  text?:      string | null;
  className?: string;
  /** Override avatar container size. Defaults to "md" (w-16 h-[4.7rem]). */
  size?: "sm" | "md" | "lg";
}

/* ── Component ──────────────────────────────────────────────────── */

const SIZE_CLASS: Record<string, string> = {
  sm: "w-10 h-12",
  md: "w-16 h-[4.7rem]",
  lg: "w-28 h-32",
};

export function AyaAvatar({
  emotion,
  visible,
  speaking  = false,
  text,
  className = "",
  size      = "md",
}: AyaAvatarProps) {
  const [blinking,        setBlinking]        = useState(false);
  const [isEmotionPulsed, setIsEmotionPulsed] = useState(false);
  const blinkTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkReset  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEmotion = useRef<AyaEmotion>(emotion);

  useEffect(() => { injectStyles(); }, []);

  /* Blink every 4–7 seconds */
  useEffect(() => {
    if (!visible) return;
    function scheduleBlink() {
      const delay = 4000 + Math.random() * 3000;
      blinkTimer.current = setTimeout(() => {
        setBlinking(true);
        blinkReset.current = setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    }
    scheduleBlink();
    return () => {
      if (blinkTimer.current)  clearTimeout(blinkTimer.current);
      if (blinkReset.current)  clearTimeout(blinkReset.current);
    };
  }, [visible]);

  /* Pulse on emotion change */
  useEffect(() => {
    if (emotion === prevEmotion.current) return;
    prevEmotion.current = emotion;
    if (emotion === "neutral") return;
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setIsEmotionPulsed(true);
    pulseTimer.current = setTimeout(() => setIsEmotionPulsed(false), 420);
    return () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); };
  }, [emotion]);

  if (!visible) return null;

  const bodyClass = isEmotionPulsed
    ? "aya-pulse"
    : emotion === "celebrate"
    ? "aya-celeb"
    : emotion === "thinking"
    ? "aya-think"
    : speaking
    ? "aya-speak"
    : "aya-float";

  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label={`AYA — ${emotion}`}>
      {/* Avatar */}
      <div className="relative flex-shrink-0 flex flex-col items-center gap-0.5">
        <div
          className={bodyClass}
          style={{ willChange: "transform", transformOrigin: "center bottom" }}
        >
          <div className={`${SIZE_CLASS[size]} flex items-end justify-center drop-shadow-lg`}>
            <AyaCharacterSVG emotion={emotion} blinking={blinking} speaking={speaking} />
          </div>
        </div>
      </div>

      {/* Optional speech text */}
      {text && (
        <div className="flex-1 min-w-0 text-sm font-medium text-foreground leading-snug">
          {text}
        </div>
      )}
    </div>
  );
}
