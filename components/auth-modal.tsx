"use client";

import React, { useState } from "react";
import { User, Lock, Mail, X, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const supabase = createClient();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
            },
          },
        });

        if (error) throw error;
        setSuccessMsg("Conta criada com sucesso!");
        if (data.user) {
          onAuthSuccess(data.user);
          setTimeout(onClose, 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setSuccessMsg("Login realizado com sucesso!");
        if (data.user) {
          onAuthSuccess(data.user);
          setTimeout(onClose, 800);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("mock") || err?.message?.includes("fetch failed") || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const demoUser = {
          id: "demo-user-123",
          email: email || "usuario.demo@precia.com",
          user_metadata: { full_name: fullName || "Usuário PrecIA Demo" },
        };
        setSuccessMsg("Autenticado no Modo Demonstração Seguro!");
        onAuthSuccess(demoUser);
        setTimeout(onClose, 800);
      } else {
        setErrorMsg(err?.message || "Falha na autenticação.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = {
      id: "demo-user-123",
      email: "cliente.precia@omnichannel.com",
      user_metadata: { full_name: "Cliente PrecIA" },
    };
    onAuthSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-card border border-border/80 rounded-3xl p-6 shadow-2xl transition-all">
        {/* Topo */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-background" />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-base tracking-tight">
                {isSignUp ? "Criar Conta PrecIA" : "Entrar no PrecIA"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Sincronize alertas e histórico inteligente
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

        {/* Abas Entrar / Cadastrar Arredondadas */}
        <div className="grid grid-cols-2 p-1 bg-secondary/60 rounded-2xl mb-4 text-xs font-semibold text-center border border-border/60">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 rounded-xl transition-all font-semibold ${
              !isSignUp
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 rounded-xl transition-all font-semibold ${
              isSignUp
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Feedback visual */}
        {errorMsg && (
          <div className="p-3 mb-3.5 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-3.5 rounded-2xl bg-success-subtle border border-success-border text-success text-xs font-bold">
            {successMsg}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nome Completo:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  required={isSignUp}
                  className="pl-10 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              E-mail:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="pl-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Senha:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-10 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="default"
            size="default"
            disabled={loading}
            className="w-full rounded-2xl font-bold mt-2 shadow-md"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              "Criar Conta Gratuita"
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        {/* Atalho Demo */}
        <div className="mt-4 pt-3.5 border-t border-border/80 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDemoLogin}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold rounded-xl"
          >
            Acessar com Perfil Demo Rápido
          </Button>
        </div>
      </div>
    </div>
  );
}
