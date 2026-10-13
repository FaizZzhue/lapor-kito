"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Lock, ArrowUpRight } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Do not render public citizen footer inside internal admin / petugas portals
  if (pathname.startsWith("/admin") || pathname.startsWith("/petugas")) {
    return null;
  }

  return (
    <footer className="w-full px-3 pb-3 pt-8 sm:px-6 sm:pb-4 sm:pt-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">

        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-8 p-5 sm:p-7 md:grid-cols-12 md:gap-8 lg:p-8">

          {/* Brand & Purpose */}
          <div className="space-y-4 md:col-span-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Beranda LAPORKITO Palembang"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm transition-transform group-hover:scale-105">
                <span className="relative block h-5 w-4" aria-hidden="true">
                  <span className="absolute left-0 top-0 h-full w-1 rounded-sm bg-white" />
                  <span className="absolute left-0 top-0 h-1 w-full rounded-sm bg-white" />
                </span>
                <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
              </div>

              <div className="flex flex-col">
                <span className="text-base font-bold leading-none tracking-tight text-slate-900">
                  LAPORKITO
                </span>
              </div>
            </Link>

            <p className="max-w-lg text-xs leading-relaxed text-slate-600 sm:text-sm">
              LAPORKITO adalah platform pendamping pra-pelaporan
              partisipasi warga yang membantu menyusun uraian masalah,
              menguji kelengkapan bukti lapangan, dan merekomendasikan
              instansi berwenang sebelum laporan diteruskan ke kanal
              penanganan.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
              <span className="flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 shrink-0 text-blue-700"
                  aria-hidden="true"
                />
                18 Kecamatan Palembang
              </span>

              <span className="flex items-center gap-2">
                <Lock
                  className="h-4 w-4 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
                Data Pribadi Terlindungi
              </span>
            </div>
          </div>

          {/* Public Services */}
          <div className="space-y-4 md:col-span-3 md:col-start-9">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Layanan Publik
            </h4>

            <nav aria-label="Layanan Publik">
              <ul className="space-y-3 text-xs text-slate-600 sm:text-sm">
                <li>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 transition-colors hover:text-blue-700"
                  >
                    Beranda
                  </Link>
                </li>

                <li>
                  <Link
                    href="/lapor"
                    className="inline-flex items-center gap-1 transition-colors hover:text-blue-700"
                  >
                    Buat Laporan Baru
                  </Link>
                </li>

                <li>
                  <Link
                    href="/pantau"
                    className="inline-flex items-center gap-1 transition-colors hover:text-blue-700"
                  >
                    Pantau Laporan
                  </Link>
                </li>

                <li>
                  <Link
                    href="/#cara-kerja"
                    className="inline-flex items-center gap-1 transition-colors hover:text-blue-700"
                  >
                    Cara Kerja Sistem
                  </Link>
                </li>

                <li>
                  <Link
                    href="/#faq"
                    className="inline-flex items-center gap-1 transition-colors hover:text-blue-700"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-2 border-t border-slate-200/80 bg-slate-50/70 px-5 py-4 text-center sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:text-left lg:px-8">
          <span className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} LAPORKITO. All Right Reserve.
          </span>

          <Link
            href="/"
            className="text-[11px] font-medium text-slate-500 transition-colors hover:text-blue-700"
          >
            Layanan Pengaduan Kota Palembang
          </Link>
        </div>

      </div>
    </footer>
  );
}
