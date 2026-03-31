/**
 * Curriculum Integration — Phase 5
 * 
 * Safe integration of the curriculum task generation system into the live UI.
 * Used by lesson-viewer and related components.
 * 
 * INTEGRATION FLOW:
 * 1. Detect current grade + subject/topic
 * 2. Validate with validateAndCorrectContext
 * 3. Generate task with generateTask
 * 4. Fall back to existing logic if null
 * 5. Never break the UI
 */

import type { Grade } from "./curriculumMap";
import type { TaskGenerationContext, Task } from "./taskTemplates";
import { validateAndCorrectContext } from "./generationValidator";
import { generateTask } from "./taskTemplates";

/* ── Context Detection ── */

/**
 * Detect current grade from localStorage or context
 * Returns null if not in scope (not grades 2 or 5)
 */
export const detectCurrentGrade = (): Grade | null => {
  try {
    // Check for grade 5 first (stored as "aya_progym_grade")
    const progymGrade = localStorage.getItem("aya_progym_grade");
    if (progymGrade) {
      const grade = parseInt(progymGrade) as Grade;
      if ([5, 6, 7].includes(grade)) return grade; // Only 5 is supported in Phase 5
      if (grade === 5) return 5;
    }

    // Check for elementary grade (default grade 2 for scope)
    // Note: In real usage, would need more context detection
    // For Phase 5, defaulting to grade 2 for elementary context
    return 2;
  } catch {
    return null;
  }
};

/**
 * Detect current subject from context
 * Only "mathematics" is supported in Phase 5
 */
export const detectCurrentSubject = (): string | null => {
  // Phase 5 only supports mathematics
  return "mathematics";
};

/**
 * Detect current topic from context or lesson data
 * Returns null if not available
 */
export const detectCurrentTopic = (topicLabel?: string, topicId?: string): string | null => {
  if (topicId) return topicId;

  // Map common Bulgarian topic labels to IDs if needed
  const labelToIdMap: Record<string, string> = {
    "Събиране": "addition",
    "Изваждане": "subtraction",
    "Умножение": "multiplication",
    "Деление": "division",
    "Текстови задачи": "word-problems",
    "Десетични дроби": "decimal-fractions",
    "Дроби": "fractions",
    "Геометрични фигури": "geometry",
    "Мерене": "measurement",
  };

  if (topicLabel && topicLabel in labelToIdMap) {
    return labelToIdMap[topicLabel];
  }

  return null;
};

/* ── Safe Task Generation ── */

/**
 * Safely attempt to generate a task from the curriculum system
 * Falls back gracefully if validation/generation fails
 */
export const tryGenerateCurriculumTask = (
  grade: Grade,
  topic: string,
  templateType: "solved-example" | "guided-practice" | "independent-practice" | "test-task" | "word-problem",
  difficulty?: "beginner" | "intermediate" | "advanced"
): Task | null => {
  try {
    // Build generation context
    const context: TaskGenerationContext = {
      grade,
      subject: "mathematics",
      topic,
      templateType,
      difficulty,
    };

    // Validate and correct context
    const validated = validateAndCorrectContext(context);

    // Log validation issues internally (don't show to user)
    if (!validated.isValid && validated.validationIssues.length > 0) {
      console.debug("[Curriculum] Validation issues:", validated.validationIssues);
    }

    // Use corrected context if available
    const contextToUse = validated.correctedContext || validated.context;

    // Generate task
    const task = generateTask(contextToUse);

    return task;
  } catch (error) {
    // Never crash - just log and return null for fallback
    console.debug("[Curriculum] Generation error:", error);
    return null;
  }
};

/**
 * Check if curriculum system should be used for current context
 */
export const shouldUseCurriculumSystem = (grade: Grade | null, subject: string | null): boolean => {
  // Only use for grades 2 and 5
  if (grade !== 2 && grade !== 5) return false;

  // Only use for mathematics
  if (subject !== "mathematics") return false;

  return true;
};

/* ── Context Validation Helpers ── */

/**
 * Check if a topic is valid for the current grade
 */
export const isTopicValidForCurrentGrade = (topic: string, grade: Grade): boolean => {
  // Grade 2 topics
  if (grade === 2) {
    const validTopics = [
      "addition",
      "subtraction",
      "word-problems",
      "geometry",
      "measurement",
    ];
    return validTopics.includes(topic);
  }

  // Grade 5 topics
  if (grade === 5) {
    const validTopics = [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "decimal-fractions",
      "common-fractions",
      "word-problems",
      "word-problems-5grade",
      "geometric-figures",
      "perimeter-area",
    ];
    return validTopics.includes(topic);
  }

  return false;
};

/**
 * Get template types available for a grade
 */
export const getAvailableTemplateTypes = (
  grade: Grade,
  difficulty?: "beginner" | "intermediate" | "advanced"
): Array<"solved-example" | "guided-practice" | "independent-practice" | "test-task" | "word-problem"> => {
  // Grade 2: simpler templates
  if (grade === 2) {
    if (difficulty === "beginner") {
      return ["solved-example", "guided-practice"];
    }
    return ["guided-practice", "independent-practice"];
  }

  // Grade 5: all templates available
  if (grade === 5) {
    return [
      "solved-example",
      "guided-practice",
      "independent-practice",
      "test-task",
      "word-problem",
    ];
  }

  return [];
};

/* ── Integration Hooks for Components ── */

/**
 * Pre-flight check before using curriculum system
 * Call this before requesting a task
 */
export const prepareCurriculumGeneration = (
  topicId: string,
  topicLabel?: string
): { canUse: boolean; grade: Grade | null; correctedTopic: string | null } => {
  const grade = detectCurrentGrade();
  const subject = detectCurrentSubject();

  if (!shouldUseCurriculumSystem(grade, subject)) {
    return { canUse: false, grade, correctedTopic: null };
  }

  const topic = detectCurrentTopic(topicLabel, topicId);

  if (!topic || !isTopicValidForCurrentGrade(topic, grade!)) {
    return { canUse: false, grade, correctedTopic: topic };
  }

  return { canUse: true, grade, correctedTopic: topic };
};

/**
 * Safe wrapper for lesson-viewer to check if curriculum system applies
 */
export const applyCurriculumContextIfNeeded = (
  lesson: {
    title?: string;
    grade?: number;
    subject?: string;
    topic?: string;
  }
): { shouldApply: boolean; grade: Grade | null; topic: string | null } => {
  const grade = (lesson.grade as Grade) ?? detectCurrentGrade();
  const subject = lesson.subject ?? detectCurrentSubject();
  const topic = detectCurrentTopic(lesson.topic, lesson.topic);

  const shouldApply =
    grade !== null &&
    subject !== null &&
    topic !== null &&
    shouldUseCurriculumSystem(grade, subject);

  return {
    shouldApply,
    grade: shouldApply ? grade : null,
    topic: shouldApply ? topic : null,
  };
};

/* ── Logging & Monitoring ── */

/**
 * Log curriculum system usage (for debugging, not shown to user)
 */
export const logCurriculumUsage = (
  context: TaskGenerationContext,
  result: Task | null,
  fallbackUsed: boolean
): void => {
  if (process.env.NODE_ENV === "development") {
    console.debug("[Curriculum Integration]", {
      context,
      generated: result !== null,
      fallbackUsed,
      timestamp: new Date().toISOString(),
    });
  }
};

/* ── Safe Fallback Pattern ── */

/**
 * Template for safe task generation with automatic fallback
 * 
 * USAGE:
 * const task = await generateTaskSafely({
 *   grade: 2,
 *   topic: "addition",
 *   templateType: "solved-example",
 *   onFallback: () => { / fallback logic }
 * })
 */
export const generateTaskSafely = async (
  context: TaskGenerationContext,
  onFallback?: () => Task | null
): Promise<Task | null> => {
  // Try curriculum system
  const task = tryGenerateCurriculumTask(
    context.grade,
    context.topic,
    context.templateType,
    context.difficulty
  );

  if (task) {
    logCurriculumUsage(context, task, false);
    return task;
  }

  // Fall back to existing logic
  if (onFallback) {
    const fallbackTask = onFallback();
    logCurriculumUsage(context, fallbackTask, true);
    return fallbackTask;
  }

  return null;
};
