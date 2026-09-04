# 🏷️ PrecIA — Comparador Inteligente Omnichannel com IA

<p align="center">
  <img src="public/icons/icon-192.svg" alt="PrecIA Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>O assistente de compras inteligente com Visão Computacional para o varejo físico e digital.</strong><br>
  Tire uma foto da etiqueta na gôndola, descubra o menor preço online em tempo real, receba o veredito se vale a pena negociar ou comprar online e monitore quedas de preço direto no seu WhatsApp!
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75B2?style=for-the-badge&logo=google" alt="Gemini Vision" />
  <img src="https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge" alt="PWA" />
</p>

---

## 🚀 Principais Funcionalidades

### 📸 1. Visão Computacional (OCR + IA Generativa)
- Fotografe a etiqueta de preço na prateleira da loja física usando a câmera do celular.
- O modelo **Google Gemini 1.5 Flash** extrai automaticamente a marca, modelo técnico exato e o preço físico detectado, calculando um índice de confiança da leitura.
- Sistema de validação caso a etiqueta apresente ambiguidade ou baixa confiança.

### 🔍 2. Comparação de Preços Omnichannel & Cálculo de Frete
- Busca em tempo real via **SerpApi (Google Shopping)** e principais e-commerces brasileiros (Amazon, Mercado Livre, Magalu, KaBuM!, Fast Shop, etc.).
- Cálculo dinâmico de **Preço Efetivo** (Preço com desconto PIX + Frete estimado com base no CEP do usuário).
- Destaque automático da **Melhor Oferta**.

### ⚖️ 3. Card de Veredito Inteligente
- **Comprar Online**: Quando a economia no e-commerce compensa mesmo com o frete e prazo de entrega.
- **Pechinchar na Loja Física**: Quando o preço online está menor, mas a diferença viabiliza cobrir a oferta na hora com o gerente da loja.
- **Comprar na Loja Física**: Quando o preço da loja física já é imbatível ou a entrega encarece a compra online.

### 🔔 4. Monitoramento de Preços & Alertas no WhatsApp
- Defina um preço-alvo para qualquer produto pesquisado.
- Varredura periódica e automatizada de preços via **Cron Job**.
- Disparo de alertas no **WhatsApp** via **Evolution API** quando o preço atinge a meta estipulada, com travas anti-spam de 12 horas.

### 🛡️ 5. Links de Afiliados Seguros (Server-Side)
- Roteamento e injeção automática de tags de afiliados (Amazon, Mercado Livre, Magalu, KaBuM!).
- Proteção contra **SSRF** (Server-Side Request Forgery) com *whitelist* rigorosa de domínios varejistas autorizados e bloqueio de IPs privados/locais.

### 📱 6. PWA Mobile-First
- Instalável como aplicativo no celular (Progressive Web App com Service Worker e Web App Manifest).
- Interface moderna, rápida, responsiva e com tema escuro elegante.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework Web** | [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers) |
| **Linguagem & Tipagem** | [TypeScript](https://www.typescriptlang.org/) + [Zod](https://zod.dev/) |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) |
| **Inteligência Artificial** | [Google Gemini 1.5 Flash](https://ai.google.dev/) (Vision Multimodal) |
| **Busca de Ofertas** | [SerpApi](https://serpapi.com/) (Google Shopping Engine) |
| **Banco de Dados & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + RLS + Triggers + Auth SSR) |
| **Rate Limiting** | [Upstash Redis](https://upstash.com/) |
| **Mensageria** | [Evolution API](https://evolution-api.com/) (WhatsApp Gateway) |
| **Deploy & Cron** | [Vercel](https://vercel.com/) (Vercel Cron Jobs & Serverless) |

---

## 📁 Estrutura do Projeto

```plaintext
PrecIA/
├── app/
│   ├── api/
│   │   ├── affiliate/redirect/      # Redirecionamento seguro de links com tag de afiliado
│   │   ├── cron/check-prices/       # Cron job para checagem em lote dos preços monitorados
│   │   ├── monitored-products/      # CRUD de produtos monitorados pelo usuário
│   │   ├── search/                  # Busca e ranking de ofertas com frete por CEP
│   │   └── vision/                  # Análise da imagem da etiqueta com Gemini Vision
│   ├── globals.css                  # Estilos globais e tokens CSS
│   ├── layout.tsx                   # Layout raiz da aplicação (PWA tags e metadata)
│   └── page.tsx                     # Interface principal (Chat, Cards e Veredito)
├── components/
│   ├── auth-modal.tsx               # Modal de login/cadastro (Supabase Auth)
│   ├── chat-input.tsx               # Input de texto e upload de foto de etiqueta
│   ├── confidence-modal.tsx         # Modal para confirmação de leitura da etiqueta
│   ├── header-cep.tsx               # Barra superior com seletor de CEP e atalho do monitor
│   ├── monitor-modal.tsx            # Modal para definição de preço-alvo
│   ├── monitored-drawer.tsx         # Gaveta lateral com listagem de produtos monitorados
│   ├── product-card.tsx             # Card de exibição de oferta individual
│   └── verdict-card.tsx             # Card de recomendação da IA (Comprar Online / Pechinchar)
├── lib/
│   ├── supabase/                    # Clientes Supabase (Browser, Server & Middleware)
│   ├── affiliate.ts                 # Validação SSRF, whitelist e injeção de afiliados
│   ├── cron-rules.ts                # Regras de negócio da automação de cron
│   ├── rate-limit.ts                # Middleware Upstash Redis / Fallback in-memory
│   ├── validations.ts               # Schemas Zod de validação de dados
│   └── whatsapp.ts                  # Formatação e integração com Evolution API
├── public/
│   ├── icons/                       # Ícones do PWA (192px e 512px)
│   ├── manifest.json                # Manifesto PWA
│   └── sw.js                        # Service Worker para cache e funcionamento offline
├── supabase/
│   └── migrations/                  # Migrações SQL (Tabelas, RLS, Triggers e Índices)
├── .env.example                     # Modelo de variáveis de ambiente
└── vercel.json                      # Configuração do Vercel Cron Job
```

---

## ⚙️ Configuração do Ambiente

### 1. Pré-requisitos
- **Node.js**: Versão 18.17 ou superior
- **npm** ou **yarn** / **pnpm**
- Conta no [Supabase](https://supabase.com/)
- Chave de API do [Google AI Studio (Gemini)](https://aistudio.google.com/)
- *(Opcional)* Chave [SerpApi](https://serpapi.com/) para buscas no Google Shopping
- *(Opcional)* Instância da [Evolution API](https://github.com/EvolutionAPI/evolution-api) para envio de mensagens no WhatsApp

### 2. Clonando o Repositório
```bash
git clone https://github.com/Joao-Vitor-Marques-Braga/PrecIA.git
cd PrecIA
```

### 3. Instalando as Dependências
```bash
npm install
```

### 4. Configurando as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env.local
```

Preencha as chaves no `.env.local`:

```env
# Google Gemini (Visão Computacional)
GEMINI_API_KEY=sua_chave_do_gemini

# Busca de Preços (Opcional - Em dev usa catálogo simulado se ausente)
SERPAPI_KEY=sua_chave_serpapi

# Supabase (Banco de Dados e Auth)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Tags de Afiliados (Server-Side)
AMAZON_AFFILIATE_TAG=suatag-20
MERCADOLIVRE_AFFILIATE_TOOL=
MAGALU_PARTNER_ID=seuid
KABUM_AFFILIATE_TAG=

# Automação do Cron Job
CRON_SECRET=um_token_secreto_para_o_cron

# WhatsApp / Evolution API (Alertas de Preço)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua_api_key_evolution
EVOLUTION_INSTANCE=sua_instancia

# URL da Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Configurando o Banco de Dados (Supabase)
Execute os scripts SQL das migrações no **SQL Editor** do seu painel Supabase na seguinte ordem:
1. `supabase/migrations/20260903_sprint2_schema.sql` (Criação de `profiles`, `monitored_products`, `price_history`, Triggers e RLS).
2. `supabase/migrations/20260903_sprint3_schema.sql` (Colunas de auditoria do cron, índices de varredura e funções auxiliares).

---

## 🏃 Como Rodar Localmente

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

Para testar a experiência mobile e PWA, abra as Ferramentas do Desenvolvedor (`F12`) e ative o modo de dispositivo móvel.

---

## 🔄 Testando o Cron Job de Alertas de Preço

A rota de cron pode ser testada manualmente enviando uma requisição `POST` com o cabeçalho de autenticação:

```bash
curl -X POST http://localhost:3000/api/cron/check-prices \
  -H "Authorization: Bearer your-secure-cron-secret-token"
```

No ambiente de produção na **Vercel**, o agendamento já está pré-configurado no arquivo [vercel.json](file:///c:/Users/User/Documents/teste%20de%20autma%C3%A7%C3%A3o/PrecIA/vercel.json) para rodar periodicamente a cada 4 horas:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-prices",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

---

## 🔒 Segurança e Boas Práticas

- **Proteção contra SSRF**: As URLs de parceiros comerciais passam por validação Zod e checagem de IP privado antes de qualquer redirecionamento ou scraping.
- **Row Level Security (RLS)**: Cada usuário autenticado tem acesso estritamente aos seus próprios produtos monitorados e dados de perfil no PostgreSQL.
- **Rate Limiting**: Endpoints de IA e buscas protegidos por tokens de bucket via Redis para prevenir esgotamento de cotas.
- **Controle Anti-Spam no WhatsApp**: Disparos de alerta respeitam uma janela de tolerância de 12 horas por produto para não sobrecarregar o usuário.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

<p align="center">
  Desenvolvido com 💜 para transformar a experiência de compras no varejo físico e digital.
</p>
