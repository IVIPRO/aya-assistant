import { useEffect, useState, ReactNode } from "react";
import { Volume2, Pause, Play, X, AlertCircle } from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { preprocessBulgarianSpeech } from "@/lib/bulgarian-speech";
import { motion, AnimatePresence } from "framer-motion";
// import { AYAAvatar } from "@/components/AYAAvatar"; // Temporarily disabled to debug mounting issue

interface ListeningModeProps {
  isOpen: boolean;
  onClose: () => void;
  contentToRead: string;
  lang: "en" | "bg" | "es";
  characterEmoji?: string; // Deprecated: use expression prop instead
  expression?: "neutral" | "happy" | "thinking" | "encouraging" | "celebrating";
}

/**
 * Remove emojis, labels, and special characters from text for clean speech synthesis.
 * Extracts only the actual educational message text, not UI labels.
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // Remove UI labels and decorative text that shouldn't be spoken
  cleaned = cleaned
    .replace(/\bAYA\s+\d+\b/gi, "") // Remove "AYA 2", "AYA 3", etc.
    .replace(/\bAYA\s+(Panda|Robot|Fox|Owl)\b/gi, "") // Remove "AYA Panda", etc.
    .replace(/^\s*\[.*?\]\s*/g, "") // Remove labels like [LABEL]
    .replace(/^(read|listen|say|speak):\s*/gi, "") // Remove "read:", "listen:", etc.
    .replace(/\b(интерфейс|interface|interface|zero|equal|minus|star|stars|hearts?|hearts?|badges?|badges?)\b/gi, ""); // Remove common UI words
  
  // Remove emojis, symbols, and decoration
  cleaned = cleaned
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Emoji ranges
    .replace(/[\u{2600}-\u{27BF}]/gu, "") // Miscellaneous symbols
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // Supplemental symbols and pictographs
    .replace(/[\u{2300}-\u{23FF}]/gu, "") // Miscellaneous technical
    .replace(/[\u{2000}-\u{206F}]/gu, "") // General punctuation (keep some)
    .replace(/[^\p{L}\p{N}\s.,!?;:—–-]/gu, "") // Keep only letters, numbers, and basic punctuation
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
  
  return cleaned;
}

const LISTENING_LABELS: Record<"en" | "bg" | "es", {
  title: string;
  listenButton: string;
  stopButton: string;
  pauseButton: string;
  resumeButton: string;
  reading: string;
  paused: string;
  noSupport: string;
  noContent: string;
  noContentDesc: string;
}> = {
  en: {
    title: "Listen Mode",
    listenButton: "Listen",
    stopButton: "Stop",
    pauseButton: "Pause",
    resumeButton: "Resume",
    reading: "AYA is reading...",
    paused: "Paused",
    noSupport: "Listening mode is not supported on this device.",
    noContent: "No text to read right now.",
    noContentDesc: "Open a lesson or mission to use Listening Mode.",
  },
  bg: {
    title: "Режим на слушане",
    listenButton: "Слушай",
    stopButton: "Спри",
    pauseButton: "Пауза",
    resumeButton: "Продължи",
    reading: "AYA чете...",
    paused: "Пауза",
    noSupport: "Режимът на слушане не се поддържа на това устройство.",
    noContent: "Няма текст за прочитане в момента.",
    noContentDesc: "Отвори урок или мисия, за да използваш режима на слушане.",
  },
  es: {
    title: "Modo de escucha",
    listenButton: "Escuchar",
    stopButton: "Detener",
    pauseButton: "Pausa",
    resumeButton: "Reanudar",
    reading: "AYA está leyendo...",
    paused: "Pausa",
    noSupport: "El modo de escucha no es compatible con este dispositivo.",
    noContent: "No hay texto para leer ahora mismo.",
    noContentDesc: "Abre una lección o misión para usar el modo de escucha.",
  },
};

const LANG_MAP: Record<"en" | "bg" | "es", string> = {
  en: "en-US",
  bg: "bg-BG",
  es: "es-ES",
};

export function ListeningMode({
  isOpen,
  onClose,
  contentToRead,
  lang,
  characterEmoji, // Deprecated
  expression: initialExpression = "neutral",
}: ListeningModeProps) {
  const lbl = LISTENING_LABELS[lang];
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } =
    useTextToSpeech();
  const [hasContent, setHasContent] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [expression, setExpression] = useState<"neutral" | "happy" | "thinking" | "encouraging" | "celebrating">(initialExpression);

  useEffect(() => {
    const hasText = !!(contentToRead && contentToRead.trim().length > 0);
    setHasContent(hasText);
  }, [contentToRead]);

  // Update expression based on audio state
  useEffect(() => {
    if (isSpeaking) {
      setExpression("happy");
    } else {
      setExpression("neutral");
    }
  }, [isSpeaking]);

  const handleListen = async () => {
    console.log("[LISTEN_CLICK] Button clicked, isSupported:", isSupported);
    if (!contentToRead || !contentToRead.trim()) {
      console.log("[LISTEN_CLICK] No content to read");
      return;
    }

    const langCode = LANG_MAP[lang];
    console.log("[LISTEN_CLICK] langCode:", langCode);

    // Step 1: Preprocess Bulgarian math BEFORE cleaning (operators must be intact for regex)
    const preprocessed = preprocessBulgarianSpeech(contentToRead, langCode);

    // Step 2: Clean UI noise and decorative text (emojis, labels, UI words)
    const speechText = cleanTextForSpeech(preprocessed);
    console.log("[LISTEN_CLICK] speechText:", speechText.substring(0, 50), "len:", speechText.length);

    // Step 3: Validate — only speak if there's actual content
    if (!speechText || speechText.trim().length < 3) {
      console.log("[LISTEN_CLICK] Text too short, skipping speak");
      return;
    }

    // Step 4: Try server-side TTS first
    const success = await tryServerTTS(speechText);
    if (success) {
      console.log("[LISTEN_CLICK] Server TTS succeeded");
      return;
    }

    // Step 5: Fallback to browser speech
    console.log("[LISTEN_CLICK] Server TTS failed, falling back to browser speech");
    speak(speechText, {
      lang: langCode,
      rate: 0.9,
      pitch: 1,
      volume: 1,
    });
  };

  const tryServerTTS = async (text: string): Promise<boolean> => {
    try {
      console.log("[TTS_API] Calling /api/tts/aya");
      const response = await fetch("/api/tts/aya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.log("[TTS_API] Server returned", response.status);
        return false;
      }

      // Stop any existing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      const blob = await response.blob();
      console.log("[TTS_API] Audio blob received:", blob.size, "bytes");
      
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onplay = () => {
        console.log("[TTS_AUDIO] Audio playback started");
      };
      audio.onended = () => {
        console.log("[TTS_AUDIO] Audio playback ended");
        URL.revokeObjectURL(url);
      };
      audio.onerror = (e) => {
        console.log("[TTS_AUDIO] Audio error:", e);
        URL.revokeObjectURL(url);
      };

      setAudioElement(audio);
      audio.play().catch((err) => {
        console.log("[TTS_AUDIO] Failed to play:", err);
      });

      return true;
    } catch (error) {
      console.log("[TTS_API] Error:", error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  const handleStop = () => {
    stop();
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center"
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/30">
            <div className="flex items-center gap-3">
              {/* Temporarily using emoji instead of AYAAvatar while debugging */}
              <div className="text-4xl">🐼</div>
              <div>
                <h2 className="font-bold text-lg">{lbl.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {isSpeaking ? lbl.reading : isPaused ? lbl.paused : "Ready"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Not Supported */}
            {!isSupported && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900 text-sm">
                    {lbl.noSupport}
                  </div>
                  <p className="text-xs text-red-700 mt-1">
                    Please try on a device with speech synthesis support.
                  </p>
                </div>
              </div>
            )}

            {/* No Content */}
            {isSupported && !hasContent && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-900 text-sm">
                    {lbl.noContent}
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    {lbl.noContentDesc}
                  </p>
                </div>
              </div>
            )}

            {/* Content Preview */}
            {isSupported && hasContent && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contentToRead}
                </p>
              </div>
            )}

            {/* Control Buttons */}
            {isSupported && hasContent && (
              <div className="mt-6 flex gap-3">
                {!isSpeaking && !isPaused && (
                  <button
                    onClick={handleListen}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <Volume2 className="w-5 h-5" />
                    {lbl.listenButton}
                  </button>
                )}

                {isSpeaking && (
                  <>
                    <button
                      onClick={handlePauseResume}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-5 h-5" />
                          {lbl.resumeButton}
                        </>
                      ) : (
                        <>
                          <Pause className="w-5 h-5" />
                          {lbl.pauseButton}
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleStop}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                      <X className="w-5 h-5" />
                      {lbl.stopButton}
                    </button>
                  </>
                )}

                {isPaused && (
                  <>
                    <button
                      onClick={handlePauseResume}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                      <Play className="w-5 h-5" />
                      {lbl.resumeButton}
                    </button>

                    <button
                      onClick={handleStop}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                      <X className="w-5 h-5" />
                      {lbl.stopButton}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {isSupported && hasContent && (
            <div className="px-6 py-3 bg-gray-50 rounded-b-3xl border-t border-border/30">
              <p className="text-xs text-muted-foreground text-center">
                📖 {lbl.reading}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
