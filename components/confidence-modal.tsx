"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Check, X, Search, Sparkles } from "lucide-react";
import type { VisionLLMOutput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ConfidenceModalProps {
  isOpen: boolean;
  visionData: VisionLLMOutput | null;
  onConfirm: (data: { query: string; physicalPrice?: number }) => void;
  onCancel: () => void;
}

export function ConfidenceModal({
  isOpen,
  visionData,
  onConfirm,
  onCancel,
}: ConfidenceModalProps) {
  const [query, setQuery] = useState("");
  const [physicalPrice, setPhysicalPrice] = useState<string>("");

  useEffect(() => {
    if (visionData) {
      setQuery(visionData.full_query || `${visionData.brand} ${visionData.model}`.trim());
      setPhysicalPrice(
        visionData.detected_price ? String(visionData.detected_price) : ""
      );
    }
  }, [visionData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const parsedPrice = physicalPrice ? parseFloat(physicalPrice.replace(",", ".")) : undefined;
    onConfirm({
      query: query.trim(),
      physicalPrice: !isNaN(Number(parsedPrice)) ? parsedPrice : undefined,
    });
  };

  const confidencePercentage = Math.round((visionData?.confidence_score || 0) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 shadow-2xl transition-all">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-base tracking-tight">
                Confirmar Leitura da Etiqueta
              </h3>
              <p className="text-xs text-muted-foreground">
                Precisão estimada: <span className="font-bold text-amber-600 dark:text-amber-400">{confidencePercentage}%</span>. Ajuste se necessário.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCancel}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Formulário de Ajuste */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Modelo ou Termo de Busca Identificado:
            </label>
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Smart TV LG 75 QNED 70"
              maxLength={150}
              required
              className="text-xs sm:text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Preço na Loja Física (R$ - opcional):
            </label>
            <Input
              type="number"
              step="0.01"
              value={physicalPrice}
              onChange={(e) => setPhysicalPrice(e.target.value)}
              placeholder="Ex: 4299.90"
              className="text-xs sm:text-sm font-medium"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Usado para calcular sua economia exata em relação às lojas online.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onCancel}
              className="rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              size="default"
              className="rounded-2xl gap-2 font-bold shadow-md"
            >
              <Search className="w-4 h-4" />
              Comparar Ofertas
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
