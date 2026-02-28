import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatBoxProps {
  conversationId: number;
  onAppointmentDetected?: (appointmentData: any) => void;
}

export function ChatBox({ conversationId, onAppointmentDetected }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getMessagesQuery = trpc.chat.getMessages.useQuery({ conversationId });
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  useEffect(() => {
    if (getMessagesQuery.data) {
      setMessages(getMessagesQuery.data as Message[]);
    }
  }, [getMessagesQuery.data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      console.log("Sending message to conversation:", conversationId);
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: userMessage,
      });

      // Add user message to UI
      const newUserMessage: Message = {
        id: Date.now(),
        role: "user",
        content: userMessage,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, newUserMessage]);

      // TODO: Call Python backend for AI response
      // For now, add a placeholder assistant response
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Estou processando sua solicitação. Em breve terei uma resposta para você.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Check for specific error codes or messages
      if (error.message?.includes("44") || error.data?.code === 44) {
        toast.error("Erro 44: Problema na comunicação com o assistente.");
      } else {
        toast.error("Erro ao enviar mensagem. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-900">Assistente de Agendamento</h2>
        <p className="text-sm text-slate-500 mt-1">Converse comigo para agendar seu corte</p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-4">
                <span className="text-2xl">💇</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Bem-vindo!</h3>
              <p className="text-slate-500 max-w-xs">
                Olá! Sou seu assistente de agendamento. Posso ajudá-lo a marcar um corte de cabelo.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in-50 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold">
                    AI
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-xs lg:max-w-md px-4 py-3 rounded-lg",
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-900 rounded-bl-none"
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <span className={cn("text-xs mt-2 block", message.role === "user" ? "text-blue-100" : "text-slate-500")}>
                    {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Descreva o corte que você deseja..."
            disabled={isLoading}
            className="flex-1 rounded-full border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
