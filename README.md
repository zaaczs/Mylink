# MyLink MVP (Instagram Comment -> DM)

MVP inspirado no Manychat para automação de envio de links via Direct com base em palavras-chave em comentários.

## Stack
- Frontend: Next.js + Tailwind + Zustand
- Backend: NestJS + Prisma + BullMQ
- Banco: SQLite (MVP local)
- Fila: processamento inline (BullMQ + Redis opcional)

## Subir ambiente
1. `npm install`
2. Copie `apps/api/.env.example` para `apps/api/.env` e preencha `JWT_SECRET`, `META_APP_ID` e `META_APP_SECRET` se for usar OAuth.
3. `npm run prisma:generate`
4. `npm run prisma:migrate`
5. `npm run dev:api` (terminal 1)
6. `npm run dev:web` (terminal 2)

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
