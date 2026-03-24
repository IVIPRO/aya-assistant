import { useEffect, useState, useRef, useCallback } from "react";

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
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      try {
        audioRef.current?.pause();
      } catch {}
      audioRef.current = null;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    };
  }, []);

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
      const token = localStorage.getItem("aya_token");
      console.log("[VOICE_SPEAKER] speak() called", { id, lang, hasToken: !!token, textLen: text.length });
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, lang: lang ?? "en", childId: childId ?? undefined }),
      });

      if (!res.ok) {
        console.warn("[VOICE_SPEAKER] /api/voice/speak failed", { status: res.status, id });
        throw new Error(`TTS failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      if (!mountedRef.current) return;
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        if (mountedRef.current) setSpeakerState("playing");
      };
      audio.onended = () => {
        if (!mountedRef.current) return;
        setSpeakerState("idle");
        setPlayingId(null);
        URL.revokeObjectURL(url);
        blobUrlRef.current = null;
        audioRef.current = null;
      };
      audio.onerror = () => {
        if (!mountedRef.current) return;
        setSpeakerState("idle");
        setPlayingId(null);
        onError?.("Playback failed");
      };

      if (!mountedRef.current) return;
      await audio.play();
    } catch (err) {
      if (!mountedRef.current) return;
      setSpeakerState("idle");
      setPlayingId(null);
      onError?.(err instanceof Error ? err.message : "TTS error");
    }
  }, [state, playingId, childId, lang, onError]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    audioRef.current = null;
    setSpeakerState("idle");
    setPlayingId(null);
  }, []);

  return { speakerState: state, playingId, speak, stop };
}
