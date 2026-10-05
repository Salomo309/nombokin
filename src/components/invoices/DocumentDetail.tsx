"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Download, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PDFPreview } from "@/components/invoices/PDFPreview";
import { InvoiceTimeline } from "@/components/invoices/InvoiceTimeline";
import { toast } from "@/components/ui/toast";

// Bentuk data bersama untuk detail invoice & quotation.
export interface DocumentData {
  id: string;
  number: string;
  type: "INVOICE" | "QUOTATION";
  status: string;
  issueDate: string;
  dueDate: string;
  discountPercent: number;
  taxPercent: number;
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
    letterheadSignature?: string | null;
    subscription?: {
      tier: string;
    } | null;
  };
}

export function DocumentLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function DocumentError({ message }: { message: string }) {
  return (
    <div className="flex justify-center items-center h-64">
      <Card className="max-w-md w-full border-border">
        <CardHeader className="text-center">
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

interface DocumentHeaderProps {
  backHref: string;
  title: string;
  issueDate: string;
  children?: React.ReactNode;
}

export function DocumentHeader({ backHref, title, issueDate, children }: DocumentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={backHref}>
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-foreground">{title}</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Tanggal Terbit:{" "}
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(issueDate))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function DocumentPreview({ type, doc }: { type: "INVOICE" | "QUOTATION"; doc: DocumentData }) {
  return (
    <div className="lg:col-span-8 flex justify-center w-full">
      <PDFPreview
        type={type}
        number={doc.number}
        tenantName={doc.tenant.name}
        letterheadSignature={doc.tenant.letterheadSignature || ""}
        customerName={doc.customer?.name}
        customerCompany={doc.customer?.company || ""}
        customerEmail={doc.customer?.email || ""}
        customerWhatsapp={doc.customer?.whatsapp || ""}
        issueDate={doc.issueDate}
        dueDate={doc.dueDate}
        items={doc.items as any}
        discountPercent={doc.discountPercent}
        taxPercent={doc.taxPercent}
        notes={doc.notes || ""}
        terms={doc.terms || ""}
        status={doc.status}
        isWatermarked={doc.tenant.subscription?.tier === "FREE"}
      />
    </div>
  );
}

interface ShareCardProps {
  title: string;
  docId: string;
  shareToken: string;
  sending: boolean;
  onSendWA: () => void;
}

export function ShareCard({ title, docId, shareToken, sending, onSendWA }: ShareCardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicShareLink = `${appUrl}/i/${shareToken}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {/* Share WhatsApp */}
        <Button
          onClick={onSendWA}
          disabled={sending}
          className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          Kirim via WhatsApp
        </Button>

        {/* Direct PDF Download */}
        <Button asChild variant="outline" className="w-full gap-2 text-xs">
          <a href={`/api/invoices/${docId}/pdf`} download>
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
  );
}

export function TimelineCard({ doc }: { doc: DocumentData }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <InvoiceTimeline
          status={doc.status}
          createdAt={doc.createdAt}
          sentAt={doc.sentAt}
          paidAt={doc.paidAt}
        />
      </CardContent>
    </Card>
  );
}
