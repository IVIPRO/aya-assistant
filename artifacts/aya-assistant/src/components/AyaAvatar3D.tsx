import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AYAAvatar3D — Pixar/Duolingo-inspired 3D-style brand mascot
// Head ≈ 65% of total, eyes +20%, soft radial gradients simulate depth
// Props identical to AyaAvatar for drop-in compatibility
// ─────────────────────────────────────────────────────────────────────────────

export type EmotionMode3D =
  | "neutral"
  | "happy"
  | "thinking"
  | "encourage"
  | "celebrate";

interface AyaAvatar3DProps {
  emotion?: EmotionMode3D;
  speaking?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  visible?: boolean;
  text?: string;
}

const SIZE_MAP = { sm: 90, md: 130, lg: 180 };

export function AyaAvatar3D({
  emotion = "neutral",
  speaking = false,
  size = "md",
  className,
  visible = true,
  text: _text,
}: AyaAvatar3DProps) {
  const [blinking, setBlinking] = useState(false);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function scheduleNextBlink() {
      const delay = 2500 + Math.random() * 3500;
      blinkRef.current = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          scheduleNextBlink();
        }, 140);
      }, delay);
    }
    scheduleNextBlink();
    return () => clearTimeout(blinkRef.current);
  }, []);

  const px = SIZE_MAP[size];
  const h = Math.round(px * (160 / 120));

  if (!visible) return null;

  return (
    <svg
      viewBox="0 0 120 160"
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={h}
      className={className}
      style={{ overflow: "visible", display: "block" }}
      aria-hidden="true"
    >
      <AyaDefs />
      <AyaCharacter emotion={emotion} speaking={speaking} blinking={blinking} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG <defs> — gradients and filters
// ─────────────────────────────────────────────────────────────────────────────
function AyaDefs() {
  return (
    <defs>
      {/* Skin — radial highlight upper-left for sphere feel */}
      <radialGradient id="a3d_skin" cx="38%" cy="30%" r="62%" gradientUnits="objectBoundingBox">
        <stop offset="0%"   stopColor="#FFE4C0" />
        <stop offset="55%"  stopColor="#FFCC99" />
        <stop offset="100%" stopColor="#E8976A" />
      </radialGradient>

      {/* Ear skin */}
      <radialGradient id="a3d_ear" cx="50%" cy="40%" r="60%">
        <stop offset="0%"   stopColor="#FFCC99" />
        <stop offset="100%" stopColor="#E8976A" />
      </radialGradient>

      {/* Hair — radial highlight from upper area */}
      <radialGradient id="a3d_hair" cx="38%" cy="20%" r="72%" gradientUnits="objectBoundingBox">
        <stop offset="0%"   stopColor="#7B4A1E" />
        <stop offset="50%"  stopColor="#5D3A1A" />
        <stop offset="100%" stopColor="#3A2010" />
      </radialGradient>

      {/* Hair side falls — vertical gradient */}
      <linearGradient id="a3d_hair_side" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#5D3A1A" />
        <stop offset="60%"  stopColor="#4A2E12" />
        <stop offset="100%" stopColor="#3A2010" />
      </linearGradient>

      {/* Hoodie */}
      <linearGradient id="a3d_hoodie" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%"   stopColor="#FF8C40" />
        <stop offset="100%" stopColor="#D4611E" />
      </linearGradient>

      {/* Glasses lens */}
      <linearGradient id="a3d_lens" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%"   stopColor="#E8F4FD" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#C5E8FA" stopOpacity="0.5" />
      </linearGradient>

      {/* Blush gradient */}
      <radialGradient id="a3d_blush" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#FF9E8E" stopOpacity="0.72" />
        <stop offset="100%" stopColor="#FF9E8E" stopOpacity="0"   />
      </radialGradient>

      {/* Soft drop shadow */}
      <filter id="a3d_shadow" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#00000020" />
      </filter>
    </defs>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main character group
// ─────────────────────────────────────────────────────────────────────────────
const BG_COLORS: Record<EmotionMode3D, string> = {
  neutral:   "#FFF3E0",
  happy:     "#FFFDE7",
  thinking:  "#F3E5F5",
  encourage: "#E8F5E9",
  celebrate: "#FFF9C4",
};

function AyaCharacter({
  emotion,
  speaking,
  blinking,
}: {
  emotion: EmotionMode3D;
  speaking: boolean;
  blinking: boolean;
}) {
  return (
    <g filter="url(#a3d_shadow)">
      {/* Ambient background */}
      <ellipse cx="60" cy="70" rx="56" ry="58" fill={BG_COLORS[emotion]} opacity="0.95" />

      {/* ── BODY ── */}
      <path
        d="M 14 160 L 14 132 Q 16 118 34 114 L 48 110
           Q 54 122 60 124 Q 66 122 72 110
           L 86 114 Q 104 118 106 132 L 106 160 Z"
        fill="url(#a3d_hoodie)"
      />
      <rect x="46" y="138" width="28" height="16" rx="5" fill="#C0581A" opacity="0.55" />
      <path d="M 14 136 Q 26 122 42 118 Q 32 130 22 148 Z" fill="white" opacity="0.12" />

      {/* ── NECK ── */}
      <rect x="52" y="110" width="16" height="14" rx="4" fill="#FFCC99" />
      <ellipse cx="60" cy="112" rx="14" ry="5" fill="#00000018" />

      {/* ── HAIR BACK (behind head) ── */}
      <path
        d="M 22 58 C 10 72 6 92 7 112 C 8 130 14 142 24 148
           C 30 152 40 152 46 148
           C 40 136 34 120 32 102 C 30 82 26 66 24 58 Z"
        fill="url(#a3d_hair_side)"
      />
      <path
        d="M 98 58 C 110 72 114 92 113 112 C 112 130 106 142 96 148
           C 90 152 80 152 74 148
           C 80 136 86 120 88 102 C 90 82 94 66 96 58 Z"
        fill="url(#a3d_hair_side)"
      />

      {/* ── HAIR TOP (before head) ── */}
      <path
        d="M 22 60
           C 16 44 20 20 36 12
           C 46 6 52 4 60 4
           C 68 4 74 6 84 12
           C 100 20 104 44 98 60
           C 92 48 80 40 68 38
           C 64 37 62 37 60 37
           C 58 37 56 37 52 38
           C 40 40 28 48 22 60 Z"
        fill="url(#a3d_hair)"
      />
      <ellipse cx="52" cy="18" rx="16" ry="7" fill="white" opacity="0.12" transform="rotate(-15,52,18)" />
      <path d="M 60 4 C 60 14 60 24 60 37" fill="none" stroke="#7B4A1E" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

      {/* ── HEAD SPHERE ── */}
      <ellipse cx="64" cy="74" rx="39" ry="46" fill="#E8976A" opacity="0.18" />
      <ellipse cx="60" cy="70" rx="39" ry="46" fill="url(#a3d_skin)" />

      {/* ── EARS ── */}
      <ellipse cx="21" cy="72" rx="8" ry="10" fill="url(#a3d_ear)" />
      <ellipse cx="21" cy="72" rx="5" ry="7" fill="#FFCC99" />
      <ellipse cx="99" cy="72" rx="8" ry="10" fill="url(#a3d_ear)" />
      <ellipse cx="99" cy="72" rx="5" ry="7" fill="#FFCC99" />

      {/* ── FRINGE WISPS (after face) ── */}
      <path
        d="M 53 37 C 46 40 40 45 37 52 C 35 57 36 61 40 61
           C 43 58 43 54 45 49 C 48 44 52 40 55 37 Z"
        fill="url(#a3d_hair)" opacity="0.85"
      />
      <path
        d="M 67 37 C 74 40 80 45 83 52 C 85 56 83 60 80 60
           C 77 57 77 53 75 49 C 72 44 68 40 65 37 Z"
        fill="url(#a3d_hair)" opacity="0.80"
      />

      {/* ── HAIR SIDE FALLS (after face, frames cheeks) ── */}
      <path
        d="M 22 60
           C 14 74 11 92 12 110 C 13 128 17 140 24 148
           C 29 152 38 153 43 150
           C 37 138 33 122 31 104 C 29 84 27 70 24 60 Z"
        fill="url(#a3d_hair_side)"
      />
      <path
        d="M 98 60
           C 106 74 109 94 108 112 C 107 128 103 140 96 148
           C 91 152 82 153 77 150
           C 83 138 87 122 89 104 C 91 84 93 70 96 60 Z"
        fill="url(#a3d_hair_side)"
      />
      <path d="M 15 76 C 13 94 13 110 15 128 C 16 140 18 148 21 152" fill="none" stroke="#7B4A1E" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
      <path d="M 105 78 C 107 96 107 112 105 128 C 104 140 102 148 99 152" fill="none" stroke="#7B4A1E" strokeWidth="1.5" strokeLinecap="round" opacity="0.22" />

      {/* ── EYES ── */}
      <AyaEyes emotion={emotion} blinking={blinking} speaking={speaking} />

      {/* ── EYEBROWS ── */}
      <AyaBrows emotion={emotion} />

      {/* ── GLASSES with lens glare ── */}
      <rect x="24" y="62" width="27" height="18" rx="8" stroke="#3A3A3A" strokeWidth="2.5" fill="url(#a3d_lens)" />
      <ellipse cx="31" cy="67" rx="4" ry="2.5" fill="white" opacity="0.55" transform="rotate(-20,31,67)" />
      <rect x="69" y="62" width="27" height="18" rx="8" stroke="#3A3A3A" strokeWidth="2.5" fill="url(#a3d_lens)" />
      <ellipse cx="76" cy="67" rx="4" ry="2.5" fill="white" opacity="0.55" transform="rotate(-20,76,67)" />
      <path d="M 51 71 Q 60 68 69 71" stroke="#3A3A3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 24 71 L 14 69" stroke="#3A3A3A" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 96 71 L 106 69" stroke="#3A3A3A" strokeWidth="2.2" strokeLinecap="round" />

      {/* ── NOSE ── */}
      <ellipse cx="60" cy="84" rx="3.5" ry="2.5" fill="#E8976A" opacity="0.6" />

      {/* ── MOUTH ── */}
      <AyaMouth emotion={emotion} speaking={speaking} />

      {/* ── CHEEKS — soft, larger ── */}
      <ellipse cx="34" cy="88" rx="13" ry="8" fill="url(#a3d_blush)" />
      <ellipse cx="86" cy="88" rx="13" ry="8" fill="url(#a3d_blush)" />

      {/* ── FACE SPECULAR HIGHLIGHT ── */}
      <ellipse cx="42" cy="50" rx="18" ry="12" fill="white" opacity="0.07" transform="rotate(-20,42,50)" />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components: Eyes, Brows, Mouth
// ─────────────────────────────────────────────────────────────────────────────

function AyaEyes({
  emotion,
  blinking,
  speaking,
}: {
  emotion: EmotionMode3D;
  blinking: boolean;
  speaking: boolean;
}) {
  if (blinking) {
    return (
      <>
        <path d="M 31 72 Q 37.5 68 44 72" stroke="#1A0800" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 76 72 Q 82.5 68 89 72" stroke="#1A0800" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    );
  }
  if (emotion === "happy" || emotion === "celebrate") {
    return (
      <>
        <path d="M 31 73 Q 37.5 65 44 73" stroke="#1A0800" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M 76 73 Q 82.5 65 89 73" stroke="#1A0800" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </>
    );
  }
  if (emotion === "thinking") {
    return (
      <>
        <ellipse cx="37.5" cy="72" rx="6" ry="6.5" fill="#1A0800" />
        <ellipse cx="37.5" cy="72" rx="6" ry="6.5" fill="#1A0800" />
        <circle cx="40" cy="70" r="1.8" fill="white" />
        <ellipse cx="82.5" cy="71" rx="6" ry="6" fill="#1A0800" />
        <circle cx="85" cy="69" r="1.8" fill="white" />
      </>
    );
  }
  // neutral / encourage
  return (
    <>
      <ellipse cx="37.5" cy="72" rx="6" ry="6.5" fill="#1A0800" />
      <circle cx="39.5" cy="70" r="1.8" fill="white" />
      <ellipse cx="82.5" cy="72" rx="6" ry="6.5" fill="#1A0800" />
      <circle cx="84.5" cy="70" r="1.8" fill="white" />
    </>
  );
}

function AyaBrows({ emotion }: { emotion: EmotionMode3D }) {
  const c = "#5D3A1A";
  const sw = "2.5";
  if (emotion === "happy" || emotion === "celebrate") {
    return (
      <>
        <path d="M 27 60 Q 37.5 55 48 60" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" />
        <path d="M 72 60 Q 82.5 55 93 60" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" />
      </>
    );
  }
  if (emotion === "thinking") {
    return (
      <>
        <path d="M 27 60 Q 37.5 57 48 62" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" />
        <path d="M 72 57 Q 82.5 53 93 58" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" />
      </>
    );
  }
  return (
    <>
      <path d="M 27 61 Q 37.5 57 48 61" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <path d="M 72 61 Q 82.5 57 93 61" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" />
    </>
  );
}

function AyaMouth({
  emotion,
  speaking,
}: {
  emotion: EmotionMode3D;
  speaking: boolean;
}) {
  const stroke = "#C0705A";
  const fill = "#FFB3A7";
  if (speaking) {
    return <ellipse cx="60" cy="96" rx="9" ry="5.5" fill={fill} stroke={stroke} strokeWidth="1.5" />;
  }
  if (emotion === "happy" || emotion === "celebrate") {
    return (
      <g>
        <path d="M 45 93 Q 60 104 75 93" fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <rect x="47" y="91" width="26" height="5" rx="2.5" fill="white" />
      </g>
    );
  }
  if (emotion === "encourage") {
    return <path d="M 48 93 Q 60 102 72 93" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />;
  }
  if (emotion === "thinking") {
    return <path d="M 52 95 Q 60 99 67 95" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />;
  }
  return <path d="M 49 93 Q 60 102 71 93" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />;
}

// Backward-compat type alias — consumers can import AyaEmotion from here
export type AyaEmotion = EmotionMode3D;
