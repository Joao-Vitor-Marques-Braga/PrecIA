import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "./lib/rate-limit";

// Configurações de Content-Security-Policy ajustadas para Next.js, Web/PWA e imagens de lojas
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' blob: data: https: http:;
  connect-src 'self' https: http:;
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || "";

  // 1. Tratamento de CORS Estrito para rotas de API (/api/*)
  if (pathname.startsWith("/api/")) {
    const isSameOrigin =
      !origin ||
      origin.replace(/^https?:\/\//, "") === host ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1");

    // Resposta para preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      if (!isSameOrigin) {
        return new NextResponse("CORS Origin Not Allowed", { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (!isSameOrigin) {
      return NextResponse.json(
        {
          error: "Acesso negado: Origem não autorizada por política de CORS estrito.",
        },
        { status: 403 }
      );
    }

    // 2. Rate Limiting por IP para rotas críticas de API (/api/vision, /api/search)
    if (pathname.startsWith("/api/vision") || pathname.startsWith("/api/search")) {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

      const identifier = `${clientIp}:${pathname.startsWith("/api/vision") ? "vision" : "search"}`;
      const rateLimitResult = await applyRateLimit(identifier, 10);

      if (!rateLimitResult.success) {
        return NextResponse.json(
          {
            error: "Limite de requisições excedido. Máximo de 10 requisições por minuto.",
            resetInSeconds: rateLimitResult.reset,
          },
          {
            status: 429,
            headers: {
              "Retry-After": rateLimitResult.reset.toString(),
              "X-RateLimit-Limit": rateLimitResult.limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            },
          }
        );
      }
    }
  }

  // 3. Injeção de Security Headers (Helmet-style)
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()"
  );
  response.headers.set("Content-Security-Policy", cspHeader);

  // Se for chamada de API com origin válido, adiciona CORS header
  if (origin && pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas exceto arquivos estáticos (.ico, .png, .jpg, _next, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)",
  ],
};
