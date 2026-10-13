"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Tag, AlertCircle } from "lucide-react";
import { trackingSearchSchema } from "@/lib/validators/report";

interface SearchBarProps {
  initialCode?: string;
  autoFocus?: boolean;
}

export function TrackingSearchBar({ initialCode = "", autoFocus = false }: SearchBarProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = trackingSearchSchema.safeParse({ trackingCode: code });
    if (!parsed.success) {
      setError(
        "Format kode lacak harus LPK-YYYYMMDD-XXXX (contoh: LPK-20261002-7A9B)"
      );
      return;
    }

    const clean = parsed.data.trackingCode.toUpperCase().trim();
    router.push(`/pantau/${clean}`);
  };

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <div className="relative flex-1">
          <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={code}
            autoFocus={autoFocus}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Masukkan Kode Lacak (contoh: LPK-20261002-7A9B)"
            className="w-full h-11 rounded-lg border border-slate-300 bg-white pl-10 pr-3 font-mono text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase transition-all"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 font-mono text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition-all shrink-0 active:scale-98 cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span>Cari Laporan</span>
        </button>
      </form>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-700 font-mono bg-red-50 p-2.5 rounded-lg border border-red-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
