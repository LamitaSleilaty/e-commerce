# AI E-Commerce Automation & Recommendation System

An e-commerce platform with AI-powered product recommendations, a shopping
assistant, and automated order/inventory notifications.

## Stack

- **Frontend:** Next.js 14 (App Router, TypeScript), Tailwind CSS
- **Backend:** Express + Prisma ORM (PostgreSQL)
- **AI:** OpenClaw (recommendations + shopping assistant)
- **Automation:** n8n (order confirmation emails, low-stock alerts, abandoned-cart reminders)
- **Email:** Gmail API
- **Deployment:** Azure App Service (backend + frontend), via GitHub Actions

## Project structure

```
backend/    Express API, Prisma schema, seed script, Jest tests
frontend/   Next.js app
.github/    GitHub Actions deploy workflows
```

## Prerequisites

- Node.js 18+ (developed against Node 22)
- A PostgreSQL database (the project uses [Neon](https://neon.tech), but any Postgres works)
- (Optional, for full functionality) a running n8n instance, an OpenClaw-compatible
  chat completions endpoint, and a Google Cloud OAuth client for Gmail sending

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PORT` | defaults to `4000` |
| `CLIENT_URL` | frontend origin, e.g. `http://localhost:3000` — required for CORS |
| `JWT_SECRET` | any long random string |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | credentials the seed script creates the admin account with |
| `OPENCLAW_API_URL` / `OPENCLAW_API_KEY` / `OPENCLAW_MODEL` | your OpenClaw (or any OpenAI-compatible) chat completions endpoint |
| `N8N_WEBHOOK_BASE_URL` / `N8N_API_KEY` | your n8n instance's webhook base URL and shared secret |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` / `GMAIL_SENDER_EMAIL` | Gmail API credentials for sending verification/order emails |

Set up the database and seed data:

```bash
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
```

The seed script requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` to already be set in
`.env` — it creates (or updates) the admin account with those credentials and
seeds categories/products with placeholder images.

Run the backend:

```bash
npm run dev       # nodemon, auto-restarts on changes
# or
npm start
```

Health check: `GET http://localhost:4000/health`

### Tests

```bash
npm test
```

Tests use Jest + Supertest with Prisma mocked (see `backend/tests/mocks/prisma.js`)
— they don't touch a real database. Coverage focuses on checkout math (subtotal/
tax/shipping/total, the stock-race guard) and the per-user ownership checks on
cart items, addresses, and AI conversations.

## Frontend setup

```bash
cd frontend
npm install
```

Optionally create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

(This is also the default if the variable is unset, so it's only needed if your
backend runs somewhere other than `localhost:4000`.)

Run it:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Running n8n and OpenClaw locally (optional)

The app degrades gracefully without these — checkout, cart, and browsing all
work; you just won't get AI replies or automated emails/notifications.

- **n8n:** run any n8n instance (Docker, local install, or n8n Cloud) and create
  workflows listening on the webhook paths the backend calls: `order-confirmation`,
  `shipping-update`, `low-stock-alert`, `abandoned-cart`, `feedback-request`,
  `promotional-offer` (see `backend/src/services/n8nService.js`). Point
  `N8N_WEBHOOK_BASE_URL` at your instance and set a shared secret as `N8N_API_KEY`
  (sent as the `X-N8N-Signature` header, checked in `backend/src/routes/webhookRoutes.js`).
- **OpenClaw:** point `OPENCLAW_API_URL` at any OpenAI-compatible chat completions
  endpoint.
- **Gmail sending:** run `node backend/scripts/get-gmail-refresh-token.js` after
  setting `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `.env` — it walks you through
  the OAuth consent flow and prints the refresh token to put in `GOOGLE_REFRESH_TOKEN`.

## Deployment

Pushing to `main` triggers two GitHub Actions workflows
(`.github/workflows/main_talamita.yml` for the backend,
`main_talamitafrontennd.yml` for the frontend), which deploy pre-built app
packages to Azure App Service. Environment variables (`DATABASE_URL`,
`ADMIN_EMAIL`/`ADMIN_PASSWORD`, `JWT_SECRET`, etc.) must be configured directly
in each App Service's Configuration settings — they aren't read from `.env`
files in production.

