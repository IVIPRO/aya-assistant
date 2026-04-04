import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { getLessonContent } from "../lib/lessonContent";
import { generateAILesson, type LessonMode } from "../lib/aiLessonGenerator";
import {
  ensureExercisePool,
  getNextExercises,
  recordExerciseResult,
  getPoolStats,
} from "../lib/exercisePoolManager";
import { getCachedLesson, saveCachedLesson } from "../lib/lessonCacheManager";

const router: IRouter = Router();

// ─── Hardcoded lesson content ─────────────────────────────────────────────────

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

// ─── AI-generated single lesson ───────────────────────────────────────────────

router.get("/lessons/generate", requireAuth, async (req, res): Promise<void> => {
  const { subjectId, topicId, grade, lang, mode, variant } = req.query as Record<string, string>;

  if (!subjectId || !topicId) {
    res.status(400).json({ error: "subjectId and topicId are required" });
    return;
  }

  const gradeNum = Math.max(1, Math.min(4, parseInt(grade ?? "2", 10) || 2));
  const validLangs = ["en", "bg", "es", "de", "fr"] as const;
  type ValidLang = typeof validLangs[number];
  const langCode: ValidLang = (validLangs as readonly string[]).includes(lang) ? (lang as ValidLang) : "en";
  const lessonMode: LessonMode = (mode === "weak" || mode === "strong") ? mode : "normal";
  const variantNum = Math.max(0, parseInt(variant ?? "0", 10) || 0);

  try {
    // ─── Check cache first ────────────────────────────────────────────────────
    const cached = await getCachedLesson({
      subjectId,
      topicId,
      grade: gradeNum,
      lang: langCode,
      mode: lessonMode,
      variant: variantNum,
    });

    if (cached) {
      res.json(cached);
      return;
    }

    // ─── Generate new lesson if not cached ────────────────────────────────────
    const content = await generateAILesson(subjectId, topicId, gradeNum, langCode, lessonMode);

    // Save to cache (safe: handles concurrent requests with unique constraint)
    await saveCachedLesson(
      {
        subjectId,
        topicId,
        grade: gradeNum,
        lang: langCode,
        mode: lessonMode,
        variant: variantNum,
      },
      content,
    );

    res.json(content);
  } catch (err) {
    console.error("[LESSONS_GENERATE] Unexpected error:", err);
    res.status(500).json({ error: "Failed to generate lesson" });
  }
});

// ─── Exercise Pool — GET pool info + next exercises ───────────────────────────
//
// GET /lessons/exercises?childId=&subjectId=&topicId=&grade=&lang=&count=
//
// Returns pool stats and the next batch of unused exercises.
// If pool is low, triggers background AI generation before returning.

router.get("/lessons/exercises", requireAuth, async (req, res): Promise<void> => {
  const { childId, subjectId, topicId, grade, lang, count } = req.query as Record<string, string>;

  if (!childId || !subjectId || !topicId) {
    res.status(400).json({ error: "childId, subjectId and topicId are required" });
    return;
  }

  const childIdNum = parseInt(childId, 10);
  if (isNaN(childIdNum)) {
    res.status(400).json({ error: "childId must be a number" });
    return;
  }

  const gradeNum = Math.max(1, Math.min(4, parseInt(grade ?? "2", 10) || 2));
  const langCode = (["en", "bg", "es", "de", "fr"] as string[]).includes(lang) ? lang : "en";
  const exerciseCount = Math.max(1, Math.min(20, parseInt(count ?? "10", 10) || 10));

  try {
    const stats = await ensureExercisePool(childIdNum, subjectId, topicId, gradeNum, langCode);
    const exercises = await getNextExercises(childIdNum, subjectId, topicId, exerciseCount);

    res.json({ stats, exercises });
  } catch (err) {
    console.error("[LESSONS_EXERCISES] Error:", err);
    res.status(500).json({ error: "Failed to load exercise pool" });
  }
});

// ─── Exercise Pool — POST result ──────────────────────────────────────────────
//
// POST /lessons/exercises/result
// Body: { exerciseId: number, correct: boolean, userAnswer: string }
//
// Records the child's answer, marks exercise as used.

router.post("/lessons/exercises/result", requireAuth, async (req, res): Promise<void> => {
  const { exerciseId, correct, userAnswer } = req.body as {
    exerciseId: number;
    correct: boolean;
    userAnswer: string;
  };

  if (exerciseId == null || correct == null) {
    res.status(400).json({ error: "exerciseId and correct are required" });
    return;
  }

  try {
    await recordExerciseResult(Number(exerciseId), Boolean(correct), String(userAnswer ?? ""));
    res.json({ ok: true });
  } catch (err) {
    console.error("[LESSONS_EXERCISES_RESULT] Error:", err);
    res.status(500).json({ error: "Failed to record exercise result" });
  }
});

// ─── Exercise Pool — GET stats only ──────────────────────────────────────────

router.get("/lessons/exercises/stats", requireAuth, async (req, res): Promise<void> => {
  const { childId, subjectId, topicId } = req.query as Record<string, string>;

  if (!childId || !subjectId || !topicId) {
    res.status(400).json({ error: "childId, subjectId and topicId are required" });
    return;
  }

  const childIdNum = parseInt(childId, 10);
  if (isNaN(childIdNum)) {
    res.status(400).json({ error: "childId must be a number" });
    return;
  }

  try {
    const stats = await getPoolStats(childIdNum, subjectId, topicId);
    res.json(stats);
  } catch (err) {
    console.error("[LESSONS_EXERCISES_STATS] Error:", err);
    res.status(500).json({ error: "Failed to get pool stats" });
  }
});

export default router;
