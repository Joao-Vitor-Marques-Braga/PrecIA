"use client";

import React from "react";
import {
  TrendingDown,
  ShoppingBag,
  Store,
  BadgeAlert,
  Sparkles,
  ArrowDownRight,
} from "lucide-react";
import type { SearchResponse } from "@/app/api/search/route";
import { Badge } from "@/components/ui/badge";

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

  const isBuyOnline = verdict.recommendation === "BUY_ONLINE";
  const isBargain = verdict.recommendation === "BARGAIN_PHYSICAL";

  // Preço ruim na loja física vs online
  const hasSavings = physicalStorePrice && bestEffectivePrice && physicalStorePrice > bestEffectivePrice;
  const savingsAmount = hasSavings ? physicalStorePrice - bestEffectivePrice : 0;
  const savingsPercent = hasSavings ? Math.round((savingsAmount / physicalStorePrice) * 100) : 0;

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 shadow-card ${
        isBuyOnline
          ? "bg-gradient-to-br from-success/10 via-card to-card border-success/40"
          : isBargain
          ? "bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/40"
          : "bg-gradient-to-br from-danger/10 via-card to-card border-danger/40"
      }`}
    >
      {/* Cabeçalho do Veredito */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-background" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Veredito Inteligente PrecIA
            </span>
            <h3 className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">
              {verdict.headline}
            </h3>
          </div>
        </div>

        <div>
          {isBuyOnline ? (
            <Badge variant="success" className="px-3.5 py-1 text-xs font-bold gap-1.5 shadow-sm">
              <ShoppingBag className="w-3.5 h-3.5" />
              Comprar Online
            </Badge>
          ) : isBargain ? (
            <Badge variant="beige" className="px-3.5 py-1 text-xs font-bold gap-1.5 shadow-sm text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60">
              <Store className="w-3.5 h-3.5" />
              Negociar na Loja
            </Badge>
          ) : (
            <Badge variant="danger" className="px-3.5 py-1 text-xs font-bold gap-1.5 shadow-sm">
              <BadgeAlert className="w-3.5 h-3.5" />
              Alerta de Preço
            </Badge>
          )}
        </div>
      </div>

      {/* Resumo Conversacional */}
      <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed mb-4 bg-secondary/60 dark:bg-muted/30 p-3.5 sm:p-4 rounded-2xl border border-border/60">
        {verdict.summary}
      </p>

      {/* Comparativo Visual: Loja Física (Vermelho se mais cara) x Online (Verde economia) */}
      {physicalStorePrice && bestEffectivePrice && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center text-xs">
          {/* Preço Loja Física (Preço ruim destacado com badge vermelho suave) */}
          <div className="bg-secondary/40 dark:bg-muted/40 p-3 rounded-2xl border border-border/60 flex flex-col justify-center">
            <span className="text-[10px] font-medium text-muted-foreground mb-1">
              Etiqueta da Loja Física
            </span>
            <span
              className={`font-bold text-sm sm:text-base ${
                physicalStorePrice > bestEffectivePrice
                  ? "text-danger line-through opacity-85"
                  : "text-foreground"
              }`}
            >
              {formatCurrency(physicalStorePrice)}
            </span>
          </div>

          {/* Melhor Preço Online (Verde) */}
          <div className="bg-success-subtle p-3 rounded-2xl border border-success-border flex flex-col justify-center">
            <span className="text-[10px] font-medium text-success/90 mb-1">
              Melhor Online ({verdict.bestStoreName})
            </span>
            <span className="font-extrabold text-sm sm:text-base text-success">
              {formatCurrency(bestEffectivePrice)}
            </span>
          </div>

          {/* Economia Estimada */}
          <div className="col-span-2 sm:col-span-1 bg-success text-success-foreground p-3 rounded-2xl shadow-md flex sm:flex-col items-center justify-between sm:justify-center">
            <span className="text-[10px] font-semibold opacity-90 block">
              Economia Total ({savingsPercent}%)
            </span>
            <span className="font-black text-base sm:text-lg flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {formatCurrency(savingsAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
