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
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 bg-[#eef2f6]">
      <div className="editorial-panel max-w-lg w-full p-8 text-center space-y-4">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <span className="font-mono text-xs font-bold text-red-700 uppercase tracking-wider block">
          KESALAHAN SISTEM
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">Terjadi Kendala Teknis</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Sistem mengalami gangguan saat memproses permintaan Anda. Pastikan koneksi internet stabil atau coba muat ulang halaman.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-mono text-xs font-bold text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Coba Lagi</span>
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
