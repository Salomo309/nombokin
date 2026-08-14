import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-serif text-7xl font-black text-primary/15 select-none">
        404
      </p>
      <h1 className="font-serif text-2xl font-bold text-foreground mt-2">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
        Halaman yang Anda cari mungkin sudah dihapus, dipindahkan, atau alamatnya salah ketik.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
      >
        Kembali ke Beranda <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
