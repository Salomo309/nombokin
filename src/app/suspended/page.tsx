import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/">
            <Logo iconClassName="h-10 w-10" textClassName="text-2xl" />
          </Link>
        </div>

        <Card className="border border-border shadow-xs">
          <CardHeader className="space-y-1 text-center">
            <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-2" />
            <CardTitle className="text-xl">Akun Dibekukan</CardTitle>
            <CardDescription className="text-xs">
              Akses anggota workspace ini sedang nonaktif.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              Akun kamu dibekukan karena workspace sudah tidak memakai paket BISNIS.
              Hubungi pemilik workspace untuk mengaktifkan kembali.
            </p>
            <p>
              Catatan: kembali ke PRO tidak memulihkan akses anggota —
              hanya paket BISNIS yang memulihkan.
            </p>
            <Button asChild className="w-full shadow-xs">
              <Link href="/login">Kembali Masuk</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
