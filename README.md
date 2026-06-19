# AutoGestor — Gestão Inteligente de Veículos

Plataforma web para revendedoras/lojas de veículos, baseada no PRD em `docs/`.
Cobre estoque, vendas, clientes, caixa, dashboard, documentos, relatórios, notificações WhatsApp,
multi-filial e integrações veiculares (placa, FIPE, CPF/CNPJ).

## Stack
- **Backend:** Node.js + NestJS + Prisma + PostgreSQL + JWT (access + refresh) + bcrypt
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + React Query + React Hook Form + Zod

## Estrutura
```
backend/    API NestJS
frontend/   SPA React
docs/        PRD de referência
```

## Pré-requisitos
- Node.js v20+ (testado em v24)
- Um banco PostgreSQL: **local** (instalado na máquina) **ou Supabase** (hospedado)

## Setup do Backend
```bash
cd backend
npm install

# Configure o banco: copie .env.example para .env
cp .env.example .env
```

Edite o `.env` escolhendo **uma** das opções (instruções detalhadas no próprio arquivo):
- **Postgres local:** use a mesma string em `DATABASE_URL` e `DIRECT_URL`.
- **Supabase:** `DATABASE_URL` = pooler (porta 6543, com `?pgbouncer=true`);
  `DIRECT_URL` = conexão direta (porta 5432). Pegue ambas em
  *Project Settings → Database → Connection string*.

```bash
# Crie as tabelas e o usuário admin inicial
npx prisma migrate dev --name init
npm run seed

# Suba a API (http://localhost:3000/api)
npm run start:dev
```

Usuário admin padrão (criado pelo seed): **admin@gestao.com** / senha **admin123** (troque depois).

## Setup do Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

O frontend espera a API em `http://localhost:3000/api` (configurável via `VITE_API_URL`).

## Módulos implementados
- **Autenticação + RBAC** (login/refresh JWT, bcrypt, perfis)
- **Estoque** (RF-01) — cadastro, custos, fotos, regras de negócio
- **Venda** (RF-02) — lucro bruto, situação automática, gatilho de notificação
- **Clientes** (RF-06) — cadastro + histórico de compras
- **Caixa** (RF-03) — lançamentos, categorias, resumo e extrato
- **Dashboard** (RF-08) — cards + gráficos (recharts)
- **Documentos** (RF-07) — upload, status, geração de contrato PDF
- **Relatórios** (RF-04) — relatórios + exportação Excel/PDF
- **Notificações WhatsApp** (RF-05) — integração via **Datafy API** (espelho da Meta Cloud API) + log + gatilho de estoque +60 dias; modo simulado sem token
- **Multi-filial** (Fase 2) — filiais, escopo de dados por filial, usuário global (ADMIN)
- **Consultas veiculares** (DETRAN / API Brasil) — dados por placa (auto-preenche cadastro) e débitos/restrições; camada de provedor desacoplada com modo simulado quando sem tokens
- **Validação de CPF/CNPJ** — validação algorítmica local (offline) dos dígitos + consulta cadastral opcional (nome/razão social, situação) via mesma camada de integração

## Alertas automáticos (cron)
O backend agenda (via `@nestjs/schedule`) um job **diário às 8h** que dispara os alertas de
estoque parado (+60 dias), documentos pendentes e parcelas a vencer/vencidas — sem intervenção.
Controle com `ALERTAS_CRON_ENABLED` (`true`/`false`). Disparo manual continua disponível em
`POST /api/notificacoes/verificar-estoque|verificar-documentos|verificar-parcelas`.

## Backup (RF infra)
Script em `backend/scripts/backup.sh` (pg_dump comprimido, retenção de 90 dias).
Agende via cron — exemplo no cabeçalho do script.

## Deploy
O banco fica no **Supabase** (externo). Há Dockerfiles para backend e frontend.

### Opção A — Docker Compose (servidor/VPS)
```bash
# 1. Configure backend/.env (DATABASE_URL, DIRECT_URL do Supabase, JWT, tokens...)
# 2. Defina as URLs públicas (build do frontend embute a URL da API):
export VITE_API_URL="https://api.seu-dominio.com/api"
export CORS_ORIGIN="https://app.seu-dominio.com"

docker compose up -d --build
# frontend → http://localhost:8080   |   backend → http://localhost:3000/api
```
O container do backend roda `prisma migrate deploy` automaticamente na subida.

### Opção B — Railway / Render (PaaS)
- **Backend:** novo serviço a partir de `backend/` (usa o `Dockerfile`). Variáveis: `DATABASE_URL`,
  `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` (= URL do frontend), e os tokens
  (`DATAFY_*`, `CONSULTARPLACA_*`, etc.). O start já aplica as migrations.
- **Frontend:** serviço estático a partir de `frontend/` (Dockerfile nginx) com build arg
  `VITE_API_URL` = URL pública do backend.

### Checklist de produção
- [ ] `CORS_ORIGIN` = domínio exato do frontend (senão o navegador bloqueia a API)
- [ ] `VITE_API_URL` = domínio público do backend (embutido no build do front)
- [ ] Segredos fortes em `JWT_SECRET` / `JWT_REFRESH_SECRET`
- [ ] Tokens de integração configurados (ou ausentes = modo simulado)
- [ ] HTTPS na frente (proxy/Load Balancer do provedor)

## Ainda fora de escopo (PRD)
Multi-filial (Fase 2) e itens da seção "Fora de Escopo" do PRD (NF-e, integração DETRAN, etc.).
