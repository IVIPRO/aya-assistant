import { Layout } from "@/components/layout";
import { Chat } from "@/components/chat";
import { SubjectPanel } from "./subjects";
import { DailyPlanCard } from "@/components/DailyPlanCard";
import { AnimatedTeacher } from "@/components/AnimatedTeacher";
import { ListeningMode } from "@/components/ListeningMode";
import type { TeacherState } from "@/components/AnimatedTeacher";
import { Link } from "wouter";
import { Star, Trophy, Sparkles, Map, MessageCircle, Lock, CheckCircle2, Mic, Volume2, Video, ChevronRight, ArrowLeft, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListChildren, useUpdateChild, useListMissions, useListProgress, getListChildrenQueryKey, getListMissionsQueryKey, getListProgressQueryKey } from "@workspace/api-client-react";
import { useState, useEffect, useCallback, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Badge, Child, Mission, UpdateChildBodyAiCharacter } from "@workspace/api-client-react";
import type { Subject, Topic } from "@/lib/curriculum";
import { resolveLang } from "@/lib/i18n";
import { getLevel, getLevelProgress as getLevelProgressObj, LEVEL_THRESHOLDS, LEVEL_NAMES } from "@/lib/levelSystem";

const CHARACTERS = [
  {
    id: "panda",
    name: "AYA Panda",
    emoji: "🐼",
    color: "bg-green-100 border-green-300",
    accentColor: "text-green-700",
    desc: "Patient and gentle",
    tone: "gentle" as const,
    personality: "Panda takes learning step by step with warmth and care. Perfect for children who love calm, patient guidance through every new idea.",
  },
  {
    id: "robot",
    name: "AYA Robot",
    emoji: "🤖",
    color: "bg-blue-100 border-blue-300",
    accentColor: "text-blue-700",
    desc: "Logical and precise",
    tone: "encouraging" as const,
    personality: "Robot celebrates every correct answer and keeps learning clear and organized. Great for children who love structure and being cheered on.",
  },
  {
    id: "fox",
    name: "AYA Fox",
    emoji: "🦊",
    color: "bg-orange-100 border-orange-300",
    accentColor: "text-orange-700",
    desc: "Creative and playful",
    tone: "playful" as const,
    personality: "Fox turns every lesson into an adventure with games, stories, and surprises. Ideal for curious, energetic explorers who love discovering new things.",
  },
  {
    id: "owl",
    name: "AYA Owl",
    emoji: "🦉",
    color: "bg-purple-100 border-purple-300",
    accentColor: "text-purple-700",
    desc: "Wise and thoughtful",
    tone: "calm" as const,
    personality: "Owl guides deep thinking without rushing, encouraging reflection and curiosity. Best for children who love asking \"why?\" and thinking things through.",
  },
];

type JuniorLang = "en" | "bg" | "es";

const ZONE_NAMES_I18N: Record<string, Record<JuniorLang, string>> = {
  "Math Island":    { en: "Math Island",    bg: "Остров на математиката", es: "Isla de matemáticas" },
  "Reading Forest": { en: "Reading Forest", bg: "Гора на четенето",        es: "Bosque de lectura" },
  "Logic Mountain": { en: "Logic Mountain", bg: "Логическа планина",       es: "Montaña de lógica" },
  "English City":   { en: "English City",   bg: "Английски град",          es: "Ciudad de inglés" },
  "Science Planet": { en: "Science Planet", bg: "Планетата на науката",    es: "Planeta de ciencias" },
};

const ZONE_DESCS_I18N: Record<string, Record<JuniorLang, string>> = {
  "Math Island":    { en: "Numbers & counting",   bg: "Числа и смятане",              es: "Números y cálculo" },
  "Reading Forest": { en: "Words & stories",      bg: "Думи и истории",               es: "Palabras e historias" },
  "Logic Mountain": { en: "Puzzles & patterns",   bg: "Загадки и закономерности",     es: "Acertijos y patrones" },
  "English City":   { en: "Language & speaking",  bg: "Език и говорене",              es: "Idioma y habla" },
  "Science Planet": { en: "Nature & discovery",   bg: "Природа и открития",           es: "Naturaleza y descubrimientos" },
};

const JUNIOR_LABELS: Record<JuniorLang, {
  welcomeBack: string;
  readyAdventure: (name: string) => string;
  readyAdventureNoChar: string;
  toneLabel: (tone: string) => string;
  toneBadge: Record<string, string>;
  montessoriNote: string;
  classLabel: string;
  countryLabel: string;
  languageLabel: string;
  enterWorld: string;
  chatWith: (charFirstName: string) => string;
  changeCompanion: string;
  xpToNextLevel: (current: number) => string;
  starsLabel: string;
  xpTotalLabel: string;
  pickerTitle: string;
  pickerSubtitle: string;
  currentCompanion: string;
  cancel: string;
  back: string;
  openWorldMap: string;
  toneStyle: (tone: string) => string;
  activeChild: string;
  subjectPrefix: string;
  topicPrefix: string;
  missionsCount: (done: number, total: number) => string;
  noMissions: string;
  allDone: string;
  missionsLeft: (n: number) => string;
  unlockAtXp: (xp: number) => string;
  levelLabel: string;
  comingSoon: string;
  loadingProfile: string;
  noChildFound: string;
  noChildFoundHint: string;
  voiceTalkTitle: string;
  voiceTalkDesc: string;
  voiceListenTitle: string;
  voiceListenDesc: string;
  voiceVideoTitle: string;
  voiceVideoDesc: string;
  lessons: string;
  freeChatLabel: string;
}> = {
  en: {
    welcomeBack: "Welcome back,",
    readyAdventure: (name) => `${name} is ready for today's learning adventure! Let's discover something amazing together.`,
    readyAdventureNoChar: "AYA is ready for today's learning adventure!",
    toneLabel: (tone) => `${tone} learning style`,
    toneBadge: {
      gentle: "GENTLE LEARNING STYLE",
      encouraging: "ENCOURAGING LEARNING STYLE",
      playful: "PLAYFUL LEARNING STYLE",
      calm: "CALM LEARNING STYLE",
    },
    montessoriNote: "AYA uses a Montessori-inspired learning style — guiding discovery, not just giving answers ✨",
    classLabel: "Class",
    countryLabel: "Country",
    languageLabel: "Language",
    enterWorld: "Enter Learning World",
    chatWith: (n) => `Chat with ${n}`,
    changeCompanion: "Change Companion",
    xpToNextLevel: (cur) => `${cur}/100 XP to next level`,
    starsLabel: "stars",
    xpTotalLabel: "XP total",
    pickerTitle: "Choose Your Learning Companion!",
    pickerSubtitle: "Your companion will guide you through every mission with their own special teaching style 🎓",
    currentCompanion: "✓ Current companion",
    cancel: "Cancel",
    back: "Back",
    openWorldMap: "Open Full World Map",
    toneStyle: (tone) => `· ${tone} style`,
    activeChild: "Active child",
    subjectPrefix: "Subject",
    topicPrefix: "Topic",
    missionsCount: (done, total) => `${done}/${total} missions`,
    noMissions: "No missions yet",
    allDone: "✅ All done!",
    missionsLeft: (n) => `${n} missions left →`,
    unlockAtXp: (xp) => `🔒 Unlock at ${xp} XP`,
    levelLabel: "Level",
    comingSoon: "Coming Soon",
    loadingProfile: "Loading profile…",
    noChildFound: "No child profile found.",
    noChildFoundHint: "Ask your parent to add a profile.",
    voiceTalkTitle: "Talk with AYA",
    voiceTalkDesc: "Speak your questions and AYA will listen and respond to your voice.",
    voiceListenTitle: "Listen Mode",
    voiceListenDesc: "AYA reads lessons, stories, and missions aloud for you.",
    voiceVideoTitle: "Video Teacher",
    voiceVideoDesc: "Meet AYA's animated video teacher for interactive face-to-face lessons.",
    lessons: "Lessons",
    freeChatLabel: "Free chat",
  },
  bg: {
    welcomeBack: "Добре дошла,",
    readyAdventure: (name) => `${name} е готова за днешното учебно приключение! Нека открием нещо чудесно заедно.`,
    readyAdventureNoChar: "AYA е готова за днешното учебно приключение!",
    toneLabel: (tone) => `${tone} стил на учене`,
    toneBadge: {
      gentle: "НЕЖЕН СТИЛ НА УЧЕНЕ",
      encouraging: "НАСЪРЧАВАЩ СТИЛ НА УЧЕНЕ",
      playful: "ИГРИВ СТИЛ НА УЧЕНЕ",
      calm: "СПОКОЕН СТИЛ НА УЧЕНЕ",
    },
    montessoriNote: "AYA използва Монтесори-вдъхновен стил на учене — насочва откритието, а не просто дава отговори ✨",
    classLabel: "Клас",
    countryLabel: "Страна",
    languageLabel: "Език",
    enterWorld: "Влез в Учебния свят",
    chatWith: (n) => `Чат с ${n}`,
    changeCompanion: "Смени компаньона",
    xpToNextLevel: (cur) => `${cur}/100 XP до следващо ниво`,
    starsLabel: "звезди",
    xpTotalLabel: "XP общо",
    pickerTitle: "Избери своя учебен компаньон!",
    pickerSubtitle: "Твоят компаньон ще те води през всяка мисия с особен стил на преподаване 🎓",
    currentCompanion: "✓ Текущ компаньон",
    cancel: "Отказ",
    back: "Назад",
    openWorldMap: "Отвори пълната карта на света",
    toneStyle: (tone) => `· ${tone} стил`,
    activeChild: "Активно дете",
    subjectPrefix: "Предмет",
    topicPrefix: "Тема",
    missionsCount: (done, total) => `${done}/${total} мисии`,
    noMissions: "Все още няма мисии",
    allDone: "✅ Всичко готово!",
    missionsLeft: (n) => `${n} мисии остават →`,
    unlockAtXp: (xp) => `🔒 Отключва се при ${xp} XP`,
    levelLabel: "Ниво",
    comingSoon: "Очаквайте",
    loadingProfile: "Зарежда профил…",
    noChildFound: "Профилът не е намерен.",
    noChildFoundHint: "Поискайте от родителя си да добави профил.",
    voiceTalkTitle: "Говори с AYA",
    voiceTalkDesc: "Говори въпросите си и AYA ще слуша и отговаря на гласа ти.",
    voiceListenTitle: "Режим на слушане",
    voiceListenDesc: "AYA чете уроци, истории и мисии на глас за теб.",
    voiceVideoTitle: "Видео учител",
    voiceVideoDesc: "Запознай се с анимирания видео учител на AYA за интерактивни уроци лице в лице.",
    lessons: "Уроци",
    freeChatLabel: "Свободен разговор",
  },
  es: {
    welcomeBack: "Bienvenida,",
    readyAdventure: (name) => `¡${name} está lista para la aventura de aprendizaje de hoy! Descubramos algo increíble juntos.`,
    readyAdventureNoChar: "¡AYA está lista para la aventura de aprendizaje de hoy!",
    toneLabel: (tone) => `estilo ${tone}`,
    toneBadge: {
      gentle: "ESTILO SUAVE",
      encouraging: "ESTILO MOTIVADOR",
      playful: "ESTILO LÚDICO",
      calm: "ESTILO TRANQUILO",
    },
    montessoriNote: "AYA usa un estilo de aprendizaje inspirado en Montessori — guiando el descubrimiento, no solo dando respuestas ✨",
    classLabel: "Clase",
    countryLabel: "País",
    languageLabel: "Idioma",
    enterWorld: "Entrar al Mundo de Aprendizaje",
    chatWith: (n) => `Chat con ${n}`,
    changeCompanion: "Cambiar compañero",
    xpToNextLevel: (cur) => `${cur}/100 XP al siguiente nivel`,
    starsLabel: "estrellas",
    xpTotalLabel: "XP total",
    pickerTitle: "¡Elige tu compañero de aprendizaje!",
    pickerSubtitle: "Tu compañero te guiará en cada misión con su propio estilo de enseñanza 🎓",
    currentCompanion: "✓ Compañero actual",
    cancel: "Cancelar",
    back: "Atrás",
    openWorldMap: "Abrir el mapa completo",
    toneStyle: (tone) => `· estilo ${tone}`,
    activeChild: "Niño activo",
    subjectPrefix: "Asignatura",
    topicPrefix: "Tema",
    missionsCount: (done, total) => `${done}/${total} misiones`,
    noMissions: "Aún sin misiones",
    allDone: "✅ ¡Todo listo!",
    missionsLeft: (n) => `${n} misiones restantes →`,
    unlockAtXp: (xp) => `🔒 Se desbloquea en ${xp} XP`,
    levelLabel: "Nivel",
    comingSoon: "Próximamente",
    loadingProfile: "Cargando perfil…",
    noChildFound: "No se encontró perfil.",
    noChildFoundHint: "Pide a tu padre que añada un perfil.",
    voiceTalkTitle: "Habla con AYA",
    voiceTalkDesc: "Habla tus preguntas y AYA escuchará y responderá a tu voz.",
    voiceListenTitle: "Modo de escucha",
    voiceListenDesc: "AYA lee lecciones, historias y misiones en voz alta para ti.",
    voiceVideoTitle: "Maestro en video",
    voiceVideoDesc: "Conoce al maestro de video animado de AYA para lecciones interactivas cara a cara.",
    lessons: "Lecciones",
    freeChatLabel: "Chat libre",
  },
};

const CHAR_LABELS: Record<string, Record<JuniorLang, { desc: string; personality: string; tone: string }>> = {
  panda: {
    en: { desc: "Patient and gentle", tone: "gentle", personality: "Panda takes learning step by step with warmth and care. Perfect for children who love calm, patient guidance through every new idea." },
    bg: { desc: "Търпелива и нежна", tone: "нежен", personality: "AYA Panda учи стъпка по стъпка с топлота и грижа. Перфектна за деца, обичащи спокойно и търпеливо ръководство при всяка нова идея." },
    es: { desc: "Paciente y suave", tone: "suave", personality: "AYA Panda aprende paso a paso con calidez y cuidado. Perfecta para niños que aman la guía tranquila y paciente ante cada nueva idea." },
  },
  robot: {
    en: { desc: "Logical and precise", tone: "encouraging", personality: "Robot celebrates every correct answer and keeps learning clear and organized. Great for children who love structure and being cheered on." },
    bg: { desc: "Логичен и точен", tone: "насърчаващ", personality: "AYA Robot отбелязва всеки верен отговор и прави ученето ясно и организирано. Страхотна за деца, обичащи структура и насърчение." },
    es: { desc: "Lógico y preciso", tone: "motivador", personality: "AYA Robot celebra cada respuesta correcta y mantiene el aprendizaje claro y organizado. Ideal para niños que aman la estructura y el apoyo." },
  },
  fox: {
    en: { desc: "Creative and playful", tone: "playful", personality: "Fox turns every lesson into an adventure with games, stories, and surprises. Ideal for curious, energetic explorers who love discovering new things." },
    bg: { desc: "Творческа и игрива", tone: "игрив", personality: "AYA Лисицата превръща всеки урок в приключение с игри, истории и изненади. Идеална за любопитни и пълни с енергия изследователи." },
    es: { desc: "Creativa y lúdica", tone: "lúdico", personality: "AYA Zorro convierte cada lección en una aventura con juegos, historias y sorpresas. Ideal para exploradores curiosos y llenos de energía." },
  },
  owl: {
    en: { desc: "Wise and thoughtful", tone: "calm", personality: "Owl guides deep thinking without rushing, encouraging reflection and curiosity. Best for children who love asking \"why?\" and thinking things through." },
    bg: { desc: "Мъдра и вдумчива", tone: "спокоен", personality: "AYA Бухалът насочва дълбокото мислене без бързане, насърчавайки размисъл и любопитство. Най-добра за деца, обичащи да питат \"защо?\"." },
    es: { desc: "Sabia y reflexiva", tone: "tranquilo", personality: "AYA Búho guía el pensamiento profundo sin apresurarse, fomentando la reflexión y la curiosidad. Ideal para niños que aman preguntar \"¿por qué?\"." },
  },
};

const ZONES = [
  { id: "Math Island", emoji: "🏝️", color: "text-orange-600", bgColor: "bg-gradient-to-br from-orange-100 to-yellow-50", borderColor: "border-orange-300", xpRequired: 0, desc: "Numbers & counting" },
  { id: "Reading Forest", emoji: "🌲", color: "text-green-600", bgColor: "bg-gradient-to-br from-green-100 to-emerald-50", borderColor: "border-green-300", xpRequired: 30, desc: "Words & stories" },
  { id: "Logic Mountain", emoji: "⛰️", color: "text-blue-600", bgColor: "bg-gradient-to-br from-blue-100 to-sky-50", borderColor: "border-blue-300", xpRequired: 80, desc: "Puzzles & patterns" },
  { id: "English City", emoji: "🏙️", color: "text-purple-600", bgColor: "bg-gradient-to-br from-purple-100 to-violet-50", borderColor: "border-purple-300", xpRequired: 150, desc: "Language & speaking" },
  { id: "Science Planet", emoji: "🌍", color: "text-teal-600", bgColor: "bg-gradient-to-br from-teal-100 to-cyan-50", borderColor: "border-teal-300", xpRequired: 250, desc: "Nature & discovery" },
];

const JUNIOR_PROMPTS_BY_LANG: Record<string, string[]> = {
  en: [
    "Help me with math",
    "Let's read together",
    "Ask me a logic question",
    "Practice English",
  ],
  bg: [
    "Помогни ми с математика",
    "Да четем заедно",
    "Задай ми логически въпрос",
    "Упражнявай с мен английски",
  ],
  es: [
    "Ayúdame con matemáticas",
    "Leamos juntos",
    "Hazme una pregunta de lógica",
    "Practicar inglés",
  ],
};

function getLang(language?: string | null): "bg" | "es" | "en" {
  const l = (language ?? "").toLowerCase();
  if (l.includes("bulgar") || l === "bg") return "bg";
  if (l.includes("spanish") || l.includes("español") || l === "es") return "es";
  return "en";
}

function getJuniorPrompts(language?: string | null): string[] {
  return JUNIOR_PROMPTS_BY_LANG[getLang(language)] ?? JUNIOR_PROMPTS_BY_LANG.en;
}

function getMissionZone(mission: Mission): string {
  if (mission.zone) return mission.zone;
  const subj = mission.subject.toLowerCase();
  if (subj.includes("math") || subj.includes("матем") || subj.includes("maths")) return "Math Island";
  if (subj.includes("read") || subj.includes("четен") || subj.includes("deutsch") || subj.includes("lengua")) return "Reading Forest";
  if (subj.includes("logic") || subj.includes("логика")) return "Logic Mountain";
  if (subj.includes("english") || subj.includes("английски") || subj.includes("englisch") || subj.includes("inglés")) return "English City";
  return "Science Planet";
}

function getLevelProgress(xp: number): number {
  const p = getLevelProgressObj(xp);
  return p.xpInLevel;
}

/* ── Phase 1 Gamification: Calculate streak from progress dates ────── */
function calculateStreakFromProgressDates(progressDates: Date[]): number {
  if (progressDates.length === 0) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get unique days from progress dates
  const uniqueDays = new Set<string>();
  progressDates.forEach(date => {
    const d = new Date(date);
    const dayStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    uniqueDays.add(dayStr);
  });

  const sortedDays = Array.from(uniqueDays)
    .map(dayStr => {
      const [year, month, date] = dayStr.split("-").map(Number);
      return new Date(year, month, date);
    })
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if streak starts today or yesterday
  const latestDay = sortedDays[0];
  const daysDiff = Math.floor((today.getTime() - latestDay.getTime()) / (86400000)); // ms per day

  if (daysDiff > 1) return 0; // Streak broken

  // Count consecutive days backward
  let streak = 1;
  let currentDay = new Date(latestDay);

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = sortedDays[i];
    const dayDiff = Math.floor(
      (currentDay.getTime() - prevDay.getTime()) / 86400000
    );

    if (dayDiff === 1) {
      streak++;
      currentDay = new Date(prevDay);
    } else {
      break;
    }
  }

  return streak;
}

function getGradeLabel(grade: number, country: string): string {
  const c = (country ?? "").toUpperCase().slice(0, 2);
  if (c === "DE") return `Klasse ${grade}`;
  if (c === "ES") return `${grade}º de Primaria`;
  if (c === "BG") return `${grade} клас`;
  if (c === "GB") return `Year ${grade + 1}`;
  return `Grade ${grade}`;
}

type JuniorView = "welcome" | "map" | "subjects" | "chat";

function CharacterPicker({ child, onSelect, onClose }: { child: Child; onSelect: (char: UpdateChildBodyAiCharacter) => void; onClose: () => void }) {
  const lang = getLang(child.language);
  const lbl = JUNIOR_LABELS[lang];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display font-bold mb-1 text-center">{lbl.pickerTitle}</h2>
        <p className="text-muted-foreground text-center mb-6 text-sm">{lbl.pickerSubtitle}</p>
        <div className="grid grid-cols-2 gap-4">
          {CHARACTERS.map(char => {
            const isSelected = child.aiCharacter === char.id;
            const charLbl = CHAR_LABELS[char.id]?.[lang];
            return (
              <button key={char.id} onClick={() => onSelect(char.id as UpdateChildBodyAiCharacter)}
                className={`p-5 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-lg text-left ${isSelected ? 'border-junior shadow-lg ring-2 ring-junior/50' : 'border-transparent hover:border-junior/50'} ${char.color}`}>
                <div className="text-5xl mb-3">{char.emoji}</div>
                <div className="font-bold text-base mb-0.5">{char.name}</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${char.accentColor}`}>{charLbl?.tone ?? char.tone}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{charLbl?.personality ?? char.personality}</div>
                {isSelected && (
                  <div className="mt-3 text-xs font-bold text-junior-foreground bg-junior px-2 py-1 rounded-full inline-block">{lbl.currentCompanion}</div>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 text-muted-foreground hover:text-foreground font-medium transition-colors">{lbl.cancel}</button>
      </motion.div>
    </motion.div>
  );
}

function WelcomeScreen({ child, character, streak, onEnterWorld, onChat, onLessons, onChangeCompanion }: {
  child: Child;
  character: typeof CHARACTERS[0] | undefined;
  streak: number;
  onEnterWorld: () => void;
  onChat: () => void;
  onLessons: () => void;
  onChangeCompanion: () => void;
}) {
  const lang = getLang(child.language);
  const lbl = JUNIOR_LABELS[lang];
  const charLbl = character ? (CHAR_LABELS[character.id]?.[lang] ?? null) : null;

  const level = getLevel(child.xp ?? 0);
  const levelProgress = getLevelProgress(child.xp ?? 0);
  const gradeLabel = getGradeLabel(child.grade, child.country ?? "");
  const badges = (child.badgesEarned ?? []) as Badge[];

  const welcomeMsg = character
    ? lbl.readyAdventure(character.name)
    : lbl.readyAdventureNoChar;

  const charFirstName = character?.name?.split(" ")[1] ?? "AYA";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-[2.5rem] border-4 border-yellow-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-junior/80 to-junior/60 px-8 pt-8 pb-6 text-center">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
            className="text-8xl mb-4 drop-shadow-lg leading-none">
            {character?.emoji ?? "🌟"}
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-junior-foreground mb-1">
            {lbl.welcomeBack} {child.name}!
          </h1>
          <p className="text-junior-foreground/80 font-medium text-base">{welcomeMsg}</p>
        </div>

        <div className="px-8 py-6 space-y-5">
          {character && (
            <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 ${character.color}`}>
              <div className="text-4xl">{character.emoji}</div>
              <div>
                <div className="font-bold text-base">{character.name}</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${character.accentColor}`}>
                  {lbl.toneBadge[character.tone] ?? lbl.toneLabel(charLbl?.tone ?? character.tone)}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  {charLbl?.personality ?? character.personality}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 text-center border border-border/30 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">{lbl.classLabel}</div>
              <div className="font-bold text-sm">{gradeLabel}</div>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center border border-border/30 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">{lbl.countryLabel}</div>
              <div className="font-bold text-sm">{child.country ?? "—"}</div>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center border border-border/30 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">{lbl.languageLabel}</div>
              <div className="font-bold text-sm">{child.language ?? "—"}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-sm">{lbl.levelLabel} {level}</span>
                {streak > 0 && <span className="text-sm">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  {child.stars ?? 0} {lbl.starsLabel}
                </span>
                <span>{child.xp ?? 0} {lbl.xpTotalLabel}</span>
              </div>
            </div>
            <div className="w-full h-3 bg-yellow-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{lbl.xpToNextLevel(levelProgress)}</span>
              {badges.length > 0 && (
                <span className="flex gap-0.5">{badges.slice(0, 4).map(b => <span key={b.id}>{b.icon}</span>)}{badges.length > 4 && `+${badges.length - 4}`}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onEnterWorld}
              className="w-full py-4 bg-junior text-junior-foreground rounded-2xl font-bold text-lg shadow-lg border-b-4 border-yellow-600 hover:border-b-2 hover:translate-y-0.5 transition-all flex items-center justify-center gap-3">
              <Map className="w-6 h-6" />
              {lbl.enterWorld}
              <ChevronRight className="w-5 h-5" />
            </motion.button>

            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onChat}
                className="py-3 bg-white border-2 border-junior/40 text-junior-foreground rounded-2xl font-bold text-sm shadow-md hover:bg-junior/5 transition-all flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {lbl.chatWith(charFirstName)}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onLessons}
                className="py-3 bg-white border-2 border-yellow-200 text-yellow-700 rounded-2xl font-bold text-sm shadow-md hover:bg-yellow-50 transition-all flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" />
                {lbl.lessons}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onChangeCompanion}
                className="py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-2xl font-bold text-sm shadow-md hover:bg-purple-50 transition-all flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                {lbl.changeCompanion}
              </motion.button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground italic">
              {lbl.montessoriNote}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VoiceReadySection({
  lbl,
  onOpenListening,
}: {
  lbl: typeof JUNIOR_LABELS["en"];
  onOpenListening: () => void;
}) {
  const voiceFeatures = [
    {
      icon: Mic,
      title: lbl.voiceTalkTitle,
      desc: lbl.voiceTalkDesc,
      color: "from-blue-50 to-sky-50 border-blue-200",
      iconColor: "text-blue-500 bg-blue-100",
      isActive: true,
    },
    {
      icon: Volume2,
      title: lbl.voiceListenTitle,
      desc: lbl.voiceListenDesc,
      color: "from-green-50 to-emerald-50 border-green-200",
      iconColor: "text-green-500 bg-green-100",
      isActive: true,
      onClick: onOpenListening,
    },
    {
      icon: Video,
      title: lbl.voiceVideoTitle,
      desc: lbl.voiceVideoDesc,
      color: "from-purple-50 to-violet-50 border-purple-200",
      iconColor: "text-purple-500 bg-purple-100",
      isActive: false,
    },
  ];
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3">{lbl.comingSoon}</span>
        <div className="h-px flex-1 bg-border/40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {voiceFeatures.map((f) => (
          <button
            key={f.title}
            onClick={f.isActive ? f.onClick : undefined}
            disabled={!f.isActive}
            className={`bg-gradient-to-br ${f.color} border rounded-2xl p-4 flex flex-col gap-3 transition-all ${
              f.isActive
                ? "opacity-100 hover:shadow-md hover:scale-105 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.iconColor}`}>
              <f.icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</div>
            </div>
            <div className="mt-auto">
              {f.isActive ? (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                  ✨ Active
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/60 text-muted-foreground px-2 py-1 rounded-full border border-border/30">
                  {lbl.comingSoon}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Junior() {
  const { activeChildId, setActiveChildId } = useAuth();
  const { toast } = useToast();
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [view, setView] = useState<JuniorView>("welcome");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showListeningMode, setShowListeningMode] = useState(false);
  const [listeningContent, setListeningContent] = useState("");
  const [lastAyaMessage, setLastAyaMessage] = useState("");

  /* ── Plan teacher messages ─────────────────────────────────────────── */
  const PLAN_TEACHER_MESSAGES: Record<string, string[]> = {
    en: [
      "Here is your plan for today!",
      "Let's learn step by step.",
      "Ready for your first task?",
    ],
    bg: [
      "Ето твоя план за днес!",
      "Нека учим стъпка по стъпка.",
      "Готова ли си за първата задача?",
    ],
    es: [
      "¡Aquí está tu plan de hoy!",
      "Vamos paso a paso.",
      "¿Lista para tu primera tarea?",
    ],
  };
  const planMsgShownRef = useRef(false);

  /* ── Teacher state machine ─────────────────────────────────────────── */
  const [teacherState, setTeacherState]   = useState<TeacherState>("idle");
  const [teacherMsg,   setTeacherMsg]     = useState<string | undefined>(undefined);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTeacherStateChange = useCallback((state: TeacherState, message?: string) => {
    setTeacherState(state);
    setTeacherMsg(message);
    // Auto-return to idle after happy/encouraging/thinking
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (state === "happy" || state === "encouraging") {
      resetTimerRef.current = setTimeout(() => {
        setTeacherState("idle");
        setTeacherMsg(undefined);
      }, 6000);
    }
  }, []);

  const { data: children = [], isLoading: childrenLoading, refetch } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const updateChild = useUpdateChild();

  /* ── Sync view changes to teacher state ─────────────────────────── */
  useEffect(() => {
    if (view === "welcome")  handleTeacherStateChange("idle");
    if (view === "subjects") handleTeacherStateChange("thinking");
    if (view === "map")      handleTeacherStateChange("encouraging");
    if (view === "chat")     handleTeacherStateChange("talking");
  }, [view, handleTeacherStateChange]);

  /* ── Auto-select first child when no active child is set ────────── */
  useEffect(() => {
    if (!activeChildId && children.length > 0) {
      setActiveChildId(children[0].id);
    }
  }, [children, activeChildId, setActiveChildId]);

  /* ── Validate stored activeChildId still exists ─────────────────── */
  useEffect(() => {
    if (activeChildId && children.length > 0 && !children.find(c => c.id === activeChildId)) {
      setActiveChildId(children[0].id);
    }
  }, [children, activeChildId, setActiveChildId]);

  const activeChildIdResolved = activeChildId ?? children[0]?.id ?? null;

  const { data: missions = [] } = useListMissions(
    { childId: activeChildIdResolved ?? 0 },
    { query: { queryKey: getListMissionsQueryKey({ childId: activeChildIdResolved ?? 0 }), enabled: !!activeChildIdResolved } }
  );

  /* ── Phase 1 Gamification: Fetch progress to calculate streak ────── */
  const { data: progress = [] } = useListProgress(
    { childId: activeChildIdResolved ?? 0 },
    { query: { queryKey: getListProgressQueryKey({ childId: activeChildIdResolved ?? 0 }), enabled: !!activeChildIdResolved } }
  );
  const dailyStreak = calculateStreakFromProgressDates(
    progress.map(p => new Date(p.createdAt))
  );

  const activeChild = children.find(c => c.id === activeChildIdResolved) ?? null;
  const character = activeChild?.aiCharacter ?? null;
  const currentChar = CHARACTERS.find(c => c.id === character);
  const level = getLevel(activeChild?.xp ?? 0);
  const levelProgress = getLevelProgress(activeChild?.xp ?? 0);
  const badges = (activeChild?.badgesEarned ?? []) as Badge[];
  const childXp = activeChild?.xp ?? 0;

  const handleSelectCharacter = async (charId: UpdateChildBodyAiCharacter) => {
    if (!activeChildIdResolved) return;
    try {
      await updateChild.mutateAsync({ id: activeChildIdResolved, data: { aiCharacter: charId } });
      await refetch();
      setShowCharPicker(false);
      toast({ title: "Companion selected!", description: `${CHARACTERS.find(c => c.id === charId)?.name} is ready to help!` });
    } catch {
      toast({ title: "Error updating companion", variant: "destructive" });
    }
  };

  const childLang = resolveLang(activeChild?.language);
  const subjectContext = selectedSubject
    ? { subjectLabel: selectedSubject.label[childLang], topicLabel: selectedTopic?.label[childLang] ?? null }
    : null;

  const juniorLang = getLang(activeChild?.language);
  const lbl = JUNIOR_LABELS[juniorLang];

  const handlePlanLoaded = useCallback(() => {
    if (planMsgShownRef.current) return;
    planMsgShownRef.current = true;
    const msgs = PLAN_TEACHER_MESSAGES[juniorLang] ?? PLAN_TEACHER_MESSAGES.en;
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    setTimeout(() => handleTeacherStateChange("encouraging", msg), 800);
  }, [juniorLang, handleTeacherStateChange]);
  const GREETING_LABELS: Record<JuniorLang, {
    subjectGreeting: (name: string, subject: string, topic: string | null) => string;
    mainGreeting: (name: string, charName: string) => string;
    fallback: string;
  }> = {
    en: {
      subjectGreeting: (name, subject, topic) => `${currentChar?.emoji ?? "🌟"} Hi ${name}! Let's explore ${subject}${topic ? ` — ${topic}` : ""}. What would you like to know? 🚀`,
      mainGreeting: (name, charName) => `${currentChar?.emoji ?? "🌟"} Hi ${name}! I'm your ${charName} — using a Montessori teaching style to guide your learning adventure! What would you like to explore today? 🚀`,
      fallback: "Hello! I'm AYA. Let's learn something wonderful together! 🌟",
    },
    bg: {
      subjectGreeting: (name, subject, topic) => `${currentChar?.emoji ?? "🌟"} Здравей, ${name}! Да изследваме ${subject}${topic ? ` — ${topic}` : ""}. Какво искаш да научиш? 🚀`,
      mainGreeting: (name, charName) => `${currentChar?.emoji ?? "🌟"} Здравей, ${name}! Аз съм твоят ${charName} — водя те в учебното приключение с Монтесори стил! Какво искаш да изследваме днес? 🚀`,
      fallback: "Здравей! Аз съм AYA. Нека научим нещо чудесно заедно! 🌟",
    },
    es: {
      subjectGreeting: (name, subject, topic) => `${currentChar?.emoji ?? "🌟"} ¡Hola, ${name}! Exploremos ${subject}${topic ? ` — ${topic}` : ""}. ¿Qué quieres aprender? 🚀`,
      mainGreeting: (name, charName) => `${currentChar?.emoji ?? "🌟"} ¡Hola, ${name}! Soy tu ${charName} — guiando tu aventura de aprendizaje con el estilo Montessori! ¿Qué quieres explorar hoy? 🚀`,
      fallback: "¡Hola! Soy AYA. ¡Aprendamos algo maravilloso juntos! 🌟",
    },
  };
  const greetingLbl = GREETING_LABELS[juniorLang];
  const greeting = activeChild
    ? selectedSubject
      ? greetingLbl.subjectGreeting(activeChild.name, selectedSubject.label[childLang], selectedTopic?.label[childLang] ?? null)
      : greetingLbl.mainGreeting(activeChild.name, currentChar?.name ?? "AYA")
    : greetingLbl.fallback;

  return (
    <Layout isJunior>
      <AnimatePresence>
        {showCharPicker && activeChild && (
          <CharacterPicker child={activeChild} onSelect={handleSelectCharacter} onClose={() => setShowCharPicker(false)} />
        )}
      </AnimatePresence>

      {/* ── Active child indicator / child switcher ──────────────── */}
      {children.length === 1 && activeChild && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground bg-white/60 px-3 py-1.5 rounded-full border border-white/50 shadow-sm">
            👤 {lbl.activeChild}:
            <span className="ml-1 text-junior-foreground font-bold">{activeChild.name}</span>
          </span>
        </div>
      )}

      {children.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto hide-scrollbar items-center">
          <span className="text-xs text-muted-foreground font-semibold flex-shrink-0">👤</span>
          {children.map(c => (
            <button key={c.id} onClick={() => { setActiveChildId(c.id); setView("welcome"); }}
              className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${activeChildId === c.id ? 'bg-junior text-junior-foreground shadow-sm' : 'bg-white/50 text-muted-foreground hover:bg-white'}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === "welcome" && activeChild ? (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <WelcomeScreen
              child={activeChild}
              character={currentChar}
              streak={dailyStreak}
              onEnterWorld={() => setView("map")}
              onChat={() => { setSelectedSubject(null); setSelectedTopic(null); setView("chat"); }}
              onLessons={() => setView("subjects")}
              onChangeCompanion={() => setShowCharPicker(true)}
            />
            <div className="max-w-2xl mx-auto">
              <DailyPlanCard
                childId={activeChild.id}
                lang={juniorLang}
                onStartTask={(subject, topic) => {
                  setSelectedSubject(subject);
                  setSelectedTopic(topic);
                  setView("chat");
                }}
                onPlanLoaded={handlePlanLoaded}
              />
            </div>
          </motion.div>
        ) : view === "welcome" && childrenLoading ? (
          <motion.div key="loading" className="text-center py-20 text-muted-foreground">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-junior/30 border-t-junior animate-spin" />
            <p className="text-sm">{lbl.loadingProfile}</p>
          </motion.div>
        ) : view === "welcome" && !activeChild && !childrenLoading ? (
          <motion.div key="no-child" className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{lbl.noChildFound}</p>
            <p className="text-sm">{lbl.noChildFoundHint}</p>
          </motion.div>
        ) : view === "subjects" ? (
          <SubjectPanel
            lang={childLang}
            grade={activeChild?.grade ?? 2}
            childId={activeChildIdResolved ?? 0}
            childName={activeChild?.name ?? ""}
            characterEmoji={currentChar?.emoji ?? "🌟"}
            onStart={(subject, topic) => {
              setSelectedSubject(subject);
              setSelectedTopic(topic);
              setView("chat");
            }}
            onBack={() => setView("welcome")}
          />
        ) : view === "map" ? (
          <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setView("welcome")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/60 px-4 py-2 rounded-xl border border-white/50 transition-colors">
                <ArrowLeft className="w-4 h-4" /> {lbl.back}
              </button>
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/50">
                <span className="text-lg">{currentChar?.emoji ?? "🌟"}</span>
                <span className="font-bold text-sm text-junior-foreground">{currentChar?.name ?? "AYA"}</span>
                <span className="text-xs text-muted-foreground">· {lbl.levelLabel} {level} · {childXp} XP</span>
              </div>
              <button onClick={() => setShowCharPicker(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/60 rounded-xl border border-white/50 hover:bg-purple-50 transition-colors">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ZONES.map((zone, idx) => {
                const isUnlocked = childXp >= zone.xpRequired;
                const zoneMissions = missions.filter(m => getMissionZone(m) === zone.id);
                const completedCount = zoneMissions.filter(m => m.completed).length;
                const totalCount = zoneMissions.length;
                const zoneName = ZONE_NAMES_I18N[zone.id]?.[juniorLang] ?? zone.id;
                const zoneDesc = ZONE_DESCS_I18N[zone.id]?.[juniorLang] ?? zone.desc;

                return (
                  <motion.div key={zone.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.07 }}>
                    <Link href={isUnlocked && activeChildIdResolved ? `/junior/world?zone=${encodeURIComponent(zone.id)}` : "#"}>
                      <div className={`relative p-6 rounded-[2rem] border-4 transition-all ${isUnlocked
                        ? `${zone.bgColor} ${zone.borderColor} cursor-pointer hover:-translate-y-2 hover:shadow-xl`
                        : "bg-muted/30 border-muted-foreground/20 cursor-not-allowed opacity-60"}`}>
                        {!isUnlocked && (
                          <div className="absolute top-4 right-4"><Lock className="w-5 h-5 text-muted-foreground/50" /></div>
                        )}
                        {isUnlocked && completedCount === totalCount && totalCount > 0 && (
                          <div className="absolute top-4 right-4"><CheckCircle2 className="w-5 h-5 text-green-500" /></div>
                        )}

                        <div className="text-5xl mb-3">{zone.emoji}</div>
                        <h3 className={`text-lg font-display font-bold mb-1 ${isUnlocked ? zone.color : 'text-muted-foreground'}`}>{zoneName}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{zoneDesc}</p>

                        {isUnlocked ? (
                          <div>
                            {totalCount > 0 && (
                              <>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>{lbl.missionsCount(completedCount, totalCount)}</span>
                                  <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${zone.color.replace('text-', 'bg-')}`}
                                    style={{ width: `${(completedCount / totalCount) * 100}%` }} />
                                </div>
                              </>
                            )}
                            <div className={`mt-3 text-xs font-bold ${zone.color}`}>
                              {totalCount === 0 ? lbl.noMissions : completedCount === totalCount ? lbl.allDone : lbl.missionsLeft(totalCount - completedCount)}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground font-medium">{lbl.unlockAtXp(zone.xpRequired)}</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link href="/junior/world">
                <button className="bg-junior text-junior-foreground px-6 py-3 rounded-2xl shadow-md border-b-4 border-yellow-600 hover:translate-y-1 hover:border-b-0 transition-all font-bold flex items-center gap-2 mx-auto">
                  <Map className="w-5 h-5" /> {lbl.openWorldMap}
                </button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setView("welcome")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/60 px-4 py-2 rounded-xl border border-white/50 transition-colors">
                <ArrowLeft className="w-4 h-4" /> {lbl.back}
              </button>
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/50">
                <span className="text-lg">{currentChar?.emoji ?? "🌟"}</span>
                <span className="font-bold text-sm text-junior-foreground">{currentChar?.name ?? "AYA"}</span>
                {!selectedSubject && <span className="text-xs text-muted-foreground">{lbl.freeChatLabel}</span>}
                {selectedSubject && currentChar && <span className="text-xs text-muted-foreground">{lbl.toneStyle(CHAR_LABELS[currentChar.id]?.[juniorLang]?.tone ?? currentChar.tone)}</span>}
              </div>
              <button onClick={() => setView("map")}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/60 rounded-xl border border-white/50 hover:bg-yellow-50 transition-colors text-sm font-bold text-junior-foreground">
                <Map className="w-4 h-4" />
              </button>
            </div>

            <Chat
              module="junior"
              themeColor="junior"
              character={character}
              greeting={greeting}
              suggestedPrompts={getJuniorPrompts(activeChild?.language)}
              subjectContext={subjectContext}
              onTeacherStateChange={handleTeacherStateChange}
              onAyaMessageReceived={setLastAyaMessage}
            />

            <VoiceReadySection
              lbl={lbl}
              onOpenListening={() => {
                // Prepare content to read from current context
                let contentToRead = "";
                
                // If in chat view, prioritize actual last AYA message
                if (view === "chat") {
                  if (lastAyaMessage && lastAyaMessage.trim()) {
                    contentToRead = lastAyaMessage;
                  } else if (greeting) {
                    // Fallback to greeting if no message yet
                    contentToRead = greeting;
                  }
                }
                
                // If a topic is selected, use its label
                if (selectedTopic) {
                  const langKey = getLang(activeChild?.language);
                  contentToRead = selectedTopic.label[langKey] || selectedTopic.label["en"] || "Let's learn together!";
                }
                
                // If no specific content, use default fallback
                if (!contentToRead.trim()) {
                  const langKey = getLang(activeChild?.language);
                  if (langKey === "bg") {
                    contentToRead = "AYA е готова да ти помогне с ученето. Отвори урок или мисия за да начнеш!";
                  } else if (langKey === "es") {
                    contentToRead = "AYA está lista para ayudarte a aprender. ¡Abre una lección o misión para comenzar!";
                  } else {
                    contentToRead = "AYA is ready to help you learn. Open a lesson or mission to get started!";
                  }
                }
                
                setListeningContent(contentToRead);
                setShowListeningMode(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {activeChild && (
        <AnimatedTeacher
          characterEmoji={currentChar?.emoji ?? "🐼"}
          characterName={currentChar?.name ?? "AYA Panda"}
          lang={juniorLang}
          state={teacherState}
          message={teacherMsg}
        />
      )}

      {/* ── Listening Mode Modal ──────────────────────────── */}
      <ListeningMode
        isOpen={showListeningMode}
        onClose={() => setShowListeningMode(false)}
        contentToRead={listeningContent}
        lang={getLang(activeChild?.language)}
        characterEmoji={currentChar?.emoji ?? "🐼"}
      />
    </Layout>
  );
}
