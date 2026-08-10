import Link from "next/link";
import {
  FileText,
  MessageSquare,
  QrCode,
  BellRing,
  Building,
  Users,
  Check,
  ChevronRight,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function LandingPage() {
  const steps = [
    {
      no: "01",
      title: "Isi Detail Tagihan",
      description:
        "Tulis nama klien, rincian jasa atau barang, dan tanggal jatuh tempo dalam form sederhana.",
    },
    {
      no: "02",
      title: "Aktifkan QRIS / VA",
      description:
        "Nombokin otomatis membuat QRIS dan Virtual Account instan via Midtrans (tidak perlu coding).",
    },
    {
      no: "03",
      title: "Kirim & Terima Bayaran",
      description:
        "Kirim link public invoice via WhatsApp sekali klik. Klien scan QRIS, uang langsung masuk ke rekening.",
    },
  ];

  const features = [
    {
      icon: FileText,
      title: "PDF Stationery Estetik",
      description:
        "Desain invoice klasik bergaya kertas surat premium (stationery) yang memberikan kesan profesional pada bisnis Anda.",
    },
    {
      icon: MessageSquare,
      title: "Kirim via WhatsApp",
      description:
        "Kirim link tagihan langsung ke nomor WhatsApp klien menggunakan prefilled text instan tanpa integrasi API rumit.",
    },
    {
      icon: QrCode,
      title: "Pembayaran QRIS Instan",
      description:
        "Klien cukup scan kode QRIS menggunakan GoPay, OVO, Dana, LinkAja, atau m-Banking apa saja untuk membayar.",
    },
    {
      icon: BellRing,
      title: "Status Otomatis",
      description:
        "Status tagihan otomatis berubah menjadi LUNAS setelah klien melakukan scan & bayar QRIS. Terpantau real-time.",
    },
    {
      icon: Building,
      title: "Logo & Branding Khusus",
      description:
        "Unggah logo bisnis Anda sendiri dan hilangkan watermark Nombokin untuk paket berbayar (PRO & Bisnis).",
    },
    {
      icon: Users,
      title: "Manajemen Pelanggan",
      description:
        "Simpan data kontak klien reguler Anda agar pembuatan invoice berikutnya bisa dilakukan kurang dari 1 menit.",
    },
  ];

  const faqItems = [
    {
      q: "Apakah saya harus punya akun Midtrans sendiri?",
      a: "Ya. Untuk menerima pembayaran online, Anda cukup mendaftar di Midtrans Sandbox/Production, ambil API keys, lalu masukkan di halaman Pengaturan Nombokin. Uang dari klien akan langsung ditransfer ke rekening bank Anda oleh Midtrans.",
    },
    {
      q: "Berapa biaya transaksi untuk pembayaran QRIS?",
      a: "Nombokin sama sekali tidak mengambil potongan komisi transaksi. Potongan biaya transaksi standar QRIS (biasanya 0.7%) dikenakan langsung oleh Midtrans sesuai regulasi Bank Indonesia.",
    },
    {
      q: "Apa perbedaan paket FREE dan PRO?",
      a: "Paket FREE membatasi maksimal 5 invoice/bulan, terdapat watermark 'Dibuat dengan Nombokin', dan tidak bisa mengunggah logo sendiri. Paket PRO (Rp29.000/bulan) memberikan invoice unlimited, tanpa watermark, custom logo, dan pembayaran QRIS.",
    },
    {
      q: "Apakah data klien saya aman?",
      a: "Tentu. Setiap invoice memiliki shareToken acak yang unik. Hanya klien yang memegang tautan tersebut yang bisa melihat detail invoice. Kami tidak pernah membagikan atau menjual data klien Anda.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1120px] h-16 items-center justify-between px-6">
          <Logo />
          
          <div className="hidden items-center gap-8 md:flex">
            <a href="#fitur" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Fitur
            </a>
            <a href="#cara-kerja" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Cara Kerja
            </a>
            <a href="#harga" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Harga
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              Masuk
            </Link>
            <Button asChild size="sm" className="shadow-xs">
              <Link href="/register">Mulai Gratis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left text */}
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-xs font-semibold text-primary">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Invoice Instan untuk Freelancer Indonesia</span>
              </div>
              
              <h1 className="font-serif text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Bikin invoice 1 menit, klien langsung bayar lewat QRIS.
              </h1>
              
              <p className="text-base text-muted-foreground md:text-lg leading-relaxed">
                Hentikan kirim invoice PDF manual lewat Word atau Excel. Buat tagihan profesional dengan tampilan klasik bergaya kertas surat, aktifkan link bayar instan, dan terima pembayaran lebih cepat.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button asChild size="lg" className="shadow-sm">
                  <Link href="/register">
                    Coba Gratis Sekarang <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#cara-kerja">Bagaimana Ini Bekerja</a>
                </Button>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-primary" /> Tanpa Kartu Kredit
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-primary" /> 5 Invoice Gratis/Bulan
                </div>
              </div>
            </div>

            {/* Right: Stationery Mockup preview */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-[460px] overflow-hidden rounded-xl border border-border bg-[#FAF7F2] p-6 shadow-md text-[#1C1917] rotate-1 hover:rotate-0 transition-transform duration-300 paper-sheet">
                {/* Monogram logo on header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-serif font-bold text-base uppercase text-[#1C1917]">Studio Raka</p>
                    <p className="text-[10px] text-[#57534E] italic font-serif">raka@studioraka.id</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-lg font-bold text-[#C2410C] uppercase tracking-wide">INVOICE</p>
                    <p className="text-[9px] font-semibold text-[#A8A29E] mt-0.5">INV-2026-0001</p>
                  </div>
                </div>
                
                <div className="h-px bg-[#E7E5E4] my-4" />
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 text-[11px] text-[#57534E]">
                  <div>
                    <span className="text-[9px] font-bold text-[#A8A29E] uppercase tracking-wider block mb-0.5">DITAGIHKAN KEPADA</span>
                    <strong className="text-[#1C1917] font-semibold">CV Nusantara Kreatif</strong>
                  </div>
                  <div className="text-right">
                    <p><span className="text-[#A8A29E]">Terbit:</span> 10 Agu 2026</p>
                    <p><span className="text-[#A8A29E]">Jatuh Tempo:</span> 24 Agu 2026</p>
                  </div>
                </div>

                {/* Items */}
                <table className="w-full text-left text-[10px] mt-6">
                  <thead>
                    <tr className="border-b border-[#E7E5E4] text-[#A8A29E] font-bold">
                      <th className="pb-1.5">DESKRIPSI</th>
                      <th className="pb-1.5 text-center w-8">QTY</th>
                      <th className="pb-1.5 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-[#1C1917] font-semibold">
                      <td className="py-2">Redesign UI Landing Page</td>
                      <td className="py-2 text-center">1</td>
                      <td className="py-2 text-right">Rp 3.500.000</td>
                    </tr>
                    <tr className="text-[#1C1917] font-semibold">
                      <td className="py-2">Integrasi Framer & Animasi</td>
                      <td className="py-2 text-center">1</td>
                      <td className="py-2 text-right">Rp 1.500.000</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mt-4 text-[10px] text-[#57534E]">
                  <div className="w-36 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[#1C1917]">Rp 5.000.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PPN (11%)</span>
                      <span className="font-semibold text-[#1C1917]">Rp 550.000</span>
                    </div>
                    <div className="border-t border-dashed border-[#E7E5E4] my-1" />
                    <div className="flex justify-between font-serif font-bold text-xs text-[#C2410C]">
                      <span>TOTAL</span>
                      <span>Rp 5.550.000</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-orange-50 border border-orange-200/50 p-2.5 mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-primary" />
                    <div className="text-[10px] text-primary">
                      <p className="font-bold uppercase tracking-wider leading-none">Bayar Instan</p>
                      <p className="text-primary/80 mt-0.5">Scan via GoPay, m-Banking</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-border/80 bg-muted/20 py-8 px-6 text-center">
        <div className="mx-auto max-w-[1120px] grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="font-serif text-3xl font-bold tracking-tight text-primary">1 Menit</p>
            <p className="text-xs text-muted-foreground mt-1">Pembuatan Invoice</p>
          </div>
          <div>
            <p className="font-serif text-3xl font-bold tracking-tight text-primary">Rp 0</p>
            <p className="text-xs text-muted-foreground mt-1">Biaya Komisi Transaksi</p>
          </div>
          <div>
            <p className="font-serif text-3xl font-bold tracking-tight text-primary">100%</p>
            <p className="text-xs text-muted-foreground mt-1">QRIS Standard BI (ISBI)</p>
          </div>
          <div>
            <p className="font-serif text-3xl font-bold tracking-tight text-primary">&gt; 3x</p>
            <p className="text-xs text-muted-foreground mt-1">Pembayaran Lebih Cepat</p>
          </div>
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1120px] text-center space-y-12">
          <div className="space-y-4 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Bikin Invoice Cepat, Dibayar Tanpa Ribet
            </h2>
            <p className="text-sm text-muted-foreground">
              Tiga langkah mudah untuk meningkatkan alur kas kerja lepas Anda dengan Nombokin.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={idx} className="relative rounded-xl border border-border bg-card p-6 text-left space-y-4 shadow-xs">
                <span className="font-serif text-4xl font-extrabold text-primary/15 block leading-none">
                  {step.no}
                </span>
                <h3 className="font-serif font-bold text-base text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="fitur" className="border-t border-border/80 px-6 py-20 bg-muted/10 md:py-24">
        <div className="mx-auto max-w-[1120px] space-y-12">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Fitur Lengkap untuk Produktivitas Anda
            </h2>
            <p className="text-sm text-muted-foreground">
              Semua yang Anda butuhkan untuk mengelola penawaran, klien, dan pembayaran tagihan dalam satu dasbor minimalis.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs hover-lift">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/60 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-foreground">
                    {feat.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING TABLE */}
      <section id="harga" className="border-t border-border/80 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1120px] space-y-12">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Pilih Paket Sesuai Kebutuhan Bisnis Anda
            </h2>
            <p className="text-sm text-muted-foreground">
              Harga transparan tanpa komisi transaksi tersembunyi. Mulai gratis, batalkan kapan saja.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-stretch max-w-[960px] mx-auto">
            {/* FREE tier */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs relative">
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">FREE</h3>
                  <p className="text-xs text-muted-foreground mt-1">Untuk pemula & proyek sampingan</p>
                </div>
                <div className="py-2">
                  <span className="font-serif text-3xl font-bold text-foreground">Rp 0</span>
                  <span className="text-xs text-muted-foreground"> / selamanya</span>
                </div>
                <div className="h-px bg-border/85" />
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> 5 invoice / bulan</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Format PDF Stationery Estetik</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Watermark &quot;Dibuat dengan Nombokin&quot;</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> 1 user</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full mt-6">
                <Link href="/register">Mulai Gratis</Link>
              </Button>
            </div>

            {/* PRO tier */}
            <div className="flex flex-col justify-between rounded-xl border-2 border-primary bg-card p-6 shadow-sm relative scale-105 z-10">
              <span className="absolute -top-3 left-[50%] translate-x-[-50%] rounded-full bg-primary px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                TERPOPULER
              </span>
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">PRO</h3>
                  <p className="text-xs text-muted-foreground mt-1">Untuk freelancer profesional & agensi mandiri</p>
                </div>
                <div className="py-2">
                  <span className="font-serif text-3xl font-bold text-foreground">Rp 29.000</span>
                  <span className="text-xs text-muted-foreground"> / bulan</span>
                </div>
                <div className="h-px bg-border/85" />
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> <strong>Unlimited</strong> invoice & penawaran</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Link Bayar Mandiri (QRIS/VA Midtrans)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Tanpa Watermark Nombokin</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Unggah Custom Logo & Signature</li>
                </ul>
              </div>
              <Button asChild className="w-full mt-6 shadow-xs">
                <Link href="/register">Mulai Langganan</Link>
              </Button>
            </div>

            {/* BUSINESS tier */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs relative">
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">BISNIS</h3>
                  <p className="text-xs text-muted-foreground mt-1">Untuk agensi kecil & tim kolaboratif</p>
                </div>
                <div className="py-2">
                  <span className="font-serif text-3xl font-bold text-foreground">Rp 59.000</span>
                  <span className="text-xs text-muted-foreground"> / bulan</span>
                </div>
                <div className="h-px bg-border/85" />
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Semua fitur paket PRO</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Kolaborasi Multi-user (hingga 5 user)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Manajemen hak akses tim</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Dukungan Prioritas WA</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full mt-6">
                <Link href="/register">Pilih Paket Bisnis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-border/80 px-6 py-20 bg-muted/10 md:py-24">
        <div className="mx-auto max-w-[1120px] space-y-12">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Dicintai oleh Ratusan Freelancer
            </h2>
            <p className="text-sm text-muted-foreground">
              Kata mereka yang berhasil meningkatkan kepuasan klien dan cashflow proyek.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="shadow-xs bg-card border-border/80">
              <CardContent className="pt-6 space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground italic">
                  &quot;Sebelumnya saya harus buat PDF di Illustrator lalu tagih manual lewat WA. Sering telat dibayar karena klien mager buka m-Banking. Sekarang klien tinggal scan QRIS lewat hape. Kurang dari 5 menit langsung lunas!&quot;
                </p>
                <div>
                  <p className="text-xs font-bold text-foreground">Raka Pratama</p>
                  <p className="text-[10px] text-muted-foreground">UI/UX Designer Freelance</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-card border-border/80">
              <CardContent className="pt-6 space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground italic">
                  &quot;Nombokin sangat membantu agensi copywriter kami. Fitur konversi penawaran (quotation) menjadi invoice menghemat waktu administrasi kami. Desain templatenya estetik sekali, seperti surat resmi.&quot;
                </p>
                <div>
                  <p className="text-xs font-bold text-foreground">Maya Sari</p>
                  <p className="text-[10px] text-muted-foreground">Co-founder Agensi Kata</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-card border-border/80">
              <CardContent className="pt-6 space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground italic">
                  &quot;Sangat puas dengan fitur integrasi Midtrans yang instan tanpa ribet coding. Untuk freelance developer seperti saya, Nombokin memberikan solusi tagihan paling elegan di Indonesia.&quot;
                </p>
                <div>
                  <p className="text-xs font-bold text-foreground">Budi Santoso</p>
                  <p className="text-[10px] text-muted-foreground">Fullstack Web Developer</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="border-t border-border/80 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[800px] space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-sm text-muted-foreground">
              Punya pertanyaan lain? Kami siap menjawab segala keraguan Anda.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-sm font-semibold">{item.q}</AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/80 bg-card py-12 px-6">
        <div className="mx-auto max-w-[1120px] flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-xs text-muted-foreground">
          <div className="space-y-2">
            <Logo />
            <p className="mt-1">Invoice & Quotation generator instan bergaya stationery khas Indonesia.</p>
          </div>
          
          <div className="flex gap-8">
            <a href="#fitur" className="hover:text-foreground">Fitur</a>
            <a href="#cara-kerja" className="hover:text-foreground">Cara Kerja</a>
            <a href="#harga" className="hover:text-foreground">Harga</a>
          </div>

          <p>&copy; 2026 Nombokin. Semua Hak Dilindungi Undang-Undang.</p>
        </div>
      </footer>
    </div>
  );
}
