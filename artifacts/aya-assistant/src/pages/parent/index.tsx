import { Layout } from "@/components/layout";
import { useState } from "react";
import {
  useListChildren,
  useCreateChild,
  useDeleteChild,
  useUpdateChild,
  useListProgress,
  useListMissions,
  useListMemories,
  useCreateFamily,
  useGetFamily,
  useGetDailyPlan,
  useGetLearningWeaknesses,
  getGetFamilyQueryKey,
  getListChildrenQueryKey,
  getListProgressQueryKey,
  getListMissionsQueryKey,
  getGetLearningWeaknessesQueryKey,
} from "@workspace/api-client-react";
import type { WeakTopic } from "@workspace/api-client-react";
import type { Child, Badge } from "@workspace/api-client-react";
import { Activity, BrainCircuit, Users, LineChart, Plus, Trash2, Pencil, Home, Clock, Award, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import type { LangCode } from "@/lib/i18n";
import { BookOpen, Brain } from "lucide-react";
import { getLevel } from "@/lib/levelSystem";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const ZONE_ORDER = ["Math Island", "Reading Forest", "Logic Mountain", "English City", "Science Planet"];

const COMPANION_DATA: Record<string, { emoji: string; name: string; tone: string; color: string; accentColor: string }> = {
  panda: { emoji: "🐼", name: "Panda", tone: "gentle",      color: "bg-green-50 border-green-200",   accentColor: "text-green-700" },
  robot: { emoji: "🤖", name: "Robot", tone: "encouraging", color: "bg-blue-50 border-blue-200",     accentColor: "text-blue-700" },
  fox:   { emoji: "🦊", name: "Fox",   tone: "playful",     color: "bg-orange-50 border-orange-200", accentColor: "text-orange-700" },
  owl:   { emoji: "🦉", name: "Owl",   tone: "calm",        color: "bg-purple-50 border-purple-200", accentColor: "text-purple-700" },
};

const ZONE_EMOJIS: Record<string, string> = {
  "Math Island": "🏝️",
  "Reading Forest": "🌲",
  "Logic Mountain": "⛰️",
  "English City": "🏙️",
  "Science Planet": "🌍",
};

const GRADE_OPTIONS = [
  { value: 1, label: "Grade 1" },
  { value: 2, label: "Grade 2" },
  { value: 3, label: "Grade 3" },
  { value: 4, label: "Grade 4" },
];

const LANGUAGE_OPTIONS = ["English", "Bulgarian", "Spanish"];

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  grade: z.coerce.number().min(1).max(4),
  language: z.string().min(1, "Language is required"),
  country: z.string().min(1, "Country is required"),
});

function getGradeDisplay(grade: number, language?: string | null): string {
  const l = (language ?? "").toLowerCase();
  if (l.includes("bulgar") || l === "bg") return `${grade} клас`;
  if (l.includes("spanish") || l.includes("español") || l === "es") return `${grade} grado`;
  return `Grade ${grade}`;
}

function getProfileI18n(language?: string | null) {
  const l = (language ?? "").toLowerCase();
  if (l.includes("bulgar") || l === "bg") {
    return {
      editTitle: "Редакция на профил на дете",
      nameLbl: "Име",
      gradeLbl: "Клас",
      langLbl: "Език",
      countryLbl: "Държава",
      saveLbl: "Запази промените",
      gradeOptions: [
        { value: 1, label: "1 клас" },
        { value: 2, label: "2 клас" },
        { value: 3, label: "3 клас" },
        { value: 4, label: "4 клас" },
      ],
      noCompanion: "Все още няма избран компаньон — докоснете, за да изберете",
      levelLbl: "Ниво",
      xpLbl: "XP",
      starsLbl: "Звезди",
      badgesLbl: "Значки",
    };
  }
  if (l.includes("spanish") || l.includes("español") || l === "es") {
    return {
      editTitle: "Editar perfil del niño",
      nameLbl: "Nombre",
      gradeLbl: "Grado escolar",
      langLbl: "Idioma",
      countryLbl: "País",
      saveLbl: "Guardar cambios",
      gradeOptions: [
        { value: 1, label: "1° grado" },
        { value: 2, label: "2° grado" },
        { value: 3, label: "3° grado" },
        { value: 4, label: "4° grado" },
      ],
      noCompanion: "Sin compañero seleccionado — toca para elegir",
      levelLbl: "Nivel",
      xpLbl: "XP",
      starsLbl: "Estrellas",
      badgesLbl: "Insignias",
    };
  }
  return {
    editTitle: "Edit Child Profile",
    nameLbl: "Name",
    gradeLbl: "School Grade",
    langLbl: "Language",
    countryLbl: "Country",
    saveLbl: "Save Changes",
    gradeOptions: GRADE_OPTIONS,
    noCompanion: "No companion selected yet — tap to choose",
    levelLbl: "Level",
    xpLbl: "XP",
    starsLbl: "Stars",
    badgesLbl: "Badges",
  };
}

const familySchema = z.object({
  name: z.string().min(1, "Family name is required"),
  country: z.string().min(1, "Country is required"),
  language: z.string().min(1, "Language is required"),
});

type ChildFormData = z.infer<typeof childSchema>;

const COMPANION_CHARS = [
  { id: "panda", emoji: "🐼", name: "Panda", desc: "Patient and gentle",   tone: "gentle",      color: "bg-green-100 border-green-300",   accentColor: "text-green-700" },
  { id: "robot", emoji: "🤖", name: "Robot", desc: "Logical and precise",  tone: "encouraging", color: "bg-blue-100 border-blue-300",     accentColor: "text-blue-700" },
  { id: "fox",   emoji: "🦊", name: "Fox",   desc: "Creative and playful", tone: "playful",     color: "bg-orange-100 border-orange-300", accentColor: "text-orange-700" },
  { id: "owl",   emoji: "🦉", name: "Owl",   desc: "Wise and thoughtful",  tone: "calm",        color: "bg-purple-100 border-purple-300", accentColor: "text-purple-700" },
];

type ParentLang = LangCode;

const PARENT_ZONE_NAMES: Record<string, Record<ParentLang, string>> = {
  "Math Island":    { en: "Math Island",    bg: "Остров на математиката", es: "Isla de matemáticas", de: "Mathematik-Insel", fr: "Île des Mathématiques" },
  "Reading Forest": { en: "Reading Forest", bg: "Гора на четенето",        es: "Bosque de lectura", de: "Lese-Wald", fr: "Forêt de Lecture" },
  "Logic Mountain": { en: "Logic Mountain", bg: "Логическа планина",       es: "Montaña de lógica", de: "Logik-Berg", fr: "Montagne de la Logique" },
  "English City":   { en: "English City",   bg: "Английски град",          es: "Ciudad de inglés", de: "Englisch-Stadt", fr: "Ville de l'Anglais" },
  "Science Planet": { en: "Science Planet", bg: "Планетата на науката",    es: "Planeta de ciencias", de: "Wissenschaftsplanet", fr: "Planète des Sciences" },
};

const COMPANION_CHAR_DESCS: Record<string, Record<ParentLang, string>> = {
  panda: { en: "Patient and gentle",   bg: "Търпелива и нежна",   es: "Paciente y suave", de: "Geduldig und sanft", fr: "Patiente et douce" },
  robot: { en: "Logical and precise",  bg: "Логичен и точен",     es: "Lógico y preciso", de: "Logisch und präzise", fr: "Logique et précise" },
  fox:   { en: "Creative and playful", bg: "Творческа и игрива",  es: "Creativa y lúdica", de: "Kreativ und verspielt", fr: "Créative et ludique" },
  owl:   { en: "Wise and thoughtful",  bg: "Мъдра и вдумчива",   es: "Sabia y reflexiva", de: "Weise und nachdenklich", fr: "Sage et réfléchie" },
};

const PARENT_LABELS: Record<ParentLang, {
  tabMemories: string;
  createFamilyTitle: string;
  createFamilySubtitle: string;
  familyNamePlaceholder: string;
  countryPlaceholder: string;
  languagePlaceholder: string;
  creatingFamily: string;
  createFamilyBtn: string;
  addChildDialogTitle: string;
  addChildNameLabel: string;
  addChildGradeLabel: string;
  addChildLanguageLabel: string;
  addChildCountryLabel: string;
  addChildCountryHint: string;
  addChildNamePlaceholder: string;
  selectGrade: string;
  selectLanguage: string;
  savingProfile: string;
  saveProfile: string;
  noChildProfiles: string;
  noFamilyYet: string;
  statLevel: string;
  statTotalXP: string;
  statStars: string;
  statMissionsDone: string;
  statCurrentZone: string;
  statHomework: string;
  statSolvedToday: string;
  statVoiceSessions: string;
  statMinListened: string;
  statToday: string;
  curriculumEngineTitle: string;
  statLessonsDone: string;
  statPracticeSets: string;
  statQuizzesPassed: string;
  companionSupportText: (name: string) => string;
  recentMissionActivity: string;
  subjectStrengths: string;
  needsPractice: string;
  unlockedZones: string;
  subjectPerformanceChart: string;
  notEnoughData: string;
  missionActivity: string;
  earnedBadges: (n: number) => string;
  missionPending: string;
  memoryEngineTitle: string;
  memoryEngineSubtitle: string;
  memoryEngineGathering: string;
  memoryVia: string;
  companionPickerTitle: string;
  companionPickerDesc: (name: string) => string;
  companionPickerDescGeneric: string;
  companionPickerCurrent: string;
  companionPickerCancel: string;
  changeCompanionTitle: string;
  dailyPlanTitle: string;
  dailyPlanCompleted: (done: number, total: number) => string;
  dailyPlanXpEarned: string;
  improvementAreasTitle: string;
  improvementAreasEmpty: string;
  weakLabelMap: Record<string, string>;
  weakRecommendationMap: Record<string, string>;
  aiLearningFocusTitle: string;
  aiLearningFocusEmpty: string;
  aiLearningFocusFocus: (topic: string, count: number) => string;
}> = {
  en: {
    tabMemories: "Memory Engine",
    createFamilyTitle: "Create Your Family",
    createFamilySubtitle: "Set up your family profile to start adding children.",
    familyNamePlaceholder: "Family name (e.g. The Smiths)",
    countryPlaceholder: "Country (e.g. USA)",
    languagePlaceholder: "Language (e.g. English)",
    creatingFamily: "Creating...",
    createFamilyBtn: "Create Family",
    addChildDialogTitle: "Add New Profile",
    addChildNameLabel: "Name",
    addChildGradeLabel: "School Grade",
    addChildLanguageLabel: "Language",
    addChildCountryLabel: "Country",
    addChildCountryHint: "Used to set the right curriculum for your child",
    addChildNamePlaceholder: "Child's name",
    selectGrade: "Select grade…",
    selectLanguage: "Select language…",
    savingProfile: "Saving...",
    saveProfile: "Save Profile",
    noChildProfiles: "No child profiles yet. Click \"Add Child\" to get started!",
    noFamilyYet: "Create your family first to add children.",
    statLevel: "Level",
    statTotalXP: "Total XP",
    statStars: "Stars",
    statMissionsDone: "Missions Done",
    statCurrentZone: "Current Zone",
    statHomework: "📷 Homework",
    statSolvedToday: "solved today",
    statVoiceSessions: "🎙️ Voice Sessions",
    statMinListened: "🔊 Min. Listened",
    statToday: "today",
    curriculumEngineTitle: "Curriculum Engine Progress",
    statLessonsDone: "Lessons Done",
    statPracticeSets: "Practice Sets",
    statQuizzesPassed: "Quizzes Passed",
    companionSupportText: (name) => `${name}'s selected learning companion for all Junior modules. The companion adapts questions and encouragement to guide discovery.`,
    recentMissionActivity: "Recent Mission Activity",
    subjectStrengths: "Subject Strengths",
    needsPractice: "Needs Practice",
    unlockedZones: "🗺️ Unlocked Learning Zones",
    subjectPerformanceChart: "Subject Performance Chart",
    notEnoughData: "Not enough progress data yet. Encourage your child to complete missions!",
    missionActivity: "Mission Activity",
    earnedBadges: (n) => `Earned Badges (${n})`,
    missionPending: "Pending",
    memoryEngineTitle: "AI Family Memory Engine",
    memoryEngineSubtitle: "Insights learned from family interactions.",
    memoryEngineGathering: "The Memory Engine is gathering insights...",
    memoryVia: "via",
    companionPickerTitle: "Choose a Learning Companion",
    companionPickerDesc: (name) => `Select a companion for ${name}`,
    companionPickerDescGeneric: "Select a companion",
    companionPickerCurrent: "✓ Current",
    companionPickerCancel: "Cancel",
    changeCompanionTitle: "Change companion",
    dailyPlanTitle: "Today's Learning Plan",
    dailyPlanCompleted: (done, total) => `${done}/${total} tasks completed`,
    dailyPlanXpEarned: "XP earned",
    improvementAreasTitle: "Improvement Areas",
    improvementAreasEmpty: "No weak areas detected yet — keep learning!",
    weakLabelMap: {
      needs_more_practice: "Needs more practice",
      weak_topic: "Weak topic",
      recommended_review: "Recommended for review",
    },
    weakRecommendationMap: {
      needs_more_practice: "Recommended for review",
      weak_topic: "Recommended for review",
      recommended_review: "Recommended for review",
    },
    aiLearningFocusTitle: "Today's AI Learning Focus",
    aiLearningFocusEmpty: "No learning path yet — complete a homework session to generate one!",
    aiLearningFocusFocus: (topic, count) => `Focus today: ${topic} practice (${count} problems)`,
  },
  bg: {
    tabMemories: "Паметта на AYA",
    createFamilyTitle: "Създайте вашето семейство",
    createFamilySubtitle: "Настройте семейния профил, за да добавите деца.",
    familyNamePlaceholder: "Фамилия (напр. Петрови)",
    countryPlaceholder: "Държава (напр. BG)",
    languagePlaceholder: "Език (напр. Български)",
    creatingFamily: "Създаване...",
    createFamilyBtn: "Създай семейство",
    addChildDialogTitle: "Добави нов профил",
    addChildNameLabel: "Име",
    addChildGradeLabel: "Клас",
    addChildLanguageLabel: "Език",
    addChildCountryLabel: "Държава",
    addChildCountryHint: "Използва се за задаване на правилната учебна програма за детето",
    addChildNamePlaceholder: "Името на детето",
    selectGrade: "Изберете клас…",
    selectLanguage: "Изберете език…",
    savingProfile: "Запазване...",
    saveProfile: "Запази профила",
    noChildProfiles: 'Все още няма детски профили. Натиснете „Добави дете", за да започнете!',
    noFamilyYet: "Първо създайте семейство, за да добавите деца.",
    statLevel: "Ниво",
    statTotalXP: "Общо XP",
    statStars: "Звезди",
    statMissionsDone: "Завършени мисии",
    statCurrentZone: "Текуща зона",
    statHomework: "📷 Домашно",
    statSolvedToday: "решено днес",
    statVoiceSessions: "🎙️ Гласови сесии",
    statMinListened: "🔊 Мин. слушане",
    statToday: "днес",
    curriculumEngineTitle: "Напредък по учебна програма",
    statLessonsDone: "Завършени уроци",
    statPracticeSets: "Упражнения",
    statQuizzesPassed: "Успешни тестове",
    companionSupportText: (name) => `Избраният учебен компаньон на ${name} за всички начални модули. Компаньонът адаптира въпросите и насърчението, за да ръководи откритието.`,
    recentMissionActivity: "Последна мисионна активност",
    subjectStrengths: "Силни предмети",
    needsPractice: "Нуждае се от упражнения",
    unlockedZones: "🗺️ Отключени учебни зони",
    subjectPerformanceChart: "Диаграма на успеваемостта",
    notEnoughData: "Все още няма достатъчно данни. Насърчете детето да завърши мисии!",
    missionActivity: "Мисионна активност",
    earnedBadges: (n) => `Спечелени значки (${n})`,
    missionPending: "Изчакващо",
    memoryEngineTitle: "AI Семейна памет",
    memoryEngineSubtitle: "Данни научени от семейните взаимодействия.",
    memoryEngineGathering: "Паметта събира данни...",
    memoryVia: "чрез",
    companionPickerTitle: "Изберете учебен компаньон",
    companionPickerDesc: (name) => `Изберете компаньон за ${name}`,
    companionPickerDescGeneric: "Изберете компаньон",
    companionPickerCurrent: "✓ Текущ",
    companionPickerCancel: "Отказ",
    changeCompanionTitle: "Смени компаньона",
    dailyPlanTitle: "Днешен учебен план",
    dailyPlanCompleted: (done, total) => `${done}/${total} задачи изпълнени`,
    dailyPlanXpEarned: "XP спечелени",
    improvementAreasTitle: "Зони за подобрение",
    improvementAreasEmpty: "Все още няма открити слаби области — продължавай да учиш!",
    weakLabelMap: {
      needs_more_practice: "Нуждае се от още практика",
      weak_topic: "Слаба тема",
      recommended_review: "Препоръчано за преговор",
    },
    weakRecommendationMap: {
      needs_more_practice: "Препоръчано за преговор",
      weak_topic: "Препоръчано за преговор",
      recommended_review: "Препоръчано за преговор",
    },
    aiLearningFocusTitle: "Днешна AI учебна фокус тема",
    aiLearningFocusEmpty: "Все още няма учебен път — завърши домашна работа!",
    aiLearningFocusFocus: (topic, count) => `Фокус днес: ${topic} (${count} задачи)`,
  },
  es: {
    tabMemories: "Memoria AYA",
    createFamilyTitle: "Crea tu familia",
    createFamilySubtitle: "Configura el perfil familiar para comenzar a agregar niños.",
    familyNamePlaceholder: "Nombre familiar (ej. Los García)",
    countryPlaceholder: "País (ej. ES)",
    languagePlaceholder: "Idioma (ej. Español)",
    creatingFamily: "Creando...",
    createFamilyBtn: "Crear familia",
    addChildDialogTitle: "Añadir nuevo perfil",
    addChildNameLabel: "Nombre",
    addChildGradeLabel: "Grado escolar",
    addChildLanguageLabel: "Idioma",
    addChildCountryLabel: "País",
    addChildCountryHint: "Utilizado para configurar el currículo adecuado para tu niño",
    addChildNamePlaceholder: "Nombre del niño",
    selectGrade: "Seleccionar grado…",
    selectLanguage: "Seleccionar idioma…",
    savingProfile: "Guardando...",
    saveProfile: "Guardar perfil",
    noChildProfiles: "Aún no hay perfiles de niños. ¡Pulsa \"Añadir niño\" para empezar!",
    noFamilyYet: "Primero crea tu familia para añadir niños.",
    statLevel: "Nivel",
    statTotalXP: "XP total",
    statStars: "Estrellas",
    statMissionsDone: "Misiones completadas",
    statCurrentZone: "Zona actual",
    statHomework: "📷 Tarea",
    statSolvedToday: "resueltas hoy",
    statVoiceSessions: "🎙️ Sesiones de voz",
    statMinListened: "🔊 Min. escuchados",
    statToday: "hoy",
    curriculumEngineTitle: "Progreso del currículo",
    statLessonsDone: "Lecciones",
    statPracticeSets: "Ejercicios",
    statQuizzesPassed: "Cuestionarios",
    companionSupportText: (name) => `El compañero de aprendizaje elegido por ${name} para todos los módulos de primaria. El compañero adapta preguntas y motivación para guiar el descubrimiento.`,
    recentMissionActivity: "Actividad reciente de misiones",
    subjectStrengths: "Puntos fuertes",
    needsPractice: "Necesita práctica",
    unlockedZones: "🗺️ Zonas de aprendizaje desbloqueadas",
    subjectPerformanceChart: "Gráfico de rendimiento",
    notEnoughData: "Aún no hay datos suficientes. ¡Anima a tu niño a completar misiones!",
    missionActivity: "Actividad de misiones",
    earnedBadges: (n) => `Insignias ganadas (${n})`,
    missionPending: "Pendiente",
    memoryEngineTitle: "Motor de memoria familiar IA",
    memoryEngineSubtitle: "Conocimientos aprendidos de las interacciones familiares.",
    memoryEngineGathering: "El motor de memoria está recopilando datos...",
    memoryVia: "vía",
    companionPickerTitle: "Elige un compañero de aprendizaje",
    companionPickerDesc: (name) => `Seleccionar un compañero para ${name}`,
    companionPickerDescGeneric: "Seleccionar un compañero",
    companionPickerCurrent: "✓ Actual",
    companionPickerCancel: "Cancelar",
    changeCompanionTitle: "Cambiar compañero",
    dailyPlanTitle: "Plan de aprendizaje de hoy",
    dailyPlanCompleted: (done, total) => `${done}/${total} tareas completadas`,
    dailyPlanXpEarned: "XP ganados",
    improvementAreasTitle: "Áreas de mejora",
    improvementAreasEmpty: "Aún no se detectaron áreas débiles — ¡sigue aprendiendo!",
    weakLabelMap: {
      needs_more_practice: "Necesita más práctica",
      weak_topic: "Tema débil",
      recommended_review: "Recomendado para repaso",
    },
    weakRecommendationMap: {
      needs_more_practice: "Recomendado para repaso",
      weak_topic: "Recomendado para repaso",
      recommended_review: "Recomendado para repaso",
    },
    aiLearningFocusTitle: "Enfoque de aprendizaje AI de hoy",
    aiLearningFocusEmpty: "Sin ruta de aprendizaje aún — ¡completa una tarea!",
    aiLearningFocusFocus: (topic, count) => `Foco hoy: práctica de ${topic} (${count} problemas)`,
  },
  de: {
    tabMemories: "AI Familienerinnerung",
    createFamilyTitle: "Erstelle deine Familie",
    createFamilySubtitle: "Richte dein Familienprofil ein, um Kinder hinzuzufügen.",
    familyNamePlaceholder: "Familienname (z.B. Die Müller)",
    countryPlaceholder: "Land (z.B. DE)",
    languagePlaceholder: "Sprache (z.B. Deutsch)",
    creatingFamily: "Erstelle...",
    createFamilyBtn: "Familie erstellen",
    addChildDialogTitle: "Neues Profil hinzufügen",
    addChildNameLabel: "Name",
    addChildGradeLabel: "Schulklasse",
    addChildLanguageLabel: "Sprache",
    addChildCountryLabel: "Land",
    addChildCountryHint: "Wird verwendet, um den richtigen Lehrplan für dein Kind festzulegen",
    addChildNamePlaceholder: "Name des Kindes",
    selectGrade: "Klasse auswählen…",
    selectLanguage: "Sprache auswählen…",
    savingProfile: "Speichern...",
    saveProfile: "Profil speichern",
    noChildProfiles: "Noch keine Kinderprofile. Klicke auf \"Kind hinzufügen\", um zu beginnen!",
    noFamilyYet: "Erstelle zuerst deine Familie, um Kinder hinzuzufügen.",
    statLevel: "Stufe",
    statTotalXP: "Gesamt-XP",
    statStars: "Sterne",
    statMissionsDone: "Missionen abgeschlossen",
    statCurrentZone: "Aktuelle Zone",
    statHomework: "📷 Hausaufgaben",
    statSolvedToday: "heute gelöst",
    statVoiceSessions: "🎙️ Sprachsitzungen",
    statMinListened: "🔊 Min. gehört",
    statToday: "heute",
    curriculumEngineTitle: "Lehrplanfortschritt",
    statLessonsDone: "Lektionen abgeschlossen",
    statPracticeSets: "Übungssätze",
    statQuizzesPassed: "Quizze bestanden",
    companionSupportText: (name) => `${name}s ausgewählter Lernbegleiter für alle Junior-Module. Der Begleiter passt Fragen und Ermutigung an, um die Entdeckung zu leiten.`,
    recentMissionActivity: "Letzte Missionsaktivität",
    subjectStrengths: "Starke Fächer",
    needsPractice: "Benötigt Übung",
    unlockedZones: "🗺️ Freigeschaltete Lernzonen",
    subjectPerformanceChart: "Leistungsdiagramm",
    notEnoughData: "Noch nicht genug Fortschrittsdaten. Ermutige dein Kind, Missionen abzuschließen!",
    missionActivity: "Missionsaktivität",
    earnedBadges: (n) => `Verdiente Abzeichen (${n})`,
    missionPending: "Ausstehend",
    memoryEngineTitle: "KI-Familienerinnerung",
    memoryEngineSubtitle: "Erkenntnisse aus Familieninteraktionen.",
    memoryEngineGathering: "Die Erinnerung sammelt Erkenntnisse...",
    memoryVia: "über",
    companionPickerTitle: "Wähle einen Lernbegleiter",
    companionPickerDesc: (name) => `Wähle einen Begleiter für ${name}`,
    companionPickerDescGeneric: "Wähle einen Begleiter",
    companionPickerCurrent: "✓ Aktuell",
    companionPickerCancel: "Abbrechen",
    changeCompanionTitle: "Begleiter ändern",
    dailyPlanTitle: "Heutiger Lernplan",
    dailyPlanCompleted: (done, total) => `${done}/${total} Aufgaben abgeschlossen`,
    dailyPlanXpEarned: "XP verdient",
    improvementAreasTitle: "Verbesserungsbereiche",
    improvementAreasEmpty: "Noch keine schwachen Bereiche erkannt — weiter lernen!",
    weakLabelMap: {
      needs_more_practice: "Benötigt mehr Übung",
      weak_topic: "Schwaches Thema",
      recommended_review: "Zur Wiederholung empfohlen",
    },
    weakRecommendationMap: {
      needs_more_practice: "Zur Wiederholung empfohlen",
      weak_topic: "Zur Wiederholung empfohlen",
      recommended_review: "Zur Wiederholung empfohlen",
    },
    aiLearningFocusTitle: "Heutiger KI-Lernfokus",
    aiLearningFocusEmpty: "Noch kein Lernpfad — schließe eine Hausaufgabe ab!",
    aiLearningFocusFocus: (topic, count) => `Fokus heute: ${topic} Übung (${count} Aufgaben)`,
  },
  fr: {
    tabMemories: "Mémoire familiale IA",
    createFamilyTitle: "Crée ta famille",
    createFamilySubtitle: "Configure ton profil familial pour commencer à ajouter des enfants.",
    familyNamePlaceholder: "Nom de famille (ex. Les Dupont)",
    countryPlaceholder: "Pays (ex. FR)",
    languagePlaceholder: "Langue (ex. Français)",
    creatingFamily: "Création...",
    createFamilyBtn: "Créer la famille",
    addChildDialogTitle: "Ajouter un nouveau profil",
    addChildNameLabel: "Nom",
    addChildGradeLabel: "Année scolaire",
    addChildLanguageLabel: "Langue",
    addChildCountryLabel: "Pays",
    addChildCountryHint: "Utilisé pour définir le bon cursus pour ton enfant",
    addChildNamePlaceholder: "Nom de l'enfant",
    selectGrade: "Sélectionner l'année…",
    selectLanguage: "Sélectionner la langue…",
    savingProfile: "Enregistrement...",
    saveProfile: "Enregistrer le profil",
    noChildProfiles: "Aucun profil d'enfant pour le moment. Clique sur \"Ajouter un enfant\" pour commencer!",
    noFamilyYet: "Crée d'abord ta famille pour ajouter des enfants.",
    statLevel: "Niveau",
    statTotalXP: "XP total",
    statStars: "Étoiles",
    statMissionsDone: "Missions complétées",
    statCurrentZone: "Zone actuelle",
    statHomework: "📷 Devoirs",
    statSolvedToday: "résolu aujourd'hui",
    statVoiceSessions: "🎙️ Sessions vocales",
    statMinListened: "🔊 Min. écoutées",
    statToday: "aujourd'hui",
    curriculumEngineTitle: "Progrès du cursus",
    statLessonsDone: "Leçons complétées",
    statPracticeSets: "Ensembles de pratique",
    statQuizzesPassed: "Quiz réussis",
    companionSupportText: (name) => `Le compagnon d'apprentissage choisi de ${name} pour tous les modules Junior. Le compagnon adapte les questions et les encouragements pour guider la découverte.`,
    recentMissionActivity: "Activité de mission récente",
    subjectStrengths: "Matières fortes",
    needsPractice: "Besoin de pratique",
    unlockedZones: "🗺️ Zones d'apprentissage déverrouillées",
    subjectPerformanceChart: "Graphique de performance",
    notEnoughData: "Pas encore assez de données de progression. Encourage ton enfant à compléter les missions!",
    missionActivity: "Activité de mission",
    earnedBadges: (n) => `Badges gagnés (${n})`,
    missionPending: "En attente",
    memoryEngineTitle: "Mémoire familiale IA",
    memoryEngineSubtitle: "Insights appris des interactions familiales.",
    memoryEngineGathering: "La mémoire recueille les informations...",
    memoryVia: "via",
    companionPickerTitle: "Choisir un compagnon d'apprentissage",
    companionPickerDesc: (name) => `Sélectionne un compagnon pour ${name}`,
    companionPickerDescGeneric: "Sélectionne un compagnon",
    companionPickerCurrent: "✓ Actuel",
    companionPickerCancel: "Annuler",
    changeCompanionTitle: "Changer de compagnon",
    dailyPlanTitle: "Plan d'apprentissage d'aujourd'hui",
    dailyPlanCompleted: (done, total) => `${done}/${total} tâches complétées`,
    dailyPlanXpEarned: "XP gagnés",
    improvementAreasTitle: "Domaines d'amélioration",
    improvementAreasEmpty: "Aucun domaine faible détecté pour le moment — continue à apprendre!",
    weakLabelMap: {
      needs_more_practice: "Besoin de plus de pratique",
      weak_topic: "Sujet faible",
      recommended_review: "Recommandé pour révision",
    },
    weakRecommendationMap: {
      needs_more_practice: "Recommandé pour révision",
      weak_topic: "Recommandé pour révision",
      recommended_review: "Recommandé pour révision",
    },
    aiLearningFocusTitle: "Focus d'apprentissage IA d'aujourd'hui",
    aiLearningFocusEmpty: "Pas encore de parcours — complète un devoir !",
    aiLearningFocusFocus: (topic, count) => `Focus aujourd'hui : pratique de ${topic} (${count} problèmes)`,
  },
};

/* ─────────────────────────────────────────────────────────────────
   Improvement Areas Card (Smart Weakness Detection)
───────────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────────
   Parent Progress Card — Read-only weekly insights (Phase 2B)
───────────────────────────────────────────────────────────────── */

interface WeeklyInsights {
  childId: number;
  period: string;
  weeklyWins: string[];
  weeklyNeedsSupport: string[];
  recommendedHomePractice: string[];
  parentMessageBg: string;
}

function ParentProgressCard({
  childId,
  lang,
}: {
  childId: number;
  lang: LangCode;
}) {
  const { data: insights, isLoading } = useQuery<WeeklyInsights>({
    queryKey: ["parent-progress", childId],
    queryFn: async () => {
      const res = await fetch(`/api/learning/weekly-insights?childId=${childId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: childId > 0,
    staleTime: 5 * 60 * 1000,
  });

  const labels: Record<LangCode, { title: string; wins: string; support: string; practice: string; empty: string }> = {
    en: { title: "Weekly Progress", wins: "Weekly Wins", support: "Needs Support", practice: "Home Practice", empty: "Not enough data yet" },
    bg: { title: "Седмичен напредък", wins: "Седмични успехи", support: "Нуждае се от поддържка", practice: "Домашна практика", empty: "Все още няма достатъчно данни" },
    es: { title: "Progreso semanal", wins: "Logros semanales", support: "Necesita apoyo", practice: "Práctica en casa", empty: "Sin datos suficientes" },
    de: { title: "Wöchentlicher Fortschritt", wins: "Wöchentliche Erfolge", support: "Braucht Unterstützung", practice: "Hausaufgabenpraktik", empty: "Noch nicht genug Daten" },
    fr: { title: "Progrès hebdomadaire", wins: "Victoires hebdomadaires", support: "Besoin de soutien", practice: "Pratique à domicile", empty: "Pas assez de données" },
  };

  const lbl = labels[lang];

  if (isLoading) {
    return (
      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 animate-pulse h-32" />
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
      <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-800">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        {lbl.title}
      </h3>

      {insights.weeklyWins.length === 0 && insights.weeklyNeedsSupport.length === 0 ? (
        <p className="text-sm text-blue-600 italic">{lbl.empty}</p>
      ) : (
        <div className="space-y-3">
          {insights.weeklyWins.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1.5">{lbl.wins}</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.weeklyWins.map(win => (
                  <span key={win} className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                    ✨ {win}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.weeklyNeedsSupport.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1.5">{lbl.support}</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.weeklyNeedsSupport.map(item => (
                  <span key={item} className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
                    📌 {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.recommendedHomePractice.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1.5">{lbl.practice}</p>
              <ul className="text-xs text-blue-600 space-y-1">
                {insights.recommendedHomePractice.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-lg">📝</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.parentMessageBg && (
            <div className="bg-white/60 p-2.5 rounded-lg border border-blue-100 mt-3">
              <p className="text-xs text-blue-700 italic">{insights.parentMessageBg}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Teacher Export Card — Read-only export data (Phase 2B)
───────────────────────────────────────────────────────────────── */

interface TeacherExportData {
  childId: number;
  grade?: number;
  activeSubject: string | null;
  weakTopics: string[];
  strongTopics: string[];
  interventionFlags: string[];
  suggestedTeacherFocus: string[];
}

function TeacherExportCard({
  childId,
  grade,
  lang,
}: {
  childId: number;
  grade?: number;
  lang: LangCode;
}) {
  const { data: exportData, isLoading } = useQuery<TeacherExportData>({
    queryKey: ["teacher-export", childId],
    queryFn: async () => {
      const url = `/api/learning/teacher-export?childId=${childId}${grade ? `&grade=${grade}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: childId > 0,
    staleTime: 5 * 60 * 1000,
  });

  const labels: Record<LangCode, { title: string; weak: string; strong: string; interventions: string; focus: string; empty: string }> = {
    en: { title: "Teacher Summary", weak: "Weak Topics", strong: "Strong Topics", interventions: "Flagged Areas", focus: "Recommended Focus", empty: "No data available" },
    bg: { title: "Резюме за учител", weak: "Слаби теми", strong: "Силни теми", interventions: "Отбелязани области", focus: "Препоръчан фокус", empty: "Няма налични данни" },
    es: { title: "Resumen del maestro", weak: "Temas débiles", strong: "Temas fuertes", interventions: "Áreas marcadas", focus: "Enfoque recomendado", empty: "Sin datos disponibles" },
    de: { title: "Zusammenfassung für Lehrer", weak: "Schwache Themen", strong: "Starke Themen", interventions: "Gekennzeichnete Bereiche", focus: "Empfohlener Fokus", empty: "Keine Daten verfügbar" },
    fr: { title: "Résumé pour l'enseignant", weak: "Sujets faibles", strong: "Sujets forts", interventions: "Zones signalées", focus: "Accent recommandé", empty: "Aucune donnée disponible" },
  };

  const lbl = labels[lang];

  /* ── Translation mappings for intervention flags and teacher focus ── */
  const topicTranslations: Record<string, Record<LangCode, string>> = {
    addition: { bg: "събиране", en: "addition", es: "suma", de: "addition", fr: "addition" },
    subtraction: { bg: "изваждане", en: "subtraction", es: "resta", de: "subtraktion", fr: "soustraction" },
    multiplication: { bg: "умножение", en: "multiplication", es: "multiplicación", de: "multiplikation", fr: "multiplication" },
    division: { bg: "деление", en: "division", es: "división", de: "division", fr: "division" },
    word_problems: { bg: "текстови задачи", en: "word problems", es: "problemas", de: "textaufgaben", fr: "problèmes écrits" },
    reading_comprehension_basic: { bg: "разбиране на текст", en: "reading comprehension", es: "comprensión", de: "leseverständnis", fr: "compréhension" },
  };

  const flagTranslations: Record<string, Record<LangCode, string>> = {
    repeated_low_success_math: { bg: "Повтарящ се нисък успех по математика", en: "repeated low success math", es: "éxito bajo repetido en matemáticas", de: "wiederholter niedriger Erfolg in Mathematik", fr: "succès faible répété en mathématiques" },
    repeated_low_success_bulgarian: { bg: "Повтарящ се нисък успех по български език", en: "repeated low success bulgarian", es: "éxito bajo repetido en búlgaro", de: "wiederholter niedriger Erfolg in Bulgarisch", fr: "succès faible répété en bulgare" },
    needs_review_before_advancing: { bg: "Нужен е преговор преди преминаване напред", en: "needs review before advancing", es: "necesita revisión antes de avanzar", de: "benötigt Überprüfung vor dem Fortschritt", fr: "nécessite un examen avant d'avancer" },
  };

  const translateFlag = (flag: string): string => {
    if (lang === "bg" || lang === "en") {
      return flagTranslations[flag]?.[lang] ?? flag.replace(/_/g, " ");
    }
    return flag.replace(/_/g, " ");
  };

  const translateFocus = (focus: string): string => {
    if (lang !== "bg") return focus;
    
    // Translate "Reinforcement needed in {topic}" to Bulgarian
    const match = focus.match(/Reinforcement needed in (.+)/);
    if (match) {
      const topicId = match[1].toLowerCase();
      const bgTopic = topicTranslations[topicId]?.[lang] ?? topicId;
      return `Нужно е затвърждаване по ${bgTopic}`;
    }
    return focus;
  };

  if (isLoading) {
    return (
      <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 animate-pulse h-32" />
    );
  }

  if (!exportData || (exportData.weakTopics.length === 0 && exportData.strongTopics.length === 0)) {
    return null;
  }

  return (
    <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
      <h3 className="font-bold mb-3 flex items-center gap-2 text-purple-800">
        <Sparkles className="w-4 h-4 text-purple-600" />
        {lbl.title}
      </h3>

      <div className="space-y-3">
        {exportData.strongTopics.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-purple-700 mb-1.5">{lbl.strong}</p>
            <div className="flex flex-wrap gap-1.5">
              {exportData.strongTopics.map(topic => (
                <span key={topic} className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                  ✓ {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {exportData.weakTopics.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-purple-700 mb-1.5">{lbl.weak}</p>
            <div className="flex flex-wrap gap-1.5">
              {exportData.weakTopics.map(topic => (
                <span key={topic} className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                  ⚠ {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {exportData.interventionFlags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-purple-700 mb-1.5">{lbl.interventions}</p>
            <ul className="text-xs text-purple-600 space-y-1">
              {exportData.interventionFlags.map((flag, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span>🔔</span>
                  <span>{translateFlag(flag)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {exportData.suggestedTeacherFocus.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-purple-700 mb-1.5">{lbl.focus}</p>
            <ul className="text-xs text-purple-600 space-y-1">
              {exportData.suggestedTeacherFocus.map((focus, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span>💡</span>
                  <span>{translateFocus(focus)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ImprovementAreasCard({
  weakTopics,
  lang,
  plbl,
}: {
  weakTopics: WeakTopic[];
  lang: LangCode;
  plbl: { improvementAreasTitle: string; improvementAreasEmpty: string; weakLabelMap: Record<string, string>; weakRecommendationMap: Record<string, string> };
}) {
  const subjectEmoji: Record<string, string> = {
    "mathematics": "🔢",
    "bulgarian-language": "📝",
    "reading-literature": "📚",
    "logic-thinking": "🧩",
    "nature-science": "🌿",
    "english-language": "🇬🇧",
  };

  const subjectLabel: Record<string, Record<LangCode, string>> = {
    "mathematics":        { en: "Mathematics", bg: "Математика", es: "Matemáticas", de: "Mathematik", fr: "Mathématiques" },
    "bulgarian-language": { en: "Bulgarian Language", bg: "Български език", es: "Lengua", de: "Bulgarische Sprache", fr: "Langue bulgare" },
    "reading-literature": { en: "Reading", bg: "Четене", es: "Lectura", de: "Lesen", fr: "Lecture" },
    "logic-thinking":     { en: "Logic", bg: "Логика", es: "Lógica", de: "Logik", fr: "Logique" },
    "nature-science":     { en: "Nature", bg: "Околен свят", es: "Ciencias", de: "Naturwissenschaften", fr: "Sciences naturelles" },
    "english-language":   { en: "English", bg: "Английски", es: "Inglés", de: "Englisch", fr: "Anglais" },
  };

  const topicLabel: Record<string, Record<LangCode, string>> = {
    "addition":        { en: "Addition",        bg: "Събиране",           es: "Suma",              de: "Addition",         fr: "Addition" },
    "subtraction":     { en: "Subtraction",      bg: "Изваждане",          es: "Resta",             de: "Subtraktion",      fr: "Soustraction" },
    "multiplication":  { en: "Multiplication",   bg: "Умножение",          es: "Multiplicación",    de: "Multiplikation",   fr: "Multiplication" },
    "division":        { en: "Division",         bg: "Деление",            es: "División",          de: "Division",         fr: "Division" },
    "word-problems":   { en: "Word problems",    bg: "Текстови задачи",    es: "Problemas",         de: "Textaufgaben",    fr: "Problèmes écrits" },
    "alphabet":        { en: "Alphabet",         bg: "Азбука",             es: "Alfabeto",         de: "Alphabet",         fr: "Alphabet" },
    "reading":         { en: "Reading",          bg: "Четене",             es: "Lectura",          de: "Lesen",            fr: "Lecture" },
    "writing":         { en: "Writing",          bg: "Писане",             es: "Escritura",        de: "Schreiben",        fr: "Écriture" },
    "grammar":         { en: "Grammar",          bg: "Граматика",          es: "Gramática",        de: "Grammatik",        fr: "Grammaire" },
    "stories":         { en: "Stories",          bg: "Разкази",            es: "Cuentos",          de: "Geschichten",      fr: "Histoires" },
    "comprehension":   { en: "Comprehension",    bg: "Разбиране",          es: "Comprensión",      de: "Leseverständnis",  fr: "Compréhension" },
    "patterns":        { en: "Patterns",         bg: "Закономерности",     es: "Patrones",         de: "Muster",           fr: "Motifs" },
    "puzzles":         { en: "Puzzles",          bg: "Пъзели",             es: "Puzles",           de: "Rätsel",           fr: "Énigmes" },
    "plants":          { en: "Plants",           bg: "Растения",           es: "Plantas",          de: "Pflanzen",         fr: "Plantes" },
    "animals":         { en: "Animals",          bg: "Животни",            es: "Animales",         de: "Tiere",            fr: "Animaux" },
    "weather":         { en: "Weather",          bg: "Времето",            es: "El tiempo",        de: "Wetter",           fr: "Météo" },
    "vocabulary":      { en: "Vocabulary",       bg: "Речник",             es: "Vocabulario",      de: "Wortschatz",       fr: "Vocabulaire" },
    "simple-sentences":{ en: "Simple sentences", bg: "Прости изречения",   es: "Oraciones",        de: "Einfache Sätze",   fr: "Phrases simples" },
  };

  return (
    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
      <h3 className="font-bold mb-3 flex items-center gap-2 text-amber-800">
        <TrendingDown className="w-4 h-4 text-amber-600" />
        {plbl.improvementAreasTitle}
      </h3>
      {weakTopics.length === 0 ? (
        <p className="text-sm text-amber-600 italic">{plbl.improvementAreasEmpty}</p>
      ) : (
        <div className="space-y-2">
          {weakTopics.map(w => (
            <div
              key={`${w.subjectId}:${w.topicId}`}
              className="flex items-center justify-between gap-3 bg-white/80 rounded-xl px-3 py-2.5 border border-amber-100"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg flex-shrink-0">{subjectEmoji[w.subjectId] ?? "📖"}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">
                    {subjectLabel[w.subjectId]?.[lang] ?? w.subjectId}
                    {" → "}
                    {topicLabel[w.topicId]?.[lang] ?? w.topicId}
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                    {plbl.weakLabelMap[w.label] ?? w.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  w.successRate < 50 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {w.successRate}%
                </span>
                <span className="hidden sm:block text-[10px] text-amber-600 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-lg">
                  {plbl.weakRecommendationMap[w.label] ?? "Review"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TOPIC_LABELS: Record<string, Record<string, string>> = {
  addition_to_10:      { en: "Addition (to 10)",     bg: "Събиране до 10",        es: "Suma (hasta 10)",     de: "Addition (bis 10)",      fr: "Addition (jusqu'à 10)" },
  addition_over_10:    { en: "Addition (over 10)",   bg: "Събиране над 10",       es: "Suma (más de 10)",    de: "Addition (über 10)",     fr: "Addition (plus de 10)" },
  subtraction_to_10:   { en: "Subtraction (to 10)",  bg: "Изваждане до 10",       es: "Resta (hasta 10)",    de: "Subtraktion (bis 10)",   fr: "Soustraction (jusqu'à 10)" },
  subtraction:         { en: "Subtraction",           bg: "Изваждане",             es: "Resta",               de: "Subtraktion",            fr: "Soustraction" },
  multiplication:      { en: "Multiplication",        bg: "Умножение",             es: "Multiplicación",      de: "Multiplikation",         fr: "Multiplication" },
  division:            { en: "Division",              bg: "Деление",               es: "División",            de: "Division",               fr: "Division" },
};

function AILearningFocusCard({
  childId,
  lang,
  plbl,
}: {
  childId: number;
  lang: string;
  plbl: { aiLearningFocusTitle: string; aiLearningFocusEmpty: string; aiLearningFocusFocus: (topic: string, count: number) => string };
}) {
  const { data } = useQuery<{ path: { priorityTopic: string; generatedPractice: string[]; createdAt: string } | null }>({
    queryKey: ["learning-path", childId],
    queryFn: async () => {
      const res = await fetch(`/api/learning/path?childId=${childId}`);
      if (!res.ok) return { path: null };
      return res.json();
    },
    enabled: childId > 0,
    staleTime: 60 * 1000,
  });

  const path = data?.path ?? null;
  const topicLabel = path ? (TOPIC_LABELS[path.priorityTopic]?.[lang] ?? path.priorityTopic) : null;
  const practiceCount = path ? (path.generatedPractice as string[]).length : 0;

  return (
    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
      <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-800">
        <BrainCircuit className="w-4 h-4 text-blue-600" />
        {plbl.aiLearningFocusTitle}
      </h3>
      {!path ? (
        <p className="text-sm text-blue-600 italic">{plbl.aiLearningFocusEmpty}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-800">
            {plbl.aiLearningFocusFocus(topicLabel ?? "", practiceCount)}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {(path.generatedPractice as string[]).map((problem, i) => (
              <span
                key={i}
                className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-sm font-mono text-blue-700"
              >
                {i + 1}. {problem}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-blue-500 mt-1">
            {new Date(path.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

function getCurrentZone(xp: number): { name: string; emoji: string } {
  if (xp >= 250) return { name: "Science Planet", emoji: "🌍" };
  if (xp >= 150) return { name: "English City", emoji: "🏙️" };
  if (xp >= 80) return { name: "Logic Mountain", emoji: "⛰️" };
  if (xp >= 30) return { name: "Reading Forest", emoji: "🌲" };
  return { name: "Math Island", emoji: "🏝️" };
}

function getMissionZone(mission: { zone?: string | null; subject: string }): string {
  if (mission.zone) return mission.zone;
  const subj = mission.subject.toLowerCase();
  if (subj.includes("math") || subj.includes("матем") || subj.includes("maths")) return "Math Island";
  if (subj.includes("read") || subj.includes("четен") || subj.includes("deutsch") || subj.includes("lengua")) return "Reading Forest";
  if (subj.includes("logic") || subj.includes("логика")) return "Logic Mountain";
  if (subj.includes("english") || subj.includes("английски") || subj.includes("englisch") || subj.includes("inglés")) return "English City";
  return "Science Planet";
}

export function ParentDashboard() {
  const [tab, setTab] = useState("children");
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [companionPickerChild, setCompanionPickerChild] = useState<Child | null>(null);
  const [companionPickerOpen, setCompanionPickerOpen] = useState(false);
  const { toast } = useToast();
  const { refreshUser, activeChildId, setActiveChildId } = useAuth();
  const { t, lang } = useI18n();
  const plbl = PARENT_LABELS[lang];

  const { data: family, refetch: refetchFamily } = useGetFamily({ query: { queryKey: getGetFamilyQueryKey(), retry: false } });
  const { data: children = [], refetch: refetchChildren } = useListChildren({ query: { queryKey: getListChildrenQueryKey(), enabled: !!family } });
  const { data: memories = [] } = useListMemories();

  const progressChildId = selectedChildId ?? children[0]?.id ?? 0;
  const { data: progress = [] } = useListProgress(
    { childId: progressChildId },
    { query: { queryKey: getListProgressQueryKey({ childId: progressChildId }), enabled: children.length > 0 && progressChildId > 0, staleTime: 5 * 60 * 1000 } }
  );
  const { data: missions = [] } = useListMissions(
    { childId: progressChildId },
    { query: { queryKey: getListMissionsQueryKey({ childId: progressChildId }), enabled: children.length > 0 && progressChildId > 0, staleTime: 5 * 60 * 1000 } }
  );

  const progressChild = children.find(c => c.id === progressChildId);
  const editI18n = getProfileI18n(editingChild?.language);

  const { data: topicProgressData } = useQuery<{ topics: Array<{ subjectId: string; lessonDone: boolean; practiceDone: boolean; quizPassed: boolean }>; summary: { totalLessons: number; totalPractice: number; totalQuizzes: number } }>({
    queryKey: ["learning-progress", progressChildId],
    queryFn: async () => {
      if (!progressChildId) return { topics: [], summary: { totalLessons: 0, totalPractice: 0, totalQuizzes: 0 } };
      const res = await fetch(`/api/learning/progress?childId=${progressChildId}`);
      if (!res.ok) return { topics: [], summary: { totalLessons: 0, totalPractice: 0, totalQuizzes: 0 } };
      return res.json();
    },
    enabled: progressChildId > 0,
    staleTime: 30 * 1000,
  });

  const { data: homeworkToday } = useQuery<{ count: number }>({
    queryKey: ["homework-today", progressChildId],
    queryFn: async () => {
      if (!progressChildId) return { count: 0 };
      const res = await fetch(`/api/vision/homework/today?childId=${progressChildId}`);
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: progressChildId > 0,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const { data: voiceStats } = useQuery<{ sessionsToday: number; minutesListened: number }>({
    queryKey: ["voice-stats", progressChildId],
    queryFn: async () => {
      if (!progressChildId) return { sessionsToday: 0, minutesListened: 0 };
      const res = await fetch(`/api/voice/stats?childId=${progressChildId}`);
      if (!res.ok) return { sessionsToday: 0, minutesListened: 0 };
      return res.json();
    },
    enabled: progressChildId > 0,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const { data: dailyPlan } = useGetDailyPlan(
    { childId: progressChildId },
    { query: { queryKey: ["daily-plan", progressChildId], enabled: progressChildId > 0, staleTime: 60 * 1000 } },
  );

  const { data: weaknessData } = useGetLearningWeaknesses(
    { childId: progressChildId },
    { query: { queryKey: getGetLearningWeaknessesQueryKey({ childId: progressChildId }), enabled: progressChildId > 0, staleTime: 60 * 1000 } },
  );
  const weakTopics: WeakTopic[] = weaknessData?.weakTopics ?? [];

  const createChild = useCreateChild();
  const deleteChild = useDeleteChild();
  const updateChild = useUpdateChild();
  const createFamily = useCreateFamily();

  const childForm = useForm<ChildFormData>({ resolver: zodResolver(childSchema) });
  const editForm = useForm<ChildFormData>({ resolver: zodResolver(childSchema) });
  const familyForm = useForm<z.infer<typeof familySchema>>({ resolver: zodResolver(familySchema) });

  const onChildSubmit = async (data: ChildFormData) => {
    try {
      const newChild = await createChild.mutateAsync({ data });
      toast({ title: "Child added successfully" });
      const updated = await refetchChildren();
      childForm.reset();
      if (!activeChildId && newChild?.id) {
        setActiveChildId(newChild.id);
      } else if (!activeChildId && updated.data?.[0]?.id) {
        setActiveChildId(updated.data[0].id);
      }
    } catch {
      toast({ title: "Error adding child", variant: "destructive" });
    }
  };

  const onEditSubmit = async (data: ChildFormData) => {
    if (!editingChild) return;
    try {
      await updateChild.mutateAsync({ id: editingChild.id, data });
      toast({ title: "Profile updated" });
      refetchChildren();
      setEditDialogOpen(false);
      setEditingChild(null);
    } catch {
      toast({ title: "Error updating child", variant: "destructive" });
    }
  };

  const handleDeleteChild = async (id: number) => {
    if (!confirm("Remove this child profile?")) return;
    try {
      await deleteChild.mutateAsync({ id });
      const updated = await refetchChildren();
      toast({ title: "Child profile removed" });
      if (activeChildId === id) {
        const remaining = updated.data ?? [];
        setActiveChildId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {
      toast({ title: "Error removing child", variant: "destructive" });
    }
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    editForm.reset({ name: child.name, grade: child.grade, language: child.language, country: child.country });
    setEditDialogOpen(true);
  };

  const openCompanionPicker = (child: Child) => {
    setCompanionPickerChild(child);
    setCompanionPickerOpen(true);
  };

  const handleSelectCompanion = async (charId: string) => {
    if (!companionPickerChild) return;
    try {
      await updateChild.mutateAsync({ id: companionPickerChild.id, data: { aiCharacter: charId as "panda" | "robot" | "fox" | "owl" } });
      toast({ title: "Companion updated!", description: `${COMPANION_CHARS.find(c => c.id === charId)?.name} is now ${companionPickerChild.name}'s companion.` });
      refetchChildren();
      setCompanionPickerOpen(false);
      setCompanionPickerChild(null);
    } catch {
      toast({ title: "Error updating companion", variant: "destructive" });
    }
  };

  const onFamilySubmit = async (data: z.infer<typeof familySchema>) => {
    try {
      await createFamily.mutateAsync({ data });
      toast({ title: "Family created!", description: "You can now add children to your family." });
      await refetchFamily();
      await refreshUser();
      familyForm.reset();
    } catch {
      toast({ title: "Error creating family", variant: "destructive" });
    }
  };

  const completedMissions = missions.filter(m => m.completed);
  const pendingMissions = missions.filter(m => !m.completed);

  const totalLearningMinutes = (() => {
    const withTimestamps = completedMissions
      .filter(m => m.completedAt != null)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
    if (withTimestamps.length === 0) return completedMissions.length * 5;

    const SESSION_GAP_MS = 30 * 60 * 1000;
    const MIN_PER_MISSION = 5;
    let totalMinutes = 0;
    let sessionStart = new Date(withTimestamps[0].completedAt!).getTime();
    let sessionLast = sessionStart;
    let sessionCount = 1;

    for (let i = 1; i < withTimestamps.length; i++) {
      const t = new Date(withTimestamps[i].completedAt!).getTime();
      if (t - sessionLast <= SESSION_GAP_MS) {
        sessionLast = t;
        sessionCount++;
      } else {
        const sessionSpanMin = Math.round((sessionLast - sessionStart) / 60000);
        totalMinutes += Math.max(sessionSpanMin + MIN_PER_MISSION, sessionCount * MIN_PER_MISSION);
        sessionStart = t;
        sessionLast = t;
        sessionCount = 1;
      }
    }
    const sessionSpanMin = Math.round((sessionLast - sessionStart) / 60000);
    totalMinutes += Math.max(sessionSpanMin + MIN_PER_MISSION, sessionCount * MIN_PER_MISSION);
    return totalMinutes;
  })();

  const subjectScores: Record<string, { total: number; count: number }> = {};
  for (const p of progress) {
    if (!subjectScores[p.subject]) subjectScores[p.subject] = { total: 0, count: 0 };
    subjectScores[p.subject].total += p.score;
    subjectScores[p.subject].count += 1;
  }
  const avgBySubject = Object.entries(subjectScores).map(([subject, { total, count }]) => ({
    subject,
    score: Math.round(total / count),
  })).sort((a, b) => b.score - a.score);

  const strengths = avgBySubject.slice(0, 2);
  const weaknesses = avgBySubject.slice(-2).reverse().filter(s => s.score < 70);

  const unlockedZones = ZONE_ORDER.filter(zoneName => {
    const zone = { "Math Island": 0, "Reading Forest": 30, "Logic Mountain": 80, "English City": 150, "Science Planet": 250 };
    return (progressChild?.xp ?? 0) >= zone[zoneName as keyof typeof zone];
  });

  const badges = (progressChild?.badgesEarned ?? []) as Badge[];

  const tabs = [
    { id: "children", label: t.parent.tabChildren, icon: Users },
    { id: "progress", label: t.parent.tabProgress, icon: LineChart },
    { id: "memories", label: plbl.tabMemories, icon: BrainCircuit },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-foreground">{t.parent.title}</h1>
        <p className="text-muted-foreground mt-2">{t.parent.subtitle}</p>
      </div>

      {!family && (
        <div className="bg-card p-8 rounded-[2rem] shadow-lg border border-border/50 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{plbl.createFamilyTitle}</h2>
              <p className="text-muted-foreground">{plbl.createFamilySubtitle}</p>
            </div>
          </div>
          <form onSubmit={familyForm.handleSubmit(onFamilySubmit)} className="space-y-4 max-w-md">
            <div>
              <input
                {...familyForm.register("name")}
                placeholder={plbl.familyNamePlaceholder}
                className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {familyForm.formState.errors.name && (
                <p className="text-destructive text-sm mt-1">{familyForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  {...familyForm.register("country")}
                  placeholder={plbl.countryPlaceholder}
                  className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {familyForm.formState.errors.country && (
                  <p className="text-destructive text-sm mt-1">{familyForm.formState.errors.country.message}</p>
                )}
              </div>
              <div className="flex-1">
                <input
                  {...familyForm.register("language")}
                  placeholder={plbl.languagePlaceholder}
                  className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {familyForm.formState.errors.language && (
                  <p className="text-destructive text-sm mt-1">{familyForm.formState.errors.language.message}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={createFamily.isPending}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              {createFamily.isPending ? plbl.creatingFamily : plbl.createFamilyBtn}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2 border-b border-border/50 mb-8 overflow-x-auto hide-scrollbar">
        {tabs.map(tabItem => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-2 px-6 py-4 font-bold border-b-2 transition-all shrink-0 ${
              tab === tabItem.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tabItem.icon className="w-5 h-5" /> {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "children" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t.parent.sectionChildProfiles}</h2>
            {family && (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-5 h-5" /> {t.buttons.addChild}
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{plbl.addChildDialogTitle}</DialogTitle></DialogHeader>
                  <form onSubmit={childForm.handleSubmit(onChildSubmit)} className="space-y-4 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{plbl.addChildNameLabel}</label>
                      <input {...childForm.register("name")} placeholder={plbl.addChildNamePlaceholder} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      {childForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{childForm.formState.errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{plbl.addChildGradeLabel}</label>
                      <select {...childForm.register("grade")} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                        <option value="">{plbl.selectGrade}</option>
                        {GRADE_OPTIONS.map(g => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                      {childForm.formState.errors.grade && <p className="text-destructive text-xs mt-1">{plbl.selectGrade}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{plbl.addChildLanguageLabel}</label>
                      <select {...childForm.register("language")} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                        <option value="">{plbl.selectLanguage}</option>
                        {LANGUAGE_OPTIONS.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{plbl.addChildCountryLabel}</label>
                      <input {...childForm.register("country")} placeholder="e.g. USA, BG, DE, ES, GB" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <p className="text-xs text-muted-foreground mt-1">{plbl.addChildCountryHint}</p>
                    </div>
                    <button type="submit" disabled={createChild.isPending} className="w-full bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary/90">
                      {createChild.isPending ? plbl.savingProfile : plbl.saveProfile}
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map(child => {
              const childBadges = (child.badgesEarned ?? []) as Badge[];
              const level = getLevel(child.xp);
              const cardI18n = getProfileI18n(child.language);
              return (
                <div key={child.id} className="bg-card p-6 rounded-[2rem] shadow-lg border border-border/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditDialog(child)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChild(child.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center text-3xl mb-4">
                    {child.avatar || "👦"}
                  </div>
                  <h3 className="text-xl font-bold">{child.name}</h3>
                  <p className="text-muted-foreground mb-2">{getGradeDisplay(child.grade, child.language)} · {child.country}</p>
                  {child.aiCharacter && COMPANION_DATA[child.aiCharacter] ? (
                    <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border ${COMPANION_DATA[child.aiCharacter].color}`}>
                      <span className="text-2xl flex-shrink-0">👧</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm flex items-center gap-1 flex-wrap">
                          AYA
                          <span className="text-[10px] font-semibold bg-white/60 px-1.5 py-0.5 rounded-full border border-black/10">
                            {COMPANION_DATA[child.aiCharacter].emoji} {COMPANION_DATA[child.aiCharacter].name}
                          </span>
                        </div>
                        <div className={`text-[10px] font-semibold uppercase tracking-wider ${COMPANION_DATA[child.aiCharacter].accentColor}`}>
                          {t.parent.toneStyle[COMPANION_DATA[child.aiCharacter].tone] ?? `${COMPANION_DATA[child.aiCharacter].tone} style`} · {t.parent.aiCompanion}
                        </div>
                      </div>
                      <button
                        onClick={() => openCompanionPicker(child)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                        title="Change companion"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCompanionPicker(child)}
                      className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border border-dashed border-muted-foreground/30 hover:border-primary/40 hover:bg-primary/5 transition-all w-full text-left"
                    >
                      <Sparkles className="w-4 h-4 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground italic">{cardI18n.noCompanion}</span>
                    </button>
                  )}
                  <div className="flex gap-4 mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{cardI18n.levelLbl}</span>
                      <span className="font-bold text-primary">{level}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{cardI18n.xpLbl}</span>
                      <span className="font-bold text-orange-600">{child.xp}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{cardI18n.starsLbl}</span>
                      <span className="font-bold text-yellow-600">{child.stars}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{cardI18n.badgesLbl}</span>
                      <span className="font-bold text-purple-600">{childBadges.length}</span>
                    </div>
                  </div>
                  {childBadges.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {childBadges.slice(0, 5).map(b => (
                        <span key={b.id} title={b.title} className="text-lg">{b.icon}</span>
                      ))}
                      {childBadges.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{childBadges.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {children.length === 0 && family && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-3xl border border-dashed">
                {plbl.noChildProfiles}
              </div>
            )}
            {!family && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-3xl border border-dashed">
                {plbl.noFamilyYet}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "progress" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t.parent.sectionLearningProgress}</h2>
            {children.length > 1 && (
              <select
                value={progressChildId}
                onChange={(e) => setSelectedChildId(Number(e.target.value))}
                className="p-2 rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {children.length === 1 && children[0] && (
              <span className="text-sm text-muted-foreground font-medium">{children[0].name}</span>
            )}
          </div>

          {progressChild && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-3xl font-bold text-primary">{getLevel(progressChild.xp)}</div>
                <div className="text-sm text-muted-foreground mt-1">{plbl.statLevel}</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-3xl font-bold text-orange-500">{progressChild.xp}</div>
                <div className="text-sm text-muted-foreground mt-1">{plbl.statTotalXP}</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-3xl font-bold text-yellow-500">{progressChild.stars}</div>
                <div className="text-sm text-muted-foreground mt-1">{plbl.statStars}</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-3xl font-bold text-green-500">{completedMissions.length}</div>
                <div className="text-sm text-muted-foreground mt-1">{plbl.statMissionsDone}</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-2xl font-bold">{getCurrentZone(progressChild.xp).emoji}</div>
                <div className="text-xs font-bold text-foreground mt-0.5 leading-tight">{PARENT_ZONE_NAMES[getCurrentZone(progressChild.xp).name]?.[lang] ?? getCurrentZone(progressChild.xp).name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{plbl.statCurrentZone}</div>
              </div>
              <div className={`p-4 rounded-2xl border shadow-sm text-center ${(homeworkToday?.count ?? 0) > 0 ? "bg-amber-50 border-amber-200" : "bg-card"}`}>
                <div className="text-3xl font-bold text-amber-500">{homeworkToday?.count ?? 0}</div>
                <div className="text-xs font-semibold text-amber-700 mt-0.5">{plbl.statHomework}</div>
                <div className="text-xs text-muted-foreground">{plbl.statSolvedToday}</div>
              </div>
            </div>
          )}

          {/* ── Voice Tutor stats ───────────────────────────────────── */}
          {progressChild && (
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border shadow-sm text-center ${(voiceStats?.sessionsToday ?? 0) > 0 ? "bg-violet-50 border-violet-200" : "bg-card"}`}>
                <div className="text-3xl font-bold text-violet-500">{voiceStats?.sessionsToday ?? 0}</div>
                <div className="text-xs font-semibold text-violet-700 mt-0.5">{plbl.statVoiceSessions}</div>
                <div className="text-xs text-muted-foreground">{plbl.statToday}</div>
              </div>
              <div className={`p-4 rounded-2xl border shadow-sm text-center ${(voiceStats?.minutesListened ?? 0) > 0 ? "bg-violet-50 border-violet-200" : "bg-card"}`}>
                <div className="text-3xl font-bold text-violet-500">{voiceStats?.minutesListened ?? 0}</div>
                <div className="text-xs font-semibold text-violet-700 mt-0.5">{plbl.statMinListened}</div>
                <div className="text-xs text-muted-foreground">{plbl.statToday}</div>
              </div>
            </div>
          )}

          {dailyPlan && progressChild && (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-2xl border border-violet-200 shadow-sm">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-sm text-violet-800">
                <BookOpen className="w-4 h-4 text-violet-600" />
                {plbl.dailyPlanTitle}
              </h3>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-violet-700">
                    {dailyPlan.tasks.filter(t => t.status === "completed").length}/{dailyPlan.tasks.length}
                  </div>
                  <div className="text-sm text-violet-600 font-medium">
                    {plbl.dailyPlanCompleted(
                      dailyPlan.tasks.filter(t => t.status === "completed").length,
                      dailyPlan.tasks.length,
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-600">
                    {dailyPlan.tasks
                      .filter(t => t.status === "completed")
                      .reduce((sum, t) => sum + t.xpReward, 0)}
                  </div>
                  <div className="text-xs text-amber-700 font-medium">{plbl.dailyPlanXpEarned}</div>
                </div>
              </div>
              <div className="w-full bg-violet-100 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${dailyPlan.tasks.length > 0 ? Math.round((dailyPlan.tasks.filter(t => t.status === "completed").length / dailyPlan.tasks.length) * 100) : 0}%` }}
                />
              </div>
            </div>
          )}

          {topicProgressData && (topicProgressData.summary.totalLessons > 0 || topicProgressData.summary.totalPractice > 0 || topicProgressData.summary.totalQuizzes > 0) && (
            <div className="bg-card p-5 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-blue-500" /> {plbl.curriculumEngineTitle}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center mb-1"><BookOpen className="w-4 h-4 text-blue-600" /></div>
                  <div className="text-2xl font-bold text-blue-700">{topicProgressData.summary.totalLessons}</div>
                  <div className="text-xs text-blue-600 font-medium mt-0.5">{plbl.statLessonsDone}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center mb-1"><span className="text-green-600">✏️</span></div>
                  <div className="text-2xl font-bold text-green-700">{topicProgressData.summary.totalPractice}</div>
                  <div className="text-xs text-green-600 font-medium mt-0.5">{plbl.statPracticeSets}</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center mb-1"><Brain className="w-4 h-4 text-purple-600" /></div>
                  <div className="text-2xl font-bold text-purple-700">{topicProgressData.summary.totalQuizzes}</div>
                  <div className="text-xs text-purple-600 font-medium mt-0.5">{plbl.statQuizzesPassed}</div>
                </div>
              </div>
            </div>
          )}

          {progressChild && progressChild.aiCharacter && COMPANION_DATA[progressChild.aiCharacter] && (
            <div className={`flex items-start gap-4 p-4 rounded-2xl border ${COMPANION_DATA[progressChild.aiCharacter].color}`}>
              <span className="text-4xl flex-shrink-0">👧</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-1.5 flex-wrap mb-0.5">
                  AYA
                  <span className="text-[10px] font-semibold bg-white/60 px-1.5 py-0.5 rounded-full border border-black/10">
                    {COMPANION_DATA[progressChild.aiCharacter].emoji} {COMPANION_DATA[progressChild.aiCharacter].name}
                  </span>
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${COMPANION_DATA[progressChild.aiCharacter].accentColor}`}>
                  {t.parent.toneStyle[COMPANION_DATA[progressChild.aiCharacter].tone] ?? `${COMPANION_DATA[progressChild.aiCharacter].tone} teaching style`} · Montessori {t.parent.aiCompanion}
                </div>
                <p className="text-xs text-muted-foreground">
                  {plbl.companionSupportText(progressChild.name)}
                </p>
              </div>
            </div>
          )}

          {completedMissions.length > 0 && (
            <div className="bg-card p-5 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4" /> {plbl.recentMissionActivity}
              </h3>
              <div className="space-y-2">
                {completedMissions.slice(-3).reverse().map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-green-500">✅</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.subject}</p>
                    </div>
                    {m.completedAt && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(m.completedAt as string).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(strengths.length > 0 || weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strengths.length > 0 && (
                <div className="bg-green-50 p-5 rounded-2xl border border-green-200">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-green-700">
                    <TrendingUp className="w-5 h-5" /> {plbl.subjectStrengths}
                  </h3>
                  {strengths.map(s => (
                    <div key={s.subject} className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">{s.subject}</span>
                      <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{s.score}%</span>
                    </div>
                  ))}
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-orange-700">
                    <TrendingDown className="w-5 h-5" /> {plbl.needsPractice}
                  </h3>
                  {weaknesses.map(s => (
                    <div key={s.subject} className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-800">{s.subject}</span>
                      <span className="text-sm font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{s.score}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Weekly Parent Progress (Phase 2B) ────────────────── */}
          {progressChild && (
            <ParentProgressCard
              childId={progressChild.id}
              lang={lang}
            />
          )}

          {/* ── Teacher Export Summary (Phase 2B) ─────────────────  */}
          {progressChild && (
            <TeacherExportCard
              childId={progressChild.id}
              grade={progressChild.grade}
              lang={lang}
            />
          )}

          {/* ── Improvement Areas (Smart Weakness Detection) ─────── */}
          {progressChild && (
            <ImprovementAreasCard
              weakTopics={weakTopics}
              lang={lang}
              plbl={plbl}
            />
          )}

          {/* ── Today's AI Learning Focus ─────────────────────────── */}
          {progressChild && (
            <AILearningFocusCard
              childId={progressChild.id}
              lang={lang}
              plbl={plbl}
            />
          )}

          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              {plbl.unlockedZones}
            </h3>
            <div className="flex flex-wrap gap-3">
              {ZONE_ORDER.map(zoneName => {
                const isUnlocked = unlockedZones.includes(zoneName);
                return (
                  <div
                    key={zoneName}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${
                      isUnlocked ? 'bg-green-50 border-green-200 text-green-700' : 'bg-muted/50 border-muted text-muted-foreground opacity-60'
                    }`}
                  >
                    <span>{ZONE_EMOJIS[zoneName]}</span>
                    <span>{PARENT_ZONE_NAMES[zoneName]?.[lang] ?? zoneName}</span>
                    {isUnlocked ? <span>✅</span> : <span>🔒</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {badges.length > 0 && (
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" /> {plbl.earnedBadges(badges.length)}
              </h3>
              <div className="flex flex-wrap gap-3">
                {badges.map(badge => (
                  <div key={badge.id} className="flex flex-col items-center gap-1 p-3 bg-yellow-50 rounded-xl border border-yellow-200 min-w-[72px] text-center">
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-xs font-bold">{badge.title}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(badge.earnedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {progress.length > 0 ? (
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4">{plbl.subjectPerformanceChart}</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgBySubject}>
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10 bg-card rounded-2xl border">{plbl.notEnoughData}</p>
          )}

          {missions.length > 0 && (
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" /> {plbl.missionActivity}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {completedMissions.slice(-10).reverse().map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-green-500 text-lg">✅</span>
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.subject} · {m.completedAt ? new Date(m.completedAt as string).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                ))}
                {pendingMissions.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                    <span className="text-muted-foreground text-lg">⏳</span>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.subject} · {plbl.missionPending}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "memories" && (
        <div>
          <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-psychology/20 to-transparent p-4 rounded-2xl">
            <BrainCircuit className="w-8 h-8 text-psychology" />
            <div>
              <h2 className="text-xl font-bold">{plbl.memoryEngineTitle}</h2>
              <p className="text-sm text-muted-foreground">{plbl.memoryEngineSubtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map(mem => (
              <div key={mem.id} className="bg-card p-5 rounded-2xl border shadow-sm flex items-start gap-4">
                <div className="w-2 min-h-[2rem] bg-psychology rounded-full shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded-md">
                      {mem.type.replace('_', ' ')}
                    </span>
                    {mem.module && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {plbl.memoryVia} {mem.module}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground">{mem.content}</p>
                  <p className="text-xs text-muted-foreground mt-3">{new Date(mem.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {memories.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                {plbl.memoryEngineGathering}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={companionPickerOpen} onOpenChange={setCompanionPickerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{plbl.companionPickerTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2 mb-4">
            {companionPickerChild ? plbl.companionPickerDesc(companionPickerChild.name) : plbl.companionPickerDescGeneric}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {COMPANION_CHARS.map(char => {
              const isSelected = companionPickerChild?.aiCharacter === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectCompanion(char.id)}
                  disabled={updateChild.isPending}
                  className={`p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] hover:shadow-md text-left ${
                    isSelected ? 'ring-2 ring-primary/50 border-primary shadow-md' : 'border-transparent hover:border-primary/30'
                  } ${char.color}`}
                >
                  <div className="text-4xl mb-2">{char.emoji}</div>
                  <div className="font-bold text-sm">{char.name}</div>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${char.accentColor}`}>{t.parent.toneStyle[char.tone] ?? char.tone}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{COMPANION_CHAR_DESCS[char.id]?.[lang] ?? char.desc}</div>
                  {isSelected && (
                    <div className="mt-2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block">{plbl.companionPickerCurrent}</div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCompanionPickerOpen(false)}
            className="mt-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            {plbl.companionPickerCancel}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editI18n.editTitle}</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{editI18n.nameLbl}</label>
              <input {...editForm.register("name")} placeholder={plbl.addChildNamePlaceholder} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              {editForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{editForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{editI18n.gradeLbl}</label>
              <select {...editForm.register("grade")} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                {editI18n.gradeOptions.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              {editForm.formState.errors.grade && <p className="text-destructive text-xs mt-1">{plbl.selectGrade}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{editI18n.langLbl}</label>
              <select {...editForm.register("language")} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                {LANGUAGE_OPTIONS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{editI18n.countryLbl}</label>
              <input {...editForm.register("country")} placeholder="e.g. USA, BG, DE, ES, GB" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <button type="submit" disabled={updateChild.isPending} className="w-full bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary/90">
              {updateChild.isPending ? "..." : editI18n.saveLbl}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
