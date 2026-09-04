import { z } from "zod";

/**
 * Whitelist de domínios varejistas oficiais autorizados para injeção de afiliados
 */
export const ALLOWED_RETAILER_DOMAINS = [
  "amazon.com.br",
  "amzn.to",
  "mercadolivre.com.br",
  "mercadolivre.com",
  "meli.la",
  "magazineluiza.com.br",
  "magalu.com",
  "kabum.com.br",
  "shopee.com.br",
  "fastshop.com.br",
  "casasbahia.com.br",
  "shopper.com.br",
  "google.com.br",
  "google.com",
  "googleadservices.com",
  "carrefour.com.br",
  "pichau.com.br",
  "terabyteshop.com.br",
  "kalunga.com.br",
  "pontofrio.com.br",
  "extra.com.br",
  "americanas.com.br",
  "submarino.com.br",
  "girafa.com.br",
  "zoom.com.br",
  "buscape.com.br",
  "lg.com",
  "samsung.com",
  "havan.com.br",
  "casaevideo.com.br",
] as const;

/**
 * Regex para detectar tentativas de SSRF contra redes internas, localhost e metadata cloud
 */
const PRIVATE_IP_REGEX =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|169\.254\.\d+\.\d+|::1|0\.0\.0\.0)$/i;

/**
 * Schema Zod para validação da URL antes do processamento de afiliado
 */
export const affiliateUrlSchema = z.object({
  url: z
    .string({ required_error: "A URL de destino é obrigatória." })
    .trim()
    .min(10, "URL muito curta.")
    .max(2048, "URL muito longa.")
    .refine((val) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, {
      message: "Protocolo inválido. Apenas HTTP e HTTPS são permitidos.",
    }),
});

export interface AffiliateParseResult {
  success: boolean;
  finalUrl?: string;
  domain?: string;
  retailerName?: string;
  error?: string;
}

/**
 * Validação de segurança Anti-SSRF (bloqueia redes internas, localhost e cloud metadata)
 */
export function isSafePublicDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase().trim();

  // Bloqueio explícito anti-SSRF
  if (
    PRIVATE_IP_REGEX.test(normalized) ||
    normalized.startsWith("169.254.") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".lan") ||
    !normalized.includes(".")
  ) {
    return false;
  }

  return true;
}

/**
 * Verifica se um hostname pertence à Whitelist de parceiros de afiliados
 */
export function isAllowedDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase().trim();

  if (!isSafePublicDomain(normalized)) {
    return false;
  }

  return ALLOWED_RETAILER_DOMAINS.some(
    (allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`)
  );
}

/**
 * Sanitiza parâmetros e injeta a tag de afiliado segura do lado do servidor
 */
export function buildAffiliateUrl(rawUrl: string): AffiliateParseResult {
  try {
    const validation = affiliateUrlSchema.safeParse({ url: rawUrl });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "URL inválida.",
      };
    }

    const parsed = new URL(validation.data.url);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Validação estrita Anti-SSRF
    if (!isSafePublicDomain(hostname)) {
      return {
        success: false,
        error: `Bloqueio Anti-SSRF: Domínio interno ou inseguro "${hostname}".`,
      };
    }

    // Sanitização de parâmetros da query string (remove tentativas de injeção)
    const sanitizedParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams.entries()) {
      if (
        !key.toLowerCase().includes("script") &&
        !key.toLowerCase().includes("eval") &&
        !value.toLowerCase().includes("javascript:")
      ) {
        sanitizedParams.set(key, value);
      }
    }

    let retailerName = "Loja Confiável";

    // 1. Amazon Brasil
    if (hostname.includes("amazon.com.br") || hostname.includes("amzn.to")) {
      retailerName = "Amazon Brasil";
      const amazonTag = process.env.AMAZON_AFFILIATE_TAG || "precia-20";
      sanitizedParams.set("tag", amazonTag);
      sanitizedParams.set("linkCode", "ll1");
    }
    // 2. Mercado Livre
    else if (hostname.includes("mercadolivre.com") || hostname.includes("meli.la")) {
      retailerName = "Mercado Livre";
      const mlTool = process.env.MERCADOLIVRE_AFFILIATE_TOOL || "precia_app";
      sanitizedParams.set("matt_tool", mlTool);
      sanitizedParams.set("matt_word", "precia_omnichannel");
    }
    // 3. Magazine Luiza
    else if (hostname.includes("magazineluiza.com.br") || hostname.includes("magalu.com")) {
      retailerName = "Magazine Luiza";
      const magaluPartner = process.env.MAGALU_PARTNER_ID || "precia";
      sanitizedParams.set("partner_id", magaluPartner);
    }
    // 4. KaBuM!
    else if (hostname.includes("kabum.com.br")) {
      retailerName = "KaBuM!";
      const kabumTag = process.env.KABUM_AFFILIATE_TAG || "precia";
      sanitizedParams.set("tag", kabumTag);
    }
    // 5. Shopee
    else if (hostname.includes("shopee.com.br")) {
      retailerName = "Shopee";
      sanitizedParams.set("aff_source", "precia");
    }
    // 6. Fast Shop
    else if (hostname.includes("fastshop.com.br")) {
      retailerName = "Fast Shop";
      sanitizedParams.set("parceiro", "precia");
    }
    // 7. Casas Bahia
    else if (hostname.includes("casasbahia.com.br")) {
      retailerName = "Casas Bahia";
      sanitizedParams.set("utm_source", "precia_afiliados");
    }
    // 8. Google Shopping / Resultados Diretos SerpApi
    else if (hostname.includes("google.com") || hostname.includes("googleadservices.com")) {
      retailerName = "Google Shopping";
    }
    // 9. Outros Varejistas Públicos
    else {
      retailerName = hostname.replace(/^www\./, "");
      sanitizedParams.set("utm_source", "precia");
    }

    parsed.search = sanitizedParams.toString();

    return {
      success: true,
      finalUrl: parsed.toString(),
      domain: hostname,
      retailerName,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Falha ao processar link de destino.",
    };
  }
}

/**
 * Converte links agregadores do Google Shopping em links diretos para a loja oficial do varejista
 */
export function resolveDirectStoreUrl(
  storeName?: string,
  productTitle?: string,
  rawLink?: string
): string {
  // Se o link já for direto da loja (não for do Google nem vazio)
  if (rawLink && !rawLink.includes("google.com") && !rawLink.includes("googleadservices.com") && rawLink !== "#") {
    return rawLink;
  }

  const s = (storeName || "").toLowerCase().trim();
  const q = encodeURIComponent((productTitle || "").trim());

  if (!q) {
    return rawLink || "https://www.google.com.br";
  }

  if (s.includes("magalu") || s.includes("magazine luiza")) {
    return `https://www.magazineluiza.com.br/busca/${q}/`;
  }
  if (s.includes("amazon")) {
    return `https://www.amazon.com.br/s?k=${q}`;
  }
  if (s.includes("mercado livre") || s.includes("mercadolivre")) {
    const mlSlug = encodeURIComponent((productTitle || "").trim().replace(/\s+/g, "-"));
    return `https://lista.mercadolivre.com.br/${mlSlug}`;
  }
  if (s.includes("casas bahia")) {
    return `https://www.casasbahia.com.br/${q}/b`;
  }
  if (s.includes("kabum")) {
    return `https://www.kabum.com.br/busca/${q}`;
  }
  if (s.includes("fast shop") || s.includes("fastshop")) {
    return `https://www.fastshop.com.br/web/s/${q}`;
  }
  if (s.includes("carrefour")) {
    return `https://www.carrefour.com.br/busca/${q}`;
  }
  if (s.includes("ponto") || s.includes("pontofrio")) {
    return `https://www.pontofrio.com.br/${q}/b`;
  }
  if (s.includes("extra")) {
    return `https://www.extra.com.br/${q}/b`;
  }
  if (s.includes("shopee")) {
    return `https://shopee.com.br/search?keyword=${q}`;
  }
  if (s.includes("havan")) {
    return `https://www.havan.com.br/catalogsearch/result/?q=${q}`;
  }
  if (s.includes("casa & video") || s.includes("casa e video") || s.includes("casaevideo")) {
    return `https://www.casaevideo.com.br/busca?q=${q}`;
  }
  if (s.includes("lg")) {
    return `https://www.lg.com/br/search.lg?search=${q}`;
  }
  if (s.includes("samsung")) {
    return `https://www.samsung.com/br/search/?searchvalue=${q}`;
  }
  if (s.includes("kalunga")) {
    return `https://www.kalunga.com.br/busca/${q}`;
  }
  if (s.includes("girafa")) {
    return `https://www.girafa.com.br/pesquisa/?q=${q}`;
  }
  if (s.includes("pichau")) {
    return `https://www.pichau.com.br/search?q=${q}`;
  }
  if (s.includes("terabyte")) {
    return `https://www.terabyteshop.com.br/busca?str=${q}`;
  }

  // Se for uma loja genérica, mantém o link retornado pelo SerpApi ou busca no Google
  return rawLink || `https://www.google.com.br/search?q=${q}`;
}
