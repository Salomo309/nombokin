"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuotation() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== "DRAFT") {
            setError("Dokumen yang telah dikirim atau lunas tidak dapat diubah.");
            return;
          }
          setQuotation(data);
        } else {
          setError("Penawaran tidak ditemukan.");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data penawaran.");
      } finally {
        setLoading(false);
      }
    }
    loadQuotation();
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
            Edit Penawaran
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ubah rincian penawaran {quotation.number}
          </p>
        </div>
        <InvoiceForm type="QUOTATION" initialData={quotation} />
      </div>
    </AppShell>
  );
}
