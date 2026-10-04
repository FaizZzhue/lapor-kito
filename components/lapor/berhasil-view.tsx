"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Home,
  ShieldCheck,
  Calendar,
  Tag,
  AlertCircle,
} from "lucide-react";

interface BerhasilViewProps {
  trackingCode: string | null;
  reportTitle?: string;
  categoryName?: string;
  createdAt?: string;
}

export function BerhasilView({
  trackingCode,
  reportTitle,
  categoryName,
  createdAt,
}: BerhasilViewProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    if (!trackingCode) return;
    const url = `${window.location.origin}/pantau/${trackingCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!trackingCode) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-[#D9DEE7] bg-white p-8 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-[#BA1A1A]" />
        <h1 className="text-xl font-bold text-[#111C2D]">Kode Lacak Tidak Ditemukan</h1>
        <p className="text-xs text-[#434654] leading-relaxed">
          Halaman ini memerlukan parameter kode lacak yang valid. Jika Anda baru saja melapor, periksa
          kembali tautan atau kotak masuk email Anda.
        </p>
        <div className="pt-2">
          <Link
            href="/lapor"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1749D2] px-5 text-xs font-semibold text-white hover:bg-[#0033A7]"
          >
            Buat Laporan Baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Success Hero Card */}
      <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F7EF] text-[#16845B]">
            <CheckCircle className="h-8 w-8" />
          </div>
          <span className="inline-block rounded bg-[#E6F7EF] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#006443] border border-[#78D9AA]/50 uppercase tracking-wider">
            Laporan Berhasil Dicatat
          </span>
          <h1 className="text-2xl font-bold text-[#111C2D] tracking-tight">
            Pengaduan Anda Telah Diterima
          </h1>
          <p className="text-xs text-[#434654] max-w-md mx-auto leading-relaxed">
            Berkas laporan Anda telah terdaftar dalam sistem pra-pelaporan LAPORKITO Kota Palembang
            dan siap diverifikasi oleh petugas berwenang.
          </p>
        </div>

        {/* Big Tracking Code Box */}
        <div className="rounded-xl border-2 border-[#1749D2]/30 bg-[#F0F3FF] p-5 text-center space-y-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[#667085] block font-semibold">
            KODE LACAK LAPORAN ANDA
          </span>
          <div className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-[#1749D2]">
            {trackingCode}
          </div>
          <p className="text-[11px] text-[#434654] leading-relaxed">
            Simpan kode ini dengan baik. Gunakan kode ini untuk memantau status aduan tanpa perlu
            membuat akun.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D9DEE7] bg-white px-3.5 font-mono text-xs font-semibold text-[#111C2D] shadow-xs hover:bg-[#F0F3FF] transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="h-4 w-4 text-[#16845B]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#1749D2]" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D9DEE7] bg-white px-3.5 font-mono text-xs font-semibold text-[#111C2D] shadow-xs hover:bg-[#F0F3FF] transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-[#16845B]" />
                  <span>Tautan Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-[#E58A1F]" />
                  <span>Salin Tautan Pantau</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Summary Card */}
        <div className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE7]">
            <span className="font-mono text-[11px] font-semibold text-[#667085] uppercase">
              Rincian Laporan Terdaftar
            </span>
            <span className="rounded bg-[#E6F7EF] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#006443]">
              STATUS: SUBMITTED
            </span>
          </div>

          {reportTitle && (
            <div className="flex items-start gap-2">
              <span className="text-[#667085] font-mono w-28 shrink-0">Judul:</span>
              <span className="font-semibold text-[#111C2D]">{reportTitle}</span>
            </div>
          )}

          {categoryName && (
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-[#667085]" />
              <span className="text-[#667085] font-mono w-28 shrink-0">Kategori:</span>
              <span className="text-[#111C2D]">{categoryName}</span>
            </div>
          )}

          {createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[#667085]" />
              <span className="text-[#667085] font-mono w-28 shrink-0">Waktu Lapor:</span>
              <span className="font-mono text-[#111C2D]">
                {new Date(createdAt).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                WIB
              </span>
            </div>
          )}
        </div>

        {/* Protection Notice */}
        <div className="flex items-start gap-2.5 rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-3 text-xs text-[#434654]">
          <ShieldCheck className="h-4 w-4 text-[#16845B] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Data pribadi Anda (nomor HP dan email) dilindungi dan tidak ditampilkan ke publik.
            Halaman pemantauan hanya dapat diakses melalui kode unik ini.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href={`/pantau/${trackingCode}`}
            className="inline-flex h-11 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-6 font-mono text-xs font-semibold text-white shadow-sm hover:bg-[#0033A7] transition-all active:scale-95"
          >
            <span>Pantau Status Laporan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[#D9DEE7] bg-white px-5 font-mono text-xs font-semibold text-[#111C2D] hover:bg-[#F0F3FF] transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
