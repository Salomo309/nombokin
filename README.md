# Nombokin

> **Bikin invoice 1 menit, klien langsung bisa bayar lewat QRIS.**

Invoice & Quotation generator untuk freelancer Indonesia, agency kecil, dan penyedia jasa.

---

## 🚀 Mulai Cepat

### Prasyarat
- Node.js 20+
- PostgreSQL 15+ (bisa pakai [Neon](https://neon.tech), [Supabase](https://supabase.com), atau Docker)
- npm 10+

### 1. Clone & Install

```bash
git clone <repo-url>
cd nombokin
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dan isi semua variabel yang diperlukan:

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret key untuk JWT (min. 32 karakter) |
| `JWT_REFRESH_SECRET` | Secret key untuk refresh token |
| `MIDTRANS_SERVER_KEY` | Server key Midtrans (dari dashboard) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client key Midtrans |
| `RESEND_API_KEY` | API key Resend untuk email (opsional) |

**Tips:** Generate JWT secret dengan:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Setup Database

```bash
# Push schema ke database
npm run db:push

# (Opsional) Jalankan seed data contoh Indonesia
npm run db:seed

# Buka Prisma Studio untuk lihat data
npm run db:studio
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🏗️ Struktur Folder

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Layout authenticated (sidebar)
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   ├── quotations/
│   │   ├── customers/
│   │   └── settings/
│   ├── (auth)/             # Login & register
│   ├── i/[shareToken]/     # Public invoice view
│   └── api/                # Route handlers
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # AppShell, Sidebar, Topbar
│   ├── invoices/           # Form, preview, table
│   ├── landing/            # Landing page sections
│   └── billing/            # Plan badge, upgrade modal
├── lib/
│   ├── auth.ts             # JWT authentication
│   ├── prisma.ts           # Prisma client singleton
│   ├── midtrans.ts         # Midtrans SDK wrapper
│   ├── resend.ts           # Email sender
│   ├── utils.ts            # Helpers (formatRupiah, etc.)
│   ├── pdf/                # PDF generation (pdfmake)
│   └── validators/         # Zod schemas
├── server/
│   ├── actions/            # Server actions
│   └── services/           # Business logic
└── middleware.ts           # Auth route protection
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Sample data
```

---

## 💳 Setup Midtrans (Pembayaran)

1. Daftar di [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com) (gunakan sandbox untuk development)
2. Ambil **Server Key** dan **Client Key** dari menu "Access Keys"
3. Isi di `.env.local`:
   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-...
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
   MIDTRANS_IS_PRODUCTION=false
   ```
4. Di production, set `MIDTRANS_IS_PRODUCTION=true` dan gunakan Production keys

### Webhook Midtrans
Daftarkan URL webhook di Midtrans Dashboard:
```
https://yourdomain.com/api/midtrans/webhook
```

---

## 📧 Setup Resend (Email)

1. Daftar di [Resend](https://resend.com)
2. Verifikasi domain pengirim kamu
3. Buat API key dan isi `RESEND_API_KEY` di `.env.local`

> **Catatan:** Jika `RESEND_API_KEY` tidak diisi, fitur email akan di-skip tanpa error.

---

## 🌐 Deploy ke Production

### Vercel (Rekomendasi)

```bash
npm install -g vercel
vercel
```

Set environment variables di Vercel Dashboard. Pastikan:
- `DATABASE_URL` mengarah ke database production
- `MIDTRANS_IS_PRODUCTION=true`
- `NEXT_PUBLIC_APP_URL` diisi dengan domain production

### Docker

```dockerfile
# Gunakan Dockerfile yang disediakan
docker build -t nombokin .
docker run -p 3000:3000 --env-file .env.local nombokin
```

---

## 🔧 Scripts

| Command | Keterangan |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Jalankan production build |
| `npm run db:push` | Push schema Prisma ke database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Isi data contoh |
| `npm run db:studio` | Buka Prisma Studio |
| `npm run db:migrate` | Buat migration baru |

---

## 📋 Fitur

- ✅ Buat invoice & penawaran dalam hitungan menit
- ✅ PDF estetik gaya stationery "Warm Paper & Ink"
- ✅ Kirim via WhatsApp (deep link wa.me)
- ✅ Link pembayaran QRIS/VA via Midtrans Snap
- ✅ Status otomatis: Draft → Terkirim → Lunas → Jatuh Tempo
- ✅ Manajemen pelanggan
- ✅ Dashboard revenue & statistik
- ✅ Mode gelap (dark mode)
- ✅ Freemium: FREE (5 invoice/bulan) → PRO → BISNIS

---

## 📄 Lisensi

MIT © 2026 Nombokin
