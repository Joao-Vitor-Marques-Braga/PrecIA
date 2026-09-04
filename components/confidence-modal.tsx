"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Check, X, Search, Sparkles } from "lucide-react";
import type { VisionLLMOutput } from "@/lib/validations";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-indigo-950/50">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Confirmar Leitura da Etiqueta
              </h3>
              <p className="text-xs text-slate-400">
                Confiança da IA: <span className="font-semibold text-amber-400">{confidencePercentage}%</span>. Ajuste o modelo se necessário.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário de Ajuste */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Modelo ou Termo de Busca Identificado:
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Smart TV LG 75 QNED 70"
              maxLength={150}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Preço na Loja Física (R$ - opcional):
            </label>
            <input
              type="number"
              step="0.01"
              value={physicalPrice}
              onChange={(e) => setPhysicalPrice(e.target.value)}
              placeholder="Ex: 4299.90"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Usado para calcular sua economia exata em relação às lojas online.
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Tirar Outra Foto
            </button>
            <button
              type="submit"
              disabled={!query.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar Ofertas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
