"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, FileText, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [total, setTotal] = useState(0);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 20;

  async function loadInvoices() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        type: "INVOICE",
        status,
        search,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/invoices?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Gagal memuat invoice:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, [status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadInvoices();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Tagihan Invoice
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola penagihan jasa, lacak status pembayaran, dan kirim pengingat ke klien.
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5 text-xs shadow-xs">
            <Link href="/invoices/new">
              <Plus className="h-4 w-4" /> Buat Invoice Baru
            </Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <Tabs value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="ALL">Semua</TabsTrigger>
              <TabsTrigger value="DRAFT">Draf</TabsTrigger>
              <TabsTrigger value="SENT">Terkirim</TabsTrigger>
              <TabsTrigger value="PAID">Lunas</TabsTrigger>
              <TabsTrigger value="OVERDUE">Terlambat</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor, nama klien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-10 px-3 shrink-0">
              Cari
            </Button>
          </form>
        </div>

        {/* Invoice List Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center border border-border/80 bg-card rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Memuat daftar invoice...</p>
            </div>
          </div>
        ) : (
          <InvoiceTable
            invoices={invoices}
            type="INVOICE"
            onRefresh={loadInvoices}
          />
        )}

        {/* Simple pagination */}
        {total > limit && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="text-xs"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              className="text-xs"
            >
              Berikutnya
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
