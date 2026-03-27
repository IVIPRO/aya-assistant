import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { EDUCATION_STAGES } from "@/lib/curriculum";
import type { LangCode } from "@/lib/i18n";

interface StageSelectorProps {
  lang: LangCode;
  currentGrade: number;
  onSelectGrade: (grade: number, stageId: "stage1" | "stage2") => void;
  onBack: () => void;
  /** Restrict which stages are visible. Omit to show all. */
  allowedStageIds?: ("stage1" | "stage2")[];
}

const GRADE_LABELS: Record<LangCode, Record<number, string>> = {
  en: { 1: "Grade 1", 2: "Grade 2", 3: "Grade 3", 4: "Grade 4", 5: "Grade 5", 6: "Grade 6", 7: "Grade 7" },
  bg: { 1: "1 клас", 2: "2 клас", 3: "3 клас", 4: "4 клас", 5: "5 клас", 6: "6 клас", 7: "7 клас" },
  es: { 1: "1º Primaria", 2: "2º Primaria", 3: "3º Primaria", 4: "4º Primaria", 5: "5º Primaria", 6: "6º Primaria", 7: "7º Primaria" },
  de: { 1: "Klasse 1", 2: "Klasse 2", 3: "Klasse 3", 4: "Klasse 4", 5: "Klasse 5", 6: "Klasse 6", 7: "Klasse 7" },
  fr: { 1: "1ère année", 2: "2e année", 3: "3e année", 4: "4e année", 5: "5e année", 6: "6e année", 7: "7e année" },
};

const BACK_LABEL: Record<LangCode, string> = {
  bg: "Назад", es: "Atrás", de: "Zurück", fr: "Retour", en: "Back",
};

export function StageSelector({ lang, currentGrade, onSelectGrade, onBack, allowedStageIds }: StageSelectorProps) {
  const visibleStages = allowedStageIds
    ? EDUCATION_STAGES.filter(s => allowedStageIds.includes(s.id))
    : EDUCATION_STAGES;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {BACK_LABEL[lang]}
      </button>

      <div className="space-y-6">
        {visibleStages.map((stage, stageIdx) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stageIdx * 0.1 }}
            className="bg-gradient-to-br from-white to-slate-50 rounded-[2rem] border-2 border-slate-200 overflow-hidden shadow-lg"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
              <h2 className="text-2xl font-display font-bold text-white">{stage.label[lang]}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {lang === "bg"
                  ? `Класове ${stage.grades[0]}–${stage.grades[stage.grades.length - 1]}`
                  : lang === "es"
                  ? `Grados ${stage.grades[0]}–${stage.grades[stage.grades.length - 1]}`
                  : lang === "de"
                  ? `Klassen ${stage.grades[0]}–${stage.grades[stage.grades.length - 1]}`
                  : lang === "fr"
                  ? `Classes ${stage.grades[0]}–${stage.grades[stage.grades.length - 1]}`
                  : `Grades ${stage.grades[0]}–${stage.grades[stage.grades.length - 1]}`}
              </p>
            </div>

            <div className="p-8">
              <div className={`grid gap-4 ${stage.grades.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
                {stage.grades.map((grade) => {
                  const isSelected = grade === currentGrade;
                  return (
                    <motion.button
                      key={grade}
                      onClick={() => onSelectGrade(grade, stage.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center justify-center min-h-24 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-300 shadow-md"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      {GRADE_LABELS[lang][grade]}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
