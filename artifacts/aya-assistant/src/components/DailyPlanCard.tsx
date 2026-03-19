import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetDailyPlan,
  updateDailyPlanTask,
  getGetDailyPlanQueryKey,
  DailyPlanTaskStatus,
} from "@workspace/api-client-react";
import type { DailyPlan, DailyPlanTask } from "@workspace/api-client-react";
import type { LangCode } from "@/lib/i18n";
import { elementarySubjects } from "@/lib/curriculum";
import type { Subject, Topic } from "@/lib/curriculum";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, Sparkles, PlayCircle, BookOpen, ChevronRight, Loader2 } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   Localization
───────────────────────────────────────────────────────────────── */
const PLAN_I18N: Record<LangCode, {
  title: string;
  subtitle: string;
  reward: string;
  start: string;
  completedBtn: string;
  xpPoints: string;
  progressLabel: (done: number, total: number) => string;
  statusLabels: Record<DailyPlanTaskStatus, string>;
  taskTypeLabels: Record<"lesson" | "practice", string>;
  loading: string;
  empty: string;
}> = {
  en: {
    title: "Daily Learning Plan",
    subtitle: "Today's tasks",
    reward: "Reward",
    start: "Start",
    completedBtn: "Completed",
    xpPoints: "XP points",
    progressLabel: (done, total) => `Tasks completed today: ${done}/${total}`,
    statusLabels: {
      not_started: "Not started",
      in_progress: "In progress",
      completed: "Completed",
    },
    taskTypeLabels: { lesson: "Lesson", practice: "Practice" },
    loading: "Preparing your plan…",
    empty: "No tasks yet",
  },
  bg: {
    title: "Дневен учебен план",
    subtitle: "Днешни задачи",
    reward: "Награда",
    start: "Започни",
    completedBtn: "Завършено",
    xpPoints: "XP точки",
    progressLabel: (done, total) => `Изпълнени задачи днес: ${done}/${total}`,
    statusLabels: {
      not_started: "Не е започнато",
      in_progress: "В процес",
      completed: "Завършено",
    },
    taskTypeLabels: { lesson: "Урок", practice: "Упражнение" },
    loading: "Подготвяме плана…",
    empty: "Няма задачи",
  },
  es: {
    title: "Plan diario de aprendizaje",
    subtitle: "Tareas de hoy",
    reward: "Recompensa",
    start: "Empezar",
    completedBtn: "Completado",
    xpPoints: "Puntos XP",
    progressLabel: (done, total) => `Tareas completadas hoy: ${done}/${total}`,
    statusLabels: {
      not_started: "No iniciado",
      in_progress: "En progreso",
      completed: "Completado",
    },
    taskTypeLabels: { lesson: "Lección", practice: "Práctica" },
    loading: "Preparando tu plan…",
    empty: "Sin tareas",
  },
};

/* ─────────────────────────────────────────────────────────────────
   Subject / topic resolvers from frontend curriculum
───────────────────────────────────────────────────────────────── */
function resolveSubject(subjectId: string): Subject | undefined {
  return elementarySubjects.find(s => s.id === subjectId);
}

function resolveTopic(subjectId: string, topicId: string): Topic | undefined {
  return resolveSubject(subjectId)?.topics.find(t => t.id === topicId);
}

/* ─────────────────────────────────────────────────────────────────
   Status badge
───────────────────────────────────────────────────────────────── */
function StatusPill({
  status,
  label,
}: {
  status: DailyPlanTaskStatus;
  label: string;
}) {
  const cfg = {
    not_started: "bg-gray-100 text-gray-500",
    in_progress:  "bg-yellow-100 text-yellow-700",
    completed:    "bg-green-100 text-green-700",
  } as const;

  const Icon =
    status === "completed"  ? CheckCircle2 :
    status === "in_progress" ? Clock : Circle;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg[status]}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Single task row
───────────────────────────────────────────────────────────────── */
function TaskRow({
  task,
  lang,
  planId,
  onStart,
}: {
  task: DailyPlanTask;
  lang: LangCode;
  planId: number;
  onStart: (task: DailyPlanTask) => void;
}) {
  const i18n = PLAN_I18N[lang];
  const qc = useQueryClient();

  const subject = resolveSubject(task.subjectId);
  const topic   = resolveTopic(task.subjectId, task.topicId);
  const subjectLabel = subject?.label[lang] ?? task.subjectId;
  const topicLabel   = topic?.label[lang]   ?? task.topicId;

  const patchMutation = useMutation({
    mutationFn: (status: DailyPlanTaskStatus) =>
      updateDailyPlanTask(planId, task.id, { status }),
    onSuccess: (updated) => {
      qc.setQueryData(
        getGetDailyPlanQueryKey({ childId: updated.childId }),
        updated,
      );
    },
  });

  const isDone = task.status === "completed";
  const isInProgress = task.status === "in_progress";
  const isPending = patchMutation.isPending;

  function handleStart() {
    if (isDone) return;
    if (!isInProgress) {
      patchMutation.mutate("in_progress");
    }
    onStart(task);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-xl p-3 border transition-colors ${
        isDone
          ? "bg-green-50 border-green-200"
          : isInProgress
          ? "bg-yellow-50 border-yellow-200"
          : "bg-white border-gray-200"
      }`}
    >
      <span className="text-xl flex-shrink-0">{subject?.emoji ?? "📚"}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-700">{subjectLabel}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{topicLabel}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <StatusPill status={task.status} label={i18n.statusLabels[task.status]} />
          <span className="text-xs text-gray-400">
            {i18n.taskTypeLabels[task.taskType]}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
            <Sparkles className="w-3 h-3" />
            {task.xpReward} {i18n.xpPoints}
          </span>
        </div>
      </div>

      <button
        disabled={isDone || isPending}
        onClick={handleStart}
        className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
          isDone
            ? "bg-green-100 text-green-700 cursor-default"
            : "bg-violet-600 hover:bg-violet-700 text-white"
        }`}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isDone ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {i18n.completedBtn}
          </>
        ) : (
          <>
            <PlayCircle className="w-3.5 h-3.5" />
            {i18n.start}
          </>
        )}
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Progress bar
───────────────────────────────────────────────────────────────── */
function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <motion.div
        className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Public component
───────────────────────────────────────────────────────────────── */
export interface DailyPlanCardProps {
  childId: number;
  lang: LangCode;
  onStartTask: (subject: Subject, topic: Topic) => void;
  onPlanLoaded?: (plan: DailyPlan) => void;
}

export function DailyPlanCard({ childId, lang, onStartTask, onPlanLoaded }: DailyPlanCardProps) {
  const i18n = PLAN_I18N[lang];
  const qc = useQueryClient();

  const { data: plan, isLoading } = useGetDailyPlan(
    { childId },
    { query: { queryKey: getGetDailyPlanQueryKey({ childId }), enabled: !!childId, staleTime: 60_000 } },
  );

  const notifiedRef = useRef(false);
  useEffect(() => {
    if (plan && !notifiedRef.current) {
      notifiedRef.current = true;
      onPlanLoaded?.(plan);
    }
  }, [plan, onPlanLoaded]);

  function handleStartTask(task: DailyPlanTask) {
    const subject = resolveSubject(task.subjectId);
    const topic   = resolveTopic(task.subjectId, task.topicId);
    if (subject && topic) {
      onStartTask(subject, topic);
    }
  }

  const tasks = plan?.tasks ?? [];
  const doneTasks = tasks.filter(t => t.status === "completed");
  const doneCount = doneTasks.length;
  const totalCount = tasks.length;

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-violet-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold text-violet-800">{i18n.title}</h3>
          </div>
          {!isLoading && totalCount > 0 && (
            <span className="text-xs font-semibold text-violet-600">
              {i18n.subtitle}
            </span>
          )}
        </div>

        {!isLoading && totalCount > 0 && (
          <div className="mt-2 space-y-1">
            <ProgressBar done={doneCount} total={totalCount} />
            <p className="text-xs text-violet-500 font-medium">
              {i18n.progressLabel(doneCount, totalCount)}
            </p>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-violet-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">{i18n.loading}</span>
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-center text-gray-400 py-4">{i18n.empty}</p>
        ) : (
          <AnimatePresence initial={false}>
            {tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                lang={lang}
                planId={plan!.id}
                onStart={handleStartTask}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
