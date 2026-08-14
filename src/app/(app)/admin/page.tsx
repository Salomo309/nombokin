"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Users,
  Building2,
  FileText,
  Receipt,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Loader2,
  LayoutDashboard,
  UserCog,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah, STATUS_LABELS, TIER_LABELS } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";

// ============================================================
// Types
// ============================================================

interface AdminStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalUsers: number;
  totalTenants: number;
  totalInvoices: number;
  totalPayments: number;
  recentPayments: Array<{
    id: string;
    orderId: string;
    type: "SUBSCRIPTION" | "INVOICE";
    amount: number;
    createdAt: string;
    tenant: { name: string } | null;
  }>;
  invoiceBreakdown: Array<{ status: string; _count: number }>;
  tierBreakdown: Array<{ tier: string; _count: number }>;
  revenueByMonth: Array<{ month: string; amount: number }>;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER" | "ADMIN";
  createdAt: string;
  tenant: {
    name: string;
    slug: string;
    subscription: { tier: string } | null;
  };
}

interface AdminPayment {
  id: string;
  orderId: string;
  type: "SUBSCRIPTION" | "INVOICE";
  status: "PENDING" | "SUCCESS" | "CANCELLED" | "FAILED";
  amount: number;
  tier: string | null;
  interval: string | null;
  transactionId: string | null;
  paymentMethod: string | null;
  createdAt: string;
  tenant: { name: string; slug: string } | null;
  user: { name: string; email: string } | null;
  invoice: { number: string } | null;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  SUCCESS: "Sukses",
  CANCELLED: "Dibatalkan",
  FAILED: "Failed",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Pemilik",
  MEMBER: "Anggota",
  ADMIN: "Admin",
};

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-800",
  MEMBER: "bg-stone-100 text-stone-700",
  ADMIN: "bg-primary/10 text-primary",
};

// ============================================================
// Tab: Dashboard
// ============================================================

function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats({
            ...data,
            totalRevenue: parseFloat(data.totalRevenue ?? "0"),
            revenueThisMonth: parseFloat(data.revenueThisMonth ?? "0"),
          });
        } else {
          setError("Failed to load data.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-secondary/80" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-secondary/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p className="font-serif text-base font-bold text-foreground">Failed to Load</p>
        <p>{error}</p>
      </div>
    );
  }

  const invoiceTotal = stats?.invoiceBreakdown.reduce((s, b) => s + b._count, 0) ?? 0;
  const tierTotal = stats?.tierBreakdown.reduce((s, b) => s + b._count, 0) ?? 0;

  const statCards = [
    {
      label: "Total Pendapatan",
      value: formatRupiah(stats?.totalRevenue ?? 0),
      sub: "Semua pembayaran sukses",
      icon: Wallet,
      color: "text-success",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: formatRupiah(stats?.revenueThisMonth ?? 0),
      sub: "Sejak 1 bulan terakhir",
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Total Pengguna",
      value: String(stats?.totalUsers ?? 0),
      sub: "Semua akun terdaftar",
      icon: Users,
      color: "text-foreground",
    },
    {
      label: "Total Tenant",
      value: String(stats?.totalTenants ?? 0),
      sub: "Bisnis terdaftar",
      icon: Building2,
      color: "text-foreground",
    },
    {
      label: "Total Invoice",
      value: String(stats?.totalInvoices ?? 0),
      sub: "Dokumen aktif",
      icon: FileText,
      color: "text-foreground",
    },
    {
      label: "Total Pembayaran",
      value: String(stats?.totalPayments ?? 0),
      sub: "Termasuk pending & batal",
      icon: Receipt,
      color: "text-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  {s.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="font-serif text-xl font-bold text-foreground tabular-nums">
                  {s.value}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart + Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 border-b border-border/80">
            <CardTitle className="text-base">Pendapatan 6 Bulan Terakhir</CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              Total pembayaran sukses per bulan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.revenueByMonth ?? []}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip formatter={(v) => formatRupiah(Number(v))} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="amount" fill="#C2410C" radius={[4, 4, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Invoice by status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Invoice per Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {(stats?.invoiceBreakdown ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Belum ada data.</p>
              )}
              {(stats?.invoiceBreakdown ?? []).map((b) => (
                <div key={b.status} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                  <span className="font-serif font-bold tabular-nums">{b._count}</span>
                </div>
              ))}
              <div className="border-t border-border/60 pt-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Total</span>
                <span className="font-serif font-bold tabular-nums">{invoiceTotal}</span>
              </div>
            </CardContent>
          </Card>

          {/* Subscription tiers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Langganan Aktif per Tier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {(stats?.tierBreakdown ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Belum ada data.</p>
              )}
              {(stats?.tierBreakdown ?? []).map((b) => (
                <div key={b.tier} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{TIER_LABELS[b.tier] ?? b.tier}</span>
                  <span className="font-serif font-bold tabular-nums">{b._count}</span>
                </div>
              ))}
              <div className="border-t border-border/60 pt-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Total</span>
                <span className="font-serif font-bold tabular-nums">{tierTotal}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/80">
          <div>
            <CardTitle className="text-base">Pembayaran Terbaru</CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              Transaksi sukses terakhir di seluruh platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-semibold bg-muted/10">
                  <th className="py-2.5 px-6">Order</th>
                  <th className="py-2.5 px-6">Tenant</th>
                  <th className="py-2.5 px-6">Jenis</th>
                  <th className="py-2.5 px-6 text-right">Nominal</th>
                  <th className="py-2.5 px-6">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(stats?.recentPayments ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Belum ada pembayaran.
                    </td>
                  </tr>
                ) : (
                  (stats?.recentPayments ?? []).map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 px-6 font-mono text-[11px] text-muted-foreground">
                        {p.orderId}
                      </td>
                      <td className="py-3 px-6 font-medium text-foreground">
                        {p.tenant?.name ?? "—"}
                      </td>
                      <td className="py-3 px-6">
                        <Badge variant="stone" className="text-[10px] px-2 py-0.5">
                          {p.type === "SUBSCRIPTION" ? "Langganan" : "Invoice"}
                        </Badge>
                      </td>
                      <td className="py-3 px-6 text-right font-serif font-bold tabular-nums">
                        {formatRupiah(p.amount)}
                      </td>
                      <td className="py-3 px-6 text-muted-foreground tabular-nums">
                        {new Date(p.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Tab: Pengguna
// ============================================================

function UsersTab() {
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
                        <td className="py-3 px-6 text-muted-foreground">{u.tenant?.name ?? "—"}</td>
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

// ============================================================
// Tab: Pembayaran (read-only)
// ============================================================

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SUCCESS: "bg-green-100 text-green-800",
  CANCELLED: "bg-stone-100 text-stone-600",
  FAILED: "bg-red-100 text-red-800",
};

function PaymentsTab() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = payments.length > 0 && payments.every((p) => selectedIds.has(p.id));
  const someSelected = payments.some((p) => selectedIds.has(p.id));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) payments.forEach((p) => next.add(p.id));
      else payments.forEach((p) => next.delete(p.id));
      return next;
    });
  };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      } else {
        setError("Failed to load payment data.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load payment data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const paginated = payments.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Seluruh transaksi pembayaran di platform (hanya baca).
        </p>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Muat Ulang
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
                <thead className="sticky top-0 bg-muted/95 backdrop-blur">
                  <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-6 w-10">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Pilih semua"
                      />
                    </th>
                    <th className="py-2.5 px-6">Order ID</th>
                    <th className="py-2.5 px-6">Tenant</th>
                    <th className="py-2.5 px-6">Pengguna</th>
                    <th className="py-2.5 px-6">Invoice</th>
                    <th className="py-2.5 px-6">Jenis</th>
                    <th className="py-2.5 px-6">Status</th>
                    <th className="py-2.5 px-6 text-right">Nominal</th>
                    <th className="py-2.5 px-6">Metode</th>
                    <th className="py-2.5 px-6">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        Belum ada transaksi.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="py-3 px-6">
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleRow(p.id)}
                            aria-label={`Pilih ${p.orderId}`}
                          />
                        </td>
                        <td className="py-3 px-6 font-mono text-[11px] text-muted-foreground">
                          {p.orderId}
                        </td>
                        <td className="py-3 px-6 font-medium text-foreground">
                          {p.tenant?.name ?? "—"}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {p.user ? `${p.user.name} (${p.user.email})` : "—"}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {p.invoice?.number ?? "—"}
                        </td>
                        <td className="py-3 px-6">
                          <Badge variant="stone" className="text-[10px] px-2 py-0.5">
                            {p.type === "SUBSCRIPTION" ? "Langganan" : "Invoice"}
                          </Badge>
                        </td>
                        <td className="py-3 px-6">
                          <Badge
                            className={`text-[10px] px-2 py-0.5 ${PAYMENT_STATUS_BADGE[p.status] ?? ""}`}
                          >
                            {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-6 text-right font-serif font-bold tabular-nums">
                          {formatRupiah(p.amount)}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {p.paymentMethod ?? "—"}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground tabular-nums">
                          {new Date(p.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
      <Pagination page={page} total={payments.length} limit={limit} onPageChange={setPage} />
    </div>
  );
}

// ============================================================
// Halaman Admin
// ============================================================

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.status === 403 || res.status === 401) setBlocked(true);
      } catch {
        // biarkan, tab akan menampilkan error masing-masing
      }
    })();
  }, []);

  if (blocked) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p className="font-serif text-base font-bold text-foreground">Akses Ditolak</p>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
        <Link href="/dashboard" className="text-primary underline">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Dashboard Admin
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ringkasan pendapatan, pengguna, dan aktivitas seluruh platform.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="pengguna" className="gap-1.5">
            <UserCog className="h-4 w-4" /> Pengguna
          </TabsTrigger>
          <TabsTrigger value="pembayaran" className="gap-1.5">
            <CreditCard className="h-4 w-4" /> Pembayaran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>

        <TabsContent value="pengguna">
          <UsersTab />
        </TabsContent>

        <TabsContent value="pembayaran">
          <PaymentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
