"use client";

import React, { useState, useEffect } from "react";
import { MapPin, CheckCircle2, Sparkles, AlertCircle, Bell, User, LogOut } from "lucide-react";
import { cepRegex } from "@/lib/validations";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [inputVal, setInputVal] = useState(cep);

  useEffect(() => {
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
    <header className="sticky top-0 z-30 w-full glass-header px-3 sm:px-5 py-3 shadow-soft transition-colors">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Logo & Marca */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-md shadow-foreground/10 transition-transform hover:scale-105">
            <Sparkles className="w-4 h-4 text-background" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground">
                Prec<span className="text-muted-foreground font-semibold">IA</span>
              </span>
              <Badge variant="beige" className="text-[10px] uppercase tracking-wider py-0 px-2 font-bold">
                Omnichannel
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block font-medium">
              Comparador com IA & Radar de Ofertas
            </p>
          </div>
        </div>

        {/* Lado Direito: CEP + Tema + Alertas + Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Seletor / Input de CEP */}
          <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-full px-3 py-1.5 text-xs shadow-soft transition-all focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/20">
            <MapPin className={`w-3.5 h-3.5 ${isValid ? "text-success" : "text-amber-500"}`} />
            <input
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              value={inputVal}
              onChange={handleInputChange}
              className="bg-transparent text-foreground font-mono w-16 sm:w-20 focus:outline-none placeholder:text-muted-foreground/70 text-xs font-semibold"
              maxLength={9}
              title="Digite seu CEP para frete dinâmico"
            />
            {isValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            )}
          </div>

          {/* Alternância de Modo Claro e Escuro */}
          <ThemeToggle />

          {/* Botão de Alertas / Monitorados */}
          {onOpenMonitored && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onOpenMonitored}
              title="Ver produtos monitorados"
              className="relative rounded-full border-border/80 bg-card hover:bg-accent shadow-sm"
            >
              <Bell className="w-4 h-4 text-foreground" />
              {monitoredCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success text-[10px] font-bold text-success-foreground flex items-center justify-center shadow-md animate-in zoom-in-50">
                  {monitoredCount}
                </span>
              )}
            </Button>
          )}

          {/* Botão de Usuário / Auth */}
          {currentUser ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-foreground font-semibold hidden md:inline px-3 py-1 rounded-full bg-secondary border border-border">
                {currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0]}
              </span>
              {onLogout && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={onLogout}
                  title="Sair da conta"
                  className="rounded-full border-border/80 hover:bg-danger/10 hover:text-danger hover:border-danger/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onOpenAuth}
                title="Entrar ou Cadastrar"
                className="rounded-full shadow-md px-3.5 h-9 font-semibold gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar</span>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
