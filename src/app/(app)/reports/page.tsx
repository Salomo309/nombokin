"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Wallet, TrendingUp, AlertTriangle, Users, Loader2, CreditCard } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { getPrice, formatPrice } from "@/lib/pricing";

interface ReportSummary {
  totals: { invoiced: number; paid: number; outstanding: number; invoiceCount: number };
  monthly: Array<{ month: string; label: string; invoiced: number; paid: number }>;
  clientRecap: Array<{
    customerId: string | null;
    name: string;
    invoiced: number;
    paid: number;
    outstanding: number;
    count: number;
  }>;
  aging: Array<{ key: string; label: string; count: number; total: number }>;
  topOutstanding: Array<{
    id: string;
    number: string;
    customer: string;
    dueDate: string;
    daysOverdue: number;
    total: number;
  }>;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reports/summary");
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error("Gagal memuat laporan:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Memuat laporan...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Laporan Bisnis
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rekap pendapatan, piutang & ekspor data.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/60" />
            <div className="space-y-1">
              <p className="font-serif text-lg font-bold text-foreground">Khusus paket BISNIS</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Laporan pendapatan, aging piutang & ekspor CSV tersedia untuk paket BISNIS {formatPrice(getPrice("BUSINESS", "MONTHLY"))}/bulan.
              </p>
            </div>
            <Button asChild size="sm" className="gap-1.5 text-xs shadow-xs">
              <Link href="/settings?tab=langganan">Lihat Paket Bisnis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const t = data?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Laporan Bisnis
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rekap pendapatan, piutang & ekspor data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => { window.location.href = "/api/reports/export?type=invoices"; }}
          >
            <Download className="h-4 w-4" /> CSV Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => { window.location.href = "/api/reports/export?type=payments"; }}
          >
            <Download className="h-4 w-4" /> CSV Pembayaran
          </Button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Ditagihkan
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-xl font-bold text-foreground tabular-nums">
              {formatRupiah(t?.invoiced || 0)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t?.invoiceCount || 0} invoice
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Lunas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-xl font-bold text-success tabular-nums">
              {formatRupiah(t?.paid || 0)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Pendapatan diterima</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Piutang
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-xl font-bold text-destructive tabular-nums">
              {formatRupiah(t?.outstanding || 0)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Belum dibayar klien</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arus 6 Bulan Terakhir</CardTitle>
          <CardDescription className="text-[11px] mt-0.5">
            Nilai ditagihkan vs dilunasi per bulan.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.monthly || []}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}rb`} />
              <Tooltip formatter={(v: number) => formatRupiah(Number(v) || 0)} />
              <Bar dataKey="invoiced" name="Ditagihkan" fill="var(--muted-foreground)" opacity={0.45} radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Lunas" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        {/* Aging */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging Piutang</CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              Tagihan terkirim/belum lunas per usia keterlambatan.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-border/60">
                {(data?.aging || []).map((b) => (
                  <tr key={b.key}>
                    <td className="py-2.5 px-6 font-semibold text-foreground">{b.label}</td>
                    <td className="py-2.5 px-6 text-right tabular-nums text-muted-foreground">{b.count} invoice</td>
                    <td className="py-2.5 px-6 text-right font-serif font-bold text-foreground tabular-nums">
                      {formatRupiah(b.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Per-client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Rekap per Klien
            </CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              Diurutkan dari piutang terbesar.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {(data?.clientRecap.length ?? 0) === 0 ? (
              <p className="px-6 pb-6 text-xs text-muted-foreground">Belum ada data.</p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-semibold bg-muted/10">
                      <th className="py-2.5 px-6">Klien</th>
                      <th className="py-2.5 px-6 text-right">Tagihan</th>
                      <th className="py-2.5 px-6 text-right">Piutang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(data?.clientRecap || []).map((c) => (
                      <tr key={c.customerId ?? "none"}>
                        <td className="py-2.5 px-6">
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.count} invoice</p>
                        </td>
                        <td className="py-2.5 px-6 text-right tabular-nums text-muted-foreground">
                          {formatRupiah(c.invoiced)}
                        </td>
                        <td className="py-2.5 px-6 text-right font-serif font-bold tabular-nums text-destructive">
                          {formatRupiah(c.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top outstanding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Piutang Terbesar</CardTitle>
          <CardDescription className="text-[11px] mt-0.5">
            10 tagihan belum lunas dengan nilai tertinggi — kejar dulu yang ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {(data?.topOutstanding.length ?? 0) === 0 ? (
            <p className="px-6 pb-6 text-xs text-muted-foreground">Tidak ada piutang. Kerja bagus!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-semibold bg-muted/10">
                    <th className="py-2.5 px-6">No. Tagihan</th>
                    <th className="py-2.5 px-6">Klien</th>
                    <th className="py-2.5 px-6">Jatuh Tempo</th>
                    <th className="py-2.5 px-6 text-right">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(data?.topOutstanding || []).map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5 px-6 font-serif font-bold text-foreground tabular-nums">{o.number}</td>
                      <td className="py-2.5 px-6 text-foreground">{o.customer}</td>
                      <td className="py-2.5 px-6 tabular-nums text-muted-foreground">
                        {new Date(o.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {o.daysOverdue > 0 && (
                          <span className="text-destructive font-semibold"> (+{o.daysOverdue} hari)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-6 text-right font-serif font-bold text-foreground tabular-nums">
                        {formatRupiah(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
