# AI E-Commerce Automation & Recommendation System — Backend

Express + Prisma + PostgreSQL API, integrated with **OpenClaw** (AI shopping assistant)
and **n8n** (workflow automation).

## Stack
- Node.js / Express
- Prisma ORM + PostgreSQL
- JWT auth (bcrypt password hashing)
- Zod for request validation

## Setup

```bash
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, OPENCLAW_*, N8N_*
npm install
npx prisma migrate dev --name init   # then run: npx prisma generate
npm run prisma:seed         # optional sample data (admin@shop.com / Admin123!)
npm run dev                 # starts on http://localhost:4000
```

> **Prisma 7 note**: this project uses Prisma ORM v7, which moved the database
> connection string out of `schema.prisma` and into `prisma.config.ts` (root of
> the backend folder), and now requires an explicit driver adapter
> (`@prisma/adapter-pg`) when constructing `PrismaClient` — see
> `src/config/prisma.js`. Both already read `DATABASE_URL` from your `.env`,
> so you just need `.env` filled in; no extra config needed.
>
> Also note: Prisma 7 no longer runs `prisma generate` automatically after
> `migrate dev` — run it explicitly (the `npm run prisma:migrate` script does
> this for you).

## Project structure

```
src/
  config/prisma.js        # Prisma client singleton
  middleware/auth.js       # JWT auth + role guard
  middleware/errorHandler.js
  controllers/             # request handlers (business logic)
  services/
    openclawService.js     # calls to the OpenClaw AI API
    n8nService.js           # fires n8n webhook workflows
    recommendationService.js
  routes/                  # Express routers, mounted in server.js
  server.js                # app entry point
prisma/
  schema.prisma            # data model
  seed.js
```

## API overview

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register` (sends verification email, no login until verified), `POST /api/auth/login` (403 `EMAIL_NOT_VERIFIED` if unverified), `GET /api/auth/verify-email?token=`, `POST /api/auth/resend-verification`, `GET /api/auth/me` |
| Products | `GET /api/products`, `GET /api/products/:id`, `POST/PUT/DELETE` (admin), `POST /api/products/:id/reviews` |
| Reviews | `PUT/DELETE /api/reviews/:id` (own review only) |
| Favorites | `GET/POST /api/favorites`, `DELETE /api/favorites/:productId` |
| Cart | `GET /api/cart`, `POST /api/cart/items`, `PUT/DELETE /api/cart/items/:id` |
| Orders | `POST /api/orders/checkout`, `GET /api/orders`, `PATCH /api/orders/:id/status` (admin) |
| AI Assistant | `POST /api/ai/chat`, `GET /api/ai/recommendations`, `POST /api/ai/compare`, `POST /api/ai/generate-description` (admin) |
| n8n inbound | `GET /api/webhooks/n8n/abandoned-carts`, `GET /api/webhooks/n8n/low-stock` (secret-protected) |

## How OpenClaw fits in

`src/services/openclawService.js` wraps calls to OpenClaw's chat endpoint for:
- **Shopping assistant chat** (`/api/ai/chat`) — conversation history is stored in
  `AiConversation`/`AiMessage` tables so context persists across messages.
- **Product comparisons** (`/api/ai/compare`).
- **Auto-generated descriptions** for the admin catalog editor.

Personalization signal comes from the `BrowsingEvent`, `Review`, and `Favorite`
tables — recent activity is passed into the assistant's system prompt as `userContext`.

> Once you have OpenClaw's actual API docs, adjust the request/response shape in
> `callOpenClaw()` — this scaffold assumes a Chat-Completions-style JSON API.

## How n8n fits in

The backend delegates most emails/SMS to n8n, in two ways — the one exception is
the account-verification email, which is sent directly via the Gmail API (see
below), since it needs to work standalone before any n8n workflow exists.

1. **Outbound (event-driven)**: after a state change (order placed, status updated,
   stock low), the API calls `n8nService.js`, which POSTs to an n8n Webhook node.
   Example workflows to build in n8n:
   - `order-confirmation` → email w/ order summary
   - `shipping-update` → shipping/delivery notification
   - `low-stock-alert` → Slack/email to admins
   - `feedback-request` → email asking for a review after delivery

2. **Inbound (scheduled/polling)**: n8n's Cron node hits
   `GET /api/webhooks/n8n/abandoned-carts` and `.../low-stock` on a schedule (e.g.
   hourly) to fetch data it can't get via a real-time event, then sends reminder
   emails or promotional campaigns. These routes are protected by a shared secret
   header `X-N8N-Signature` matching `N8N_API_KEY`.

## How email verification sends mail (Gmail API)

`src/services/emailService.js` sends the verification email directly through the
Gmail API (not n8n), authenticated as `GMAIL_SENDER_EMAIL` via OAuth2:

1. Create (or reuse) a Google Cloud project, enable the **Gmail API**, and create
   an OAuth Client ID/Secret (type "Web application").
2. Put `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GMAIL_SENDER_EMAIL`
   (the Gmail address to send from) in `.env`.
3. Run `node scripts/get-gmail-refresh-token.js` once. It prints a Google
   authorization URL — open it, sign in as `GMAIL_SENDER_EMAIL`, approve the
   `gmail.send` scope, and the script prints a `GOOGLE_REFRESH_TOKEN` to add to
   `.env`. (The script's redirect URI, `http://localhost:8945/oauth2callback`,
   must be added to the OAuth client's "Authorized redirect URIs" first.)
4. Restart the backend. If any of the four env vars are missing, sends are
   skipped with a `[email] Gmail API not configured` warning instead of failing
   registration.

## Next steps
- Build the Next.js frontend (storefront + admin dashboard) against this API.
- Add a payment provider integration (Stripe, etc.) in `orderController.checkout`.
- Add image upload handling (multer is already a dependency) for product images.
- Wire up the actual n8n workflows in the n8n editor using the webhook paths above.
