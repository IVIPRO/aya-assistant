/**
 * AYA Animated Tutor Avatar — v2
 *
 * Fully inline SVG character — no external image files needed.
 * Character design:
 *   - ~10-12 year-old stylized tutor girl
 *   - Medium brown hair tied back, red headband
 *   - Round red glasses
 *   - Warm smile, expressive eyes
 *   - Orange/amber hoodie
 *
 * Supports emotion states: neutral | happy | thinking | encourage | celebrate
 * Animations: idle float, blink, speaking mouth, emotion pulse
 * All CSS-only, no heavy libraries.
 */

import { useState, useEffect, useRef, ReactNode } from "react";

/* ── Types ──────────────────────────────────────────────────────── */

export type AyaEmotion = "neutral" | "happy" | "thinking" | "encourage" | "celebrate";

/* ── CSS keyframes (injected once) ─────────────────────────────── */

const AYA_STYLE_ID = "aya-avatar-styles-v2";

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
@keyframes aya-mouth-talk {
  0%,100% { transform: scaleY(1); }
  50%      { transform: scaleY(0.6); }
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
.aya-dot-1   { animation: aya-dot 0.8s ease-in-out infinite 0s; }
.aya-dot-2   { animation: aya-dot 0.8s ease-in-out infinite 0.16s; }
.aya-dot-3   { animation: aya-dot 0.8s ease-in-out infinite 0.32s; }
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
  skin:        "#FFCBA4",
  skinDark:    "#F0AD84",
  skinShade:   "#E8976A",
  hair:        "#7B4A1E",
  hairDark:    "#5A3212",
  headband:    "#D81919",
  glasses:     "#D01515",
  glassesArm:  "#B01010",
  hoodie:      "#F07830",
  hoodieDeep:  "#D4611E",
  hoodieLight: "#FF9950",
  white:       "#FFFFFF",
  irisL:       "#7B5230",
  irisR:       "#7B5230",
  pupil:       "#1A0800",
  eyebrow:     "#5A3212",
  noseTip:     "#E8976A",
  blush:       "#FF8080",
  mouthLine:   "#C05050",
  mouthFill:   "#FF7070",
  teeth:       "#FFFFFF",
  tongue:      "#F08080",
  star:        "#FFD700",
  thought:     "#E0EEFF",
};

/* ── Emotion face configs ───────────────────────────────────────── */

type EyeState = "open" | "happy" | "wide" | "blink" | "look-up";
type MouthState = "smile" | "grin" | "open-joy" | "thinking" | "cheer";
type BrowState = "neutral" | "raised" | "furrowed" | "one-up" | "happy";

interface FaceConfig {
  eyeState: EyeState;
  mouthState: MouthState;
  browState: BrowState;
  cheekOpacity: number;
  extras?: ReactNode;
}

const EMOTION_FACE: Record<AyaEmotion, FaceConfig> = {
  neutral: {
    eyeState: "open",
    mouthState: "smile",
    browState: "neutral",
    cheekOpacity: 0.18,
  },
  happy: {
    eyeState: "happy",
    mouthState: "grin",
    browState: "raised",
    cheekOpacity: 0.32,
  },
  thinking: {
    eyeState: "look-up",
    mouthState: "thinking",
    browState: "one-up",
    cheekOpacity: 0.12,
    extras: <ThoughtBubble />,
  },
  encourage: {
    eyeState: "wide",
    mouthState: "open-joy",
    browState: "raised",
    cheekOpacity: 0.28,
    extras: <Sparkles />,
  },
  celebrate: {
    eyeState: "happy",
    mouthState: "cheer",
    browState: "happy",
    cheekOpacity: 0.40,
    extras: <Stars />,
  },
};

/* ── Eye renderers ──────────────────────────────────────────────── */

function EyeOpen({ cx, cy, blinking }: { cx: number; cy: number; blinking: boolean }) {
  return (
    <g style={blinking ? { animation: "aya-blink-anim 0.14s ease-in-out", transformOrigin: `${cx}px ${cy}px` } : undefined}>
      <ellipse cx={cx} cy={cy} rx={6.5} ry={7.5} fill={C.white} />
      <ellipse cx={cx} cy={cy + 0.5} rx={4.2} ry={4.8} fill={C.irisL} />
      <ellipse cx={cx} cy={cy + 0.5} rx={2.5} ry={2.8} fill={C.pupil} />
      <circle  cx={cx + 2} cy={cy - 1.5} r={1.3} fill={C.white} />
    </g>
  );
}

function EyeHappy({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <path d={`M ${cx-6} ${cy+1} Q ${cx} ${cy-7} ${cx+6} ${cy+1}`} fill={C.pupil} />
      <path d={`M ${cx-5.5} ${cy+1} Q ${cx} ${cy-5.5} ${cx+5.5} ${cy+1}`} fill={C.irisL} />
      <path d={`M ${cx-4} ${cy} Q ${cx} ${cy-5} ${cx+4} ${cy}`} fill={C.pupil} />
      <circle cx={cx + 2} cy={cy - 1} r={1} fill={C.white} />
    </g>
  );
}

function EyeWide({ cx, cy, blinking }: { cx: number; cy: number; blinking: boolean }) {
  return (
    <g style={blinking ? { animation: "aya-blink-anim 0.14s ease-in-out", transformOrigin: `${cx}px ${cy}px` } : undefined}>
      <ellipse cx={cx} cy={cy} rx={7.5} ry={8.5} fill={C.white} />
      <ellipse cx={cx} cy={cy + 0.5} rx={5} ry={5.5} fill={C.irisL} />
      <ellipse cx={cx} cy={cy + 0.5} rx={3} ry={3.2} fill={C.pupil} />
      <circle  cx={cx + 2.5} cy={cy - 2} r={1.5} fill={C.white} />
    </g>
  );
}

function EyeLookUp({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={6.5} ry={7.5} fill={C.white} />
      <ellipse cx={cx - 0.5} cy={cy - 2} rx={4.2} ry={4.6} fill={C.irisL} />
      <ellipse cx={cx - 0.5} cy={cy - 2} rx={2.5} ry={2.7} fill={C.pupil} />
      <circle  cx={cx + 1} cy={cy - 3.5} r={1.2} fill={C.white} />
    </g>
  );
}

function renderEyes(state: EyeState, blinking: boolean) {
  const LX = 42, RX = 76, Y = 72;
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
  const LX = 42, RX = 76, W = 11;
  const brow = (cx: number, dy: number, rotate: number) => (
    <path
      d={`M ${cx - W} ${59 + dy} Q ${cx} ${56 + dy} ${cx + W} ${59 + dy}`}
      stroke={C.eyebrow}
      strokeWidth="2.8"
      strokeLinecap="round"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)`, transformOrigin: `${cx}px ${58 + dy}px` }}
    />
  );
  switch (state) {
    case "raised":   return (<>{brow(LX, -3, 0)}{brow(RX, -3, 0)}</>);
    case "happy":    return (<>{brow(LX, -2, -3)}{brow(RX, -2, 3)}</>);
    case "furrowed": return (<>{brow(LX, 1, 5)}{brow(RX, 1, -5)}</>);
    case "one-up":   return (<>{brow(LX, -4, 0)}{brow(RX, 1, 0)}</>);
    default:         return (<>{brow(LX, 0, 0)}{brow(RX, 0, 0)}</>);
  }
}

/* ── Mouth renderers ────────────────────────────────────────────── */

function renderMouth(state: MouthState, isSpeaking: boolean) {
  const baseY = 94;
  if (isSpeaking) {
    return (
      <g>
        <ellipse cx={59} cy={baseY + 1} rx={9} ry={5} fill={C.mouthFill} />
        <rect x={50} y={baseY - 4} width={18} height={4} rx={2} fill={C.mouthLine} />
        <ellipse cx={59} cy={baseY + 3} rx={5} ry={2.5} fill={C.tongue} />
      </g>
    );
  }
  switch (state) {
    case "grin":
      return (
        <g>
          <path d={`M 44 ${baseY} Q 59 ${baseY + 10} 74 ${baseY}`} fill={C.mouthFill} />
          <path d={`M 44 ${baseY} Q 59 ${baseY + 10} 74 ${baseY}`} fill="none" stroke={C.mouthLine} strokeWidth="1.8" strokeLinecap="round" />
          <rect x={46} y={baseY - 2} width={26} height={5} rx={2.5} fill={C.teeth} />
          <line x1={59} y1={baseY - 2} x2={59} y2={baseY + 3} stroke={C.mouthLine} strokeWidth="0.8" opacity={0.4} />
        </g>
      );
    case "open-joy":
      return (
        <g>
          <ellipse cx={59} cy={baseY + 3} rx={11} ry={9} fill={C.mouthFill} />
          <rect x={48} y={baseY - 5} width={22} height={6} rx={3} fill={C.teeth} />
          <ellipse cx={59} cy={baseY + 7} rx={7} ry={4} fill={C.tongue} />
          <path d={`M 48 ${baseY} Q 59 ${baseY + 12} 70 ${baseY}`} fill="none" stroke={C.mouthLine} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    case "cheer":
      return (
        <g>
          <path d={`M 43 ${baseY - 1} Q 59 ${baseY + 12} 75 ${baseY - 1}`} fill={C.mouthFill} />
          <path d={`M 43 ${baseY - 1} Q 59 ${baseY + 12} 75 ${baseY - 1}`} fill="none" stroke={C.mouthLine} strokeWidth="1.8" strokeLinecap="round" />
          <rect x={45} y={baseY - 4} width={28} height={6} rx={3} fill={C.teeth} />
          <ellipse cx={59} cy={baseY + 7} rx={8} ry={3.5} fill={C.tongue} />
        </g>
      );
    case "thinking":
      return (
        <path d={`M 52 ${baseY} Q 59 ${baseY - 3} 67 ${baseY} Q 63 ${baseY + 4} 56 ${baseY + 1} Z`}
          fill={C.mouthLine} opacity={0.8} />
      );
    default: // smile
      return (
        <path
          d={`M 49 ${baseY} Q 59 ${baseY + 9} 69 ${baseY}`}
          fill="none"
          stroke={C.mouthLine}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
  }
}

/* ── Floating extras ────────────────────────────────────────────── */

function ThoughtBubble() {
  return (
    <g opacity={0.9}>
      <circle cx={86} cy={52} r={1.8} fill={C.thought} stroke="#9BB8E8" strokeWidth="1" />
      <circle cx={91} cy={45} r={2.8} fill={C.thought} stroke="#9BB8E8" strokeWidth="1" />
      <ellipse cx={99} cy={37} rx={7} ry={6} fill={C.thought} stroke="#9BB8E8" strokeWidth="1.2" />
      <text x={95} y={40} fontSize="7" textAnchor="middle" fill="#7090C0">?</text>
    </g>
  );
}

function Sparkles() {
  return (
    <g>
      {[[16, 38, 1.2], [100, 42, 0.9], [14, 60, 0.8], [106, 55, 1.1]].map(([x, y, s], i) => (
        <g key={i} style={{ animation: `aya-star-spin ${1.5 + i * 0.3}s linear infinite`, transformOrigin: `${x}px ${y}px` }}>
          <polygon points={`${x},${y - 5 * s} ${x + 1.5 * s},${y - 1.5 * s} ${x + 5 * s},${y - 1.5 * s} ${x + 2.5 * s},${y + 1.5 * s} ${x + 3.5 * s},${y + 5 * s} ${x},${y + 3 * s} ${x - 3.5 * s},${y + 5 * s} ${x - 2.5 * s},${y + 1.5 * s} ${x - 5 * s},${y - 1.5 * s} ${x - 1.5 * s},${y - 1.5 * s}`}
            fill={C.star} opacity={0.85} />
        </g>
      ))}
    </g>
  );
}

function Stars() {
  const positions = [[18, 36], [102, 40], [14, 58], [108, 52], [60, 20]];
  return (
    <g>
      {positions.map(([x, y], i) => (
        <g key={i} style={{ animation: `aya-star-spin ${1 + i * 0.25}s linear infinite`, transformOrigin: `${x}px ${y}px` }}>
          <polygon
            points={`${x},${y - 6} ${x + 2},${y - 2} ${x + 6},${y - 2} ${x + 3},${y + 1} ${x + 4},${y + 5} ${x},${y + 3} ${x - 4},${y + 5} ${x - 3},${y + 1} ${x - 6},${y - 2} ${x - 2},${y - 2}`}
            fill={i % 2 === 0 ? C.star : "#FF9500"}
            opacity={0.9}
          />
        </g>
      ))}
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
  const face = EMOTION_FACE[emotion];

  return (
    <svg
      viewBox="0 0 120 155"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      {/* ── Extras (stars, thought bubble) ── */}
      {face.extras}

      {/* ── BODY / Hoodie ── */}
      {/* Hoodie body */}
      <path d="M 10 155 L 10 125 Q 12 112 30 108 L 45 104 Q 52 118 59 120 Q 67 118 75 104 L 90 108 Q 108 112 110 125 L 110 155 Z"
        fill={C.hoodie} />
      {/* Hoodie pocket */}
      <rect x="45" y="132" width="30" height="18" rx="5" fill={C.hoodieDeep} opacity="0.6" />
      {/* Hoodie light sheen left shoulder */}
      <path d="M 10 130 Q 22 118 38 112 Q 28 124 20 140 Z" fill={C.hoodieLight} opacity="0.35" />
      {/* Hood behind head */}
      <path d="M 18 115 Q 12 100 18 80 Q 22 65 30 60 L 26 80 Q 18 96 22 115 Z" fill={C.hoodieDeep} opacity="0.5" />
      <path d="M 102 115 Q 108 100 102 80 Q 98 65 90 60 L 94 80 Q 102 96 98 115 Z" fill={C.hoodieDeep} opacity="0.5" />
      {/* Hoodie string/drawstring knot */}
      <circle cx="55" cy="126" r="3" fill={C.hoodieDeep} />
      <circle cx="65" cy="126" r="3" fill={C.hoodieDeep} />
      <path d="M 55 126 Q 50 133 48 140" fill="none" stroke={C.hoodieDeep} strokeWidth="2" />
      <path d="M 65 126 Q 70 133 72 140" fill="none" stroke={C.hoodieDeep} strokeWidth="2" />

      {/* ── NECK ── */}
      <rect x="51" y="108" width="18" height="12" rx="4" fill={C.skin} />
      <path d="M 51 114 Q 59 118 69 114" fill={C.skinDark} opacity="0.4" />

      {/* ── BACK HAIR (behind face) — fuller for curly volume ── */}
      <ellipse cx="60" cy="68" rx="42" ry="48" fill={C.hairDark} />
      {/* Ponytail right side */}
      <ellipse cx="97" cy="72" rx="10" ry="8" fill={C.hair} />
      <ellipse cx="101" cy="65" rx="8" ry="6" fill={C.hairDark} />
      {/* Curly ponytail coils */}
      <path d="M 97 78 C 106 85 110 96 106 106" fill="none" stroke={C.hairDark} strokeWidth="5" strokeLinecap="round" />
      <path d="M 104 88 C 110 95 109 104 104 110" fill="none" stroke={C.hair} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
      {/* Hair scrunchie/band dot */}
      <circle cx="97" cy="73" r="4.5" fill={C.headband} />
      <circle cx="97" cy="73" r="2.8" fill="#FF4444" />

      {/* ── FACE ── */}
      {/* Face shadow/depth */}
      <ellipse cx="61" cy="74" rx="34" ry="40" fill={C.skinDark} opacity="0.25" />
      {/* Main face */}
      <ellipse cx="59" cy="72" rx="34" ry="40" fill={C.skin} />
      {/* Temple highlight */}
      <ellipse cx="46" cy="58" rx="8" ry="6" fill={C.white} opacity="0.22" transform="rotate(-15 46 58)" />

      {/* ── EARS ── */}
      <ellipse cx="25" cy="73" rx="7" ry="9" fill={C.skinDark} />
      <ellipse cx="25" cy="73" rx="5" ry="7" fill={C.skin} />
      <ellipse cx="95" cy="73" rx="7" ry="9" fill={C.skinDark} />
      <ellipse cx="95" cy="73" rx="5" ry="7" fill={C.skin} />
      <ellipse cx="25" cy="73" rx="2.5" ry="3.5" fill={C.skinDark} opacity="0.5" />
      <ellipse cx="95" cy="73" rx="2.5" ry="3.5" fill={C.skinDark} opacity="0.5" />

      {/* ── FRONT HAIR — CURLY ── */}
      {/* Main curly hair shape — bumpy top hairline */}
      <path d="M 24 62 C 22 51 26 41 30 35 C 28 29 31 24 36 23 C 39 21 43 23 46 26 C 48 22 53 20 57 21 C 60 18 65 19 69 22 C 72 19 77 20 81 24 C 85 25 88 30 87 35 C 90 41 94 51 96 62 C 88 49 78 46 70 45 C 65 44 61 44 59 44 C 57 44 53 44 48 45 C 40 46 31 49 24 62 Z"
        fill={C.hair} />
      {/* Curl loops along the top hairline */}
      <path d="M 31 33 C 28 27 32 22 37 25" fill="none" stroke={C.hairDark} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 44 22 C 42 16 48 15 51 20" fill="none" stroke={C.hairDark} strokeWidth="2" strokeLinecap="round" />
      <path d="M 58 20 C 56 14 62 13 65 18" fill="none" stroke={C.hairDark} strokeWidth="2" strokeLinecap="round" />
      <path d="M 73 22 C 72 16 77 16 80 21" fill="none" stroke={C.hairDark} strokeWidth="2" strokeLinecap="round" />
      <path d="M 85 32 C 88 26 92 28 90 34" fill="none" stroke={C.hairDark} strokeWidth="2" strokeLinecap="round" />
      {/* Curly coil — left side */}
      <path d="M 24 62 C 19 70 18 79 22 87" fill="none" stroke={C.hair} strokeWidth="6.5" strokeLinecap="round" />
      <path d="M 21 72 C 16 79 17 87 22 93" fill="none" stroke={C.hairDark} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M 20 82 C 15 88 16 94 21 98" fill="none" stroke={C.hair} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
      {/* Curly coil — right side */}
      <path d="M 96 62 C 101 70 102 79 98 87" fill="none" stroke={C.hair} strokeWidth="6.5" strokeLinecap="round" />
      <path d="M 99 72 C 104 79 103 87 98 93" fill="none" stroke={C.hairDark} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M 100 82 C 105 88 104 94 99 98" fill="none" stroke={C.hair} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
      {/* Hair shine */}
      <path d="M 38 30 Q 53 25 67 27 Q 55 28 41 34 Z" fill={C.white} opacity="0.2" />

      {/* ── RED HEADBAND ── */}
      <path d="M 26 56 Q 30 38 59 36 Q 88 37 94 56 Q 84 44 59 43 Q 34 44 26 56 Z"
        fill={C.headband} />
      {/* Headband sheen */}
      <path d="M 35 46 Q 50 40 70 41 Q 52 42 37 50 Z" fill={C.white} opacity="0.25" />
      {/* Headband bow on right side */}
      <g transform="translate(88,49)">
        <path d="M -5 -4 Q -2 0 -5 4 L 0 2 L 5 4 Q 2 0 5 -4 L 0 -2 Z" fill="#FF3333" />
        <circle cx="0" cy="0" r="2.5" fill={C.headband} />
      </g>

      {/* ── EYES (drawn after brows, behind glasses) ── */}
      <g id="aya-eyes">
        {renderEyes(face.eyeState, blinking)}
      </g>

      {/* ── NOSE ── */}
      <path d="M 56 83 Q 59 87 62 83" fill="none" stroke={C.noseTip} strokeWidth="1.8" strokeLinecap="round" />

      {/* ── MOUTH ── */}
      <g id="aya-mouth">
        {renderMouth(face.mouthState, speaking)}
      </g>

      {/* ── CHEEK BLUSH ── */}
      <ellipse cx="28" cy="84" rx="9" ry="6" fill={C.blush} opacity={face.cheekOpacity} />
      <ellipse cx="90" cy="84" rx="9" ry="6" fill={C.blush} opacity={face.cheekOpacity} />

      {/* ── EYEBROWS (on top of glasses area) ── */}
      <g id="aya-brows">
        {renderBrows(face.browState)}
      </g>

      {/* ── GLASSES (on top of eyes) ── */}
      {/* Left lens */}
      <circle cx="42" cy="72" r="12" fill="none" stroke={C.glasses} strokeWidth="2.5" />
      {/* Right lens */}
      <circle cx="76" cy="72" r="12" fill="none" stroke={C.glasses} strokeWidth="2.5" />
      {/* Bridge */}
      <path d="M 54 72 Q 59 70 64 72" fill="none" stroke={C.glassesArm} strokeWidth="2.2" />
      {/* Arms to ears */}
      <path d="M 30 68 Q 36 70 42 70" fill="none" stroke={C.glassesArm} strokeWidth="2" strokeLinecap="round" />
      <path d="M 76 70 Q 82 70 88 68" fill="none" stroke={C.glassesArm} strokeWidth="2" strokeLinecap="round" />
      {/* Lens glint */}
      <path d="M 35 65 Q 37 63 40 64" fill="none" stroke={C.white} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M 69 65 Q 71 63 74 64" fill="none" stroke={C.white} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

      {/* ── FACE HIGHLIGHT ── */}
      <ellipse cx="48" cy="60" rx="4" ry="3" fill={C.white} opacity="0.15" transform="rotate(-15 48 60)" />
    </svg>
  );
}

/* ── Props ──────────────────────────────────────────────────────── */

export interface AyaAvatarProps {
  emotion: AyaEmotion;
  visible: boolean;
  speaking?: boolean;
  text?: string | null;
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
  const [blinking,        setBlinking]        = useState(false);
  const [isEmotionPulsed, setIsEmotionPulsed] = useState(false);
  const blinkTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkReset        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEmotion       = useRef<AyaEmotion>(emotion);

  useEffect(() => { injectStyles(); }, []);

  /* Blink every 4–6 seconds */
  useEffect(() => {
    if (!visible) return;
    function scheduleBlink() {
      const delay = 4000 + Math.random() * 2000;
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

  /* Choose body animation class */
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
          <div className="w-16 h-[4.7rem] flex items-end justify-center drop-shadow-lg">
            <AyaCharacterSVG emotion={emotion} blinking={blinking} speaking={speaking} />
          </div>
        </div>

        {/* Speaking dots */}
        {speaking && (
          <div className="flex items-end gap-1 h-3 mt-0.5" aria-hidden="true">
            <span className="aya-dot-1 w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
            <span className="aya-dot-2 w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
            <span className="aya-dot-3 w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
          </div>
        )}
      </div>

      {/* Speech bubble */}
      {text && (
        <div className="relative max-w-[200px]">
          <div className="bg-white border-2 border-orange-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-md">
            <p className="text-xs font-semibold text-gray-700 leading-snug">{text}</p>
          </div>
          <div className="absolute left-0 top-3 w-3 h-3 bg-orange-200 rotate-45 -translate-x-1.5 rounded-sm" />
        </div>
      )}
    </div>
  );
}
