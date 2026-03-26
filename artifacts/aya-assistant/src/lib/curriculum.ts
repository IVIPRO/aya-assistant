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
    label: { en: "Mathematics", bg: "Математика", es: "Matemáticas", de: "Mathematik", fr: "Mathématiques" },
    emoji: "🔢",
    colorClass: "text-orange-600",
    bgClass: "bg-gradient-to-br from-orange-50 to-yellow-50",
    borderClass: "border-orange-200",
    topics: [
      { id: "addition",       label: { en: "Addition",       bg: "Събиране",          es: "Suma",              de: "Addition",         fr: "Addition" } },
      { id: "subtraction",    label: { en: "Subtraction",    bg: "Изваждане",         es: "Resta",             de: "Subtraktion",      fr: "Soustraction" } },
      { id: "multiplication", label: { en: "Multiplication", bg: "Умножение",         es: "Multiplicación",    de: "Multiplikation",   fr: "Multiplication" } },
      { id: "division",       label: { en: "Division",       bg: "Деление",           es: "División",          de: "Division",         fr: "Division" } },
      { id: "word-problems",  label: { en: "Word problems",  bg: "Текстови задачи",   es: "Problemas escritos", de: "Textaufgaben",    fr: "Problèmes écrits" } },
      { id: "fractions",      label: { en: "Fractions",      bg: "Дроби",             es: "Fracciones",         de: "Brüche",           fr: "Fractions" } },
      { id: "geometry",       label: { en: "Geometry",       bg: "Геометрия",         es: "Geometría",          de: "Geometrie",        fr: "Géométrie" } },
      { id: "measurement",    label: { en: "Measurement",    bg: "Мерене",            es: "Medición",           de: "Messen",           fr: "Mesure" } },
    ],
  },
  {
    id: "bulgarian-language",
    label: { en: "Bulgarian Language", bg: "Български език", es: "Lengua", de: "Bulgarische Sprache", fr: "Langue bulgare" },
    emoji: "📝",
    colorClass: "text-blue-600",
    bgClass: "bg-gradient-to-br from-blue-50 to-sky-50",
    borderClass: "border-blue-200",
    topics: [
      { id: "alphabet",    label: { en: "Alphabet",       bg: "Азбука",              es: "Alfabeto",         de: "Alphabet",           fr: "Alphabet" } },
      { id: "reading",     label: { en: "Reading",         bg: "Четене",              es: "Lectura",          de: "Lesen",              fr: "Lecture" } },
      { id: "writing",     label: { en: "Writing",         bg: "Писане",              es: "Escritura",        de: "Schreiben",          fr: "Écriture" } },
      { id: "grammar",     label: { en: "Grammar basics",  bg: "Основна граматика",   es: "Gramática básica", de: "Grundgrammatik",     fr: "Grammaire de base" } },
      { id: "spelling",    label: { en: "Spelling",        bg: "Правопис",            es: "Ortografía",       de: "Rechtschreibung",    fr: "Orthographe" } },
      { id: "word-study",  label: { en: "Word Study",       bg: "Речников запас",      es: "Estudio de palabras", de: "Wortschatz",        fr: "Étude du vocabulaire" } },
      { id: "punctuation", label: { en: "Punctuation",     bg: "Пунктуация",          es: "Puntuación",       de: "Zeichensetzung",     fr: "Ponctuation" } },
      { id: "nouns-verbs", label: { en: "Nouns & Verbs",   bg: "Съществителни и глаголи", es: "Nombres y verbos", de: "Nomen & Verben",  fr: "Noms et verbes" } },
    ],
  },
  {
    id: "reading-literature",
    label: { en: "Reading", bg: "Четене", es: "Lectura", de: "Lesen", fr: "Lecture" },
    emoji: "📚",
    colorClass: "text-green-600",
    bgClass: "bg-gradient-to-br from-green-50 to-emerald-50",
    borderClass: "border-green-200",
    topics: [
      { id: "stories",        label: { en: "Stories",              bg: "Разкази",              es: "Cuentos",              de: "Geschichten",       fr: "Histoires" } },
      { id: "comprehension",  label: { en: "Reading comprehension", bg: "Разбиране на текст",   es: "Comprensión lectora", de: "Leseverständnis",   fr: "Compréhension" } },
      { id: "poetry",         label: { en: "Poetry",               bg: "Поезия",               es: "Poesía",               de: "Gedichte",          fr: "Poésie" } },
      { id: "main-idea",      label: { en: "Main idea",            bg: "Основна идея",         es: "Idea principal",       de: "Hauptidee",         fr: "Idée principale" } },
      { id: "characters",     label: { en: "Characters",           bg: "Герои",                es: "Personajes",           de: "Charaktere",        fr: "Personnages" } },
      { id: "retelling",      label: { en: "Retelling",            bg: "Преразказ",            es: "Resumen oral",         de: "Nacherzählen",      fr: "Résumé oral" } },
    ],
  },
  {
    id: "logic-thinking",
    label: { en: "Logic", bg: "Логика", es: "Lógica", de: "Logik", fr: "Logique" },
    emoji: "🧩",
    colorClass: "text-purple-600",
    bgClass: "bg-gradient-to-br from-purple-50 to-violet-50",
    borderClass: "border-purple-200",
    topics: [
      { id: "patterns", label: { en: "Patterns", bg: "Закономерности", es: "Patrones", de: "Muster", fr: "Motifs" } },
      { id: "puzzles",  label: { en: "Puzzles",  bg: "Пъзели",         es: "Puzles",   de: "Rätsel", fr: "Énigmes" } },
    ],
  },
  {
    id: "nature-science",
    label: { en: "Nature", bg: "Околен свят", es: "Ciencias", de: "Naturwissenschaften", fr: "Sciences naturelles" },
    emoji: "🌿",
    colorClass: "text-teal-600",
    bgClass: "bg-gradient-to-br from-teal-50 to-cyan-50",
    borderClass: "border-teal-200",
    topics: [
      { id: "plants",  label: { en: "Plants",  bg: "Растения", es: "Plantas", de: "Pflanzen", fr: "Plantes" } },
      { id: "animals", label: { en: "Animals", bg: "Животни",  es: "Animales", de: "Tiere", fr: "Animaux" } },
      { id: "earth",   label: { en: "Earth",   bg: "Земята",   es: "La Tierra", de: "Erde", fr: "Terre" } },
    ],
  },
  {
    id: "english-language",
    label: { en: "English", bg: "Английски език", es: "Inglés", de: "Englisch", fr: "Anglais" },
    emoji: "🇬🇧",
    colorClass: "text-rose-600",
    bgClass: "bg-gradient-to-br from-rose-50 to-pink-50",
    borderClass: "border-rose-200",
    topics: [
      { id: "vocabulary",       label: { en: "Vocabulary",       bg: "Речников запас",  es: "Vocabulario",      de: "Wortschatz",       fr: "Vocabulaire" } },
      { id: "simple-sentences", label: { en: "Simple sentences", bg: "Прости изречения", es: "Oraciones simples", de: "Einfache Sätze",   fr: "Phrases simples" } },
    ],
  },
];

export const SUBJECT_ACTIONS_LABELS: Record<LangCode, { lessons: string; practice: string; quiz: string; askAya: string; comingSoon: string; chooseTopic: string; backToSubjects: string; noTopicNeeded: string }> = {
  en: { lessons: "Lessons", practice: "Practice", quiz: "Quiz", askAya: "Ask AYA", comingSoon: "Coming Soon", chooseTopic: "Choose a topic", backToSubjects: "← All subjects", noTopicNeeded: "Chat about any topic" },
  bg: { lessons: "Уроци", practice: "Упражнения", quiz: "Тест", askAya: "Питай AYA", comingSoon: "Скоро", chooseTopic: "Избери тема", backToSubjects: "← Всички предмети", noTopicNeeded: "Разговор без тема" },
  es: { lessons: "Lecciones", practice: "Práctica", quiz: "Test", askAya: "Preguntar AYA", comingSoon: "Próximamente", chooseTopic: "Elige un tema", backToSubjects: "← Todos los temas", noTopicNeeded: "Conversar sin tema" },
  de: { lessons: "Lektionen", practice: "Übung", quiz: "Quiz", askAya: "Frage AYA", comingSoon: "Kommt bald", chooseTopic: "Wähle ein Thema", backToSubjects: "← Alle Fächer", noTopicNeeded: "Über jedes Thema sprechen" },
  fr: { lessons: "Leçons", practice: "Pratique", quiz: "Quiz", askAya: "Demande à AYA", comingSoon: "Bientôt", chooseTopic: "Choisis un sujet", backToSubjects: "← Tous les sujets", noTopicNeeded: "Parler de n'importe quel sujet" },
};
