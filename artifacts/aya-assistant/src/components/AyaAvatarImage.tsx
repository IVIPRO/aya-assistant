import { useState, useEffect, useRef } from "react";
import avatarLg from "@/assets/aya-avatar-lg.png";
import avatarMd from "@/assets/aya-avatar-md.png";
import avatarSm from "@/assets/aya-avatar-sm.png";
import avatarMini from "@/assets/aya-avatar-mini.png";

const AVATAR_STYLES = `
@keyframes avatarFloat {
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-3px) scale(1.02); }
  100% { transform: translateY(0px) scale(1); }
}

@keyframes avatarSpeaking {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
}

.aya-avatar-animated {
  position: relative;
  animation: avatarFloat 4s ease-in-out infinite;
}

.aya-avatar-animated.avatar-speaking::before {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 200, 80, 0.45), transparent 70%);
  animation: avatarSpeaking 1.6s ease-in-out infinite;
  z-index: -1;
}
`;

// Inject styles once
if (typeof document !== "undefined" && !document.getElementById("aya-avatar-styles")) {
  const styleEl = document.createElement("style");
  styleEl.id = "aya-avatar-styles";
  styleEl.textContent = AVATAR_STYLES;
  document.head.appendChild(styleEl);
}

export type AyaEmotion = "neutral" | "happy" | "thinking" | "encourage" | "celebrate";

interface AyaAvatarImageProps {
  emotion?: AyaEmotion;
  speaking?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  visible?: boolean;
  text?: string;
}

const AVATAR_MAP = {
  sm: avatarSm,
  md: avatarMd,
  lg: avatarLg,
};

const SIZE_PX = {
  sm: 90,
  md: 130,
  lg: 180,
};

export function AyaAvatarImage({
  emotion = "neutral",
  size = "md",
  className,
  visible = true,
  text: _text,
  speaking = false,
}: AyaAvatarImageProps) {
  if (!visible) return null;

  const [cursorFollow, setCursorFollow] = useState({ x: 0, y: 0, rot: 0 });
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current) return;

      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only apply effect if cursor is reasonably close (within ~200px)
      if (dist > 200) {
        setCursorFollow({ x: 0, y: 0, rot: 0 });
        return;
      }

      // Calculate angle and apply max movement caps
      const angle = Math.atan2(dy, dx);
      const maxDist = 80; // max distance to calculate effect
      const cappedDist = Math.min(dist, maxDist);
      const ratio = cappedDist / maxDist;

      // Max offsets: 6px horizontal, 4px vertical, 3deg rotation
      const x = Math.cos(angle) * 6 * ratio;
      const y = Math.sin(angle) * 4 * ratio;
      const rot = Math.sin(angle) * 3 * ratio;

      setCursorFollow({ x, y, rot });
    };

    const handleMouseLeave = () => {
      setCursorFollow({ x: 0, y: 0, rot: 0 });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const src = AVATAR_MAP[size];
  const px = SIZE_PX[size];

  return (
    <div
      ref={avatarRef}
      className={`aya-avatar-animated ${speaking ? "avatar-speaking" : ""} ${className || ""}`}
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: `translate(${cursorFollow.x}px, ${cursorFollow.y}px) rotate(${cursorFollow.rot}deg)`,
        transition: "transform 120ms ease-out",
      }}
    >
      <img
        src={src}
        alt="AYA Avatar"
        width={px}
        height={px}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}
