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
          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#434654] hover:text-[#1749D2] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Detail Laporan (#{trackingCode})</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <span className="rounded bg-[#DFE8FF] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#0033A7] uppercase tracking-wider">
          Klarifikasi & Lampiran Warga
        </span>
        <h1 className="text-2xl font-bold text-[#111C2D]">Balas Tanggapan</h1>
        <p className="text-xs text-[#434654] leading-relaxed">
          Sampaikan informasi tambahan, klarifikasi kondisi terkini di lapangan, atau tanggapan terkait
          progres yang Anda terima.
        </p>
      </div>

      {/* Context Report Card */}
      <div className="rounded-xl border border-[#D9DEE7] bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold text-[#1749D2]">#{report.tracking_code}</span>
            <span>•</span>
            <span className="text-[#667085]">{categoryName}</span>
          </div>
          <p className="text-xs font-semibold text-[#111C2D] truncate">{report.title}</p>
          <p className="text-[11px] text-[#667085] truncate">{report.address_detail}</p>
        </div>
        <span className="rounded-full bg-[#F0F3FF] border border-[#D9DEE7] px-3 py-1 font-mono text-[11px] font-semibold text-[#1749D2] shrink-0 self-start sm:self-center">
          {report.status.toUpperCase()}
        </span>
      </div>

      {/* Main Dual-Section Form Card */}
      <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 shadow-sm space-y-6">
        {/* Section A: Konteks Riwayat Tanggapan Sebelumnya */}
        {latestOfficialResponse ? (
          <div className="space-y-2">
            <span className="font-mono text-xs font-semibold uppercase text-[#667085]">
              Konteks Tanggapan Terakhir dari Petugas:
            </span>
            <div className="rounded-xl border border-[#D9DEE7] bg-[#F0F3FF] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0033A7] text-white">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-semibold text-[#111C2D]">Petugas Teknis Instansi</span>
                </div>
                <span className="font-mono text-[11px] text-[#667085]">
                  {new Date(latestOfficialResponse.created_at).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  WIB
                </span>
              </div>
              <blockquote className="rounded-lg bg-white p-3 border border-[#D9DEE7] text-xs text-[#111C2D] italic">
                &quot;{latestOfficialResponse.message}&quot;
              </blockquote>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3 text-xs text-[#667085] font-mono">
            Belum ada tanggapan resmi tercatat. Anda dapat menambahkan catatan perkembangan terkini untuk
            membantu petugas saat melakukan inspeksi.
          </div>
        )}

        {/* Form Error Banner */}
        {formError && (
          <div className="flex items-start gap-2 rounded-lg border border-[#FFDAD6] bg-[#FFF5F5] p-3.5 text-xs text-[#BA1A1A]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold font-mono">Verifikasi Gagal:</p>
              <p className="text-[11px] leading-relaxed">{formError}</p>
            </div>
          </div>
        )}

        {/* Section B: Form Balasan Anda */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ownership Verification Boundary Field */}
          <div className="rounded-lg border border-[#1749D2]/30 bg-[#F0F3FF] p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#1749D2]">
              <Lock className="h-3.5 w-3.5" />
              <span>VERIFIKASI KEPEMILIKAN PELAPOR</span>
            </div>
            <p className="text-[11px] text-[#434654] leading-relaxed">
              Untuk mencegah pengiriman tanggapan oleh pihak yang tidak berhak, masukkan alamat email
              (atau nomor telepon) yang Anda daftarkan saat membuat laporan ini.
            </p>
            <input
              type="text"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              placeholder="Masukkan email terdaftar Anda (contoh: warga@gmail.com)"
              className="w-full h-10 rounded-md border border-[#D9DEE7] bg-white px-3 text-xs font-mono text-[#111C2D] focus:border-[#1749D2] focus:outline-none"
              required
            />
          </div>

          {/* Textarea Tanggapan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="response-content"
                className="block text-xs font-mono font-semibold uppercase text-[#111C2D]"
              >
                Tanggapan / Keterangan Tambahan <span className="text-[#BA1A1A]">*</span>
              </label>
              <span className="font-mono text-[11px] text-[#667085]">
                {message.length} / 500 karakter (min. 10)
              </span>
            </div>
            <textarea
              id="response-content"
              rows={5}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contoh: Kondisi lubang semakin parah setelah hujan semalam. Titik persis berada 5 meter di samping tiang listrik..."
              className="w-full rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3 text-xs text-[#111C2D] placeholder:text-[#667085] focus:border-[#1749D2] focus:bg-white focus:outline-none resize-y leading-relaxed"
              required
            />
            <p className="text-[11px] text-[#667085]">
              Tuliskan keterangan secara objektif dan hindari mencantumkan data pribadi yang sensitif.
            </p>
          </div>

          {/* Optional Attachment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-semibold uppercase text-[#111C2D]">
              Foto Bukti Tambahan (Opsional)
            </label>

            {attachment ? (
              <div className="flex items-center justify-between rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-2.5 text-xs">
                <span className="font-mono truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded"
                  aria-label="Hapus lampiran"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#D9DEE7] bg-[#F9F9FF] p-3 text-xs font-mono text-[#1749D2] cursor-pointer hover:bg-[#F0F3FF]">
                <UploadCloud className="h-4 w-4" />
                <span>
                  {isUploading ? "Mengunggah foto..." : "+ Unggah Foto Bukti Tambahan (JPG/PNG)"}
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

            {uploadError && <p className="text-xs text-[#BA1A1A] font-mono">{uploadError}</p>}
          </div>

          {/* Notice of Transparency */}
          <div className="flex items-start gap-2 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3 text-xs text-[#667085]">
            <ShieldCheck className="h-4 w-4 text-[#16845B] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Tanggapan ini akan dicatat sebagai catatan tindak lanjut warga pada berkas laporan publik
              #{report.tracking_code} dan diteruskan ke tim penanganan teknis.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#D9DEE7]">
            <Link
              href={`/pantau/${trackingCode}`}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-[#D9DEE7] bg-white px-5 font-mono text-xs font-semibold text-[#111C2D] hover:bg-[#F0F3FF]"
            >
              Kembali ke Laporan
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-6 font-mono text-xs font-semibold text-white shadow-sm hover:bg-[#0033A7] transition-all disabled:opacity-50"
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
