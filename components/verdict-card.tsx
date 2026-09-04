"use client";

import React from "react";
import {
  TrendingDown,
  ShoppingBag,
  Store,
  BadgeAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { SearchResponse } from "@/app/api/search/route";

interface VerdictCardProps {
  verdict: SearchResponse["verdict"];
  physicalStorePrice?: number;
  bestEffectivePrice?: number;
}

export function VerdictCard({
  verdict,
  physicalStorePrice,
  bestEffectivePrice,
}: VerdictCardProps) {
  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getTheme = () => {
    switch (verdict.recommendation) {
      case "BUY_ONLINE":
        return {
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
          accent: "text-emerald-400",
          border: "border-emerald-500/40",
          bg: "bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-slate-900",
        };
      case "BARGAIN_PHYSICAL":
        return {
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: <Store className="w-4 h-4 text-amber-400" />,
          accent: "text-amber-400",
          border: "border-amber-500/40",
          bg: "bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-900",
        };
      default:
        return {
          badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          icon: <BadgeAlert className="w-4 h-4 text-blue-400" />,
          accent: "text-blue-400",
          border: "border-blue-500/40",
          bg: "bg-gradient-to-br from-blue-950/30 via-slate-900/90 to-slate-900",
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border ${theme.border} ${theme.bg} shadow-xl backdrop-blur-md mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {/* Cabeçalho do Veredito */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Veredito da Inteligência PrecIA
            </span>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              {verdict.headline}
            </h3>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${theme.badgeBg}`}
        >
          {theme.icon}
          {verdict.recommendation === "BUY_ONLINE"
            ? "Comprar Online"
            : verdict.recommendation === "BARGAIN_PHYSICAL"
            ? "Negociar Desconto"
            : "Comprar na Loja"}
        </span>
      </div>

      {/* Resumo Conversacional */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {verdict.summary}
      </p>

      {/* Comparativo Visual de Preço */}
      {physicalStorePrice && bestEffectivePrice && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block mb-0.5">Preço Loja Física</span>
            <span className="font-semibold text-slate-300">
              {formatCurrency(physicalStorePrice)}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block mb-0.5">Melhor Online ({verdict.bestStoreName})</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(bestEffectivePrice)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/40 flex sm:flex-col items-center justify-between sm:justify-center">
            <span className="text-[10px] text-emerald-300 block">Sua Economia</span>
            <span className="font-extrabold text-emerald-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              {formatCurrency(verdict.savingsAmount)} ({verdict.savingsPercentage}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
