import { redirect } from "next/navigation";
import { SystemSettingsManager } from "@/components/admin/system-settings/SystemSettingsManager";
import { getSystemSettingsAction } from "@/lib/actions/system-settings";
import { getCurrentInternalUser } from "@/lib/auth/session";
import { ShieldCheck, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PengaturanSistemPage() {
  const { internalUser } = await getCurrentInternalUser();
  if (internalUser?.role !== "admin") {
    redirect("/admin/laporan");
  }
  const isAdmin = true;

  const { data: settings } = await getSystemSettingsAction();

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2]" />
            <p className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
              Pengaturan & Tata Kelola • Sistem
            </p>
          </div>
          <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">
            Pengaturan Sistem
          </h1>
          <p className="text-[14px] text-[#434654] mt-1">
            Konfigurasi parameter operasional platform LAPORKITO. Pengaturan disimpan di{" "}
            <code className="text-[12px] bg-[#F0F3FF] px-1.5 py-0.5 rounded text-[#0033A7]">
              system_settings
            </code>.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0F3FF] border border-[#D9DEE7] rounded-lg shadow-sm self-start md:self-auto">
          {isAdmin ? (
            <ShieldCheck size={18} className="text-[#16845B]" aria-hidden="true" />
          ) : (
            <Eye size={18} className="text-[#16845B]" aria-hidden="true" />
          )}
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#111C2D]">
              {isAdmin ? "Akses Penuh" : "Hanya Baca"}
            </span>
            <span className="text-[10px] text-[#747686]">
              {isAdmin ? "Administrator Sistem" : "Petugas — tanpa hak ubah"}
            </span>
          </div>
        </div>
      </div>

      <SystemSettingsManager initialSettings={settings ?? []} isAdmin={isAdmin} />
    </div>
  );
}
