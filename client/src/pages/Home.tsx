import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Scissors, MessageSquare, BarChart3 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/chat");
    }
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b1a] via-[#111133] to-[#0b0b1a] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scissors className="w-8 h-8 text-orange-400 drop-shadow-md" />
            <span className="text-2xl font-extrabold tracking-wide">
              <span className="text-white">Bispo</span>{" "}
              <span className="text-orange-400">Barber</span>
            </span>
          </div>

          {!loading && (
            user ? (
              <Button
                onClick={() => setLocation("/chat")}
                className="bg-orange-500 hover:bg-orange-600 text-black font-bold"
              >
                Ir para o Chat
              </Button>
            ) : (
              <Button
                asChild
                className="bg-orange-500 hover:bg-orange-600 text-black font-bold"
              >
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 
            leading-tight
            bg-gradient-to-r from-white via-slate-200 to-orange-400 
            bg-clip-text text-transparent tracking-tight">
              Agende seu corte com estilo
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Converse naturalmente com nosso assistente inteligente e marque seu
            horário na barbearia em segundos.
          </p>

          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-black font-bold px-8 py-3 rounded-lg flex items-center gap-2 mx-auto shadow-xl"
            onClick={() => setLocation("/chat")}

          >
            <a href={getLoginUrl()}>
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </a>
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <Card className="p-8 bg-white/5 backdrop-blur-md border border-white/10 hover:border-orange-400 transition-all hover:scale-[1.02]">
            <MessageSquare className="w-12 h-12 text-orange-400 mb-4" />
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-wide">
              Chat Inteligente
            </h3>
            <p className="text-slate-300">
              Um assistente de IA que entende você e agenda seu horário sem complicações.
            </p>
          </Card>

          <Card className="p-8 bg-white/5 backdrop-blur-md border border-white/10 hover:border-orange-400 transition-all hover:scale-[1.02]">
            <Scissors className="w-12 h-12 text-orange-400 mb-4" />
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-wide">
              Agendamento Fácil
            </h3>
            <p className="text-slate-300">
              Escolha data, horário e serviço em poucos cliques.
            </p>
          </Card>

          <Card className="p-8 bg-white/5 backdrop-blur-md border border-white/10 hover:border-orange-400 transition-all hover:scale-[1.02]">
            <BarChart3 className="w-12 h-12 text-orange-400 mb-4" />
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-wide">
              Gerenciamento
            </h3>
            <p className="text-slate-300">
              Visualize, edite ou cancele seus agendamentos quando quiser.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-extrabold mb-6">
            Pronto para elevar seu visual?
          </h2>
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-black font-bold px-8 py-3 rounded-lg shadow-lg"
          >
            <a href={getLoginUrl()}>Faça Login Agora</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
