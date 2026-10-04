import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShieldCheck, Mail, ArrowRight, HelpCircle } from "lucide-react";
import { TrackingSearchBar } from "@/components/pantau/search-bar";

export const metadata: Metadata = {
  title: "Pantau Laporan — LAPORKITO Palembang",
  description:
    "Pantau status penanganan dan tanggapan instansi atas pengaduan Anda menggunakan kode lacak unik.",
};

export default function PantauPage() {
  return (
    <div className="w-full bg-[#F9F9FF] min-h-screen py-12 px-4 sm:px-6 lg:px-8 civic-grid">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Search Card */}
        <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-[#D9DEE7] pb-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0F3FF] text-[#1749D2]">
                <Search className="h-4 w-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#111C2D] tracking-tight">
                Pantau Status Laporan
              </h1>
            </div>
            <p className="text-xs text-[#434654] leading-relaxed">
              Lihat perkembangan verifikasi lapangan dan tanggapan resmi dari instansi terkait di
              Kota Palembang menggunakan kode lacak Anda.
            </p>
          </div>

          <div className="space-y-4">
            <TrackingSearchBar autoFocus />

            <div className="flex items-start gap-2 text-xs text-[#667085] bg-[#F0F3FF] p-3 rounded-lg border border-[#D9DEE7]">
              <ShieldCheck className="h-4 w-4 text-[#16845B] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Anda <strong>tidak perlu membuat akun</strong>. Cukup masukkan kode lacak yang Anda
                terima saat pertama kali mengirimkan laporan.
              </p>
            </div>
          </div>
        </div>

        {/* Helpful Tips Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#D9DEE7] bg-white p-5 space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#111C2D]">
              <Mail className="h-4 w-4 text-[#1749D2]" />
              <span>Cek Kotak Masuk Email</span>
            </div>
            <p className="text-xs text-[#434654] leading-relaxed">
              Jika Anda mencantumkan email saat melapor, rincian kode lacak dan tautan pantau telah
              kami kirimkan dengan subjek &quot;[LAPORKITO] Pengaduan Diterima&quot;.
            </p>
          </div>

          <div className="rounded-xl border border-[#D9DEE7] bg-white p-5 space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#111C2D]">
              <HelpCircle className="h-4 w-4 text-[#E58A1F]" />
              <span>Belum Memiliki Laporan?</span>
            </div>
            <p className="text-xs text-[#434654] leading-relaxed">
              Ingin melaporkan jalan berlubang, lampu jalan mati, atau saluran air tersumbat di Palembang?
            </p>
            <div className="pt-1">
              <Link
                href="/lapor"
                className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#1749D2] hover:underline"
              >
                <span>Buat Laporan Sekarang</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
