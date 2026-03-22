/**
 * AYA Junior Avatar Component
 * SVG-based avatar with expression variants
 * 
 * Design spec: docs/AYA_JUNIOR_DESIGN_SPEC.md
 * Assets: src/assets/aya-avatar/
 */

import { motion } from "framer-motion";

interface AYAAvatarProps {
  size?: "sm" | "md" | "lg";
  expression?: "neutral" | "happy" | "thinking" | "encouraging" | "celebrating";
  animated?: boolean;
  className?: string;
  width?: number | string;
  height?: number | string;
}

const SIZE_MAP: Record<string, { w: string; h: string; px: number }> = {
  sm: { w: "w-20", h: "h-20", px: 80 },
  md: { w: "w-32", h: "h-32", px: 128 },
  lg: { w: "w-40", h: "h-40", px: 160 },
};

// Map expression to SVG file path
const EXPRESSION_SVG: Record<string, string> = {
  neutral: "/assets/aya-avatar/aya-neutral.svg",
  happy: "/assets/aya-avatar/aya-happy.svg",
  thinking: "/assets/aya-avatar/aya-thinking.svg",
  encouraging: "/assets/aya-avatar/aya-encouraging.svg",
  celebrating: "/assets/aya-avatar/aya-celebrating.svg",
};

const ANIMATION_VARIANTS = {
  neutral: {
    scale: [1, 1.02, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  happy: {
    scale: [1, 1.05, 1],
    y: [0, -4, 0],
    transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    rotate: [0, 2, -2, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  encouraging: {
    scale: [1, 1.03, 1],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
  celebrating: {
    y: [0, -8, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 0.5, repeat: 3, ease: "easeOut" },
  },
};

/**
 * AYA Avatar Component
 * 
 * Renders AYA Junior character with different emotional expressions
 * 
 * Expressions:
 * - neutral: Calm, ready-to-help (idle state)
 * - happy: Warm smile, celebratory mood
 * - thinking: Thoughtful, processing task
 * - encouraging: Supportive, caring
 * - celebrating: Achievement recognition
 * 
 * Usage:
 * <AYAAvatar expression="happy" size="md" animated />
 * <AYAAvatar expression="thinking" width={200} height={200} />
 */
export function AYAAvatar({
  size = "md",
  expression = "neutral",
  animated = true,
  className = "",
  width,
  height,
}: AYAAvatarProps) {
  const svgPath = EXPRESSION_SVG[expression] || EXPRESSION_SVG.neutral;
  const sizeConfig = SIZE_MAP[size];
  
  // Use custom width/height if provided, otherwise use size map
  const computedWidth = width ?? sizeConfig.px;
  const computedHeight = height ?? sizeConfig.px;
  
  const variants = animated ? ANIMATION_VARIANTS[expression] : {};

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeConfig.w} ${sizeConfig.h} flex items-center justify-center select-none drop-shadow-lg`}
        style={{ width: computedWidth, height: computedHeight }}
        variants={variants}
        animate={animated ? expression : "neutral"}
      >
        <img
          src={svgPath}
          alt={`AYA ${expression}`}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </motion.div>
    </div>
  );
}

export default AYAAvatar;
