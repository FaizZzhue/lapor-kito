"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Building2,
  ShieldCheck,
  UploadCloud,
  Trash2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { submitReporterResponseAction } from "@/lib/actions/responses";
import { uploadEvidenceAction } from "@/lib/actions/reports";
import type { PublicReportData } from "@/lib/actions/tracking";

interface TanggapanFormProps {
  trackingCode: string;
  report: PublicReportData;
  categoryName?: string;
  latestOfficialResponse?: {
    message: string;
    created_at: string;
    response_type: string;
  };
}

export function TanggapanForm({
  trackingCode,
  report,
  categoryName,
  latestOfficialResponse,
}: TanggapanFormProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Optional attachment
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadEvidenceAction(formData);
    setIsUploading(false);

    if (res.success && res.fileUrl) {
      setAttachment({ url: res.fileUrl, name: file.name });
    } else {
      setUploadError(res.error || "Gagal mengunggah foto lampiran.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (message.trim().length < 10) {
      setFormError("Pesan tanggapan minimal 10 karakter.");
      return;
    }

    if (!verificationEmail.trim()) {
      setFormError(
        "Masukkan email atau kontak yang Anda gunakan saat pertama kali membuat laporan untuk memverifikasi kepemilikan."
      );
      return;
    }

    setIsSubmitting(true);

    const attachments = attachment ? [attachment] : [];
    const res = await submitReporterResponseAction(
      trackingCode,
      { message: message.trim(), attachments },
      verificationEmail.trim()
    );

    setIsSubmitting(false);

    if (res.success) {
      router.push(`/pantau/${trackingCode}/tanggapan/berhasil`);
    } else {
      setFormError(res.error || "Gagal mengirimkan tanggapan.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Back Link */}
      <div>
        <Link
          href={`/pantau/${trackingCode}`}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Detail Laporan (#{trackingCode})</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <span className="rounded-full bg-blue-50 px-3 py-0.5 font-mono text-[10px] font-bold text-blue-800 uppercase tracking-wider border border-blue-200">
          KLARIFIKASI & TANGGAPAN WARGA
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Balas Tanggapan Petugas
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Sampaikan informasi tambahan, klarifikasi perkembangan lapangan, atau tanggapan atas arahan petugas terkait pengaduan Anda.
        </p>
      </div>

      {/* Context Report Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-extrabold text-blue-800 select-all">#{report.tracking_code}</span>
            <span>•</span>
            <span className="text-slate-500 font-semibold">{categoryName}</span>
          </div>
          <p className="text-sm font-bold text-slate-900 break-words">{report.title}</p>
          <p className="text-xs text-slate-500 break-words">{report.address_detail}</p>
        </div>
        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-xs font-bold text-blue-800 shrink-0 self-start sm:self-center">
          {report.status.toUpperCase()}
        </span>
      </div>

      {/* Main Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section A: Konteks Tanggapan Terakhir dari Petugas */}
        {latestOfficialResponse ? (
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold uppercase text-slate-600">
              Konteks Tanggapan Terakhir dari Petugas:
            </span>
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-700 text-white">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-bold text-slate-900">Petugas Teknis Instansi</span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  {new Date(latestOfficialResponse.created_at).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  WIB
                </span>
              </div>
              <blockquote className="rounded-lg bg-white p-3 border border-slate-200 text-xs text-slate-800 leading-relaxed italic">
                &quot;{latestOfficialResponse.message}&quot;
              </blockquote>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600 font-mono">
            Belum ada tanggapan resmi tercatat. Anda dapat menambahkan catatan perkembangan terkini untuk membantu verifikasi petugas lapangan.
          </div>
        )}

        {/* Form Error Banner */}
        {formError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-2xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold font-mono">Pemeriksaan Tanggapan:</p>
              <p className="text-[11px] leading-relaxed">{formError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ownership Verification */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-900">
              <Lock className="h-3.5 w-3.5 text-blue-700" />
              <span>VERIFIKASI KEPEMILIKAN LAPORAN</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Untuk mencegah pengiriman tanggapan oleh pihak luar, masukkan alamat email (atau nomor kontak) yang Anda gunakan saat pertama kali membuat laporan ini.
            </p>
            <input
              type="text"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              placeholder="Masukkan email / kontak terdaftar Anda"
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          {/* Textarea Tanggapan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="response-content"
                className="block text-xs font-mono font-bold uppercase text-slate-800"
              >
                Pesan Tanggapan / Keterangan Tambahan <span className="text-red-600">*</span>
              </label>
              <span className="font-mono text-[11px] text-slate-400">
                {message.length} / 500 karakter (min. 10)
              </span>
            </div>
            <textarea
              id="response-content"
              rows={5}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan keterangan objektif terkait kondisi terkini di lapangan..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y leading-relaxed transition-all"
              required
            />
          </div>

          {/* Optional Attachment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase text-slate-800">
              Foto Bukti Tambahan (Opsional)
            </label>

            {attachment ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-blue-50/50 p-2.5 text-xs">
                <span className="font-mono truncate text-slate-800">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  aria-label="Hapus lampiran"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3.5 text-xs font-mono text-blue-700 cursor-pointer hover:bg-blue-50/50 transition-colors">
                <UploadCloud className="h-4 w-4" />
                <span>
                  {isUploading ? "Mengunggah foto..." : "+ Unggah Foto Bukti Tambahan (JPG, PNG, WebP)"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}

            {uploadError && <p className="text-xs text-red-600 font-mono">{uploadError}</p>}
          </div>

          {/* Privacy & Transparency Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Tanggapan ini akan dicatat sebagai catatan tindak lanjut warga pada berkas laporan publik #{report.tracking_code} dan diteruskan ke petugas wilayah penanganan teknis.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Link
              href={`/pantau/${trackingCode}`}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-white px-5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Kembali ke Laporan
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 font-mono text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirimkan Tanggapan...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Kirim Tanggapan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
