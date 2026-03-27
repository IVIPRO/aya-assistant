/**
 * AYA Junior Video Teacher MVP
 *
 * Maps lesson/chat state keys to pre-recorded video clip asset paths.
 * All paths are relative to the public directory (served as static assets).
 *
 * If a file does not exist at a given path, VideoTeacher falls back silently —
 * the chat/text/voice flow continues uninterrupted.
 */

export type VideoKey =
  | "greeting"
  | "lesson_start"
  | "correct_answer"
  | "wrong_answer"
  | "encouragement"
  | "try_again"
  | "next_task"
  | "lesson_complete"
  | "couldnt_hear"
  | "hint"
  | "math_start"
  | "reading_start"
  | "logic_start"
  | "english_start";

/** Maps each state key to its video asset path (relative to /public). */
export const VIDEO_TEACHER_MAP: Record<VideoKey, string> = {
  greeting:       "/video-teacher/greeting.mp4",
  lesson_start:   "/video-teacher/lesson_start.mp4",
  correct_answer: "/video-teacher/correct_answer.mp4",
  wrong_answer:   "/video-teacher/wrong_answer.mp4",
  encouragement:  "/video-teacher/encouragement.mp4",
  try_again:      "/video-teacher/try_again.mp4",
  next_task:      "/video-teacher/next_task.mp4",
  lesson_complete:"/video-teacher/lesson_complete.mp4",
  couldnt_hear:   "/video-teacher/couldnt_hear.mp4",
  hint:           "/video-teacher/hint.mp4",
  math_start:     "/video-teacher/math_start.mp4",
  reading_start:  "/video-teacher/reading_start.mp4",
  logic_start:    "/video-teacher/logic_start.mp4",
  english_start:  "/video-teacher/english_start.mp4",
};

/** Returns the resolved asset path for a key, or empty string if unknown. */
export function resolveVideoPath(key: VideoKey): string {
  return VIDEO_TEACHER_MAP[key] ?? "";
}

/**
 * Maps the teacher state machine signal + current subject (if any)
 * to the appropriate VideoKey.
 *
 * Returns null when no video should be triggered for a given transition.
 */
export function teacherStateToVideoKey(
  teacherState: "idle" | "talking" | "happy" | "thinking" | "encouraging",
  inChatView: boolean,
  activeSubject: "math" | "reading" | "logic" | "english" | null
): VideoKey | null {
  switch (teacherState) {
    case "happy":
      return "correct_answer";

    case "encouraging":
      if (!inChatView) return null;
      return "wrong_answer";

    case "talking":
      if (!inChatView) return null;
      if (activeSubject === "math")    return "math_start";
      if (activeSubject === "reading") return "reading_start";
      if (activeSubject === "logic")   return "logic_start";
      if (activeSubject === "english") return "english_start";
      return "lesson_start";

    case "thinking":
      if (!inChatView) return null;
      return "try_again";

    case "idle":
    default:
      return null;
  }
}
