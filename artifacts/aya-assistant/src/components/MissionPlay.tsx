import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Trophy } from "lucide-react";
import type { LangCode } from "@/lib/i18n";

interface Task {
  id: number;
  expression: string;
  answer: number;
}

interface MissionState {
  missionId: number;
  title: string;
  completedCount: number;
  requiredCount: number;
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  xpEarned: number;
}

interface MissionPlayProps {
  childId: number;
  missionId: string;
  missionTitle: string;
  requiredTasks: number;
  lang: LangCode;
  onBack: () => void;
  onComplete: () => void;
}

const MESSAGES: Record<LangCode, {
  taskPrompt: string;
  submit: string;
  tryAgain: string;
  correctPrefix: string[];
  incorrectMsg: string;
  missionComplete: string;
  nextTask: string;
  answerPlaceholder: string;
  loading: string;
  error: string;
  progress: (done: number, total: number) => string;
}> = {
  en: {
    taskPrompt: "What's the answer?",
    submit: "Check",
    tryAgain: "Try again",
    correctPrefix: ["Great job!", "Excellent!", "Perfect!", "Well done!", "Fantastic!"],
    incorrectMsg: "That's not quite right. Try again!",
    missionComplete: "🎉 Mission Complete!",
    nextTask: "Next →",
    answerPlaceholder: "Type your answer…",
    loading: "Loading...",
    error: "Something went wrong",
    progress: (done, total) => `${done} / ${total} completed`,
  },
  bg: {
    taskPrompt: "Какъв е отговорът?",
    submit: "Провери",
    tryAgain: "Опитай отново",
    correctPrefix: ["Браво!", "Отлично!", "Супер!", "Напълно вярно!", "Разбра си!"],
    incorrectMsg: "Не е съвсем правилно. Опитай отново!",
    missionComplete: "🎉 Мисията е изпълнена!",
    nextTask: "Следващ →",
    answerPlaceholder: "Напиши отговора…",
    loading: "Зареждам...",
    error: "Има грешка",
    progress: (done, total) => `${done} / ${total} задачи решени`,
  },
  es: {
    taskPrompt: "¿Cuál es la respuesta?",
    submit: "Verificar",
    tryAgain: "Inténtalo de nuevo",
    correctPrefix: ["¡Muy bien!", "¡Excelente!", "¡Perfecto!", "¡Bien hecho!", "¡Fantástico!"],
    incorrectMsg: "Eso no es del todo correcto. ¡Intenta de nuevo!",
    missionComplete: "🎉 ¡Misión completada!",
    nextTask: "Siguiente →",
    answerPlaceholder: "Escribe tu respuesta…",
    loading: "Cargando...",
    error: "Algo salió mal",
    progress: (done, total) => `${done} / ${total} completadas`,
  },
  de: {
    taskPrompt: "Was ist die Antwort?",
    submit: "Überprüfen",
    tryAgain: "Nochmal versuchen",
    correctPrefix: ["Großartig!", "Hervorragend!", "Perfekt!", "Gut gemacht!", "Fantastisch!"],
    incorrectMsg: "Das ist nicht ganz richtig. Versuche es nochmal!",
    missionComplete: "🎉 Mission vollständig!",
    nextTask: "Nächste →",
    answerPlaceholder: "Gib deine Antwort ein…",
    loading: "Lädt...",
    error: "Etwas ist schief gelaufen",
    progress: (done, total) => `${done} / ${total} abgeschlossen`,
  },
  fr: {
    taskPrompt: "Quelle est la réponse?",
    submit: "Vérifier",
    tryAgain: "Réessayer",
    correctPrefix: ["Bravo!", "Excellent!", "Parfait!", "Bien fait!", "Fantastique!"],
    incorrectMsg: "Ce n'est pas tout à fait juste. Réessaye!",
    missionComplete: "🎉 Mission complétée!",
    nextTask: "Suivant →",
    answerPlaceholder: "Écris ta réponse…",
    loading: "Chargement...",
    error: "Quelque chose s'est mal passé",
    progress: (done, total) => `${done} / ${total} complétées`,
  },
};

export function MissionPlay({
  childId,
  missionId,
  missionTitle,
  requiredTasks,
  lang,
  onBack,
  onComplete,
}: MissionPlayProps) {
  const [mission, setMission] = useState<MissionState | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const msg = MESSAGES[lang];

  // Initialize mission
  useEffect(() => {
    const startMission = async () => {
      try {
        console.log(`[MISSION_START] missionId=${missionId}, missionTitle=${missionTitle}`);
        
        const res = await fetch("/api/missions/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childId, missionId }),
        });

        if (!res.ok) throw new Error("Failed to start mission");

        const data = await res.json();
        console.log(`[MISSION_PAYLOAD] task received:`, {
          taskId: data.currentTask?.id,
          taskType: data.currentTask?.type,
          taskExpression: data.currentTask?.expression,
          taskAnswer: data.currentTask?.answer,
        });
        
        setMission({
          missionId: data.mission.id,
          title: missionTitle,
          completedCount: data.completedCount || 0,
          requiredCount: data.requiredCount || requiredTasks,
          currentTask: data.currentTask || null,
          isLoading: false,
          error: null,
          xpEarned: 0,
        });
      } catch (err) {
        console.error(`[MISSION_ERROR] Failed to start mission:`, err);
        setMission({
          missionId: 0,
          title: missionTitle,
          completedCount: 0,
          requiredCount: requiredTasks,
          currentTask: null,
          isLoading: false,
          error: msg.error,
          xpEarned: 0,
        });
      }
    };

    startMission();
  }, [childId, missionId, missionTitle, requiredTasks, msg.error]);

  const handleSubmitAnswer = async () => {
    if (!mission?.currentTask || !userAnswer || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const answer = parseInt(userAnswer, 10);
      if (isNaN(answer)) {
        console.log(`[ANSWER_INVALID] userAnswer="${userAnswer}" is not a valid number`);
        setFeedback({ text: msg.incorrectMsg, isCorrect: false });
        setUserAnswer("");
        setIsSubmitting(false);
        return;
      }

      // Debug word problem answer submission
      console.log(`[WORD_PROBLEM] text: "${mission.currentTask.expression}"`);
      console.log(`[WORD_PROBLEM] submittedAnswer: ${answer} (type: ${typeof answer})`);
      console.log(`[WORD_PROBLEM] expectedAnswer: ${mission.currentTask.answer} (type: ${typeof mission.currentTask.answer})`);
      console.log(`[ANSWER_CHECK] taskId=${mission.currentTask.id}, userAnswer=${answer}, expectedAnswer=${mission.currentTask.answer}`);

      const res = await fetch(`/api/missions/tasks/${mission.currentTask.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAnswer: answer,
          childLang: lang,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`[ANSWER_ERROR_RESPONSE] status=${res.status}, body=${errorBody}`);
        throw new Error(`Failed to submit answer: ${res.status} ${errorBody}`);
      }

      const data = await res.json();
      console.log(`[ANSWER_RESULT] correct=${data.correct}, missionComplete=${data.isMissionComplete}`);
      
      const feedbackText = data.responseMessage || msg.incorrectMsg;
      setFeedback({ text: feedbackText, isCorrect: data.correct });
      setSubmitted(true);

      if (data.correct) {
        const newXp = (mission.xpEarned || 0) + 5;
        setMission(prev => prev ? { ...prev, xpEarned: newXp, completedCount: (prev.completedCount || 0) + 1 } : null);

        // Check if mission is complete
        if (data.isMissionComplete) {
          setTimeout(() => {
            setMission(prev => prev ? { ...prev, xpEarned: newXp + 30 } : null);
            onComplete();
          }, 2000);
        } else if (data.nextTask) {
          setTimeout(() => {
            console.log(`[NEXT_TASK] nextTaskId=${data.nextTask.id}, expression=${data.nextTask.expression}`);
            setMission(prev => prev ? { ...prev, currentTask: data.nextTask } : null);
            setUserAnswer("");
            setFeedback(null);
            setSubmitted(false);
          }, 2000);
        }
      }
    } catch (err) {
      console.error(`[ANSWER_ERROR] Error submitting answer:`, err);
      setFeedback({ text: msg.error, isCorrect: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextTask = () => {
    if (feedback?.isCorrect) {
      setUserAnswer("");
      setFeedback(null);
      setSubmitted(false);
    }
  };

  if (!mission) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">{msg.loading}</p>
      </div>
    );
  }

  if (mission.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{mission.error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
          >
            {msg.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  const isComplete = mission.completedCount >= mission.requiredCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center gap-4">
          <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
            <span className="text-sm font-bold text-orange-600">
              {msg.progress(mission.completedCount, mission.requiredCount)}
            </span>
          </div>
          {mission.xpEarned > 0 && (
            <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
              <span className="text-sm font-bold text-yellow-600">
                +{mission.xpEarned} XP
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mission Title */}
      <h2 className="text-2xl font-bold mb-8">{mission.title}</h2>

      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-4">{msg.missionComplete}</h3>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Trophy className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold text-orange-600">
                +{mission.xpEarned} XP
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              Amazing work! You've completed this mission.
            </p>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-junior text-junior-foreground font-bold rounded-xl"
            >
              {msg.tryAgain}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="task"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Task Display */}
            {mission.currentTask && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-200">
                <p className="text-muted-foreground text-sm mb-4">{msg.taskPrompt}</p>
                <div className="text-5xl font-bold text-center text-blue-600 font-mono">
                  {mission.currentTask.expression}
                </div>
              </div>
            )}

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-xl border-2 ${
                    feedback.isCorrect
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p
                    className={`${
                      feedback.isCorrect ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {feedback.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Answer Input */}
            {!submitted ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmitAnswer()}
                  placeholder={msg.answerPlaceholder}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer || isSubmitting}
                  className="px-6 py-3 bg-junior text-junior-foreground font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {msg.submit}
                </button>
              </div>
            ) : feedback?.isCorrect ? (
              <button
                onClick={handleNextTask}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600"
              >
                {msg.nextTask}
              </button>
            ) : (
              <button
                onClick={() => {
                  setUserAnswer("");
                  setFeedback(null);
                  setSubmitted(false);
                }}
                className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600"
              >
                {msg.tryAgain}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
