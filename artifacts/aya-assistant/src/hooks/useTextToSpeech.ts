import { useCallback, useRef, useState, useEffect } from "react";
import { setBulgarianVoice } from "@/lib/bulgarian-speech";

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
    if (!synth || !text.trim()) {
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;

    // Set language - enforce it to ensure correct voice is used
    // Default to en-US if not provided
    utterance.lang = options?.lang ?? "en-US";

    // Apply Bulgarian voice selection if language is Bulgarian
    if (utterance.lang.startsWith("bg")) {
      setBulgarianVoice(utterance, utterance.lang);
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error("[TTS_ERROR]", event.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
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
