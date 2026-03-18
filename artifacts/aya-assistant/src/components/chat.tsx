import { useState, useRef, useEffect } from "react";
import { useListChatMessages, useSendChatMessage, ListChatMessagesModule } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { Send, Mic, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./layout";
import { useToast } from "@/hooks/use-toast";

interface ChatProps {
  module: ListChatMessagesModule;
  themeColor: "primary" | "junior" | "student" | "psychology";
  greeting?: string;
  character?: string | null;
  suggestedPrompts?: string[];
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

export function Chat({
  module,
  themeColor,
  greeting = "Hello! I'm AYA. How can I help you today?",
  character,
  suggestedPrompts,
}: ChatProps) {
  const { activeChildId } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, refetch } = useListChatMessages({
    module,
    childId: activeChildId
  });

  const sendMutation = useSendChatMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMutation.isPending]);

  const doSend = (content: string, onError?: () => void) => {
    if (!content.trim() || sendMutation.isPending) return;
    sendMutation.mutate(
      { data: { module, content, childId: activeChildId } },
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

  const handleMic = () => {
    toast({
      title: "Voice Input",
      description: "Voice features are coming in the next update!",
    });
  };

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

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] md:h-[calc(100vh-10rem)] bg-card rounded-3xl shadow-xl shadow-black/5 border border-border/50 overflow-hidden">
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
                {charTone} style
              </span>
            )}
            {isJunior && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Montessori
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {character ? "Your personal learning companion · guides discovery, not just answers" : "Always here to help"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[85%]">
                <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm text-sm", bubbleColor)}>
                  {charEmoji ?? "✨"}
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-tl-none px-5 py-3 text-foreground shadow-sm">
                  {greeting}
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
                      "px-5 py-3 shadow-md",
                      msg.role === "user"
                        ? cn(bubbleColor, "rounded-2xl rounded-tr-none")
                        : "bg-muted/50 text-foreground rounded-2xl rounded-tl-none border border-border/50"
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sendMutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[85%]">
                  <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm opacity-70 text-sm", bubbleColor)}>
                    {charEmoji ?? "✨"}
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isJunior && suggestedPrompts && suggestedPrompts.length > 0 && (
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

      <div className="p-4 bg-card border-t border-border/50">
        <form onSubmit={handleSend} className="flex items-end gap-2 bg-muted/30 p-2 rounded-3xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
          <button
            type="button"
            onClick={handleMic}
            className="p-3 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10 flex-shrink-0"
          >
            <Mic className="w-5 h-5" />
          </button>

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
