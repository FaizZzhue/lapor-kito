'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Home,
  ChevronRight,
  Building2,
  RefreshCw,
  Plus,
  Search,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { getInstitutionsAction, type InstitutionWithUnitsCount } from '@/lib/actions/institutions';
import { InstitutionFormModal } from '@/components/admin/institutions/institution-form-modal';

function useInstitutionData() {
  const [institutions, setInstitutions] = useState<InstitutionWithUnitsCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getInstitutionsAction();
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

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await getInstitutionsAction();
        if (!isMounted) return;
        if (!res.success) {
          setErrorMsg(res.error || 'Gagal memuat daftar instansi');
        } else {
          setInstitutions(res.data);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  return { institutions, isLoading, errorMsg, fetchData };
}

export default function InstansiPage() {
  const { institutions, isLoading, errorMsg, fetchData } = useInstitutionData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Status counts computed from full dataset
  const totalCount = institutions.length;
  const activeCount = useMemo(() => institutions.filter((i) => i.is_active).length, [institutions]);
  const inactiveCount = useMemo(() => institutions.filter((i) => !i.is_active).length, [institutions]);

  // Memoized client-side filtering for instantaneous search & filter feedback
  const filteredInstitutions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return institutions.filter((inst) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && inst.is_active) ||
        (statusFilter === 'inactive' && !inst.is_active);

      if (!matchesStatus) return false;

      if (!q) return true;
      return (
        inst.name.toLowerCase().includes(q) ||
        inst.code.toLowerCase().includes(q) ||
        (inst.short_name && inst.short_name.toLowerCase().includes(q)) ||
        (inst.mandate && inst.mandate.toLowerCase().includes(q)) ||
        (inst.category && inst.category.toLowerCase().includes(q))
      );
    });
  }, [institutions, search, statusFilter]);

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Breadcrumb / Context Tag */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[#747686] text-[11px] uppercase tracking-wider font-semibold">
        <div className="flex items-center gap-1">
          <Home className="w-3.5 h-3.5 shrink-0 text-[#747686]" aria-hidden="true" />
          <span>SISTEM PUSAT</span>
        </div>
        <ChevronRight className="w-3 h-3 text-[#C4C5D7] shrink-0" aria-hidden="true" />
        <span className="text-[#747686]">DATA MASTER</span>
        <ChevronRight className="w-3 h-3 text-[#C4C5D7] shrink-0" aria-hidden="true" />
        <span className="text-[#0033A7] font-bold">INSTANSI</span>
      </nav>

      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1749D2]" aria-hidden="true" />
            <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">Instansi</h1>
          </div>
          {/* <p className="text-[14px] text-[#434654] mt-0.5">
            Kelola daftar instansi penerima laporan dari ekosistem LAPORKITO Kota Palembang.
          </p> */}
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => loadData()}
            disabled={isLoading}
            aria-label="Segarkan data instansi"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] hover:bg-[#F0F3FF] transition-colors shadow-sm text-[13px] font-medium disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
          >
            <RefreshCw className={`w-4 h-4 text-[#747686] ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white transition-colors shadow-sm text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Tambah Instansi</span>
          </button>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#747686] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari instansi, kode dinas, tupoksi..."
              aria-label="Cari instansi"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F0F3FF] text-[#111C2D] placeholder:text-[#747686] text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 transition-all border border-transparent focus:border-[#1749D2]"
            />
          </div>

          {/* Filter Status Buttons */}
          <div className="flex items-center bg-[#F0F3FF] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${statusFilter === 'all'
                  ? 'bg-white text-[#0033A7] font-semibold shadow-sm'
                  : 'text-[#434654] hover:text-[#111C2D]'
                }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${statusFilter === 'active'
                  ? 'bg-white text-[#0033A7] font-semibold shadow-sm'
                  : 'text-[#434654] hover:text-[#111C2D]'
                }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${statusFilter === 'inactive'
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
          <AlertCircle className="w-5 h-5 shrink-0 text-[#BA1A1A]" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Master Data Table Container */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-[#747686] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin h-6 w-6 text-[#1749D2]" aria-hidden="true" />
            <p className="text-[14px]">Memuat data master instansi...</p>
          </div>
        ) : filteredInstitutions.length === 0 ? (
          /* Institutional Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-[#0033A7]" aria-hidden="true" />
            </div>
            <h3 className="text-[17px] font-semibold text-[#111C2D] mb-1.5">
              {institutions.length === 0
                ? 'Belum Ada Instansi Terdaftar'
                : 'Tidak Ada Hasil yang Cocok'}
            </h3>
            <p className="text-[13px] text-[#434654] leading-relaxed mb-6">
              {institutions.length === 0
                ? 'Data master instansi dinas/badan penerima laporan di lingkungan Pemerintah Kota Palembang belum ditambahkan. Klik tombol di bawah untuk mendaftarkan instansi resmi pertama.'
                : 'Tidak ada data instansi yang cocok dengan filter atau kata kunci pencarian saat ini.'}
            </p>
            {institutions.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Tambah Instansi Baru</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F0F3FF] hover:bg-[#DFE8FF] text-[#0033A7] text-[13px] font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
              >
                <span>Reset Pencarian &amp; Filter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-[#F8F9FB] text-[#747686] text-[11px] font-semibold uppercase tracking-wider border-b border-[#D9DEE7]">
                  <th className="py-3 px-5 min-w-[240px]" scope="col">
                    Instansi
                  </th>
                  <th className="py-3 px-5 w-[140px]" scope="col">
                    Unit Pelaksana
                  </th>
                  <th className="py-3 px-5 w-[140px]" scope="col">
                    Pengguna Internal
                  </th>
                  <th className="py-3 px-5 min-w-[200px]" scope="col">
                    Cakupan Tugas / Kewenangan
                  </th>
                  <th className="py-3 px-5 w-[120px]" scope="col">
                    Status
                  </th>
                  <th className="py-3 px-5 w-[120px] text-right" scope="col">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF] text-[14px] text-[#111C2D]">
                {filteredInstitutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-[#F9F9FF] transition-colors">
                    {/* Instansi Info */}
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F0F3FF] flex items-center justify-center text-[#0033A7] mt-0.5 shrink-0">
                          <Building2 className="w-5 h-5 text-[#0033A7]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[15px] text-[#111C2D] block font-semibold leading-tight break-words">
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
                        <Users className="w-4 h-4 text-[#747686]" aria-hidden="true" />
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16845B]" aria-hidden="true" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0F3FF] text-[#747686] text-[12px] font-medium border border-[#D9DEE7]">
                          <XCircle className="w-3.5 h-3.5 text-[#747686]" aria-hidden="true" />
                          Non-Aktif
                        </span>
                      )}
                    </td>

                    {/* Action Link */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/instansi/${inst.id}`}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0033A7] hover:text-[#1749D2] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30 rounded px-1.5 py-0.5"
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        <span>Buka Detail</span>
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
