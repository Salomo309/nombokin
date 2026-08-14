"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [total, setTotal] = useState(0);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 10;

  async function loadQuotations() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        type: "QUOTATION",
        status,
        search,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/invoices?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuotations(data.invoices);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Gagal memuat penawaran:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotations();
  }, [status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadQuotations();
  };

  return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Surat Penawaran (Quotation)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Buat penawaran proyek, kirim ke klien, lalu konversikan ke invoice dalam satu klik.
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5 text-xs shadow-xs">
            <Link href="/quotations/new">
              <Plus className="h-4 w-4" /> Buat Penawaran Baru
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

        {/* Quotation List Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center border border-border/80 bg-card rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Memuat daftar penawaran...</p>
            </div>
          </div>
        ) : (
          <InvoiceTable
            invoices={quotations}
            type="QUOTATION"
            onRefresh={loadQuotations}
          />
        )}

        {/* Pagination */}
        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
  );
}
