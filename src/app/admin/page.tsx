"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Users,
  Building2,
  FileText,
  Receipt,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, STATUS_LABELS, TIER_LABELS } from "@/lib/utils";

interface AdminStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalUsers: number;
  totalTenants: number;
  totalInvoices: number;
  totalPayments: number;
  recentPayments: Array<{
    id: string;
    orderId: string;
    type: "SUBSCRIPTION" | "INVOICE";
    amount: number;
    createdAt: string;
    tenant: { name: string } | null;
  }>;
  invoiceBreakdown: Array<{ status: string; _count: number }>;
  tierBreakdown: Array<{ tier: string; _count: number }>;
  revenueByMonth: Array<{ month: string; amount: number }>;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  SUCCESS: "Sukses",
  CANCELLED: "Dibatalkan",
  FAILED: "Gagal",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats({
            ...data,
            totalRevenue: parseFloat(data.totalRevenue ?? "0"),
            revenueThisMonth: parseFloat(data.revenueThisMonth ?? "0"),
          });
        } else if (res.status === 403) {
          setError("Anda tidak memiliki akses ke halaman ini.");
        } else {
          setError("Gagal memuat data.");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-secondary/80" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary/60" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-secondary/40" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <p className="font-serif text-base font-bold text-foreground">Akses Ditolak</p>
          <p>{error}</p>
          <Link href="/dashboard" className="text-primary underline">
            Kembali ke Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  const invoiceTotal = stats?.invoiceBreakdown.reduce((s, b) => s + b._count, 0) ?? 0;
  const tierTotal = stats?.tierBreakdown.reduce((s, b) => s + b._count, 0) ?? 0;

  const statCards = [
    {
      label: "Total Pendapatan",
      value: formatRupiah(stats?.totalRevenue ?? 0),
      sub: "Semua pembayaran sukses",
      icon: Wallet,
      color: "text-[#15803D]",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: formatRupiah(stats?.revenueThisMonth ?? 0),
      sub: "Sejak 1 bulan terakhir",
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Total Pengguna",
      value: String(stats?.totalUsers ?? 0),
      sub: "Semua akun terdaftar",
      icon: Users,
      color: "text-ink-dark",
    },
    {
      label: "Total Tenant",
      value: String(stats?.totalTenants ?? 0),
      sub: "Bisnis terdaftar",
      icon: Building2,
      color: "text-ink-dark",
    },
    {
      label: "Total Invoice",
      value: String(stats?.totalInvoices ?? 0),
      sub: "Dokumen aktif",
      icon: FileText,
      color: "text-ink-dark",
    },
    {
      label: "Total Pembayaran",
      value: String(stats?.totalPayments ?? 0),
      sub: "Termasuk pending & batal",
      icon: Receipt,
      color: "text-ink-dark",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Dashboard Admin
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan pendapatan, pengguna, dan aktivitas seluruh platform.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                    {s.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="font-serif text-xl font-bold text-ink-dark tabular-nums">
                    {s.value}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Revenue Chart + Breakdowns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 border-b border-border/80">
              <CardTitle className="text-base">Pendapatan 6 Bulan Terakhir</CardTitle>
              <CardDescription className="text-[11px] mt-0.5">
                Total pembayaran sukses per bulan
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.revenueByMonth ?? []}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip formatter={(v) => formatRupiah(Number(v))} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="amount" fill="#C2410C" radius={[4, 4, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Invoice by status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Invoice per Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                {(stats?.invoiceBreakdown ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Belum ada data.</p>
                )}
                {(stats?.invoiceBreakdown ?? []).map((b) => (
                  <div key={b.status} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                    <span className="font-serif font-bold tabular-nums">{b._count}</span>
                  </div>
                ))}
                <div className="border-t border-border/60 pt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Total</span>
                  <span className="font-serif font-bold tabular-nums">{invoiceTotal}</span>
                </div>
              </CardContent>
            </Card>

            {/* Subscription tiers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Langganan Aktif per Tier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                {(stats?.tierBreakdown ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Belum ada data.</p>
                )}
                {(stats?.tierBreakdown ?? []).map((b) => (
                  <div key={b.tier} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{TIER_LABELS[b.tier] ?? b.tier}</span>
                    <span className="font-serif font-bold tabular-nums">{b._count}</span>
                  </div>
                ))}
                <div className="border-t border-border/60 pt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Total</span>
                  <span className="font-serif font-bold tabular-nums">{tierTotal}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/80">
            <div>
              <CardTitle className="text-base">Pembayaran Terbaru</CardTitle>
              <CardDescription className="text-[11px] mt-0.5">
                Transaksi sukses terakhir di seluruh platform
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-semibold bg-muted/10">
                    <th className="py-2.5 px-6">Order</th>
                    <th className="py-2.5 px-6">Tenant</th>
                    <th className="py-2.5 px-6">Jenis</th>
                    <th className="py-2.5 px-6 text-right">Nominal</th>
                    <th className="py-2.5 px-6">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(stats?.recentPayments ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Belum ada pembayaran.
                      </td>
                    </tr>
                  ) : (
                    (stats?.recentPayments ?? []).map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="py-3 px-6 font-mono text-[11px] text-muted-foreground">
                          {p.orderId}
                        </td>
                        <td className="py-3 px-6 font-medium text-foreground">
                          {p.tenant?.name ?? "—"}
                        </td>
                        <td className="py-3 px-6">
                          <Badge variant="stone" className="text-[10px] px-2 py-0.5">
                            {p.type === "SUBSCRIPTION" ? "Langganan" : "Invoice"}
                          </Badge>
                        </td>
                        <td className="py-3 px-6 text-right font-serif font-bold tabular-nums">
                          {formatRupiah(p.amount)}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground tabular-nums">
                          {new Date(p.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
