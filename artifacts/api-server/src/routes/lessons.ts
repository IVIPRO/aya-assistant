import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { getLessonContent } from "../lib/lessonContent";
import { generateAILesson, type LessonMode } from "../lib/aiLessonGenerator";

const router: IRouter = Router();

router.get("/lessons/content", requireAuth, (req, res): void => {
  const { subjectId, topicId, grade, lang } = req.query as Record<string, string>;

  if (!subjectId || !topicId) {
    res.status(400).json({ error: "subjectId and topicId are required" });
    return;
  }

  const gradeNum = Math.max(1, Math.min(4, parseInt(grade ?? "2", 10) || 2));
  const langCode = (lang === "bg" || lang === "es") ? lang : "en";

  const content = getLessonContent(subjectId, topicId, gradeNum, langCode);
  res.json(content);
});

router.get("/lessons/generate", requireAuth, async (req, res): Promise<void> => {
  const { subjectId, topicId, grade, lang, mode } = req.query as Record<string, string>;

  if (!subjectId || !topicId) {
    res.status(400).json({ error: "subjectId and topicId are required" });
    return;
  }

  const gradeNum = Math.max(1, Math.min(4, parseInt(grade ?? "2", 10) || 2));
  const validLangs = ["en", "bg", "es", "de", "fr"] as const;
  type ValidLang = typeof validLangs[number];
  const langCode: ValidLang = (validLangs as readonly string[]).includes(lang) ? (lang as ValidLang) : "en";
  const lessonMode: LessonMode = (mode === "weak" || mode === "strong") ? mode : "normal";

  try {
    const content = await generateAILesson(subjectId, topicId, gradeNum, langCode, lessonMode);
    res.json(content);
  } catch (err) {
    console.error("[LESSONS_GENERATE] Unexpected error:", err);
    res.status(500).json({ error: "Failed to generate lesson" });
  }
});

export default router;
