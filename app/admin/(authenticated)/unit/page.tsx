'use client';

import { useState, useCallback } from 'react';
import { getUnitsAction, getInstitutionsAction, type UnitWithInstitution } from '@/lib/actions/institutions';
import { UnitFormModal } from '@/components/admin/units/unit-form-modal';
import { DeleteUnitDialog } from '@/components/admin/units/delete-unit-dialog';
import type { InstitutionUnitRow } from '@/types/database';

export default function UnitInstansiPage() {
  const [units, setUnits] = useState<UnitWithInstitution[]>([]);
  const [institutionsList, setInstitutionsList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedInstId, setSelectedInstId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<InstitutionUnitRow | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<InstitutionUnitRow | null>(null);

  const [initialized, setInitialized] = useState(false);

  const loadInstitutions = useCallback(async () => {
    try {
      const res = await getInstitutionsAction({ status: 'all' });
      if (res.success) {
        setInstitutionsList(res.data.map((i) => ({ id: i.id, name: i.name, code: i.code })));
      }
    } catch {
      // Ignored
    }
  }, []);

  const loadUnits = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getUnitsAction({
        search: search.trim() || undefined,
        institutionId: selectedInstId !== 'all' ? selectedInstId : undefined,
        status: statusFilter,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal memuat daftar unit');
      } else {
        setUnits(res.data);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedInstId, statusFilter]);

  // Initial fetch — derived-state-from-render pattern
  if (!initialized) {
    setInitialized(true);
    loadInstitutions();
    loadUnits();
  }

  const totalCount = units.length;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Breadcrumb / Context Tag */}
      <div className="flex items-center gap-1.5 text-[#747686]">
        <span className="material-symbols-outlined text-[16px]">account_tree</span>
        <p className="text-[11px] uppercase tracking-wider font-semibold">
          SISTEM PUSAT • KONSOL ADMINISTRATOR OPERASIONAL <span className="text-[#C4C5D7] mx-1">&gt;</span>{' '}
          <span className="text-[#747686]">DATA MASTER</span> <span className="text-[#C4C5D7] mx-1">&gt;</span>{' '}
          <span className="text-[#0033A7] font-bold">UNIT INSTANSI</span>
        </p>
      </div>

      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">Unit Instansi</h1>
          <p className="text-[14px] text-[#434654] mt-0.5">
            Kelola unit pelaksana teknis dan seksi kerja yang menerima serta menindaklanjuti laporan di dalam setiap instansi.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => loadUnits()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] hover:bg-[#F0F3FF] transition-colors shadow-sm text-[13px] font-medium"
          >
            <span className="material-symbols-outlined text-[18px] text-[#747686]">sync</span>
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedUnitForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white transition-colors shadow-sm text-[13px] font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Tambah Unit</span>
          </button>
        </div>
      </div>

      {/* Filter & Utility Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Field */}
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#747686]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama unit, kode UPT..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F0F3FF] text-[#111C2D] placeholder:text-[#747686] text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 transition-all border border-transparent focus:border-[#1749D2]"
            />
          </div>

          {/* Instansi Filter Dropdown */}
          <div className="relative sm:w-60">
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-lg bg-[#F0F3FF] text-[#111C2D] text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 transition-all border border-transparent focus:border-[#1749D2] appearance-none cursor-pointer"
            >
              <option value="all">Semua Instansi ({institutionsList.length})</option>
              {institutionsList.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px] text-[#747686] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full h-10 px-3 pr-8 rounded-lg bg-[#F0F3FF] text-[#111C2D] text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 transition-all border border-transparent focus:border-[#1749D2] appearance-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-Aktif</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px] text-[#747686] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center text-[#747686] text-[12px] bg-[#F0F3FF] px-3 py-1.5 rounded-lg border border-[#D9DEE7]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1749D2]" />
          <span>
            Total: <strong className="text-[#111C2D] font-semibold">{totalCount} Unit Pelaksana Terdaftar</strong>
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
            <p className="text-[14px]">Memuat data unit instansi...</p>
          </div>
        ) : units.length === 0 ? (
          /* Institutional Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[36px]">domain</span>
            </div>
            <h3 className="text-[17px] font-semibold text-[#111C2D] mb-1.5">
              Belum Ada Unit Pelaksana
            </h3>
            <p className="text-[13px] text-[#434654] leading-relaxed mb-6">
              {search || selectedInstId !== 'all' || statusFilter !== 'all'
                ? 'Tidak ada unit kerja yang cocok dengan filter pencarian saat ini.'
                : 'Data unit pelaksana teknis (UPT), bidang, atau seksi kerja kedinasan belum ditambahkan. Klik tombol di bawah untuk mendaftarkan unit pertama.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedUnitForEdit(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tambah Unit Baru</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FB] text-[#747686] text-[11px] font-semibold uppercase tracking-wider border-b border-[#D9DEE7]">
                  <th className="py-3 px-5 w-[30%]" scope="col">Unit Kerja &amp; Kode</th>
                  <th className="py-3 px-5 w-[25%]" scope="col">Instansi Induk</th>
                  <th className="py-3 px-5 w-[20%]" scope="col">Wilayah / Cakupan</th>
                  <th className="py-3 px-5 w-[12%] text-center" scope="col">Pengguna Internal</th>
                  <th className="py-3 px-5 w-[8%] text-center" scope="col">Status</th>
                  <th className="py-3 px-5 w-[5%] text-right" scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF] text-[14px] text-[#111C2D]">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-[#F9F9FF] transition-colors">
                    {/* Unit Name & Code */}
                    <td className="py-4 px-5 align-middle">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#111C2D]">{unit.name}</span>
                          <span className="px-2 py-0.5 rounded bg-[#F0F3FF] text-[#0033A7] font-mono text-[11px] font-semibold">
                            {unit.code}
                          </span>
                        </div>
                        {unit.description && (
                          <span className="text-[12px] text-[#747686] line-clamp-1">
                            {unit.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Instansi Induk */}
                    <td className="py-4 px-5 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1749D2]/40" />
                        <span className="text-[13px] font-medium text-[#111C2D]">
                          {unit.institution?.name || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Wilayah / Cakupan */}
                    <td className="py-4 px-5 align-middle">
                      <div className="flex items-center gap-1.5 text-[#434654] text-[13px]">
                        <span className="material-symbols-outlined text-[16px] text-[#747686] shrink-0">
                          pin_drop
                        </span>
                        <span className="truncate">{unit.work_area || '—'}</span>
                      </div>
                    </td>

                    {/* Pengguna Internal */}
                    <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F3FF] text-[12px] text-[#434654] font-medium">
                        <span className="material-symbols-outlined text-[15px] text-[#0033A7]">person</span>
                        <span>0 Petugas</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5 align-middle text-center whitespace-nowrap">
                      {unit.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] text-[11px] font-semibold border border-[#B5E2CD]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16845B]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0F3FF] text-[#747686] text-[11px] font-medium border border-[#D9DEE7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#747686]" />
                          Non-Aktif
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUnitForEdit(unit);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded text-[#747686] hover:text-[#0033A7] hover:bg-[#F0F3FF] transition-colors"
                          title="Edit Unit"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnitToDelete(unit)}
                          className="p-1 rounded text-[#747686] hover:text-[#BA1A1A] hover:bg-[#FFDAD6]/40 transition-colors"
                          title="Hapus Unit"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      <UnitFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUnitForEdit(null);
        }}
        onSuccess={() => loadUnits()}
        unit={selectedUnitForEdit}
        institutions={institutionsList}
      />

      {/* Delete Unit Confirmation Dialog */}
      {unitToDelete && (
        <DeleteUnitDialog
          isOpen={!!unitToDelete}
          onClose={() => setUnitToDelete(null)}
          onSuccess={() => loadUnits()}
          unitId={unitToDelete.id}
          unitName={unitToDelete.name}
        />
      )}
    </div>
  );
}
