"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  Users,
  Settings,
  LogOut,
  X,
  CreditCard,
  Receipt,
  ShieldCheck,
  Package,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  tenantName: string;
  tier: string;
  role?: string;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ tenantName, tier, role, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Invoice",
      href: "/invoices",
      icon: FileText,
    },
    {
      label: "Penawaran",
      href: "/quotations",
      icon: FileSignature,
    },
    {
      label: "Pelanggan",
      href: "/customers",
      icon: Users,
    },
    {
      label: "Produk",
      href: "/products",
      icon: Package,
    },
    {
      label: "Pembayaran",
      href: "/payments",
      icon: Receipt,
    },
    {
      label: "Laporan",
      href: "/reports",
      icon: BarChart3,
    },
    {
      label: "Pengaturan",
      href: "/settings",
      icon: Settings,
    },
  ];

  if (role === "ADMIN") {
    navItems.push({
      label: "Admin",
      href: "/admin",
      icon: ShieldCheck,
    });
  }

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card text-foreground",
        className
      )}
    >
      {/* Top Brand Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border/80">
        <Link href="/dashboard" onClick={onClose}>
          <Logo />
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Tenant Branding Card */}
      <div className="px-6 py-4 border-b border-border/45 bg-muted/30">
        <div className="flex flex-col gap-1">
          <p className="font-serif font-semibold text-sm truncate text-foreground">
            {tenantName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plan: {tier === "FREE" ? "Gratis" : tier === "PRO" ? "Pro" : "Bisnis"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/80",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Settings/Actions */}
      <div className="border-t border-border p-4 space-y-2">
        {tier === "FREE" && (
          <Link href="/settings?tab=langganan">
            <div className="rounded-lg bg-orange-50 border border-orange-200/60 p-3 hover:bg-orange-100/50 transition-colors mb-3 cursor-pointer">
              <div className="flex gap-2">
                <CreditCard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wide">
                    Upgrade ke Pro
                  </p>
                  <p className="text-[11.5px] text-primary/80 leading-normal mt-0.5">
                    Aktifkan pembayaran QRIS & hilangkan watermark.
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-red-50/50"
          onClick={handleLogout}
        >
          <LogOut className="h-4.5 w-4.5" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
