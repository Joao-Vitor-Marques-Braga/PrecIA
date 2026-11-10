"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bot,
  User,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { HeaderCep } from "@/components/header-cep";
import { ChatInput } from "@/components/chat-input";
import { ProductCard } from "@/components/product-card";
import { VerdictCard } from "@/components/verdict-card";
import { ConfidenceModal } from "@/components/confidence-modal";
import { MonitorModal } from "@/components/monitor-modal";
import { MonitoredDrawer } from "@/components/monitored-drawer";
import { AuthModal } from "@/components/auth-modal";
import { createClient } from "@/lib/supabase/client";
import type { StoreOffer, SearchResponse } from "@/app/api/search/route";
import type { VisionLLMOutput } from "@/lib/validations";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  type: "text" | "image" | "search_result" | "status";
  text?: string;
  imageUrl?: string;
  searchData?: SearchResponse;
  timestamp: Date;
}

export default function HomePage() {
  const [cep, setCep] = useState("01310-100"); // Padrão São Paulo
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      type: "text",
      text: "Olá! Sou o PrecIA, seu comparador inteligente omnichannel. Fotografe a etiqueta na gôndola da loja física ou digite o modelo do produto para descobrir o menor preço em tempo real e ativar alertas com IA!",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVisionData, setPendingVisionData] = useState<VisionLLMOutput | null>(null);
  const [isConfidenceModalOpen, setIsConfidenceModalOpen] = useState(false);

  // Estados de Auth, Monitoramento e Afiliados
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState(false);
  const [isMonitoredDrawerOpen, setIsMonitoredDrawerOpen] = useState(false);
  const [selectedOfferForMonitor, setSelectedOfferForMonitor] = useState<StoreOffer | null>(null);
  const [monitoredCount, setMonitoredCount] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicialização de Auth do Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
      }
    }).catch(() => {});

    // Carrega contagem inicial de monitorados
    fetch("/api/monitored-products")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setMonitoredCount(data.items.length);
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut().catch(() => {});
    setCurrentUser(null);
  };

  /**
   * Executa a busca de preços na API
   */
  const executeSearch = async (query: string, physicalPrice?: number) => {
    setIsLoading(true);

    const statusId = `status-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: statusId,
        sender: "assistant",
        type: "status",
        text: `Consultando Mercado Livre, Amazon, Magalu, Fast Shop e KaBuM! para "${query}"...`,
        timestamp: new Date(),
      },
    ]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          cep,
          physicalStorePrice: physicalPrice,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Erro ${res.status}: Não foi possível buscar as ofertas.`
        );
      }

      const searchData: SearchResponse = await res.json();

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== statusId),
        {
          id: `result-${Date.now()}`,
          sender: "assistant",
          type: "search_result",
          searchData,
          timestamp: new Date(),
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== statusId),
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          type: "text",
          text: `⚠️ ${error?.message || "Ocorreu um erro ao buscar os preços online. Tente novamente."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Envio de mensagem de texto pelo usuário
   */
  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      type: "text",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    executeSearch(text);
  };

  /**
   * Envio de imagem da câmera/galeria
   */
  const handleSendImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem excede o limite máximo de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;

      const userMsg: ChatMessage = {
        id: `user-img-${Date.now()}`,
        sender: "user",
        type: "image",
        imageUrl: base64Data,
        text: "Foto da etiqueta capturada",
        timestamp: new Date(),
      };

      const visionStatusId = `status-vision-${Date.now()}`;
      const statusMsg: ChatMessage = {
        id: visionStatusId,
        sender: "assistant",
        type: "status",
        text: "Analisando etiqueta com IA de Visão Computacional...",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, statusMsg]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || "image/jpeg",
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Falha ao analisar a etiqueta.");
        }

        const visionResult: VisionLLMOutput = await response.json();
        setMessages((prev) => prev.filter((m) => m.id !== visionStatusId));

        if (!visionResult.success || (visionResult.confidence_score || 0) < 0.8) {
          setPendingVisionData(visionResult);
          setIsConfidenceModalOpen(true);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `vision-success-${Date.now()}`,
              sender: "assistant",
              type: "text",
              text: `✅ Etiqueta reconhecida com sucesso: **${visionResult.full_query}**${
                visionResult.detected_price ? ` (Preço na gôndola física: R$ ${visionResult.detected_price.toFixed(2)})` : ""
              }`,
              timestamp: new Date(),
            },
          ]);

          executeSearch(
            visionResult.full_query,
            visionResult.detected_price || undefined
          );
        }
      } catch (error: any) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== visionStatusId),
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            type: "text",
            text: `⚠️ Erro na leitura visual: ${error?.message || "Não foi possível extrair os dados da foto."}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleOpenMonitor = (offer: StoreOffer) => {
    setSelectedOfferForMonitor(offer);
    setIsMonitorModalOpen(true);
  };

  const handleMonitorSuccess = (item: any) => {
    setMonitoredCount((prev) => prev + 1);
    setMessages((prev) => [
      ...prev,
      {
        id: `monitor-success-${Date.now()}`,
        sender: "assistant",
        type: "text",
        text: `🔔 Alerta de Preço Ativado com Sucesso!\nProduto: **${item.product_name}** na **${item.store_name}**.\nPreço-alvo: **R$ ${Number(item.target_price).toFixed(2)}**. Avisaremos você assim que o valor for atingido!`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground pb-32 transition-colors">
      {/* Header com CEP, Modo Claro/Escuro, contagem de alertas e Auth */}
      <HeaderCep
        cep={cep}
        onCepChange={setCep}
        monitoredCount={monitoredCount}
        onOpenMonitored={() => setIsMonitoredDrawerOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Área Central de Mensagens */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-5 py-6 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-sm mt-1">
                <Bot className="w-4 h-4 text-background" />
              </div>
            )}

            <div
              className={`max-w-[90%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed transition-all ${
                msg.sender === "user"
                  ? "bg-foreground text-background rounded-tr-sm shadow-md font-medium"
                  : "bg-card text-foreground rounded-tl-sm border border-border/80 shadow-soft"
              }`}
            >
              {msg.type === "image" && msg.imageUrl && (
                <div className="mb-2.5 overflow-hidden rounded-2xl border border-border/70 shadow-sm">
                  <img
                    src={msg.imageUrl}
                    alt="Foto da etiqueta capturada"
                    className="w-full max-h-64 object-cover"
                  />
                </div>
              )}

              {msg.type === "status" && (
                <div className="flex items-center gap-2.5 text-foreground font-semibold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span>{msg.text}</span>
                </div>
              )}

              {msg.type === "text" && (
                <div>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.id === "welcome-1" && messages.length === 1 && (
                    <div className="mt-3.5 pt-3 border-t border-border/60">
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
                        Ou toque para pesquisar um produto popular:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Smart TV 55 LG QNED",
                          "iPhone 15 128GB",
                          "PlayStation 5 Slim",
                          "Geladeira Frost Free",
                        ].map((quickQuery) => (
                          <button
                            key={quickQuery}
                            type="button"
                            onClick={() => handleSendMessage(quickQuery)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-foreground hover:text-background text-foreground font-medium border border-border/80 transition-all shadow-sm active:scale-95"
                          >
                            {quickQuery}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {msg.type === "search_result" && msg.searchData && (
                <div className="space-y-4 w-full">
                  <VerdictCard
                    verdict={msg.searchData.verdict}
                    physicalStorePrice={msg.searchData.physicalStorePrice}
                    bestEffectivePrice={msg.searchData.bestOffer?.effectivePrice}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-foreground" />
                      Ofertas Verificadas ({msg.searchData.totalFound})
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Frete calculado p/ {msg.searchData.cep}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {msg.searchData.offers.map((offer) => (
                      <ProductCard
                        key={offer.id}
                        offer={offer}
                        onMonitorClick={handleOpenMonitor}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`text-[10px] mt-2 text-right ${
                  msg.sender === "user" ? "text-background/70" : "text-muted-foreground"
                }`}
              >
                {new Intl.DateTimeFormat("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(msg.timestamp)}
              </div>
            </div>

            {msg.sender === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-2xl bg-secondary border border-border text-foreground flex items-center justify-center mt-1 shadow-sm font-semibold">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Modal de Baixa Confiança da IA */}
      <ConfidenceModal
        isOpen={isConfidenceModalOpen}
        visionData={pendingVisionData}
        onConfirm={(data) => {
          setIsConfidenceModalOpen(false);
          setPendingVisionData(null);
          executeSearch(data.query, data.physicalPrice);
        }}
        onCancel={() => {
          setIsConfidenceModalOpen(false);
          setPendingVisionData(null);
        }}
      />

      {/* Modal de Alerta / Monitoramento de Preço-Alvo */}
      <MonitorModal
        isOpen={isMonitorModalOpen}
        offer={selectedOfferForMonitor}
        onClose={() => {
          setIsMonitorModalOpen(false);
          setSelectedOfferForMonitor(null);
        }}
        onSuccess={handleMonitorSuccess}
      />

      {/* Drawer de Produtos Monitorados */}
      <MonitoredDrawer
        isOpen={isMonitoredDrawerOpen}
        onClose={() => setIsMonitoredDrawerOpen(false)}
        onCountUpdate={setMonitoredCount}
      />

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Barra Inferior com Câmera e Texto */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        isLoading={isLoading}
      />
    </main>
  );
}
