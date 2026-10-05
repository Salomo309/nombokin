"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, Upload, Loader2, Landmark, QrCode } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";

interface PaymentMethod {
  id: string;
  type: "BANK_TRANSFER" | "CUSTOM_QRIS";
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  qrisImageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function PaymentMethodsManager() {
  const confirm = useConfirm();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Bank form (tambah / ubah)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  async function loadMethods() {
    try {
      const res = await fetch("/api/payment-methods");
      if (res.ok) setMethods(await res.json());
    } catch (err) {
      console.error("Gagal memuat metode pembayaran:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMethods();
  }, []);

  const banks = methods.filter((m) => m.type === "BANK_TRANSFER");
  const qris = methods.find((m) => m.type === "CUSTOM_QRIS");

  function resetBankForm() {
    setEditingId(null);
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
  }

  function startEdit(m: PaymentMethod) {
    setEditingId(m.id);
    setBankName(m.bankName || "");
    setAccountNumber(m.accountNumber || "");
    setAccountHolder(m.accountHolder || "");
  }

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) {
      toast({ variant: "destructive", title: "Bank, nomor rekening & nama pemilik wajib diisi" });
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/payment-methods/${editingId}` : "/api/payment-methods";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "BANK_TRANSFER",
          bankName,
          accountNumber,
          accountHolder,
        }),
      });
      if (res.ok) {
        toast({ variant: "success", title: "Bank account saved successfully" });
        resetBankForm();
        await loadMethods();
      } else {
        const err = await res.json();
        toast({ variant: "destructive", title: err.error || "Failed to save bank account" });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Server connection error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (m: PaymentMethod, active: boolean) => {
    try {
      const res = await fetch(`/api/payment-methods/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      });
      if (res.ok) await loadMethods();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (m: PaymentMethod) => {
    const label = m.type === "CUSTOM_QRIS" ? "QRIS" : `${m.bankName} ${m.accountNumber}`;
    const ok = await confirm({
      title: "Delete payment method?",
      description: `Hapus ${label} dari daftar pembayaran manual?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/payment-methods/${m.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ variant: "success", title: "Payment method deleted successfully" });
        if (editingId === m.id) resetBankForm();
        await loadMethods();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/upload/qris", { method: "POST", body: form });
      const upData = await up.json();
      if (!up.ok) {
        toast({ variant: "destructive", title: upData.error || "Failed to upload QRIS image" });
        return;
      }
      if (qris) {
        const res = await fetch(`/api/payment-methods/${qris.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrisImageUrl: upData.url }),
        });
        if (!res.ok) throw new Error("Failed to save QRIS");
      } else {
        const res = await fetch("/api/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "CUSTOM_QRIS", qrisImageUrl: upData.url }),
        });
        if (!res.ok) throw new Error("Failed to save QRIS");
      }
      toast({ variant: "success", title: "QRIS image saved successfully" });
      await loadMethods();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Failed to save QRIS image" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat metode pembayaran...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
      {/* Rekening Bank */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" /> Rekening Bank
          </CardTitle>
          <CardDescription className="text-[11px]">
            Daftar tujuan transfer yang tampil di halaman tagihan klien.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {banks.length === 0 && (
            <p className="text-xs text-muted-foreground">Belum ada rekening. Tambahkan di bawah.</p>
          )}
          {banks.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {m.bankName} — <span className="tabular-nums">{m.accountNumber}</span>
                </p>
                <p className="text-[11px] text-muted-foreground truncate">a.n. {m.accountHolder}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch checked={m.isActive} onCheckedChange={(v) => handleToggle(m, v)} />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(m)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(m)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <form onSubmit={handleSaveBank} className="space-y-3 rounded-lg bg-secondary/30 border border-border/50 p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase">
              {editingId ? "Ubah Rekening" : "Tambah Rekening"}
            </p>
            <Input placeholder="Nama bank (contoh: BCA)" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <Input placeholder="Nomor rekening" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="tabular-nums" />
            <Input placeholder="Nama pemilik rekening" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving} className="gap-1.5 text-xs">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah"}
              </Button>
              {editingId && (
                <Button type="button" size="sm" variant="outline" className="text-xs" onClick={resetBankForm}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QRIS Sendiri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" /> QRIS Sendiri
          </CardTitle>
          <CardDescription className="text-[11px]">
            Unggah gambar QRIS tokomu agar klien bisa scan langsung (tanpa Midtrans).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          {qris?.qrisImageUrl ? (
            <img src={qris.qrisImageUrl} alt="QRIS" className="h-48 w-48 object-contain rounded-lg border border-border bg-white" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30">
              <QrCode className="h-8 w-8 text-muted-foreground/60" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleQrisUpload} className="hidden" disabled={uploading} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} className="pointer-events-none gap-1.5 text-xs">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Mengunggah..." : qris ? "Ganti QRIS" : "Unggah QRIS"}
              </Button>
            </label>
            {qris && (
              <>
                <Switch checked={qris.isActive} onCheckedChange={(v) => handleToggle(qris, v)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(qris)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">JPG/PNG/WEBP, maks. 2MB.</p>
        </CardContent>
      </Card>
    </div>
  );
}
