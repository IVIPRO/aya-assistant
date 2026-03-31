/**
 * Generation Validation — Phase 4
 * 
 * Validates that generated tasks match curriculum rules before use.
 * Prevents invalid content (e.g., grade 2 getting decimals).
 * Provides safe fallbacks for invalid requests.
 * 
 * Scope: Grades 2 & 5 mathematics (reference implementations)
 */

import type { Grade } from "./curriculumMap";
import type { TaskGenerationContext, TemplateType } from "./taskTemplates";
import {
  getTopicsForGradeAndSubject,
  isTopicAvailableForGrade,
  isContentTypeAllowed,
  getAllowedDifficultiesForGrade,
} from "./curriculumUtils";
import { isTemplateTypeAvailable, isTemplateValidForGrade } from "./taskTemplates";

/* ── Validation Result ── */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedContext?: TaskGenerationContext; // Fallback context if invalid
}

/* ── Core Validation Rules ── */

/**
 * Validate that a generation context is safe for the selected grade/topic
 */
export const validateGenerationContext = (context: TaskGenerationContext): ValidationResult => {
  // Rule 1: Only grades 2 and 5 are supported
  if (context.grade !== 2 && context.grade !== 5) {
    return {
      isValid: false,
      reason: `Grade ${context.grade} is not yet supported (only 2 and 5)`,
      suggestedContext: { ...context, grade: 2 }, // Fallback to grade 2
    };
  }

  // Rule 2: Only mathematics is supported
  if (context.subject !== "mathematics") {
    return {
      isValid: false,
      reason: `Subject "${context.subject}" is not yet supported (only mathematics)`,
    };
  }

  // Rule 3: Check if topic is available for this grade
  if (!isTopicAvailableForGrade(context.topic, context.grade)) {
    return {
      isValid: false,
      reason: `Topic "${context.topic}" is not available for grade ${context.grade}`,
      suggestedContext: {
        ...context,
        topic: getValidTopicFallback(context.grade, context.subject),
      },
    };
  }

  // Rule 4: Check if template type is available for this topic/grade
  if (!isTemplateTypeAvailable(context.grade, context.topic, context.templateType)) {
    return {
      isValid: false,
      reason: `Template type "${context.templateType}" is not available for grade ${context.grade} ${context.topic}`,
      suggestedContext: {
        ...context,
        templateType: getValidTemplateFallback(context.grade, context.topic),
      },
    };
  }

  // Rule 5: Check if difficulty is allowed for this grade
  const allowedDifficulties = getAllowedDifficultiesForGrade(context.grade);
  if (context.difficulty && !allowedDifficulties.includes(context.difficulty)) {
    return {
      isValid: false,
      reason: `Difficulty "${context.difficulty}" is not allowed for grade ${context.grade}`,
      suggestedContext: {
        ...context,
        difficulty: allowedDifficulties[0], // Use first allowed difficulty
      },
    };
  }

  return { isValid: true };
};

/**
 * Validate topic content constraints (decimals, fractions, etc.)
 */
export const validateTopicContentForGrade = (
  topicId: string,
  grade: Grade
): ValidationResult => {
  // Grade 2 constraints
  if (grade === 2) {
    // Grade 2 cannot have:
    if (
      topicId.includes("decimal") ||
      topicId.includes("fraction") ||
      topicId.includes("algebra") ||
      topicId === "percentage" ||
      topicId === "divisibility"
    ) {
      return {
        isValid: false,
        reason: `Grade 2 cannot access "${topicId}" (too advanced)`,
        suggestedContext: {
          grade: 2,
          subject: "mathematics",
          topic: "addition", // Fallback to basic topic
          templateType: "solved-example",
        },
      };
    }
  }

  // Grade 5 can have everything in its curriculum
  if (grade === 5) {
    return { isValid: true };
  }

  return { isValid: true };
};

/**
 * Validate content format matches grade level
 * (e.g., decimals only for grade 5+, no fractions for grade 1)
 */
export const validateContentFormat = (
  contentFormat: "arithmetic" | "decimals" | "fractions" | "algebra",
  grade: Grade
): ValidationResult => {
  switch (contentFormat) {
    case "decimals":
      if (!isContentTypeAllowed(grade, "decimals")) {
        return {
          isValid: false,
          reason: `Grade ${grade} is not allowed to use decimal fractions`,
        };
      }
      break;

    case "fractions":
      if (!isContentTypeAllowed(grade, "fractions")) {
        return {
          isValid: false,
          reason: `Grade ${grade} is not allowed to use fractions`,
        };
      }
      break;

    case "algebra":
      if (grade < 5) {
        return {
          isValid: false,
          reason: `Grade ${grade} is not allowed to use algebra (only grade 5+)`,
        };
      }
      break;

    case "arithmetic":
      // All grades can use arithmetic
      break;
  }

  return { isValid: true };
};

/**
 * Validate word problem is appropriate for grade
 */
export const validateWordProblem = (
  story: string,
  operationType: "addition" | "subtraction" | "multiplication" | "division",
  grade: Grade
): ValidationResult => {
  // Grade 2 can have: addition, subtraction, simple word problems
  if (grade === 2) {
    if (operationType === "multiplication" || operationType === "division") {
      return {
        isValid: false,
        reason: `Grade 2 word problems cannot use ${operationType}`,
        suggestedContext: {
          grade: 2,
          subject: "mathematics",
          topic: "word-problems",
          templateType: "word-problem",
          difficulty: "beginner",
        },
      };
    }
  }

  // Grade 5 can have all operations
  if (grade === 5) {
    return { isValid: true };
  }

  return { isValid: true };
};

/* ── Safe Fallback Helpers ── */

/**
 * Find a valid topic for the grade if requested topic is not available
 */
const getValidTopicFallback = (grade: Grade, subject: string): string => {
  const topics = getTopicsForGradeAndSubject(grade, subject);
  if (topics.length === 0) {
    return "addition"; // Ultimate fallback
  }
  return topics[0].topicId;
};

/**
 * Find a valid template type for the grade/topic combination
 */
const getValidTemplateFallback = (grade: Grade, topic: string): TemplateType => {
  // Grade 2 basics can use solved-example or guided-practice
  if (grade === 2) {
    return "solved-example";
  }

  // Grade 5 can use any type
  if (grade === 5) {
    return "solved-example";
  }

  return "solved-example";
};

/**
 * Get valid difficulty for a grade if requested difficulty is invalid
 */
const getValidDifficultyFallback = (grade: Grade): "beginner" | "intermediate" | "advanced" => {
  const allowed = getAllowedDifficultiesForGrade(grade);
  return allowed[0] || "beginner";
};

/* ── Public Validation Wrapper ── */

export interface ValidatedContext {
  context: TaskGenerationContext;
  isValid: boolean;
  validationIssues: string[];
  correctedContext?: TaskGenerationContext;
}

/**
 * Comprehensive validation of generation context
 * Returns corrected context if issues found
 */
export const validateAndCorrectContext = (
  context: TaskGenerationContext
): ValidatedContext => {
  const issues: string[] = [];
  let correctedContext = { ...context };
  let isValid = true;

  // Run all validations
  const contextValidation = validateGenerationContext(context);
  if (!contextValidation.isValid) {
    issues.push(contextValidation.reason || "Invalid context");
    isValid = false;
    if (contextValidation.suggestedContext) {
      correctedContext = contextValidation.suggestedContext;
    }
  }

  const contentValidation = validateTopicContentForGrade(context.topic, context.grade);
  if (!contentValidation.isValid) {
    issues.push(contentValidation.reason || "Invalid content for grade");
    isValid = false;
    if (contentValidation.suggestedContext) {
      correctedContext = contentValidation.suggestedContext;
    }
  }

  // If all validations pass
  if (issues.length === 0) {
    isValid = true;
  }

  return {
    context,
    isValid,
    validationIssues: issues,
    correctedContext: !isValid ? correctedContext : undefined,
  };
};

/* ── Safe Task Generation Wrapper ── */

/**
 * Check if a task object is valid for its grade before use
 * (After task is generated from template)
 */
export const validateGeneratedTask = (
  taskGrade: Grade,
  taskTopic: string,
  taskHasDecimals: boolean,
  taskHasFractions: boolean
): ValidationResult => {
  // Check decimals
  if (taskHasDecimals && !isContentTypeAllowed(taskGrade, "decimals")) {
    return {
      isValid: false,
      reason: `Task contains decimals but grade ${taskGrade} cannot access decimal content`,
    };
  }

  // Check fractions
  if (taskHasFractions && !isContentTypeAllowed(taskGrade, "fractions")) {
    return {
      isValid: false,
      reason: `Task contains fractions but grade ${taskGrade} cannot access fraction content`,
    };
  }

  // Check if topic is available
  if (!isTopicAvailableForGrade(taskTopic, taskGrade)) {
    return {
      isValid: false,
      reason: `Task topic "${taskTopic}" is not available for grade ${taskGrade}`,
    };
  }

  return { isValid: true };
};

/* ── Validation Status Checks ── */

/**
 * Check if a grade can access a content type
 */
export const canGradeAccessContentType = (
  grade: Grade,
  contentType: "decimals" | "fractions" | "algebra"
): boolean => {
  if (contentType === "decimals" || contentType === "fractions") {
    return isContentTypeAllowed(grade, contentType);
  }
  if (contentType === "algebra") {
    return grade >= 5;
  }
  return false;
};

/**
 * Check if a grade can access an operation
 */
export const canGradeAccessOperation = (
  grade: Grade,
  operation: "addition" | "subtraction" | "multiplication" | "division"
): boolean => {
  // Grade 2 can do addition and subtraction only
  if (grade === 2) {
    return operation === "addition" || operation === "subtraction";
  }

  // Grade 5+ can do all operations
  if (grade >= 5) {
    return true;
  }

  return false;
};

/**
 * Get a safe recommended template type for a grade
 */
export const getRecommendedTemplateType = (
  grade: Grade,
  difficulty: "beginner" | "intermediate" | "advanced"
): TemplateType => {
  if (difficulty === "beginner") {
    return "solved-example";
  }
  if (difficulty === "intermediate") {
    return grade === 2 ? "guided-practice" : "independent-practice";
  }
  return "test-task";
};
