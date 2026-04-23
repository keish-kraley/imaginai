# ImaginAI — Astra

Aplicação web full-stack que permite aos idealizadores da Astra descreverem em
linguagem natural ideias de itens para casa ou construção civil e receberem
imagens geradas por IA. As ideias aprovadas pelo idealizador (👍) são enviadas
por e-mail para o time da Astra avaliar.

## Stack

- **Next.js 16** (App Router, TypeScript) – web + API Routes
- **Tailwind CSS v4** + shadcn-style components
- **Prisma** + **PostgreSQL** (Cloud SQL em produção, Docker Compose em dev)
- **NextAuth v5** (Credentials + Google OAuth)
- **Google Cloud Vertex AI** (`gemini-2.5-flash` para texto e
  `gemini-2.5-flash-image`, o "Nano Banana", para imagens)
- **Google Cloud Storage** com signed URLs de 7 dias
- **Nodemailer** para envio de e-mails ao ADM
- **Vitest** + **Playwright** para testes

## Executar localmente

```bash
pnpm install
cp .env.example .env            # preencha as variáveis
docker compose up -d db         # sobe só o Postgres
pnpm prisma migrate deploy
pnpm prisma db seed             # admin@astra.com / admin123456
pnpm dev                        # http://localhost:3000
```

Se preferir rodar tudo em container:

```bash
docker compose up --build
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | String de conexão Postgres. |
| `AUTH_SECRET` | sim | Segredo do NextAuth (use `openssl rand -base64 32`). |
| `NEXTAUTH_URL` / `APP_URL` | sim | URL pública da app. |
| `ADMIN_EMAIL` | sim | Recebe as ideias aprovadas. |
| `CONTACT_EMAIL` | sim | Recebe mensagens do formulário de contato. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | em prod | Servidor SMTP (SendGrid / Gmail / SES etc.). |
| `GCP_PROJECT_ID`, `GCP_LOCATION`, `GCS_BUCKET_NAME` | em prod | Projeto/região/bucket para Vertex AI + GCS. |
| `GOOGLE_APPLICATION_CREDENTIALS` **ou** `GOOGLE_SERVICE_ACCOUNT_JSON` | em prod | Caminho do arquivo ou JSON inline da Service Account. |
| `VERTEX_TEXT_MODEL` | — | Default `gemini-2.5-flash`. |
| `VERTEX_IMAGE_MODEL` | — | Default `gemini-2.5-flash-image`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | opcional | Habilita "Entrar com Google". |
| `CHAT_RATE_LIMIT_PER_MINUTE` | — | Default 30. |
| `GCS_SIGNED_URL_EXPIRATION_DAYS` | — | Default 7. |

Sem as credenciais do GCP a app sobe, mas o chat recusa geração real de
imagens — os botões ficam ativos, mas a rota `/api/chat/send` retorna erro
explicando o que precisa ser configurado.

## Configurando o GCP

1. Crie um projeto no Google Cloud e habilite as APIs:
   - Vertex AI API (`aiplatform.googleapis.com`)
   - Cloud Storage (`storage.googleapis.com`)
   - Cloud SQL Admin (se for usar Cloud SQL gerenciado)
2. Crie um bucket privado no Cloud Storage (region `us-central1` por padrão).
3. Crie uma Service Account com as roles:
   - `roles/aiplatform.user`
   - `roles/storage.objectAdmin` no bucket
4. Baixe a chave JSON e guarde como segredo (`GOOGLE_SERVICE_ACCOUNT_JSON`) ou
   monte em `GOOGLE_APPLICATION_CREDENTIALS`.

## Configurando Google OAuth

1. No console: **APIs & Services → Credentials → OAuth client ID → Web app**.
2. Authorized redirect URI: `https://<seu-domínio>/api/auth/callback/google`.
3. Preencha `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`.

## Configurando SMTP

Exemplo com SendGrid:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=<sua-api-key>
SMTP_FROM="ImaginAI <no-reply@astra-sa.com>"
```

## Deploy no Cloud Run

O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
constrói a imagem via Dockerfile e publica no Cloud Run. Configure estas
**GitHub Variables** (em Settings → Variables):

- `GCP_PROJECT_ID`, `GCP_REGION`, `ARTIFACT_REPO`, `CLOUD_RUN_SERVICE`, `APP_URL`

E estes **GitHub Secrets**:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`

Os segredos de runtime (DB, SMTP, SA key etc.) ficam no **Secret Manager** do
GCP e são injetados via `--set-secrets` no deploy.

## Testes

```bash
pnpm test            # vitest (unitários)
pnpm test:e2e        # playwright (requer dev rodando)
```

## Scripts úteis

- `pnpm dev` — servidor Next.js
- `pnpm build` — build de produção
- `pnpm lint` — ESLint
- `pnpm prisma studio` — inspecionar o banco
- `pnpm prisma migrate dev --name <nome>` — nova migração

## Estrutura

```
src/
  app/              # App Router (páginas + API Routes)
  components/       # UI + chat + admin + site + auth
  lib/              # prisma, env, vertex, gcs, email, scope, ratelimit
  auth.ts           # NextAuth config
  proxy.ts          # proteção de rotas (substitui middleware.ts no Next 16)
prisma/
  schema.prisma
  seed.ts
tests/
  unit/
```

## LGPD & Segurança

- Aceite obrigatório de Termos/LGPD no cadastro.
- `POST /api/user/delete-account` implementa o direito ao esquecimento.
- Rate limit de 30 msg/min por usuário.
- Senhas com bcrypt (cost 12).
- URLs do GCS são signed com expiração configurável.
