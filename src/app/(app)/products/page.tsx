"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, RefreshCw, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { formatRupiah } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: string | number;
  active: boolean;
}

export default function ProductsPage() {
  const confirm = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Gagal memuat produk:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setUnitPrice("");
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || "");
    setUnitPrice(String(p.unitPrice));
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete product?",
      description: "Are you sure you want to delete this product? Products already used in invoices are not affected.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ variant: "success", title: "Product deleted successfully" });
        loadProducts();
      } else {
        toast({ variant: "destructive", title: "Failed to delete product" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to delete product" });
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      if (res.ok) {
        toast({
          variant: "success",
          title: p.active ? "Product deactivated" : "Product activated",
        });
        loadProducts();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to change product status" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Product name is required");
      return;
    }
    if (unitPrice === "" || Number(unitPrice) < 0) {
      setFormError("Price cannot be negative");
      return;
    }

    setSaving(true);
    setFormError(null);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      unitPrice: Number(unitPrice),
    };

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        toast({
          variant: "success",
          title: editingProduct ? "Product updated successfully" : "Product created successfully",
        });
        loadProducts();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to save product");
      }
    } catch (err) {
      setFormError("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const someSelected = filtered.some((p) => selectedIds.has(p.id));

  const toggleAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) filtered.forEach((p) => next.add(p.id));
      else filtered.forEach((p) => next.delete(p.id));
      return next;
    });
  };

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Master Produk
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Simpan daftar jasa / produk untuk dipilih cepat saat membuat invoice atau penawaran.
          </p>
        </div>
        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 text-xs shadow-xs">
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-xs relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau deskripsi produk..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 h-10 text-xs"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border border-dashed border-border rounded-xl m-4 p-12 text-center text-muted-foreground text-xs">
              <Package className="h-8 w-8 text-muted-foreground/50" />
              {products.length === 0
                ? "Belum ada produk. Klik \"Tambah Produk\" untuk membuat data pertama."
                : "Tidak ada produk yang cocok dengan pencarian."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Pilih semua"
                      />
                    </th>
                    <th className="px-4 py-3 font-bold">Nama Produk</th>
                    <th className="px-4 py-3 font-bold hidden md:table-cell">Deskripsi</th>
                    <th className="px-4 py-3 font-bold text-right">Harga Satuan</th>
                    <th className="px-4 py-3 font-bold text-center">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleRow(p.id)}
                          aria-label={`Pilih ${p.name}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[280px] truncate">
                        {p.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatRupiah(p.unitPrice)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            p.active
                              ? "bg-green-100 text-green-700 hover:bg-green-200/60"
                              : "bg-muted text-muted-foreground hover:bg-muted/60"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${p.active ? "bg-green-600" : "bg-muted-foreground/60"}`} />
                          {p.active ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination page={page} total={filtered.length} limit={limit} onPageChange={setPage} />

      {/* Add / Edit Product Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                Produk ini akan muncul sebagai pilihan cepat saat membuat invoice / penawaran.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Nama Produk / Jasa *
                </label>
                <Input
                  placeholder="Contoh: Jasa Desain Logo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Deskripsi
                </label>
                <Input
                  placeholder="Keterangan opsional (akan jadi deskripsi item)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Harga Satuan (Rp) *
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Contoh: 250000"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
              </div>
              {formError && (
                <p className="text-xs font-semibold text-red-600">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="shadow-xs">
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
