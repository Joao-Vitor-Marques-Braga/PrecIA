-- =====================================================================
-- PrecIA - Sprint 3 Migration: Automação, Auditoria de Cron & Alertas
-- Data: 2026-09-03
-- =====================================================================

-- 1. Adição de colunas de auditoria e controle de agendamento em monitored_products
ALTER TABLE public.monitored_products 
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;

-- 2. Índices de performance para varreduras em lote do Cron Job
CREATE INDEX IF NOT EXISTS idx_monitored_active_checked 
  ON public.monitored_products (is_active, last_checked_at);

CREATE INDEX IF NOT EXISTS idx_monitored_last_notified 
  ON public.monitored_products (last_notified_at);

-- 3. Função auxiliar para obter menor preço histórico de um produto
CREATE OR REPLACE FUNCTION public.get_min_historical_price(p_model TEXT)
RETURNS DECIMAL AS $$
  SELECT MIN(price) 
  FROM public.price_history 
  WHERE product_model = p_model;
$$ LANGUAGE sql STABLE;

COMMENT ON COLUMN public.monitored_products.last_checked_at IS 'Data e hora da última consulta de preço realizada pelo cron job';
COMMENT ON COLUMN public.monitored_products.last_notified_at IS 'Data e hora do último alerta disparado via WhatsApp (trava anti-spam de 12h)';
