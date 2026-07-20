# Yevra

A psychology-themed apparel and accessories store. Print-on-demand via Printify, payments via Stripe, backed by Supabase (Postgres + RLS + Storage). Built with Next.js 16 (App Router).

Each product carries a short, emotionally-resonant phrase or word ("Becoming", "Settled", "Enough", "Worth The Work") rather than a graphic design — the store's whole positioning leans on that.

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions) — note: this is a pre-release/newer major version with real breaking changes from what you may know as "standard" Next.js. Read `node_modules/next/dist/docs/` before assuming an API works the way it used to.
- **Supabase** — Postgres database with Row Level Security, Auth, and Storage (return-photo uploads).
- **Printify** — the actual manufacturer/fulfillment partner. Products, variants, and orders are synced/created via their REST API.
- **Stripe** — Checkout Sessions for payment, webhooks to mark orders paid, refunds for the returns flow.
- **Tailwind CSS v4** — a deliberately small design-token set (`ink` / `paper` / `accent` / `line` / `muted` / `surface`). No ad-hoc colors.
- **Zod** — server-side validation in every Server Action, per Next's own recommended pattern.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build (also runs typecheck)
npm run lint    # eslint
```

## Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-scoped client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — bypasses RLS. Used only in `createAdminClient()` for webhooks/sync/admin actions, never client-facing. |
| `SUPABASE_ACCESS_TOKEN` | Supabase **Management API** token — used only for one-off read-only schema inspection during development, never at runtime. |
| `ADMIN_EMAIL` | The one account allowed into `/admin`. Fail-closed: if unset, nobody gets in, including the real admin. |
| `PRINTIFY_API_TOKEN` | Printify API token. Needs scopes for products/orders; the catalog shipping lookup additionally needs `Catalog: Read`. |
| `PRINTIFY_SHOP_ID` | The Printify shop this store syncs against. |
| `PRINTIFY_SYNC_SECRET` | Shared secret protecting `/api/printify/sync`. |
| `STRIPE_SECRET_KEY` | Stripe API key (test or live). |
| `STRIPE_WEBHOOK_SECRET` | Verifies signatures on `/api/stripe/webhook`. |
| `SITE_URL` | This site's own public URL — used for Stripe redirect URLs and the Printify `publishing_succeeded` handle. |

## Database

**There are no local migration files.** The schema lives directly in the Supabase project. Schema-changing SQL is written out for the project owner to run themselves in the Supabase SQL Editor — nothing here executes DDL automatically. `src/utils/supabase/database.types.ts` is hand-maintained to match.

Core tables: `products` / `product_variants` (synced from Printify), `orders` / `order_items` (created at checkout, `payment_status` unpaid→paid→[partially_]refunded, `fulfillment_status` unfulfilled→fulfilling→shipped→delivered/cancelled), `return_requests` (customer defect/return claims), `profiles`, `collections`.

## How the pieces fit together

- **Catalog** (`src/app/catalog/[category]`, `src/lib/products-data.ts`) reads products straight from Supabase in Server Components — no client-side data fetching for browsing.
- **Printify sync** (`src/utils/printify/sync.ts`, triggered via `/api/printify/sync`) pulls the shop's products/variants into Supabase, archives products removed on Printify's side, and releases Printify's "publishing" lock.
- **Checkout** (`src/app/actions/checkout.ts`) creates an `unpaid` order server-side (never trusts client-submitted prices), then a Stripe Checkout Session.
- **Fulfillment** (`src/app/api/stripe/webhook/route.ts`) — on `checkout.session.completed`, marks the order paid and automatically places the matching order with Printify via `createOrder()`.
- **Returns** (`src/app/actions/returns.ts`, `src/app/actions/admin-returns.ts`, `/admin/return-requests`) — customer reports a defect with a required photo; the (single) admin manually resolves it as Reprint / Refund / Reject. Reprint is a decision + note only — it does **not** auto-create a paid Printify order, since a real Printify-fault defect should go through Printify's own claims process instead.
- **Admin** (`/admin`, gated by `src/lib/require-admin.ts`) — order list with Active/Closed/With-issue filters, and the returns queue. Single hardcoded admin via `ADMIN_EMAIL`, not a roles system.
- **Search** (`/api/search`, `src/components/SearchOverlay`) — plain substring match over the active catalog; no search index, proportionate to an ~11-product store.

## Known gaps

Not yet done, in rough priority order: production deployment (still localhost-only), Printify fulfillment webhooks (needed for `fulfillment_status` to ever reach `shipped`/`delivered` — nothing currently advances it past `fulfilling`), transactional emails (none are sent at all), Privacy Policy / Terms of Service pages, several footer links with no page behind them yet (FAQ, Size Guide, Contact Us, About, Careers, Sustainability).
