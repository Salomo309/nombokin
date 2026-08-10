"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Download,
  MessageSquare,
  RefreshCw,
  Trash2,
  Copy,
  FileSignature,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PDFPreview } from "@/components/invoices/PDFPreview";
import { InvoiceTimeline } from "@/components/invoices/InvoiceTimeline";
import { formatRupiah } from "@/lib/utils";
import { softDeleteInvoiceAction, duplicateInvoiceAction, convertQuotationToInvoiceAction } from "@/server/actions/invoice";

interface QuotationDetail {
  id: string;
  number: string;
  type: "INVOICE" | "QUOTATION";
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  items: any[];
  shareToken: string;
  createdAt: string;
  sentAt?: string | null;
  paidAt?: string | null;
  customer?: {
    name: string;
    company?: string | null;
    email?: string | null;
    whatsapp?: string | null;
  } | null;
  tenant: {
    name: string;
    logoUrl?: string | null;
    letterheadSignature?: string | null;
    subscription: {
      tier: string;
    };
  };
}

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadQuotation() {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuotation(data);
      } else {
        setError("Penawaran tidak ditemukan.");
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat detail penawaran.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotation();
  }, [id]);

  const handleConvert = async () => {
    if (!quotation) return;
    setConverting(true);
    try {
      const invoice = await convertQuotationToInvoiceAction(quotation.id);
      router.push(`/invoices/${invoice.id}`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengkonversi penawaran");
    } finally {
      setConverting(false);
    }
  };

  const handleSendWA = async () => {
    if (!quotation) return;
    setSending(true);
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.waLink) {
          window.open(data.waLink, "_blank");
        } else {
          alert(`Status terupdate menjadi SENT! Public Link: ${data.shareLink}`);
        }
        await loadQuotation();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!quotation || !confirm("Apakah Anda yakin ingin menghapus penawaran ini?")) return;
    try {
      await softDeleteInvoiceAction(quotation.id);
      router.push("/quotations");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus penawaran");
    }
  };

  const handleDuplicate = async () => {
    if (!quotation) return;
    try {
      const duplicated = await duplicateInvoiceAction(quotation.id);
      router.push(`/quotations/${duplicated.id}/edit`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menduplikat penawaran");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (error || !quotation) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-64">
          <Card className="max-w-md w-full border-border">
            <CardHeader className="text-center">
              <CardTitle>Terjadi Kesalahan</CardTitle>
              <CardDescription>{error || "Penawaran tidak ditemukan"}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  const isDraft = quotation.status === "DRAFT";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicShareLink = `${appUrl}/i/${quotation.shareToken}`;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/quotations">
                <ArrowLeft className="h-4.5 w-4.5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-ink-dark">
                  Penawaran {quotation.number}
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tanggal Terbit: {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(quotation.issueDate))}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isDraft && (
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href={`/quotations/${quotation.id}/edit`}>
                  <Edit className="h-4 w-4" /> Edit Draf
                </Link>
              </Button>
            )}
            <Button onClick={handleDuplicate} variant="outline" size="sm" className="gap-1.5 text-xs">
              <Copy className="h-4 w-4" /> Duplikat
            </Button>
            <Button onClick={handleDelete} variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:bg-red-50/50">
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </div>
        </div>

        {/* 2-Column Detail Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          
          {/* LEFT: HTML Paper Sheet Preview */}
          <div className="lg:col-span-8 flex justify-center w-full">
            <PDFPreview
              type="QUOTATION"
              number={quotation.number}
              tenantName={quotation.tenant.name}
              letterheadSignature={quotation.tenant.letterheadSignature || ""}
              customerName={quotation.customer?.name}
              customerCompany={quotation.customer?.company || ""}
              customerEmail={quotation.customer?.email || ""}
              customerWhatsapp={quotation.customer?.whatsapp || ""}
              issueDate={quotation.issueDate}
              dueDate={quotation.dueDate}
              items={quotation.items as any}
              discountPercent={quotation.discountPercent}
              taxPercent={quotation.taxPercent}
              notes={quotation.notes || ""}
              terms={quotation.terms || ""}
              status={quotation.status}
              isWatermarked={quotation.tenant.subscription.tier === "FREE"}
            />
          </div>

          {/* RIGHT: Actions & Info sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Convert to Invoice Action */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">Konversi ke Invoice</CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Salin rincian pekerjaan langsung ke invoice penagihan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleConvert}
                  disabled={converting}
                  className="w-full gap-2 text-xs shadow-xs font-semibold"
                >
                  <FileSignature className="h-4.5 w-4.5" />
                  {converting ? "Mengkonversi..." : "Konversikan Sekarang"}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Share Buttons */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bagikan Penawaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {/* Share WhatsApp */}
                <Button
                  onClick={handleSendWA}
                  disabled={sending}
                  className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  Kirim via WhatsApp
                </Button>

                {/* Direct PDF Download */}
                <Button asChild variant="outline" className="w-full gap-2 text-xs">
                  <a href={`/api/invoices/${quotation.id}/pdf`} download>
                    <Download className="h-4.5 w-4.5" />
                    Unduh PDF Resmi
                  </a>
                </Button>

                {/* Copy public link */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Tautan Publik Klien
                  </p>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      readOnly
                      value={publicShareLink}
                      className="flex-1 rounded-md border border-border bg-secondary/30 px-2 py-1 text-[11px] text-muted-foreground focus:outline-none focus:ring-0"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(publicShareLink);
                        alert("Link berhasil disalin!");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardContent className="pt-6">
                <InvoiceTimeline
                  status={quotation.status}
                  createdAt={quotation.createdAt}
                  sentAt={quotation.sentAt}
                  paidAt={quotation.paidAt}
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
