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
  Mail,
  AlertTriangle,
} from "lucide-react";

interface BerhasilViewProps {
  trackingCode: string | null;
  reportTitle?: string | null;
  categoryName?: string | null;
  createdAt?: string | null;
  emailSent?: boolean;
  emailRecipient?: string;
  emailReason?: string;
}

export function BerhasilView({
  trackingCode,
  reportTitle,
  categoryName,
  createdAt,
  emailSent,
  emailRecipient,
  emailReason,
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
      <div className="mx-auto max-w-xl editorial-panel p-8 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
        <h1 className="text-xl font-bold text-slate-900">Kode Lacak Tidak Ditemukan</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Halaman ini memerlukan parameter kode lacak yang valid. Jika Anda baru saja melapor, periksa
          kembali tautan atau kotak masuk email Anda.
        </p>
        <div className="pt-2">
          <Link
            href="/lapor"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-5 text-xs font-semibold text-white hover:bg-blue-800"
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
      <div className="editorial-panel p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-8 w-8" />
          </div>
          <span className="inline-block rounded bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 border border-emerald-200 uppercase tracking-wider">
            Laporan Berhasil Dicatat
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pengaduan Anda Telah Diterima
          </h1>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Berkas laporan Anda telah terdaftar dalam sistem pra-pelaporan LAPORKITO Kota Palembang
            dan siap diverifikasi oleh petugas berwenang.
          </p>
        </div>

        {/* Big Tracking Code Box */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 text-center space-y-3">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-500 block font-semibold">
            KODE LACAK LAPORAN ANDA
          </span>
          <div className="font-mono text-xl min-[360px]:text-2xl sm:text-3xl font-bold tracking-wider text-blue-700 break-all">
            {trackingCode}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Simpan kode ini dengan baik. Gunakan kode ini untuk memantau status aduan tanpa perlu
            membuat akun.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-xs font-semibold text-slate-900 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-blue-700" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-xs font-semibold text-slate-900 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Tautan Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-amber-600" />
                  <span>Salin Tautan Pantau</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Summary Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-mono text-[11px] font-semibold text-slate-600 uppercase">
              Rincian Laporan Terdaftar
            </span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 border border-emerald-200">
              Status: Laporan Masuk
            </span>
          </div>

          {reportTitle && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="text-slate-500 font-mono sm:w-28 shrink-0">Judul:</span>
              <span className="font-semibold text-slate-900 break-words">{reportTitle}</span>
            </div>
          )}

          {categoryName && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:w-28 shrink-0 text-slate-500 font-mono">
                <Tag className="h-3.5 w-3.5" />
                <span>Kategori:</span>
              </div>
              <span className="text-slate-900">{categoryName}</span>
            </div>
          )}

          {createdAt && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:w-28 shrink-0 text-slate-500 font-mono">
                <Calendar className="h-3.5 w-3.5" />
                <span>Waktu Lapor:</span>
              </div>
              <span className="font-mono text-slate-900">
                {new Date(createdAt).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                WIB
              </span>
            </div>
          )}
        </div>

        {/* Email Notification Status (Transparent, auditable feedback) */}
        {emailRecipient && (
          <div
            className={`rounded-xl border p-4 space-y-2 text-xs ${
              emailSent
                ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
                : "border-amber-200 bg-amber-50/80 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                <Mail className={`h-4 w-4 ${emailSent ? "text-emerald-700" : "text-amber-700"}`} />
                <span>
                  {emailSent ? "Email Konfirmasi Terkirim" : "Notifikasi Email Belum Terkirim"}
                </span>
              </div>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                  emailSent
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                {emailSent ? "DELIVERED TO PROVIDER" : "SANDBOX NOTICE"}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed">
              {emailSent ? (
                <>
                  Rincian laporan dan tautan pelacakan telah berhasil diserahkan ke provider email untuk dikirim ke{" "}
                  <strong>{emailRecipient}</strong>. Silakan periksa kotak masuk (inbox) atau folder Spam/Promosi Anda.
                </>
              ) : (
                <>
                  Pengiriman email konfirmasi ke <strong>{emailRecipient}</strong> belum dapat diteruskan oleh provider{" "}
                  <em>(Sistem pengujian saat ini memakai domain sandbox Resend onboarding@resend.dev yang membatasi pengiriman ke luar email pengembang)</em>.
                </>
              )}
            </p>

            {!emailSent && (
              <p className="text-[11px] text-amber-900 font-medium pt-0.5">
                ✓ <strong>Catatan:</strong> Laporan Anda tetap berhasil tersimpan secara resmi di database LAPORKITO dan dapat Anda pantau kapan saja menggunakan <strong>Kode Lacak</strong> di atas.
              </p>
            )}
          </div>
        )}

        {/* Protection Notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50/50 p-3.5 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Data pribadi Anda (nomor HP dan email) dilindungi dan tidak ditampilkan ke publik.
            Halaman pemantauan hanya dapat diakses melalui kode unik ini.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href={`/pantau/${trackingCode}`}
            className="inline-flex h-11 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 font-mono text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-all active:scale-95"
          >
            <span>Pantau Status Laporan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
