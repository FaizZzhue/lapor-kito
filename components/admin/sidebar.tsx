"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Network,
  Users,
  Tags,
  ShieldCheck,
  Settings,
  FileClock,
  User,
  LogOut,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import type { UserProfile } from "@/types/auth";

interface AdminSidebarProps {
  user: UserProfile;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";

  const menuUtama: NavItem[] = isAdmin
    ? [
        { label: "Ringkasan Platform", href: "/admin", icon: LayoutDashboard, exact: true },
        { label: "Laporan Masuk", href: "/admin/laporan", icon: Inbox },
      ]
    : [
        { label: "Laporan Masuk", href: "/admin/laporan", icon: Inbox },
      ];

  const dataMaster: NavItem[] = [
    { label: "Instansi", href: "/admin/instansi", icon: Building2 },
    { label: "Unit", href: "/admin/unit", icon: Network },
    { label: "Pengguna Internal", href: "/admin/pengguna-internal", icon: Users },
    { label: "Kategori Laporan", href: "/admin/kategori-laporan", icon: Tags },
    { label: "Data Kewenangan", href: "/admin/data-kewenangan", icon: ShieldCheck },
  ];

  const tataKelola: NavItem[] = [
    { label: "Pengaturan Sistem", href: "/admin/pengaturan-sistem", icon: Settings },
    { label: "Log Audit & Sesi", href: "/admin/log-audit", icon: FileClock },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-[#D9DEE7] z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Scrollable Navigation Area */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-[#F0F3FF]">
          <Link href={isAdmin ? "/admin" : "/admin/laporan"} className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#1749D2] text-white shadow-sm">
              <span className="relative block h-5 w-4">
                <span className="absolute left-0 top-0 h-full w-1 bg-white" />
                <span className="absolute left-0 top-0 h-1 w-full bg-white" />
              </span>
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-[#E58A1F]" />
            </div>
            <span className="text-lg font-bold text-[#0033A7] tracking-tight">LAPORKITO</span>
          </Link>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#DFE8FF] text-[#0033A7] font-semibold">
            {isAdmin ? "Konsol Admin" : "Konsol Petugas"}
          </span>
        </div>

        {/* Section: MENU UTAMA */}
        <div className="px-4 py-3">
          <p className="px-3 py-1.5 text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
            MENU UTAMA
          </p>
          <nav className="flex flex-col gap-1 mt-1">
            {menuUtama.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors ${
                    active
                      ? "bg-[#DFE8FF] text-[#0033A7] font-semibold"
                      : "text-[#434654] hover:bg-[#F0F3FF] hover:text-[#111C2D]"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section: DATA MASTER (Admin only) */}
        {isAdmin && (
          <div className="px-4 py-3">
            <p className="px-3 py-1.5 text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
              DATA MASTER
            </p>
            <nav className="flex flex-col gap-1 mt-1">
              {dataMaster.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors ${
                      active
                        ? "bg-[#DFE8FF] text-[#0033A7] font-semibold"
                        : "text-[#434654] hover:bg-[#F0F3FF] hover:text-[#111C2D]"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Section: PENGATURAN & TATA KELOLA (Admin only) */}
        {isAdmin && (
          <div className="px-4 py-3">
            <p className="px-3 py-1.5 text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
              PENGATURAN & TATA KELOLA
            </p>
            <nav className="flex flex-col gap-1 mt-1">
              {tataKelola.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors ${
                      active
                        ? "bg-[#DFE8FF] text-[#0033A7] font-semibold"
                        : "text-[#434654] hover:bg-[#F0F3FF] hover:text-[#111C2D]"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Profile Card & Sign Out */}
      <div className="p-4 bg-[#F0F3FF] border-t border-[#D9DEE7]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0033A7] flex items-center justify-center text-white shrink-0">
              <User className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#111C2D] truncate">
                {user.full_name || "Admin LAPORKITO"}
              </p>
              <p className="text-[11px] text-[#747686] truncate max-w-[125px]">
                {user.email}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Keluar dari sistem"
              title="Keluar dari sesi"
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#BA1A1A] hover:underline transition-all p-1.5 rounded hover:bg-[#FFDAD6]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BA1A1A]/30"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </form>
        </div>

        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DFE8FF] text-[#0033A7]">
          {user.role === 'admin' ? 'Administrator Sistem' : 'Petugas Instansi'}
        </span>
      </div>
    </aside>
  );
}
