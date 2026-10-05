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
  CreditCard,
  CheckCircle2,
  Trash2,
  Copy,
  ChevronRight,
  AlertCircle,
  BellRing,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { PDFPreview } from "@/components/invoices/PDFPreview";
import { InvoiceTimeline } from "@/components/invoices/InvoiceTimeline";
import { formatRupiah, STATUS_LABELS } from "@/lib/utils";
import { softDeleteInvoiceAction, duplicateInvoiceAction } from "@/server/actions/invoice";

interface InvoiceDetail {
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
  midtransPaymentUrl?: string | null;
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

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const confirm = useConfirm();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadInvoice() {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      } else {
        setError("Invoice not found.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleGeneratePaymentLink = async () => {
    if (!invoice) return;
    setGeneratingLink(true);
    try {
      const res = await fetch(`/api/invoices/${id}/payment-link`, {
        method: "POST",
      });
      if (res.ok) {
        await loadInvoice();
      } else {
        const errData = await res.json();
        toast({
          variant: "destructive",
          title: errData.error || "Failed to create payment link",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!invoice) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/invoices/${id}/check-status`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.paid) {
        toast({
          variant: "success",
          title: "Payment verified! Invoice marked as paid.",
        });
        await loadInvoice();
      } else if (res.ok) {
        toast({
          title: `Belum lunas (status: ${data.status || "pending"}). Coba lagi setelah pelanggan membayar.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: data.error || "Failed to check payment status",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Server connection error",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSendWA = async () => {
    if (!invoice) return;
    setSending(true);
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.waLink) {
          window.open(data.waLink, "_blank");
        } else {
          toast({
            variant: "success",
            title: `Status updated to SENT! Public Link: ${data.shareLink}`,
          });
        }
        await loadInvoice();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleRemind = async () => {
    if (!invoice) return;
    setReminding(true);
    try {
      const res = await fetch(`/api/invoices/${id}/remind`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.waLink) {
          window.open(data.waLink, "_blank");
        } else {
          toast({ variant: "success", title: "Reminder email sent to the customer!" });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReminding(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    const ok = await confirm({
      title: "Delete invoice?",
      description: "Are you sure you want to delete this invoice?",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await softDeleteInvoiceAction(invoice.id);
      toast({ variant: "success", title: "Invoice deleted successfully" });
      router.push("/invoices");
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: err instanceof Error ? err.message : "Failed to delete invoice",
      });
    }
  };

  const handleDuplicate = async () => {
    if (!invoice) return;
    try {
      const duplicated = await duplicateInvoiceAction(invoice.id);
      router.push(`/invoices/${duplicated.id}/edit`);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: err instanceof Error ? err.message : "Failed to duplicate invoice",
      });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!invoice || status === invoice.status) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          variant: "success",
          title: `Status updated to ${STATUS_LABELS[status] ?? status}`,
        });
        await loadInvoice();
      } else {
        toast({
          variant: "destructive",
          title: data.error || "Failed to update status",
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to update status" });
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (

        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
  
    );
  }

  if (error || !invoice) {
    return (

        <div className="flex justify-center items-center h-64">
          <Card className="max-w-md w-full border-border">
            <CardHeader className="text-center">
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>{error || "Invoice not found"}</CardDescription>
            </CardHeader>
          </Card>
        </div>
  
    );
  }

  const isDraft = invoice.status === "DRAFT";
  const isPaid = invoice.status === "PAID";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicShareLink = `${appUrl}/i/${invoice.shareToken}`;

  return (
    <div className="space-y-6">
        {/* Top Header Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/invoices">
                <ArrowLeft className="h-4.5 w-4.5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Invoice {invoice.number}
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tanggal Terbit: {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(invoice.issueDate))}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={invoice.status}
              onValueChange={handleStatusChange}
              disabled={changingStatus}
            >
              <SelectTrigger className="h-9 w-40 text-xs" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(STATUS_LABELS).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isDraft && (
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Edit className="h-4 w-4" /> Edit Draf
                </Link>
              </Button>
            )}
            <Button onClick={handleDuplicate} variant="outline" size="sm" className="gap-1.5 text-xs">
              <Copy className="h-4 w-4" /> Duplikat
            </Button>
            {!isPaid && (
              <Button onClick={handleDelete} variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:bg-red-50/50">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column Detail Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          
          {/* LEFT: HTML Paper Sheet Preview */}
          <div className="lg:col-span-8 flex justify-center w-full">
            <PDFPreview
              type="INVOICE"
              number={invoice.number}
              tenantName={invoice.tenant.name}
              letterheadSignature={invoice.tenant.letterheadSignature || ""}
              customerName={invoice.customer?.name}
              customerCompany={invoice.customer?.company || ""}
              customerEmail={invoice.customer?.email || ""}
              customerWhatsapp={invoice.customer?.whatsapp || ""}
              issueDate={invoice.issueDate}
              dueDate={invoice.dueDate}
              items={invoice.items as any}
              discountPercent={invoice.discountPercent}
              taxPercent={invoice.taxPercent}
              notes={invoice.notes || ""}
              terms={invoice.terms || ""}
              status={invoice.status}
              isWatermarked={invoice.tenant.subscription?.tier === "FREE"}
            />
          </div>

          {/* RIGHT: Actions & Info sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Payment Link Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">Link Pembayaran</CardTitle>
                <CardDescription className="text-[11px] mt-0.5">
                  Gunakan QRIS instan dari Midtrans Snap
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.midtransPaymentUrl ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-orange-50 border border-orange-200/50 p-3 flex items-center justify-between text-xs text-primary font-semibold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        QRIS / VA Aktif
                      </span>
                      <a
                        href={invoice.midtransPaymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-0.5 hover:underline text-primary"
                      >
                        Lihat <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    
                    {!isPaid && (
                      <Button
                        onClick={handleCheckStatus}
                        disabled={checkingStatus}
                        variant="outline"
                        className="w-full gap-2 text-xs"
                      >
                        <RefreshCw className={`h-4 w-4 ${checkingStatus ? "animate-spin" : ""}`} /> {checkingStatus ? "Mengecek..." : "Cek Status Bayar"}
                      </Button>
                    )}

                    {!isPaid && (
                      <Button
                        onClick={handleRemind}
                        disabled={reminding}
                        variant="outline"
                        className="w-full gap-2 text-xs"
                      >
                        <BellRing className="h-4 w-4" /> {reminding ? "Mengirim..." : "Kirim Pengingat Ulang"}
                      </Button>
                    )}
                  </div>
                ) : invoice.tenant.subscription?.tier === "FREE" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-secondary/40 border border-border/60 p-3.5 text-xs text-muted-foreground leading-normal">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                      <span>Link bayar QRIS/VA khusus paket PRO ke atas.</span>
                    </div>
                    <Button asChild variant="outline" className="w-full gap-2 text-xs">
                      <Link href="/settings?tab=langganan">
                        <CreditCard className="h-4 w-4" /> Upgrade ke PRO
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-secondary/40 border border-border/60 p-3.5 text-xs text-muted-foreground leading-normal">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                      <span>Belum ada link bayar online. Klik tombol untuk membuat.</span>
                    </div>
                    <Button
                      onClick={handleGeneratePaymentLink}
                      disabled={generatingLink}
                      className="w-full gap-2 text-xs shadow-xs"
                    >
                      <CreditCard className="h-4 w-4" />
                      {generatingLink ? "Membuat..." : "Buat Link QRIS Instan"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Share Buttons */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bagikan Invoice</CardTitle>
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
                  <a href={`/api/invoices/${invoice.id}/pdf`} download>
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
                        toast({ variant: "success", title: "Link copied successfully!" });
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
                  status={invoice.status}
                  createdAt={invoice.createdAt}
                  sentAt={invoice.sentAt}
                  paidAt={invoice.paidAt}
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

  );
}
