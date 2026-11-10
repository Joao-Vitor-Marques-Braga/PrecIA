"use client";

import React, { useState, useEffect } from "react";
import { BellRing, X, Check, Sparkles, Loader2, Phone } from "lucide-react";
import type { StoreOffer } from "@/app/api/search/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MonitorModalProps {
  isOpen: boolean;
  offer: StoreOffer | null;
  onClose: () => void;
  onSuccess: (monitoredItem: any) => void;
}

export function MonitorModal({
  isOpen,
  offer,
  onClose,
  onSuccess,
}: MonitorModalProps) {
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (offer) {
      const suggested = Math.round(offer.effectivePrice * 0.9);
      setTargetPrice(String(suggested));
      setErrorMsg("");

      const savedPhone = localStorage.getItem("precia_user_phone");
      if (savedPhone) setWhatsapp(savedPhone);
    }
  }, [offer]);

  if (!isOpen || !offer) return null;

  const handleQuickDiscount = (percentage: number) => {
    const discounted = Math.round(offer.effectivePrice * (1 - percentage / 100));
    setTargetPrice(String(discounted));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const parsedPrice = parseFloat(targetPrice.replace(",", "."));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg("Informe um preço-alvo válido.");
      return;
    }

    if (parsedPrice >= offer.effectivePrice) {
      setErrorMsg("O preço-alvo deve ser menor que o preço atual da oferta.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (whatsapp) {
        localStorage.setItem("precia_user_phone", whatsapp);
      }

      const res = await fetch("/api/monitored-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: offer.productTitle,
          product_model: offer.productTitle.slice(0, 50),
          target_price: parsedPrice,
          current_price: offer.effectivePrice,
          store_name: offer.storeName,
          product_url: offer.link,
          image_url: offer.imageUrl,
          phone_whatsapp: whatsapp || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao criar alerta.");
      }

      const data = await res.json();
      onSuccess(data.item);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocorreu um erro ao salvar o alerta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 shadow-2xl transition-all">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-md">
              <BellRing className="w-5 h-5 text-background" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base sm:text-lg tracking-tight">
                Criar Alerta de Preço
              </h3>
              <p className="text-xs text-muted-foreground">
                Avisaremos você assim que o produto atingir sua meta.
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

        {/* Resumo da Oferta Atual */}
        <div className="bg-secondary/60 dark:bg-muted/40 rounded-2xl p-3 border border-border/70 mb-4 flex items-center gap-3 text-xs">
          {offer.imageUrl && (
            <div className="w-12 h-12 rounded-xl bg-card p-1 flex-shrink-0 border border-border/60 overflow-hidden flex items-center justify-center">
              <img src={offer.imageUrl} alt={offer.productTitle} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
              {offer.storeName}
            </span>
            <span className="font-semibold text-foreground line-clamp-1">
              {offer.productTitle}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] text-muted-foreground block">Preço Atual</span>
            <span className="font-extrabold text-foreground text-sm">
              {offer.effectivePrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Seu Preço-Alvo Desejado (R$):
            </label>
            <Input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Ex: 899.90"
              required
              className="text-base font-bold font-mono"
            />
          </div>

          {/* Atalhos de Desconto */}
          <div>
            <span className="text-[11px] text-muted-foreground block mb-1.5 font-medium">
              Ou escolha um desconto rápido:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((pct) => (
                <Button
                  key={pct}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDiscount(pct)}
                  className="rounded-xl text-xs font-semibold border-border hover:bg-secondary"
                >
                  -{pct}%
                </Button>
              ))}
            </div>
          </div>

          {/* Notificação por WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              WhatsApp para Alerta Instantâneo (opcional):
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              <Input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 98765-4321"
                className="pl-10"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Dispararemos uma mensagem assim que o preço cair para sua meta.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              size="default"
              disabled={isSubmitting}
              className="rounded-2xl gap-2 font-bold shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Ativar Radar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
