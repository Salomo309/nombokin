"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatRupiah, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  unpaidTotal: number;
  paidTotal: number;
  quotationCount: number;
  invoiceCountThisMonth: number;
  invoiceLimit: number;
  recentInvoices: Array<{
    id: string;
    number: string;
    type: "INVOICE" | "QUOTATION";
    status: string;
    total: number;
    customer: {
      name: string;
    } | null;
    issueDate: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Let's call /api/invoices to calculate stats dynamically
        const res = await fetch("/api/invoices?limit=100");
        if (res.ok) {
          const data = await res.json();
          const list = data.invoices as Array<any>;
          
          // Filter & Aggregate
          const unpaid = list
            .filter((i) => i.type === "INVOICE" && i.status !== "PAID")
            .reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);

          const paid = list
            .filter((i) => i.type === "INVOICE" && i.status === "PAID")
            .reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);

          const quotations = list.filter((i) => i.type === "QUOTATION" && i.status !== "CANCELLED").length;

          // Simple mockup limits
          const limit = 5;
          const countThisMonth = list.filter((i) => {
            const date = new Date(i.createdAt);
            const now = new Date();
            return (
              i.type === "INVOICE" &&
              date.getMonth() === now.getMonth() &&
              date.getFullYear() === now.getFullYear()
            );
          }).length;

          setStats({
            unpaidTotal: unpaid,
            paidTotal: paid,
            quotationCount: quotations,
            invoiceCountThisMonth: countThisMonth,
            invoiceLimit: limit,
            recentInvoices: list.slice(0, 5),
          });
        }
      } catch (err) {
        console.error("Gagal memuat statistik dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-secondary/80" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary/60" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-secondary/40" />
        </div>
      </AppShell>
    );
  }

  const limitPercent = stats
    ? Math.min((stats.invoiceCountThisMonth / stats.invoiceLimit) * 100, 100)
    : 0;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Ikhtisar Bisnis
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pantau status penagihan dan pembayaran secara real-time.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <Link href="/quotations/new">
                <Plus className="h-4 w-4" /> Penawaran Baru
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 text-xs shadow-xs">
              <Link href="/invoices/new">
                <Plus className="h-4 w-4" /> Invoice Baru
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Belum Dibayar
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-serif text-xl font-bold text-ink-dark tabular-nums">
                {formatRupiah(stats?.unpaidTotal || 0)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Outstanding invoice aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Lunas Bulan Ini
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="font-serif text-xl font-bold text-[#15803D] tabular-nums">
                {formatRupiah(stats?.paidTotal || 0)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Pendapatan terverifikasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Penawaran Aktif
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="font-serif text-xl font-bold text-ink-dark tabular-nums">
                {stats?.quotationCount || 0}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Quotation menunggu persetujuan
              </p>
            </CardContent>
          </Card>

          {/* Usage Limit Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Batas Invoice Bulanan
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="font-serif text-xl font-bold text-ink-dark tabular-nums">
                  {stats?.invoiceCountThisMonth || 0} / {stats?.invoiceLimit || 5}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {Math.round(limitPercent)}%
                </span>
              </div>
              <Progress value={limitPercent} className="h-1.5" />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Panel: Recent Invoices & Quick Links */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Invoices Table (Left/Mid) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/80">
              <div>
                <CardTitle className="text-base">Dokumen Terbaru</CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Aktivitas penagihan terakhir Anda
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/invoices">
                  Semua Dokumen <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-4 px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-semibold bg-muted/10">
                      <th className="py-2.5 px-6">No. Tagihan</th>
                      <th className="py-2.5 px-6">Klien</th>
                      <th className="py-2.5 px-6 text-right">Total</th>
                      <th className="py-2.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {!stats || stats.recentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          Belum ada aktivitas penagihan.
                        </td>
                      </tr>
                    ) : (
                      stats.recentInvoices.map((inv) => {
                        const colors = STATUS_COLORS[inv.status] || {
                          bg: "bg-stone-100",
                          text: "text-stone-700",
                          dot: "bg-stone-400",
                        };
                        return (
                          <tr key={inv.id} className="hover:bg-secondary/15 transition-colors">
                            <td className="py-3 px-6 font-serif font-bold text-ink-dark tabular-nums">
                              <Link
                                href={inv.type === "INVOICE" ? `/invoices/${inv.id}` : `/quotations/${inv.id}`}
                                className="hover:underline flex items-center gap-1 text-primary"
                              >
                                {inv.number} <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </td>
                            <td className="py-3 px-6 font-medium text-foreground">
                              {inv.customer?.name ?? "—"}
                            </td>
                            <td className="py-3 px-6 text-right font-serif font-bold tabular-nums">
                              {formatRupiah(inv.total)}
                            </td>
                            <td className="py-3 px-6">
                              <Badge
                                variant="stone"
                                className={`${colors.bg} ${colors.text} text-[10px] px-2 py-0.5`}
                                showDot
                                dotColorClass={colors.dot}
                              >
                                {STATUS_LABELS[inv.status] || inv.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips & Resources (Right) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Panduan Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-foreground text-xs">
                    1. Hubungkan Akun Midtrans
                  </h4>
                  <p>
                    Buka <strong>Pengaturan &gt; Pembayaran</strong> untuk memasukkan Server Key Midtrans Anda agar pembayaran QRIS aktif.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-foreground text-xs">
                    2. Buat & Kirim Tagihan
                  </h4>
                  <p>
                    Gunakan tombol &quot;Invoice Baru&quot;, isi detail pekerjaan, lalu klik tombol kirim via WhatsApp ke nomor klien.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-foreground text-xs">
                    3. Klien Melakukan Scan
                  </h4>
                  <p>
                    Klien Anda cukup membuka link public invoice, scan QRIS menggunakan GoPay/OVO/m-Banking, dan invoice otomatis LUNAS.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
