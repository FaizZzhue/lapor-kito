"use client";

import { Landmark, Menu, KeyRound } from "lucide-react";
import type { UserProfile } from "@/types/auth";

interface AdminHeaderProps {
  user: UserProfile;
  onToggleSidebar?: () => void;
  onOpenChangePassword?: () => void;
}

export function AdminHeader({ user, onToggleSidebar, onOpenChangePassword }: AdminHeaderProps) {
  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 border-b border-[#D9DEE7] shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      {/* Mobile Drawer Trigger & Institutional Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Buka menu navigasi admin"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9DEE7] bg-white text-[#434654] hover:bg-[#F0F3FF] hover:text-[#0033A7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2] cursor-pointer shrink-0"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Landmark className="w-4 h-4 text-[#747686] shrink-0 hidden sm:block" aria-hidden="true" />
          <span className="text-[12px] sm:text-[13px] text-[#434654] font-medium truncate">
            <span className="hidden sm:inline">Pemerintah Kota Palembang • </span>
            <span className="font-semibold text-[#111C2D]">Konsol Operasional</span>
          </span>
        </div>
      </div>

      {/* Status & Identity Right */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          {onOpenChangePassword && (
            <button
              type="button"
              onClick={onOpenChangePassword}
              className="p-1.5 rounded-lg border border-[#D9DEE7] text-[#747686] hover:text-[#0033A7] hover:bg-[#F0F3FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30 cursor-pointer"
              title="Ubah Kata Sandi Saya"
              aria-label="Ubah Kata Sandi Saya"
            >
              <KeyRound className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-[#0033A7] flex items-center justify-center text-white text-[13px] font-semibold shrink-0">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-[12px] font-semibold text-[#111C2D] leading-tight truncate max-w-[150px]">
              {user.full_name || "Admin"}
            </span>
            <span className="text-[10px] text-[#747686]">
              {user.role === 'admin' ? 'Administrator' : 'Petugas'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
