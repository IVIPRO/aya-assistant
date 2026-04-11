/**
 * Curriculum Map Structure for AYA
 * 
 * Bulgarian school grades 1–7, organized by stage/grade/subject/topic
 * Reuses existing topics from curriculum.ts
 * 
 * PHASE 1-2: Structure + mapping existing topics
 * Phases 3-5: Task templates, generation rules, implementation
 */

export type SchoolStage = "Начален етап" | "Прогимназия";
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface CurriculumTopic {
  topicId: string; // Reuses ID from curriculum.ts
  label: string; // Bulgarian label
  grades: Grade[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface CurriculumSubject {
  subjectId: string; // Reuses ID from curriculum.ts
  label: string; // Bulgarian label
  topics: CurriculumTopic[];
}

export interface CurriculumGrade {
  grade: Grade;
  stage: SchoolStage;
  subjects: CurriculumSubject[];
}

/**
 * PHASE 1-2: CURRICULUM MAP WITH EXISTING TOPICS
 * 
 * Maps existing AYA topics to Bulgarian school grades
 * Only includes topics that already exist in the system
 */

export const curriculumMap: Record<Grade, CurriculumGrade> = {
  1: {
    grade: 1,
    stage: "Начален етап",
    subjects: [
      {
        subjectId: "mathematics",
        label: "Математика",
        topics: [
          { topicId: "addition", label: "Събиране", grades: [1], difficulty: "beginner" },
          { topicId: "subtraction", label: "Изваждане", grades: [1], difficulty: "beginner" },
          { topicId: "geometry", label: "Геометрични фигури", grades: [1], difficulty: "beginner" },
        ],
      },
      {
        subjectId: "bulgarian-language",
        label: "Български език и литература",
        topics: [
          { topicId: "alphabet", label: "Азбука", grades: [1], difficulty: "beginner" },
          { topicId: "reading", label: "Четене", grades: [1], difficulty: "beginner" },
        ],
      },
    ],
  },
  2: {
    grade: 2,
    stage: "Начален етап",
    subjects: [
      {
        subjectId: "mathematics",
        label: "Математика",
        topics: [
          { topicId: "addition", label: "Събиране", grades: [2], difficulty: "beginner" },
          { topicId: "subtraction", label: "Изваждане", grades: [2], difficulty: "beginner" },
          { topicId: "multiplication", label: "Умножение", grades: [2], difficulty: "beginner" },
          { topicId: "word-problems", label: "Текстови задачи", grades: [2], difficulty: "intermediate" },
          { topicId: "geometry", label: "Геометрични фигури", grades: [2], difficulty: "beginner" },
          { topicId: "measurement", label: "Мерене", grades: [2], difficulty: "beginner" },
        ],
      },
      {
        subjectId: "bulgarian-language",
        label: "Български език и литература",
        topics: [
          { topicId: "reading", label: "Четене", grades: [2], difficulty: "beginner" },
          { topicId: "writing", label: "Пишем изречения", grades: [2], difficulty: "intermediate" },
          { topicId: "grammar", label: "Основна граматика", grades: [2], difficulty: "beginner" },
        ],
      },
    ],
  },
  3: {
    grade: 3,
    stage: "Начален етап",
    subjects: [
      {
        subjectId: "mathematics",
        label: "Математика",
        topics: [
          { topicId: "addition", label: "Събиране", grades: [3], difficulty: "intermediate" },
          { topicId: "subtraction", label: "Изваждане", grades: [3], difficulty: "intermediate" },
          { topicId: "multiplication", label: "Умножение", grades: [3], difficulty: "intermediate" },
          { topicId: "division", label: "Деление", grades: [3], difficulty: "intermediate" },
          { topicId: "word-problems", label: "Текстови задачи", grades: [3], difficulty: "intermediate" },
          { topicId: "fractions", label: "Дроби", grades: [3], difficulty: "intermediate" },
          { topicId: "geometry", label: "Геометрични фигури", grades: [3], difficulty: "intermediate" },
          { topicId: "measurement", label: "Мерене", grades: [3], difficulty: "intermediate" },
        ],
      },
      {
        subjectId: "bulgarian-language",
        label: "Български език и литература",
        topics: [
          { topicId: "reading", label: "Четене", grades: [3], difficulty: "intermediate" },
          { topicId: "writing", label: "Писане", grades: [3], difficulty: "intermediate" },
          { topicId: "grammar", label: "Граматика", grades: [3], difficulty: "intermediate" },
          { topicId: "punctuation", label: "Пунктуация", grades: [3], difficulty: "intermediate" },
        ],
      },
    ],
  },
  4: {
    grade: 4,
    stage: "Начален етап",
    subjects: [
      {
        subjectId: "mathematics",
        label: "Математика",
        topics: [
          { topicId: "addition", label: "Събиране", grades: [4], difficulty: "intermediate" },
          { topicId: "subtraction", label: "Изваждане", grades: [4], difficulty: "intermediate" },
          { topicId: "multiplication", label: "Умножение", grades: [4], difficulty: "advanced" },
          { topicId: "division", label: "Деление", grades: [4], difficulty: "advanced" },
          { topicId: "word-problems", label: "Текстови задачи", grades: [4], difficulty: "advanced" },
          { topicId: "fractions", label: "Дроби", grades: [4], difficulty: "intermediate" },
          { topicId: "geometry", label: "Геометрични фигури", grades: [4], difficulty: "intermediate" },
          { topicId: "measurement", label: "Мерене", grades: [4], difficulty: "intermediate" },
        ],
      },
      {
        subjectId: "bulgarian-language",
        label: "Български език и литература",
        topics: [
          { topicId: "reading", label: "Четене", grades: [4], difficulty: "advanced" },
          { topicId: "writing", label: "Писане", grades: [4], difficulty: "advanced" },
          { topicId: "grammar", label: "Граматика", grades: [4], difficulty: "advanced" },
          { topicId: "nouns-verbs", label: "Съществителни и глаголи", grades: [4], difficulty: "intermediate" },
        ],
      },
    ],
  },
  5: {
    grade: 5,
    stage: "Прогимназия",
    subjects: [
      {
        subjectId: "mathematics",
        label: "Математика",
        topics: [
          { topicId: "natural-numbers", label: "Натурални числа", grades: [5], difficulty: "beginner" },
          { topicId: "divisibility", label: "Делимост", grades: [5], difficulty: "beginner" },
          { topicId: "common-fractions", label: "Обикновени дроби", grades: [5], difficulty: "intermediate" },
          { topicId: "decimal-fractions", label: "Десетични дроби", grades: [5], difficulty: "intermediate" },
          { topicId: "geometric-figures", label: "Геометрични фигури", grades: [5], difficulty: "intermediate" },
          { topicId: "perimeter-area", label: "Периметър и лице", grades: [5], difficulty: "intermediate" },
          { topicId: "percentage-5grade", label: "Проценти", grades: [5], difficulty: "advanced" },
          { topicId: "word-problems-5grade", label: "Текстови задачи", grades: [5], difficulty: "advanced" },
        ],
      },
      {
        subjectId: "bulgarian-language",
        label: "Български език и литература",
        topics: [
          { topicId: "reading", label: "Четене и разбиране", grades: [5], difficulty: "intermediate" },
          { topicId: "writing", label: "Писане", grades: [5], difficulty: "advanced" },
          { topicId: "grammar", label: "Граматика", grades: [5], difficulty: "intermediate" },
          { topicId: "vocabulary", label: "Речников запас", grades: [5], difficulty: "intermediate" },
        ],
      },
    ],
  },
  6: {
    grade: 6,
    stage: "Прогимназия",
    subjects: [
      {
        subjectId: "mathematics",
        label: "Математика",
        topics: [
          { topicId: "decimal-fractions", label: "Десетични дроби", grades: [6], difficulty: "advanced" },
          { topicId: "common-fractions", label: "Обикновени дроби", grades: [6], difficulty: "advanced" },
          { topicId: "percentage-5grade", label: "Проценти", grades: [6], difficulty: "advanced" },
          { topicId: "algebra-basics", label: "Алгебра - основи", grades: [6], difficulty: "advanced" },
          { topicId: "geometric-figures", label: "Геометрични фигури", grades: [6], difficulty: "advanced" },
          { topicId: "word-problems-5grade", label: "Текстови задачи", grades: [6], difficulty: "advanced" },
        ],
      },
      {
        subjectId: "bulgarian-language",
        label: "Български език и литература",
        topics: [
          { topicId: "reading", label: "Четене и анализ", grades: [6], difficulty: "advanced" },
          { topicId: "writing", label: "Писане", grades: [6], difficulty: "advanced" },
          { topicId: "grammar", label: "Граматика", grades: [6], difficulty: "advanced" },
        ],
      },
    ],
  },
  7: {
    grade: 7,
    stage: "Прогимназия",
    subjects: [
      {
        subjectId: "mathematics",
        label: "Математика",
        topics: [
          { topicId: "decimal-fractions", label: "Десетични дроби", grades: [7], difficulty: "advanced" },
          { topicId: "fractions-adv", label: "Операции с дроби", grades: [7], difficulty: "advanced" },
          { topicId: "percentage-5grade", label: "Проценти и интерес", grades: [7], difficulty: "advanced" },
          { topicId: "algebra-basics", label: "Алгебра", grades: [7], difficulty: "advanced" },
          { topicId: "geometric-figures", label: "Геометрия", grades: [7], difficulty: "advanced" },
          { topicId: "word-problems-5grade", label: "Текстови задачи", grades: [7], difficulty: "advanced" },
        ],
      },
      {
        subjectId: "bulgarian-language",
        label: "Български език и литература",
        topics: [
          { topicId: "reading", label: "Четене и критика", grades: [7], difficulty: "advanced" },
          { topicId: "writing", label: "Писане и съчинения", grades: [7], difficulty: "advanced" },
          { topicId: "grammar", label: "Синтаксис", grades: [7], difficulty: "advanced" },
        ],
      },
    ],
  },
};

/**
 * PHASE 3: TASK TEMPLATE STRUCTURES
 * (Defined but not yet implemented)
 */

export interface TaskTemplate {
  templateType: "arithmetic" | "word-problem" | "reading" | "grammar" | "free-response";
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
}

export const taskTemplates: Record<string, TaskTemplate> = {
  "arithmetic-solved": {
    templateType: "arithmetic",
    difficulty: "beginner",
    description: "Solved example with step-by-step explanation",
  },
  "arithmetic-guided": {
    templateType: "arithmetic",
    difficulty: "intermediate",
    description: "Guided practice with hints and feedback",
  },
  "arithmetic-independent": {
    templateType: "arithmetic",
    difficulty: "advanced",
    description: "Independent task with minimal guidance",
  },
  "word-problem-narrative": {
    templateType: "word-problem",
    difficulty: "intermediate",
    description: "Word problem with operation detection and narrative explanation",
  },
  "reading-comprehension": {
    templateType: "reading",
    difficulty: "intermediate",
    description: "Reading text with comprehension questions",
  },
};

/**
 * PHASE 4: GENERATION RULES
 * (Simple rules to ensure grade-appropriate content)
 */

export interface GenerationRules {
  grade: Grade;
  allowedDifficulties: ("beginner" | "intermediate" | "advanced")[];
  maxNumberValue: number;
  allowDecimals: boolean;
  allowFractions: boolean;
}

export const generationRules: Record<Grade, GenerationRules> = {
  1: {
    grade: 1,
    allowedDifficulties: ["beginner"],
    maxNumberValue: 10,
    allowDecimals: false,
    allowFractions: false,
  },
  2: {
    grade: 2,
    allowedDifficulties: ["beginner", "intermediate"],
    maxNumberValue: 100,
    allowDecimals: false,
    allowFractions: false,
  },
  3: {
    grade: 3,
    allowedDifficulties: ["beginner", "intermediate", "advanced"],
    maxNumberValue: 100,
    allowDecimals: false,
    allowFractions: true,
  },
  4: {
    grade: 4,
    allowedDifficulties: ["intermediate", "advanced"],
    maxNumberValue: 1000,
    allowDecimals: false,
    allowFractions: true,
  },
  5: {
    grade: 5,
    allowedDifficulties: ["beginner", "intermediate", "advanced"],
    maxNumberValue: 10000,
    allowDecimals: true,
    allowFractions: true,
  },
  6: {
    grade: 6,
    allowedDifficulties: ["intermediate", "advanced"],
    maxNumberValue: 100000,
    allowDecimals: true,
    allowFractions: true,
  },
  7: {
    grade: 7,
    allowedDifficulties: ["advanced"],
    maxNumberValue: 1000000,
    allowDecimals: true,
    allowFractions: true,
  },
};

/**
 * PHASE 5: REFERENCE IMPLEMENTATION
 * Currently targets: 2 клас математика + 5 клас математика
 * 
 * Future expansion will use this map to organize other grades/subjects
 */

export const referenceImplementationGrades: Grade[] = [2, 5];
