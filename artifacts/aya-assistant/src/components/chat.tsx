import { useState, useRef, useEffect, useCallback } from "react";
import { useListChatMessages, useSendChatMessage, ListChatMessagesModule } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { Send, Mic, Loader2, Sparkles, Camera, X, ImageIcon, Volume2, Square, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./layout";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { useVoiceSpeaker } from "@/hooks/use-voice-speaker";

interface SubjectContext {
  subjectLabel: string;
  topicLabel?: string | null;
}

interface ChatProps {
  module: ListChatMessagesModule;
  themeColor: "primary" | "junior" | "student" | "psychology";
  greeting?: string;
  character?: string | null;
  suggestedPrompts?: string[];
  subjectContext?: SubjectContext | null;
}

const CHARACTER_EMOJIS: Record<string, string> = {
  panda: "🐼",
  robot: "🤖",
  fox: "🦊",
  owl: "🦉",
};

const CHARACTER_NAMES: Record<string, string> = {
  panda: "AYA Panda",
  robot: "AYA Robot",
  fox: "AYA Fox",
  owl: "AYA Owl",
};

const CHARACTER_TONES: Record<string, string> = {
  panda: "gentle",
  robot: "encouraging",
  fox: "playful",
  owl: "calm",
};

const TONE_STYLE_LABELS: Record<"en" | "bg" | "es", Record<string, string>> = {
  en: {
    gentle:      "GENTLE STYLE",
    encouraging: "ENCOURAGING STYLE",
    playful:     "PLAYFUL STYLE",
    calm:        "CALM STYLE",
  },
  bg: {
    gentle:      "НЕЖЕН СТИЛ",
    encouraging: "НАСЪРЧАВАЩ СТИЛ",
    playful:     "ИГРИВ СТИЛ",
    calm:        "СПОКОЕН СТИЛ",
  },
  es: {
    gentle:      "ESTILO SUAVE",
    encouraging: "ESTILO MOTIVADOR",
    playful:     "ESTILO LÚDICO",
    calm:        "ESTILO TRANQUILO",
  },
};

const COMPANION_META_LABELS = {
  en: {
    homeworkVision: "HOMEWORK VISION",
    voiceTutor:     "VOICE TUTOR",
    companionDesc:  "Your personal learning companion · guides discovery, not just answers",
    alwaysHere:     "Always here to help",
    subjectPrefix:  "Subject",
    topicPrefix:    "Topic",
  },
  bg: {
    homeworkVision: "ДОМАШНО ОТ СНИМКА",
    voiceTutor:     "ГЛАСОВ УЧИТЕЛ",
    companionDesc:  "Твоят личен учебен компаньон – насочва към откриване, а не само дава отговори.",
    alwaysHere:     "Винаги тук, за да помогна",
    subjectPrefix:  "Предмет",
    topicPrefix:    "Тема",
  },
  es: {
    homeworkVision: "TAREA POR FOTO",
    voiceTutor:     "TUTOR DE VOZ",
    companionDesc:  "Tu compañero de aprendizaje personal – guía el descubrimiento, no solo da respuestas.",
    alwaysHere:     "Siempre aquí para ayudarte",
    subjectPrefix:  "Asignatura",
    topicPrefix:    "Tema",
  },
};

const HOMEWORK_LABELS = {
  en: {
    cameraBtn: "Take photo of homework",
    uploadBtn: "Upload photo",
    analyzing: "AYA is analyzing your homework…",
    userMsg: "📷 Homework photo",
    error: "Could not analyze the image. Please try again.",
  },
  bg: {
    cameraBtn: "Снимай домашното",
    uploadBtn: "Качи снимка",
    analyzing: "AYA анализира домашното…",
    userMsg: "📷 Снимка на домашното",
    error: "Неуспешен анализ на снимката. Опитай пак.",
  },
  es: {
    cameraBtn: "Tomar foto de tarea",
    uploadBtn: "Subir foto",
    analyzing: "AYA está analizando tu tarea…",
    userMsg: "📷 Foto de tarea",
    error: "No se pudo analizar la imagen. Inténtalo de nuevo.",
  },
};

const VOICE_LABELS = {
  en: {
    mic: "Talk to AYA",
    listen: "Listen to AYA",
    stop: "Stop",
    record: "Record question",
    micDenied: "Microphone access denied",
    transcribing: "Listening…",
  },
  bg: {
    mic: "Говори с AYA",
    listen: "Слушай AYA",
    stop: "Спри",
    record: "Запиши въпрос",
    micDenied: "Микрофонът е отказан",
    transcribing: "Слушам…",
  },
  es: {
    mic: "Habla con AYA",
    listen: "Escucha a AYA",
    stop: "Detener",
    record: "Grabar pregunta",
    micDenied: "Acceso al micrófono denegado",
    transcribing: "Escuchando…",
  },
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function Chat({
  module,
  themeColor,
  greeting = "Hello! I'm AYA. How can I help you today?",
  character,
  suggestedPrompts,
  subjectContext,
}: ChatProps) {
  const { activeChildId } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [homeworkPreview, setHomeworkPreview] = useState<string | null>(null);
  const [homeworkFile, setHomeworkFile] = useState<File | null>(null);
  const [analyzingHomework, setAnalyzingHomework] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hwLang: "en" | "bg" | "es" = lang === "bg" ? "bg" : lang === "es" ? "es" : "en";
  const hwLabels = HOMEWORK_LABELS[hwLang];
  const voiceLabels = VOICE_LABELS[hwLang];
  const metaLbl = COMPANION_META_LABELS[hwLang];
  const toneStyleLbl = TONE_STYLE_LABELS[hwLang];

  const { data: messages = [], isLoading, refetch } = useListChatMessages({
    module,
    childId: activeChildId
  });

  const sendMutation = useSendChatMessage();

  /* ── Voice Recorder ────────────────────────────────────────────── */
  const voiceRecorder = useVoiceRecorder({
    lang: hwLang,
    childId: activeChildId,
    onTranscript: (text) => {
      setInput(text);
    },
    onError: (msg) => {
      toast({ title: msg, variant: "destructive" });
    },
  });

  /* ── Voice Speaker ─────────────────────────────────────────────── */
  const voiceSpeaker = useVoiceSpeaker({
    lang: hwLang,
    childId: activeChildId,
    onError: (msg) => {
      toast({ title: msg, variant: "destructive" });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMutation.isPending, analyzingHomework]);

  const doSend = (content: string, onError?: () => void) => {
    if (!content.trim() || sendMutation.isPending) return;
    const fullContent = subjectContext
      ? `${metaLbl.subjectPrefix}: ${subjectContext.subjectLabel}${subjectContext.topicLabel ? ` | ${metaLbl.topicPrefix}: ${subjectContext.topicLabel}` : ""}\n${content}`
      : content;
    sendMutation.mutate(
      { data: { module, content: fullContent, childId: activeChildId } },
      {
        onSuccess: () => {
          refetch().catch(() => {});
        },
        onError: () => {
          toast({
            title: "Error sending message",
            description: "Please try again.",
            variant: "destructive"
          });
          onError?.();
        }
      }
    );
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = input;
    if (!content.trim() || sendMutation.isPending) return;
    setInput("");
    doSend(content, () => setInput(content));
  };

  const handlePromptClick = (prompt: string) => {
    doSend(prompt);
  };

  const handleMicToggle = () => {
    voiceRecorder.toggle();
  };

  /* ── Homework vision flow ──────────────────────────────────────── */
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setHomeworkPreview(previewUrl);
    setHomeworkFile(file);
  }, [toast]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const cancelHomework = () => {
    setHomeworkPreview(null);
    setHomeworkFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendHomework = useCallback(async () => {
    if (!homeworkFile || analyzingHomework) return;

    setAnalyzingHomework(true);
    const userLabel = hwLabels.userMsg;

    try {
      const base64 = await fileToBase64(homeworkFile);
      const mimeType = homeworkFile.type || "image/jpeg";

      sendMutation.mutate({
        data: { module, content: userLabel, childId: activeChildId }
      });

      const token = localStorage.getItem("aya_token");
      const response = await fetch("/api/vision/homework", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          childId: activeChildId,
          image: base64,
          mimeType,
          lang: hwLang,
        }),
      });

      if (!response.ok) throw new Error("Vision API error");

      const { explanation } = await response.json() as { explanation: string; problemText: string };

      await new Promise<void>((resolve) => {
        sendMutation.mutate(
          { data: { module, content: explanation, childId: activeChildId } },
          { onSettled: () => resolve() }
        );
      });

      await refetch();
    } catch {
      toast({ title: hwLabels.error, variant: "destructive" });
    } finally {
      setAnalyzingHomework(false);
      setHomeworkPreview(null);
      setHomeworkFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [homeworkFile, analyzingHomework, hwLang, hwLabels, module, activeChildId, sendMutation, refetch, toast]);

  const colorMap = {
    primary: "bg-primary text-primary-foreground",
    junior: "bg-junior text-junior-foreground",
    student: "bg-student text-student-foreground",
    psychology: "bg-psychology text-psychology-foreground",
  };

  const bubbleColor = colorMap[themeColor];
  const charEmoji = character ? (CHARACTER_EMOJIS[character] ?? "✨") : null;
  const charName = character ? (CHARACTER_NAMES[character] ?? "AYA Junior") : null;
  const charTone = character ? CHARACTER_TONES[character] : null;
  const isJunior = module === "junior";

  const isRecording = voiceRecorder.state === "recording";
  const isTranscribing = voiceRecorder.state === "processing";

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] md:h-[calc(100vh-10rem)] bg-card rounded-3xl shadow-xl shadow-black/5 border border-border/50 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-2xl flex-shrink-0", bubbleColor)}>
          {charEmoji ?? "✨"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-semibold text-lg capitalize">
              {charName ?? `AYA ${module}`}
            </h2>
            {charTone && isJunior && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-junior/20 text-junior-foreground px-2 py-0.5 rounded-full border border-junior/30">
                {toneStyleLbl[charTone] ?? `${charTone} style`}
              </span>
            )}
            {isJunior && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Montessori
              </span>
            )}
            {isJunior && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Camera className="w-2.5 h-2.5" />
                {metaLbl.homeworkVision}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200 flex items-center gap-1">
              <Mic className="w-2.5 h-2.5" />
              {metaLbl.voiceTutor}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {character ? metaLbl.companionDesc : metaLbl.alwaysHere}
          </p>
          {subjectContext && (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${bubbleColor} opacity-90`}>
                {subjectContext.subjectLabel}
              </span>
              {subjectContext.topicLabel && (
                <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full border border-border/40 bg-muted/30">
                  {subjectContext.topicLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : (
          <>
            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[85%]">
                <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm text-sm", bubbleColor)}>
                  {charEmoji ?? "✨"}
                </div>
                <div className="group relative">
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none px-5 py-3 text-foreground shadow-sm">
                    {greeting}
                  </div>
                  <PlayButton
                    text={greeting}
                    msgId="greeting"
                    voiceSpeaker={voiceSpeaker}
                    label={voiceLabels.listen}
                    stopLabel={voiceLabels.stop}
                  />
                </div>
              </div>
            </motion.div>

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div className={cn("flex gap-3 max-w-[85%]", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    {msg.role === "assistant" && (
                      <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm text-sm", bubbleColor)}>
                        {charEmoji ?? "✨"}
                      </div>
                    )}
                    <div className={cn(
                      "relative group",
                      msg.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"
                    )}>
                      <div className={cn(
                        "px-5 py-3 shadow-md",
                        msg.role === "user"
                          ? cn(bubbleColor, "rounded-2xl rounded-tr-none")
                          : "bg-muted/50 text-foreground rounded-2xl rounded-tl-none border border-border/50"
                      )}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      {msg.role === "assistant" && (
                        <PlayButton
                          text={msg.content}
                          msgId={String(msg.id)}
                          voiceSpeaker={voiceSpeaker}
                          label={voiceLabels.listen}
                          stopLabel={voiceLabels.stop}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing / analyzing indicator */}
            {(sendMutation.isPending || analyzingHomework) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[85%]">
                  <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm opacity-70 text-sm", bubbleColor)}>
                    {charEmoji ?? "✨"}
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none px-5 py-3 flex flex-col gap-1">
                    {analyzingHomework ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{hwLabels.analyzing}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested prompts ──────────────────────────────────────── */}
      {isJunior && suggestedPrompts && suggestedPrompts.length > 0 && !homeworkPreview && (
        <div className="px-4 py-2 border-t border-border/30 bg-muted/10 flex gap-2 overflow-x-auto hide-scrollbar">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              disabled={sendMutation.isPending}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border border-junior/40 bg-junior/10 text-junior-foreground hover:bg-junior/20 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* ── Homework preview panel ─────────────────────────────────── */}
      <AnimatePresence>
        {homeworkPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-3 border-t border-border/30 bg-amber-50"
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={homeworkPreview}
                  alt="Homework preview"
                  className="w-20 h-20 object-cover rounded-xl border-2 border-amber-300 shadow-sm"
                />
                <button
                  onClick={cancelHomework}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">
                    {hwLang === "bg" ? "Домашно задание" : hwLang === "es" ? "Tarea" : "Homework"}
                  </span>
                </div>
                <p className="text-xs text-amber-700 mb-2">
                  {hwLang === "bg" ? "Готов? AYA ще обясни задачата стъпка по стъпка." : hwLang === "es" ? "¿Listo? AYA explicará el problema paso a paso." : "Ready? AYA will explain the problem step by step."}
                </p>
                <button
                  onClick={sendHomework}
                  disabled={analyzingHomework}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-sm"
                >
                  {analyzingHomework ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {hwLang === "bg" ? "Анализирай" : hwLang === "es" ? "Analizar" : "Analyze"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recording indicator ────────────────────────────────────── */}
      <AnimatePresence>
        {(isRecording || isTranscribing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-t border-violet-200 bg-violet-50 flex items-center gap-3"
          >
            <span className={cn(
              "w-3 h-3 rounded-full flex-shrink-0",
              isRecording ? "bg-red-500 animate-pulse" : "bg-violet-400 animate-spin"
            )} />
            <span className="text-sm font-semibold text-violet-700">
              {isRecording ? voiceLabels.record : voiceLabels.transcribing}
            </span>
            {isRecording && (
              <button
                onClick={() => voiceRecorder.stop()}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold transition-colors"
              >
                <Square className="w-3 h-3 fill-current" />
                {voiceLabels.stop}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ─────────────────────────────────────────────── */}
      <div className="p-4 bg-card border-t border-border/50">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        <form onSubmit={handleSend} className="flex items-end gap-2 bg-muted/30 p-2 rounded-3xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
          {/* Microphone button */}
          <button
            type="button"
            onClick={handleMicToggle}
            disabled={isTranscribing}
            title={isRecording ? voiceLabels.stop : voiceLabels.mic}
            className={cn(
              "p-3 transition-all rounded-full flex-shrink-0",
              isRecording
                ? "text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-200 animate-pulse"
                : isTranscribing
                ? "text-violet-500 bg-violet-100"
                : "text-muted-foreground hover:text-violet-600 hover:bg-violet-50"
            )}
          >
            {isTranscribing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Camera button — junior only */}
          {isJunior && (
            <button
              type="button"
              onClick={handleCameraClick}
              disabled={analyzingHomework}
              title={hwLabels.cameraBtn}
              className={cn(
                "p-3 transition-colors rounded-full flex-shrink-0",
                homeworkPreview
                  ? "text-amber-500 bg-amber-100 hover:bg-amber-200"
                  : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50",
                "disabled:opacity-40"
              )}
            >
              <Camera className="w-5 h-5" />
            </button>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isJunior ? t.chat.juniorPlaceholder : t.chat.placeholder}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-2 text-foreground placeholder:text-muted-foreground"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            type="submit"
            disabled={!input.trim() || sendMutation.isPending}
            className={cn(
              "p-3 rounded-full flex-shrink-0 transition-all shadow-md",
              input.trim() ? bubbleColor : "bg-muted text-muted-foreground shadow-none"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── PlayButton sub-component ──────────────────────────────────── */
interface PlayButtonProps {
  text: string;
  msgId: string;
  voiceSpeaker: ReturnType<typeof useVoiceSpeaker>;
  label: string;
  stopLabel: string;
}

function PlayButton({ text, msgId, voiceSpeaker, label, stopLabel }: PlayButtonProps) {
  const isThisPlaying = voiceSpeaker.playingId === msgId && voiceSpeaker.speakerState === "playing";
  const isThisLoading = voiceSpeaker.playingId === msgId && voiceSpeaker.speakerState === "loading";

  return (
    <button
      onClick={() => {
        if (isThisPlaying) {
          voiceSpeaker.stop();
        } else {
          void voiceSpeaker.speak(text, msgId);
        }
      }}
      title={isThisPlaying ? stopLabel : label}
      className={cn(
        "mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all",
        isThisPlaying
          ? "bg-violet-100 text-violet-700 border border-violet-300 hover:bg-violet-200"
          : isThisLoading
          ? "bg-violet-50 text-violet-400 border border-violet-200"
          : "bg-muted/40 text-muted-foreground/60 border border-border/30 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 opacity-0 group-hover:opacity-100"
      )}
    >
      {isThisLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isThisPlaying ? (
        <Square className="w-3 h-3 fill-current" />
      ) : (
        <Volume2 className="w-3 h-3" />
      )}
      {isThisLoading ? "…" : isThisPlaying ? stopLabel : label}
    </button>
  );
}
