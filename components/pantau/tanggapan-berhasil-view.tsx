import Link from "next/link";
import { CheckCircle2, Home, ShieldCheck, FileText } from "lucide-react";

interface TanggapanBerhasilViewProps {
  trackingCode: string;
}

export function TanggapanBerhasilView({ trackingCode }: TanggapanBerhasilViewProps) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="editorial-panel p-6 sm:p-8 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="rounded bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 border border-emerald-200 uppercase tracking-wider">
            Tanggapan Warga Terdaftar
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tanggapan Berhasil Dikirim</h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            Klarifikasi atau informasi tambahan Anda telah berhasil dilampirkan pada berkas pengaduan{" "}
            <strong className="font-mono text-blue-700">#{trackingCode}</strong> dan akan segera
            ditinjau oleh petugas teknis UPT wilayah terkait.
          </p>
        </div>

        <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 text-xs text-slate-700 space-y-2 text-left font-mono">
          <div className="flex items-center gap-1.5 font-bold text-blue-700">
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
            className="inline-flex h-11 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 font-mono text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-all active:scale-95"
          >
            <FileText className="h-4 w-4" />
            <span>Lihat Detail Laporan</span>
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
