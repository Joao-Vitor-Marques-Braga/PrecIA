"use client";

import React from "react";
import { ExternalLink, Truck, Zap, Sparkles, Bell } from "lucide-react";
import type { StoreOffer } from "@/app/api/search/route";

interface ProductCardProps {
  offer: StoreOffer;
  onMonitorClick?: (offer: StoreOffer) => void;
}

export function ProductCard({ offer, onMonitorClick }: ProductCardProps) {
  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Link direto da oferta (sem intermediários de afiliados para testes limpos)
  const directOfferLink = offer.link || "#";

  return (
    <div
      className={`relative rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${
        offer.isBestPrice
          ? "bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-900 border-2 border-emerald-500 shadow-xl shadow-emerald-950/40 glow-emerald"
          : "glass-card hover:border-slate-600 hover:bg-slate-900/80"
      }`}
    >
      {/* Badge de Melhor Preço Efetivo */}
      {offer.isBestPrice && (
        <div className="absolute -top-3 left-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          Melhor Preço Efetivo
        </div>
      )}

      {/* Topo do Card: Loja e Selo */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2 pt-1">
          <div>
            <h4 className="font-bold text-slate-100 text-base flex items-center gap-1.5">
              {offer.storeName}
            </h4>
            {offer.storeBadge && (
              <span className="text-[10px] text-slate-400 font-medium">
                {offer.storeBadge}
              </span>
            )}
          </div>
          {offer.freeShipping && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
              <Truck className="w-3 h-3" />
              Frete Grátis
            </span>
          )}
        </div>

        {/* Título do Produto */}
        <p className="text-xs text-slate-300 line-clamp-2 mb-3">
          {offer.productTitle}
        </p>

        {/* Bloco de Preços */}
        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 mb-3 space-y-1">
          {/* Preço no PIX */}
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              No PIX à vista:
            </span>
            <span className="font-extrabold text-lg text-emerald-400">
              {formatCurrency(offer.pixPrice)}
            </span>
          </div>

          {/* Preço Vitrine / Parcelado */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Preço a prazo:</span>
            <span className="line-through">{formatCurrency(offer.showcasePrice)}</span>
          </div>

          {/* Frete e Prazo */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Frete estimado:</span>
            <span className={offer.freeShipping ? "text-emerald-400 font-medium" : "text-slate-300"}>
              {offer.freeShipping ? "R$ 0,00" : formatCurrency(offer.shippingCost)}
            </span>
          </div>

          {/* Preço Total Efetivo */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200 pt-1 border-t border-slate-800/80">
            <span>Total Efetivo:</span>
            <span className={offer.isBestPrice ? "text-emerald-300 font-bold" : "text-slate-100"}>
              {formatCurrency(offer.effectivePrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Ações: Ver na Loja (Afiliado Seguro) + Criar Alerta */}
      <div className="flex items-center gap-2">
        <a
          href={directOfferLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            offer.isBestPrice
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
        >
          <span>Ver Oferta</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {onMonitorClick && (
          <button
            type="button"
            onClick={() => onMonitorClick(offer)}
            title="Criar alerta de preço para este produto"
            className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-slate-300 hover:text-indigo-300 transition-all"
          >
            <Bell className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
