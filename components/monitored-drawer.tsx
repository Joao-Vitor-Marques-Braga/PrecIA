"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  Trash2,
  ExternalLink,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Zap,
  ShieldCheck,
} from "lucide-react";

interface MonitoredItem {
  id: string;
  product_name: string;
  product_model: string;
  target_price: number;
  current_price: number;
  store_name: string;
  product_url: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  last_checked_at?: string | null;
  last_notified_at?: string | null;
}

interface MonitoredDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountUpdate?: (count: number) => void;
}

export function MonitoredDrawer({
  isOpen,
  onClose,
  onCountUpdate,
}: MonitoredDrawerProps) {
  const [items, setItems] = useState<MonitoredItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCheckingPrices, setIsCheckingPrices] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [cronFeedback, setCronFeedback] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monitored-products");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setIsDemo(!!data.isDemo);
        if (onCountUpdate) onCountUpdate(data.items?.length || 0);
      }
    } catch (err) {
      console.error("Erro ao carregar monitorados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/monitored-products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        if (onCountUpdate) onCountUpdate(items.length - 1);
      }
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  const handleManualCronCheck = async () => {
    setIsCheckingPrices(true);
    setCronFeedback(null);
    try {
      const res = await fetch("/api/cron/check-prices", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCronFeedback("Varredura de preços concluída! Histórico atualizado.");
        await fetchItems();
      } else {
        setCronFeedback(data.error || "Falha ao acionar cron.");
      }
    } catch (err: any) {
      setCronFeedback("Erro ao conectar ao motor de checagem.");
    } finally {
      setIsCheckingPrices(false);
      setTimeout(() => setCronFeedback(null), 4000);
    }
  };

  const formatTimeAgo = (iso?: string | null) => {
    if (!iso) return "Pendente";
    const date = new Date(iso);
    const diffMin = Math.round((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    return `Há ${Math.round(diffHours / 24)} dias`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-100 text-base">
                  Produtos Monitorados
                </h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Freemium: 24h
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {items.length} {items.length === 1 ? "alerta ativo" : "alertas ativos"} (Anti-Spam 12h)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botão de Disparo Manual de Checagem (Cron) */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rotina automatizada: Vercel Cron</span>
          </div>
          <button
            type="button"
            onClick={handleManualCronCheck}
            disabled={isCheckingPrices}
            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingPrices ? "animate-spin" : ""}`} />
            <span>Checar Preços</span>
          </button>
        </div>

        {cronFeedback && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{cronFeedback}</span>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Carregando seus alertas...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400 px-4">
              <Bell className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                Nenhum produto monitorado ainda
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ao comparar produtos no chat, toque no botão de sino para definir um preço-alvo.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const diff = item.current_price - item.target_price;
              const isTargetReached = item.current_price <= item.target_price;

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">
                        {item.store_name}
                      </span>
                      <h4 className="font-semibold text-slate-200 text-xs line-clamp-1">
                        {item.product_name}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Excluir alerta"
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Comparativo de Preço */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Preço Atual</span>
                      <span className="font-semibold text-slate-200">
                        R$ {Number(item.current_price).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Preço Alvo</span>
                      <span className="font-bold text-emerald-400">
                        R$ {Number(item.target_price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Metadados de Auditoria da Sprint 3 */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Última checagem: <strong className="text-slate-300">{formatTimeAgo(item.last_checked_at)}</strong></span>
                    <span className="text-right">Alerta WhatsApp: <strong className="text-slate-300">{formatTimeAgo(item.last_notified_at)}</strong></span>
                  </div>

                  {/* Status do Alerta & Link Seguro de Afiliado */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                    <span
                      className={`flex items-center gap-1 font-medium ${
                        isTargetReached ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {isTargetReached ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Preço Atingido!
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Falta R$ {diff.toFixed(2)}
                        </>
                      )}
                    </span>

                    <a
                      href={item.product_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 hover:text-white flex items-center gap-1 font-medium"
                    >
                      <span>Ver Oferta</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com Informações de Upgrade PRO */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Quer checagens a cada 2h?</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-semibold text-[10px]">
            Plano PRO
          </span>
        </div>
      </div>
    </div>
  );
}
