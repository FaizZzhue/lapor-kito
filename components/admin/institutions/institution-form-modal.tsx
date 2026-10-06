'use client';

import { useState, useMemo } from 'react';
import { createInstitutionAction, updateInstitutionAction } from '@/lib/actions/institutions';
import type { InstitutionRow } from '@/types/database';

interface InstitutionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institution?: InstitutionRow | null;
}

export function InstitutionFormModal({
  isOpen,
  onClose,
  onSuccess,
  institution,
}: InstitutionFormModalProps) {
  const isEdit = !!institution;

  // Derive initial values from props — component is keyed externally or re-renders on isOpen change
  const initialValues = useMemo(() => ({
    name: institution?.name || '',
    code: institution?.code || '',
    shortName: institution?.short_name || '',
    category: institution?.category || 'Dinas / Badan Teknis',
    address: institution?.address || '',
    email: institution?.email || '',
    phone: institution?.phone || '',
    mandate: institution?.mandate || '',
    isActive: institution?.is_active ?? true,
  }), [institution]);

  const formKey = `${isOpen}-${institution?.id || 'new'}`;

  const [name, setName] = useState(initialValues.name);
  const [code, setCode] = useState(initialValues.code);
  const [shortName, setShortName] = useState(initialValues.shortName);
  const [category, setCategory] = useState(initialValues.category);
  const [address, setAddress] = useState(initialValues.address);
  const [email, setEmail] = useState(initialValues.email);
  const [phone, setPhone] = useState(initialValues.phone);
  const [mandate, setMandate] = useState(initialValues.mandate);
  const [isActive, setIsActive] = useState(initialValues.isActive);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when modal opens/closes or institution changes
  const [prevKey, setPrevKey] = useState(formKey);
  if (prevKey !== formKey) {
    setPrevKey(formKey);
    setName(initialValues.name);
    setCode(initialValues.code);
    setShortName(initialValues.shortName);
    setCategory(initialValues.category);
    setAddress(initialValues.address);
    setEmail(initialValues.email);
    setPhone(initialValues.phone);
    setMandate(initialValues.mandate);
    setIsActive(initialValues.isActive);
    setErrorMsg(null);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      short_name: shortName.trim() || null,
      category: category.trim() || 'Dinas / Badan Teknis',
      address: address.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      mandate: mandate.trim() || null,
      is_active: isActive,
    };

    try {
      let res;
      if (isEdit && institution) {
        res = await updateInstitutionAction(institution.id, payload);
      } else {
        res = await createInstitutionAction(payload);
      }

      if (!res.success) {
        setErrorMsg(res.error || 'Terjadi kesalahan saat menyimpan instansi');
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
      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-[#D9DEE7] shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F0F3FF] border-b border-[#D9DEE7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0033A7] text-[22px]">apartment</span>
            <h3 className="text-[17px] font-semibold text-[#111C2D]">
              {isEdit ? 'Edit Data Instansi' : 'Tambah Instansi Baru'}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Nama Lengkap */}
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Nama Instansi Lengkap <span className="text-[#BA1A1A]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Dinas Pekerjaan Umum dan Penataan Ruang"
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Kode Dinas */}
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Kode Instansi / Dinas <span className="text-[#BA1A1A]">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="misal: KOD-PUPR-PLG"
                className="h-10 px-3 text-[14px] font-mono bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Singkatan */}
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Singkatan / Akronim
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="misal: PUPR"
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Kategori / Nomenklatur */}
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Nomenklatur / Kategori Pemkot
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="misal: Dinas / Badan Teknis Wilayah Kota Palembang"
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Alamat Kantor */}
            <div className="md:col-span-12 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Alamat Kantor
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="misal: Jl. Merdeka No. 12, Palembang"
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Kontak Surel */}
            <div className="md:col-span-6 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Surel Kontak Kedinasan
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sekr.pupr@palembang.go.id"
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Kontak Telepon */}
            <div className="md:col-span-6 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Nomor Telepon Kantor
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(0711) 351280"
                className="h-10 px-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15"
              />
            </div>

            {/* Lingkup Tupoksi */}
            <div className="md:col-span-12 flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111C2D]">
                Lingkup Mandat / Tupoksi
              </label>
              <textarea
                rows={3}
                value={mandate}
                onChange={(e) => setMandate(e.target.value)}
                placeholder="Penanganan jalan berlubang, pemeliharaan trotoar, dan drainase perkotaan..."
                className="p-3 text-[14px] bg-white border border-[#C4C5D7] rounded-lg focus:outline-none focus:border-[#1749D2] focus:ring-2 focus:ring-[#1749D2]/15 resize-none"
              />
            </div>

            {/* Status Aktif */}
            <div className="md:col-span-12 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="instansi-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-[#C4C5D7] text-[#1749D2] focus:ring-[#1749D2]/20 cursor-pointer"
              />
              <label htmlFor="instansi-active" className="text-[13px] text-[#111C2D] cursor-pointer font-medium">
                Instansi Aktif (Dapat menerima disposisi dan penugasan laporan)
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
                <span>{isEdit ? 'Perbarui Instansi' : 'Simpan Instansi'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
