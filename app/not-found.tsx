import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 bg-[#eef2f6]">
      <div className="editorial-panel max-w-lg w-full p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="h-8 w-8" />
        </div>
        <span className="font-mono text-xs font-bold text-red-700 uppercase tracking-wider block">
          404 — HALAMAN TIDAK DITEMUKAN
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">Halaman Tidak Tersedia</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau kode laporan yang dimasukkan tidak cocok.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 font-mono text-xs font-bold text-white hover:bg-blue-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Ke Beranda</span>
          </Link>
          <Link
            href="/pantau"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Pantau Laporan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
