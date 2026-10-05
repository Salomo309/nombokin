"use client";

import { useEffect, useState } from "react";
import { Users, Search, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { TIER_LABELS } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import type { AdminUser } from "./types";
import { ROLE_LABELS, ROLE_BADGE } from "./types";

// ============================================================
// Tab: Pengguna
// ============================================================

export function UsersTab() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("OWNER");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        setError("Failed to load user data.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(user: AdminUser) {
    setEditing(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setMsg(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail, role: editRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Failed to save changes.");
        return;
      }
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
      setMsg("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    const ok = await confirm({
      title: "Delete user?",
      description: `Delete user "${user.name}" (${user.email})?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ variant: "destructive", title: data.error ?? "Failed to delete user." });
        return;
      }
      toast({ variant: "success", title: "User deleted successfully" });
      await load();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Failed to delete user." });
    }
  }

  const filtered = users.filter((u) =>
    (u.name + u.email + (u.tenant?.name ?? "")).toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u.id));
  const someSelected = filtered.some((u) => selectedIds.has(u.id));

  const toggleAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) filtered.forEach((u) => next.add(u.id));
      else filtered.forEach((u) => next.delete(u.id));
      return next;
    });
  };

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Kelola akun pengguna di seluruh platform. Anda dapat mengubah nama, email, dan peran.
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari pengguna..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 pl-9 w-56 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Muat Ulang
          </Button>
        </div>
      </div>

      {msg && (
        <div className="rounded-lg bg-red-50 border border-red-200/50 p-3 text-xs font-semibold text-red-700">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-secondary/50" />
          ))}
        </div>
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            Coba Lagi
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-0 px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-semibold bg-muted/10">
                    <th className="py-2.5 px-6 w-10">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Pilih semua"
                      />
                    </th>
                    <th className="py-2.5 px-6">Pengguna</th>
                    <th className="py-2.5 px-6">Email</th>
                    <th className="py-2.5 px-6">Peran</th>
                    <th className="py-2.5 px-6">Tenant</th>
                    <th className="py-2.5 px-6">Tier</th>
                    <th className="py-2.5 px-6">Bergabung</th>
                    <th className="py-2.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Tidak ada pengguna ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((u) => (
                      <tr key={u.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="py-3 px-6">
                          <Checkbox
                            checked={selectedIds.has(u.id)}
                            onCheckedChange={() => toggleRow(u.id)}
                            aria-label={`Pilih ${u.name}`}
                          />
                        </td>
                        <td className="py-3 px-6 font-medium text-foreground">{u.name}</td>
                        <td className="py-3 px-6 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-6">
                          <Badge className={`text-[10px] px-2 py-0.5 ${ROLE_BADGE[u.role] ?? ""}`}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">{u.tenant?.name ?? "â€”"}</td>
                        <td className="py-3 px-6">
                          <Badge variant="stone" className="text-[10px] px-2 py-0.5">
                            {TIER_LABELS[u.tenant?.subscription?.tier ?? "FREE"] ??
                              u.tenant?.subscription?.tier ??
                              "FREE"}
                          </Badge>
                        </td>
                        <td className="py-3 px-6 text-muted-foreground tabular-nums">
                          {new Date(u.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/10"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-destructive hover:bg-red-50"
                              onClick={() => handleDelete(u)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <Pagination page={page} total={filtered.length} limit={limit} onPageChange={setPage} />

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Ubah informasi akun pengguna. Peran ADMIN memiliki akses penuh ke dashboard admin.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Nama Lengkap
                </label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Email
                </label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Peran
                </label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Pemilik (OWNER)</SelectItem>
                    <SelectItem value="MEMBER">Anggota (MEMBER)</SelectItem>
                    <SelectItem value="ADMIN">Admin (ADMIN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {msg && (
                <div className="rounded-lg bg-red-50 border border-red-200/50 p-3 text-xs font-semibold text-red-700">
                  {msg}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={saving} className="shadow-xs">
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
