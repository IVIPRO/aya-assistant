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

.aya-avatar-animated {
  animation: avatarFloat 4s ease-in-out infinite;
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
  speaking: _speaking,
}: AyaAvatarImageProps) {
  if (!visible) return null;

  const src = AVATAR_MAP[size];
  const px = SIZE_PX[size];

  return (
    <div
      className={`aya-avatar-animated ${className || ""}`}
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
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
