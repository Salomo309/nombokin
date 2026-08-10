"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, User, Mail, MessageSquare, Briefcase, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createCustomerAction, updateCustomerAction, deleteCustomerAction } from "@/server/actions/customer";

interface Customer {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Gagal memuat pelanggan:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName("");
    setCompany("");
    setEmail("");
    setWhatsapp("");
    setNotes("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setCompany(c.company || "");
    setEmail(c.email || "");
    setWhatsapp(c.whatsapp || "");
    setNotes(c.notes || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pelanggan ini? Riwayat invoice yang terkait tetap dipertahankan.")) return;
    try {
      await deleteCustomerAction(id);
      loadCustomers();
    } catch (err) {
      alert("Gagal menghapus pelanggan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      if (editingCustomer) {
        await updateCustomerAction(editingCustomer.id, {
          name,
          company: company || undefined,
          email: email || undefined,
          whatsapp: whatsapp || undefined,
          notes: notes || undefined,
        });
      } else {
        await createCustomerAction({
          name,
          company: company || undefined,
          email: email || undefined,
          whatsapp: whatsapp || undefined,
          notes: notes || undefined,
        });
      }
      setIsDialogOpen(false);
      loadCustomers();
    } catch (err) {
      alert("Gagal menyimpan data pelanggan");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Daftar Pelanggan
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simpan dan kelola data kontak klien untuk mempermudah pembuatan invoice/quotation.
            </p>
          </div>
          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 text-xs shadow-xs">
            <Plus className="h-4 w-4" /> Tambah Pelanggan
          </Button>
        </div>

        {/* Search */}
        <div className="max-w-xs relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, perusahaan, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        {/* Customer Cards Grid */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customers.length === 0 ? (
              <div className="col-span-full border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground text-xs">
                Belum ada data pelanggan yang disimpan.
              </div>
            ) : (
              customers.map((c) => (
                <Card key={c.id} className="hover-lift">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-serif text-base font-bold text-foreground">{c.name}</h3>
                        {c.company && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5" /> {c.company}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="h-px bg-border/60" />

                    <div className="space-y-2 text-xs text-muted-foreground">
                      {c.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" /> {c.email}
                        </p>
                      )}
                      {c.whatsapp && (
                        <p className="flex items-center gap-2">
                          <MessageSquare className="h-3.5 w-3.5 shrink-0" /> {c.whatsapp}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                Masukkan detail informasi kontak klien. Kolom bertanda bintang (*) wajib diisi.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Nama Pelanggan *
                </label>
                <Input
                  placeholder="Contoh: Raka Pratama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Perusahaan / Bisnis
                </label>
                <Input
                  placeholder="Contoh: CV Nusantara Kreatif"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Contoh: raka@kreatif.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Nomor WhatsApp (HP)
                </label>
                <Input
                  placeholder="Contoh: 08123456789"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Catatan Internal
                </label>
                <Input
                  placeholder="Keterangan internal tentang klien ini..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="shadow-xs">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
