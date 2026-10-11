import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3 civic-grid">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F3FF] text-[#1749D2]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <p className="font-mono text-xs font-semibold text-[#111C2D]">
        Memuat Data Layanan...
      </p>
      <p className="text-[11px] text-[#667085]">
        LAPORKITO • Sistem Pendamping Pelaporan Warga Palembang
      </p>
    </div>
  );
}
