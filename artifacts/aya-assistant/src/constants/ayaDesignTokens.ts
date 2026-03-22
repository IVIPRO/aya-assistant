/**
 * AYA Junior Design Tokens
 * Color palette, sizing, and animation constants for AYA character design
 * Reference: docs/AYA_JUNIOR_DESIGN_SPEC.md
 */

// Color Palette
export const AYA_COLORS = {
  // Face tones
  skin: "#F5D5B8",
  skinDark: "#E8B89D",

  // Eyes
  eyeWarm: "#8B6F47",
  eyeAmber: "#D4A373",

  // Hair
  hairDark: "#1A3A52", // Navy
  hairAccent: "#4A90E2", // AI-blue
  hairAccentCyan: "#60D5E8", // Soft cyan

  // Brand colors for accents
  brandGreen: "#10B981",
  brandBlue: "#3B82F6",
  brandGold: "#FBBF24",

  // Glow effects
  glowWhite: "#F8F8F8",
  glowSoft: "#FFD700", // Warm gold
};

// Size constants for avatar contexts
export const AYA_SIZES = {
  listeningModeHeight: 200, // px
  worldMapHeight: 150, // px
  lessonViewerHeight: 120, // px
  mobileMinHeight: 100, // px
};

// Animation duration constants (ms)
export const AYA_ANIMATION_DURATIONS = {
  idleBreathing: 3000,
  expressionChange: 400,
  celebration: 500,
  thinking: 3000,
};

// Expression states
export const AYA_EXPRESSIONS = {
  neutral: "neutral",
  happy: "happy",
  thinking: "thinking",
  celebrating: "celebrating",
  listening: "listening",
  encouraging: "encouraging",
} as const;

export type AYAExpression = typeof AYA_EXPRESSIONS[keyof typeof AYA_EXPRESSIONS];

/**
 * Future: Animation keyframes for expression transitions
 * Will be used in Phase 3 animation implementation
 * 
 * Example structure (for reference):
 * {
 *   eyes: {
 *     scale: [1, 1.1, 1],
 *     brightness: [1, 1.2, 1],
 *   },
 *   mouth: {
 *     y: [0, -4, 0],
 *     scaleY: [1, 1.3, 1],
 *   },
 *   body: {
 *     y: [0, -8, 0],
 *   }
 * }
 */

// AYA personality traits for message generation
export const AYA_PERSONALITY = {
  warmth: "caring and encouraging",
  intelligence: "knowledgeable but approachable",
  calmness: "patient and supportive",
  trustworthiness: "honest and reliable",
} as const;

// Recommended usage in different contexts
export const AYA_USAGE_CONTEXTS = {
  listeningMode: {
    size: "lg",
    defaultExpression: "neutral",
    interactionType: "primary",
  },
  worldMap: {
    size: "md",
    defaultExpression: "happy",
    interactionType: "guide",
  },
  lessonViewer: {
    size: "sm",
    defaultExpression: "encouraging",
    interactionType: "support",
  },
  missionPlay: {
    size: "md",
    defaultExpression: "celebrating",
    interactionType: "reward",
  },
} as const;
