"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 civic-grid">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5F5] text-[#BA1A1A]">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <span className="font-mono text-xs font-semibold text-[#BA1A1A] uppercase tracking-wider">
        KESALAHAN SISTEM
      </span>
      <h1 className="text-2xl font-bold text-[#111C2D]">Terjadi Kendala Teknis</h1>
      <p className="text-xs text-[#434654] max-w-md leading-relaxed">
        Sistem mengalami gangguan saat memproses permintaan Anda. Pastikan koneksi internet stabil
        atau coba muat ulang halaman.
      </p>
      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-5 font-mono text-xs font-semibold text-white hover:bg-[#0033A7]"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Coba Lagi</span>
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D9DEE7] bg-white px-5 font-mono text-xs font-semibold text-[#111C2D] hover:bg-[#F0F3FF]"
        >
          <Home className="h-4 w-4" />
          <span>Ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}
