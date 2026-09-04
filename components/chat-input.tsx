"use client";

import React, { useRef, useState } from "react";
import { Camera, Send, Upload, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onSendImage: (file: File) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onSendImage,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 150;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading || disabled) return;
    onSendMessage(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onSendImage(file);
      // Limpa input para permitir selecionar a mesma foto se necessário
      e.target.value = "";
    }
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 glass-panel border-t border-slate-800/90 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="max-w-3xl mx-auto flex flex-col gap-1.5">
        {/* Hidden inputs para câmera e galeria */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          id="camera-capture-input"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload-input"
        />

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Botão Câmera Nativa (Mobile Primeiro) */}
          <button
            type="button"
            onClick={triggerCamera}
            disabled={isLoading || disabled}
            title="Tirar foto da etiqueta na loja física"
            className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Botão Galeria/Upload Secundário */}
          <button
            type="button"
            onClick={triggerFileUpload}
            disabled={isLoading || disabled}
            title="Carregar imagem da galeria"
            className="hidden sm:flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Campo de Texto Principal */}
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder="Digite o modelo (ex: TV LG 75 QNED70)..."
              disabled={isLoading || disabled}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-3.5 pr-14 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
            />
            {/* Indicador de limite de caracteres */}
            <span
              className={`absolute right-3 text-[10px] tabular-nums font-mono ${
                text.length >= MAX_CHARS ? "text-rose-400 font-bold" : "text-slate-500"
              }`}
            >
              {text.length}/{MAX_CHARS}
            </span>
          </div>

          {/* Botão de Envio de Texto */}
          <button
            type="submit"
            disabled={!text.trim() || isLoading || disabled}
            className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-800 hover:bg-indigo-600 active:scale-95 text-slate-200 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Dica discreta no rodapé */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Dica: Fotografe a etiqueta de preço na gôndola para leitura instantânea por IA</span>
          <span className="hidden sm:inline">Ctrl+Enter para enviar</span>
        </div>
      </div>
    </div>
  );
}
