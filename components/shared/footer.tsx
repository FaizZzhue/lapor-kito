import Link from "next/link";
import { Shield, MapPin, FileCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#D9DEE7] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 pb-8 border-b border-[#D9DEE7]">
          {/* Brand & Purpose */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-[#1749D2] text-white shadow-xs">
                <span className="font-bold text-sm">L</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-[#E58A1F]" />
              </div>
              <span className="text-base font-bold text-[#111C2D]">LAPORKITO</span>
              <span className="rounded bg-[#F0F3FF] border border-[#D9DEE7] px-2 py-0.5 font-mono text-[10px] text-[#434654]">
                Kota Palembang
              </span>
            </div>
            <p className="text-xs text-[#434654] leading-relaxed max-w-lg">
              LAPORKITO adalah platform pendamping pra-pelaporan partisipasi warga, dirancang untuk
              membantu menyusun uraian masalah yang jelas, menguji validitas bukti lapangan, dan
              merekomendasikan instansi yang berwenang sebelum diteruskan ke kanal penanganan.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#667085]">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-[#16845B]" /> Tanpa Login untuk Warga
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#1749D2]" /> Lingkup Wilayah Palembang
              </span>
              <span className="flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5 text-[#E58A1F]" /> Verifikasi Berkas Mandiri
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#111C2D]">
              Layanan Publik
            </h4>
            <ul className="space-y-1.5 text-xs text-[#434654]">
              <li>
                <Link href="/" className="hover:text-[#1749D2] transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/lapor" className="hover:text-[#1749D2] transition-colors">
                  Buat Laporan Baru
                </Link>
              </li>
              <li>
                <Link href="/pantau" className="hover:text-[#1749D2] transition-colors">
                  Pantau Laporan (Kode Lacak)
                </Link>
              </li>
              <li>
                <Link href="/#cara-kerja" className="hover:text-[#1749D2] transition-colors">
                  Cara Kerja Sistem
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Integrity Note */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#111C2D]">
              Integritas & Keamanan
            </h4>
            <p className="text-xs text-[#667085] leading-relaxed">
              Data pribadi pelapor (nama, telepon, email) dilindungi dan tidak dipublikasikan ke publik.
              Pelacakan publik hanya menampilkan kode lacak, deskripsi kejadian, dan status penanganan.
            </p>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#667085]">
          <span>© 2026 LAPORKITO. Platform Pra-Pelaporan Partisipasi Warga Kota Palembang.</span>
          <span>Infrastruktur Transparansi & Tata Kelola Pengaduan Publik</span>
        </div>
      </div>
    </footer>
  );
}
