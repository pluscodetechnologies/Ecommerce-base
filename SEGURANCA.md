# Segurança — Implementação completa

Este documento resume **todas as mudanças** aplicadas no projeto Velvet Store nesta rodada de segurança, com instruções de deploy e o que ficou pendente.

---

## ⚠️ AÇÕES IMEDIATAS ANTES DE SUBIR

O `.env` original veio no zip com chaves reais. **Considere todas comprometidas.**

| Variável             | Onde rotacionar |
|----------------------|-----------------|
| `JWT_SECRET`         | Gere novo: `openssl rand -hex 64` |
| `MP_ACCESS_TOKEN`    | Painel MP → app → "Credenciais de produção" → revogar e gerar nova |
| `MP_PUBLIC_KEY`      | Mesma tela acima |
| `MELHOR_ENVIO_TOKEN` | Painel Melhor Envio → Tokens → revogar e gerar novo |
| `RESEND_API_KEY`     | https://resend.com/api-keys → delete a antiga, crie uma nova |
| `DB_PASSWORD`        | `ALTER USER ... IDENTIFIED BY '...'` no MySQL + atualizar `.env` |

**Também:**
1. Rode a migration `database/migrations/008_security.sql` antes de iniciar o servidor novo.
2. Configure o webhook do Mercado Pago e cole o secret em `MP_WEBHOOK_SECRET`.
3. Confira que o `.env` está no `.gitignore`.

---

## Resumo de mudanças

### 1. Autenticação — JWT em duas peças

Antes: 1 token JWT com validade de 30 dias, fallback `JWT_SECRET='secret-key'` se a env não estava setada.

Agora:
- **Access token** (15 min): JWT curto, vai no header `Authorization: Bearer`.
- **Refresh token** (7 dias): string aleatória de 64 bytes, vai em cookie httpOnly (`/api/auth`, `sameSite=lax`, `secure` em prod). Guardamos só o hash SHA-256 no banco.
- **Rotação**: cada chamada a `/api/auth/refresh` invalida o token antigo e emite um novo. Reuso de um token revogado dispara revogação de toda a sessão do usuário (sinal de comprometimento).
- **Invalidação por troca de senha**: `users.token_version` é incrementado a cada change/reset password — qualquer token antigo é rejeitado pelo `authMiddleware`.
- **JWT_SECRET é obrigatório no boot** (mínimo 32 caracteres). Sem isso, o servidor não sobe.

### 2. Bloqueio de força bruta

- **Rate limit por IP** (`express-rate-limit`) nos endpoints sensíveis: login (10/10min), register (5/h), forgot/reset password (3 e 5/h), refresh (30/h), api global (300/15min).
- **Lockout por email** adicional: 5 falhas em 15min → 30min bloqueado. Cobre caso onde atacante usa botnet (1 tentativa por IP, fugindo do rate limit por IP).

### 3. Validação de entrada (Zod)

Todos os endpoints que recebem body agora têm schema Zod:
- `register`, `login`, `forgot-password`, `reset-password`, `change-password`, `update-profile`, `update-email`, `social-login`, `refresh`
- `cart/add`, `cart/item/:id`
- `checkout/order`, `checkout/shipping`, `coupons/validate`
- `reviews` (create)

Erro de validação retorna 400 com `{ success: false, errors: [{field, message}] }`. O frontend já trata esse formato em login, register, checkout, forgot-password e admin login.

### 4. Webhook Mercado Pago com HMAC

Antes: qualquer um podia chamar `/api/checkout/webhook` e marcar pedido como pago.

Agora:
- Body chega como **raw Buffer** (`express.raw()`) — necessário pra HMAC validar bit a bit.
- Validamos o header `x-signature` com SHA-256 sobre o manifesto `id:{dataId};request-id:{xRequestId};ts:{ts};` usando `MP_WEBHOOK_SECRET`.
- `crypto.timingSafeEqual` evita timing attacks na comparação do hash.
- Anti-replay: rejeita timestamp com mais de 5 minutos de diferença.
- **Idempotência**: não devolve estoque duas vezes se o webhook cair para o mesmo pedido cancelado mais de uma vez.

Em produção, sem `MP_WEBHOOK_SECRET` o webhook é **rejeitado**. Em desenvolvimento passa com aviso no console.

### 5. Ownership e autorização

- `/api/orders/:id` agora exige que o pedido pertença ao usuário logado (admin tem bypass).
- `/api/checkout/order` pega `userId` **do JWT, nunca do body** — antes o cliente podia mandar `userId` arbitrário.
- `/api/reviews/:productId` (POST) só aceita avaliação de quem comprou.
- `/api/reviews/:id` (DELETE) só admin.
- Helper `requireOwnership(db, table, id, userId, ownerColumn)` em `middleware/auth.js` pra padronizar.

### 6. Carrinho + checkout robustos

- **Preço autoritativo**: o controller sempre recalcula subtotal a partir do banco — o cliente não consegue mandar `total_amount` falso.
- **Cupom revalidado server-side**: data de expiração, limite de usos, uso por usuário, "first purchase" — tudo conferido de novo, mesmo que o cliente diga "já validou".
- **Cap de frete**: limite máximo absoluto de R$ 1.000 no `shippingCost` (defesa contra cliente mandar valor absurdo).
- **Desconto nunca maior que subtotal** (evitava total negativo).
- **Snapshot de preço em `order_items`**: o preço congela no momento do pedido.

### 7. CORS restrito e cookies seguros

- CORS lê `CORS_ORIGINS` do `.env` (lista separada por vírgula). Em produção, sem origens configuradas, bloqueia tudo.
- `credentials: true` permitido — necessário pro cookie httpOnly do refresh token funcionar cross-origin.
- Cookie do refresh: `httpOnly`, `sameSite=lax`, `secure` em prod, escopo `/api/auth` (não vaza pra rotas estáticas).

### 8. CSP com Helmet

CSP completo configurado em `helmet()`:
- `defaultSrc: 'self'`
- `frameAncestors: 'self'` — anti-clickjacking
- Allowlist explícita pra Mercado Pago, Google OAuth, Facebook SDK, Cloudflare CDN, Google Fonts.
- `'unsafe-inline'` em script ainda está lá porque há JS inline nos HTMLs. **Quando migrar pra scripts externos, remova.**

### 9. Outros

- **Bcrypt rounds** subiu de 10 → 12.
- **Resposta de login genérica**: "Email ou senha incorretos" tanto pra email inexistente quanto pra senha errada (evita user enumeration).
- **Resposta de forgot-password genérica**: "Se o email existir, você receberá um link" — independente do email existir ou não.
- **Body parsers com limite de 1MB** (anti-DoS por payload gigante).
- **Cache-Control: no-store** em todas as rotas `/api` (dados sensíveis não cacheiam).
- **Error handler em produção NÃO vaza stack trace** pro cliente.
- **socialLogin corrigido**: usuários de social agora têm `password = NULL` (antes era `''` — risco se alguém tentasse bcrypt em string vazia). Atacante não pode fazer takeover de conta local via Google com o mesmo email.
- **updateEmail agora exige senha** (reautenticação).
- **changePassword revoga todos os refresh tokens** e gera um novo pro dispositivo atual.
- **Job de limpeza** roda a cada 24h removendo refresh tokens expirados e tentativas de login com mais de 7 dias.

---

## Arquivos novos / modificados

```
database/migrations/
└── 008_security.sql                     [NOVO]

server/
├── index.js                              [REFEITO]
├── middleware/
│   ├── auth.js                           [REFEITO]
│   ├── validate.js                       [NOVO]
│   └── rateLimits.js                     [NOVO]
├── controllers/
│   ├── authController.js                 [REFEITO]
│   └── checkoutController.js             [REFEITO]
├── routes/
│   ├── auth.js                           [REFEITO]
│   ├── cart.js                           [REFEITO]
│   ├── checkout.js                       [REFEITO]
│   ├── orders.js                         [REFEITO]
│   ├── wishlist.js                       [REFEITO]
│   └── reviews.js                        [REFEITO]
├── schemas/
│   ├── auth.schema.js                    [NOVO]
│   └── checkout.schema.js                [NOVO]
├── services/
│   ├── refreshTokenService.js            [NOVO]
│   └── loginAttemptService.js            [NOVO]
└── models/
    └── User.js                           [REFEITO]

client/
├── public/js/
│   └── auth.js                           [REFEITO — refresh automático]
└── views/
    ├── login.html                        [EDITADO — credentials/erros]
    ├── checkout.html                     [EDITADO — credentials/erros]
    └── admin/login.html                  [EDITADO — credentials/erros]

.env.example                              [NOVO — documenta tudo]
```

---

## Como aplicar

```bash
# 1) Backup do que existe
cp -r server server.backup

# 2) Substituir os arquivos pelos novos
#    (copie a estrutura de /home/claude/output/ por cima do projeto)

# 3) Variáveis de ambiente novas
cat >> .env <<EOF
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
MP_WEBHOOK_SECRET=cole_aqui
CORS_ORIGINS=http://localhost:3000,https://seu-dominio.com
EOF
# Não esqueça de rotacionar TODAS as outras chaves também (ver topo deste doc).

# 4) Aplicar migration
mysql -u root -p velvet_store < database/migrations/008_security.sql

# 5) (Re)instalar dependências — já estavam no package.json
npm install

# 6) Subir
npm start
```

---

## Pendências / próximas iterações

Estes itens estavam no doc original mas **NÃO foram implementados nesta rodada** (fora do escopo da pergunta):

- **2FA / TOTP** — sugestão: lib `speakeasy` + QR via `qrcode`. Requer fluxo de UI e tabela `user_2fa` (secret, recovery codes, enabled_at).
- **Validação server-side do `id_token` do Google** no social login — TODO marcado no `authController.socialLogin`. Sem isso, qualquer um pode fingir login social mandando email/provider_id arbitrários. Doc: https://developers.google.com/identity/sign-in/web/backend-auth
- **Token em cookie httpOnly em vez de localStorage** — mitigação atual é o CSP rigoroso. Migrar exigiria mover o access token também pra cookie e implementar CSRF token (sameSite=strict ou double-submit). Operação grande pra outra hora.
- **HTTPS** — responsabilidade de deploy (Cloudflare, Caddy, nginx + Let's Encrypt). Em produção, `secure: true` nos cookies só funciona com HTTPS.
- **2FA admin** — caso queira proteger ainda mais o painel admin, vale habilitar 2FA obrigatório só pra `role=admin`.
- **Logs de auditoria** — tabela `audit_log` com {user_id, action, ip, ua, at} para mudança de senha/email/role.
- **Sanitização de HTML** em campos livres (review.comment, etc.) — atualmente confiamos no escape de saída, mas DOMPurify no front + sanitização no back daria defesa em profundidade.
- **Frontend account.html** — ainda usa o padrão antigo. Quando o usuário trocar senha/email pela tela de conta, vale ajustar pra tratar `errors[]` do Zod igual o login/register.

---

## Comportamento esperado depois de subir

- **Login válido**: recebe access token (15 min) + cookie `refreshToken` (httpOnly, 7d).
- **Sessão expira**: o `auth.js` do front faz refresh automático em silêncio quando recebe 401. Usuário nem percebe.
- **Senha errada 5x em 15min**: lockout do email por 30min, com mensagem clara.
- **Troca de senha**: derruba todas as outras sessões; mantém a atual.
- **Logout em todos os dispositivos**: chama `/api/auth/logout-all`, incrementa `token_version`, invalida tudo.
- **Webhook MP**: só aceita com assinatura válida. Em dev sem secret, aceita com warning no console.
- **Pedido alheio**: tentar `GET /api/orders/999` (id de outro usuário) → 403.

Qualquer regressão, comece o debug por:
1. Está rodando atrás de proxy? `app.set('trust proxy', 1)` precisa estar correto.
2. Cookie do refresh não chega? Confira `CORS_ORIGINS` e `credentials: 'include'` no fetch.
3. Tudo dá 401? `JWT_SECRET` mudou — todos os tokens antigos viraram inválidos (intencional).
