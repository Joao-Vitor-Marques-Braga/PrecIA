import { NextRequest, NextResponse } from "next/server";
import { buildAffiliateUrl } from "@/lib/affiliate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Parâmetro 'url' ausente. Informe a URL de destino da loja." },
      { status: 400 }
    );
  }

  const result = buildAffiliateUrl(targetUrl);

  if (!result.success || !result.finalUrl) {
    return NextResponse.json(
      {
        error: "Bloqueio de Segurança Anti-SSRF / Open-Redirect",
        details: result.error,
      },
      { status: 400 }
    );
  }

  // Se a requisição pedir JSON explicitamente (ex: front-end inspecionando link)
  const acceptHeader = request.headers.get("accept") || "";
  if (acceptHeader.includes("application/json")) {
    return NextResponse.json(result);
  }

  // Redirecionamento HTTP 307 seguro para a loja parceira com tag injetada
  return NextResponse.redirect(new URL(result.finalUrl), 307);
}
