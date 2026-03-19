import { useCallback, useRef, useState } from "react";

export interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

interface UseTextToSpeechReturn {
  speak: (text: string, options?: TextToSpeechOptions) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const isSupported = synth !== null;

  const speak = useCallback((text: string, options?: TextToSpeechOptions) => {
    if (!synth || !text.trim()) {
      console.warn("[TTS_SPEAK_INVALID] No synth or empty text");
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    // ═══════════════════════════════════════════════════════════════════════
    // STRICT RUNTIME DEBUG: Log exact utterance creation
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[TTS_SPEAK_INPUT] text = '" + text + "'");
    console.log("[TTS_SPEAK_TEXT_LENGTH] " + text.length + " chars");

    const utterance = new SpeechSynthesisUtterance(text);
    
    // DEBUG: Verify utterance text immediately after creation
    console.log("[TTS_UTTERANCE_TEXT] '" + utterance.text + "'");
    console.log("[TTS_UTTERANCE_TEXT_LENGTH] " + utterance.text.length + " chars");
    
    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;

    // Set language - enforce it to ensure correct voice is used
    // Default to en-US if not provided
    const finalLang = options?.lang ?? "en-US";
    utterance.lang = finalLang;
    console.log("[TTS_UTTERANCE_LANG] " + finalLang);

    utterance.onstart = () => {
      console.log("[TTS_ONSTART] Speaking: '" + utterance.text + "'");
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      console.log("[TTS_ONEND] Finished speaking");
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error("[TTS_ONERROR] " + event.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    
    // Final confirmation before speak
    console.log("[TTS_SPEAK_FINAL] Speaking utterance.text = '" + utterance.text + "'");
    synth.speak(utterance);
  }, [synth]);

  const pause = useCallback(() => {
    if (!synth || !isSpeaking) return;
    synth.pause();
    setIsPaused(true);
  }, [synth, isSpeaking]);

  const resume = useCallback(() => {
    if (!synth || !isPaused) return;
    synth.resume();
    setIsPaused(false);
  }, [synth, isPaused]);

  const stop = useCallback(() => {
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [synth]);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported,
  };
}
