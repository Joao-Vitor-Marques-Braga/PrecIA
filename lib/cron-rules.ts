/**
 * Regras de Negócio e Automação do Motor de Checagem (Sprint 3)
 */

/**
 * RN02: Verifica se um produto está elegível para checagem com base no plano do usuário
 */
export function isEligibleForCheck(
  isPro: boolean,
  lastCheckedAt?: string | null
): boolean {
  if (!lastCheckedAt) return true;

  const lastCheckedTime = new Date(lastCheckedAt).getTime();
  const now = Date.now();
  const diffHours = (now - lastCheckedTime) / (1000 * 60 * 60);

  // PRO: checagem a cada 2 horas (RN02)
  if (isPro) {
    return diffHours >= 2;
  }

  // Freemium: checagem a cada 24 horas (RN02)
  return diffHours >= 24;
}

/**
 * RN04: Verifica se o envio de alerta está bloqueado pela trava anti-spam de 12 horas
 */
export function isSpamBlocked(lastNotifiedAt?: string | null): boolean {
  if (!lastNotifiedAt) return false;

  const lastNotifiedTime = new Date(lastNotifiedAt).getTime();
  const now = Date.now();
  const diffHours = (now - lastNotifiedTime) / (1000 * 60 * 60);

  // Bloqueado se notificado há menos de 12 horas
  return diffHours < 12;
}

/**
 * RN03: Avalia se o preço atende às regras de gatilho para notificação no WhatsApp
 */
export function shouldTriggerAlert(
  newPrice: number,
  targetPrice: number,
  minHistoricalPrice?: number
): { trigger: boolean; reason?: string } {
  // 1. Preço atingiu ou ficou abaixo da meta do usuário
  if (newPrice <= targetPrice) {
    return {
      trigger: true,
      reason: `Preço atingiu a meta do usuário (R$ ${newPrice} <= R$ ${targetPrice})`,
    };
  }

  // 2. Preço caiu mais de 5% em relação ao menor valor histórico registrado
  if (minHistoricalPrice && minHistoricalPrice > 0) {
    const dropPct = (minHistoricalPrice - newPrice) / minHistoricalPrice;
    if (dropPct >= 0.05) {
      return {
        trigger: true,
        reason: `Queda de ${(dropPct * 100).toFixed(1)}% em relação ao menor valor histórico (R$ ${minHistoricalPrice})`,
      };
    }
  }

  return { trigger: false };
}
