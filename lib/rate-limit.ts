import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Em memória: sliding window simples para desenvolvimento ou quando Redis não estiver configurado
interface MemoryRateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryRateLimitRecord>();

// Limpa registros antigos a cada 5 minutos para evitar vazamento de memória
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts: number) => now - ts < 60_000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    });
  }, 5 * 60_000);
}

function checkMemoryRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  let record = memoryStore.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(identifier, record);
  }

  // Filtra apenas requisições dentro da janela de tempo atual
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const reset = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.max(1, reset),
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset: Math.ceil(windowMs / 1000),
  };
}

let upstashRatelimit: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "@precia/ratelimit",
    });
  } catch (error) {
    console.warn("Falha ao inicializar Upstash Redis, utilizando fallback em memória:", error);
  }
}

/**
 * Função principal de rate limiting (10 requisições por minuto por padrão)
 */
export async function applyRateLimit(
  identifier: string,
  limit: number = 10
): Promise<RateLimitResult> {
  if (upstashRatelimit) {
    try {
      const result = await upstashRatelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (err) {
      console.warn("Erro no Upstash Ratelimit, caindo no fallback em memória:", err);
      return checkMemoryRateLimit(identifier, limit);
    }
  }

  return checkMemoryRateLimit(identifier, limit);
}
