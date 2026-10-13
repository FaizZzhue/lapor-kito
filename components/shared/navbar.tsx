"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not render public citizen navbar inside internal admin / petugas portals
  if (pathname.startsWith("/admin") || pathname.startsWith("/petugas")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Beranda", active: pathname === "/" },
    { href: "/#faq", label: "FAQ", active: false },
    { href: "/pantau", label: "Pantau Laporan", active: pathname.startsWith("/pantau") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="relative mx-auto max-w-7xl">
        {/* Main Navbar */}
        <div className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 shadow-sm backdrop-blur-xl transition-all sm:px-5 lg:px-6">

          {/* Logo */}
          <Link
            href="/"
            className="group flex min-w-0 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:gap-2.5"
            aria-label="Beranda LAPORKITO Palembang"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="relative block h-5 w-4" aria-hidden="true">
                <span className="absolute left-0 top-0 h-full w-1 rounded-sm bg-white" />
                <span className="absolute left-0 top-0 h-1 w-full rounded-sm bg-white" />
              </span>
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold leading-none tracking-tight text-slate-900 sm:text-base">
                LAPORKITO
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navigasi Utama"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors lg:px-3.5 ${link.active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <Link
            href="/lapor"
            className="hidden h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-blue-700 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:inline-flex"
          >
            Ceritakan Masalah
          </Link>

          {/* Mobile Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:hidden">
            <Link
              href="/lapor"
              className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg bg-blue-700 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-blue-800 active:scale-[0.98] min-[380px]:text-xs"
            >
              <span className="min-[380px]:hidden">Lapor</span>
              <span className="hidden min-[380px]:inline">
                Ceritakan Masalah
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-panel"
              aria-label={
                mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
              }
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-panel"
            className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg md:hidden"
          >
            <nav
              className="flex flex-col gap-1"
              aria-label="Navigasi Seluler"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex min-h-11 items-center rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${link.active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 border-t border-slate-200 pt-3">
                <Link
                  href="/lapor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Ceritakan Masalah Sekarang
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
