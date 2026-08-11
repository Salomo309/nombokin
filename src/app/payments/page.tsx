"use client";

import { useEffect, useState } from "react";
import { Wallet, CreditCard, Receipt, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";

interface PaymentRecord {
  id: string;
  orderId: string;
  type: "SUBSCRIPTION" | "INVOICE";
  status: "PENDING" | "SUCCESS" | "CANCELLED" | "FAILED";
  amount: string;
  tier?: string | null;
  interval?: string | null;
  description?: string | null;
  transactionId?: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
  invoice?: { number: string } | null;
}

const PAYMENT_STATUS_META: Record<
  string,
  { label: string; badge: string; text: string }
> = {
  SUCCESS: { label: "Sukses", badge: "bg-[#ECFDF3]", text: "text-[#15803D]" },
  PENDING: { label: "Menunggu", badge: "bg-amber-50", text: "text-amber-700" },
  CANCELLED: { label: "Dibatalkan", badge: "bg-stone-100", text: "text-stone-500" },
  FAILED: { label: "Gagal", badge: "bg-red-50", text: "text-red-700" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [totalSuccess, setTotalSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/payments");
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments);
          setTotalSuccess(data.totalSuccess);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const summaryCards = [
    {
      label: "Total Pembayaran Sukses",
      value: formatRupiah(totalSuccess),
      icon: Wallet,
      color: "text-[#15803D]",
    },
    {
      label: "Jumlah Transaksi",
      value: String(payments?.length ?? 0),
      icon: Receipt,
      color: "text-primary",
    },
    {
      label: "Transaksi Langganan",
      value: String(payments?.filter((p) => p.type === "SUBSCRIPTION").length ?? 0),
      icon: CreditCard,
      color: "text-ink-dark",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Riwayat Pembayaran
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Catatan seluruh transaksi langganan dan pembayaran invoice.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map((s) => {
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
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader className="pb-2 border-b border-border/80">
            <CardTitle className="text-base">Riwayat Transaksi</CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              50 transaksi terakhir
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-0 pb-0">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-semibold bg-muted/10">
                      <th className="py-2.5 px-6">Deskripsi</th>
                      <th className="py-2.5 px-6">Order ID</th>
                      <th className="py-2.5 px-6">Oleh</th>
                      <th className="py-2.5 px-6 text-right">Nominal</th>
                      <th className="py-2.5 px-6">Status</th>
                      <th className="py-2.5 px-6">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {!payments || payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-muted-foreground">
                          Belum ada transaksi pembayaran.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => {
                        const meta = PAYMENT_STATUS_META[p.status] ?? {
                          label: p.status,
                          badge: "bg-stone-100",
                          text: "text-stone-600",
                        };
                        return (
                          <tr key={p.id} className="hover:bg-secondary/15 transition-colors">
                            <td className="py-3 px-6 font-medium text-foreground">
                              {p.description ?? (p.type === "SUBSCRIPTION" ? "Langganan" : "Invoice")}
                              {p.invoice?.number && (
                                <span className="text-muted-foreground font-mono ml-1">
                                  ({p.invoice.number})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-6 font-mono text-[11px] text-muted-foreground">
                              {p.orderId}
                            </td>
                            <td className="py-3 px-6 text-muted-foreground">
                              {p.user?.name ?? "—"}
                            </td>
                            <td className="py-3 px-6 text-right font-serif font-bold tabular-nums">
                              {formatRupiah(p.amount)}
                            </td>
                            <td className="py-3 px-6">
                              <Badge
                                variant="stone"
                                className={`${meta.badge} ${meta.text} text-[10px] px-2 py-0.5`}
                              >
                                {meta.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-6 text-muted-foreground tabular-nums">
                              {new Date(p.createdAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
