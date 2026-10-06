"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not render public citizen navbar inside internal admin / petugas portals
  if (pathname.startsWith('/admin') || pathname.startsWith('/petugas')) {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Beranda", active: pathname === "/" },
    { href: "/#faq", label: "FAQ", active: false },
    { href: "/pantau", label: "Pantau Laporan", active: pathname.startsWith("/pantau") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D9DEE7] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#1749D2] text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="relative block h-5 w-4">
                <span className="absolute left-0 top-0 h-full w-1 bg-white" />
                <span className="absolute left-0 top-0 h-1 w-full bg-white" />
              </span>

              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-[#E58A1F]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#111C2D] leading-none">
                LAPORKITO
              </span>
              {/* <span className="text-[10px] font-mono tracking-tight text-[#667085] leading-none mt-1 hidden sm:inline-block">
                Kanal Pra-Pelaporan Warga Kota Palembang
              </span> */}
            </div>
          </Link>

          {/* <div className="hidden xl:flex items-center gap-1.5 ml-4 rounded-md border border-[#D9DEE7] bg-[#F0F3FF] px-2.5 py-1 text-[11px] font-mono text-[#434654]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16845B] animate-pulse" />
            <span>ALUR PRA-PELAPORAN TERVERIFIKASI</span>
          </div> */}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${link.active
                ? "bg-[#DFE8FF] text-[#0033A7] font-semibold"
                : "text-[#434654] hover:bg-[#F0F3FF] hover:text-[#111C2D]"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/lapor"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0033A7] active:scale-95"
          >
            <span>Ceritakan Masalah</span>
            {/* <ArrowRight className="h-3.5 w-3.5" /> */}
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/lapor"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-[#1749D2] px-3 text-xs font-semibold text-white shadow-sm"
          >
            Lapor
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9DEE7] bg-white text-[#434654] hover:bg-[#F0F3FF]"
            aria-label="Buka menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="border-b border-[#D9DEE7] bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${link.active
                  ? "bg-[#DFE8FF] text-[#0033A7] font-semibold"
                  : "text-[#434654] hover:bg-[#F0F3FF]"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/lapor"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1749D2] text-sm font-semibold text-white shadow-sm hover:bg-[#0033A7]"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Ceritakan Masalah Sekarang</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
