import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Schema Zod para criação de produto monitorado
const createMonitoredProductSchema = z.object({
  product_name: z.string().min(2, "Nome do produto muito curto.").max(200),
  product_model: z.string().min(2, "Modelo obrigatório.").max(100),
  target_price: z.number().positive("O preço-alvo deve ser positivo."),
  current_price: z.number().positive().optional(),
  store_name: z.string().max(100).optional(),
  product_url: z.string().url("URL do produto inválida."),
  image_url: z.string().url("URL da imagem inválida.").optional().or(z.literal("")),
  phone_whatsapp: z.string().max(20).optional(),
});

// Mock store em memória para ambiente local / sem Supabase configurado
interface MockMonitoredItem {
  id: string;
  user_id: string;
  product_name: string;
  product_model: string;
  target_price: number;
  current_price: number;
  store_name: string;
  product_url: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mockDbMonitored: MockMonitoredItem[] = [
  {
    id: "mock-monitored-1",
    user_id: "demo-user-123",
    product_name: "Smart TV LG 75 QNED70",
    product_model: "75QNED70BSA",
    target_price: 3800.00,
    current_price: 4219.06,
    store_name: "KaBuM!",
    product_url: "https://www.kabum.com.br",
    image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Se conectado com Supabase Auth
    if (user) {
      const { data, error } = await supabase
        .from("monitored_products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, items: data });
    }

    // Fallback: modo demo / desenvolvimento local
    return NextResponse.json({
      success: true,
      items: mockDbMonitored,
      isDemo: true,
    });
  } catch (error: any) {
    console.error("Erro ao listar produtos monitorados:", error);
    return NextResponse.json(
      { error: "Falha ao obter lista de produtos monitorados.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const validation = createMonitoredProductSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados de monitoramento inválidos.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const itemData = validation.data;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Inserção no Supabase com RLS garantindo que user_id = auth.uid()
    if (user) {
      // Trava Freemium: Verifica perfil e contagem atual
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single();

      const isPro = profile?.is_pro ?? false;

      if (!isPro) {
        const { count, error: countError } = await supabase
          .from("monitored_products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (!countError && (count || 0) >= 3) {
          return NextResponse.json(
            {
              error: "Limite do plano Freemium atingido (máximo de 3 alertas simultâneos). Assine o plano PRO para monitoramento ilimitado!",
              quotaExceeded: true,
            },
            { status: 403 }
          );
        }
      }

      const { data, error } = await supabase
        .from("monitored_products")
        .insert({
          user_id: user.id,
          product_name: itemData.product_name,
          product_model: itemData.product_model,
          target_price: itemData.target_price,
          current_price: itemData.current_price || itemData.target_price,
          store_name: itemData.store_name || "Varejo Online",
          product_url: itemData.product_url,
          image_url: itemData.image_url || null,
          is_active: true,
          last_checked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, item: data }, { status: 201 });
    }

    // Fallback demo em memória (aplica limite de 3 itens se não for pro)
    const activeDemoCount = mockDbMonitored.filter((m) => m.is_active).length;
    if (activeDemoCount >= 5) {
      return NextResponse.json(
        {
          error: "Limite de demonstração atingido. Exclua um item para cadastrar novos alertas.",
          quotaExceeded: true,
        },
        { status: 403 }
      );
    }

    const newItem: MockMonitoredItem = {
      id: `monitored-${Date.now()}`,
      user_id: "demo-user-123",
      product_name: itemData.product_name,
      product_model: itemData.product_model,
      target_price: itemData.target_price,
      current_price: itemData.current_price || itemData.target_price,
      store_name: itemData.store_name || "Varejo Online",
      product_url: itemData.product_url,
      image_url: itemData.image_url || "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDbMonitored.unshift(newItem);

    return NextResponse.json(
      { success: true, item: newItem, isDemo: true },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao registrar monitoramento:", error);
    return NextResponse.json(
      { error: "Falha ao criar monitoramento de preço.", details: error.message },
      { status: 500 }
    );
  }
}
