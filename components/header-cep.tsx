"use client";

import React, { useState, useEffect } from "react";
import { MapPin, CheckCircle2, Sparkles, AlertCircle, Bell, User, LogOut } from "lucide-react";
import { cepRegex } from "@/lib/validations";

interface HeaderCepProps {
  cep: string;
  onCepChange: (newCep: string) => void;
  monitoredCount?: number;
  onOpenMonitored?: () => void;
  onOpenAuth?: () => void;
  currentUser?: any;
  onLogout?: () => void;
}

export function HeaderCep({
  cep,
  onCepChange,
  monitoredCount = 0,
  onOpenMonitored,
  onOpenAuth,
  currentUser,
  onLogout,
}: HeaderCepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(cep);

  useEffect(() => {
    // Carrega CEP do localStorage se disponível
    const savedCep = localStorage.getItem("precia_user_cep");
    if (savedCep && cepRegex.test(savedCep)) {
      onCepChange(savedCep);
      setInputVal(savedCep);
    }
  }, [onCepChange]);

  const formatCep = (val: string) => {
    const numbersOnly = val.replace(/\D/g, "").slice(0, 8);
    if (numbersOnly.length > 5) {
      return `${numbersOnly.slice(0, 5)}-${numbersOnly.slice(5)}`;
    }
    return numbersOnly;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setInputVal(formatted);
    if (cepRegex.test(formatted)) {
      onCepChange(formatted);
      localStorage.setItem("precia_user_cep", formatted);
    }
  };

  const isValid = cepRegex.test(inputVal);

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Logo & Marca */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                Prec<span className="text-indigo-400">IA</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Comparador Omnichannel & Alertas
            </p>
          </div>
        </div>

        {/* Lado Direito: CEP + Botão Alertas + Botão Auth */}
        <div className="flex items-center gap-2">
          {/* Seletor / Input de CEP */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-full px-2.5 py-1 text-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <MapPin className={`w-3.5 h-3.5 ${isValid ? "text-emerald-400" : "text-amber-400"}`} />
            <input
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              value={inputVal}
              onChange={handleInputChange}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
              className="bg-transparent text-slate-200 font-mono w-16 sm:w-20 focus:outline-none placeholder:text-slate-500 text-xs"
              maxLength={9}
              title="Digite seu CEP para cálculo de frete"
            />
            {isValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
          </div>

          {/* Botão de Alertas / Monitorados */}
          {onOpenMonitored && (
            <button
              type="button"
              onClick={onOpenMonitored}
              title="Ver produtos monitorados"
              className="relative p-2 rounded-full bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              {monitoredCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md">
                  {monitoredCount}
                </span>
              )}
            </button>
          )}

          {/* Botão de Usuário / Auth */}
          {currentUser ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-indigo-300 font-medium hidden md:inline px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                {currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0]}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sair da conta"
                  className="p-2 rounded-full bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                title="Entrar ou Cadastrar"
                className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
