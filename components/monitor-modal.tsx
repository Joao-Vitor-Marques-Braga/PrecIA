"use client";

import React, { useState, useEffect } from "react";
import { BellRing, X, Check, Sparkles, Loader2, Phone } from "lucide-react";
import type { StoreOffer } from "@/app/api/search/route";

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
      // Sugestão padrão: 10% abaixo do preço atual
      const suggested = Math.round(offer.effectivePrice * 0.9);
      setTargetPrice(String(suggested));
      setErrorMsg("");

      // Carrega whatsapp salvo se existir
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-indigo-950/50">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Criar Alerta de Preço
              </h3>
              <p className="text-xs text-slate-400">
                Avisaremos quando o produto atingir sua meta.
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

        {/* Resumo da Oferta Atual */}
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 mb-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">{offer.storeName}</span>
            <span className="font-medium text-slate-200 line-clamp-1 max-w-[200px]">
              {offer.productTitle}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Preço Atual:</span>
            <span className="font-bold text-slate-100">
              {offer.effectivePrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preço Alvo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Preço-Alvo Desejado (R$):
            </label>
            <input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Ex: 3800.00"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-emerald-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {/* Atalhos rápidos de desconto */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-400">Metas Rápidas:</span>
              {[5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickDiscount(pct)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-indigo-300 border border-slate-700 transition-colors"
                >
                  -{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp / Notificação */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp para Alerta Instantâneo (Opcional):
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {errorMsg}
            </p>
          )}

          {/* Ações */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Ativar Monitoramento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
