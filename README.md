# AI E-Commerce Automation & Recommendation System

Full implementation of the proposal: Express/Prisma/PostgreSQL backend +
Next.js storefront, integrated with **OpenClaw** (AI shopping assistant) and
**n8n** (workflow automation).

```
ecommerce-ai/
  backend/    Express + Prisma + PostgreSQL API   (see backend/README.md)
  frontend/   Next.js storefront                   (see frontend/README.md)
```

## Run order

1. **Backend first** — set up `.env`, run migrations, seed data, `npm run dev`
   (defaults to `http://localhost:4000`). Full steps in `backend/README.md`.
2. **Frontend** — set `NEXT_PUBLIC_API_URL` to point at the backend, `npm run dev`
   (defaults to `http://localhost:3000`). Full steps in `frontend/README.md`.

## What's built so far

- Auth (register/login/JWT) with required email verification — registration sends
  a verification link (via n8n) and login is blocked (403 `EMAIL_NOT_VERIFIED`)
  until the link is clicked; `/api/auth/resend-verification` covers expired/lost
  links. Product catalog, cart, checkout with transactional stock decrement,
  order history.
- AI shopping assistant chat (terminal-style panel), backed by `OPENCLAW_*` env
  vars in the backend — currently stubbed against a generic chat-completions
  shape; swap in OpenClaw's real request/response format once you have their docs.
- n8n integration points: outbound webhook triggers (order confirmation, shipping
  updates, low-stock alerts, feedback requests) and inbound polling endpoints
  (abandoned carts, low stock) secured with a shared secret.
- Recommendation engine based on browsing/purchase behavior (`BrowsingEvent` table).
- Product reviews (create/update/delete, one per user per product) and
  favorites (add/list/remove) — `/api/reviews`, `/api/products/:id/reviews`,
  `/api/favorites`.

## Not yet built

- Actual n8n workflows (the webhook *endpoints* exist, including
  `email-verification`; the workflows themselves need to be built in the n8n editor)
- Payment provider integration (Stripe etc.) — checkout currently records the
  order and decrements stock, no real payment capture yet
- Category edit/delete (create-only today), admin overview/stats page,
  multi-image product editing, and review moderation in the admin dashboard

## Admin dashboard

Full admin UI at `/admin` (role-gated): product CRUD, category create+list,
and order list with status updates — all wired to the real API, not a stub.
