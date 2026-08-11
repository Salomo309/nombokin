import Link from "next/link";
import {
  FileText,
  MessageSquare,
  QrCode,
  BellRing,
  Building,
  Users,
  Check,
  ArrowRight,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Reveal } from "@/components/shared/Reveal";
import { TiltCard } from "@/components/shared/TiltCard";

const steps = [
  {
    no: "01",
    title: "Isi detail tagihan",
    description:
      "Nama klien, rincian jasa, dan jatuh tempo dalam satu form yang tidak perlu dipelajari.",
  },
  {
    no: "02",
    title: "Nyalakan pembayaran",
    description:
      "QRIS dan Virtual Account dibuat otomatis lewat Midtrans. Tanpa coding, tanpa halaman integrasi.",
  },
  {
    no: "03",
    title: "Kirim. Lunas. Selesai.",
    description:
      "Link dikirim lewat WhatsApp. Klien scan, status berubah LUNAS, uang masuk ke rekeningmu.",
  },
];

const features = [
  {
    icon: FileText,
    title: "PDF bergaya kop surat",
    description:
      "Setiap invoice digenerate sebagai PDF stationery yang rapi — bisa dikirim, diunduh, atau diarsipkan kapan pun.",
    tag: "PDF",
  },
  {
    icon: QrCode,
    title: "Link bayar QRIS & VA",
    description:
      "Invoice otomatis punya QRIS dan Virtual Account. GoPay, OVO, DANA, sampai m-banking, tanpa konfigurasi tambahan.",
    tag: "QRIS",
  },
  {
    icon: MessageSquare,
    title: "Kirim lewat WhatsApp",
    description:
      "Template pesan sudah terisi otomatis beserta link pembayaran. Kamu cukup menekan kirim.",
    tag: "WA",
  },
  {
    icon: BellRing,
    title: "Status real-time",
    description:
      "Tagihan bergerak sendiri dari Terkirim ke Lunas saat pembayaran masuk. Tidak ada lagi tanya-tanya ke klien.",
    tag: "STATUS",
  },
  {
    icon: Building,
    title: "Branding sendiri",
    description:
      "Logo dan tanda tanganmu sendiri di dokumen, tanpa watermark Nombokin, untuk paket berbayar.",
    tag: "BRAND",
  },
  {
    icon: Users,
    title: "Kontak pelanggan",
    description:
      "Data klien tersimpan. Invoice berikutnya tinggal pilih dari daftar — total waktu pengerjaan di bawah satu menit.",
    tag: "CRM",
  },
];

const faqItems = [
  {
    q: "Apakah saya harus punya akun Midtrans sendiri?",
    a: "Ya. Kamu cukup mendaftar di Midtrans (mode sandbox dulu untuk uji coba), ambil API key, lalu tempel di halaman Pengaturan. Uang dari klien langsung ditransfer ke rekening bankmu oleh Midtrans — Nombokin tidak pernah menyentuh uangmu.",
  },
  {
    q: "Berapa biaya transaksi untuk QRIS?",
    a: "Nombokin tidak memotong komisi apa pun. Biaya transaksi QRIS (sekitar 0,7%) dikenakan langsung oleh Midtrans sesuai ketentuan Bank Indonesia.",
  },
  {
    q: "Apa beda paket FREE dan PRO?",
    a: "FREE memberi 5 invoice/bulan dengan watermark dan tanpa link bayar. PRO (Rp29.000/bulan) membuka invoice tanpa batas, link bayar QRIS/VA, custom logo, dan tanpa watermark.",
  },
  {
    q: "Bagaimana keamanan data klien saya?",
    a: "Setiap invoice punya tautan acak yang hanya bisa diakses pemegangnya. Tautan itu yang kamu kirim ke klien — tidak ada halaman invoice yang bisa dicari publik.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ANNOUNCEMENT BAR */}
      <div className="bg-foreground text-background">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-2">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em]">
            Pembayaran QRIS aktif — GoPay · OVO · DANA · m-banking
          </p>
          <Link
            href="/register"
            className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] underline underline-offset-4 sm:block"
          >
            Mulai gratis →
          </Link>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
          <Logo />

          <div className="hidden items-center gap-8 md:flex">
            <a href="#fitur" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
              Fitur
            </a>
            <a href="#cara-kerja" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
              Cara kerja
            </a>
            <a href="#harga" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
              Harga
            </a>
            <a href="#faq" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block">
              Masuk
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Mulai gratis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="ledger-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

        <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-14 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-12">
          {/* Left */}
          <Reveal className="space-y-8 lg:col-span-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
              Invoicing & pembayaran QRIS
            </p>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-[4.25rem]">
              Invoice satu menit. Dibayar dalam hitungan detik.
            </h1>

            <p className="max-w-[46ch] text-base leading-relaxed text-muted-foreground md:text-lg">
              Nombokin mengubah template invoice menjadi link bayar QRIS yang siap
              dikirim lewat WhatsApp. Status terpantau real-time, dan uang masuk
              langsung ke rekeningmu.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Mulai gratis <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#cara-kerja">Lihat cara kerja</a>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
              {["GRATIS 5 invoice/bulan", "TANPA kartu kredit", "SETUP &lt; 2 menit"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

          {/* Right: receipt mock */}
          <div className="relative lg:col-span-6">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />

            <Reveal delay={0.15} className="relative">
              <TiltCard intensity={9} className="mx-auto max-w-[520px]">
                <div className="relative border border-border bg-card shadow-[0_1px_0_rgba(0,0,0,0.02),0_20px_50px_-24px_rgba(0,0,0,0.25)]">
              {/* receipt header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Invoice · INV-2026-0001
                </span>
                <span
                  style={{ transform: "translateZ(30px)" }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#15803D]/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#15803D]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Lunas · QRIS
                </span>
              </div>

              <div className="p-6 sm:p-7">
                {/* from / to */}
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-serif text-lg font-bold tracking-tight">Studio Raka</p>
                    <p className="font-mono text-[11px] text-muted-foreground">raka@studioraka.id</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Untuk</p>
                    <p className="mt-0.5 text-sm font-semibold">CV Nusantara Kreatif</p>
                    <p className="font-mono text-[11px] text-muted-foreground">Jakarta, ID</p>
                  </div>
                </div>

                {/* amount */}
                <div className="mt-8" style={{ transform: "translateZ(26px)" }}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                    Total ditagih
                  </p>
                  <p className="mt-1.5 font-serif text-5xl font-extrabold tracking-tight tabular-nums">
                    Rp 5.550.000
                  </p>
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                    Termasuk PPN 11% · Rp 550.000
                  </p>
                </div>

                {/* line items */}
                <table className="mt-8 w-full text-left">
                  <thead>
                    <tr className="border-y border-border font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">Deskripsi</th>
                      <th className="px-2 py-2 text-right font-medium">Qty</th>
                      <th className="py-2 pl-2 text-right font-medium">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    <tr className="border-b border-dashed border-border/70">
                      <td className="py-3 pr-2 font-medium">Redesign UI landing page</td>
                      <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">1</td>
                      <td className="py-3 pl-2 text-right font-medium tabular-nums">Rp 3.500.000</td>
                    </tr>
                    <tr className="border-b border-dashed border-border/70">
                      <td className="py-3 pr-2 font-medium">Integrasi animasi &amp; Framer</td>
                      <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">1</td>
                      <td className="py-3 pl-2 text-right font-medium tabular-nums">Rp 1.500.000</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-2 font-medium text-muted-foreground">Diskon klien berulang</td>
                      <td className="px-2 py-3 text-right text-muted-foreground">—</td>
                      <td className="py-3 pl-2 text-right tabular-nums text-[#15803D]">− Rp 550.000</td>
                    </tr>
                  </tbody>
                </table>

                {/* payment row */}
                <div
                  style={{ transform: "translateZ(44px)" }}
                  className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1C1917] text-[#FAF7F2]">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Bayar via QRIS</p>
                      <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        REF 8100 0000 0000 0000
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Midtrans
                  </span>
                </div>

                {/* bottom meta */}
                <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>Terbit · 10 Agu 2026</span>
                  <span>Jatuh tempo · 24 Agu 2026</span>
                  <span>Dibayar · 3 mnt lalu</span>
                </div>
              </div>
              </div>
              </TiltCard>
            </Reveal>

            {/* floating payment notification */}
            <Reveal delay={0.4}>
              <div className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15803D]/10 text-[#15803D]">
                <Banknote className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold tabular-nums">+ Rp 5.550.000 masuk</p>
                <p className="font-mono text-[10px] text-muted-foreground">Dari CV Nusantara Kreatif</p>
              </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PAYMENT CHANNELS MARQUEE */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1180px] px-6 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Klien bisa bayar dari
          </p>
        </div>
        <div className="mt-4 overflow-hidden border-y border-border/60 py-3 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="animate-marquee flex w-max items-center">
            {[
              "GoPay",
              "OVO",
              "DANA",
              "LinkAja",
              "ShopeePay",
              "m-banking BCA",
              "m-banking BNI",
              "m-banking BRI",
              "Virtual Account",
              "QRIS Standard BI",
              "GoPay",
              "OVO",
              "DANA",
              "LinkAja",
              "ShopeePay",
              "m-banking BCA",
              "m-banking BNI",
              "m-banking BRI",
              "Virtual Account",
              "QRIS Standard BI",
            ].map((channel, idx) => (
              <span
                key={idx}
                className="flex items-center whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70"
              >
                {channel}
                <span className="mx-8 h-1.5 w-1.5 rounded-full bg-primary/60" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* LEDGER STATS */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {[
            ["01 · Pembuatan invoice", "60 detik"],
            ["02 · Komisi untuk Nombokin", "Rp 0"],
            ["03 · Biaya QRIS (regulasi BI)", "0,7%"],
            ["04 · Klien lunas", "3× lebih cepat"],
          ].map(([label, value], idx) => (
            <Reveal
              key={label}
              delay={idx * 0.08}
              className="border-b border-border px-6 py-8 last:border-b-0 sm:border-b lg:border-b-0"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
              <p className="mt-3 font-serif text-3xl font-extrabold tracking-tight tabular-nums md:text-4xl">
                {value}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" className="border-t border-border px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
            <h2 className="font-serif text-3xl font-bold tracking-tight md:col-span-7 md:text-5xl">
              Dari tagihan kosong sampai lunas, dalam tiga langkah.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground md:col-span-5">
              Alur yang sama untuk invoice dan penawaran. Tidak ada form panjang,
              tidak ada menu yang menyembunyikan tombol penting.
            </p>
          </Reveal>

          <div className="border-t border-border">
            {steps.map((step, idx) => (
              <Reveal
                key={step.no}
                delay={idx * 0.1}
                className={`grid grid-cols-1 gap-4 border-b border-border py-8 md:grid-cols-12 md:items-center md:gap-8 ${
                  idx === 1 ? "bg-muted/20" : ""
                }`}
              >
                <div className="font-mono text-xs tracking-[0.2em] text-primary md:col-span-2">
                  LANGKAH {step.no}
                </div>
                <h3 className="font-serif text-xl font-bold tracking-tight md:col-span-4">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:col-span-6">
                  {step.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FITUR */}
      <section id="fitur" className="border-t border-border bg-muted/20 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="mb-14 max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Fitur</p>
            <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight md:text-5xl">
              Semua yang kamu butuh, tanpa yang tidak.
            </h2>
          </Reveal>

          <div className="border-t border-border">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Reveal
                  key={feat.title}
                  delay={(idx % 3) * 0.08}
                  className="group grid grid-cols-1 gap-3 border-b border-border py-7 transition-colors hover:bg-card md:grid-cols-12 md:items-start md:gap-8"
                >
                  <div className="flex items-center gap-3 md:col-span-1 md:block">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-border">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:mt-4 md:block">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold tracking-tight md:col-span-4">
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground md:col-span-7">
                    {feat.description}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* HARGA */}
      <section id="harga" className="border-t border-border px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="mb-14 max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Harga</p>
            <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight md:text-5xl">
              Bayar per bulan. Batalkan kapan saja.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Tanpa kontrak, tanpa biaya pemasangan, tanpa komisi tersembunyi.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* FREE */}
            <Reveal delay={0.05} className="h-full">
              <TiltCard intensity={4} glare={false} className="h-full" innerClassName="h-full">
                <div className="flex h-full flex-col border border-border bg-card p-7">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-xl font-bold">FREE</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Selamanya
                </span>
              </div>
              <p className="mt-5 font-serif text-4xl font-extrabold tracking-tight tabular-nums">
                Rp 0
              </p>
              <div className="my-6 h-px bg-border" />
              <ul className="flex-1 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> 5 invoice / bulan</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> PDF stationery standar</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> 1 user</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Watermark Nombokin</li>
              </ul>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link href="/register">Mulai gratis</Link>
              </Button>
              </div>
              </TiltCard>
            </Reveal>

            {/* PRO */}
            <Reveal delay={0.15} className="h-full">
              <TiltCard intensity={5} glare={false} className="h-full" innerClassName="h-full">
                <div className="relative flex h-full flex-col border-2 border-primary bg-primary p-7 text-primary-foreground shadow-[0_25px_60px_-30px_rgba(194,65,12,0.55)]">
              <span className="absolute -top-3 right-6 bg-foreground px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-background">
                Paling laku
              </span>
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-xl font-bold">PRO</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70">
                  Per bulan
                </span>
              </div>
              <p className="mt-5 font-serif text-4xl font-extrabold tracking-tight tabular-nums">
                Rp 29.000
              </p>
              <div className="my-6 h-px bg-primary-foreground/20" />
              <ul className="flex-1 space-y-3 text-sm text-primary-foreground/90">
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Invoice &amp; penawaran tanpa batas</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Link bayar QRIS &amp; Virtual Account</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Tanpa watermark</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Logo &amp; tanda tangan sendiri</li>
              </ul>
              <Button asChild className="mt-8 w-full bg-foreground text-background hover:bg-foreground/90">
                <Link href="/register">Pilih PRO</Link>
              </Button>
              </div>
              </TiltCard>
            </Reveal>

            {/* BISNIS */}
            <Reveal delay={0.25} className="h-full">
              <TiltCard intensity={4} glare={false} className="h-full" innerClassName="h-full">
                <div className="flex h-full flex-col border border-border bg-card p-7">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-xl font-bold">BISNIS</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Per bulan
                </span>
              </div>
              <p className="mt-5 font-serif text-4xl font-extrabold tracking-tight tabular-nums">
                Rp 59.000
              </p>
              <div className="my-6 h-px bg-border" />
              <ul className="flex-1 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Semua fitur PRO</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Hingga 5 user tim</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Hak akses per anggota</li>
                <li className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Prioritas dukungan WhatsApp</li>
              </ul>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link href="/register">Pilih BISNIS</Link>
              </Button>
              </div>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      <section className="border-t border-border bg-muted/20 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-md font-serif text-3xl font-bold tracking-tight md:text-5xl">
              Dipakai freelancer yang muak dengan administrasi.
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Alur tagihan manual menghabiskan waktu paling banyak di akhir proyek.
              Inilah yang berubah setelah pakai Nombokin.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
            {[
              {
                quote:
                  "Dulu kirim PDF lewat WA, lalu nunggu klien transfer manual dan konfirmasi. Sekarang cukup kirim link, klien scan QRIS, langsung lunas. Tidak ada lagi tagihan yang nyangkut.",
                name: "Raka Pratama",
                role: "Desainer UI/UX · Jakarta",
                project: "Klien web agency, 12 invoice/bulan",
              },
              {
                quote:
                  "Kami jalan dengan 30+ klien konten. Konversi penawaran ke invoice langsung menghilangkan pekerjaan admin yang paling membosankan — saya tidak perlu menyusun ulang tabel harga setiap bulan.",
                name: "Maya Sari",
                role: "Co-founder agensi konten · Bandung",
                project: "Tim 4 orang, paket BISNIS",
              },
              {
                quote:
                  "Yang paling penting buat saya status pembayarannya. Klien luar kota bayar dua minggu lagi — saya tidak perlu tanya-tanya sudah dibayar atau belum, sistem yang kasih tahu.",
                name: "Budi Santoso",
                role: "Fullstack developer · Surabaya",
                project: "Klien tetap, tagihan Rp 10–20 jt",
              },
            ].map((t, idx) => (
              <Reveal key={t.name} delay={idx * 0.1} className="bg-card">
                <figure className="flex h-full flex-col gap-5 bg-card p-7">
                <div className="font-serif text-5xl leading-none text-primary">“</div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  {t.quote}
                </blockquote>
                <figcaption className="border-t border-border pt-4">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {t.role}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{t.project}</p>
                </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[820px]">
          <Reveal className="mb-12 max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">FAQ</p>
            <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight md:text-5xl">
              Pertanyaan yang paling sering diajukan.
            </h2>
          </Reveal>

          <Accordion type="single" collapsible className="w-full border-t border-border">
            {faqItems.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="font-sans text-sm font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-[60ch] leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-primary px-6 py-16 text-primary-foreground md:py-20">
        <Reveal className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary-foreground/70">
              Gratis 5 invoice pertama
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight md:text-5xl">
              Siap dibayar lebih cepat?
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90">
              <Link href="/register">Buat invoice pertama</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/login">Masuk ke akun</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card px-6 py-14">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs space-y-4">
              <Logo />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Invoice &amp; penawaran instan untuk freelancer dan usaha kecil di
                Indonesia — lengkap dengan pembayaran QRIS.
              </p>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Data dienkripsi · Jakarta, ID
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Produk</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><a href="#fitur" className="text-foreground/80 transition-colors hover:text-foreground">Fitur</a></li>
                  <li><a href="#cara-kerja" className="text-foreground/80 transition-colors hover:text-foreground">Cara kerja</a></li>
                  <li><a href="#harga" className="text-foreground/80 transition-colors hover:text-foreground">Harga</a></li>
                </ul>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Akun</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><Link href="/login" className="text-foreground/80 transition-colors hover:text-foreground">Masuk</Link></li>
                  <li><Link href="/register" className="text-foreground/80 transition-colors hover:text-foreground">Daftar</Link></li>
                  <li><Link href="/settings" className="text-foreground/80 transition-colors hover:text-foreground">Pengaturan</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Legal</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li><span className="cursor-default text-foreground/60">Privasi</span></li>
                  <li><span className="cursor-default text-foreground/60">Syarat &amp; ketentuan</span></li>
                  <li><span className="cursor-default text-foreground/60">Regulasi QRIS BI</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              © 2026 Nombokin · Semua hak dilindungi
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Dibuat di Indonesia untuk freelancer Indonesia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
