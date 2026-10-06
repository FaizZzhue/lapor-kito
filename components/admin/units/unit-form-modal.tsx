'use client';

import { useState, useMemo } from 'react';
import { createUnitAction, updateUnitAction } from '@/lib/actions/institutions';
import type { InstitutionUnitRow } from '@/types/database';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unit?: InstitutionUnitRow | null;
  institutions: { id: string; name: string; code: string }[];
  defaultInstitutionId?: string;
}

export function UnitFormModal({
  isOpen,
  onClose,
  onSuccess,
  unit,
  institutions,
  defaultInstitutionId,
}: UnitFormModalProps) {
  const isEdit = !!unit;

  // Derive initial values from props
  const initialValues = useMemo(() => ({
    institutionId: unit?.institution_id || defaultInstitutionId || institutions[0]?.id || '',
    name: unit?.name || '',
    code: unit?.code || '',
    workArea: unit?.work_area || '',
    description: unit?.description || '',
    isActive: unit?.is_active ?? true,
  }), [unit, defaultInstitutionId, institutions]);

  const formKey = `${isOpen}-${unit?.id || 'new'}`;

  const [institutionId, setInstitutionId] = useState(initialValues.institutionId);
  const [name, setName] = useState(initialValues.name);
  const [code, setCode] = useState(initialValues.code);
  const [workArea, setWorkArea] = useState(initialValues.workArea);
  const [description, setDescription] = useState(initialValues.description);
  const [isActive, setIsActive] = useState(initialValues.isActive);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when modal opens/closes or unit changes
  const [prevKey, setPrevKey] = useState(formKey);
  if (prevKey !== formKey) {
    setPrevKey(formKey);
    setInstitutionId(initialValues.institutionId);
    setName(initialValues.name);
    setCode(initialValues.code);
    setWorkArea(initialValues.workArea);
    setDescription(initialValues.description);
    setIsActive(initialValues.isActive);
    setErrorMsg(null);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (!institutionId) {
      setErrorMsg('Pilih instansi induk terlebih dahulu');
      setIsLoading(false);
      return;
    }

    const payload = {
      institution_id: institutionId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      work_area: workArea.trim() || null,
      description: description.trim() || null,
      is_active: isActive,
    };

    try {
      let res;
      if (isEdit && unit) {
        res = await updateUnitAction(unit.id, payload);
      } else {
        res = await createUnitAction(payload);
      }

      if (!res.success) {
        setErrorMsg(res.error || 'Terjadi kesalahan saat menyimpan unit kerja');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan jaringan');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl border border-[#D9DEE7] shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F0F3FF] border-b border-[#D9DEE7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0033A7] text-[22px]">domain</span>
            <h3 className="text-[17px] font-semibold text-[#111C2D]">
              {isEdit ? 'Edit Unit Pelaksana' : 'Tambah Unit Pelaksana Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#747686] hover:text-[#111C2D] p-1 rounded-lg hover:bg-white/60 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Instansi Induk */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Instansi Induk <span className="text-[#BA1A1A]">*</span>
              </label>
              <select
                required
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                disabled={isEdit || !!defaultInstitutionId}
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 disabled:bg-[#F0F3FF]"
              >
                <option value="">-- Pilih Instansi Induk --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Nama Unit Kerja / UPT <span className="text-[#BA1A1A]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Seksi Pemeliharaan Jalan & Jembatan"
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Kode Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Kode Unit <span className="text-[#BA1A1A]">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="misal: UPT-JALAN-SAKO"
                className="h-10 px-3 text-[14px] font-mono bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Wilayah Kerja */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Wilayah Kerja / Cakupan Operasional
              </label>
              <input
                type="text"
                value={workArea}
                onChange={(e) => setWorkArea(e.target.value)}
                placeholder="misal: Kecamatan Sako, Sematang Borang, Kenten"
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Deskripsi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Deskripsi Tugas / Fungsi Teknis
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penanganan perkerasan jalan lingkungan, jembatan penghubung..."
                className="p-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 resize-none"
              />
            </div>

            {/* Status Aktif */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="unit-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-[#C4C5D7] text-[#1749D2] focus:ring-[#1749D2]/20 cursor-pointer"
              />
              <label htmlFor="unit-active" className="text-[13px] text-[#111C2D] cursor-pointer font-medium">
                Unit Pelaksana Aktif (Menerima penugasan laporan lapangan)
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#D9DEE7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-white border border-[#C4C5D7] text-[#434654] hover:bg-[#F0F3FF] text-[13px] font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEdit ? 'Perbarui Unit' : 'Simpan Unit'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
