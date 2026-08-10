"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Verify status: Sent/Paid invoices cannot be edited
          if (data.status !== "DRAFT") {
            setError("Dokumen yang telah dikirim atau lunas tidak dapat diubah.");
            return;
          }
          setInvoice(data);
        } else {
          setError("Invoice tidak ditemukan.");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data invoice.");
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-64">
          <Card className="max-w-md w-full border-border">
            <CardHeader className="text-center">
              <CardTitle>Akses Ditolak</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Edit Invoice
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ubah rincian tagihan {invoice.number}
          </p>
        </div>
        <InvoiceForm type="INVOICE" initialData={invoice} />
      </div>
    </AppShell>
  );
}
