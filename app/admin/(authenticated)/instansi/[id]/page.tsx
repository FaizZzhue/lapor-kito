'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInstitutionByIdAction } from '@/lib/actions/institutions';
import type { InstitutionRow, InstitutionUnitRow } from '@/types/database';
import { InstitutionFormModal } from '@/components/admin/institutions/institution-form-modal';
import { DeleteInstitutionDialog } from '@/components/admin/institutions/delete-institution-dialog';
import { UnitFormModal } from '@/components/admin/units/unit-form-modal';
import { DeleteUnitDialog } from '@/components/admin/units/delete-unit-dialog';

export default function DetailInstansiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [institution, setInstitution] = useState<(InstitutionRow & { units: InstitutionUnitRow[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<InstitutionUnitRow | null>(null);

  const [unitToDelete, setUnitToDelete] = useState<InstitutionUnitRow | null>(null);

  const [initialized, setInitialized] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getInstitutionByIdAction(id);
      if (!res.success || !res.data) {
        setErrorMsg(res.error || 'Data instansi tidak ditemukan');
      } else {
        setInstitution(res.data);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Initial fetch — derived-state-from-render pattern
  if (!initialized) {
    setInitialized(true);
    loadData();
  }

  if (isLoading) {
    return (
      <div className="p-16 text-center text-[#747686] flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-6 w-6 text-[#1749D2]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-[14px]">Memuat detail instansi...</p>
      </div>
    );
  }

  if (errorMsg || !institution) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-xl border border-[#D9DEE7] text-center my-12">
        <div className="w-12 h-12 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-[24px]">error</span>
        </div>
        <h2 className="text-[18px] font-semibold text-[#111C2D] mb-1">Instansi Tidak Ditemukan</h2>
        <p className="text-[13px] text-[#434654] mb-6">{errorMsg || 'Instansi yang Anda tuju tidak tersedia.'}</p>
        <Link
          href="/admin/instansi"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] text-white text-[13px] font-semibold"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Kembali ke Daftar Instansi</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center gap-2 text-[#747686]">
        <Link
          href="/admin/instansi"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#0033A7] hover:underline font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Kembali ke Instansi</span>
        </Link>
        <span className="text-[#C4C5D7]">•</span>
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold">
          <span>SISTEM PUSAT</span>
          <span className="text-[#C4C5D7]">/</span>
          <Link href="/admin/instansi" className="hover:text-[#0033A7] transition-colors">
            INSTANSI
          </Link>
          <span className="text-[#C4C5D7]">/</span>
          <span className="text-[#111C2D] truncate max-w-sm">{institution.name}</span>
        </div>
      </div>

      {/* Entity Header Banner */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[24px] font-semibold text-[#111C2D] tracking-tight">
              {institution.name}
            </h1>
            {institution.is_active ? (
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
          </div>
          <p className="text-[13px] text-[#747686]">
            Kode Instansi: <span className="font-mono font-medium text-[#111C2D]">{institution.code}</span> •{' '}
            {institution.category || 'Entitas Penerima Laporan Sipil'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-[13px] font-medium shadow-sm hover:bg-[#F0F3FF] transition-colors"
          >
            <span className="material-symbols-outlined text-[17px] text-[#747686]">edit</span>
            <span>Edit Instansi</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white border border-[#FFDAD6] text-[#BA1A1A] text-[13px] font-medium shadow-sm hover:bg-[#FFDAD6]/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">delete</span>
            <span>Hapus</span>
          </button>
        </div>
      </div>

      {/* Section 1: Informasi Instansi (Structural Key-Value List) */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 bg-[#F8F9FB] border-b border-[#D9DEE7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#0033A7]">corporate_fare</span>
            <h2 className="text-[15px] font-semibold text-[#111C2D]">Informasi Instansi</h2>
          </div>
          <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider">
            DATA RESMI KEDINASAN
          </span>
        </div>

        <div className="p-6 flex flex-col divide-y divide-[#F0F3FF]">
          {/* Row: Nama Lengkap */}
          <div className="grid grid-cols-1 md:grid-cols-12 py-3 gap-2 items-baseline">
            <span className="md:col-span-3 text-[13px] text-[#747686] font-medium">Nama Lengkap</span>
            <span className="md:col-span-9 text-[14px] text-[#111C2D] font-semibold">
              {institution.name} {institution.short_name ? `(${institution.short_name})` : ''}
            </span>
          </div>

          {/* Row: Nomenklatur */}
          <div className="grid grid-cols-1 md:grid-cols-12 py-3 gap-2 items-baseline">
            <span className="md:col-span-3 text-[13px] text-[#747686] font-medium">Nomenklatur Pemkot</span>
            <span className="md:col-span-9 text-[14px] text-[#111C2D]">
              {institution.category || 'Dinas / Badan Teknis Wilayah Kota Palembang'}
            </span>
          </div>

          {/* Row: Alamat */}
          <div className="grid grid-cols-1 md:grid-cols-12 py-3 gap-2 items-baseline">
            <span className="md:col-span-3 text-[13px] text-[#747686] font-medium">Alamat Kantor</span>
            <span className="md:col-span-9 text-[14px] text-[#111C2D]">
              {institution.address || '—'}
            </span>
          </div>

          {/* Row: Kontak Resmi */}
          <div className="grid grid-cols-1 md:grid-cols-12 py-3 gap-2 items-baseline">
            <span className="md:col-span-3 text-[13px] text-[#747686] font-medium">Kontak Resmi Kedinasan</span>
            <div className="md:col-span-9 flex items-center gap-3 text-[14px] text-[#111C2D]">
              <span className="font-medium text-[#0033A7]">{institution.email || '—'}</span>
              {institution.email && institution.phone && <span className="text-[#C4C5D7]">•</span>}
              <span>{institution.phone || ''}</span>
            </div>
          </div>

          {/* Row: Mandat / Tupoksi */}
          <div className="grid grid-cols-1 md:grid-cols-12 py-3 gap-2 items-baseline">
            <span className="md:col-span-3 text-[13px] text-[#747686] font-medium">Lingkup Mandat / Tupoksi</span>
            <div className="md:col-span-9 flex flex-col gap-1">
              <p className="text-[14px] text-[#111C2D] leading-relaxed">
                {institution.mandate || 'Belum ada rincian tugas pokok dan fungsi.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Daftar Unit Pelaksana (UPT) */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE7]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0033A7]">domain</span>
              <h2 className="text-[16px] font-semibold text-[#111C2D]">Daftar Unit Pelaksana (UPT)</h2>
            </div>
            <p className="text-[13px] text-[#747686] mt-0.5">
              Unit kerja teknis di bawah naungan {institution.name} yang menangani disposisi laporan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedUnitForEdit(null);
              setIsUnitModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold transition-colors shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            <span>Tambah Unit</span>
          </button>
        </div>

        {institution.units.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">domain_disabled</span>
            </div>
            <p className="text-[14px] font-semibold text-[#111C2D] mb-1">Belum Ada Unit Pelaksana</p>
            <p className="text-[13px] text-[#747686] mb-4">
              Instansi ini belum memiliki unit kerja teknis atau seksi operasional terdaftar.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedUnitForEdit(null);
                setIsUnitModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[12px] font-semibold"
            >
              Tambah Unit Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FB] text-[#747686] text-[11px] font-semibold uppercase tracking-wider border-b border-[#D9DEE7]">
                  <th className="py-3 px-5" scope="col">Nama Unit Kerja</th>
                  <th className="py-3 px-5" scope="col">Kode Unit</th>
                  <th className="py-3 px-5" scope="col">Wilayah Kerja / Cakupan</th>
                  <th className="py-3 px-5" scope="col">Status</th>
                  <th className="py-3 px-5 text-right" scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F3FF] text-[14px] text-[#111C2D]">
                {institution.units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-[#F9F9FF] transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#111C2D]">{unit.name}</span>
                        {unit.description && (
                          <span className="text-[12px] text-[#747686] truncate max-w-md">
                            {unit.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded bg-[#F0F3FF] font-mono text-[11px] text-[#0033A7] font-semibold">
                        {unit.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[13px] text-[#434654]">
                      {unit.work_area || '—'}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
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
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUnitForEdit(unit);
                            setIsUnitModalOpen(true);
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

      {/* Edit Institution Modal */}
      <InstitutionFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => loadData()}
        institution={institution}
      />

      {/* Delete Institution Dialog */}
      <DeleteInstitutionDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          router.push('/admin/instansi');
        }}
        institutionId={institution.id}
        institutionName={institution.name}
        unitsCount={institution.units.length}
      />

      {/* Unit Form Modal */}
      <UnitFormModal
        isOpen={isUnitModalOpen}
        onClose={() => {
          setIsUnitModalOpen(false);
          setSelectedUnitForEdit(null);
        }}
        onSuccess={() => loadData()}
        unit={selectedUnitForEdit}
        institutions={[{ id: institution.id, name: institution.name, code: institution.code }]}
        defaultInstitutionId={institution.id}
      />

      {/* Delete Unit Dialog */}
      {unitToDelete && (
        <DeleteUnitDialog
          isOpen={!!unitToDelete}
          onClose={() => setUnitToDelete(null)}
          onSuccess={() => loadData()}
          unitId={unitToDelete.id}
          unitName={unitToDelete.name}
        />
      )}
    </div>
  );
}
