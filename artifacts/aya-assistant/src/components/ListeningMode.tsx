import { useEffect, useState, ReactNode } from "react";
import { Volume2, Pause, Play, X, AlertCircle } from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { motion, AnimatePresence } from "framer-motion";

interface ListeningModeProps {
  isOpen: boolean;
  onClose: () => void;
  contentToRead: string;
  lang: "en" | "bg" | "es";
  characterEmoji?: string;
}

/**
 * Remove emojis, labels, and special characters from text for clean speech synthesis.
 * Extracts only the actual educational message text, not UI labels.
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // Remove common UI labels/markers that shouldn't be spoken
  cleaned = cleaned
    .replace(/\bAYA\s+\d+\b/gi, "") // Remove "AYA 2", "AYA 3", etc.
    .replace(/\bAYA\s+(Panda|Robot|Fox|Owl)\b/gi, "") // Remove "AYA Panda", etc.
    .replace(/^\s*\[.*?\]\s*/g, "") // Remove labels like [LABEL]
    .replace(/^(read|listen|say|speak):\s*/gi, ""); // Remove "read:", "listen:", etc.
  
  // Remove emojis and other non-text characters
  cleaned = cleaned
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Emoji ranges
    .replace(/[\u{2600}-\u{27BF}]/gu, "") // Miscellaneous symbols
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // Supplemental symbols and pictographs
    .replace(/[\u{2300}-\u{23FF}]/gu, "") // Miscellaneous technical
    .replace(/[\u{2000}-\u{206F}]/gu, "") // General punctuation (but keep some)
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
  characterEmoji = "🐼",
}: ListeningModeProps) {
  const lbl = LISTENING_LABELS[lang];
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } =
    useTextToSpeech();
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const hasText = contentToRead && contentToRead.trim().length > 0;
    setHasContent(hasText);
  }, [contentToRead]);

  const handleListen = () => {
    // ═══════════════════════════════════════════════════════════════════════
    // STRICT RUNTIME DEBUG: Trace exact source and transformation of speech text
    // ═══════════════════════════════════════════════════════════════════════
    
    console.log("[LISTENING_DEBUG_1_RAW_INPUT] contentToRead = '" + contentToRead + "'");
    console.log("[LISTENING_DEBUG_1_RAW_LENGTH] " + contentToRead.length + " chars");
    
    if (!contentToRead.trim()) {
      console.warn("[LISTENING_INVALID_NO_CONTENT]");
      return;
    }
    
    // Clean the text to remove emojis and special characters
    const cleanedText = cleanTextForSpeech(contentToRead);
    
    console.log("[LISTENING_DEBUG_2_CLEANED] '" + cleanedText + "'");
    console.log("[LISTENING_DEBUG_2_CLEANED_LENGTH] " + cleanedText.length + " chars");
    
    if (!cleanedText.trim()) {
      console.warn("[LISTENING_MODE] Text cleaned to empty, check input");
      return;
    }
    
    // STRICT VALIDATION: Block speech if text is too short (likely a label/header)
    if (cleanedText.length < 10) {
      console.error("[LISTENING_INVALID_TEXT_BLOCKED] Text too short (" + cleanedText.length + " chars): '" + cleanedText + "' — NOT speaking");
      return;
    }
    
    // Final utterance text - this is what will be spoken
    const finalUtteranceText = cleanedText;
    console.log("[LISTENING_UTTERANCE_FINAL] '" + finalUtteranceText + "'");
    console.log("[LISTENING_UTTERANCE_LENGTH] " + finalUtteranceText.length + " chars");
    console.log("[LISTENING_UTTERANCE_LANG] " + LANG_MAP[lang]);
    
    speak(finalUtteranceText, {
      lang: LANG_MAP[lang],
      rate: 0.9,
      pitch: 1,
      volume: 1,
    });
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
              <div className="text-4xl">{characterEmoji}</div>
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
