import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateMonitoredSchema = z.object({
  target_price: z.number().positive().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = updateMonitoredSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("monitored_products")
        .update(validation.data)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, item: data });
    }

    return NextResponse.json({
      success: true,
      message: `Item ${id} atualizado (Modo Demo).`,
      updated: validation.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Falha ao atualizar produto monitorado.", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("monitored_products")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return NextResponse.json({ success: true, deletedId: id });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
      message: "Item removido com sucesso (Modo Demo).",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Falha ao excluir produto monitorado.", details: error.message },
      { status: 500 }
    );
  }
}
