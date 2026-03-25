import { useState, useRef, useCallback } from "react";

export type RecorderState = "idle" | "recording" | "processing";

interface UseVoiceRecorderOptions {
  onTranscript: (text: string) => void;
  onError?: (msg: string) => void;
  childId?: number | null;
  lang?: string;
}

export function useVoiceRecorder({ onTranscript, onError, childId, lang }: UseVoiceRecorderOptions) {
  const [state, setState] = useState<RecorderState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (state !== "idle") return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn("[FREE_MODE_BLOCKED_BY_PLATFORM]", { reason: "mediaDevices.getUserMedia unavailable" });
        onError?.("Гласовият режим не се поддържа в този браузър. Отвори в Safari.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (blob.size < 1000) {
          setState("idle");
          return;
        }

        setState("processing");

        try {
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const token = localStorage.getItem("aya_token");
          console.log("[VOICE_RECORDER] sending transcription", { hasToken: !!token, lang, mimeType, blobSize: blob.size });

          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              audio: base64,
              mimeType,
              lang: lang ?? "en",
              childId: childId ?? undefined,
            }),
          });
          console.log("[VOICE_TRANSCRIBE_REQUEST]", { status: res.status, ok: res.ok });

          if (!res.ok) {
            console.warn("[VOICE_RECORDER] /api/voice/transcribe failed", { status: res.status });
            throw new Error(`Transcription failed (HTTP ${res.status})`);
          }

          const { text } = await res.json() as { text: string };
          if (text.trim()) onTranscript(text.trim());
        } catch (err) {
          onError?.(err instanceof Error ? err.message : "Transcription error");
        } finally {
          setState("idle");
        }
      };

      mr.start(1000);
      setState("recording");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("not allowed by the user agent") || message.includes("permission") || message.includes("user denied")) {
        console.warn("[FREE_MODE_BLOCKED_BY_PLATFORM]", { reason: message });
        onError?.("Гласовият режим не се поддържа в този браузър. Отвори в Safari.");
        return;
      }
      onError?.("Microphone access denied");
      setState("idle");
    }
  }, [state, childId, lang, onTranscript, onError]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  const toggle = useCallback(() => {
    if (state === "idle") start();
    else if (state === "recording") stop();
  }, [state, start, stop]);

  return { state, start, stop, toggle };
}
