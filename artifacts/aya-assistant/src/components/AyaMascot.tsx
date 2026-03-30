// ─────────────────────────────────────────────────────────────────────────────
// AYaMascot — Animated SVG mascot with cursor-follow, blink, speaking
// Friendly girl with chestnut brown hair, red glasses, cream hoodie
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

interface AyaMascotProps {
  size?: "sm" | "md" | "lg";
  speaking?: boolean;
  happy?: boolean;
  followCursor?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 90,
  md: 130,
  lg: 180,
};

const ANIMATION_STYLES = `
@keyframes ayaBlink {
  0%, 95%, 100% { transform: scaleY(1); }
  96%, 99% { transform: scaleY(0.1); }
}

@keyframes ayaBounce {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}

@keyframes ayaGlow {
  0%, 100% { 
    filter: drop-shadow(0 0 0px rgba(255, 200, 80, 0));
  }
  50% { 
    filter: drop-shadow(0 0 8px rgba(255, 200, 80, 0.3));
  }
}

.aya-mascot-blink {
  animation: ayaBlink 5.5s ease-in-out infinite;
  transform-origin: center;
}

.aya-mascot-bounce {
  animation: ayaBounce 0.6s ease-in-out;
}

.aya-mascot-speaking {
  animation: ayaGlow 1.8s ease-in-out infinite;
}
`;

// Inject styles once
if (typeof document !== "undefined" && !document.getElementById("aya-mascot-styles")) {
  const styleEl = document.createElement("style");
  styleEl.id = "aya-mascot-styles";
  styleEl.textContent = ANIMATION_STYLES;
  document.head.appendChild(styleEl);
}

export function AyaMascot({
  size = "md",
  speaking = false,
  happy = false,
  followCursor = true,
  className,
}: AyaMascotProps) {
  const px = SIZE_MAP[size];
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [bounceKey, setBounceKey] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  // Blink animation (handled by CSS, just trigger it)
  // Pupils follow cursor
  useEffect(() => {
    if (!followCursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only apply effect if cursor reasonably close
      if (dist > 200) {
        setPupilOffset({ x: 0, y: 0 });
        return;
      }

      // Calculate angle and apply max movement caps
      const angle = Math.atan2(dy, dx);
      const maxDist = 100;
      const cappedDist = Math.min(dist, maxDist);
      const ratio = cappedDist / maxDist;

      // Max offsets: 3px horizontal, 2px vertical
      const x = Math.cos(angle) * 3 * ratio;
      const y = Math.sin(angle) * 2 * ratio;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setPupilOffset({ x, y });
      });
    };

    const handleMouseLeave = () => {
      setPupilOffset({ x: 0, y: 0 });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [followCursor]);

  // Trigger bounce animation on happy change
  useEffect(() => {
    if (happy) {
      setBounceKey((k) => k + 1);
    }
  }, [happy]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 160"
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      className={`${className || ""} ${happy ? "aya-mascot-bounce" : ""} ${speaking ? "aya-mascot-speaking" : ""}`}
      key={`bounce-${bounceKey}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        {/* Skin gradient — slightly darker toward edges for roundness */}
        <radialGradient id="aya_skin_grad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FFECD1" />
          <stop offset="50%" stopColor="#FFCC99" />
          <stop offset="100%" stopColor="#E8A876" />
        </radialGradient>

        {/* Hair gradient — lighter at top, darker at edges */}
        <radialGradient id="aya_hair_grad" cx="35%" cy="25%">
          <stop offset="0%" stopColor="#8B5A2B" />
          <stop offset="50%" stopColor="#6B4423" />
          <stop offset="100%" stopColor="#4A2C1A" />
        </radialGradient>

        {/* Hoodie gradient — warmth and depth */}
        <linearGradient id="aya_hoodie_grad" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#F5E6D3" />
          <stop offset="100%" stopColor="#E8D4B8" />
        </linearGradient>

        {/* Glass lens tint */}
        <linearGradient id="aya_lens_grad" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FFE8E0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFD0C0" stopOpacity="0.5" />
        </linearGradient>

        {/* Drop shadow */}
        <filter id="aya_shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#00000015" />
        </filter>
      </defs>

      <g filter="url(#aya_shadow)">
        {/* ── BODY / HOODIE ── */}
        <path
          d="M 20 140 L 20 120 Q 22 110 32 106 L 48 102
             Q 54 110 60 112 Q 66 110 72 102
             L 88 106 Q 98 110 100 120 L 100 160 Z"
          fill="url(#aya_hoodie_grad)"
        />
        {/* Hoodie pocket/detail */}
        <rect x="50" y="130" width="20" height="12" rx="3" fill="#E0C9B0" opacity="0.6" />
        {/* Hoodie strings */}
        <path d="M 50 102 Q 45 115 42 128" stroke="#D4A574" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 70 102 Q 75 115 78 128" stroke="#D4A574" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* ── NECK ── */}
        <rect x="54" y="106" width="12" height="10" rx="2" fill="#FFCC99" />

        {/* ── HEAD (skin) ── */}
        <ellipse cx="60" cy="75" rx="38" ry="44" fill="url(#aya_skin_grad)" />

        {/* ── HAIR BACK (layered effect) ── */}
        <path
          d="M 24 65 C 16 78 12 95 12 110 C 12 125 18 138 28 144
             C 35 148 45 148 52 144
             C 46 132 42 118 40 102 C 38 82 30 68 26 65 Z"
          fill="url(#aya_hair_grad)"
          opacity="0.9"
        />
        <path
          d="M 96 65 C 104 78 108 95 108 110 C 108 125 102 138 92 144
             C 85 148 75 148 68 144
             C 74 132 78 118 80 102 C 82 82 90 68 94 65 Z"
          fill="url(#aya_hair_grad)"
          opacity="0.9"
        />

        {/* ── HAIR TOP (before face) ── */}
        <path
          d="M 26 68 C 20 50 24 20 42 8
             C 50 2 55 0 60 0
             C 65 0 70 2 78 8
             C 96 20 100 50 94 68
             C 88 55 78 48 66 46
             C 64 46 62 46 60 46
             C 58 46 56 46 54 46
             C 42 48 32 55 26 68 Z"
          fill="url(#aya_hair_grad)"
        />

        {/* Hair shine highlight */}
        <ellipse cx="50" cy="22" rx="12" ry="6" fill="white" opacity="0.15" transform="rotate(-20,50,22)" />

        {/* ── EARS ── */}
        <ellipse cx="20" cy="70" rx="7" ry="9" fill="#FFCC99" />
        <ellipse cx="20" cy="70" rx="4" ry="6" fill="#FFAA77" />
        <ellipse cx="100" cy="70" rx="7" ry="9" fill="#FFCC99" />
        <ellipse cx="100" cy="70" rx="4" ry="6" fill="#FFAA77" />

        {/* ── EYES WITH BLINKING ── */}
        <g id="leftEye" className="aya-mascot-blink">
          <ellipse cx="38" cy="72" rx="7" ry="8" fill="white" />
          <circle cx="38" cy="72" r="4.5" fill={happy ? "#1a1a1a" : "#2C1810"} opacity={happy ? 1 : 0.9} />
          <circle cx="39" cy="70" r="2" fill="white" opacity={happy ? 0.9 : 1} />
          {/* Pupil that follows cursor */}
          <circle
            cx={38 + pupilOffset.x}
            cy={72 + pupilOffset.y}
            r="3"
            fill="#1a1a1a"
            style={{ transition: "cx 80ms ease-out, cy 80ms ease-out" }}
          />
        </g>
        <g id="rightEye" className="aya-mascot-blink">
          <ellipse cx="82" cy="72" rx="7" ry="8" fill="white" />
          <circle cx="82" cy="72" r="4.5" fill={happy ? "#1a1a1a" : "#2C1810"} opacity={happy ? 1 : 0.9} />
          <circle cx="83" cy="70" r="2" fill="white" opacity={happy ? 0.9 : 1} />
          {/* Pupil that follows cursor */}
          <circle
            cx={82 + pupilOffset.x}
            cy={72 + pupilOffset.y}
            r="3"
            fill="#1a1a1a"
            style={{ transition: "cx 80ms ease-out, cy 80ms ease-out" }}
          />
        </g>

        {/* ── EYEBROWS ── */}
        <path
          d={happy ? "M 32 58 Q 38 54 44 58" : "M 32 60 Q 38 56 44 60"}
          stroke="#6B4423"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={happy ? "M 76 58 Q 82 54 88 58" : "M 76 60 Q 82 56 88 60"}
          stroke="#6B4423"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── GLASSES (red frames with lens tint) ── */}
        <g id="glasses">
          {/* Left lens */}
          <rect x="24" y="60" width="24" height="20" rx="6" stroke="#DC143C" strokeWidth="2.5" fill="url(#aya_lens_grad)" />
          {/* Right lens */}
          <rect x="72" y="60" width="24" height="20" rx="6" stroke="#DC143C" strokeWidth="2.5" fill="url(#aya_lens_grad)" />
          {/* Bridge */}
          <path d="M 48 68 L 72 68" stroke="#DC143C" strokeWidth="2.5" strokeLinecap="round" />
          {/* Left arm */}
          <path d="M 24 65 L 12 63" stroke="#DC143C" strokeWidth="2.5" strokeLinecap="round" />
          {/* Right arm */}
          <path d="M 96 65 L 108 63" stroke="#DC143C" strokeWidth="2.5" strokeLinecap="round" />
          {/* Lens glare shine */}
          <ellipse cx="32" cy="64" rx="3" ry="2" fill="white" opacity="0.6" />
          <ellipse cx="80" cy="64" rx="3" ry="2" fill="white" opacity="0.6" />
        </g>

        {/* ── NOSE ── */}
        <ellipse cx="60" cy="82" rx="3" ry="2.5" fill="#E8A876" opacity="0.7" />

        {/* ── MOUTH ── */}
        {speaking ? (
          // Talking mouth (open)
          <>
            <ellipse cx="60" cy="94" rx="10" ry="7" fill="#C85A50" />
            <rect x="52" y="91" width="16" height="5" rx="2" fill="white" opacity="0.5" />
          </>
        ) : happy ? (
          // Happy smile with teeth peek
          <>
            <path
              d="M 48 92 Q 60 104 72 92"
              fill="#FFB3A7"
              stroke="#C85A50"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="50" y="90" width="20" height="4" rx="1.5" fill="white" opacity="0.7" />
          </>
        ) : (
          // Neutral gentle smile
          <path
            d="M 48 92 Q 60 100 72 92"
            fill="none"
            stroke="#C85A50"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* ── BLUSH ── */}
        <ellipse cx="28" cy="88" rx="9" ry="6" fill="#FFB3A7" opacity={happy ? 0.7 : 0.5} />
        <ellipse cx="92" cy="88" rx="9" ry="6" fill="#FFB3A7" opacity={happy ? 0.7 : 0.5} />

        {/* ── FACE HIGHLIGHT (forehead shine) ── */}
        <ellipse cx="45" cy="48" rx="14" ry="9" fill="white" opacity="0.1" transform="rotate(-25,45,48)" />
      </g>
    </svg>
  );
}
