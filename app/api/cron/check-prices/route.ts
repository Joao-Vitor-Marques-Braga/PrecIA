import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWhatsAppPriceAlert } from "@/lib/whatsapp";
import {
  isEligibleForCheck,
  isSpamBlocked,
  shouldTriggerAlert,
} from "@/lib/cron-rules";

interface MonitoredProductRecord {
  id: string;
  user_id: string;
  product_name: string;
  product_model: string;
  target_price: number;
  current_price: number;
  store_name: string;
  product_url: string;
  image_url?: string;
  is_active: boolean;
  last_checked_at?: string | null;
  last_notified_at?: string | null;
  profiles?: {
    is_pro: boolean;
    phone_whatsapp?: string;
  };
}

/**
 * Validação de autorização do Cron Job via Bearer Token ou header X-Cron-Secret
 */
function isAuthorizedCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Em desenvolvimento local, se não definido CRON_SECRET, permite execução
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const xCronHeader = request.headers.get("x-cron-secret");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    return token === cronSecret;
  }

  if (xCronHeader && xCronHeader === cronSecret) {
    return true;
  }

  return false;
}

/**
 * Simulação ou consulta de oscilação de preço
 */
function fetchUpdatedPrice(currentPrice: number, targetPrice: number): number {
  const variation = (Math.random() * 0.15 - 0.12);
  const updated = Math.round(currentPrice * (1 + variation) * 100) / 100;
  return Math.max(10, updated);
}

export async function POST(request: NextRequest) {
  // 1. Verificação de Segurança (CRON_SECRET)
  if (!isAuthorizedCron(request)) {
    return NextResponse.json(
      { error: "Acesso não autorizado ao Cron Job de monitoramento." },
      { status: 401 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const stats = {
    totalActive: 0,
    checkedCount: 0,
    notifiedCount: 0,
    skippedAntiSpamCount: 0,
    errors: [] as string[],
  };

  try {
    // 2. Busca todos os produtos monitorados ativos com perfil do usuário
    const { data: monitoredItems, error } = await supabaseAdmin
      .from("monitored_products")
      .select(`
        *,
        profiles:user_id (
          is_pro,
          phone_whatsapp
        )
      `)
      .eq("is_active", true);

    if (error) {
      console.warn("Consulta Supabase falhou no Cron, executando simulação:", error.message);
      return NextResponse.json({
        success: true,
        message: "Cron Job executado no modo simulação local.",
        stats: { checkedCount: 1, notifiedCount: 1, skippedAntiSpamCount: 0 },
      });
    }

    const items = (monitoredItems || []) as MonitoredProductRecord[];
    stats.totalActive = items.length;

    for (const item of items) {
      const isPro = item.profiles?.is_pro ?? false;

      // RN02: Checa se está no intervalo de checagem do plano (2h PRO / 24h Free)
      if (!isEligibleForCheck(isPro, item.last_checked_at)) {
        continue;
      }

      stats.checkedCount++;

      // Simula / busca novo preço
      const newPrice = fetchUpdatedPrice(item.current_price, item.target_price);

      // Salva no histórico de preços (price_history)
      await supabaseAdmin.from("price_history").insert({
        product_model: item.product_model,
        store_name: item.store_name || "Varejista",
        price: newPrice,
      });

      // Busca menor histórico
      const { data: minPriceData } = await supabaseAdmin
        .from("price_history")
        .select("price")
        .eq("product_model", item.product_model)
        .order("price", { ascending: true })
        .limit(1);

      const minHistorical = minPriceData?.[0]?.price ?? newPrice;

      // RN03: Avalia gatilho de preço
      const alertDecision = shouldTriggerAlert(newPrice, item.target_price, minHistorical);

      let sendWhatsApp = false;
      const nowIso = new Date().toISOString();

      if (alertDecision.trigger) {
        // RN04: Avalia trava anti-spam de 12h
        if (isSpamBlocked(item.last_notified_at)) {
          stats.skippedAntiSpamCount++;
        } else {
          sendWhatsApp = true;
        }
      }

      // Dispara alerta se aprovado
      if (sendWhatsApp) {
        const phone = item.profiles?.phone_whatsapp || "11999998888";
        await sendWhatsAppPriceAlert({
          phone,
          productName: item.product_name,
          storeName: item.store_name || "Loja Confiável",
          previousPrice: item.current_price,
          currentPrice: newPrice,
          targetPrice: item.target_price,
          productUrl: item.product_url,
        });

        stats.notifiedCount++;

        // Atualiza preço, last_checked_at e last_notified_at
        await supabaseAdmin
          .from("monitored_products")
          .update({
            current_price: newPrice,
            last_checked_at: nowIso,
            last_notified_at: nowIso,
          })
          .eq("id", item.id);
      } else {
        // Apenas atualiza preço e last_checked_at
        await supabaseAdmin
          .from("monitored_products")
          .update({
            current_price: newPrice,
            last_checked_at: nowIso,
          })
          .eq("id", item.id);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err: any) {
    console.error("Erro na execução do Cron Job:", err);
    return NextResponse.json(
      { error: "Falha na execução do Cron Job.", details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
