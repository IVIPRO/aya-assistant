import { Layout } from "@/components/layout";
import { Star, Trophy, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListMissions, useCompleteMission, useListChildren, getListMissionsQueryKey, getListChildrenQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { MissionPlay } from "@/components/MissionPlay";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import type { Mission } from "@workspace/api-client-react";
import { resolveLang } from "@/lib/i18n";

type WorldLang = "en" | "bg" | "es";

function getLang(language?: string | null): WorldLang {
  const l = (language ?? "").toLowerCase();
  if (l.includes("bulgar") || l === "bg") return "bg";
  if (l.includes("spanish") || l.includes("español") || l === "es") return "es";
  return "en";
}

const ZONE_NAMES_I18N: Record<string, Record<WorldLang, string>> = {
  "Math Island":    { en: "Math Island",    bg: "Остров на математиката", es: "Isla de matemáticas" },
  "Reading Forest": { en: "Reading Forest", bg: "Гора на четенето",        es: "Bosque de lectura" },
  "Logic Mountain": { en: "Logic Mountain", bg: "Логическа планина",       es: "Montaña de lógica" },
  "English City":   { en: "English City",   bg: "Английски град",          es: "Ciudad de inglés" },
  "Science Planet": { en: "Science Planet", bg: "Планетата на науката",    es: "Planeta de ciencias" },
};

const ZONE_DESCS_I18N: Record<string, Record<WorldLang, string>> = {
  "Math Island":    { en: "Count, add, subtract, multiply and explore the magic of numbers!", bg: "Брой, събирай, изваждай, умножавай и изследвай магията на числата!", es: "¡Cuenta, suma, resta, multiplica y explora la magia de los números!" },
  "Reading Forest": { en: "Read stories, learn words, and discover the power of language!", bg: "Четете истории, учете думи и открийте силата на езика!", es: "¡Lee historias, aprende palabras y descubre el poder del lenguaje!" },
  "Logic Mountain": { en: "Solve puzzles, find patterns, and train your brilliant brain!", bg: "Решавай загадки, намирай закономерности и тренирай брилянтния си мозък!", es: "¡Resuelve acertijos, encuentra patrones y entrena tu brillante cerebro!" },
  "English City":   { en: "Practice English, learn new words, and speak with confidence!", bg: "Практикувай английски, учи нови думи и говори с увереност!", es: "¡Practica inglés, aprende nuevas palabras y habla con confianza!" },
  "Science Planet": { en: "Explore nature, animals, space, and how the world works!", bg: "Изследвай природата, животните, Космоса и как работи светът!", es: "¡Explora la naturaleza, los animales, el espacio y cómo funciona el mundo!" },
};

const WORLD_LABELS: Record<WorldLang, {
  backToLearning: string;
  mapTitle: string;
  mapSubtitle: string;
  noChildSelected: string;
  backToWorldMap: string;
  noMissionsZone: string;
  completeMission: string;
  completed: string;
  noMissions: string;
  allDone: string;
  remaining: (n: number) => string;
  missionsCount: (done: number, total: number) => string;
  enterZone: string;
  unlockAt: (xp: number, need: number) => string;
  companionSays: (name: string) => string;
  defaultCompanionMsg: string;
}> = {
  en: {
    backToLearning: "Back to Learning",
    mapTitle: "🗺️ Learning World Map",
    mapSubtitle: "Explore different zones and complete missions!",
    noChildSelected: "Select a child profile to explore the Learning World!",
    backToWorldMap: "Back to World Map",
    noMissionsZone: "No missions in this zone yet.",
    completeMission: "Complete Mission ✨",
    completed: "Completed!",
    noMissions: "No missions yet",
    allDone: "✅ All done!",
    remaining: (n) => `${n} remaining`,
    enterZone: "Enter →",
    unlockAt: (xp, need) => `🔒 Unlock at ${xp} XP (need ${need} more)`,
    companionSays: (name) => `${name} says:`,
    defaultCompanionMsg: "Let's explore this zone together and learn something amazing!",
    missionsCount: (done, total) => `${done}/${total} missions`,
  },
  bg: {
    backToLearning: "Назад към ученето",
    mapTitle: "🗺️ Карта на учебния свят",
    mapSubtitle: "Разгледай различните зони и изпълнявай мисии!",
    noChildSelected: "Изберете профил на дете, за да изследвате Учебния свят!",
    backToWorldMap: "Назад към картата на света",
    noMissionsZone: "Все още няма мисии в тази зона.",
    completeMission: "Завърши мисията ✨",
    completed: "Завършена!",
    noMissions: "Все още няма мисии",
    allDone: "✅ Всичко готово!",
    remaining: (n) => `${n} остават`,
    enterZone: "Влез →",
    unlockAt: (xp, need) => `🔒 Отключва се при ${xp} XP (нужни са още ${need})`,
    companionSays: (name) => `${name} казва:`,
    defaultCompanionMsg: "Нека изследваме тази зона заедно и научим нещо невероятно!",
    missionsCount: (done, total) => `${done}/${total} мисии`,
  },
  es: {
    backToLearning: "Volver al aprendizaje",
    mapTitle: "🗺️ Mapa del mundo de aprendizaje",
    mapSubtitle: "¡Explora zonas y completa misiones!",
    noChildSelected: "¡Selecciona un perfil de niño para explorar el Mundo de Aprendizaje!",
    backToWorldMap: "Volver al mapa del mundo",
    noMissionsZone: "Aún no hay misiones en esta zona.",
    completeMission: "Completar misión ✨",
    completed: "¡Completada!",
    noMissions: "Aún sin misiones",
    allDone: "✅ ¡Todo listo!",
    remaining: (n) => `${n} restantes`,
    enterZone: "Entrar →",
    unlockAt: (xp, need) => `🔒 Se desbloquea en ${xp} XP (faltan ${need})`,
    companionSays: (name) => `${name} dice:`,
    defaultCompanionMsg: "¡Exploremos esta zona juntos y aprendamos algo increíble!",
    missionsCount: (done, total) => `${done}/${total} misiones`,
  },
};

const DIFFICULTY_LABELS: Record<WorldLang, Record<string, { label: string; color: string }>> = {
  en: {
    easy:   { label: "Easy",   color: "bg-green-100 text-green-700" },
    medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
    hard:   { label: "Hard",   color: "bg-red-100 text-red-700" },
  },
  bg: {
    easy:   { label: "Лесно",  color: "bg-green-100 text-green-700" },
    medium: { label: "Средно", color: "bg-yellow-100 text-yellow-700" },
    hard:   { label: "Трудно", color: "bg-red-100 text-red-700" },
  },
  es: {
    easy:   { label: "Fácil",  color: "bg-green-100 text-green-700" },
    medium: { label: "Medio",  color: "bg-yellow-100 text-yellow-700" },
    hard:   { label: "Difícil",color: "bg-red-100 text-red-700" },
  },
};

const COMPANION_INFO: Record<string, { emoji: string; name: string; color: string; borderColor: string; textColor: string }> = {
  panda: { emoji: "🐼", name: "Panda", color: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700" },
  robot: { emoji: "🤖", name: "Robot", color: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700" },
  fox:   { emoji: "🦊", name: "Fox",   color: "bg-orange-50", borderColor: "border-orange-200", textColor: "text-orange-700" },
  owl:   { emoji: "🦉", name: "Owl",   color: "bg-purple-50", borderColor: "border-purple-200", textColor: "text-purple-700" },
};

const ZONE_COMPANION_MESSAGES: Record<WorldLang, Record<string, Record<string, string>>> = {
  en: {
    panda: {
      "Math Island":    "Let's solve each number puzzle together, slowly and carefully. You've got this! 🌿",
      "Reading Forest": "Every word is a new adventure. Let's read and discover the story together! 📖",
      "Logic Mountain": "Take your time — there's no rush. Let's find the pattern step by step! 🧩",
      "English City":   "We'll learn new words gently, and I'll cheer for every one you get right! 🌟",
      "Science Planet": "Nature is full of wonders. Let's explore and ask questions together! 🌱",
    },
    robot: {
      "Math Island":    "Calculating the best path forward! Every correct answer powers up your progress! ⚡",
      "Reading Forest": "Let's process each word systematically. Comprehension: initializing! 🤖",
      "Logic Mountain": "Logic circuits: online. Let's find the pattern and crack each puzzle! 💡",
      "English City":   "Language module: active! I'll celebrate every correct answer with you! 🎉",
      "Science Planet": "Science mode engaged! Let's observe, hypothesize, and discover! 🔬",
    },
    fox: {
      "Math Island":    "Ooh, numbers are like little puzzles — and I LOVE puzzles! Let's play! 🦊",
      "Reading Forest": "Words are magic spells! Let's read fast and discover the secrets inside! 🌟",
      "Logic Mountain": "A challenge? Oh yes! I love a good brain teaser. Let's outsmart this one! 🧠",
      "English City":   "English is an adventure! New words, new powers. Let's collect them all! 🎯",
      "Science Planet": "Science is the BEST kind of exploring. What cool thing will we find today?! 🚀",
    },
    owl: {
      "Math Island":    "Numbers have a beautiful order. Let's think clearly and find the answer together. 🦉",
      "Reading Forest": "Good reading starts with patience. Let's absorb each sentence thoughtfully. 📚",
      "Logic Mountain": "Every puzzle has a solution. Let's think it through with calm and focus. 🌙",
      "English City":   "Language reveals wisdom. Let's explore each word and its meaning carefully. 💫",
      "Science Planet": "The universe is endlessly fascinating. Let's observe and reflect together. 🌌",
    },
  },
  bg: {
    panda: {
      "Math Island":    "Нека решаваме всяка числова загадка заедно, бавно и внимателно. Ти можеш! 🌿",
      "Reading Forest": "Всяка дума е ново приключение. Нека четем и открием историята заедно! 📖",
      "Logic Mountain": "Не бързай — нито аз бързам. Нека намерим закономерността стъпка по стъпка! 🧩",
      "English City":   "Ще учим нови думи нежно, и аз ще те насърчавам за всяка правилна! 🌟",
      "Science Planet": "Природата е пълна с чудеса. Нека изследваме и задаваме въпроси заедно! 🌱",
    },
    robot: {
      "Math Island":    "Изчислявам най-добрия маршрут! Всеки верен отговор ускорява прогреса ти! ⚡",
      "Reading Forest": "Нека обработим всяка дума систематично. Разбирането: инициализиране! 🤖",
      "Logic Mountain": "Логически вериги: включени. Нека намерим закономерността и разбием загадката! 💡",
      "English City":   "Езиков модул: активен! Ще отбележа всеки верен отговор заедно с теб! 🎉",
      "Science Planet": "Научен режим: включен! Нека наблюдаваме, хипотезираме и откриваме! 🔬",
    },
    fox: {
      "Math Island":    "О, числата са като малки загадки — а аз ОБИЧАМ загадките! Нека играем! 🦊",
      "Reading Forest": "Думите са магически заклинания! Нека четем бързо и открием скритите тайни! 🌟",
      "Logic Mountain": "Предизвикателство? Да! Обичам добра задача за мозъка. Нека го надхитрим! 🧠",
      "English City":   "Английският е приключение! Нови думи, нови сили. Нека ги събираме всички! 🎯",
      "Science Planet": "Науката е НАЙ-добрият вид изследване. Какво интересно ще открием днес?! 🚀",
    },
    owl: {
      "Math Island":    "Числата имат красив ред. Нека мислим ясно и намерим отговора заедно. 🦉",
      "Reading Forest": "Доброто четене започва с търпение. Нека усвоим всяко изречение замислено. 📚",
      "Logic Mountain": "Всяка загадка има решение. Нека го мислим спокойно и съсредоточено. 🌙",
      "English City":   "Езикът разкрива мъдрост. Нека изследваме всяка дума и нейното значение. 💫",
      "Science Planet": "Вселената е безкрайно завладяваща. Нека наблюдаваме и размишляваме заедно. 🌌",
    },
  },
  es: {
    panda: {
      "Math Island":    "¡Resolvamos cada acertijo de números juntos, despacio y con cuidado. Tú puedes! 🌿",
      "Reading Forest": "¡Cada palabra es una nueva aventura! ¡Leamos y descubramos la historia juntos! 📖",
      "Logic Mountain": "Tómate tu tiempo — sin apuros. ¡Encontremos el patrón paso a paso! 🧩",
      "English City":   "Aprenderemos palabras nuevas suavemente, ¡y celebraré cada respuesta correcta! 🌟",
      "Science Planet": "¡La naturaleza está llena de maravillas. ¡Exploremos y hagamos preguntas juntos! 🌱",
    },
    robot: {
      "Math Island":    "¡Calculando la mejor ruta! ¡Cada respuesta correcta potencia tu progreso! ⚡",
      "Reading Forest": "¡Procesemos cada palabra sistemáticamente. Comprensión: inicializando! 🤖",
      "Logic Mountain": "¡Circuitos lógicos: activos. Encontremos el patrón y resolvamos el acertijo! 💡",
      "English City":   "¡Módulo de idiomas: activo! ¡Celebraré cada respuesta correcta contigo! 🎉",
      "Science Planet": "¡Modo ciencia activado! ¡Observemos, hipoticemos y descubramos! 🔬",
    },
    fox: {
      "Math Island":    "¡Los números son como pequeños acertijos — y me ENCANTAN los acertijos! ¡A jugar! 🦊",
      "Reading Forest": "¡Las palabras son hechizos mágicos! ¡Leamos rápido y descubramos los secretos! 🌟",
      "Logic Mountain": "¿Un reto? ¡Oh sí! ¡Me encanta un buen desafío mental. ¡Superémoslo juntos! 🧠",
      "English City":   "¡El inglés es una aventura! Nuevas palabras, nuevos poderes. ¡A coleccionarlas! 🎯",
      "Science Planet": "¡La ciencia es el MEJOR tipo de exploración. ¡Qué cosa genial descubriremos hoy?! 🚀",
    },
    owl: {
      "Math Island":    "Los números tienen un orden hermoso. Pensemos con claridad y encontremos la respuesta. 🦉",
      "Reading Forest": "La buena lectura empieza con paciencia. Absorbamos cada oración con reflexión. 📚",
      "Logic Mountain": "Todo acertijo tiene solución. Pensémoslo con calma y concentración. 🌙",
      "English City":   "El idioma revela sabiduría. Exploremos cada palabra y su significado con cuidado. 💫",
      "Science Planet": "El universo es infinitamente fascinante. Observemos y reflexionemos juntos. 🌌",
    },
  },
};

function CompanionGuidance({ companionId, zoneName, lang }: {
  companionId: string | null | undefined;
  zoneName: string;
  lang: WorldLang;
}) {
  if (!companionId || !COMPANION_INFO[companionId]) return null;
  const companion = COMPANION_INFO[companionId];
  const lbl = WORLD_LABELS[lang];
  const messages = ZONE_COMPANION_MESSAGES[lang][companionId] ?? {};
  const message = messages[zoneName] ?? lbl.defaultCompanionMsg;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 p-4 rounded-2xl border-2 mb-6 ${companion.color} ${companion.borderColor}`}
    >
      <span className="text-4xl flex-shrink-0">👧</span>
      <div>
        <div className={`flex items-center gap-1.5 font-bold text-sm mb-0.5 ${companion.textColor}`}>
          {lbl.companionSays("AYA")}
          <span className="text-[10px] font-semibold bg-white/60 px-1.5 py-0.5 rounded-full border border-black/10 ml-0.5">
            {companion.name}
          </span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}

interface Zone {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  xpRequired: number;
  description: string;
  subjectKeywords: string[];
}

const ZONES: Zone[] = [
  {
    id: "Math Island",
    name: "Math Island",
    emoji: "🏝️",
    color: "text-orange-600",
    bgColor: "bg-gradient-to-br from-orange-100 to-yellow-50",
    borderColor: "border-orange-300",
    xpRequired: 0,
    description: "Count, add, subtract, multiply and explore the magic of numbers!",
    subjectKeywords: ["Math", "Maths", "Математика", "Mathematik", "Matemáticas", "Numbers"],
  },
  {
    id: "Reading Forest",
    name: "Reading Forest",
    emoji: "🌲",
    color: "text-green-600",
    bgColor: "bg-gradient-to-br from-green-100 to-emerald-50",
    borderColor: "border-green-300",
    xpRequired: 30,
    description: "Read stories, learn words, and discover the power of language!",
    subjectKeywords: ["Reading", "Четене", "Deutsch", "Lengua", "English", "Literature", "Phonics"],
  },
  {
    id: "Logic Mountain",
    name: "Logic Mountain",
    emoji: "⛰️",
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-100 to-sky-50",
    borderColor: "border-blue-300",
    xpRequired: 80,
    description: "Solve puzzles, find patterns, and train your brilliant brain!",
    subjectKeywords: ["Logic", "Логика", "Lógica", "Sequencing", "Patterns"],
  },
  {
    id: "English City",
    name: "English City",
    emoji: "🏙️",
    color: "text-purple-600",
    bgColor: "bg-gradient-to-br from-purple-100 to-violet-50",
    borderColor: "border-purple-300",
    xpRequired: 150,
    description: "Practice English, learn new words, and speak with confidence!",
    subjectKeywords: ["English", "Английски", "Englisch", "Inglés", "Social Studies", "Grammar"],
  },
  {
    id: "Science Planet",
    name: "Science Planet",
    emoji: "🌍",
    color: "text-teal-600",
    bgColor: "bg-gradient-to-br from-teal-100 to-cyan-50",
    borderColor: "border-teal-300",
    xpRequired: 250,
    description: "Explore nature, animals, space, and how the world works!",
    subjectKeywords: ["Science", "Човекът и природата", "Sachkunde", "Ciencias Naturales", "Nature", "Biology", "Physics", "Social Studies"],
  },
];

function getMissionZone(mission: Mission): string {
  // Use zone from curriculum mapping if available
  if (mission.zone) {
    // Map curriculum zone names to UI zone IDs
    const zoneMap: Record<string, string> = {
      "Math Island": "Math Island",
      "Reading Forest": "Reading Forest",
      "Logic Mountain": "Logic Mountain",
      "English City": "English City",
      "Science Planet": "Science Planet",
    };
    return zoneMap[mission.zone] || mission.zone;
  }
  
  // Fallback: infer from subject keywords
  const subj = mission.subject;
  for (const zone of ZONES) {
    if (zone.subjectKeywords.some(kw => subj.toLowerCase().includes(kw.toLowerCase()))) {
      return zone.id;
    }
  }
  return "Science Planet";
}

function DifficultyBadge({ difficulty, lang }: { difficulty?: string | null; lang: WorldLang }) {
  const map = DIFFICULTY_LABELS[lang];
  const d = map[difficulty ?? "easy"] ?? map.easy;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.color}`}>{d.label}</span>;
}

export function WorldMap() {
  const { activeChildId } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const zoneFromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("zone") : null;
  const [selectedZone, setSelectedZone] = useState<string | null>(zoneFromUrl);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [activeMissionTitle, setActiveMissionTitle] = useState<string>("");
  const [activeMissionTasks, setActiveMissionTasks] = useState<number>(5);
  const zoneOpenedAtRef = useRef<number | null>(zoneFromUrl ? Date.now() : null);

  const handleSetZone = (zoneId: string | null) => {
    setSelectedZone(zoneId);
    zoneOpenedAtRef.current = zoneId ? Date.now() : null;
  };

  useEffect(() => {
    if (zoneFromUrl && selectedZone === null) {
      setSelectedZone(zoneFromUrl);
      zoneOpenedAtRef.current = Date.now();
    }
  }, [location]);

  const { data: children = [] } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const { data: missions = [], refetch } = useListMissions(
    { childId: activeChildId || 0 },
    { query: { queryKey: getListMissionsQueryKey({ childId: activeChildId || 0 }), enabled: !!activeChildId, staleTime: 5 * 60 * 1000 } }
  );

  // DEBUG: Log rendered missions for verification
  useEffect(() => {
    if (missions.length > 0) {
      const mathIslandMissions = missions.filter(m => getMissionZone(m) === "Math Island");
      console.log(`[MATH_ISLAND_RENDERED] Child ${activeChildId}: ${mathIslandMissions.map(m => m.title).join(", ")}`);
      console.log(`[MISSIONS_FETCHED] Total: ${missions.length}, Math Island: ${mathIslandMissions.length}`);
    }
  }, [missions, activeChildId]);

  const completeMutation = useCompleteMission();
  const activeChild = children.find(c => c.id === activeChildId);
  const childXp = activeChild?.xp ?? 0;
  const lang = getLang(activeChild?.language);
  const fullLang = resolveLang(activeChild?.language);
  const lbl = WORLD_LABELS[lang];

  const handleStartMission = (mission: Mission) => {
    // Map mission titles to mission IDs (supports BG foundational + all languages)
    const titleToId: Record<string, { id: string; tasks: number }> = {
      // Bulgarian foundational missions
      "Събиране до 10": { id: "m1", tasks: 5 },
      "Изваждане до 10": { id: "m2", tasks: 5 },
      "Събиране до 20": { id: "m3", tasks: 6 },
      "Умножение на 2 и 3": { id: "m4", tasks: 5 },
      "Задача с думи": { id: "m5", tasks: 5 },
      
      // English variants
      "Addition up to 10": { id: "m1", tasks: 5 },
      "Subtraction up to 10": { id: "m2", tasks: 5 },
      "Addition up to 20": { id: "m3", tasks: 6 },
      "Addition & Subtraction": { id: "m3", tasks: 6 },
      "Multiplication Table": { id: "m4", tasks: 5 },
      "Multiplication by 2 and 3": { id: "m4", tasks: 5 },
      "Word Problems": { id: "m5", tasks: 5 },
      
      // Spanish variants
      "Suma hasta 10": { id: "m1", tasks: 5 },
      "Resta hasta 10": { id: "m2", tasks: 5 },
      "Suma hasta 20": { id: "m3", tasks: 6 },
      "Tabla de multiplicación": { id: "m4", tasks: 5 },
      "Problemas de palabras": { id: "m5", tasks: 5 },
    };

    const config = titleToId[mission.title];
    console.log(`[START_MISSION_CLICKED] mission_id=${mission.id}, title="${mission.title}", config=${JSON.stringify(config)}`);
    
    if (config && activeChildId) {
      console.log(`[START_MISSION_SUCCESS] Activating mission: ${config.id} (${mission.title})`);
      setActiveMissionId(config.id);
      setActiveMissionTitle(mission.title);
      setActiveMissionTasks(config.tasks);
    } else {
      console.warn(`[START_MISSION_FAILED] No config found for title: "${mission.title}"`);
    }
  };

  const handleMissionComplete = () => {
    setActiveMissionId(null);
    refetch();
    toast({ title: "Mission Completed! 🎉", description: "You earned XP and Stars!" });
  };

  const handleComplete = async (id: number) => {
    const responseTimeMs = zoneOpenedAtRef.current ? Date.now() - zoneOpenedAtRef.current : undefined;
    try {
      await completeMutation.mutateAsync({ id, data: { responseTimeMs: responseTimeMs ?? null } });
      toast({ title: "Mission Completed! 🎉", description: "You earned XP and Stars!" });
      refetch();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const zoneMissions = ZONES.map(zone => ({
    zone,
    missions: missions.filter(m => getMissionZone(m) === zone.id),
  }));

  const activeZone = selectedZone ? ZONES.find(z => z.id === selectedZone) : null;
  const activeMissions = selectedZone ? missions.filter(m => getMissionZone(m) === selectedZone) : [];

  // If a mission is active, show the mission play interface
  if (activeMissionId && activeChildId) {
    return (
      <Layout isJunior>
        <div className="mb-6">
          <button
            onClick={() => setActiveMissionId(null)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-4 bg-white/50 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Missions
          </button>
        </div>
        <MissionPlay
          childId={activeChildId}
          missionId={activeMissionId}
          missionTitle={activeMissionTitle}
          requiredTasks={activeMissionTasks}
          lang={fullLang}
          onBack={() => setActiveMissionId(null)}
          onComplete={handleMissionComplete}
        />
      </Layout>
    );
  }

  return (
    <Layout isJunior>
      <div className="mb-6">
        <Link href="/junior" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-4 bg-white/50 px-4 py-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
          {lbl.backToLearning}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-junior-foreground flex items-center gap-3">
              {lbl.mapTitle}
            </h1>
            <p className="text-muted-foreground mt-1">{lbl.mapSubtitle}</p>
          </div>
          {activeChild && (
            <div className="flex gap-3">
              <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-yellow-200 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-yellow-600">{activeChild.stars}</span>
              </div>
              <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-orange-200 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="font-bold text-orange-600">{activeChild.xp} XP</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!activeChildId && (
        <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed">
          <p className="text-muted-foreground text-lg">{lbl.noChildSelected}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedZone && activeZone ? (
          <motion.div
            key="zone-missions"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <button
              onClick={() => handleSetZone(null)}
              className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/50 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              {lbl.backToWorldMap}
            </button>

            <div className={`p-6 rounded-2xl mb-4 ${activeZone.bgColor} border ${activeZone.borderColor}`}>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{activeZone.emoji}</span>
                <div>
                  <h2 className={`text-2xl font-display font-bold ${activeZone.color}`}>
                    {ZONE_NAMES_I18N[activeZone.id]?.[lang] ?? activeZone.name}
                  </h2>
                  <p className="text-muted-foreground">
                    {ZONE_DESCS_I18N[activeZone.id]?.[lang] ?? activeZone.description}
                  </p>
                </div>
              </div>
            </div>

            <CompanionGuidance companionId={activeChild?.aiCharacter} zoneName={activeZone.id} lang={lang} />

            {activeMissions.length === 0 ? (
              <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed">
                <p className="text-muted-foreground">{lbl.noMissionsZone}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeMissions.map((mission, idx) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`relative p-5 rounded-[1.5rem] border-4 transition-all ${
                      mission.completed
                        ? "bg-green-50 border-green-200"
                        : `${activeZone.bgColor} ${activeZone.borderColor} shadow-xl hover:-translate-y-1`
                    }`}
                  >
                    {mission.completed && (
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <DifficultyBadge difficulty={mission.difficulty} lang={lang} />
                      <div className="flex gap-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                          <Trophy className="w-3 h-3" /> {mission.xpReward}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 fill-yellow-500" /> {mission.starReward}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-display font-bold mb-1">{mission.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{mission.description}</p>

                    {!mission.completed ? (
                      <button
                        onClick={() => handleStartMission(mission)}
                        disabled={completeMutation.isPending}
                        className="w-full py-2.5 font-bold rounded-xl border-b-4 border-yellow-600 hover:border-b-0 hover:translate-y-1 transition-all text-sm bg-junior text-junior-foreground"
                      >
                        Start Mission
                      </button>
                    ) : (
                      <button disabled className="w-full py-2.5 bg-green-100 text-green-700 font-bold rounded-xl flex justify-center items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> {lbl.completed}
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="zone-map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {zoneMissions.map(({ zone, missions: zMissions }, idx) => {
              const isUnlocked = childXp >= zone.xpRequired;
              const completedCount = zMissions.filter(m => m.completed).length;
              const totalCount = zMissions.length;
              const zoneName = ZONE_NAMES_I18N[zone.id]?.[lang] ?? zone.name;
              const zoneDesc = ZONE_DESCS_I18N[zone.id]?.[lang] ?? zone.description;

              return (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => isUnlocked && activeChildId && handleSetZone(zone.id)}
                  className={`relative p-6 rounded-[2rem] border-4 transition-all ${
                    isUnlocked
                      ? `${zone.bgColor} ${zone.borderColor} cursor-pointer hover:-translate-y-2 hover:shadow-xl`
                      : "bg-muted/30 border-muted-foreground/20 cursor-not-allowed opacity-60"
                  }`}
                >
                  {!isUnlocked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}

                  <div className="text-5xl mb-4">{zone.emoji}</div>
                  <h3 className={`text-xl font-display font-bold mb-1 ${isUnlocked ? zone.color : 'text-muted-foreground'}`}>
                    {zoneName}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{zoneDesc}</p>

                  {isUnlocked ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>{lbl.missionsCount(completedCount, totalCount)}</span>
                        {totalCount > 0 && <span>{Math.round((completedCount / totalCount) * 100)}%</span>}
                      </div>
                      {totalCount > 0 && (
                        <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-current rounded-full transition-all"
                            style={{ width: `${(completedCount / totalCount) * 100}%`, color: zone.color.replace('text-', '') }}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-bold text-muted-foreground">
                          {totalCount === 0 ? lbl.noMissions : completedCount === totalCount ? lbl.allDone : lbl.remaining(totalCount - completedCount)}
                        </span>
                        {activeChildId && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${zone.color} bg-white/60`}>
                            {lbl.enterZone}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground font-medium">
                      {lbl.unlockAt(zone.xpRequired, zone.xpRequired - childXp)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
