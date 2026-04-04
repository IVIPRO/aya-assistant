import type { LangCode } from "./i18n";

export interface Topic {
  id: string;
  label: Record<LangCode, string>;
  grades?: number[];
}

export interface Subject {
  id: string;
  label: Record<LangCode, string>;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  topics: Topic[];
  /** If set, only show this subject for the listed grades */
  grades?: number[];
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
      { id: "addition",       label: { en: "Addition",       bg: "Събиране",          es: "Suma",              de: "Addition",         fr: "Addition" }, grades: [1, 2, 3, 4] },
      { id: "subtraction",    label: { en: "Subtraction",    bg: "Изваждане",         es: "Resta",             de: "Subtraktion",      fr: "Soustraction" }, grades: [1, 2, 3, 4] },
      { id: "multiplication", label: { en: "Multiplication", bg: "Умножение",         es: "Multiplicación",    de: "Multiplikation",   fr: "Multiplication" }, grades: [2, 3, 4] },
      { id: "division",       label: { en: "Division",       bg: "Деление",           es: "División",          de: "Division",         fr: "Division" }, grades: [1, 2, 3, 4] },
      { id: "word-problems",  label: { en: "Word problems",  bg: "Текстови задачи",   es: "Problemas escritos", de: "Textaufgaben",    fr: "Problèmes écrits" }, grades: [2, 3, 4] },
      { id: "fractions",      label: { en: "Fractions",      bg: "Дроби",             es: "Fracciones",         de: "Brüche",           fr: "Fractions" }, grades: [3, 4] },
      { id: "geometry",       label: { en: "Geometry",       bg: "Геометрични фигури", es: "Geometría",          de: "Geometrie",        fr: "Géométrie" }, grades: [1, 2, 3, 4] },
      { id: "measurement",    label: { en: "Measurement",    bg: "Мерене",            es: "Medición",           de: "Messen",           fr: "Mesure" }, grades: [2, 3, 4] },
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
      { id: "writing",     label: { en: "Writing",         bg: "Пишем изречения",     es: "Escritura",        de: "Schreiben",          fr: "Écriture" } },
      { id: "grammar",     label: { en: "Grammar basics",  bg: "Основна граматика",   es: "Gramática básica", de: "Grundgrammatik",     fr: "Grammaire de base" } },
      { id: "spelling",    label: { en: "Spelling",        bg: "Правопис",            es: "Ortografía",       de: "Rechtschreibung",    fr: "Orthographe" } },
      { id: "word-study",  label: { en: "Word Study",       bg: "Речников запас",      es: "Estudio de palabras", de: "Wortschatz",        fr: "Étude du vocabulaire" } },
      { id: "punctuation", label: { en: "Punctuation",     bg: "Пунктуация",          es: "Puntuación",       de: "Zeichensetzung",     fr: "Ponctuation" } },
      { id: "nouns-verbs", label: { en: "Nouns & Verbs",   bg: "Съществителни и глаголи", es: "Nombres y verbos", de: "Nomen & Verben",  fr: "Noms et verbes" } },
    ],
  },
  {
    id: "reading-literature",
    label: { en: "Reading", bg: "Четене и литература", es: "Lectura", de: "Lesen", fr: "Lecture" },
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
    label: { en: "Logic & Thinking", bg: "Логика и мислене", es: "Lógica", de: "Logik", fr: "Logique" },
    emoji: "🧩",
    colorClass: "text-purple-600",
    bgClass: "bg-gradient-to-br from-purple-50 to-violet-50",
    borderClass: "border-purple-200",
    topics: [
      { id: "patterns",    label: { en: "Patterns",    bg: "Закономерности", es: "Patrones",    de: "Muster",      fr: "Motifs" } },
      { id: "puzzles",     label: { en: "Puzzles",     bg: "Пъзели",         es: "Puzles",      de: "Rätsel",      fr: "Énigmes" } },
      { id: "comparison",  label: { en: "Comparing",   bg: "Сравняване",     es: "Comparar",    de: "Vergleichen", fr: "Comparer" } },
      { id: "sequencing",  label: { en: "Sequencing",  bg: "Наредба",        es: "Ordenar",     de: "Reihenfolge", fr: "Ordre" } },
    ],
  },
  {
    id: "nature-science",
    label: { en: "Our World", bg: "Околен свят", es: "El mundo", de: "Unsere Welt", fr: "Notre monde" },
    emoji: "🌿",
    colorClass: "text-teal-600",
    bgClass: "bg-gradient-to-br from-teal-50 to-cyan-50",
    borderClass: "border-teal-200",
    grades: [1, 2],
    topics: [
      { id: "plants",   label: { en: "Plants",   bg: "Растения",   es: "Plantas",   de: "Pflanzen", fr: "Plantes" } },
      { id: "animals",  label: { en: "Animals",  bg: "Животни",    es: "Animales",  de: "Tiere",    fr: "Animaux" } },
      { id: "earth",    label: { en: "Earth",    bg: "Земята",     es: "La Tierra", de: "Erde",     fr: "Terre" } },
      { id: "seasons",  label: { en: "Seasons",  bg: "Сезони",     es: "Estaciones", de: "Jahreszeiten", fr: "Saisons" } },
      { id: "weather",  label: { en: "Weather",  bg: "Времето",    es: "El tiempo", de: "Wetter",   fr: "Météo" } },
    ],
  },
  {
    id: "social-studies",
    label: { en: "Society & Me", bg: "Човекът и обществото", es: "Sociedad", de: "Gesellschaft", fr: "Société" },
    emoji: "🏡",
    colorClass: "text-amber-600",
    bgClass: "bg-gradient-to-br from-amber-50 to-yellow-50",
    borderClass: "border-amber-200",
    grades: [3, 4],
    topics: [
      { id: "family-community",  label: { en: "Family & community",  bg: "Семейство и общество",  es: "Familia y comunidad",  de: "Familie und Gemeinschaft", fr: "Famille et communauté" } },
      { id: "my-homeland",       label: { en: "My homeland",         bg: "Роден край",            es: "Mi tierra natal",      de: "Heimat",                   fr: "Ma région natale" } },
      { id: "bulgaria",          label: { en: "Bulgaria",            bg: "България",              es: "Bulgaria",             de: "Bulgarien",                fr: "Bulgarie" } },
      { id: "rights-duties",     label: { en: "Rights & duties",     bg: "Права и задължения",    es: "Derechos y deberes",   de: "Rechte und Pflichten",     fr: "Droits et devoirs" } },
      { id: "traditions",        label: { en: "Traditions",          bg: "Празници и традиции",   es: "Tradiciones",          de: "Traditionen",              fr: "Traditions" } },
    ],
  },
  {
    id: "natural-science",
    label: { en: "Nature & Science", bg: "Човекът и природата", es: "Naturaleza", de: "Naturwissenschaft", fr: "Sciences" },
    emoji: "🔬",
    colorClass: "text-lime-600",
    bgClass: "bg-gradient-to-br from-lime-50 to-green-50",
    borderClass: "border-lime-200",
    grades: [3, 4],
    topics: [
      { id: "living-things",  label: { en: "Living things",  bg: "Живи организми",  es: "Seres vivos",    de: "Lebewesen",    fr: "Êtres vivants" } },
      { id: "materials",      label: { en: "Materials",      bg: "Материали",       es: "Materiales",     de: "Materialien",  fr: "Matériaux" } },
      { id: "light-sound",    label: { en: "Light & sound",  bg: "Светлина и звук", es: "Luz y sonido",   de: "Licht und Schall", fr: "Lumière et son" } },
      { id: "water-air",      label: { en: "Water & air",    bg: "Вода и въздух",   es: "Agua y aire",    de: "Wasser und Luft", fr: "Eau et air" } },
      { id: "human-body",     label: { en: "My body & health", bg: "Тяло и здраве", es: "Cuerpo y salud", de: "Körper und Gesundheit", fr: "Corps et santé" } },
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
      { id: "vocabulary",       label: { en: "Vocabulary",       bg: "Речник",          es: "Vocabulario",      de: "Wortschatz",       fr: "Vocabulaire" } },
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
  subjects: elementarySubjects,
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
      { id: "nat-num-review", label: { bg: "Преглед на натуралните числа", en: "Natural numbers review", es: "Repaso de números naturales", de: "Überblick natürliche Zahlen", fr: "Révision nombres naturels" } },
      { id: "addition-subtraction", label: { bg: "Събиране и изваждане", en: "Addition and subtraction", es: "Suma y resta", de: "Addition und Subtraktion", fr: "Addition et soustraction" } },
      { id: "multiplication-facts", label: { bg: "Таблица за умножение", en: "Multiplication facts", es: "Tablas de multiplicar", de: "Multiplikationstabelle", fr: "Tables de multiplication" } },
      { id: "division-basics", label: { bg: "Деление на естествени числа", en: "Division basics", es: "Divisiones básicas", de: "Divisions Grundlagen", fr: "Bases de la division" } },
      { id: "divisibility-rules", label: { bg: "Делимост на числата", en: "Divisibility rules", es: "Reglas de divisibilidad", de: "Teilbarkeitsregeln", fr: "Règles de divisibilité" } },
      { id: "factors-multiples", label: { bg: "Делители и кратни", en: "Factors and multiples", es: "Factores y múltiplos", de: "Faktoren und Vielfache", fr: "Facteurs et multiples" } },
      { id: "prime-numbers", label: { bg: "Прости числа", en: "Prime numbers", es: "Números primos", de: "Primzahlen", fr: "Nombres premiers" } },
      { id: "order-of-operations", label: { bg: "Редът на операциите", en: "Order of operations", es: "Orden de operaciones", de: "Reihenfolge der Operationen", fr: "Ordre des opérations" } },
      { id: "fractions-intro", label: { bg: "Въведение в дробите", en: "Fractions introduction", es: "Introducción a fracciones", de: "Einführung in Brüche", fr: "Introduction aux fractions" } },
      { id: "comparing-fractions", label: { bg: "Сравняване на дроби", en: "Comparing fractions", es: "Comparación de fracciones", de: "Brüche vergleichen", fr: "Comparer les fractions" } },
      { id: "fractions-addition", label: { bg: "Събиране на дроби", en: "Adding fractions", es: "Suma de fracciones", de: "Brüche addieren", fr: "Ajouter des fractions" } },
      { id: "fractions-subtraction", label: { bg: "Изваждане на дроби", en: "Subtracting fractions", es: "Resta de fracciones", de: "Brüche subtrahieren", fr: "Soustraire des fractions" } },
      { id: "mixed-numbers", label: { bg: "Смесени числа", en: "Mixed numbers", es: "Números mixtos", de: "Gemischte Zahlen", fr: "Nombres mixtes" } },
      { id: "decimals-intro", label: { bg: "Въведение в десетичните числа", en: "Decimals introduction", es: "Introducción a decimales", de: "Einführung in Dezimalzahlen", fr: "Introduction aux décimales" } },
      { id: "comparing-decimals", label: { bg: "Сравняване на десетични числа", en: "Comparing decimals", es: "Comparación de decimales", de: "Dezimalzahlen vergleichen", fr: "Comparer les décimales" } },
      { id: "decimals-addition", label: { bg: "Събиране на десетични числа", en: "Adding decimals", es: "Suma de decimales", de: "Dezimalzahlen addieren", fr: "Ajouter des décimales" } },
      { id: "decimals-subtraction", label: { bg: "Изваждане на десетични числа", en: "Subtracting decimals", es: "Resta de decimales", de: "Dezimalzahlen subtrahieren", fr: "Soustraire des décimales" } },
      { id: "decimals-multiplication", label: { bg: "Умножение на десетични числа", en: "Multiplying decimals", es: "Multiplicación de decimales", de: "Dezimalzahlen multiplizieren", fr: "Multiplier des décimales" } },
      { id: "decimals-division", label: { bg: "Деление на десетични числа", en: "Dividing decimals", es: "División de decimales", de: "Dezimalzahlen teilen", fr: "Diviser des décimales" } },
      { id: "fractions-decimals", label: { bg: "Преобразуване дроби-десетични", en: "Fractions and decimals", es: "Fracciones y decimales", de: "Brüche und Dezimalzahlen", fr: "Fractions et décimales" } },
      { id: "percentages-basic", label: { bg: "Проценти - основи", en: "Percentages basics", es: "Porcentajes básicos", de: "Prozentsätze Grundlagen", fr: "Bases des pourcentages" } },
      { id: "measurement-length", label: { bg: "Мерни единици - дължина", en: "Length measurement", es: "Medidas de longitud", de: "Längenmessung", fr: "Mesure de longueur" } },
      { id: "measurement-weight", label: { bg: "Мерни единици - маса", en: "Weight/Mass measurement", es: "Medidas de masa", de: "Gewichtsmessung", fr: "Mesure de masse" } },
      { id: "measurement-volume", label: { bg: "Мерни единици - обем", en: "Volume measurement", es: "Medidas de volumen", de: "Volumenmessung", fr: "Mesure de volume" } },
      { id: "area-perimeter", label: { bg: "Площ и периметър", en: "Area and perimeter", es: "Área y perímetro", de: "Fläche und Umfang", fr: "Aire et périmètre" } },
      { id: "angles-basics", label: { bg: "Ъгли - основи", en: "Angles basics", es: "Ángulos básicos", de: "Winkel Grundlagen", fr: "Bases des angles" } },
      { id: "triangles-types", label: { bg: "Видове триъгълници", en: "Types of triangles", es: "Tipos de triángulos", de: "Arten von Dreiecken", fr: "Types de triangles" } },
      { id: "quadrilaterals", label: { bg: "Четириъгълници", en: "Quadrilaterals", es: "Cuadriláteros", de: "Vierecke", fr: "Quadrilatères" } },
      { id: "circles-basics", label: { bg: "Окръжност - основи", en: "Circles basics", es: "Círculos básicos", de: "Kreis Grundlagen", fr: "Bases des cercles" } },
      { id: "polygons", label: { bg: "Многоъгълници", en: "Polygons", es: "Polígonos", de: "Polygone", fr: "Polygones" } },
      { id: "symmetry-basics", label: { bg: "Симетрия", en: "Symmetry", es: "Simetría", de: "Symmetrie", fr: "Symétrie" } },
      { id: "word-problems-5", label: { bg: "Текстови задачи", en: "Word problems", es: "Problemas textuales", de: "Textaufgaben", fr: "Problèmes" } },
      { id: "estimation-5", label: { bg: "Приблизни пресмятания", en: "Estimation", es: "Estimación", de: "Schätzung", fr: "Estimation" } },
      { id: "data-interpretation", label: { bg: "Интерпретация на данни", en: "Data interpretation", es: "Interpretación de datos", de: "Dateninterpretation", fr: "Interprétation des données" } },
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
      { id: "phonetics-review", label: { bg: "Фонетика - преглед", en: "Phonetics review", es: "Revisión de fonética", de: "Phonetik Überblick", fr: "Révision phonétique" } },
      { id: "word-stress", label: { bg: "Ударение в думите", en: "Word stress", es: "Acentuación", de: "Wortbetonung", fr: "Accentuation" } },
      { id: "alphabets-writing", label: { bg: "Правила на писане", en: "Writing rules", es: "Reglas de escritura", de: "Schreibregeln", fr: "Règles d'écriture" } },
      { id: "nouns-types", label: { bg: "Съществителни имена - видове", en: "Noun types", es: "Tipos de sustantivos", de: "Nomenarten", fr: "Types de noms" } },
      { id: "noun-gender", label: { bg: "Род на съществителното", en: "Noun gender", es: "Género del sustantivo", de: "Nomenstgeschlecht", fr: "Genre du nom" } },
      { id: "noun-number", label: { bg: "Число на съществителното", en: "Noun number", es: "Número singular/plural", de: "Numerus des Nomens", fr: "Nombre du nom" } },
      { id: "adjectives-types", label: { bg: "Прилагателни имена", en: "Adjectives", es: "Adjetivos", de: "Adjektive", fr: "Adjectifs" } },
      { id: "adjectives-comparison", label: { bg: "Сравнение на прилагателни", en: "Adjective comparison", es: "Comparación de adjetivos", de: "Adjektivkomparation", fr: "Comparaison d'adjectifs" } },
      { id: "verbs-infinitive", label: { bg: "Глаголи - инфинитив", en: "Verbs infinitive", es: "Verbos infinitivo", de: "Verben Infinitiv", fr: "Verbes infinitif" } },
      { id: "verbs-tense-present", label: { bg: "Сегашно време", en: "Present tense", es: "Tiempo presente", de: "Präsens", fr: "Temps présent" } },
      { id: "verbs-tense-past", label: { bg: "Минало време", en: "Past tense", es: "Tiempo pasado", de: "Vergangenheit", fr: "Temps passé" } },
      { id: "verbs-tense-future", label: { bg: "Бъдеще време", en: "Future tense", es: "Tiempo futuro", de: "Zukunft", fr: "Temps futur" } },
      { id: "pronouns-personal", label: { bg: "Лични местоимения", en: "Personal pronouns", es: "Pronombres personales", de: "Personalpronomen", fr: "Pronoms personnels" } },
      { id: "pronouns-possessive", label: { bg: "Притежателни местоимения", en: "Possessive pronouns", es: "Pronombres posesivos", de: "Possessivpronomen", fr: "Pronoms possessifs" } },
      { id: "prepositions", label: { bg: "Предлози", en: "Prepositions", es: "Preposiciones", de: "Präpositionen", fr: "Prépositions" } },
      { id: "conjunctions", label: { bg: "Съюзи", en: "Conjunctions", es: "Conjunciones", de: "Konjunktionen", fr: "Conjonctions" } },
      { id: "sentence-simple", label: { bg: "Просто изречение", en: "Simple sentence", es: "Oración simple", de: "Einfacher Satz", fr: "Phrase simple" } },
      { id: "sentence-subject-predicate", label: { bg: "Подлог и сказуемо", en: "Subject and predicate", es: "Sujeto y predicado", de: "Subjekt und Prädikat", fr: "Sujet et prédicat" } },
      { id: "direct-object", label: { bg: "Преко допълнение", en: "Direct object", es: "Complemento directo", de: "Direktes Objekt", fr: "Complément d'objet direct" } },
      { id: "indirect-object", label: { bg: "Непреко допълнение", en: "Indirect object", es: "Complemento indirecto", de: "Indirektes Objekt", fr: "Complément d'objet indirect" } },
      { id: "adverbials", label: { bg: "Обстоятелства", en: "Adverbials", es: "Circunstanciales", de: "Adverbialbestimmungen", fr: "Compléments circonstanciels" } },
      { id: "punctuation-period", label: { bg: "Точка", en: "Period", es: "Punto", de: "Punkt", fr: "Point" } },
      { id: "punctuation-comma", label: { bg: "Запетая", en: "Comma", es: "Coma", de: "Komma", fr: "Virgule" } },
      { id: "punctuation-question", label: { bg: "Въпросителен знак", en: "Question mark", es: "Signo de interrogación", de: "Fragezeichen", fr: "Point d'interrogation" } },
      { id: "punctuation-exclamation", label: { bg: "Удивителен знак", en: "Exclamation mark", es: "Signo de exclamación", de: "Ausrufezeichen", fr: "Point d'exclamation" } },
      { id: "direct-speech", label: { bg: "Преки реч", en: "Direct speech", es: "Discurso directo", de: "Direkte Rede", fr: "Discours direct" } },
      { id: "vocabulary-synonyms", label: { bg: "Синоними", en: "Synonyms", es: "Sinónimos", de: "Synonyme", fr: "Synonymes" } },
      { id: "vocabulary-antonyms", label: { bg: "Антоними", en: "Antonyms", es: "Antónimos", de: "Antonyme", fr: "Antonymes" } },
      { id: "reading-comprehension", label: { bg: "Разбиране на прочетеното", en: "Reading comprehension", es: "Comprensión lectora", de: "Leseverständnis", fr: "Compréhension de lecture" } },
      { id: "writing-sentences", label: { bg: "Писане на изречения", en: "Sentence writing", es: "Escritura de oraciones", de: "Satzkonstruktion", fr: "Rédaction de phrases" } },
      { id: "writing-paragraph", label: { bg: "Писане на абзац", en: "Paragraph writing", es: "Escritura de párrafos", de: "Absatzschreiben", fr: "Rédaction de paragraphes" } },
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
