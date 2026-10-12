'use client';

import { useState, useMemo } from 'react';
import { Building2, X, AlertCircle, RefreshCw } from 'lucide-react';
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

  // Derive initial values from props
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-[#D9DEE7] shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#F8F9FB] border-b border-[#D9DEE7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EDF2FE] text-[#0033A7] flex items-center justify-center border border-[#D9DEE7]">
              <Building2 className="w-5 h-5 text-[#0033A7]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111C2D]">
                {isEdit ? 'Edit Data Instansi' : 'Tambah Instansi Baru'}
              </h3>
              <p className="text-xs text-[#747686]">
                {isEdit
                  ? 'Perbarui profil dan kewenangan operasional instansi dinas.'
                  : 'Daftarkan instansi OPD baru sebagai pengampu tindak lanjut aduan warga.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#747686] hover:text-[#111C2D] p-1.5 rounded-lg hover:bg-[#F0F3FF] transition-colors"
            title="Tutup dialog"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Nama Lengkap */}
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Nama Instansi Lengkap <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Dinas Pekerjaan Umum dan Penataan Ruang"
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Kode Dinas */}
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Kode Instansi / Dinas <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="misal: DPUPR"
                className="h-10 px-3.5 text-sm font-mono bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Singkatan */}
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Singkatan / Akronim
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="misal: PUPR"
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Kategori / Nomenklatur */}
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Nomenklatur / Kategori Pemkot
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="misal: Dinas / Badan Teknis Wilayah Kota Palembang"
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Alamat Kantor */}
            <div className="md:col-span-12 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Alamat Kantor
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="misal: Jl. Merdeka No. 12, Palembang"
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Kontak Surel */}
            <div className="md:col-span-6 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Surel Kontak Kedinasan
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sekr.pupr@palembang.go.id"
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Kontak Telepon */}
            <div className="md:col-span-6 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Nomor Telepon Kantor
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(0711) 351280"
                className="h-10 px-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] transition-all"
              />
            </div>

            {/* Lingkup Tupoksi */}
            <div className="md:col-span-12 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#111C2D]">
                Lingkup Mandat / Tupoksi
              </label>
              <textarea
                rows={3}
                value={mandate}
                onChange={(e) => setMandate(e.target.value)}
                placeholder="Penanganan jalan berlubang, pemeliharaan trotoar, dan drainase perkotaan..."
                className="p-3.5 text-sm bg-white border border-[#D9DEE7] text-[#111C2D] rounded-lg focus:outline-none focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] placeholder:text-[#747686] resize-none transition-all"
              />
            </div>

            {/* Status Aktif */}
            <div className="md:col-span-12 flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="instansi-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-[#D9DEE7] text-[#0033A7] focus:ring-[#0033A7]/20 cursor-pointer"
              />
              <label htmlFor="instansi-active" className="text-xs text-[#111C2D] cursor-pointer font-medium">
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
                <span>{isEdit ? 'Perbarui Instansi' : 'Simpan Instansi'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
