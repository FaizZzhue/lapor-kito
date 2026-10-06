'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { getInstitutionsAction, type InstitutionWithUnitsCount } from '@/lib/actions/institutions';
import { InstitutionFormModal } from '@/components/admin/institutions/institution-form-modal';

function useInstitutionData() {
  const [institutions, setInstitutions] = useState<InstitutionWithUnitsCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async (search: string, statusFilter: 'all' | 'active' | 'inactive') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getInstitutionsAction({
        search: search.trim() || undefined,
        status: statusFilter,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal memuat daftar instansi');
      } else {
        setInstitutions(res.data);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { institutions, isLoading, errorMsg, fetchData };
}

export default function InstansiPage() {
  const { institutions, isLoading, errorMsg, fetchData } = useInstitutionData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initial fetch — uses derived-state-from-render pattern
  if (!initialized) {
    setInitialized(true);
    fetchData(search, statusFilter);
  }

  const loadData = useCallback(() => {
    fetchData(search, statusFilter);
  }, [fetchData, search, statusFilter]);

  // Status counts
  const totalCount = institutions.length;
  const activeCount = institutions.filter((i) => i.is_active).length;
  const inactiveCount = institutions.filter((i) => !i.is_active).length;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Breadcrumb / Context Tag */}
      <div className="flex items-center gap-1.5 text-[#747686]">
        <span className="material-symbols-outlined text-[16px]">account_tree</span>
        <p className="text-[11px] uppercase tracking-wider font-semibold">
          SISTEM PUSAT • KONSOL ADMINISTRATOR OPERASIONAL <span className="text-[#C4C5D7] mx-1">&gt;</span>{' '}
          <span className="text-[#0033A7] font-bold">DATA MASTER</span>
        </p>
      </div>

      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">Instansi</h1>
          <p className="text-[14px] text-[#434654] mt-0.5">
            Kelola daftar instansi penerima laporan dari ekosistem LAPORKITO Kota Palembang.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => loadData()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] hover:bg-[#F0F3FF] transition-colors shadow-sm text-[13px] font-medium"
          >
            <span className="material-symbols-outlined text-[18px] text-[#747686]">sync</span>
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white transition-colors shadow-sm text-[13px] font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Tambah Instansi</span>
          </button>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#747686]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari instansi, kode dinas, tupoksi..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F0F3FF] text-[#111C2D] placeholder:text-[#747686] text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 transition-all border border-transparent focus:border-[#1749D2]"
            />
          </div>

          {/* Filter Status Buttons */}
          <div className="flex items-center bg-[#F0F3FF] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-[#0033A7] font-semibold shadow-sm'
                  : 'text-[#434654] hover:text-[#111C2D]'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-[#0033A7] font-semibold shadow-sm'
                  : 'text-[#434654] hover:text-[#111C2D]'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-[#0033A7] font-semibold shadow-sm'
                  : 'text-[#434654] hover:text-[#111C2D]'
              }`}
            >
              Non-Aktif ({inactiveCount})
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-[#747686] text-[13px]">
          <span>
            Total: <strong className="text-[#111C2D] font-semibold">{totalCount} Instansi</strong>
          </span>
          <div className="h-4 w-px bg-[#D9DEE7] hidden sm:block" />
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#F0F3FF] text-[#747686] font-medium uppercase tracking-wider hidden sm:inline-block">
            Palembang Satu Data
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Master Data Table Container */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-[#747686] flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-6 w-6 text-[#1749D2]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-[14px]">Memuat data master instansi...</p>
          </div>
        ) : institutions.length === 0 ? (
          /* Institutional Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[36px]">apartment</span>
            </div>
            <h3 className="text-[17px] font-semibold text-[#111C2D] mb-1.5">
              Belum Ada Instansi Terdaftar
            </h3>
            <p className="text-[13px] text-[#434654] leading-relaxed mb-6">
              {search || statusFilter !== 'all'
                ? 'Tidak ada instansi yang cocok dengan filter pencarian saat ini.'
                : 'Data master instansi dinas/badan penerima laporan di lingkungan Pemerintah Kota Palembang belum ditambahkan. Klik tombol di bawah untuk mendaftarkan instansi resmi pertama.'}
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tambah Instansi Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FB] text-[#747686] text-[11px] font-semibold uppercase tracking-wider border-b border-[#D9DEE7]">
                  <th className="py-3 px-5" scope="col">
                    Instansi
                  </th>
                  <th className="py-3 px-5" scope="col">
                    Unit Pelaksana
                  </th>
                  <th className="py-3 px-5" scope="col">
                    Pengguna Internal
                  </th>
                  <th className="py-3 px-5" scope="col">
                    Cakupan Tugas / Kewenangan
                  </th>
                  <th className="py-3 px-5" scope="col">
                    Status
                  </th>
                  <th className="py-3 px-5 text-right" scope="col">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF] text-[14px] text-[#111C2D]">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-[#F9F9FF] transition-colors">
                    {/* Instansi Info */}
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F0F3FF] flex items-center justify-center text-[#0033A7] mt-0.5 shrink-0">
                          <span className="material-symbols-outlined text-[20px]">apartment</span>
                        </div>
                        <div>
                          <span className="text-[15px] text-[#111C2D] block font-semibold leading-tight">
                            {inst.name}
                          </span>
                          <span className="text-[12px] text-[#747686] mt-0.5 block">
                            {inst.category || 'Pemerintah Kota Palembang'} •{' '}
                            <code className="font-mono text-[11px] bg-[#F0F3FF] text-[#0033A7] px-1.5 py-0.5 rounded">
                              {inst.code}
                            </code>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Unit Pelaksana Count */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <p className="font-semibold text-[#111C2D]">{inst.units_count} Unit Teknis</p>
                      <p className="text-[12px] text-[#747686]">Sub-divisi kerja</p>
                    </td>

                    {/* Pengguna Internal */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[13px] text-[#434654]">
                        <span className="material-symbols-outlined text-[16px] text-[#747686]">badge</span>
                        <span>0 Petugas</span>
                      </div>
                    </td>

                    {/* Cakupan Tugas */}
                    <td className="py-4 px-5">
                      <p className="text-[13px] text-[#434654] max-w-xs line-clamp-2 leading-snug">
                        {inst.mandate || '—'}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {inst.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] text-[12px] font-semibold border border-[#B5E2CD]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16845B]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0F3FF] text-[#747686] text-[12px] font-medium border border-[#D9DEE7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#747686]" />
                          Non-Aktif
                        </span>
                      )}
                    </td>

                    {/* Action Link */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/instansi/${inst.id}`}
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0033A7] hover:text-[#1749D2] hover:underline transition-colors"
                      >
                        <span>Buka Detail</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Instansi */}
      <InstitutionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
