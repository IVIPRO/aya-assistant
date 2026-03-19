import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, Pencil, Brain, CheckCircle2, XCircle,
  ChevronRight, RotateCcw, Loader2,
} from "lucide-react";
import { cn } from "@/components/layout";
import { getListChildrenQueryKey } from "@workspace/api-client-react";
import type { LangCode } from "@/lib/i18n";
import type { Subject, Topic } from "@/lib/curriculum";
import { XpToast, type XpReward } from "@/components/xp-toast";

type LessonMode = "lesson" | "practice" | "quiz";

interface LessonContent {
  lesson: {
    title: string;
    explanation: string;
    examples: Array<{ problem: string; solution: string; hint: string }>;
    tip: string;
  };
  practice: {
    instructions: string;
    problems: Array<{ question: string; answer: string }>;
  };
  quiz: {
    instructions: string;
    questions: Array<{ question: string; options: string[]; correctIndex: number }>;
  };
}

const TAB_LABELS: Record<LangCode, { lesson: string; practice: string; quiz: string }> = {
  en: { lesson: "Lesson", practice: "Practice", quiz: "Quiz" },
  bg: { lesson: "Урок", practice: "Упражнения", quiz: "Тест" },
  es: { lesson: "Lección", practice: "Práctica", quiz: "Test" },
  de: { lesson: "Lektion", practice: "Übung", quiz: "Quiz" },
  fr: { lesson: "Leçon", practice: "Pratique", quiz: "Quiz" },
};

const UI: Record<LangCode, {
  check: string; correct: string; wrong: string; next: string; retry: string;
  score: (n: number, t: number) => string; loading: string; back: string;
  showHint: string; placeholder: string;
}> = {
  en: {
    check: "Check", correct: "Correct! ✅", wrong: "Not quite ❌", next: "Next →",
    retry: "Try again", score: (n, t) => `You got ${n} out of ${t} correct!`,
    loading: "Loading lesson...", back: "← Back", showHint: "Show hint",
    placeholder: "Type your answer…",
  },
  bg: {
    check: "Провери", correct: "Правилно! ✅", wrong: "Не съвсем ❌", next: "Следващ →",
    retry: "Опитай пак", score: (n, t) => `Верни отговори: ${n} от ${t}!`,
    loading: "Зареждам урока...", back: "← Назад", showHint: "Покажи подсказка",
    placeholder: "Напиши отговора си…",
  },
  es: {
    check: "Comprobar", correct: "¡Correcto! ✅", wrong: "No del todo ❌", next: "Siguiente →",
    retry: "Intentar de nuevo", score: (n, t) => `¡Acertaste ${n} de ${t}!`,
    loading: "Cargando lección...", back: "← Atrás", showHint: "Mostrar pista",
    placeholder: "Escribe tu respuesta…",
  },
  de: {
    check: "Überprüfen", correct: "Richtig! ✅", wrong: "Nicht ganz ❌", next: "Nächste →",
    retry: "Noch mal versuchen", score: (n, t) => `Du hast ${n} von ${t} richtig!`,
    loading: "Lade Lektion...", back: "← Zurück", showHint: "Hinweis anzeigen",
    placeholder: "Gib deine Antwort ein…",
  },
  fr: {
    check: "Vérifier", correct: "Correct! ✅", wrong: "Pas tout à fait ❌", next: "Suivant →",
    retry: "Réessayer", score: (n, t) => `Tu as eu ${n} sur ${t} correct!`,
    loading: "Chargement de la leçon...", back: "← Retour", showHint: "Afficher l'indice",
    placeholder: "Tape ta réponse…",
  },
};

/* ─── Lesson Panel ─────────────────────────────────────────────── */
interface LessonPanelProps {
  data: LessonContent;
  lang: LangCode;
  subject: Subject;
  onView: () => void;
}
function LessonPanel({ data, lang, subject, onView }: LessonPanelProps) {
  const [showHints, setShowHints] = useState<boolean[]>(data.lesson.examples.map(() => false));
  const ui = UI[lang];
  const firedRef = useRef(false);

  useEffect(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      onView();
    }
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className={cn("rounded-3xl border-2 p-6", subject.bgClass, subject.borderClass)}>
        <h3 className={cn("text-xl font-display font-bold mb-3", subject.colorClass)}>{data.lesson.title}</h3>
        <p className="text-foreground leading-relaxed">{data.lesson.explanation}</p>
      </div>

      <div className="space-y-3">
        {data.lesson.examples.map((ex, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0", subject.bgClass, subject.colorClass)}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-base font-bold">{ex.problem}</p>
                <p className={cn("font-mono text-base font-bold mt-0.5", subject.colorClass)}>{ex.solution}</p>
              </div>
            </div>
            {showHints[i] ? (
              <div className="px-5 pb-4 text-sm text-muted-foreground italic">{ex.hint}</div>
            ) : (
              <button
                onClick={() => setShowHints(h => h.map((v, j) => j === i ? true : v))}
                className="w-full px-5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border-t border-border/20 transition-colors text-left"
              >
                💡 {ui.showHint}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-900">
        {data.lesson.tip}
      </div>
    </motion.div>
  );
}

/* ─── Practice Panel ───────────────────────────────────────────── */
interface PracticePanelProps {
  data: LessonContent;
  lang: LangCode;
  subject: Subject;
  onComplete: (correctCount: number) => void;
}
function PracticePanel({ data, lang, subject, onComplete }: PracticePanelProps) {
  const ui = UI[lang];
  const [answers, setAnswers] = useState<string[]>(data.practice.problems.map(() => ""));
  const [checked, setChecked] = useState<(boolean | null)[]>(data.practice.problems.map(() => null));
  const firedRef = useRef(false);

  useEffect(() => {
    const allChecked = checked.every(c => c !== null);
    if (allChecked && !firedRef.current) {
      firedRef.current = true;
      const correctCount = checked.filter(c => c === true).length;
      onComplete(correctCount);
    }
  }, [checked]);

  const checkOne = (i: number) => {
    const correct = data.practice.problems[i].answer.trim().toLowerCase();
    const given = answers[i].trim().toLowerCase();
    setChecked(c => c.map((v, j) => j === i ? given === correct : v));
  };

  const resetOne = (i: number) => {
    setAnswers(a => a.map((v, j) => j === i ? "" : v));
    setChecked(c => c.map((v, j) => j === i ? null : v));
    firedRef.current = false;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <p className="text-sm text-muted-foreground">{data.practice.instructions}</p>
      {data.practice.problems.map((prob, i) => {
        const state = checked[i];
        return (
          <div key={i} className={cn(
            "bg-card rounded-2xl border-2 shadow-sm p-5 transition-colors",
            state === true ? "border-green-300 bg-green-50" : state === false ? "border-red-300 bg-red-50" : "border-border/40",
          )}>
            <div className="flex items-start gap-3 mb-3">
              <span className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0", subject.bgClass, subject.colorClass)}>
                {i + 1}
              </span>
              <p className="font-mono font-semibold text-base pt-0.5">{prob.question}</p>
            </div>

            {state === null ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={answers[i]}
                  onChange={e => setAnswers(a => a.map((v, j) => j === i ? e.target.value : v))}
                  placeholder={ui.placeholder}
                  onKeyDown={e => e.key === "Enter" && checkOne(i)}
                  className="flex-1 bg-white/60 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={() => checkOne(i)}
                  disabled={!answers[i].trim()}
                  className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", subject.bgClass, subject.colorClass, "border", subject.borderClass, "hover:opacity-90 disabled:opacity-40")}
                >
                  {ui.check}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {state ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={cn("font-semibold text-sm", state ? "text-green-700" : "text-red-600")}>
                    {state ? ui.correct : `${ui.wrong} — ${prob.answer}`}
                  </span>
                </div>
                {!state && (
                  <button onClick={() => resetOne(i)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> {ui.retry}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

/* ─── Quiz Panel ───────────────────────────────────────────────── */
interface QuizPanelProps {
  data: LessonContent;
  lang: LangCode;
  subject: Subject;
  onComplete: (score: number) => void;
}
function QuizPanel({ data, lang, subject, onComplete }: QuizPanelProps) {
  const ui = UI[lang];
  const questions = data.quiz.questions;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      onComplete(score);
    }
  }, [done, score]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].correctIndex) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setScore(0); setDone(false);
    firedRef.current = false;
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={cn("rounded-3xl border-2 p-8 text-center", subject.bgClass, subject.borderClass)}>
        <div className="text-6xl mb-4">{pct === 100 ? "🏆" : pct >= 66 ? "⭐" : "💪"}</div>
        <h3 className={cn("text-2xl font-display font-bold mb-2", subject.colorClass)}>{ui.score(score, questions.length)}</h3>
        <p className="text-muted-foreground text-sm mb-6">
          {pct === 100
            ? (lang === "bg" ? "Перфектно! Страхотна работа!" : lang === "es" ? "¡Perfecto! ¡Excelente trabajo!" : "Perfect! Excellent work!")
            : pct >= 66
            ? (lang === "bg" ? "Добра работа! Продължавай така!" : lang === "es" ? "¡Buen trabajo! ¡Sigue así!" : "Good job! Keep it up!")
            : (lang === "bg" ? "Прегледай урока и опитай пак!" : lang === "es" ? "¡Repasa la lección e inténtalo de nuevo!" : "Review the lesson and try again!")}
        </p>
        <button onClick={restart}
          className={cn("px-6 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto transition-all hover:opacity-90", subject.bgClass, subject.colorClass, "border-2", subject.borderClass)}>
          <RotateCcw className="w-4 h-4" /> {ui.retry}
        </button>
      </motion.div>
    );
  }

  const q = questions[current];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {lang === "bg" ? `Въпрос ${current + 1} от ${questions.length}` : lang === "es" ? `Pregunta ${current + 1} de ${questions.length}` : `Question ${current + 1} of ${questions.length}`}
        </p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={cn("w-2 h-2 rounded-full",
              i < current ? "bg-green-500" : i === current ? subject.colorClass.replace("text-", "bg-") : "bg-muted"
            )} />
          ))}
        </div>
      </div>
      <div className={cn("rounded-3xl border-2 p-6", subject.bgClass, subject.borderClass)}>
        <p className="font-mono text-xl font-bold text-center">{q.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === q.correctIndex;
          const revealed = selected !== null;
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={revealed}
              className={cn(
                "p-4 rounded-2xl border-2 font-bold text-base transition-all text-center",
                !revealed && "hover:scale-105 cursor-pointer border-border/40 bg-card",
                revealed && isCorrect && "border-green-400 bg-green-50 text-green-700",
                revealed && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-600",
                revealed && !isSelected && !isCorrect && "border-border/30 bg-muted/30 text-muted-foreground opacity-60",
              )}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <button onClick={handleNext}
            className={cn("px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:opacity-90", subject.bgClass, subject.colorClass, "border-2", subject.borderClass)}>
            {ui.next} <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Main LessonViewer ────────────────────────────────────────── */
export interface LessonViewerProps {
  subject: Subject;
  topic: Topic;
  initialMode: LessonMode;
  grade: number;
  lang: LangCode;
  childId: number;
  onBack: () => void;
  onAskAya: () => void;
}

export function LessonViewer({ subject, topic, initialMode, grade, lang, childId, onBack, onAskAya }: LessonViewerProps) {
  const [mode, setMode] = useState<LessonMode>(initialMode);
  const [reward, setReward] = useState<XpReward | null>(null);
  const ui = UI[lang];
  const tabs = TAB_LABELS[lang];
  const queryClient = useQueryClient();

  /* Fetch lesson content */
  const { data, isLoading, isError } = useQuery<LessonContent>({
    queryKey: ["lesson", subject.id, topic.id, grade, lang],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/content?subjectId=${subject.id}&topicId=${topic.id}&grade=${grade}&lang=${lang}`);
      if (!res.ok) throw new Error("Failed to load lesson");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  /* Record completion and receive XP */
  const completeMutation = useMutation({
    mutationFn: async ({ action, correctCount }: { action: "lesson" | "practice" | "quiz"; correctCount: number }) => {
      const res = await fetch("/api/learning/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, subjectId: subject.id, topicId: topic.id, action, correctCount }),
      });
      if (!res.ok) throw new Error("Failed to record progress");
      return res.json() as Promise<XpReward & { newBadges: Array<{ icon: string; title: string }> }>;
    },
    onSuccess: (result) => {
      if (result.xpGained > 0 || result.starsGained > 0) {
        setReward(result);
      }
      // Refresh child data so XP/stars/level update in the UI
      queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
      // Refresh topic progress
      queryClient.invalidateQueries({ queryKey: ["learning-progress", childId] });
    },
  });

  const recordCompletion = useCallback((action: "lesson" | "practice" | "quiz", correctCount: number) => {
    if (childId > 0) {
      completeMutation.mutate({ action, correctCount });
    }
  }, [childId]);

  const TABS: Array<{ id: LessonMode; label: string; Icon: typeof BookOpen }> = [
    { id: "lesson",   label: tabs.lesson,   Icon: BookOpen },
    { id: "practice", label: tabs.practice, Icon: Pencil },
    { id: "quiz",     label: tabs.quiz,     Icon: Brain },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      {/* XP reward toast */}
      <XpToast reward={reward} lang={lang} onDismiss={() => setReward(null)} />

      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/60 px-4 py-2 rounded-xl border border-white/50 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {ui.back}
        </button>
        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/50">
          <span className="text-lg">{subject.emoji}</span>
          <span className={cn("font-bold text-sm", subject.colorClass)}>{topic.label[lang]}</span>
        </div>
        <div className="w-20" />
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-3 gap-2 mb-6 bg-muted/30 p-1.5 rounded-2xl">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setMode(id)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all",
              mode === id
                ? cn(subject.bgClass, subject.colorClass, "shadow-sm border", subject.borderClass)
                : "text-muted-foreground hover:text-foreground",
            )}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{ui.loading}</span>
        </div>
      ) : isError || !data ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{lang === "bg" ? "Грешка при зареждане. Опитай пак." : lang === "es" ? "Error al cargar. Inténtalo de nuevo." : "Error loading lesson. Please try again."}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {mode === "lesson" && (
            <LessonPanel
              key="lesson"
              data={data}
              lang={lang}
              subject={subject}
              onView={() => recordCompletion("lesson", 0)}
            />
          )}
          {mode === "practice" && (
            <PracticePanel
              key={`practice-${topic.id}`}
              data={data}
              lang={lang}
              subject={subject}
              onComplete={(n) => recordCompletion("practice", n)}
            />
          )}
          {mode === "quiz" && (
            <QuizPanel
              key={`quiz-${topic.id}`}
              data={data}
              lang={lang}
              subject={subject}
              onComplete={(score) => recordCompletion("quiz", score)}
            />
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
