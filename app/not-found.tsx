import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 civic-grid">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5F5] text-[#BA1A1A]">
        <AlertCircle className="h-8 w-8" />
      </div>
      <span className="font-mono text-xs font-semibold text-[#BA1A1A] uppercase tracking-wider">
        404 — HALAMAN TIDAK DITEMUKAN
      </span>
      <h1 className="text-2xl font-bold text-[#111C2D]">Halaman Tidak Tersedia</h1>
      <p className="text-xs text-[#434654] max-w-md leading-relaxed">
        Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau kode laporan yang dimasukkan
        salah.
      </p>
      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-5 font-mono text-xs font-semibold text-white hover:bg-[#0033A7]"
        >
          <Home className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <Link
          href="/pantau"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D9DEE7] bg-white px-5 font-mono text-xs font-semibold text-[#111C2D] hover:bg-[#F0F3FF]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Pantau Laporan</span>
        </Link>
      </div>
    </div>
  );
}
