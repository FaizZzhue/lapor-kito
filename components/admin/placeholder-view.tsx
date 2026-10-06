import Link from "next/link";

interface PlaceholderViewProps {
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  plannedPhase: string;
}

export function PlaceholderView({
  title,
  subtitle,
  badge,
  icon,
  plannedPhase,
}: PlaceholderViewProps) {
  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2]" />
            <p className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
              {badge}
            </p>
          </div>
          <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">
            {title}
          </h1>
          <p className="text-[14px] text-[#434654] mt-1">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0F3FF] border border-[#D9DEE7] rounded-lg shadow-sm self-start md:self-auto">
          <span className="material-symbols-outlined text-[#E58A1F] text-[18px]">engineering</span>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#111C2D]">Dalam Antrean Pengembangan</span>
            <span className="text-[10px] text-[#747686]">{plannedPhase}</span>
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm my-6">
        <div className="w-16 h-16 rounded-2xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[36px]">{icon}</span>
        </div>
        <h2 className="text-[18px] font-semibold text-[#111C2D] mb-2">
          Modul {title}
        </h2>
        <p className="text-[14px] text-[#434654] leading-relaxed mb-6">
          Fondasi autentikasi, layout admin, dan navigasi (Fase 4A) telah aktif. Operasi CRUD dan sinkronisasi data operasional untuk modul ini akan diimplementasikan secara bertahap pada fase berikutnya sesuai spesifikasi teknis Stitch.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0F3FF] border border-[#C4C5D7]/50 text-[12px] text-[#434654] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#16845B]" />
          <span>Fondasi Otorisasi: <strong>Terkoneksi Supabase Auth</strong></span>
        </div>

        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Kembali ke Ringkasan Platform</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
