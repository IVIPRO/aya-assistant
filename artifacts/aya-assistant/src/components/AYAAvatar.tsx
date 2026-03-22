/**
 * AYA Junior Avatar Component
 * Lightweight placeholder for AYA Junior character
 * 
 * Design spec: docs/AYA_JUNIOR_DESIGN_SPEC.md
 * Current state: Animated emoji placeholder with color customization
 * Future: Will be replaced with SVG/illustrated avatar with expressions
 */

import { motion } from "framer-motion";

interface AYAAvatarProps {
  size?: "sm" | "md" | "lg";
  expression?: "neutral" | "happy" | "thinking" | "celebrating";
  animated?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: "w-20 h-20 text-4xl",
  md: "w-32 h-32 text-6xl",
  lg: "w-40 h-40 text-8xl",
};

const EXPRESSION_EMOJI = {
  neutral: "🐼",
  happy: "😊",
  thinking: "🤔",
  celebrating: "🎉",
};

const ANIMATION_VARIANTS = {
  neutral: {
    scale: [1, 1.02, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  happy: {
    scale: [1, 1.05, 1],
    y: [0, -4, 0],
    transition: { duration: 0.6, repeat: 1, ease: "easeInOut" },
  },
  thinking: {
    rotate: [0, 2, -2, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  celebrating: {
    y: [0, -8, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 0.5, repeat: 3, ease: "easeOut" },
  },
};

/**
 * AYA Avatar - Placeholder for AYA Junior character
 * 
 * Current implementation: Animated emoji with panda base (warm, friendly)
 * 
 * Design goals from spec:
 * - Warm, friendly, approachable
 * - Intelligent and calm presence
 * - Age-appropriate (9-11 appearance)
 * - Safe for children to interact with
 * 
 * Future evolution (Phase 2-4):
 * - SVG or illustrated avatar with soft, rounded features
 * - Expressive eyes with warm brown/amber color
 * - Futuristic hair accents with AI-blue gradient
 * - Modern outfit with subtle tech glows
 * - Expression variants (neutral, happy, thinking, celebrating)
 * - Smooth animations and transitions
 * - Multiple sizes for different UI contexts
 * 
 * Usage:
 * <AYAAvatar size="md" expression="happy" animated />
 */
export function AYAAvatar({
  size = "md",
  expression = "neutral",
  animated = true,
  className = "",
}: AYAAvatarProps) {
  const emoji = EXPRESSION_EMOJI[expression] || EXPRESSION_EMOJI.neutral;
  const variants = animated ? ANIMATION_VARIANTS[expression] : {};

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${SIZE_MAP[size]} flex items-center justify-center select-none drop-shadow-lg`}
        variants={variants}
        animate={animated ? expression : "neutral"}
      >
        {emoji}
      </motion.div>
    </div>
  );
}

export default AYAAvatar;
