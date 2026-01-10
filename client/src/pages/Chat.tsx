import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatBox } from "@/components/ChatBox";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Plus, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Chat() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  const startConversationMutation = trpc.chat.startConversation.useMutation();
  const getConversationsQuery = trpc.chat.getConversations.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setLocation("/");
      return;
    }

    // Start a new conversation if none exists
    if (!conversationId && (!getConversationsQuery.data || getConversationsQuery.data.length === 0)) {
      handleNewConversation();
    } else if (getConversationsQuery.data && getConversationsQuery.data.length > 0 && !conversationId) {
      setConversationId(getConversationsQuery.data[0].id);
    }
  }, [user, loading, conversationId, getConversationsQuery.data]);

  const handleNewConversation = async () => {
    try {
      const result = await startConversationMutation.mutateAsync();
      setConversationId(result.conversationId);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Barber AI Scheduler</h1>
          <p className="text-lg text-slate-600">Agende seu corte de cabelo com nosso assistente inteligente</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card className="h-96 lg:h-[600px] overflow-hidden shadow-lg border-slate-200">
              {conversationId ? (
                <ChatBox conversationId={conversationId} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">💬</span>
                    </div>
                    <p className="text-slate-600">Iniciando conversa...</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Recent Conversations */}
            {getConversationsQuery.data && getConversationsQuery.data.length > 1 && (
              <Card className="mt-6 p-4 bg-white border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Conversas Recentes</h3>
                <div className="space-y-2">
                  {getConversationsQuery.data.slice(0, 3).map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setConversationId(conv.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        conversationId === conv.id
                          ? "bg-blue-50 border border-blue-200 text-blue-900"
                          : "hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{conv.title}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(conv.updatedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* New Conversation Button */}
            <Button
              onClick={handleNewConversation}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nova Conversa
            </Button>

            {/* Quick Appointment Form */}
            <Card className="p-6 bg-white border-slate-200 shadow-lg">
              <h3 className="font-semibold text-slate-900 mb-4">Agendar Rápido</h3>
              <AppointmentForm onSuccess={() => setShowAppointmentForm(false)} />
            </Card>

            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Como Funciona</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Converse com nosso assistente</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Escolha data e horário</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Confirme seu agendamento</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
