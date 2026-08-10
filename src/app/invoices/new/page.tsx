"use client";

import { AppShell } from "@/components/layout/AppShell";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

export default function NewInvoicePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Buat Invoice Baru
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Buat rincian tagihan profesional untuk klien Anda.
          </p>
        </div>
        <InvoiceForm type="INVOICE" />
      </div>
    </AppShell>
  );
}
