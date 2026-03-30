import avatarLg from "@/assets/aya-avatar-lg.png";
import avatarMd from "@/assets/aya-avatar-md.png";
import avatarSm from "@/assets/aya-avatar-sm.png";
import avatarMini from "@/assets/aya-avatar-mini.png";

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
      className={className}
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
