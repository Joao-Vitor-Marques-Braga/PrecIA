"use client";

import React, { useState } from "react";
import { User, Lock, Mail, X, Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
        setSuccessMsg("Conta criada com sucesso! Verifique seu e-mail se a confirmação estiver ativada.");
        if (data.user) {
          onAuthSuccess(data.user);
          setTimeout(onClose, 1200);
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
      // Fallback amigável se Supabase não tiver credenciais configuradas no .env
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-indigo-950/50">
        {/* Topo */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {isSignUp ? "Criar Conta PrecIA" : "Entrar no PrecIA"}
              </h3>
              <p className="text-[11px] text-slate-400">
                Sincronize alertas e ofertas salvas
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

        {/* Abas Entrar / Cadastrar */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl mb-4 text-xs font-semibold text-center border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg("");
            }}
            className={`py-1.5 rounded-lg transition-colors ${
              !isSignUp ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg("");
            }}
            className={`py-1.5 rounded-lg transition-colors ${
              isSignUp ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Completo:
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  required={isSignUp}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              E-mail:
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Senha:
            </label>
            <div className="relative flex items-center">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
            </div>
          </div>

          {errorMsg && (
            <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              "Criar Conta Gratuita"
            ) : (
              "Entrar"
            )}
          </button>

          {/* Atalho Demo */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
          >
            Acesso Rápido de Demonstração (1-Clique)
          </button>
        </form>
      </div>
    </div>
  );
}
