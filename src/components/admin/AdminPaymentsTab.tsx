"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { formatRupiah, STATUS_LABELS } from "@/lib/utils";
import type { AdminPayment } from "./types";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE } from "./types";

export function PaymentsTab() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = payments.length > 0 && payments.every((p) => selectedIds.has(p.id));
  const someSelected = payments.some((p) => selectedIds.has(p.id));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) payments.forEach((p) => next.add(p.id));
      else payments.forEach((p) => next.delete(p.id));
      return next;
    });
  };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      } else {
        setError("Failed to load payment data.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load payment data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const paginated = payments.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Seluruh transaksi pembayaran di platform (hanya baca).
        </p>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Muat Ulang
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-secondary/50" />
          ))}
        </div>
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            Coba Lagi
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-0 px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-muted/95 backdrop-blur">
                  <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-6 w-10">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Pilih semua"
                      />
                    </th>
                    <th className="py-2.5 px-6">Order ID</th>
                    <th className="py-2.5 px-6">Tenant</th>
                    <th className="py-2.5 px-6">Pengguna</th>
                    <th className="py-2.5 px-6">Invoice</th>
                    <th className="py-2.5 px-6">Jenis</th>
                    <th className="py-2.5 px-6">Status</th>
                    <th className="py-2.5 px-6 text-right">Nominal</th>
                    <th className="py-2.5 px-6">Metode</th>
                    <th className="py-2.5 px-6">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        Belum ada transaksi.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="py-3 px-6">
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleRow(p.id)}
                            aria-label={`Pilih ${p.orderId}`}
                          />
                        </td>
                        <td className="py-3 px-6 font-mono text-[11px] text-muted-foreground">
                          {p.orderId}
                        </td>
                        <td className="py-3 px-6 font-medium text-foreground">
                          {p.tenant?.name ?? "â€”"}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {p.user ? `${p.user.name} (${p.user.email})` : "â€”"}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {p.invoice?.number ?? "â€”"}
                        </td>
                        <td className="py-3 px-6">
                          <Badge variant="stone" className="text-[10px] px-2 py-0.5">
                            {p.type === "SUBSCRIPTION" ? "Langganan" : "Invoice"}
                          </Badge>
                        </td>
                        <td className="py-3 px-6">
                          <Badge
                            className={`text-[10px] px-2 py-0.5 ${PAYMENT_STATUS_BADGE[p.status] ?? ""}`}
                          >
                            {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-6 text-right font-serif font-bold tabular-nums">
                          {formatRupiah(p.amount)}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {p.paymentMethod ?? "â€”"}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground tabular-nums">
                          {new Date(p.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
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
      )}

      {/* Pagination */}
      <Pagination page={page} total={payments.length} limit={limit} onPageChange={setPage} />
    </div>
  );
}
