import { useState, useRef, useEffect } from "react";
import { useListChatMessages, useSendChatMessage, ListChatMessagesModule } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Send, Mic, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./layout";
import { useToast } from "@/hooks/use-toast";

interface ChatProps {
  module: ListChatMessagesModule;
  themeColor: "primary" | "junior" | "student" | "psychology";
  greeting?: string;
}

export function Chat({ module, themeColor, greeting = "Hello! I'm AYA. How can I help you today?" }: ChatProps) {
  const { activeChildId } = useAuth();
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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sendMutation.isPending) return;

    const content = input;
    setInput("");

    try {
      await sendMutation.mutateAsync({
        data: {
          module,
          content,
          childId: activeChildId
        }
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again.",
        variant: "destructive"
      });
      setInput(content); // restore
    }
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

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] bg-card rounded-3xl shadow-xl shadow-black/5 border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-md", bubbleColor)}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg capitalize">AYA {module}</h2>
          <p className="text-xs text-muted-foreground">Always here to help</p>
        </div>
      </div>

      {/* Messages */}
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
                <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm", bubbleColor)}>
                  <Sparkles className="w-4 h-4" />
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
                      <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm", bubbleColor)}>
                        <Sparkles className="w-4 h-4" />
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
                  <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm opacity-70", bubbleColor)}>
                    <Sparkles className="w-4 h-4 animate-pulse" />
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

      {/* Input */}
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
            placeholder="Type your message..."
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
