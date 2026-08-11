"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, Download, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { PDFPreview } from "@/components/invoices/PDFPreview";
import { formatRupiah } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface PublicInvoice {
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
  items: InvoiceItem[];
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
    watermarkText?: string;
    subscription: {
      tier: string;
    };
  };
}

export default function PublicInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.shareToken as string;

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/i/${shareToken}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        } else {
          setError("Invoice tidak ditemukan atau telah dihapus.");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat detail invoice.");
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [shareToken]);

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    setError(null);

    try {
      const res = await fetch(`/api/i/${shareToken}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Midtrans Snap Payment page
        window.location.href = data.paymentUrl;
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Gagal memproses pembayaran");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan koneksi server.");
    } finally {
      setPaying(false);
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      // In a real flow we can fetch the PDF stream via download, but since downloading PDF requires authentication inside /api/invoices/[id]/pdf, 
      // let's check. Is downloading PDF public? Yes! We should make downloading PDF public using the shareToken too!
      // To simplify, let's create a public PDF download endpoint or let them download the public PDF.
      // Wait, let's implement a public download link: /api/i/[shareToken]/pdf
      window.open(`/api/i/${shareToken}/pdf`, "_blank");
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-serif text-sm text-muted-foreground animate-pulse">
          Memuat tagihan...
        </p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="max-w-md w-full border-border">
          <CardHeader className="text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <CardTitle>Terjadi Kesalahan</CardTitle>
            <CardDescription>{error || "Invoice tidak ditemukan"}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <Button onClick={() => router.push("/")} variant="outline">
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID";
  const isQuotation = invoice.type === "QUOTATION";

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-background text-foreground font-sans px-4 py-8 md:py-16">
      <div className="mx-auto max-w-[1120px] flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT PANEL: The high-fidelity stationery PDF preview */}
        <div className="flex-1 w-full flex justify-center lg:col-span-8">
          <PDFPreview
            type={invoice.type}
            number={invoice.number}
            tenantName={invoice.tenant.name}
            letterheadSignature={invoice.tenant.letterheadSignature || ""}
            customerName={invoice.customer?.name}
            customerCompany={invoice.customer?.company || ""}
            customerEmail={invoice.customer?.email || ""}
            customerWhatsapp={invoice.customer?.whatsapp || ""}
            issueDate={invoice.issueDate}
            dueDate={invoice.dueDate}
            items={invoice.items}
            discountPercent={invoice.discountPercent}
            taxPercent={invoice.taxPercent}
            notes={invoice.notes || ""}
            terms={invoice.terms || ""}
            status={invoice.status}
            isWatermarked={invoice.tenant.subscription?.tier === "FREE"}
          />
        </div>

        {/* RIGHT PANEL: Quick Action Card */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <Card className="border border-border shadow-xs bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Logo hideText />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nombokin Pay
                </span>
              </div>
              <CardTitle className="text-xl pt-4">Ringkasan Tagihan</CardTitle>
              <CardDescription className="text-xs">
                {invoice.number} dari {invoice.tenant.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-secondary/40 border border-border/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pembayaran</p>
                <p className="font-serif text-2xl font-black text-primary mt-1 tabular-nums">
                  {formatRupiah(invoice.total)}
                </p>
              </div>

              <div className="space-y-3">
                {!isPaid && !isQuotation && (
                  <Button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full gap-2 shadow-xs bg-primary text-primary-foreground hover:bg-primary/95"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4.5 w-4.5" /> Bayar Sekarang (QRIS)
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Download className="h-4.5 w-4.5" /> Unduh Invoice (PDF)
                </Button>
              </div>
            </CardContent>
          </Card>

          {isPaid && (
            <div className="rounded-xl border border-green-200/50 bg-[#ECFDF3] p-4 text-center text-[#15803D] font-semibold text-sm">
              Tagihan ini telah LUNAS terbayar pada{" "}
              {invoice.paidAt ? new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(invoice.paidAt)) : "hari ini"}. Terima kasih!
            </div>
          )}

          {isQuotation && (
            <div className="rounded-xl border border-orange-200/50 bg-orange-50 p-4 text-center text-primary font-semibold text-xs leading-relaxed">
              Dokumen ini merupakan Surat Penawaran (Quotation). Hubungi penyedia jasa untuk melanjutkan ke tahap penagihan invoice.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
