"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Camera,
  Bot,
  User,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Store,
  ChevronRight,
  Bell,
  CheckCircle2,
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
      text: "Olá! Sou o PrecIA, seu comparador inteligente omnichannel com IA. Fotografe a etiqueta na gôndola ou digite o modelo do produto para achar o menor preço em tempo real e ativar alertas de preço!",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVisionData, setPendingVisionData] = useState<VisionLLMOutput | null>(null);
  const [isConfidenceModalOpen, setIsConfidenceModalOpen] = useState(false);

  // Estados da Sprint 2: Auth, Monitoramento e Afiliados
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
        text: "Lendo etiqueta com Visão Computacional (IA)...",
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
              text: `✅ Etiqueta reconhecida (${Math.round(visionResult.confidence_score * 100)}% de precisão): **${visionResult.full_query}**${
                visionResult.detected_price ? ` (Preço na loja: R$ ${visionResult.detected_price.toFixed(2)})` : ""
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

  /**
   * Dispara abertura do modal de monitoramento
   */
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
        text: `🔔 Alerta de Preço Ativado com Sucesso!\nProduto: **${item.product_name}** na **${item.store_name}**.\nPreço-alvo definido: **R$ ${Number(item.target_price).toFixed(2)}**. Avisaremos você assim que o valor for atingido!`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#090d16] pb-28">
      {/* Header com CEP, contagem de alertas e Auth */}
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
      <div className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 sm:gap-3 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed transition-all ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20"
                  : "glass-card text-slate-200 rounded-tl-none border-slate-800"
              }`}
            >
              {msg.type === "image" && msg.imageUrl && (
                <div className="mb-2 overflow-hidden rounded-xl border border-white/20">
                  <img
                    src={msg.imageUrl}
                    alt="Foto da etiqueta"
                    className="w-full max-h-60 object-cover"
                  />
                </div>
              )}

              {msg.type === "status" && (
                <div className="flex items-center gap-2 text-indigo-300 font-medium animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>{msg.text}</span>
                </div>
              )}

              {msg.type === "text" && (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}

              {msg.type === "search_result" && msg.searchData && (
                <div className="space-y-4 w-full">
                  <VerdictCard
                    verdict={msg.searchData.verdict}
                    physicalStorePrice={msg.searchData.physicalStorePrice}
                    bestEffectivePrice={msg.searchData.bestOffer?.effectivePrice}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                      Ofertas com Link Seguro de Afiliado ({msg.searchData.totalFound})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Frete p/ {msg.searchData.cep}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === "user" ? "text-indigo-200" : "text-slate-400"
                }`}
              >
                {new Intl.DateTimeFormat("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(msg.timestamp)}
              </div>
            </div>

            {msg.sender === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mt-1">
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

      {/* Modal de Autenticação Supabase */}
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
