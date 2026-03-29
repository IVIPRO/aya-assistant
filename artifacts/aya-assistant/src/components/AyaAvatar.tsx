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

      {/* ── HAIR TOP — hugs skull, single dark-brown, drawn before face ── */}
      {/* Outer edge follows skull curve closely; inner hairline dips to y=34 to sit on forehead */}
      <path
        d="M 25 54
           C 19 39 22 17 37 11
           C 47 6 52 5 60 5
           C 68 5 73 6 83 11
           C 98 17 101 39 95 54
           C 90 46 82 41 72 39
           C 67 38 62 38 60 38
           C 58 38 53 38 48 39
           C 38 41 30 46 25 54 Z"
        fill={C.hair}
      />
      {/* Hairline boundary — lowered to y=38-42, less forehead visible */}
      <path
        d="M 26 54 C 31 49 40 43 50 41 C 55 39 58 38 60 38
           C 62 38 65 39 70 41 C 80 43 89 49 94 54"
        fill="none" stroke={C.skin} strokeWidth="2.5" strokeLinecap="round" opacity="0.35"
      />
      {/* Center-part crease — crown to new lower hairline */}
      <path d="M 60 5 C 60 14 60 24 60 38" fill="none" stroke={C.hairLight} strokeWidth="1.4" strokeLinecap="round" opacity="0.38" />
      {/* Crown shine */}
      <path d="M 46 18 Q 53 13 60 13 Q 67 13 74 18 Q 67 15 60 15 Q 53 15 46 18 Z" fill={C.white} opacity="0.13" />

      {/* ── FACE ── */}
      <ellipse cx="61" cy="72" rx="34" ry="40" fill={C.skinDark} opacity="0.2" />
      <ellipse cx="59" cy="70" rx="34" ry="40" fill={C.skin} />

      {/* ── EARS ── */}
      <ellipse cx="25" cy="71" rx="7" ry="9" fill={C.skinDark} />
      <ellipse cx="25" cy="71" rx="5" ry="7" fill={C.skin} />
      <ellipse cx="95" cy="71" rx="7" ry="9" fill={C.skinDark} />
      <ellipse cx="95" cy="71" rx="5" ry="7" fill={C.skin} />

      {/* ── FRINGE WISPS — drawn after face, soft fall over upper forehead ── */}
      {/* Left wisp — slightly wider, tapers to open rounded end near cheek */}
      <path
        d="M 55 38
           C 49 40 43 44 40 50
           C 38 55 39 58 43 58
           C 45 55 45 51 47 47
           C 50 43 54 40 57 38 Z"
        fill={C.hair} opacity="0.82"
      />
      {/* Right wisp — slightly shorter for asymmetry */}
      <path
        d="M 65 38
           C 71 40 77 44 80 50
           C 82 54 80 57 77 57
           C 75 54 75 50 73 46
           C 70 42 66 40 63 38 Z"
        fill={C.hair} opacity="0.78"
      />

      {/* ── HAIR LEFT — gentle S-curve outer, natural soft tip ── */}
      <path
        d="M 25 54
           C 17 62 13 78 14 94
           C 15 110 18 124 24 133
           C 28 140 36 143 42 141
           C 37 130 33 114 31 96
           C 29 78 28 63 26 54 Z"
        fill={C.hair}
      />
      {/* ── HAIR RIGHT — deliberately different curve + shorter tip for asymmetry ── */}
      <path
        d="M 95 54
           C 103 62 107 80 106 96
           C 105 112 102 124 96 133
           C 92 140 85 143 79 140
           C 83 130 87 114 89 96
           C 91 78 92 63 94 54 Z"
        fill={C.hair}
      />
      {/* Wave texture — left strand, slightly more pronounced */}
      <path d="M 17 66 C 15 82 15 98 17 114 C 18 126 20 136 22 141" fill="none" stroke={C.hairLight} strokeWidth="1.6" strokeLinecap="round" opacity="0.22" />
      {/* Wave texture — right strand, slightly different rhythm */}
      <path d="M 103 68 C 105 84 105 100 103 114 C 102 126 100 134 98 139" fill="none" stroke={C.hairLight} strokeWidth="1.6" strokeLinecap="round" opacity="0.2" />

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
