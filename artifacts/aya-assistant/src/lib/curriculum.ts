import type { LangCode } from "./i18n";

export interface Topic {
  id: string;
  label: Record<LangCode, string>;
}

export interface Subject {
  id: string;
  label: Record<LangCode, string>;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  topics: Topic[];
}

export const elementarySubjects: Subject[] = [
  {
    id: "mathematics",
    label: { en: "Mathematics", bg: "Математика", es: "Matemáticas" },
    emoji: "🔢",
    colorClass: "text-orange-600",
    bgClass: "bg-gradient-to-br from-orange-50 to-yellow-50",
    borderClass: "border-orange-200",
    topics: [
      { id: "addition",       label: { en: "Addition",       bg: "Събиране",          es: "Suma" } },
      { id: "subtraction",    label: { en: "Subtraction",    bg: "Изваждане",         es: "Resta" } },
      { id: "multiplication", label: { en: "Multiplication", bg: "Умножение",         es: "Multiplicación" } },
      { id: "division",       label: { en: "Division",       bg: "Деление",           es: "División" } },
      { id: "word-problems",  label: { en: "Word problems",  bg: "Текстови задачи",   es: "Problemas escritos" } },
    ],
  },
  {
    id: "bulgarian-language",
    label: { en: "Bulgarian Language", bg: "Български език", es: "Lengua" },
    emoji: "📝",
    colorClass: "text-blue-600",
    bgClass: "bg-gradient-to-br from-blue-50 to-sky-50",
    borderClass: "border-blue-200",
    topics: [
      { id: "alphabet", label: { en: "Alphabet",       bg: "Азбука",              es: "Alfabeto" } },
      { id: "reading",  label: { en: "Reading",         bg: "Четене",              es: "Lectura" } },
      { id: "writing",  label: { en: "Writing",         bg: "Писане",              es: "Escritura" } },
      { id: "grammar",  label: { en: "Grammar basics",  bg: "Основна граматика",   es: "Gramática básica" } },
    ],
  },
  {
    id: "reading-literature",
    label: { en: "Reading", bg: "Четене", es: "Lectura" },
    emoji: "📚",
    colorClass: "text-green-600",
    bgClass: "bg-gradient-to-br from-green-50 to-emerald-50",
    borderClass: "border-green-200",
    topics: [
      { id: "stories",        label: { en: "Stories",              bg: "Разкази",              es: "Cuentos" } },
      { id: "comprehension",  label: { en: "Reading comprehension", bg: "Разбиране на текст",   es: "Comprensión lectora" } },
    ],
  },
  {
    id: "logic-thinking",
    label: { en: "Logic", bg: "Логика", es: "Lógica" },
    emoji: "🧩",
    colorClass: "text-purple-600",
    bgClass: "bg-gradient-to-br from-purple-50 to-violet-50",
    borderClass: "border-purple-200",
    topics: [
      { id: "patterns", label: { en: "Patterns", bg: "Закономерности", es: "Patrones" } },
      { id: "puzzles",  label: { en: "Puzzles",  bg: "Пъзели",         es: "Puzles" } },
    ],
  },
  {
    id: "nature-science",
    label: { en: "Nature", bg: "Околен свят", es: "Ciencias" },
    emoji: "🌿",
    colorClass: "text-teal-600",
    bgClass: "bg-gradient-to-br from-teal-50 to-cyan-50",
    borderClass: "border-teal-200",
    topics: [
      { id: "plants",  label: { en: "Plants",  bg: "Растения", es: "Plantas" } },
      { id: "animals", label: { en: "Animals", bg: "Животни",  es: "Animales" } },
      { id: "earth",   label: { en: "Earth",   bg: "Земята",   es: "La Tierra" } },
    ],
  },
  {
    id: "english-language",
    label: { en: "English", bg: "Английски език", es: "Inglés" },
    emoji: "🇬🇧",
    colorClass: "text-rose-600",
    bgClass: "bg-gradient-to-br from-rose-50 to-pink-50",
    borderClass: "border-rose-200",
    topics: [
      { id: "vocabulary",       label: { en: "Vocabulary",       bg: "Речников запас",  es: "Vocabulario" } },
      { id: "simple-sentences", label: { en: "Simple sentences", bg: "Прости изречения", es: "Oraciones simples" } },
    ],
  },
];

export const SUBJECT_ACTIONS_LABELS: Record<LangCode, { lessons: string; practice: string; quiz: string; askAya: string; comingSoon: string; chooseTopic: string; backToSubjects: string; noTopicNeeded: string }> = {
  en: { lessons: "Lessons", practice: "Practice", quiz: "Quiz", askAya: "Ask AYA", comingSoon: "Coming Soon", chooseTopic: "Choose a topic", backToSubjects: "← All subjects", noTopicNeeded: "Chat about any topic" },
  bg: { lessons: "Уроци", practice: "Упражнения", quiz: "Тест", askAya: "Питай AYA", comingSoon: "Скоро", chooseTopic: "Избери тема", backToSubjects: "← Всички предмети", noTopicNeeded: "Разговор без тема" },
  es: { lessons: "Lecciones", practice: "Práctica", quiz: "Test", askAya: "Preguntar AYA", comingSoon: "Próximamente", chooseTopic: "Elige un tema", backToSubjects: "← Todos los temas", noTopicNeeded: "Conversar sin tema" },
};
