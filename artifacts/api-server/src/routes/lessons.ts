import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { getLessonContent } from "../lib/lessonContent";

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

export default router;
