-- =====================================================================
-- PrecIA - Sprint 2 Migration: Schema, Row Level Security (RLS) & Triggers
-- Data: 2026-09-03
-- =====================================================================

-- Extensão pgcrypto para geração de UUIDs (caso ainda não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. Tabela de Perfis de Usuários (Vinculada ao auth.users)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone_whatsapp VARCHAR(20),
  default_cep VARCHAR(9),
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS em Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Profiles
DROP POLICY IF EXISTS "Usuários podem ver apenas próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver apenas próprio perfil" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar apenas próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar apenas próprio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================================
-- 2. Tabela de Produtos Monitorados (Favoritos / Preço-alvo)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.monitored_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  product_model TEXT NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2),
  store_name TEXT,
  product_url TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização de consultas e ordenação
CREATE INDEX IF NOT EXISTS idx_monitored_products_user_id ON public.monitored_products(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_products_is_active ON public.monitored_products(is_active);

-- Enable RLS em Monitored Products
ALTER TABLE public.monitored_products ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Monitored Products: Usuário só gerencia seus próprios itens
DROP POLICY IF EXISTS "Usuários podem gerenciar apenas seus próprios produtos" ON public.monitored_products;
CREATE POLICY "Usuários podem gerenciar apenas seus próprios produtos" 
  ON public.monitored_products FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 3. Tabela do Histórico de Preços
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_model TEXT NOT NULL,
  store_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida de histórico por modelo do produto
CREATE INDEX IF NOT EXISTS idx_price_history_model ON public.price_history(product_model);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON public.price_history(created_at DESC);

-- Enable RLS em Price History
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Qualquer usuário autenticado pode consultar o histórico de preços
DROP POLICY IF EXISTS "Histórico de preço é visível para qualquer usuário autenticado" ON public.price_history;
CREATE POLICY "Histórico de preço é visível para qualquer usuário autenticado" 
  ON public.price_history FOR SELECT TO authenticated 
  USING (true);

-- Inserção de histórico restrita exclusivamente ao backend/cron (Service Role)
DROP POLICY IF EXISTS "Apenas service_role pode inserir histórico de preços" ON public.price_history;
CREATE POLICY "Apenas service_role pode inserir histórico de preços"
  ON public.price_history FOR INSERT TO service_role
  WITH CHECK (true);

-- =====================================================================
-- 4. Função e Trigger para Atualização Automática de updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_monitored_products_updated_at ON public.monitored_products;
CREATE TRIGGER tr_monitored_products_updated_at
  BEFORE UPDATE ON public.monitored_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================================
-- 5. Trigger para Criação Automática do Perfil no Cadastro (auth.users)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, default_cep)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'default_cep', '01310-100')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
