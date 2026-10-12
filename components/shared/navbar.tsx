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
    <header className="sticky top-0 z-50 w-full border-b border-[#D9DEE7] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2] rounded-lg"
            aria-label="Beranda LAPORKITO Palembang"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1749D2] text-white shadow-xs transition-transform group-hover:scale-105">
              <span className="relative block h-5 w-4" aria-hidden="true">
                <span className="absolute left-0 top-0 h-full w-1 bg-white rounded-xs" />
                <span className="absolute left-0 top-0 h-1 w-full bg-white rounded-xs" />
              </span>
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-[#E58A1F]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-bold tracking-tight text-[#111C2D] leading-none truncate">
                LAPORKITO
              </span>
              <span className="text-[10px] font-medium tracking-tight text-[#667085] leading-none mt-1 truncate">
                Kota Palembang
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2] ${link.active
                ? "bg-[#DFE8FF] text-[#0033A7]"
                : "text-[#434654] hover:bg-[#F0F3FF] hover:text-[#111C2D]"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/lapor"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#0033A7] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2] focus-visible:ring-offset-2"
          >
            <span>Ceritakan Masalah</span>
          </Link>
        </div>

        {/* Mobile Action & Menu Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
          <Link
            href="/lapor"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1749D2] px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold text-white shadow-xs hover:bg-[#0033A7] active:scale-95 transition-all whitespace-nowrap"
          >
            <span className="hidden min-[360px]:inline">Ceritakan Masalah</span>
            <span className="min-[360px]:hidden">Lapor</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9DEE7] bg-white text-[#434654] hover:bg-[#F0F3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2] touch-manipulation cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-panel"
          className="border-b border-[#D9DEE7] bg-white px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-150 shadow-md"
        >
          <nav className="flex flex-col gap-1.5" aria-label="Navigasi Seluler">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center min-h-[44px] rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors ${link.active
                  ? "bg-[#DFE8FF] text-[#0033A7]"
                  : "text-[#434654] hover:bg-[#F0F3FF]"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-1 border-t border-[#D9DEE7]">
              <Link
                href="/lapor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#1749D2] text-xs font-semibold text-white shadow-xs hover:bg-[#0033A7] active:scale-95 transition-all"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>Ceritakan Masalah Sekarang</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
