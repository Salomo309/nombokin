# Skor Sistem — Nombokin (Okt 2026)

> Baseline audit pasca-perombakan guard/tim/pricing/service. Skala 1–10.
> Bukti: 42 blok `catch` konsisten di semua route, tanpa marker utang (`TODO`/`FIXME` nihil),
> log produksi hanya di lifecycle pembayaran.

| # | Aspek | Skor | Alasan ringkas |
|---|-------|------|----------------|
| 1 | Arsitektur & pemisahan lapis | **7.5** | Guard terpusat + service contoh ada; ~40 route masih akses prisma langsung (roadmap migrasi tertulis) |
| 2 | Penegakan tier & otorisasi | **8.5** | 15 titik pakai helper; sisa 2 pola istimewa + 2 harga di teks prosa |
| 3 | Kelengkapan & kejujuran fitur | **8.0** | Matriks tier = implementasi; belum diputuskan nasib anggota saat downgrade |
| 4 | Alur penggunaan | **8.0** | Journey invoice→bayar→lunas efisien + redundan sehat; invite→accept rapi |
| 5 | Struktur & keterawatan kode | **7.0** | Duplikasi besar hilang; `settings` 667 baris tumbuh, `InvoiceForm` 569 belum tersentuh |
| 6 | Keamanan | **7.5** | Pasca-remediasi (Next 16.3.8, rate limit, fail-fast, upload keras); sisa: tanpa WAF/CAPTCHA, prod masih HTTP (axios terhapus bersama midtrans-client) |
| 7 | Observabilitas & error handling | **6.5** | Try/catch + pesan English konsisten; tanpa taksonomi error terpusat, tanpa metrik konversi/instan |
| 8 | Operasional & deployment | **6.0** | Deploy tarball manual, tanpa CI/staging, single VPS tanpa failover |
| 9 | Konsistensi UI/UX | **7.5** | Konvensi toast/confirm-dialog dipatuhi; watermark & upsell konsisten; tab Langganan hanya sembunyi-di-UI untuk MEMBER |
| 10 | Integritas data | **7.5** | Webhook idempoten, FK cascade rapi; token invite kedaluwarsa menumpuk, downgrade beranggota tak tertangani |

**Rata-rata: 7.4 — sehat, layak scale dengan catatan.**

## Temuan (per skor terendah dulu)

1. **(Ops 6.0)** Deploy manual + single point of failure — tidak ada CI, staging, atau failover VPS.
2. **(Obs 6.5)** Tanpa metrik bisnis/teknis — konversi FREE→PRO, invoice/user, payment success rate tidak terpantau.
3. **(Struktur 7.0)** `settings/page.tsx` 667 baris dan tumbuh; `InvoiceForm.tsx` 569 stagnan — keduanya di bawah ambang 800 tapi menuju ke sana.
4. **(Ars 7.5)** Migrasi service baru 1 domain contoh (`reportService`); ~40 route menunggu giliran.
5. **(Integ 7.5)** Token invite kedaluwarsa menumpuk; downgrade beranggota belum diputuskan.
6. **\(Keam 7.5\)** axios terhapus (midtrans-client dead dependency dibuang); rate limit di 5 endpoint; prod HTTP.
7. **(Tier 8.5)** 2 harga di teks prosa (`InvoiceForm:592`, `reports/page:88`) + 2 pola gate istimewa.

## TODO

### P0 — Keputusan produk (Yang Dipertuan Agung)
- [ ] Putuskan nasib anggota saat tenant turun dari BISNIS (bekukan vs baca-saja vs keluarkan).
- [ ] Putuskan target deployment: tetap single VPS atau siapkan staging + CI minimal.

### P1 — Bangun (agent builder)
- [ ] Tarik 2 harga prosa ke `lib/pricing.ts` (temuan 7).
- [ ] Terapkan keputusan downgrade (temuan 5) + pembersih token invite kedaluwarsa (cron/interval harian).
- [ ] Gate Tab Langganan untuk MEMBER di level render route, bukan sekadar sembunyikan tab.
- [ ] Lanjut migrasi service domain berikutnya sesuai roadmap: payment-methods → invoice → billing.
- [ ] Tambah metrik minimal: konversi FREE→PRO, invoice/user/bulan, payment success rate — mulai dari query manual terjadwal sebelum bangun dashboard.
- [ ] Perluas rate limit ke endpoint sensitif lain (team/invite, team/accept, check-status) bila log menunjukkan abuse.

### P2 — Verifikasi (terpisah dari builder)
- [ ] **SecurityAnalyzer**: uji regresi multi-user (invite ganda, token kedaluwarsa, race promosi, MEMBER panggil billing/anggota langsung) + axios: SELESAI dihapus.
- [ ] **Investigator**: verifikasi tidak ada harga hardcode lain (template email, pesan WA, PDF) + audit sisa pola gate istimewa.
- [ ] **Architect**: rancang ambang pecah `settings`/`InvoiceForm` + pola service untuk domain billing (paling kompleks karena webhook + 2 jalur aktivasi).

### P3 — Eksternal (di luar kode)
- [ ] Domain + HTTPS → aktifkan HSTS/CSP yang sudah disiapkan.
- [ ] Verifikasi domain Resend → evaluasi ulang invite via email.
- [ ] Keys produksi Midtrans + notification URL.
- [ ] Kredensial Google OAuth.

---

# TODO Pasca-Audit Putaran 3 (Okt 2026)

## P0 — Desain dulu (Architect, tanpa kode)
- [ ] **A. Desain implementasi suspend-downgrade** — skema User.status, fungsi handleTenantDowngrade (suspend non-OWNER + hanguskan invite pending), titik panggil (cancel + expire check), restore otomatis saat re-upgrade ke BISNIS, cek status di login, semua dalam transaksi.
- [ ] **B. Investigasi akar redirect() mati** — isolasi minimal di luar app (fresh Next 16.3.8 vs versi lain); keluaran: boleh/tidaknya pola redirect server-side dipakai lagi.

## P1 — Bangun (builder, setelah A selesai)
- [ ] **1. Implementasi suspend-downgrade** sesuai desain A (termasuk cron/interval: suspend saat currentPeriodEnd lewat + hapus token invite kedaluwarsa).
- [ ] **2. Pesan ?invited=1 di halaman login** — baca parameter, tampilkan notifikasi sukses undangan.
- [ ] **3. Migrasi service berikutnya** — invoice list/detail (sebagian jalan) ke billing (butuh lampu hijau, menyentuh webhook+uang).
- [ ] **4. Ekstrak helper upload bersama** (logo vs QRIS) — saat salah satunya disentuh lagi, jangan khusus.

## P2 — Verifikasi (terpisah dari builder)
- [ ] **SecurityAnalyzer**: regresi gate proxy di produksi + uji race promosi/demote + terima invite ganda/kedaluwarsa.
- [ ] **Investigator**: pastikan tidak ada harga hardcode di template email/pesan WA/PDF + audit ulang sisa pola gate istimewa.

## P3 — Eksternal (di luar kode)
- [ ] Domain + HTTPS lalu HSTS/CSP. Verifikasi Resend. Keys produksi Midtrans + notification URL. Google OAuth.

---

# Audit Putaran 4 (Okt 2026) — Rata-rata 7.7 (dari 7.4)

| Aspek | Sblm | Kini |
|---|---|---|
| Arsitektur | 7.5 | 8.0 |
| Penegakan tier | 8.5 | 8.5 |
| Kelengkapan fitur | 8.0 | 8.0 |
| Alur | 8.0 | 8.0 |
| Struktur kode | 7.0 | 7.0 |
| Keamanan | 7.5 | 8.0 |
| Observabilitas | 6.5 | 6.5 |
| Operasional | 6.0 | 6.5 |
| Konsistensi UI/UX | 7.5 | 7.5 |
| Integritas data | 7.5 | 8.0 |

Temuan: (1) downgrade tanpa pintu UI; (2) cron sweeper belum terlihat berjalan — cek cron.log; (3) re-upgrade PRO tak memulihkan anggota, belum dikomunikasikan; (4) akar redirect() mati belum diketahui.

# TODO Pasca-Audit Putaran 4

## P0 — Desain (Architect)
- [ ] A. UI downgrade + tampilan akun suspended.
- [ ] B. Copy komunikasi re-upgrade parsial (PRO tak memulihkan, hanya BISNIS).

## P1 — Bangun
- [ ] 1. UI downgrade + pesan suspended sesuai desain A.
- [ ] 2. Putuskan nasib docs/SYSTEM-SCORE.md (commit atau keluarkan dari repo).
- [ ] 3. Migrasi service: customers/products lalu billing (butuh lampu hijau).

## P2 — Verifikasi
- [ ] Investigator: cek cron.log + audit sapuan pertama.
- [ ] SecurityAnalyzer: downgrade sebagai MEMBER (403), tier tak valid, cron tanpa/salah secret di produksi.

## P3 — Eksternal
- [ ] Domain + HTTPS, Resend, Midtrans produksi + notification URL, Google OAuth.


