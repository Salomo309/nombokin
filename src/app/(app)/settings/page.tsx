"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, Building, CreditCard, Sparkles, Upload, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateProfileAction, updateCompanyAction } from "@/server/actions/settings";

function SettingsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profil";

  const [activeTab, setActiveTab] = useState(defaultTab);

  // User states
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Company states
  const [tenantName, setTenantName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [letterheadSignature, setLetterheadSignature] = useState("");
  const [watermarkText, setWatermarkText] = useState("");

  // Subscription states
  const [tier, setTier] = useState("FREE");
  const [subStatus, setSubStatus] = useState("ACTIVE");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Password states
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  async function loadSettings(): Promise<string | undefined> {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUserName(data.name);
        setUserEmail(data.email);
        setTenantName(data.tenant.name);
        setLogoUrl(data.tenant.logoUrl);
        setLetterheadSignature(data.tenant.letterheadSignature || "");
        setWatermarkText(data.tenant.watermarkText || "Dibuat dengan Nombokin");
        setTier(data.tenant.subscription.tier);
        setSubStatus(data.tenant.subscription.status);
        setPeriodEnd(data.tenant.subscription.currentPeriodEnd);
        return data.tenant.subscription.tier as string;
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    (async () => {
      await loadSettings();
      setLoading(false);
    })();
  }, []);

  function loadSnapScript(snapScriptUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const anyWindow = window as any;
      if (anyWindow.snap) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = snapScriptUrl;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Midtrans Snap"));
      document.body.appendChild(script);
    });
  }

  const handleUpgrade = async (selectedTier: "PRO" | "BUSINESS") => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, interval: billingInterval }),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to upgrade subscription");
        return;
      }

      const data = await res.json();
      await loadSnapScript(
        `${data.snapScriptUrl}?client_key=${encodeURIComponent(data.clientKey)}`
      );

      (window as any).snap.pay(data.token, {
        onSuccess: async () => {
          setSuccessMsg("Payment processed. Waiting for Midtrans confirmation...");
          // Webhook memverifikasi & memperbarui status langganan, cek beberapa kali
          let currentTier = "FREE";
          for (let i = 0; i < 6; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            currentTier = (await loadSettings()) ?? currentTier;
            if (currentTier !== "FREE") break;
          }
          if (currentTier !== "FREE") {
            setSuccessMsg("Payment successful! Your plan has been activated.");
          } else {
            setSuccessMsg("Payment successful. Subscription status will be verified automatically.");
          }
        },
        onPending: () => {
          setSuccessMsg("Payment pending confirmation. Status will be updated automatically.");
        },
        onError: () => {
          setErrorMsg("Payment processing failed. Please try again.");
        },
        onClose: async () => {
          try {
            await fetch("/api/billing/subscription/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderId }),
            });
          } catch (err) {
            console.error("Gagal membatalkan transaksi:", err);
          }
          setErrorMsg("Payment cancelled. You can try again anytime.");
        },
      });
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateProfileAction({ name: userName, email: userEmail });
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg(null);
    setErrorMsg(null);

    if (pwNew.length < 8) {
      setPwMsg("New password must be at least 8 characters");
      setPwSaving(false);
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg("Password confirmation does not match");
      setPwSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwCurrent,
          newPassword: pwNew,
          confirmPassword: pwConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg(data.error || "Failed to change password");
        return;
      }
      setSuccessMsg("Password changed successfully! Other devices will be asked to log in again.");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (err) {
      console.error(err);
      setPwMsg("Connection failed");
    } finally {
      setPwSaving(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateCompanyAction({
        name: tenantName,
        letterheadSignature: letterheadSignature || undefined,
        watermarkText: watermarkText || undefined,
      });
      setSuccessMsg("Business branding updated successfully!");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update branding");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.logoUrl);
        setSuccessMsg("Business logo uploaded successfully!");
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to upload logo");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading) {
    return (

        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
  
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Pengaturan
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur profil pengguna, informasi penagihan perusahaan, dan status berlangganan.
          </p>
        </div>

        {successMsg && (
          <div className="rounded-lg bg-green-50 border border-green-200/50 p-4 text-xs font-semibold text-green-700">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200/50 p-4 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="profil" className="gap-1.5">
              <User className="h-4 w-4" /> Profil
            </TabsTrigger>
            <TabsTrigger value="perusahaan" className="gap-1.5">
              <Building className="h-4 w-4" /> Perusahaan & Branding
            </TabsTrigger>
            <TabsTrigger value="langganan" className="gap-1.5">
              <CreditCard className="h-4 w-4" /> Langganan
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Profile Settings */}
          <TabsContent value="profil">
            <Card>
              <form onSubmit={handleUpdateProfile}>
                <CardHeader>
                  <CardTitle className="text-lg">Profil Pengguna</CardTitle>
                  <CardDescription className="text-xs">
                    Kelola informasi dasar profil Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Nama Lengkap
                    </label>
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Alamat Email
                    </label>
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/40 pt-4">
                  <Button type="submit" disabled={saving} className="shadow-xs">
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Password Card */}
            <Card>
              <form onSubmit={handleChangePassword}>
                <CardHeader>
                  <CardTitle className="text-lg">Ganti Password</CardTitle>
                  <CardDescription className="text-xs">
                    Password baru minimal 8 karakter. Setelah diubah, semua perangkat lain akan diminta login ulang.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Password Saat Ini
                    </label>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={pwCurrent}
                      onChange={(e) => setPwCurrent(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Password Baru
                    </label>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={pwNew}
                      onChange={(e) => setPwNew(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Konfirmasi Password Baru
                    </label>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={pwConfirm}
                      onChange={(e) => setPwConfirm(e.target.value)}
                      required
                    />
                  </div>
                  {pwMsg && (
                    <p className="text-xs font-semibold text-red-600">{pwMsg}</p>
                  )}
                </CardContent>
                <CardFooter className="border-t border-border/40 pt-4">
                  <Button type="submit" disabled={pwSaving} className="shadow-xs">
                    {pwSaving ? "Menyimpan..." : "Ganti Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Tab 2: Company Branding */}
          <TabsContent value="perusahaan">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <form onSubmit={handleUpdateCompany}>
                  <CardHeader>
                    <CardTitle className="text-lg">Informasi Bisnis & Surat</CardTitle>
                    <CardDescription className="text-xs">
                      Rincian perusahaan ini akan dicetak sebagai kop surat resmi invoice & penawaran.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">
                        Nama Bisnis (Perusahaan)
                      </label>
                      <Input
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">
                        Keterangan Kop / Tagline Tanda Tangan
                      </label>
                      <Input
                        placeholder="Contoh: Studio Raka - raka@studioraka.id"
                        value={letterheadSignature}
                        onChange={(e) => setLetterheadSignature(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase">
                        Teks Watermark (Draf)
                      </label>
                      <Input
                        placeholder="Default: Dibuat dengan Nombokin"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        disabled={tier === "FREE"}
                      />
                      {tier === "FREE" && (
                        <p className="text-[10px] text-muted-foreground italic">
                          * Upgrade ke PRO untuk mengkustomisasi watermark kertas draft.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/40 pt-4">
                    <Button type="submit" disabled={saving} className="shadow-xs">
                      {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Logo Uploader Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Logo Bisnis</CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Gunakan format persegi PNG/JPG transparan (maks. 2MB).
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo Bisnis"
                        className="h-20 w-20 object-contain rounded-md"
                      />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground/60" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={tier === "FREE" || logoUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={tier === "FREE" || logoUploading}
                        className="pointer-events-none"
                      >
                        {logoUploading ? "Mengunggah..." : "Pilih Logo"}
                      </Button>
                    </label>
                    {tier === "FREE" && (
                      <p className="text-[10px] text-muted-foreground italic px-2">
                        * Upload logo hanya tersedia untuk anggota PRO & Bisnis.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Subscriptions */}
          <TabsContent value="langganan">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Langganan Anda</CardTitle>
                <CardDescription className="text-xs">
                  Kelola paket SaaS tagihan Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 rounded-xl border border-border/80 p-5 sm:flex-row sm:items-center sm:justify-between bg-muted/20">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Paket Aktif</p>
                    <h3 className="font-serif text-xl font-bold text-primary">
                      {tier === "FREE" ? "Paket Gratis (FREE)" : tier === "PRO" ? "Paket PRO" : "Paket BISNIS"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Status: <strong className="text-foreground uppercase">{subStatus}</strong> 
                      {periodEnd && ` · Berakhir pada ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(periodEnd))}`}
                    </p>
                  </div>
                  {tier === "FREE" && (
                    <div className="flex items-center gap-1.5 rounded-full bg-accent/60 px-3 py-1 text-[11px] font-bold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Gratis 5 invoice/bulan</span>
                    </div>
                  )}
                </div>

                {tier === "FREE" && (
                  <div className="space-y-6">
                    <div className="flex justify-center gap-4 border-b border-border pb-4">
                      <Button
                        variant={billingInterval === "MONTHLY" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBillingInterval("MONTHLY")}
                        className="text-xs"
                      >
                        Bayar Bulanan
                      </Button>
                      <Button
                        variant={billingInterval === "YEARLY" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBillingInterval("YEARLY")}
                        className="text-xs"
                      >
                        Bayar Tahunan (Diskon 15%)
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-2xl mx-auto items-stretch">
                      {/* PRO Box */}
                      <div className="flex flex-col justify-between rounded-xl border-2 border-primary bg-card p-6 shadow-xs relative">
                        <div className="space-y-3">
                          <h4 className="font-serif font-bold text-base">Paket PRO</h4>
                          <p className="font-serif text-2xl font-bold text-primary">
                            {billingInterval === "MONTHLY" ? "Rp 29.000" : "Rp 299.000"}
                            <span className="text-xs font-sans text-muted-foreground">
                              {billingInterval === "MONTHLY" ? "/bln" : "/thn"}
                            </span>
                          </p>
                          <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                            <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary shrink-0" /> Unlimited Invoice</li>
                            <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary shrink-0" /> Bayar Online QRIS/VA</li>
                            <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary shrink-0" /> Unggah Custom Logo</li>
                            <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary shrink-0" /> Tanpa Watermark</li>
                          </ul>
                        </div>
                        <Button onClick={() => handleUpgrade("PRO")} className="w-full mt-6 shadow-xs">
                          Upgrade ke Pro
                        </Button>
                      </div>

                      {/* BUSINESS Box */}
                      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs">
                        <div className="space-y-3">
                          <h4 className="font-serif font-bold text-base">Paket BISNIS</h4>
                          <p className="font-serif text-2xl font-bold text-foreground">
                            {billingInterval === "MONTHLY" ? "Rp 59.000" : "Rp 599.000"}
                            <span className="text-xs font-sans text-muted-foreground">
                              {billingInterval === "MONTHLY" ? "/bln" : "/thn"}
                            </span>
                          </p>
                          <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                            <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary shrink-0" /> Semua fitur paket PRO</li>
                            <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary shrink-0" /> Multi-user (hingga 5 user)</li>
                            <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary shrink-0" /> Manajemen hak akses</li>
                          </ul>
                        </div>
                        <Button onClick={() => handleUpgrade("BUSINESS")} variant="outline" className="w-full mt-6">
                          Pilih Paket Bisnis
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Memuat...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
