import { db, cachedLessonsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { LessonMode } from "./aiLessonGenerator";

type LangCode = "en" | "bg" | "es" | "de" | "fr";

export interface CachedLessonParams {
  subjectId: string;
  topicId: string;
  grade: number;
  lang: LangCode;
  mode: LessonMode;
  variant?: number;
}

/**
 * Retrieve a cached lesson if it exists.
 * Returns the lesson content or null if not found.
 */
export async function getCachedLesson(params: CachedLessonParams): Promise<any | null> {
  try {
    const result = await db
      .select()
      .from(cachedLessonsTable)
      .where(
        and(
          eq(cachedLessonsTable.subjectId, params.subjectId),
          eq(cachedLessonsTable.topicId, params.topicId),
          eq(cachedLessonsTable.grade, params.grade),
          eq(cachedLessonsTable.lang, params.lang),
          eq(cachedLessonsTable.mode, params.mode),
          eq(cachedLessonsTable.variant, params.variant ?? 0),
        ),
      );

    if (result.length > 0) {
      console.log(
        `[LESSON_CACHE_HIT] ${params.subjectId}/${params.topicId} grade=${params.grade} lang=${params.lang} mode=${params.mode} variant=${params.variant ?? 0}`,
      );
      return result[0].content;
    }

    return null;
  } catch (error) {
    console.error("[LESSON_CACHE_GET_ERROR]", error);
    return null;
  }
}

/**
 * Save a generated lesson to the cache.
 * Safely handles conflicts (if the lesson was just cached by another request).
 */
export async function saveCachedLesson(
  params: CachedLessonParams,
  content: any,
): Promise<boolean> {
  try {
    await db.insert(cachedLessonsTable).values({
      subjectId: params.subjectId,
      topicId: params.topicId,
      grade: params.grade,
      lang: params.lang,
      mode: params.mode,
      variant: params.variant ?? 0,
      content,
    });

    console.log(
      `[LESSON_CACHE_SAVED] ${params.subjectId}/${params.topicId} grade=${params.grade} lang=${params.lang} mode=${params.mode} variant=${params.variant ?? 0}`,
    );
    return true;
  } catch (error: any) {
    if (error?.code === "23505") {
      console.log(
        `[LESSON_CACHE_CONFLICT] ${params.subjectId}/${params.topicId} (concurrent save, using existing cache)`,
      );
      return false;
    }
    console.error("[LESSON_CACHE_SAVE_ERROR]", error);
    return false;
  }
}

/**
 * Clear cache for a specific topic (useful for testing/admin).
 */
export async function clearLessonCache(subjectId: string, topicId: string): Promise<number> {
  try {
    const result = await db
      .delete(cachedLessonsTable)
      .where(
        and(
          eq(cachedLessonsTable.subjectId, subjectId),
          eq(cachedLessonsTable.topicId, topicId),
        ),
      );

    console.log(`[LESSON_CACHE_CLEARED] ${subjectId}/${topicId}`);
    return result.rowCount ?? 0;
  } catch (error) {
    console.error("[LESSON_CACHE_CLEAR_ERROR]", error);
    return 0;
  }
}
