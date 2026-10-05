<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Nombokin — Agent Notes

Next.js 16 full-stack invoice & quotation app with Midtrans Snap payments (QRIS/VA).
No separate BE/FE: UI in `src/app` + `src/components`; backend in `src/app/api/**`, `src/server`, `src/lib`; DB via `prisma/schema.prisma` (PostgreSQL) + Redis cache.

## Commands

- Dev: `npm run dev` (port 3000, needs local Postgres + Redis + `.env`)
- Prod build: `npm run build`, then `npm run start`
- DB: `npm run db:push` (sync schema), `npm run db:studio`, `npm run db:seed`
- Typecheck: `npx tsc --noEmit` (must pass before deploy/commit)

## Conventions (strict)

- No `alert()`/`confirm()` — use toast (`src/components/ui/toast.tsx`) + confirm-dialog.
- Product success/error messages in English; static UI text and `console.*` in Indonesian.
- Next 16 uses `src/proxy.ts` for route guarding (not `middleware.ts`); route group `(app)` for authed pages.
- **Every paid-tier feature MUST be enforced server-side, never UI-only.** Use `requireTier` / `requireRole` from `src/lib/guards.ts` (401/403 standar) — never hand-rolled tier checks. Gating points live in: `src/server/services/invoiceService.ts` (quota), `payment-link` + `upload/logo` routes, `updateCompanyAction`, PDF template (`tier === "FREE"` → watermark), `src/app/api/reports/*` (BUSINESS), `src/app/api/team/*` (OWNER + BUSINESS).
- Service-layer rule: route = validasi ringan + gate + delegasi; aturan bisnis di `src/server/services/` (contoh pola: `reportService.ts`, `confirmMidtransOrder()` di `paymentService.ts`).
- Pricing lives only in `src/lib/pricing.ts` — never hardcode amounts elsewhere.
- Team rules: BISNIS flat max 5 members (`src/lib/team.ts`); invite link 7 hari sekali pakai tanpa email; billing mutations OWNER/ADMIN only; role changes apply after re-login (role is in JWT).
- Downgrade (non-OWNER suspend): `handleTenantDowngrade()` in `src/server/services/subscriptionService.ts`; ADMIN exempt (keputusan produk); restore only on BUSINESS re-upgrade; suspended login/refresh → 403; sweeper via `GET /api/cron/subscriptions` (Bearer CRON_SECRET). Downgrade route OWNER+ADMIN (pengecualian keputusan produk — UI hanya untuk OWNER).
- JANGAN pakai `redirect()` / `permanentRedirect()` / `notFound()` gaya-fungsi dari `next/navigation` di Server Component (terbukti diam mengembalikan 200 di app ini, dev maupun prod). Redirect server-side hanya via `proxy.ts` / `NextResponse.redirect`.
- Commit style: `feat:` / `fix:` one concern per commit; split shared-file hunks instead of mixing.

## Key behaviors (don't break)

- Auth: 60-min JWT access + 7-day single rotating refresh token (new login kicks old session on refresh). Cookie `secure` follows `NEXT_PUBLIC_APP_URL` scheme — required for HTTP deployments.
- Subscription activation has TWO idempotent paths sharing `handlePaidSubscriptionOrder()`: Midtrans webhook (`/api/midtrans/webhook`, needs public HTTPS URL configured in dashboard) and fallback `POST /api/billing/confirm` (polls Midtrans status; used by settings page after Snap success).
- FREE quota = 5 invoices/month counted at creation (including deleted). Invoice edit only when DRAFT. Payment links for INVOICE type only.
- Tiers: FREE / PRO / BUSINESS. BUSINESS multi-user is NOT implemented yet (marketing copy only).
- Manual payments (ALL tiers): tenant configures bank accounts + own QRIS in settings Pembayaran tab (`PaymentMethod` model); client confirms on public page → PENDING payment; merchant verifies via bank statement then marks PAID manually. QRIS upload stays open to all tiers (unlike logo).

## Deployment (production VPS, ask owner for IPs/credentials — never commit secrets)

1. Tarball excluding `node_modules .next .git .env* uploads public/uploads .opencode`.
2. Upload to app dir, extract, `npm run build`, `pm2 restart nombokin` (port 3000 behind nginx :80).
3. Smoke test: `/login` → 200. Prisma CLI needs `DATABASE_URL` in `.env` (not `.env.local`).

## Windows/PowerShell quirks

- Avoid `\"` inside strings; use single-quoted strings + `''`.
- curl JSON bodies via file: `--data-binary "@file"` (PowerShell mangles inline JSON).
- Pipe SQL files to `psql -f` / stdin; never inline multi-line SQL.
- `Out-File` wraps long lines — use `-Width 4096`+ or generate files via node (UTF-8).
- `git apply` needs `git -c core.autocrlf=false` or context matching fails.
