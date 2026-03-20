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

type TeacherStateSignal = "idle" | "talking" | "happy" | "thinking" | "encouraging";

interface ChatProps {
  module: ListChatMessagesModule;
  themeColor: "primary" | "junior" | "student" | "psychology";
  greeting?: string;
  character?: string | null;
  suggestedPrompts?: string[];
  subjectContext?: SubjectContext | null;
  onTeacherStateChange?: (state: TeacherStateSignal, message?: string) => void;
  onAyaMessageReceived?: (message: string) => void;
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
    selectedImage: "Selected image",
    send: "Send",
    cancel: "Cancel",
    successMsg: "Image uploaded successfully.",
    invalidFile: "Please choose an image.",
    fileTooLarge: "The image is too large.",
    uploadedImageCaption: "Uploaded image",
    assistantFollowUp: "I received the image. I'm ready to review it.",
    sendError: "There was a problem sending the image.",
  },
  bg: {
    cameraBtn: "Снимай домашното",
    uploadBtn: "Качи снимка",
    analyzing: "AYA анализира домашното…",
    userMsg: "📷 Снимка на домашното",
    error: "Неуспешен анализ на снимката. Опитай пак.",
    selectedImage: "Избрана снимка",
    send: "Изпрати",
    cancel: "Отказ",
    successMsg: "Снимката е качена успешно.",
    invalidFile: "Моля, избери снимка.",
    fileTooLarge: "Снимката е твърде голяма.",
    uploadedImageCaption: "Качена снимка",
    assistantFollowUp: "Получих снимката. Готова съм да я прегледам.",
    sendError: "Възникна проблем при изпращането на снимката.",
  },
  es: {
    cameraBtn: "Tomar foto de tarea",
    uploadBtn: "Subir foto",
    analyzing: "AYA está analizando tu tarea…",
    userMsg: "📷 Foto de tarea",
    error: "No se pudo analizar la imagen. Inténtalo de nuevo.",
    selectedImage: "Imagen seleccionada",
    send: "Enviar",
    cancel: "Cancelar",
    successMsg: "La imagen se cargó correctamente.",
    invalidFile: "Por favor, selecciona una imagen.",
    fileTooLarge: "La imagen es demasiado grande.",
    uploadedImageCaption: "Imagen cargada",
    assistantFollowUp: "Recibí la imagen. Estoy lista para revisarla.",
    sendError: "Hubo un problema al enviar la imagen.",
  },
};

const VOICE_LABELS = {
  en: {
    mic: "Talk to AYA",
    listen: "Listen to AYA",
    stop: "Stop",
    record: "Listening…",
    micDenied: "Microphone access denied",
    transcribing: "Processing…",
  },
  bg: {
    mic: "Говори с AYA",
    listen: "Слушай AYA",
    stop: "Спри",
    record: "Слушам…",
    micDenied: "Микрофонът е отказан",
    transcribing: "Обработвам…",
  },
  es: {
    mic: "Habla con AYA",
    listen: "Escucha a AYA",
    stop: "Detener",
    record: "Escuchando…",
    micDenied: "Acceso al micrófono denegado",
    transcribing: "Procesando…",
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

/* Praise keywords used to detect a happy response */
const PRAISE_RX = /\b(great|well done|correct|perfect|excellent|amazing|brilliant|fantastic|wonderful|superb|bravo|congratul|you got it|exactly right|absolutely right)\b|браво|отлично|перфектно|точно|вярно|правилно|страхотно|чудесно|поздравя|много добре|¡(muy bien|excelente|perfecto|correcto|fantástico|brillante|bravo)/i;

export function Chat({
  module,
  themeColor,
  greeting = "Hello! I'm AYA. How can I help you today?",
  character,
  suggestedPrompts,
  subjectContext,
  onTeacherStateChange,
  onAyaMessageReceived,
}: ChatProps) {
  const { activeChildId } = useAuth();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [homeworkPreview, setHomeworkPreview] = useState<string | null>(null);
  const [homeworkFile, setHomeworkFile] = useState<File | null>(null);
  const [analyzingHomework, setAnalyzingHomework] = useState(false);
  const [imagePreviewsMap, setImagePreviewsMap] = useState<Record<string, string>>({});
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
      // Auto-send recognized voice input as a real message
      doSend(text);
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

  /* ── Teacher state signals ─────────────────────────────────────────── */
  const prevPendingRef = useRef(false);

  useEffect(() => {
    if (!onTeacherStateChange) return;
    if (sendMutation.isPending) {
      onTeacherStateChange("talking");
    } else if (prevPendingRef.current && !sendMutation.isPending) {
      // AI just finished responding — inspect last message
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        const isPraise = PRAISE_RX.test(lastMsg.content);
        onTeacherStateChange(isPraise ? "happy" : "encouraging");
      } else {
        onTeacherStateChange("idle");
      }
    }
    prevPendingRef.current = sendMutation.isPending;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendMutation.isPending]);

  useEffect(() => {
    if (!onTeacherStateChange) return;
    if (analyzingHomework) onTeacherStateChange("thinking");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzingHomework]);

  // ── Capture last AYA message for Listening Mode ──────────────────────
  useEffect(() => {
    if (!onAyaMessageReceived || messages.length === 0) return;
    
    // Find the last AYA (assistant) message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        const rawContent = messages[i].content;
        
        // Extract clean text: remove image markers and clean up
        const cleanedContent = rawContent
          .replace(/\[IMAGE:[^\]]+\]\n?/g, "") // Remove image markers
          .trim();
        
        if (cleanedContent) {
          onAyaMessageReceived(cleanedContent);
        }
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // When waiting with empty input → thinking after a pause
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!onTeacherStateChange || sendMutation.isPending) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (input === "") {
      idleTimerRef.current = setTimeout(() => {
        onTeacherStateChange("thinking");
      }, 12000);
    }
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, sendMutation.isPending]);

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
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validImageTypes.includes(file.type)) {
      toast({ title: hwLabels.invalidFile, variant: "destructive" });
      return;
    }

    // Validate file size (max 10MB)
    const maxSizeMB = 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({ title: hwLabels.fileTooLarge, variant: "destructive" });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setHomeworkPreview(previewUrl);
    setHomeworkFile(file);
  }, [hwLabels, toast]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const cancelHomework = () => {
    setHomeworkPreview(null);
    setHomeworkFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendHomework = useCallback(() => {
    if (!homeworkFile || !homeworkPreview) return;

    try {
      // CRITICAL: Capture file and preview NOW to prevent stale closure
      const fileToSend = homeworkFile;
      const previewToUse = homeworkPreview;
      
      // Generate unique image ID
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Log before reading to confirm which file is being sent
      console.log("[AYA_HOMEWORK] ===== FRONTEND IMAGE SEND FLOW =====");
      console.log(`[AYA_HOMEWORK] image id: ${imageId}`);
      console.log(`[AYA_HOMEWORK] file name: ${fileToSend.name}`);
      console.log(`[AYA_HOMEWORK] file size: ${fileToSend.size} bytes`);
      console.log(`[AYA_HOMEWORK] mime type: ${fileToSend.type || "image/jpeg"}`);
      
      // Convert file to base64 for transmission to backend
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Result = reader.result as string;
          const base64Data = base64Result.split(",")[1] ?? "";
          const mimeType = fileToSend.type || "image/jpeg";
          
          // Generate file fingerprint from base64 content
          // Use first 50 chars of base64 + total length as lightweight fingerprint
          const fingerprint = base64Data.substring(0, 50).substring(0, 10) + "_" + base64Data.length;
          
          console.log(`[AYA_HOMEWORK] base64 size: ${base64Data.length}`);
          console.log(`[AYA_HOMEWORK] file fingerprint: ${fingerprint}`);
          
          // Store the preview URL for display
          setImagePreviewsMap(prev => ({ ...prev, [imageId]: previewToUse }));

          // Send message with image data as base64 (backend will analyze it with vision API)
          // Format: [IMAGE_DATA:base64Data:mimeType:imageId]\nCaption
          const imageDataMarker = `[IMAGE_DATA:${base64Data}:${mimeType}:${imageId}]`;
          console.log(`[AYA_HOMEWORK] ${imageId} sending homework image request...`);
          sendMutation.mutate(
            { data: { module, content: `${imageDataMarker}\n${hwLabels.uploadedImageCaption}`, childId: activeChildId } },
            {
              onSuccess: () => {
                console.log(`[AYA_HOMEWORK] ${imageId} upload completed`);
                console.log(`[AYA_HOMEWORK] ${imageId} refetching message list`);
                refetch().catch(() => {
                  console.log(`[AYA_HOMEWORK] ${imageId} refetch error`);
                });
              },
              onError: (error) => {
                console.log(`[AYA_HOMEWORK] ${imageId} send failed:`, error);
                toast({ title: hwLabels.sendError, variant: "destructive" });
              },
            }
          );

          // Clear temporary preview and file after sending
          setHomeworkPreview(null);
          setHomeworkFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
          console.log("[AYA_HOMEWORK] send error:", error);
          toast({ title: hwLabels.sendError, variant: "destructive" });
        }
      };
      reader.onerror = () => {
        console.log("[AYA_HOMEWORK] file read error");
        toast({ title: hwLabels.sendError, variant: "destructive" });
      };
      reader.readAsDataURL(fileToSend);
    } catch (error) {
      console.log("[AYA_HOMEWORK] homework send exception:", error);
      toast({ title: hwLabels.sendError, variant: "destructive" });
    }
  }, [homeworkFile, homeworkPreview, module, activeChildId, sendMutation, hwLabels, toast, refetch]);

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
                      {/* Check for image marker in message */}
                      {msg.role === "user" && msg.content.includes("[IMAGE:") && (
                        <div className="mb-2">
                          {(() => {
                            const match = msg.content.match(/\[IMAGE:([^\]]+)\]/);
                            const imageId = match?.[1];
                            const imageUrl = imageId ? imagePreviewsMap[imageId] : null;
                            return imageUrl ? (
                              <img
                                src={imageUrl}
                                alt="Uploaded homework"
                                className="w-32 h-32 object-cover rounded-xl shadow-md border-2 border-orange-200"
                              />
                            ) : null;
                          })()}
                        </div>
                      )}
                      <div className={cn(
                        "px-5 py-3 shadow-md",
                        msg.role === "user"
                          ? cn(bubbleColor, "rounded-2xl rounded-tr-none")
                          : "bg-muted/50 text-foreground rounded-2xl rounded-tl-none border border-border/50"
                      )}>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.content.replace(/\[IMAGE:[^\]]+\]\n?/, "")}
                        </p>
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
                    {hwLabels.selectedImage}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={sendHomework}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    {hwLabels.send}
                  </button>
                  <button
                    onClick={cancelHomework}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-sm transition-all shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    {hwLabels.cancel}
                  </button>
                </div>
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
