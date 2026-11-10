"use client";

import React, { useRef, useState } from "react";
import { Camera, Send, Upload, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="fixed bottom-0 left-0 right-0 z-30 px-3 py-3 sm:px-6 sm:py-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="glass-floating rounded-3xl p-2 sm:p-2.5 transition-all">
          {/* Inputs ocultos de câmera e galeria */}
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
            {/* Botão Câmera Primário */}
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={triggerCamera}
              disabled={isLoading || disabled}
              title="Fotografar etiqueta na gôndola"
              className="w-11 h-11 rounded-2xl flex-shrink-0 shadow-md font-bold"
            >
              <Camera className="w-5 h-5" />
            </Button>

            {/* Botão Upload Imagem */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={triggerFileUpload}
              disabled={isLoading || disabled}
              title="Carregar foto da galeria"
              className="hidden sm:inline-flex w-11 h-11 rounded-2xl flex-shrink-0 border-border/80"
            >
              <Upload className="w-4 h-4 text-foreground" />
            </Button>

            {/* Input de Texto */}
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                placeholder="Fotografe a etiqueta ou digite o modelo (ex: TV LG 75 QNED)..."
                disabled={isLoading || disabled}
                className="w-full h-11 bg-secondary/50 dark:bg-muted/40 border border-border/80 rounded-2xl pl-4 pr-14 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all"
              />
              <span
                className={`absolute right-3.5 text-[10px] tabular-nums font-mono font-medium ${
                  text.length >= MAX_CHARS ? "text-danger font-bold" : "text-muted-foreground/70"
                }`}
              >
                {text.length}/{MAX_CHARS}
              </span>
            </div>

            {/* Botão de Enviar */}
            <Button
              type="submit"
              variant={text.trim() ? "default" : "secondary"}
              size="icon"
              disabled={!text.trim() || isLoading || disabled}
              className="w-11 h-11 rounded-2xl flex-shrink-0 transition-transform active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Dica discreta */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-3 pt-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-muted-foreground" />
              Tire uma foto clara da etiqueta na gôndola para leitura instantânea por IA
            </span>
            <span className="hidden sm:inline">Pressione Enter ↵</span>
          </div>
        </div>
      </div>
    </div>
  );
}
