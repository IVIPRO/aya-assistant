import { useState, useRef, useCallback } from "react";

export type SpeakerState = "idle" | "loading" | "playing";

interface UseVoiceSpeakerOptions {
  childId?: number | null;
  lang?: string;
  onError?: (msg: string) => void;
}

export function useVoiceSpeaker({ childId, lang, onError }: UseVoiceSpeakerOptions = {}) {
  const [state, setSpeakerState] = useState<SpeakerState>("idle");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const speak = useCallback(async (text: string, id: string) => {
    if (!text.trim()) return;

    if (state !== "idle") {
      audioRef.current?.pause();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setSpeakerState("idle");
      setPlayingId(null);
      if (playingId === id) return;
    }

    setSpeakerState("loading");
    setPlayingId(id);

    try {
      console.log("[VOICE_SPEAKER] speak() called", { id, lang, textLen: text.length });
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, lang: lang ?? "en", childId: childId ?? undefined }),
      });
      console.log("[VOICE_SPEAK_RESPONSE]", { status: res.status, ok: res.ok });

      if (!res.ok) {
        console.warn("[VOICE_SPEAKER] /api/voice/speak failed", { status: res.status, id });
        throw new Error(`TTS failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setSpeakerState("playing");
      audio.onended = () => {
        setSpeakerState("idle");
        setPlayingId(null);
        URL.revokeObjectURL(url);
        blobUrlRef.current = null;
      };
      audio.onerror = () => {
        setSpeakerState("idle");
        setPlayingId(null);
        onError?.("Playback failed");
      };

      await audio.play();
    } catch (err) {
      setSpeakerState("idle");
      setPlayingId(null);
      onError?.(err instanceof Error ? err.message : "TTS error");
    }
  }, [state, playingId, childId, lang, onError]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setSpeakerState("idle");
    setPlayingId(null);
  }, []);

  return { speakerState: state, playingId, speak, stop };
}
