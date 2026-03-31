/**
 * Curriculum Utilities
 * Helper functions to work with the curriculum map structure
 */

import { curriculumMap, generationRules, type Grade, type SchoolStage } from "./curriculumMap";

/**
 * Get all topics for a specific grade and subject
 */
export const getTopicsForGradeAndSubject = (grade: Grade, subjectId: string) => {
  const gradeData = curriculumMap[grade];
  const subject = gradeData.subjects.find(s => s.subjectId === subjectId);
  return subject?.topics ?? [];
};

/**
 * Get all subjects for a specific grade
 */
export const getSubjectsForGrade = (grade: Grade) => {
  return curriculumMap[grade].subjects;
};

/**
 * Get the school stage for a grade (Начален етап or Прогимназия)
 */
export const getStageForGrade = (grade: Grade): SchoolStage => {
  return curriculumMap[grade].stage;
};

/**
 * Check if a topic is available for a specific grade
 */
export const isTopicAvailableForGrade = (topicId: string, grade: Grade): boolean => {
  const subjects = getSubjectsForGrade(grade);
  return subjects.some(subject => 
    subject.topics.some(topic => topic.topicId === topicId && topic.grades.includes(grade))
  );
};

/**
 * Get the difficulty level of a topic for a specific grade
 */
export const getTopicDifficulty = (topicId: string, grade: Grade) => {
  const subjects = getSubjectsForGrade(grade);
  for (const subject of subjects) {
    for (const topic of subject.topics) {
      if (topic.topicId === topicId && topic.grades.includes(grade)) {
        return topic.difficulty;
      }
    }
  }
  return null;
};

/**
 * Check if content type (decimals, fractions) is allowed for a grade
 */
export const isContentTypeAllowed = (grade: Grade, contentType: "decimals" | "fractions"): boolean => {
  const rules = generationRules[grade];
  if (contentType === "decimals") return rules.allowDecimals;
  if (contentType === "fractions") return rules.allowFractions;
  return false;
};

/**
 * Get the maximum number value for a grade
 */
export const getMaxNumberForGrade = (grade: Grade): number => {
  return generationRules[grade].maxNumberValue;
};

/**
 * Get allowed difficulty levels for a grade
 */
export const getAllowedDifficultiesForGrade = (grade: Grade) => {
  return generationRules[grade].allowedDifficulties;
};

/**
 * Get all grades in a school stage
 */
export const getGradesForStage = (stage: SchoolStage): Grade[] => {
  const grades: Grade[] = [];
  for (const grade in curriculumMap) {
    const g = parseInt(grade) as Grade;
    if (curriculumMap[g].stage === stage) {
      grades.push(g);
    }
  }
  return grades;
};

/**
 * Get all grades (1-7)
 */
export const getAllGrades = (): Grade[] => {
  return [1, 2, 3, 4, 5, 6, 7];
};
