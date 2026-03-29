import { useCallback, useRef, useState, useEffect } from "react";
import { setBulgarianVoice, preprocessBulgarianSpeech } from "@/lib/bulgarian-speech";

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
  const voicesLoadedRef = useRef(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const isSupported = synth !== null;

  // Ensure voices are loaded on desktop Chrome before first speak() call
  useEffect(() => {
    if (!synth) return;
    
    // Force voices to load by calling getVoices()
    synth.getVoices();
    
    // Listen for voiceschanged event (desktop Chrome) 
    const handleVoicesChanged = () => {
      voicesLoadedRef.current = true;
      synth.getVoices(); // Cache voices after load
    };
    
    synth.addEventListener("voiceschanged", handleVoicesChanged);
    
    // Try calling immediately in case voices are already loaded
    if (synth.getVoices().length > 0) {
      voicesLoadedRef.current = true;
    }
    
    return () => {
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, [synth]);

  const speak = useCallback((text: string, options?: TextToSpeechOptions) => {
    console.log("[SPEAK_CALL] text:", text.substring(0, 50), "lang:", options?.lang);
    if (!synth || !text.trim()) {
      console.warn("[SPEAK_CALL] Skipped - no synth or empty text");
      return;
    }

    // Check voices availability
    const voices = synth.getVoices();
    console.log("[SPEAK_VOICES] available:", voices.length);

    // Cancel any ongoing speech
    synth.cancel();

    // For Bulgarian, preprocess math operators to spoken Bulgarian words
    // (e.g. "15 / 5 = 3" → "петнадесет разделено на пет равно три")
    // English and all other languages pass through unchanged.
    const lang = options?.lang ?? "en-US";
    const processedText = lang.startsWith("bg")
      ? preprocessBulgarianSpeech(text, lang)
      : text;

    const utterance = new SpeechSynthesisUtterance(processedText);
    
    utterance.rate = options?.rate ?? 0.9;
    utterance.pitch = options?.pitch ?? 1.05;
    utterance.volume = options?.volume ?? 1;

    // Set language - enforce it to ensure correct voice is used
    // Default to en-US if not provided
    utterance.lang = options?.lang ?? "en-US";

    // Apply Bulgarian voice selection if language is Bulgarian
    if (utterance.lang.startsWith("bg")) {
      setBulgarianVoice(utterance, utterance.lang);
    }

    console.log("[SPEAK_UTTERANCE] lang:", utterance.lang, "voice:", utterance.voice?.name ?? "DEFAULT", "text_len:", utterance.text.length);

    utterance.onstart = () => {
      console.log("[SPEAK_ONSTART] Speech started");
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      console.log("[SPEAK_ONEND] Speech ended");
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error("[SPEAK_ONERROR] Error:", event.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    console.log("[SPEAK_CALLING] synth.speak()");
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
