/**
 * useAyaLessonVoice — Unified TTS hook for the AYA interactive lesson engine.
 *
 * Strategy:
 *   1. Primary  → useVoiceSpeaker  (OpenAI nova via /api/voice/speak)
 *   2. Fallback → useTextToSpeech  (browser Web Speech API)
 *
 * Text preprocessing (Bulgarian):
 *   - Strips emoji before sending to TTS
 *   - Converts math symbols to spoken Bulgarian words via preprocessBulgarianSpeech()
 *     e.g. "3 + 4 = 7" → "три плюс четири равно седем"
 *
 * Voice preference is persisted to localStorage so it survives page reloads.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceSpeaker } from "./use-voice-speaker";
import { useTextToSpeech } from "./useTextToSpeech";
import { preprocessBulgarianSpeech } from "@/lib/bulgarian-speech";

const STORAGE_KEY = "aya_lesson_voice_enabled";

/** Voice emotion modes — map lesson phase to AYA's speaking style */
export type EmotionMode =
  | "intro"        // warm, welcoming, slightly excited (greeting + first explanation)
  | "explain"      // calm, clear, teacher-like (examples, practice lead, quiz)
  | "praise"       // cheerful, brighter, rewarding (correct answer)
  | "hint"         // gentle, supportive, slightly slower (hinting phase)
  | "retry"        // calm, encouraging, never negative (wrong answer retry)
  | "celebration"  // happy, energetic burst (2+ consecutive correct)
  | "completion";  // proud, warm, satisfying ending

const LANG_TO_BCP47: Record<string, string> = {
  bg: "bg-BG",
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
};

function stripEmoji(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[⭐🌟💪🏆✨🎉📝💡]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function preprocessForSpeech(text: string, lang: string): string {
  const clean = stripEmoji(text);
  if (lang === "bg") {
    return preprocessBulgarianSpeech(clean, "bg");
  }
  return clean;
}

export interface AyaLessonVoiceReturn {
  speak: (text: string, emotion?: EmotionMode) => void;
  stop: () => void;
  isPlaying: boolean;
  voiceEnabled: boolean;
  toggleVoice: () => void;
}

export function useAyaLessonVoice(
  lang: string,
  childId: number,
): AyaLessonVoiceReturn {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== "false";
    } catch {
      return true;
    }
  });

  const pendingFallbackRef = useRef<string | null>(null);
  const speakIdRef = useRef(0);

  const browserTts = useTextToSpeech();

  const handleOpenAIError = useCallback(
    (msg: string) => {
      console.warn("[LESSON_VOICE] OpenAI TTS failed, trying browser TTS:", msg);
      const text = pendingFallbackRef.current;
      pendingFallbackRef.current = null;
      if (text) {
        const bcp47 = LANG_TO_BCP47[lang] ?? "en-US";
        browserTts.speak(text, {
          lang: bcp47,
          // Slightly slower + marginally higher pitch = clearer, warmer for children
          rate: lang === "bg" ? 0.82 : 0.87,
          pitch: lang === "bg" ? 1.1 : 1.05,
          volume: 1,
        });
      }
    },
    [lang, browserTts],
  );

  const openAiTts = useVoiceSpeaker({
    childId: childId > 0 ? childId : undefined,
    lang,
    onError: handleOpenAIError,
  });

  const isPlaying =
    openAiTts.speakerState !== "idle" || browserTts.isSpeaking;

  const speak = useCallback(
    (text: string, emotion?: EmotionMode) => {
      if (!voiceEnabled || !text.trim()) return;

      const id = ++speakIdRef.current;
      const processed = preprocessForSpeech(text, lang);
      if (!processed.trim()) return;

      openAiTts.stop();
      browserTts.stop();

      pendingFallbackRef.current = processed;
      openAiTts.speak(processed, `lesson-${id}`, emotion);
    },
    [voiceEnabled, lang, openAiTts, browserTts],
  );

  const stop = useCallback(() => {
    pendingFallbackRef.current = null;
    openAiTts.stop();
    browserTts.stop();
  }, [openAiTts, browserTts]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      if (!next) {
        pendingFallbackRef.current = null;
        openAiTts.stop();
        browserTts.stop();
      }
      return next;
    });
  }, [openAiTts, browserTts]);

  useEffect(() => {
    return () => {
      pendingFallbackRef.current = null;
      openAiTts.stop();
      browserTts.stop();
    };
  }, []);

  return { speak, stop, isPlaying, voiceEnabled, toggleVoice };
}
