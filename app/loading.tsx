import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50/60 civic-grid">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-2xs">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <p className="font-mono text-xs font-bold text-slate-800">
        Memuat Data Layanan...
      </p>
      <p className="text-[11px] text-slate-500 font-mono">
        LAPORKITO • Sistem Pendamping Pelaporan Warga Palembang
      </p>
    </div>
  );
}
