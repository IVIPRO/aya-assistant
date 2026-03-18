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

          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
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

          if (!res.ok) throw new Error("Transcription failed");

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
    } catch {
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
