"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    subscription: {
      tier: string;
      status: string;
      currentPeriodEnd: string | null;
    };
  };
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Fetch current user details
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else {
          // If unauthenticated, redirect to login
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } catch (err) {
        console.error("Gagal memuat sesi:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [router, pathname]);

  // Handle local dark mode check on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {/* Custom Warm Spinner */}
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
          <p className="font-serif text-sm text-muted-foreground animate-pulse">
            Memuat Nombokin...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Derive topbar title from active route path
  let activeTitle = "";
  if (pathname.startsWith("/dashboard")) activeTitle = "Dashboard";
  else if (pathname.startsWith("/invoices/new")) activeTitle = "Buat Invoice Baru";
  else if (pathname.startsWith("/invoices") && pathname.includes("/edit")) activeTitle = "Edit Invoice";
  else if (pathname.startsWith("/invoices")) activeTitle = "Daftar Invoice";
  else if (pathname.startsWith("/quotations/new")) activeTitle = "Buat Penawaran Baru";
  else if (pathname.startsWith("/quotations") && pathname.includes("/edit")) activeTitle = "Edit Penawaran";
  else if (pathname.startsWith("/quotations")) activeTitle = "Daftar Penawaran";
  else if (pathname.startsWith("/customers")) activeTitle = "Kelola Pelanggan";
  else if (pathname.startsWith("/settings")) activeTitle = "Pengaturan Bisnis";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar for Desktop */}
      <Sidebar
        tenantName={session.tenant.name}
        tier={session.tenant.subscription.tier}
        className="hidden md:flex shrink-0"
      />

      {/* Sidebar Drawer overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for Mobile Drawer */}
      <Sidebar
        tenantName={session.tenant.name}
        tier={session.tenant.subscription.tier}
        onClose={() => setSidebarOpen(false)}
        className={cn(
          "fixed bottom-0 top-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userName={session.name}
          userEmail={session.email}
          onOpenSidebar={() => setSidebarOpen(true)}
          title={activeTitle}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-[1200px] w-full pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
