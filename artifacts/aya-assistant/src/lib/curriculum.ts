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

export interface EducationStage {
  id: "stage1" | "stage2";
  label: Record<LangCode, string>;
  grades: number[];
  subjects: Subject[];
}

export const STAGE_1: EducationStage = {
  id: "stage1",
  label: { en: "Elementary Stage", bg: "Начален етап", es: "Etapa Elemental", de: "Grundschule", fr: "Étape Élémentaire" },
  grades: [1, 2, 3, 4],
  subjects: elementarySubjects.filter(s => ["mathematics", "bulgarian-language", "reading-literature"].includes(s.id)),
};

export const lowerSecondarySubjects: Subject[] = [
  {
    id: "mathematics-advanced",
    label: { en: "Mathematics", bg: "Математика", es: "Matemáticas", de: "Mathematik", fr: "Mathématiques" },
    emoji: "🔢",
    colorClass: "text-orange-600",
    bgClass: "bg-gradient-to-br from-orange-50 to-yellow-50",
    borderClass: "border-orange-200",
    topics: [
      { id: "algebra-basics",   label: { en: "Algebra basics",     bg: "Алгебра",              es: "Álgebra básica",       de: "Algebra-Grundlagen", fr: "Algèbre de base" } },
      { id: "equations",        label: { en: "Equations",          bg: "Уравнения",            es: "Ecuaciones",           de: "Gleichungen",         fr: "Équations" } },
      { id: "geometry-adv",     label: { en: "Geometry",           bg: "Геометрия",            es: "Geometría",            de: "Geometrie",           fr: "Géométrie" } },
      { id: "fractions-adv",    label: { en: "Fractions & ratios", bg: "Дроби и пропорции",    es: "Fracciones y razones", de: "Brüche und Verhältnisse", fr: "Fractions et ratios" } },
      { id: "percentage",       label: { en: "Percentages",        bg: "Проценти",             es: "Porcentajes",          de: "Prozentsätze",        fr: "Pourcentages" } },
      { id: "statistics",       label: { en: "Statistics",         bg: "Статистика",           es: "Estadística",          de: "Statistik",           fr: "Statistiques" } },
      { id: "word-problems-adv",label: { en: "Word problems",      bg: "Текстови задачи",      es: "Problemas",            de: "Textaufgaben",        fr: "Problèmes" } },
    ],
  },
  {
    id: "bulgarian-language-adv",
    label: { en: "Bulgarian Language", bg: "Български език", es: "Lengua bulgara", de: "Bulgarische Sprache", fr: "Langue bulgare" },
    emoji: "📝",
    colorClass: "text-blue-600",
    bgClass: "bg-gradient-to-br from-blue-50 to-sky-50",
    borderClass: "border-blue-200",
    topics: [
      { id: "morphology",       label: { en: "Morphology",         bg: "Морфология",           es: "Morfología",           de: "Morphologie",         fr: "Morphologie" } },
      { id: "syntax",           label: { en: "Syntax",             bg: "Синтаксис",            es: "Sintaxis",             de: "Syntax",              fr: "Syntaxe" } },
      { id: "stylistics",       label: { en: "Stylistics",         bg: "Стилистика",           es: "Estilística",          de: "Stilistik",           fr: "Stylistique" } },
      { id: "essay-writing",    label: { en: "Essay writing",      bg: "Съчинение",            es: "Redacción",            de: "Aufsatz",             fr: "Rédaction" } },
      { id: "punctuation-adv",  label: { en: "Punctuation",        bg: "Пунктуация",           es: "Puntuación",           de: "Zeichensetzung",      fr: "Ponctuation" } },
      { id: "word-forms",       label: { en: "Word forms",         bg: "Словообразуване",      es: "Formación de palabras", de: "Wortbildung",        fr: "Formation des mots" } },
    ],
  },
  {
    id: "literature",
    label: { en: "Literature", bg: "Литература", es: "Literatura", de: "Literatur", fr: "Littérature" },
    emoji: "📚",
    colorClass: "text-green-600",
    bgClass: "bg-gradient-to-br from-green-50 to-emerald-50",
    borderClass: "border-green-200",
    topics: [
      { id: "prose-analysis",   label: { en: "Prose analysis",     bg: "Анализ на проза",      es: "Análisis de prosa",    de: "Prosaanalyse",        fr: "Analyse de prose" } },
      { id: "poetry-analysis",  label: { en: "Poetry analysis",    bg: "Анализ на поезия",     es: "Análisis de poesía",   de: "Gedichtanalyse",      fr: "Analyse de poésie" } },
      { id: "bulgarian-authors",label: { en: "Bulgarian authors",  bg: "Български автори",     es: "Autores búlgaros",     de: "Bulgarische Autoren", fr: "Auteurs bulgares" } },
      { id: "literary-terms",   label: { en: "Literary terms",     bg: "Литературни понятия",  es: "Términos literarios",  de: "Literarische Begriffe", fr: "Termes littéraires" } },
      { id: "comprehension-adv",label: { en: "Text comprehension", bg: "Разбиране на текст",   es: "Comprensión lectora",  de: "Textverständnis",     fr: "Compréhension" } },
    ],
  },
  {
    id: "history",
    label: { en: "History", bg: "История", es: "Historia", de: "Geschichte", fr: "Histoire" },
    emoji: "🏛️",
    colorClass: "text-amber-600",
    bgClass: "bg-gradient-to-br from-amber-50 to-yellow-50",
    borderClass: "border-amber-200",
    topics: [
      { id: "ancient-history",  label: { en: "Ancient civilizations", bg: "Древни цивилизации", es: "Civilizaciones antiguas", de: "Alte Zivilisationen", fr: "Civilisations anciennes" } },
      { id: "middle-ages",      label: { en: "Middle Ages",        bg: "Средновековие",        es: "Edad Media",           de: "Mittelalter",         fr: "Moyen Âge" } },
      { id: "bulgarian-history",label: { en: "Bulgarian history",  bg: "История на България",  es: "Historia de Bulgaria", de: "Bulgarische Geschichte", fr: "Histoire bulgare" } },
      { id: "modern-history",   label: { en: "Modern history",     bg: "Нова история",         es: "Historia moderna",     de: "Moderne Geschichte",  fr: "Histoire moderne" } },
    ],
  },
  {
    id: "geography",
    label: { en: "Geography", bg: "География", es: "Geografía", de: "Geografie", fr: "Géographie" },
    emoji: "🌍",
    colorClass: "text-teal-600",
    bgClass: "bg-gradient-to-br from-teal-50 to-cyan-50",
    borderClass: "border-teal-200",
    topics: [
      { id: "physical-geography", label: { en: "Physical geography", bg: "Физическа география", es: "Geografía física", de: "Physische Geografie", fr: "Géographie physique" } },
      { id: "continents",        label: { en: "Continents & oceans", bg: "Континенти и океани",  es: "Continentes y océanos", de: "Kontinente und Ozeane", fr: "Continents et océans" } },
      { id: "bulgaria-geography",label: { en: "Bulgaria",           bg: "България",             es: "Bulgaria",             de: "Bulgarien",           fr: "Bulgarie" } },
      { id: "climate",           label: { en: "Climate",            bg: "Климат",               es: "Clima",                de: "Klima",               fr: "Climat" } },
    ],
  },
  {
    id: "biology",
    label: { en: "Biology", bg: "Биология", es: "Biología", de: "Biologie", fr: "Biologie" },
    emoji: "🧬",
    colorClass: "text-lime-600",
    bgClass: "bg-gradient-to-br from-lime-50 to-green-50",
    borderClass: "border-lime-200",
    topics: [
      { id: "cells",             label: { en: "Cells",              bg: "Клетка",               es: "Células",              de: "Zellen",              fr: "Cellules" } },
      { id: "plants-bio",        label: { en: "Plants",             bg: "Растения",             es: "Plantas",              de: "Pflanzen",            fr: "Plantes" } },
      { id: "animals-bio",       label: { en: "Animals",            bg: "Животни",              es: "Animales",             de: "Tiere",               fr: "Animaux" } },
      { id: "human-body",        label: { en: "Human body",         bg: "Човешко тяло",         es: "Cuerpo humano",        de: "Menschlicher Körper", fr: "Corps humain" } },
      { id: "ecosystems",        label: { en: "Ecosystems",         bg: "Екосистеми",           es: "Ecosistemas",          de: "Ökosysteme",          fr: "Écosystèmes" } },
    ],
  },
  {
    id: "physics",
    label: { en: "Physics", bg: "Физика", es: "Física", de: "Physik", fr: "Physique" },
    emoji: "⚡",
    colorClass: "text-violet-600",
    bgClass: "bg-gradient-to-br from-violet-50 to-purple-50",
    borderClass: "border-violet-200",
    topics: [
      { id: "mechanics",         label: { en: "Mechanics",          bg: "Механика",             es: "Mecánica",             de: "Mechanik",            fr: "Mécanique" } },
      { id: "electricity",       label: { en: "Electricity",        bg: "Електричество",        es: "Electricidad",         de: "Elektrizität",        fr: "Électricité" } },
      { id: "light-optics",      label: { en: "Light & Optics",     bg: "Светлина и оптика",    es: "Luz y óptica",         de: "Licht und Optik",     fr: "Lumière et optique" } },
      { id: "thermodynamics",    label: { en: "Thermodynamics",     bg: "Термодинамика",        es: "Termodinámica",        de: "Thermodynamik",       fr: "Thermodynamique" } },
    ],
  },
  {
    id: "chemistry",
    label: { en: "Chemistry", bg: "Химия", es: "Química", de: "Chemie", fr: "Chimie" },
    emoji: "⚗️",
    colorClass: "text-pink-600",
    bgClass: "bg-gradient-to-br from-pink-50 to-rose-50",
    borderClass: "border-pink-200",
    topics: [
      { id: "atoms-molecules",   label: { en: "Atoms & molecules",  bg: "Атоми и молекули",     es: "Átomos y moléculas",   de: "Atome und Moleküle",  fr: "Atomes et molécules" } },
      { id: "elements",          label: { en: "Elements",           bg: "Химични елементи",     es: "Elementos",            de: "Elemente",            fr: "Éléments" } },
      { id: "reactions",         label: { en: "Chemical reactions", bg: "Химични реакции",      es: "Reacciones químicas",  de: "Chemische Reaktionen", fr: "Réactions chimiques" } },
      { id: "mixtures",          label: { en: "Mixtures & solutions",bg: "Смеси и разтвори",    es: "Mezclas y soluciones", de: "Gemische und Lösungen", fr: "Mélanges et solutions" } },
    ],
  },
  {
    id: "english-advanced",
    label: { en: "English", bg: "Английски език", es: "Inglés", de: "Englisch", fr: "Anglais" },
    emoji: "🇬🇧",
    colorClass: "text-rose-600",
    bgClass: "bg-gradient-to-br from-rose-50 to-pink-50",
    borderClass: "border-rose-200",
    topics: [
      { id: "grammar-eng",       label: { en: "Grammar",            bg: "Граматика",            es: "Gramática",            de: "Grammatik",           fr: "Grammaire" } },
      { id: "reading-eng",       label: { en: "Reading",            bg: "Четене",               es: "Lectura",              de: "Lesen",               fr: "Lecture" } },
      { id: "writing-eng",       label: { en: "Writing",            bg: "Писане",               es: "Escritura",            de: "Schreiben",           fr: "Écriture" } },
      { id: "vocabulary-adv",    label: { en: "Vocabulary",         bg: "Речник",               es: "Vocabulario",          de: "Wortschatz",          fr: "Vocabulaire" } },
    ],
  },
];

export const STAGE_2: EducationStage = {
  id: "stage2",
  label: { en: "Lower Secondary Stage", bg: "Прогимназия", es: "Etapa Secundaria", de: "Sekundarstufe", fr: "Étape Secondaire" },
  grades: [5, 6, 7],
  subjects: lowerSecondarySubjects,
};

export const EDUCATION_STAGES: EducationStage[] = [STAGE_1, STAGE_2];

export const SUBJECT_ACTIONS_LABELS: Record<LangCode, { lessons: string; practice: string; quiz: string; story: string; askAya: string; comingSoon: string; chooseTopic: string; backToSubjects: string; noTopicNeeded: string }> = {
  en: { lessons: "Lessons", practice: "Practice", quiz: "Quiz", story: "Story", askAya: "Ask AYA", comingSoon: "Coming Soon", chooseTopic: "Choose a topic", backToSubjects: "← All subjects", noTopicNeeded: "Chat about any topic" },
  bg: { lessons: "Уроци", practice: "Упражнения", quiz: "Тест", story: "История", askAya: "Питай AYA", comingSoon: "Скоро", chooseTopic: "Избери тема", backToSubjects: "← Всички предмети", noTopicNeeded: "Разговор без тема" },
  es: { lessons: "Lecciones", practice: "Práctica", quiz: "Test", story: "Historia", askAya: "Preguntar AYA", comingSoon: "Próximamente", chooseTopic: "Elige un tema", backToSubjects: "← Todos los temas", noTopicNeeded: "Conversar sin tema" },
  de: { lessons: "Lektionen", practice: "Übung", quiz: "Quiz", story: "Geschichte", askAya: "Frage AYA", comingSoon: "Kommt bald", chooseTopic: "Wähle ein Thema", backToSubjects: "← Alle Fächer", noTopicNeeded: "Über jedes Thema sprechen" },
  fr: { lessons: "Leçons", practice: "Pratique", quiz: "Quiz", story: "Histoire", askAya: "Demande à AYA", comingSoon: "Bientôt", chooseTopic: "Choisis un sujet", backToSubjects: "← Tous les sujets", noTopicNeeded: "Parler de n'importe quel sujet" },
};
