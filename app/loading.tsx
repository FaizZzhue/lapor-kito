import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50/60 civic-grid animate-in fade-in duration-150">
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-md">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-blue-500/20 animate-pulse -z-10" />
      </div>

      <div className="space-y-1">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
          Memuat Data Layanan
        </p>
        <p className="font-mono text-[11px] text-slate-500">
          LAPORKITO • Portal Pengaduan Fasilitas Publik Kota Palembang
        </p>
      </div>
    </div>
  );
}
