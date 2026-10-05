"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  UserCog,
  CreditCard,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/admin/AdminDashboardTab";
import { UsersTab } from "@/components/admin/AdminUsersTab";
import { PaymentsTab } from "@/components/admin/AdminPaymentsTab";

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
