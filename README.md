# MyLink MVP (Instagram Comment -> DM)

MVP inspirado no Manychat para automação de envio de links via Direct com base em palavras-chave em comentários.

## Stack
- Frontend: Next.js + Tailwind + Zustand
- Backend: NestJS + Prisma + BullMQ
- Banco: PostgreSQL (Supabase ou outro host; `DATABASE_URL` no `apps/api/.env` e na Vercel)
- Fila: processamento inline (BullMQ + Redis opcional)

## Subir ambiente
1. `npm install`
2. No Supabase: **Project Settings → Database → Connection string (URI)**. Copie `apps/api/.env.example` para `apps/api/.env` e defina `DATABASE_URL` (substitua `[YOUR-PASSWORD]`). Para Prisma/migrações, use em geral a **ligação direta** (porta `5432`); pooler (`6543`) é opcional para runtime na Vercel.
3. Preencha `JWT_SECRET`, `META_APP_ID` e `META_APP_SECRET` se for usar OAuth.
4. `npm run prisma:generate`
5. `npm run prisma:deploy` (aplica migrações na base remota) ou `npm run prisma:migrate` ao alterar o schema.
6. `npm run dev:api` (terminal 1)
7. `npm run dev:web` (terminal 2)

Na **Vercel**, defina a mesma `DATABASE_URL` em **Environment Variables** (o build da API corre `prisma migrate deploy`).

## Login (teste)
1. Abra http://localhost:3000/login
2. Use **Cadastro** com e-mail e senha (mín. 6 caracteres) ou **Login** se já existir conta.
3. Se aparecer erro de rede no login, crie `apps/web/.env.local` com `NEXT_PUBLIC_API_URL=http://localhost:3333` e reinicie o `dev:web`.
4. Em **Integrações**, salve o token da Meta (manual) ou use **Abrir login Meta** (OAuth com redirect `META_REDIRECT_URI`).
5. Em **Automações**, busque posts e salve a automação (usa o token salvo do seu usuário).

## URLs
- Web: http://localhost:3000
- API: http://localhost:3333

## Fluxo MVP
- 1 conta Instagram Business
- 1 automação ativa por vez
- webhook recebe comentário
- valida palavra-chave
- responde comentário e envia DM
- registra log de execução

## Observações Meta
- Use somente API oficial Graph
- Configure webhook e permissões no app Meta
- Em ambiente local, use ngrok/cloudflared para webhook público

## Deploy automático no commit (Vercel)
Para garantir que **API e Web** atualizem automaticamente no push da `main`, este repositório inclui o workflow:
- `.github/workflows/deploy-vercel.yml`

### Como configurar (uma vez)
1. Em cada projeto na Vercel (`mylink-api` e `mylink-web`), crie um **Deploy Hook** para Production.
2. No GitHub do repositório, abra **Settings -> Secrets and variables -> Actions** e adicione:
   - `VERCEL_DEPLOY_HOOK_API`
   - `VERCEL_DEPLOY_HOOK_WEB`
3. Faça push para `main`.

Pronto: a cada commit na `main`, o GitHub Actions dispara deploy dos dois projetos.
