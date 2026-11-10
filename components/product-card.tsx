"use client";

import React, { useState } from "react";
import { ExternalLink, Truck, Zap, Sparkles, Bell, ShoppingBag } from "lucide-react";
import type { StoreOffer } from "@/app/api/search/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  offer: StoreOffer;
  onMonitorClick?: (offer: StoreOffer) => void;
}

export function ProductCard({ offer, onMonitorClick }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const directOfferLink = offer.link || "#";

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between border ${offer.isBestPrice
          ? "bg-card border-success/70 shadow-md glow-best-price ring-1 ring-success/30"
          : "bg-card border-border/80 hover:border-border shadow-soft hover:shadow-card hover:-translate-y-0.5"
        }`}
    >
      <div>
        {/* Badge de Melhor Preço Efetivo (Dentro do fluxo, sem sobreposição feia) */}
        {offer.isBestPrice && (
          <div className="mb-3">
            <Badge
              variant="success"
              className="w-full justify-center py-1.5 text-xs font-bold shadow-sm uppercase tracking-wider bg-success text-success-foreground border-transparent rounded-xl flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Melhor Preço Efetivo
            </Badge>
          </div>
        )}

        {/* Imagem do Produto com Badges Integrados */}
        <div className="relative w-full h-44 sm:h-48 bg-secondary/40 dark:bg-muted/30 rounded-2xl overflow-hidden border border-border/60 flex items-center justify-center p-3 mb-3.5 group">
          {offer.imageUrl && !imageError ? (
            <img
              src={offer.imageUrl}
              alt={offer.productTitle}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground gap-1.5 py-6">
              <ShoppingBag className="w-10 h-10 opacity-30" />
              <span className="text-[11px] font-medium opacity-60">Imagem indisponível</span>
            </div>
          )}

          {/* Badges Flutuantes Sobre a Imagem (Loja e Frete Grátis) */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
            <span className="bg-background/90 dark:bg-card/90 backdrop-blur-md text-foreground font-extrabold text-[11px] px-2.5 py-1 rounded-full border border-border/80 shadow-sm">
              {offer.storeName}
            </span>

            {offer.freeShipping && (
              <Badge
                variant="success"
                className="text-[10px] font-bold shadow-sm py-0.5 px-2.5 bg-success text-success-foreground border-transparent"
              >
                <Truck className="w-3 h-3 mr-1" />
                Frete Grátis
              </Badge>
            )}
          </div>
        </div>

        {/* Título do Produto */}
        <h4
          className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 mb-3 leading-snug"
          title={offer.productTitle}
        >
          {offer.productTitle}
        </h4>

        {/* Bloco de Preços com Fundo Neutro/Bege Arredondado */}
        <div className="bg-secondary/50 dark:bg-muted/40 rounded-2xl p-3.5 border border-border/60 mb-4 space-y-1.5">
          {/* Preço do Produto no Site (Valor Real sem descontos presumidos) */}
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              Preço no site:
            </span>
            <span
              className={`font-black text-xl tracking-tight ${offer.isBestPrice ? "text-success" : "text-foreground"
                }`}
            >
              {formatCurrency(offer.pixPrice)}
            </span>
          </div>

          {/* Frete e Prazo */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
            <span>Frete estimado:</span>
            <span className={offer.freeShipping ? "text-success font-semibold" : "text-foreground font-medium"}>
              {offer.freeShipping ? "Grátis" : formatCurrency(offer.shippingCost)}
            </span>
          </div>

          {/* Preço Total com Frete */}
          <div className="flex items-center justify-between text-xs font-semibold text-foreground pt-1.5 border-t border-border/70">
            <span>Total com frete:</span>
            <span
              className={`font-bold ${offer.isBestPrice
                  ? "text-success text-sm font-extrabold"
                  : "text-foreground"
                }`}
            >
              {formatCurrency(offer.effectivePrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Ações: Ver na Loja + Criar Alerta */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          asChild
          variant={offer.isBestPrice ? "success" : "default"}
          size="default"
          className="flex-1 rounded-2xl font-semibold gap-1.5 text-xs shadow-md"
        >
          <a
            href={directOfferLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Ir para Loja</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>

        {onMonitorClick && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMonitorClick(offer)}
            title="Criar alerta de preço para este produto"
            className="rounded-2xl border-border hover:bg-secondary text-foreground transition-all shadow-sm"
          >
            <Bell className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
