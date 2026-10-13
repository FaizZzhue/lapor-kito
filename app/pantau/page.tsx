import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Mail, HelpCircle } from "lucide-react";
import { TrackingSearchBar } from "@/components/pantau/search-bar";

export const metadata: Metadata = {
  title: "LAPORKITO",
  description:
    "Masukkan kode lacak unik untuk memantau tahapan verifikasi, disposisi instansi, dan riwayat penanganan laporan di Kota Palembang.",
};

export default function PantauPage() {
  return (
    <div className="w-full bg-[#eef2f6] min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Search Panel — White Panel with Soft Shadow */}
        <div className="editorial-panel p-6 sm:p-8 space-y-6">
          <div className="space-y-1 border-b border-slate-200/80 pb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pantau Status Laporan
            </h1>
          </div>

          <div className="space-y-4">
            <TrackingSearchBar autoFocus />

            <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/90">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Anda <strong>tidak perlu membuat akun</strong>. Cukup masukkan kode lacak yang Anda
                terima saat pertama kali mengirimkan laporan.
              </p>
            </div>
          </div>
        </div>

        {/* Helpful Tips Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-900">
              <Mail className="h-4 w-4 text-blue-700" />
              <span>Cek Kotak Masuk Email</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jika Anda mencantumkan email saat melapor, rincian kode lacak dan tautan pantau telah
              kami kirimkan dengan subjek &quot;[LAPORKITO] Pengaduan Diterima&quot;.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-2 shadow-2xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-900">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                <span>Belum Memiliki Laporan?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingin melaporkan jalan berlubang, lampu jalan mati, atau saluran air tersumbat di Palembang?
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/lapor"
                className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-blue-700 hover:underline"
              >
                <span>Buat Laporan Sekarang</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
