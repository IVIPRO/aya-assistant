import { Layout } from "@/components/layout";
import { Chat } from "@/components/chat";
import { SubjectPanel } from "@/pages/junior/subjects";
import { StageSelector } from "@/pages/junior/stage-selector";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Sparkles, MessageCircle } from "lucide-react";
import { AyaAvatarImage as AyaAvatar } from "@/components/AyaAvatarImage";
import { useAuth } from "@/hooks/use-auth";
import { useListChildren, getListChildrenQueryKey } from "@workspace/api-client-react";
import { resolveLang } from "@/lib/i18n";
import { STAGE_2 } from "@/lib/curriculum";
import type { Subject, Topic } from "@/lib/curriculum";
import type { LangCode } from "@/lib/i18n";

type StudentView = "welcome" | "grades" | "subjects" | "chat";

const LABELS: Record<LangCode, {
  stageTitle: string;
  stageDesc: string;
  chooseLessons: string;
  freeLessonsHint: string;
  freeChat: string;
  freeChatDesc: string;
  back: string;
  greeting: string;
  ayaReady: string;
  noChildFound: string;
  noChildFoundHint: string;
}> = {
  bg: {
    stageTitle: "Прогимназия",
    stageDesc: "Уроци и помощ за 5, 6 и 7 клас",
    chooseLessons: "Уроци по предмети",
    freeLessonsHint: "5, 6 и 7 клас",
    freeChat: "Свободен разговор",
    freeChatDesc: "Питай AYA за всичко",
    back: "Назад",
    greeting: "Здравей! Аз съм AYA — твоят умен помощник за прогимназията. Готова съм да помагам с всеки предмет!",
    ayaReady: "Готова съм да помагам!",
    noChildFound: "Не е намерен профил",
    noChildFoundHint: "Моля, свържи детски профил",
  },
  en: {
    stageTitle: "Lower Secondary",
    stageDesc: "Lessons and help for Grades 5, 6 and 7",
    chooseLessons: "Subject lessons",
    freeLessonsHint: "Grades 5, 6 and 7",
    freeChat: "Free chat",
    freeChatDesc: "Ask AYA anything",
    back: "Back",
    greeting: "Hi! I'm AYA — your smart lower-secondary learning companion. I'm ready to help with any subject!",
    ayaReady: "Ready to help!",
    noChildFound: "No profile found",
    noChildFoundHint: "Please connect a child profile",
  },
  es: {
    stageTitle: "Secundaria",
    stageDesc: "Lecciones y ayuda para los grados 5, 6 y 7",
    chooseLessons: "Lecciones por materia",
    freeLessonsHint: "Grados 5, 6 y 7",
    freeChat: "Chat libre",
    freeChatDesc: "Pregúntale a AYA lo que quieras",
    back: "Atrás",
    greeting: "¡Hola! Soy AYA — tu compañera de aprendizaje de secundaria. ¡Lista para ayudarte con cualquier asignatura!",
    ayaReady: "¡Lista para ayudar!",
    noChildFound: "Perfil no encontrado",
    noChildFoundHint: "Por favor conecta un perfil infantil",
  },
  de: {
    stageTitle: "Mittelschule",
    stageDesc: "Lektionen und Hilfe für die Klassen 5, 6 und 7",
    chooseLessons: "Fachunterricht",
    freeLessonsHint: "Klassen 5, 6 und 7",
    freeChat: "Freies Gespräch",
    freeChatDesc: "Frag AYA alles",
    back: "Zurück",
    greeting: "Hallo! Ich bin AYA — deine smarte Lernbegleiterin für die Mittelschule. Ich helfe dir bei jedem Fach!",
    ayaReady: "Bereit zu helfen!",
    noChildFound: "Kein Profil gefunden",
    noChildFoundHint: "Bitte verbinde ein Kinderprofil",
  },
  fr: {
    stageTitle: "Collège",
    stageDesc: "Leçons et aide pour les classes 5, 6 et 7",
    chooseLessons: "Leçons par matière",
    freeLessonsHint: "Classes 5, 6 et 7",
    freeChat: "Chat libre",
    freeChatDesc: "Pose n'importe quelle question à AYA",
    back: "Retour",
    greeting: "Salut ! Je suis AYA — ton compagnon d'apprentissage pour le collège. Prête à t'aider dans toutes les matières !",
    ayaReady: "Prête à aider !",
    noChildFound: "Profil introuvable",
    noChildFoundHint: "Veuillez connecter un profil enfant",
  },
};

export function Student() {
  const { activeChildId } = useAuth();
  const [view, setView] = useState<StudentView>("welcome");
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const { data: children = [] } = useListChildren({
    query: { queryKey: getListChildrenQueryKey() },
  });

  const activeChild = children.find(c => c.id === activeChildId) ?? children[0] ?? null;
  const childLang = resolveLang(activeChild?.language ?? null);
  const lbl = LABELS[childLang];

  const activeChildIdResolved = activeChild?.id ?? null;

  // Clamp grade to stage2 range (5–7); default to 5 if child's grade is outside range
  const rawGrade = selectedGrade ?? activeChild?.grade ?? 5;
  const clampedGrade = STAGE_2.grades.includes(rawGrade) ? rawGrade : STAGE_2.grades[0];

  const subjectContext = selectedSubject
    ? {
        subjectLabel: selectedSubject.label[childLang],
        topicLabel: selectedTopic?.label[childLang] ?? null,
      }
    : null;

  function buildGreeting(): string {
    const name = activeChild?.name ?? "";
    const subject = selectedSubject?.label[childLang] ?? "";
    const topic = selectedTopic?.label[childLang] ?? null;
    if (childLang === "bg") {
      if (subject) {
        return topic
          ? `🌟 Здравей, ${name}! Нека работим върху "${topic}" по ${subject}. Какво искаш да научиш?`
          : `🌟 Здравей, ${name}! Готова съм да помогна с ${subject}. С какво да започнем?`;
      }
      return `🌟 Здравей, ${name}! Аз съм AYA — умният ти помощник за прогимназията. Какво искаш да изследваме днес?`;
    }
    if (subject) {
      return topic
        ? `🌟 Hi ${name}! Let's work on "${topic}" in ${subject}. What would you like to learn?`
        : `🌟 Hi ${name}! I'm ready to help with ${subject}. Where shall we start?`;
    }
    return `🌟 Hi ${name}! I'm AYA — your lower-secondary learning companion. What would you like to explore today?`;
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {!activeChild ? (
          <motion.div
            key="no-child"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-24 text-muted-foreground"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{lbl.noChildFound}</p>
            <p className="text-sm">{lbl.noChildFoundHint}</p>
          </motion.div>

        ) : view === "welcome" ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
          >
            {/* Stage hero banner */}
            <div className="rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-student/20 via-student/10 to-transparent border border-student/20 p-8 mb-8">
              {/* Hero row: left (title+CTA) | right (avatar) */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-6">
                {/* Left: Title section with CTA */}
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-student/10 text-student text-xs font-bold px-3 py-1 rounded-full mb-2">
                    <span>🎓</span>
                    {childLang === "bg"
                      ? "5–7 клас"
                      : childLang === "de"
                      ? "Klassen 5–7"
                      : `Grades 5–7`}
                  </div>
                  <h1 className="text-3xl font-display font-bold text-student mb-1">
                    {lbl.stageTitle}
                  </h1>
                  <p className="text-muted-foreground mb-4">{lbl.stageDesc}</p>
                  <div className="inline-flex items-center gap-2 bg-student/10 text-student font-semibold px-4 py-2 rounded-xl text-sm">
                    <Sparkles className="w-4 h-4" />
                    {lbl.ayaReady}
                  </div>
                </div>

                {/* Right: Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-student/20 to-student/5 border-2 border-student/30 flex items-center justify-center shadow-lg overflow-visible">
                    <div className="scale-[2.2] mt-3">
                      <AyaAvatar emotion="happy" visible={true} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Speech bubble - full width below */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-student/20 p-4 text-sm text-foreground">
                <p className="font-medium text-student mb-1">👧 AYA</p>
                <p>{lbl.greeting}</p>
              </div>
            </div>

            {/* Action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject lessons */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView("grades")}
                className="p-6 rounded-2xl bg-gradient-to-br from-student/10 to-student/5 border-2 border-student/20 hover:border-student/50 text-left transition-all"
              >
                <div className="text-3xl mb-3">📖</div>
                <h3 className="font-bold text-lg text-foreground">{lbl.chooseLessons}</h3>
                <p className="text-sm text-muted-foreground mt-1">{lbl.freeLessonsHint}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {STAGE_2.subjects.slice(0, 5).map(s => (
                    <span key={s.id} className="text-xs bg-student/10 text-student rounded-full px-2 py-0.5">
                      {s.emoji} {s.label[childLang]}
                    </span>
                  ))}
                  {STAGE_2.subjects.length > 5 && (
                    <span className="text-xs text-muted-foreground px-2 py-0.5">
                      +{STAGE_2.subjects.length - 5}
                    </span>
                  )}
                </div>
              </motion.button>

              {/* Free chat */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedSubject(null);
                  setSelectedTopic(null);
                  setView("chat");
                }}
                className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 hover:border-purple-400 text-left transition-all"
              >
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-bold text-lg text-foreground">{lbl.freeChat}</h3>
                <p className="text-sm text-muted-foreground mt-1">{lbl.freeChatDesc}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 font-medium">
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {childLang === "bg"
                      ? "AYA е готова да отговаря"
                      : "AYA is ready to answer"}
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Subject preview chips */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                {childLang === "bg" ? "Предмети в Прогимназия" : childLang === "de" ? "Fächer in der Mittelschule" : childLang === "fr" ? "Matières au collège" : childLang === "es" ? "Materias en secundaria" : "Lower Secondary subjects"}
              </p>
              <div className="flex flex-wrap gap-2">
                {STAGE_2.subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubject(s);
                      setSelectedTopic(null);
                      setView("grades");
                    }}
                    className="flex items-center gap-1.5 text-sm bg-white border border-border/50 hover:border-student/50 hover:bg-student/5 rounded-xl px-3 py-1.5 transition-all"
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label[childLang]}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

        ) : view === "grades" ? (
          <motion.div
            key="grades"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <StageSelector
              lang={childLang}
              currentGrade={clampedGrade}
              allowedStageIds={["stage2"]}
              onSelectGrade={(grade) => {
                setSelectedGrade(grade);
                setView("subjects");
              }}
              onBack={() => { setSelectedGrade(null); setView("welcome"); }}
            />
          </motion.div>

        ) : view === "subjects" ? (
          <motion.div
            key="subjects"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <SubjectPanel
              lang={childLang}
              grade={clampedGrade}
              childId={activeChildIdResolved ?? 0}
              childName={activeChild.name ?? ""}
              characterEmoji="👧"
              onStart={(subject, topic) => {
                setSelectedSubject(subject);
                setSelectedTopic(topic);
                setView("chat");
              }}
              onBack={() => {
                setSelectedGrade(null);
                setView("grades");
              }}
            />
          </motion.div>

        ) : view === "chat" ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Breadcrumb nav */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <button
                onClick={() => selectedSubject ? setView("subjects") : setView("welcome")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold bg-white/60 px-4 py-2 rounded-xl border border-border/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {lbl.back}
              </button>

              {/* Stage badge — always visible in chat, confirms stage context */}
              <div className="flex items-center gap-2 text-xs font-bold bg-student/10 text-student px-3 py-2 rounded-xl">
                🎓 {lbl.stageTitle} ·{" "}
                {childLang === "bg"
                  ? `${clampedGrade} клас`
                  : `Grade ${clampedGrade}`}
              </div>

              {selectedSubject && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/60 px-3 py-2 rounded-xl border border-border/50">
                  <span>{selectedSubject.emoji}</span>
                  <span className="font-medium">{selectedSubject.label[childLang]}</span>
                  {selectedTopic && (
                    <>
                      <span className="opacity-50">›</span>
                      <span>{selectedTopic.label[childLang]}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Chat
              key={`student-${clampedGrade}-${selectedSubject?.id ?? "free"}-${selectedTopic?.id ?? "chat"}`}
              module="student"
              themeColor="student"
              greeting={buildGreeting()}
              subjectContext={subjectContext}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Layout>
  );
}
