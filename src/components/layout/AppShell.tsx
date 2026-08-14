"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MailCheck, X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
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
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Intercept fetch: saat API mengembalikan 401, coba refresh token dulu,
  // lalu redirect ke login jika gagal (mis. sesi sudah kedaluwarsa).
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    let refreshing = false;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await originalFetch(input, init);

      if (
        res.status === 401 &&
        typeof input === "string" &&
        input.startsWith("/api/") &&
        !input.includes("/api/auth/login") &&
        !input.includes("/api/auth/refresh")
      ) {
        if (refreshing) return res;
        refreshing = true;
        try {
          const refreshRes = await originalFetch("/api/auth/refresh", {
            method: "POST",
          });
          if (refreshRes.ok) {
            // Retry request asli dengan access token baru
            return originalFetch(input, init);
          }
          router.push(
            `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          );
        } catch (err) {
          console.error("Failed to refresh session:", err);
          router.push(
            `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          );
        } finally {
          refreshing = false;
        }
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Hanya sekali saat shell pertama kali dimuat — navigasi antar halaman
    // tidak perlu me-refetch sesi lagi (dipasang via route group layout).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const needsVerification = !session.emailVerifiedAt;

  const handleResendVerification = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch("/api/auth/verify-email/send", { method: "POST" });
      if (res.ok) {
        setResendMsg("Email verifikasi telah dikirim. Cek kotak masuk Anda.");
      } else {
        const data = await res.json();
        setResendMsg(data.error || "Gagal mengirim email verifikasi.");
      }
    } catch {
      setResendMsg("Gagal mengirim email verifikasi.");
    } finally {
      setResending(false);
    }
  };

  // Derive topbar title from active route path
  let activeTitle = "";
  if (pathname.startsWith("/admin")) activeTitle = "Dashboard Admin";
  else if (pathname.startsWith("/payments")) activeTitle = "Riwayat Pembayaran";
  else if (pathname.startsWith("/dashboard")) activeTitle = "Dashboard";
  else if (pathname.startsWith("/invoices/new")) activeTitle = "Buat Invoice Baru";
  else if (pathname.startsWith("/invoices") && pathname.includes("/edit")) activeTitle = "Edit Invoice";
  else if (pathname.startsWith("/invoices")) activeTitle = "Daftar Invoice";
  else if (pathname.startsWith("/quotations/new")) activeTitle = "Buat Penawaran Baru";
  else if (pathname.startsWith("/quotations") && pathname.includes("/edit")) activeTitle = "Edit Penawaran";
  else if (pathname.startsWith("/quotations")) activeTitle = "Daftar Penawaran";
  else if (pathname.startsWith("/customers")) activeTitle = "Kelola Pelanggan";
  else if (pathname.startsWith("/products")) activeTitle = "Master Produk";
  else if (pathname.startsWith("/settings")) activeTitle = "Pengaturan Bisnis";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar for Desktop */}
      <Sidebar
        tenantName={session.tenant.name}
        tier={session.tenant.subscription.tier}
        role={session.role}
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
        role={session.role}
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
            {needsVerification && !bannerDismissed && (
              <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-orange-200/60 bg-orange-50 p-4 text-sm text-orange-900 dark:border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-200">
                <div className="flex items-start gap-3">
                  <MailCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      Verifikasi alamat email Anda
                    </p>
                    <p className="text-xs text-orange-800/80 dark:text-orange-200/80 mt-0.5">
                      Kami sudah mengirim link verifikasi ke <strong>{session.email}</strong>.
                      Buka email tersebut dan klik tombol verifikasi untuk mengamankan akun Anda.
                    </p>
                    {resendMsg && (
                      <p className="text-xs font-medium mt-1.5">{resendMsg}</p>
                    )}
                    <Button
                      variant="link"
                      className="h-auto p-0 mt-1.5 text-xs font-semibold text-primary"
                      onClick={handleResendVerification}
                      disabled={resending}
                    >
                      {resending ? "Mengirim..." : "Kirim ulang email verifikasi"}
                    </Button>
                  </div>
                </div>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
