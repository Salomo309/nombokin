"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Copy, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import {
  DocumentData,
  DocumentError,
  DocumentHeader,
  DocumentLoading,
  DocumentPreview,
  ShareCard,
  TimelineCard,
} from "@/components/invoices/DocumentDetail";
import { softDeleteInvoiceAction, duplicateInvoiceAction, convertQuotationToInvoiceAction } from "@/server/actions/invoice";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const confirm = useConfirm();

  const [quotation, setQuotation] = useState<DocumentData | null>(null);
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
        setError("Quotation not found.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load quotation details.");
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
      toast({
        variant: "destructive",
        title: err instanceof Error ? err.message : "Failed to convert quotation",
      });
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
          toast({
            variant: "success",
            title: `Status updated to SENT! Public Link: ${data.shareLink}`,
          });
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
    if (!quotation) return;
    const ok = await confirm({
      title: "Delete quotation?",
      description: "Are you sure you want to delete this quotation?",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await softDeleteInvoiceAction(quotation.id);
      toast({ variant: "success", title: "Quotation deleted successfully" });
      router.push("/quotations");
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: err instanceof Error ? err.message : "Failed to delete quotation",
      });
    }
  };

  const handleDuplicate = async () => {
    if (!quotation) return;
    try {
      const duplicated = await duplicateInvoiceAction(quotation.id);
      router.push(`/quotations/${duplicated.id}/edit`);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: err instanceof Error ? err.message : "Failed to duplicate quotation",
      });
    }
  };

  if (loading) {
    return <DocumentLoading />;
  }

  if (error || !quotation) {
    return <DocumentError message={error || "Quotation not found"} />;
  }

  const isDraft = quotation.status === "DRAFT";

  return (
    <div className="space-y-6">
      <DocumentHeader
        backHref="/quotations"
        title={`Penawaran ${quotation.number}`}
        issueDate={quotation.issueDate}
      >
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
      </DocumentHeader>

      {/* 2-Column Detail Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        <DocumentPreview type="QUOTATION" doc={quotation} />

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

          <ShareCard
            title="Bagikan Penawaran"
            docId={quotation.id}
            shareToken={quotation.shareToken}
            sending={sending}
            onSendWA={handleSendWA}
          />

          <TimelineCard doc={quotation} />
        </div>
      </div>
    </div>
  );
}
