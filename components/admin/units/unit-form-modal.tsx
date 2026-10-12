'use client';

import { useState, useMemo } from 'react';
import { Network, X, AlertCircle, RefreshCw } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl border border-[#D9DEE7] shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#F8F9FB] border-b border-[#D9DEE7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EDF2FE] text-[#0033A7] flex items-center justify-center border border-[#D9DEE7]">
              <Network className="w-5 h-5 text-[#0033A7]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111C2D]">
                {isEdit ? 'Edit Unit Pelaksana' : 'Tambah Unit Pelaksana Baru'}
              </h3>
              <p className="text-xs text-[#747686]">
                {isEdit
                  ? 'Perbarui data unit pelaksana teknis atau seksi operasional.'
                  : 'Daftarkan unit pelaksana teknis baru di bawah naungan instansi induk.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            title="Tutup dialog"
            className="text-[#747686] hover:text-[#111C2D] p-1.5 rounded-lg hover:bg-[#F0F3FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0033A7]/30"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Instansi Induk */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Instansi Induk <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                disabled={isEdit || !!defaultInstitutionId}
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] disabled:bg-[#F8F9FB] disabled:text-[#747686] transition-all cursor-pointer"
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
              <label className="text-xs font-semibold text-[#111C2D]">
                Nama Unit Kerja / UPT <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Seksi Pemeliharaan Jalan & Jembatan"
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Kode Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Kode Unit <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="misal: UPT-JALAN-SAKO"
                className="h-10 px-3.5 text-sm font-mono bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Wilayah Kerja */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Wilayah Kerja / Cakupan Operasional
              </label>
              <input
                type="text"
                value={workArea}
                onChange={(e) => setWorkArea(e.target.value)}
                placeholder="misal: Kecamatan Sako, Sematang Borang, Kenten"
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Deskripsi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Deskripsi Tugas / Fungsi Teknis
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penanganan perkerasan jalan lingkungan, jembatan penghubung..."
                className="p-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] resize-none transition-all"
              />
            </div>

            {/* Status Aktif */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="unit-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-[#D9DEE7] text-[#0033A7] focus:ring-[#0033A7]/20 cursor-pointer"
              />
              <label htmlFor="unit-active" className="text-xs text-[#111C2D] cursor-pointer font-medium">
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
              className="h-9 px-4 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF] text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 rounded-lg bg-[#0033A7] hover:bg-[#1749D2] text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin h-3.5 w-3.5 text-white" aria-hidden="true" />
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
