"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, User, Building, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!name || !email || !password || !tenantName) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, tenantName }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed. Please check your data.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/">
            <Logo iconClassName="h-10 w-10" textClassName="text-2xl" />
          </Link>
          <p className="text-xs text-muted-foreground">
            Bikin invoice 1 menit, klien langsung bayar lewat QRIS.
          </p>
        </div>

        <Card className="border border-border shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Daftar Akun Baru</CardTitle>
            <CardDescription className="text-xs">
              Mulai buat invoice & quotation estetik gratis sekarang juga.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200/50 p-3.5 text-xs text-red-700">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <GoogleButton />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                atau daftar dengan email
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    placeholder="Contoh: Raka Pratama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Nama Bisnis / Usaha
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    placeholder="Contoh: Studio Raka, CV Maju Bersama"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Contoh: raka@studioraka.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full shadow-xs">
                {loading ? "Memproses..." : "Daftar Akun & Mulai"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 text-xs text-center border-t border-border/40 pt-4">
            <p className="text-muted-foreground">
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Masuk Disini
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
