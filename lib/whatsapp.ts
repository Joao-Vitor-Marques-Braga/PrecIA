import { buildAffiliateUrl } from "@/lib/affiliate";

export interface SendPriceAlertParams {
  phone: string;
  productName: string;
  storeName: string;
  previousPrice: number;
  currentPrice: number;
  targetPrice: number;
  productUrl: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  formattedPhone: string;
  messageText: string;
  simulated: boolean;
  error?: string;
}

/**
 * Normaliza o número de telefone para o padrão WhatsApp internacional E.164 (Brasil DDI 55)
 */
export function formatWhatsAppPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");

  // Se já tiver DDI do Brasil (ex: 5511999998888)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // DDD + Número (ex: 11999998888 ou 1188887777)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Monta o texto transacional do alerta de queda de preço no WhatsApp (RN01 e RN03)
 */
export function buildAlertMessage(params: {
  productName: string;
  storeName: string;
  previousPrice: number;
  currentPrice: number;
  targetPrice: number;
  safeAffiliateUrl: string;
}): string {
  const savingsAmount = Math.max(0, params.previousPrice - params.currentPrice);
  const savingsPct = params.previousPrice > 0
    ? Math.round((savingsAmount / params.previousPrice) * 100)
    : 0;

  const fmtCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return `🚨 *ALERTA DE QUEDA DE PREÇO - PrecIA!*

Olá! O produto que você está monitorando atingiu sua meta de economia:

📦 *Produto:* ${params.productName}
🏬 *Loja:* ${params.storeName}
💰 *Preço Anterior:* ${fmtCurrency(params.previousPrice)}
🔥 *Preço Atual no PIX:* ${fmtCurrency(params.currentPrice)}
🎯 *Seu Preço-Alvo:* ${fmtCurrency(params.targetPrice)}
📉 *Sua Economia:* ${fmtCurrency(savingsAmount)} (${savingsPct}% OFF)

👉 *Garanta seu desconto com segurança na loja:*
${params.safeAffiliateUrl}

_Você não receberá outro alerta deste item nas próximas 12 horas._`;
}

/**
 * Dispara notificação via Evolution API ou Gateway REST WhatsApp
 */
export async function sendWhatsAppPriceAlert(
  params: SendPriceAlertParams
): Promise<WhatsAppSendResult> {
  const formattedPhone = formatWhatsAppPhone(params.phone);

  // Link direto do produto (sem intermediários de afiliados para testes limpos)
  const safeLink = params.productUrl;

  const messageText = buildAlertMessage({
    productName: params.productName,
    storeName: params.storeName,
    previousPrice: params.previousPrice,
    currentPrice: params.currentPrice,
    targetPrice: params.targetPrice,
    safeAffiliateUrl: safeLink,
  });

  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE || "precia";

  // Se credenciais da Evolution API estiverem configuradas
  if (apiUrl && apiKey) {
    try {
      const endpoint = `${apiUrl.replace(/\/$/, "")}/message/sendText/${instance}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: messageText,
          options: {
            delay: 1200,
            presence: "composing",
            linkPreview: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro Evolution API (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.id,
        formattedPhone,
        messageText,
        simulated: false,
      };
    } catch (err: any) {
      console.error("Falha ao enviar mensagem via Evolution API:", err);
      // Retorna com erro detalhado
      return {
        success: false,
        formattedPhone,
        messageText,
        simulated: false,
        error: err.message,
      };
    }
  }

  // Modo Simulação Seguro (Dev / Testes)
  console.log("--------------------------------------------------");
  console.log("📲 [WHATSAPP SIMULATOR - PrecIA]");
  console.log(`Para: +${formattedPhone}`);
  console.log(`Mensagem:\n${messageText}`);
  console.log("--------------------------------------------------");

  return {
    success: true,
    messageId: `sim-msg-${Date.now()}`,
    formattedPhone,
    messageText,
    simulated: true,
  };
}
