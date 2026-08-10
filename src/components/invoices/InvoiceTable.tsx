"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Share2,
  FileSignature,
  CreditCard,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatDateShort, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { softDeleteInvoiceAction, duplicateInvoiceAction, convertQuotationToInvoiceAction } from "@/server/actions/invoice";

interface InvoiceTableItem {
  id: string;
  number: string;
  type: "INVOICE" | "QUOTATION";
  status: string;
  issueDate: string | Date;
  dueDate: string | Date;
  total: number | string;
  customer?: {
    name: string;
    company?: string | null;
    whatsapp?: string | null;
  } | null;
  midtransPaymentUrl?: string | null;
}

interface InvoiceTableProps {
  invoices: InvoiceTableItem[];
  type: "INVOICE" | "QUOTATION";
  onRefresh?: () => void;
}

export function InvoiceTable({ invoices, type, onRefresh }: InvoiceTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    try {
      await softDeleteInvoiceAction(id);
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus dokumen");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await duplicateInvoiceAction(id);
      router.push(type === "INVOICE" ? `/invoices/${duplicated.id}/edit` : `/quotations/${duplicated.id}/edit`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menduplikat dokumen");
    }
  };

  const handleConvert = async (id: string) => {
    try {
      const invoice = await convertQuotationToInvoiceAction(id);
      router.push(`/invoices/${invoice.id}`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengkonversi penawaran");
    }
  };

  const handleSendWA = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.waLink) {
          window.open(data.waLink, "_blank");
        } else {
          alert(`Invoice terkirim! Link public: ${data.shareLink}`);
        }
        if (onRefresh) onRefresh();
        else router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground font-semibold">
              <th className="py-3 px-4">No. Dokumen</th>
              <th className="py-3 px-4">Pelanggan</th>
              <th className="py-3 px-4">Tanggal Terbit</th>
              <th className="py-3 px-4">Jatuh Tempo</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  Tidak ada dokumen ditemukan.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const colorConfig = STATUS_COLORS[inv.status] || {
                  bg: "bg-stone-100",
                  text: "text-stone-700",
                  dot: "bg-stone-400",
                };

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-secondary/20 transition-colors text-foreground font-medium"
                  >
                    <td className="py-3.5 px-4 font-serif text-sm font-bold tracking-tight text-ink-dark tabular-nums">
                      {inv.number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {inv.customer?.name ?? "—"}
                        </p>
                        {inv.customer?.company && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {inv.customer.company}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs tabular-nums text-muted-foreground">
                      {formatDateShort(inv.issueDate)}
                    </td>
                    <td className="py-3.5 px-4 text-xs tabular-nums text-muted-foreground">
                      {formatDateShort(inv.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-serif font-bold text-ink-dark tabular-nums">
                      {formatRupiah(parseFloat(inv.total.toString()))}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="stone"
                        className={`${colorConfig.bg} ${colorConfig.text}`}
                        showDot
                        dotColorClass={colorConfig.dot}
                      >
                        {STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={
                                type === "INVOICE"
                                  ? `/invoices/${inv.id}`
                                  : `/quotations/${inv.id}`
                              }
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              Lihat Detail
                            </Link>
                          </DropdownMenuItem>

                          {inv.status === "DRAFT" && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={
                                  type === "INVOICE"
                                    ? `/invoices/${inv.id}/edit`
                                    : `/quotations/${inv.id}/edit`
                                }
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                                Edit Dokumen
                              </Link>
                            </DropdownMenuItem>
                          )}

                          {inv.customer?.whatsapp && inv.status !== "PAID" && (
                            <DropdownMenuItem
                              onClick={() => handleSendWA(inv.id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <MessageSquare className="h-4 w-4 text-emerald-600" />
                              Kirim WA (Pengingat)
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleDuplicate(inv.id)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                            Duplikat
                          </DropdownMenuItem>

                          {type === "QUOTATION" && inv.status !== "PAID" && (
                            <DropdownMenuItem
                              onClick={() => handleConvert(inv.id)}
                              className="flex items-center gap-2 cursor-pointer font-semibold text-primary"
                            >
                              <FileSignature className="h-4 w-4 text-primary" />
                              Konversi ke Invoice
                            </DropdownMenuItem>
                          )}

                          {inv.midtransPaymentUrl && inv.status !== "PAID" && (
                            <DropdownMenuItem asChild>
                              <a
                                href={inv.midtransPaymentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 cursor-pointer text-indigo-600 font-semibold"
                              >
                                <CreditCard className="h-4 w-4" />
                                Link Pembayaran
                              </a>
                            </DropdownMenuItem>
                          )}

                          {inv.status !== "PAID" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(inv.id)}
                                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
