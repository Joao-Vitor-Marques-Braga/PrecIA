"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [cronFeedback, setCronFeedback] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monitored-products");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
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
        setCronFeedback(data.error || "Falha ao acionar rotina de checagem.");
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
    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    return `Há ${Math.round(diffHours / 24)}d`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-card border-l border-border/80 shadow-2xl flex flex-col transition-all">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5 text-background" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-foreground text-base tracking-tight">
                  Radar de Alertas
                </h3>
                <Badge variant="beige" className="text-[10px] font-bold">
                  24h
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "produto monitorado" : "produtos monitorados"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Barra de Ação Manual de Checagem */}
        <div className="px-4 py-2.5 bg-secondary/50 dark:bg-muted/30 border-b border-border/70 flex items-center justify-between gap-2">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-foreground" />
            <span>Rotina automatizada omnichannel</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualCronCheck}
            disabled={isCheckingPrices}
            className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-border shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingPrices ? "animate-spin" : ""}`} />
            <span>Checar Agora</span>
          </Button>
        </div>

        {cronFeedback && (
          <div className="px-4 py-2 bg-success-subtle border-b border-success-border text-success text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{cronFeedback}</span>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-foreground" />
              <span className="text-xs font-medium">Sincronizando seus alertas...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground px-4">
              <div className="w-14 h-14 rounded-3xl bg-secondary/70 flex items-center justify-center mb-3 text-muted-foreground">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">
                Nenhum produto monitorado ainda
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Ao consultar preços no chat, clique no ícone de sino para definir um preço-alvo.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const diff = item.current_price - item.target_price;
              const isTargetReached = item.current_price <= item.target_price;

              return (
                <div
                  key={item.id}
                  className={`border rounded-3xl p-4 flex flex-col justify-between gap-3 transition-all shadow-soft ${
                    isTargetReached
                      ? "bg-success-subtle/40 border-success-border"
                      : "bg-card border-border/80 hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {item.image_url && (
                        <div className="w-11 h-11 rounded-xl bg-secondary/60 dark:bg-muted/40 p-1 flex-shrink-0 border border-border/60 overflow-hidden flex items-center justify-center">
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          {item.store_name}
                        </span>
                        <h4 className="font-bold text-foreground text-xs sm:text-sm line-clamp-1">
                          {item.product_name}
                        </h4>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(item.id)}
                      title="Excluir alerta"
                      className="rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Comparativo de Preço */}
                  <div className="grid grid-cols-2 gap-2 bg-secondary/50 dark:bg-muted/40 p-2.5 rounded-2xl text-center text-xs border border-border/50">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">Preço Atual</span>
                      <span className="font-extrabold text-foreground">
                        R$ {Number(item.current_price).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">Preço Alvo</span>
                      <span className="font-extrabold text-success">
                        R$ {Number(item.target_price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Metadados de Auditoria */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>Checagem: <strong className="text-foreground">{formatTimeAgo(item.last_checked_at)}</strong></span>
                    <span className="text-right">WhatsApp: <strong className="text-foreground">{formatTimeAgo(item.last_notified_at)}</strong></span>
                  </div>

                  {/* Status do Alerta & Link */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <Badge
                      variant={isTargetReached ? "success" : "beige"}
                      className="text-[10px] font-bold"
                    >
                      {isTargetReached ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Meta Atingida!
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Falta R$ {diff.toFixed(2)}
                        </>
                      )}
                    </Badge>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-semibold gap-1 hover:bg-secondary rounded-xl"
                    >
                      <a
                        href={item.product_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Ver Oferta</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-border/80 bg-secondary/40 text-xs text-muted-foreground flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Alertas em tempo real via WhatsApp</span>
          </div>
          <Badge variant="default" className="text-[10px] font-bold">
            PRO Ativo
          </Badge>
        </div>
      </div>
    </div>
  );
}
