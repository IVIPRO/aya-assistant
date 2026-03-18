import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, FlaskConical, Pencil, Brain, MessageCircle, Lock } from "lucide-react";
import { elementarySubjects, SUBJECT_ACTIONS_LABELS, type Subject, type Topic } from "@/lib/curriculum";
import type { LangCode } from "@/lib/i18n";
import { cn } from "@/components/layout";

interface SubjectPanelProps {
  lang: LangCode;
  childName: string;
  characterEmoji: string;
  onStart: (subject: Subject, topic: Topic | null) => void;
  onBack: () => void;
}

const ACTION_ICONS = [BookOpen, Pencil, FlaskConical, MessageCircle];

export function SubjectPanel({ lang, childName, characterEmoji, onStart, onBack }: SubjectPanelProps) {
  const [selected, setSelected] = useState<Subject | null>(null);
  const labels = SUBJECT_ACTIONS_LABELS[lang];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={selected ? () => setSelected(null) : onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/60 px-4 py-2 rounded-xl border border-white/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {selected ? labels.backToSubjects : "Back"}
        </button>
        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/50">
          <span className="text-lg">{characterEmoji}</span>
          <span className="font-bold text-sm text-junior-foreground">
            {selected ? selected.label[lang] : (lang === "bg" ? "Избери предмет" : lang === "es" ? "Elige materia" : "Choose a subject")}
          </span>
        </div>
        <div className="w-24" />
      </div>

      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div key="subject-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-4 text-center">
              <p className="text-muted-foreground text-sm">
                {lang === "bg"
                  ? `${childName}, какво искаш да учим днес?`
                  : lang === "es"
                  ? `${childName}, ¿qué quieres aprender hoy?`
                  : `${childName}, what would you like to learn today?`}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {elementarySubjects.map((subject, idx) => (
                <motion.button
                  key={subject.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(subject)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-3xl border-2 shadow-sm hover:shadow-md transition-all text-left",
                    subject.bgClass,
                    subject.borderClass,
                  )}
                >
                  <span className="text-4xl">{subject.emoji}</span>
                  <span className={cn("font-bold text-sm text-center leading-tight", subject.colorClass)}>
                    {subject.label[lang]}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {subject.topics.length} {lang === "bg" ? "теми" : lang === "es" ? "temas" : "topics"}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="topic-panel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className={cn("rounded-3xl border-2 p-6 mb-5", selected.bgClass, selected.borderClass)}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-5xl">{selected.emoji}</span>
                <div>
                  <h3 className={cn("text-xl font-display font-bold", selected.colorClass)}>
                    {selected.label[lang]}
                  </h3>
                  <p className="text-xs text-muted-foreground">{labels.chooseTopic}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {selected.topics.map((topic, idx) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white/80 rounded-2xl border border-white shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-3">
                      <p className="font-semibold text-sm text-foreground">{topic.label[lang]}</p>
                    </div>
                    <div className="grid grid-cols-4 border-t border-border/20">
                      {[
                        { key: "lessons",  Icon: BookOpen,    label: labels.lessons },
                        { key: "practice", Icon: Pencil,      label: labels.practice },
                        { key: "quiz",     Icon: Brain,       label: labels.quiz },
                        { key: "askAya",   Icon: MessageCircle, label: labels.askAya },
                      ].map(({ key, Icon, label }) => (
                        <button
                          key={key}
                          onClick={key === "askAya" ? () => onStart(selected, topic) : undefined}
                          disabled={key !== "askAya"}
                          title={key !== "askAya" ? labels.comingSoon : label}
                          className={cn(
                            "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                            key === "askAya"
                              ? cn("cursor-pointer hover:bg-junior/10", selected.colorClass)
                              : "text-muted-foreground/40 cursor-not-allowed",
                          )}
                        >
                          {key !== "askAya" ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => onStart(selected, null)}
                className={cn(
                  "w-full py-3 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90",
                  "bg-white/60 border-white/80",
                  selected.colorClass
                )}
              >
                <MessageCircle className="w-4 h-4" />
                {labels.noTopicNeeded}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
