import type { UserProfile } from "@/types/auth";

interface AdminHeaderProps {
  user: UserProfile;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-white/90 backdrop-blur-xl z-40 flex items-center justify-between px-8 border-b border-[#D9DEE7] shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      {/* Institutional Left Title */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#747686] text-[18px]">account_balance</span>
        <span className="text-[13px] text-[#434654] font-medium">
          Pemerintah Kota Palembang • Sistem Tata Kelola Internal
        </span>
      </div>

      {/* Status & Identity Right */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDF7F2] border border-[#B5E2CD]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#16845B]" />
          <span className="text-[11px] font-medium text-[#16845B]">Koneksi Audit Aktif • v2.4</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0033A7] flex items-center justify-center text-white text-[13px] font-semibold">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-[12px] font-semibold text-[#111C2D] leading-tight">
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
