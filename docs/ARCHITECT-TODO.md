# TODO Arsitektur — Nombokin (untuk Architect)

> Konteks: monolit Next.js 16.3.8, ~41 route API, Prisma/Postgres + Redis, tier FREE/PRO/BUSINESS. Hasil audit SystemAuditor. Desain dulu, implementasi menyusul.

## A. Otorisasi terpusat (prioritas 1) — SELESAI
- [x] **A1. Helper guard bersama** — `src/lib/guards.ts`: `requireAuth`, `requireTier(min)`, `requireRole(roles)` untuk API route + `assertTierAction`, `getTenantTier` untuk server action. Seluruh titik gate API dimigrasi (payment-link, logo, reports, admin ×5 handler, billing OWNER).
- [x] **A2. Contoh domain service** — `src/server/services/reportService.ts` (`getReportSummary`, `buildReportCsv`); route tinggal gate + delegasi.
  - Roadmap migrasi: (1) payment-methods CRUD → `paymentMethodService`, (2) invoice list/create/update/delete → rapikan `invoiceService` (sudah ada, tinggal pindahkan query dari route), (3) billing (upgrade/confirm/webhook) → `subscriptionService`, (4) customers/products → service tipis terakhir. Aturan: validasi ringan di route, aturan bisnis di service, tanpa big-bang.

## B. Klaim BISNIS vs realita (prioritas 1) — SELESAI
- [x] **B1. Multi-user** — model `InviteToken`; `POST /api/team/invite` (OWNER, BISNIS, maks 5, link 7 hari), `POST /api/team/accept` (publik, sekali pakai), `GET/PATCH/DELETE /api/team/members` (proteksi owner terakhir); endpoint billing mutasi khusus OWNER/ADMIN; tab Tim di settings; register dukung `?invite=`.
- [x] **B2. Satu sumber harga** — `src/lib/pricing.ts` (`PRICING`, `getPrice`, `formatPrice`); dipakai landing, settings, dan route upgrade (sekalian validasi tier/interval — sebelumnya tier sembarang → harga 0).

## C. Duplikasi & god-file (prioritas 2) — SELESAI
- [x] **C1. Detail bersama** — `src/components/invoices/DocumentDetail.tsx` (shell, header, preview, share, timeline, tipe `DocumentData`); kedua halaman detail tinggal handler + slot spesifik (kartu pembayaran, konversi).
- [x] **C2. Aktivasi bersama** — `confirmMidtransOrder()` di `paymentService`; dipakai billing/confirm + check-status; webhook tidak berubah (idempoten via `WebhookEvent`).
- [x] **C3. Admin dipecah** — `src/components/admin/` (`AdminDashboardTab`, `AdminUsersTab`, `AdminPaymentsTab`, `types`); page tinggal shell + gate 403.
- [x] **C4. Inventarisasi god-file** — per Okt 2026: landing `app/page.tsx` 692 (ambang: pecah pricing/FAQ bila tambah seksi), `settings/page.tsx` ~700 (ambang: ekstrak per-tab bila tambah tab ke-6), `InvoiceForm.tsx` 569 (ambang: ekstrak baris item bila tambah tipe baris), `pdf/template.ts` 525 (ambang: split per-tipe dokumen bila tambah template). Aturan: pecah saat >800 baris atau >5 tanggung jawab.

## D. Aturan main untuk implementasi (tempel ke pelaksana)
- Satu concern per commit (`feat:`/`fix:`); file campuran di-split per hunk (`git -c core.autocrlf=false apply` bila perlu).
- Setiap fitur tier berbayar dikunci server-side (bukan hanya UI); pesan error English; tanpa `alert()`/`confirm()`.
- `npx tsc --noEmit` bersih sebelum commit; jangan commit `.env*`/secret.
- Uji tiap endpoint berubah: 401 tanpa auth, 403 tier tak berhak, 200 jalur bahagia.

Urutan saran: A1 → B1 → B2 → A2 → C2 → C1 → C3/C4.
