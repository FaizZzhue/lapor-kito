import { Loader2 } from "lucide-react";

export default function TrackingDetailLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-[#1749D2]" />
      <p className="font-mono text-xs text-[#667085]">Mengambil data laporan dan riwayat status...</p>
    </div>
  );
}
