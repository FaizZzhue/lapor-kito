import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Query actual live counts from database
  const [
    { count: categoriesCount },
    { count: internalUsersCount },
    institutionsRes,
    unitsRes,
  ] = await Promise.all([
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("internal_users").select("*", { count: "exact", head: true }),
    supabase.from("institutions").select("*", { count: "exact", head: true }),
    supabase.from("institution_units").select("*", { count: "exact", head: true }),
  ]);

  const institutionsCount = institutionsRes.error ? 0 : (institutionsRes.count ?? 0);
  const unitsCount = unitsRes.error ? 0 : (unitsRes.count ?? 0);

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D9DEE7]/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2]" />
            <p className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
              Sistem Pusat • Konsol Administrator Operasional
            </p>
          </div>
          <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">
            Ringkasan Platform
          </h1>
          <p className="text-[14px] text-[#434654] mt-1">
            Kelola data dan konfigurasi struktural yang digunakan oleh ekosistem LAPORKITO Kota Palembang.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0F3FF] border border-[#D9DEE7] rounded-lg shadow-sm self-start md:self-auto">
          <span className="material-symbols-outlined text-[#16845B] text-[18px]">verified</span>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-[#111C2D]">Sistem Operasional Aktif</span>
            <span className="text-[10px] text-[#747686]">Fase 4B — Master Instansi & Unit</span>
          </div>
        </div>
      </div>

      {/* Summary Row: Restrained Civic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Item 1: Instansi */}
        <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#747686]">Instansi Terdaftar</span>
            <span className="material-symbols-outlined text-[#747686] text-[20px]">apartment</span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold text-[#111C2D]">{institutionsCount}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2] mb-1" />
            </div>
            <p className="text-[12px] text-[#747686] mt-0.5">Dinas &amp; Badan Pemkot</p>
          </div>
        </div>

        {/* Item 2: Unit Teknis */}
        <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#747686]">Unit Teknis</span>
            <span className="material-symbols-outlined text-[#747686] text-[20px]">domain</span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold text-[#111C2D]">{unitsCount}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2] mb-1" />
            </div>
            <p className="text-[12px] text-[#747686] mt-0.5">Seksi &amp; UPT Wilayah</p>
          </div>
        </div>

        {/* Item 3: Pengguna Internal */}
        <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#747686]">Pengguna Internal</span>
            <span className="material-symbols-outlined text-[#747686] text-[20px]">badge</span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold text-[#111C2D]">
                {internalUsersCount ?? 0}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2] mb-1" />
            </div>
            <p className="text-[12px] text-[#747686] mt-0.5">Akun Staf Terverifikasi</p>
          </div>
        </div>

        {/* Item 4: Kategori Laporan */}
        <div className="bg-white p-5 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#747686]">Kategori Laporan</span>
            <span className="material-symbols-outlined text-[#747686] text-[20px]">category</span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold text-[#111C2D]">
                {categoriesCount ?? 4}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#16845B] mb-1" />
            </div>
            <p className="text-[12px] text-[#747686] mt-0.5">Kategori Resmi Aktif</p>
          </div>
        </div>
      </div>

      {/* Main Section: Data Master Management */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-[18px] font-semibold text-[#111C2D]">
              Pusat Pengelolaan Data Master
            </h2>
            <p className="text-[13px] text-[#434654]">
              Pilih entitas data untuk memperbarui struktur kedinasan, hak verifikasi, dan aturan penerusan laporan warga.
            </p>
          </div>
          <span className="text-[11px] text-[#747686] self-start sm:self-auto bg-[#F0F3FF] border border-[#D9DEE7] px-2.5 py-1 rounded">
            Fondasi Admin Siap
          </span>
        </div>

        {/* Data Master List Cards */}
        <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden flex flex-col divide-y divide-[#F0F3FF]">
          {/* Row 1: Instansi */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F9F9FF] transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 mt-0.5 text-[#0033A7]">
                <span className="material-symbols-outlined text-[22px]">apartment</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#111C2D]">Instansi</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F3FF] text-[#0033A7] font-semibold border border-[#D9DEE7]">
                    {institutionsCount} Instansi Terdaftar
                  </span>
                </div>
                <p className="text-[13px] text-[#434654] mt-0.5 max-w-2xl leading-relaxed">
                  Kelola daftar instansi penerima laporan kedinasan (PUPR, DLHK, Dishub, Perumda Tirta Musi, dll).
                </p>
              </div>
            </div>
            <div className="flex items-center self-end md:self-center shrink-0">
              <Link
                href="/admin/instansi"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#0033A7] hover:text-[#1749D2] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0F3FF]"
              >
                <span>Buka Instansi</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Row 2: Unit Instansi */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F9F9FF] transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 mt-0.5 text-[#0033A7]">
                <span className="material-symbols-outlined text-[22px]">domain</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#111C2D]">Unit Instansi</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F3FF] text-[#0033A7] font-semibold border border-[#D9DEE7]">
                    {unitsCount} Unit Pelaksana
                  </span>
                </div>
                <p className="text-[13px] text-[#434654] mt-0.5 max-w-2xl leading-relaxed">
                  Kelola unit kerja dan seksi operasional di bawah instansi (UPT Wilayah, Seksi Jalan & Jembatan, Posko Kebersihan).
                </p>
              </div>
            </div>
            <div className="flex items-center self-end md:self-center shrink-0">
              <Link
                href="/admin/unit"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#0033A7] hover:text-[#1749D2] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0F3FF]"
              >
                <span>Buka Unit</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Row 3: Pengguna Internal */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F9F9FF] transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 mt-0.5 text-[#0033A7]">
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#111C2D]">Pengguna Internal</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F3FF] text-[#434654] font-medium">
                    {internalUsersCount ?? 0} Pengguna
                  </span>
                </div>
                <p className="text-[13px] text-[#434654] mt-0.5 max-w-2xl leading-relaxed">
                  Kelola akun ASN, verifikator lapangan, dan operator penerima pengaduan di lingkungan Pemkot Palembang.
                </p>
              </div>
            </div>
            <div className="flex items-center self-end md:self-center shrink-0">
              <Link
                href="/admin/pengguna-internal"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#0033A7] hover:text-[#1749D2] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0F3FF]"
              >
                <span>Buka Pengguna</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Row 4: Kategori Laporan */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F9F9FF] transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 mt-0.5 text-[#0033A7]">
                <span className="material-symbols-outlined text-[22px]">category</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#111C2D]">Kategori Laporan</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] font-medium border border-[#B5E2CD]">
                    4 Kategori Aktif
                  </span>
                </div>
                <p className="text-[13px] text-[#434654] mt-0.5 max-w-2xl leading-relaxed">
                  Kelola taksonomi insiden sipil resmi (Infrastruktur & Jalan, Kebersihan & Sampah, Drainase & Banjir, Penerangan Jalan).
                </p>
              </div>
            </div>
            <div className="flex items-center self-end md:self-center shrink-0">
              <Link
                href="/admin/kategori-laporan"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#0033A7] hover:text-[#1749D2] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0F3FF]"
              >
                <span>Buka Kategori</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Row 5: Data Kewenangan */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F9F9FF] transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 mt-0.5 text-[#0033A7]">
                <span className="material-symbols-outlined text-[22px]">policy</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#111C2D]">Data Kewenangan</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0F3FF] text-[#434654] font-medium">
                    Fase 4B
                  </span>
                </div>
                <p className="text-[13px] text-[#434654] mt-0.5 max-w-2xl leading-relaxed">
                  Kelola matriks aturan routing pengaduan warga ke instansi yang berwenang secara akurat.
                </p>
              </div>
            </div>
            <div className="flex items-center self-end md:self-center shrink-0">
              <Link
                href="/admin/data-kewenangan"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#0033A7] hover:text-[#1749D2] font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0F3FF]"
              >
                <span>Buka Kewenangan</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
