import Link from "next/link";
import { CheckCircle2, Home, ShieldCheck, FileText } from "lucide-react";

interface TanggapanBerhasilViewProps {
  trackingCode: string;
}

export function TanggapanBerhasilView({ trackingCode }: TanggapanBerhasilViewProps) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 sm:p-8 shadow-sm text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F7EF] text-[#16845B]">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="rounded bg-[#E6F7EF] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#006443] border border-[#78D9AA]/50 uppercase tracking-wider">
            Tanggapan Warga Terdaftar
          </span>
          <h1 className="text-2xl font-bold text-[#111C2D]">Tanggapan Berhasil Dikirim</h1>
          <p className="text-xs text-[#434654] leading-relaxed max-w-md mx-auto">
            Klarifikasi atau informasi tambahan Anda telah berhasil dilampirkan pada berkas pengaduan{" "}
            <strong className="font-mono text-[#1749D2]">#{trackingCode}</strong> dan akan segera
            ditinjau oleh petugas teknis UPT wilayah terkait.
          </p>
        </div>

        <div className="rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-4 text-xs text-[#434654] space-y-2 text-left font-mono">
          <div className="flex items-center gap-1.5 font-bold text-[#1749D2]">
            <ShieldCheck className="h-4 w-4" />
            <span>CATATAN PEMERIKSAAN SISTEM:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            • Status: Berhasil tersimpan dalam riwayat berkas publik.<br />
            • Kode Lacak: {trackingCode}<br />
            • Tipe: Klarifikasi Warga Terverifikasi
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href={`/pantau/${trackingCode}`}
            className="inline-flex h-11 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-6 font-mono text-xs font-semibold text-white shadow-sm hover:bg-[#0033A7] transition-all active:scale-95"
          >
            <FileText className="h-4 w-4" />
            <span>Lihat Detail Laporan</span>
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
