'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, X, AlertCircle, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import {
  createAuthorityRuleAction,
  type AuthorityRuleFormData,
} from '@/lib/actions/authority-rules';

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: AuthorityRuleFormData;
}

export function CreateRuleModal({ isOpen, onClose, formData }: CreateRuleModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [ruleCode, setRuleCode] = useState('');
  const [categoryId, setCategoryId] = useState(formData.categories[0]?.id || '');
  const [kecamatanId, setKecamatanId] = useState('');
  const [contextTitle, setContextTitle] = useState('');
  const [contextDescription, setContextDescription] = useState('');
  const [institutionId, setInstitutionId] = useState(formData.institutions[0]?.id || '');
  const [institutionUnitId, setInstitutionUnitId] = useState('');
  const [regulationBasis, setRegulationBasis] = useState('');
  const [isActive, setIsActive] = useState(true);

  if (!isOpen) return null;

  // Filter units belonging to selected institution
  const availableUnits = formData.institutionUnits.filter(
    (unit) => unit.institution_id === institutionId
  );

  const handleInstitutionChange = (newInstId: string) => {
    setInstitutionId(newInstId);
    setInstitutionUnitId('');
  };

  const hasInstitutions = formData.institutions.length > 0;
  const hasCategories = formData.categories.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasInstitutions) {
      setError('Data instansi belum tersedia. Tambahkan data master instansi terlebih dahulu.');
      return;
    }

    startTransition(async () => {
      const res = await createAuthorityRuleAction({
        ruleCode,
        categoryId,
        kecamatanId: kecamatanId || null,
        contextTitle,
        contextDescription: contextDescription || null,
        institutionId,
        institutionUnitId: institutionUnitId || null,
        regulationBasis,
        isActive,
      });

      if (!res.success) {
        setError(res.error || 'Gagal menyimpan aturan kewenangan');
        return;
      }

      onClose();
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#C4C5D7]/70 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4C5D7]/60 bg-[#F0F3FF]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-primary" aria-hidden="true" />
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-[18px] font-bold text-[#111C2D]">Tambah Aturan Kewenangan</h2>
              <span className="text-[12px] text-[#434654]">Konfigurasi perutean laporan ke instansi penanggung jawab</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#747686] hover:bg-[#DFE8FF] hover:text-[#111C2D] transition-colors"
            title="Tutup"
            aria-label="Tutup"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-[13px] flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {!hasInstitutions && (
            <div className="p-4 rounded-lg bg-[#FFEACC] border border-[#FD9D33]/60 text-[#683A00] text-[13px] flex items-start gap-3">
              <AlertTriangle size={20} className="text-[#8C5000] shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#8C5000]">Master Data Instansi Belum Tersedia</span>
                <span>
                  Sistem belum memiliki data Organisasi Perangkat Daerah (OPD). Anda wajib menambahkan instansi terlebih dahulu di menu <strong>Instansi</strong> sebelum dapat membuat aturan kewenangan.
                </span>
              </div>
            </div>
          )}

          {/* Section 1: Identifikasi & Kategori */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2 border-b border-[#E8EEFF] pb-2">
              <span className="px-2 py-0.5 rounded bg-[#DDE1FF] text-primary text-[11px] font-bold">01</span>
              <span className="text-[14px] font-bold text-[#111C2D]">Dasar Laporan & Yurisdiksi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rule Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                  <span>Kode Aturan</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AT-JLN-01"
                  value={ruleCode}
                  onChange={(e) => setRuleCode(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase font-mono"
                />
                <span className="text-[11px] text-[#747686]">Kode referensi unik matriks kewenangan.</span>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                  <span>Kategori Laporan</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={!hasCategories}
                  className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary cursor-pointer disabled:bg-gray-100"
                >
                  {formData.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_id}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#747686]">Klasifikasi taksonomi aduan warga.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kecamatan Scope */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#111C2D]">
                  Cakupan Wilayah / Kecamatan
                </label>
                <select
                  value={kecamatanId}
                  onChange={(e) => setKecamatanId(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Semua Wilayah Kota Palembang</option>
                  {formData.kecamatan.map((kec) => (
                    <option key={kec.id} value={kec.id}>
                      Kec. {kec.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#747686]">Kosongkan jika berlaku untuk seluruh wilayah kota.</span>
              </div>

              {/* Context Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                  <span>Konteks Masalah / Status Teknis</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Status Jalan Kota, TPS Liar"
                  value={contextTitle}
                  onChange={(e) => setContextTitle(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="text-[11px] text-[#747686]">Kondisi atau klasifikasi spesifik lapangan.</span>
              </div>
            </div>

            {/* Context Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#111C2D]">
                Deskripsi / Kriteria Lapangan
              </label>
              <textarea
                rows={2}
                placeholder="Rincian kondisi teknis yang menentukan aturan ini berlaku..."
                value={contextDescription}
                onChange={(e) => setContextDescription(e.target.value)}
                className="p-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Section 2: Pihak Penerima Laporan */}
          <div className="flex flex-col gap-3.5 pt-2">
            <div className="flex items-center gap-2 border-b border-[#E8EEFF] pb-2">
              <span className="px-2 py-0.5 rounded bg-[#DDE1FF] text-primary text-[11px] font-bold">02</span>
              <span className="text-[14px] font-bold text-[#111C2D]">Pihak Penerima Laporan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Institution */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                  <span>Instansi Berwenang (Induk)</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={institutionId}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  disabled={!hasInstitutions}
                  className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary cursor-pointer disabled:bg-gray-100"
                >
                  {formData.institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} {inst.short_name ? `(${inst.short_name})` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#747686]">Dinas/Badan penanggung jawab kebijakan.</span>
              </div>

              {/* Institution Unit (Filtered) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#111C2D]">
                  Unit Pelaksana Teknis (UPT / Seksi)
                </label>
                <select
                  value={institutionUnitId}
                  onChange={(e) => setInstitutionUnitId(e.target.value)}
                  disabled={availableUnits.length === 0}
                  className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary cursor-pointer disabled:bg-gray-100"
                >
                  <option value="">
                    {availableUnits.length === 0
                      ? 'Belum ada UPT pada dinas ini (Disposisi ke Induk)'
                      : 'Pilih UPT / Seksi Lapangan (Opsional)'}
                  </option>
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#747686]">Tim teknis lapangan yang mengeksekusi penanganan.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Regulation Basis */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                  <span>Dasar Regulasi Resmi</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perwali No. X / 2024, SK Kadis"
                  value={regulationBasis}
                  onChange={(e) => setRegulationBasis(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="text-[11px] text-[#747686]">Rujukan hukum/regulasi kewenangan resmi.</span>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                  <span>Status Keaktifan</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                  className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="true">Aktif (Digunakan dalam Perutean)</option>
                  <option value="false">Nonaktif / Ditangguhkan</option>
                </select>
                <span className="text-[11px] text-[#747686]">Aturan nonaktif tidak akan masuk dalam rekomendasi perutean.</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#C4C5D7]/50 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-10 px-5 rounded-lg border border-[#C4C5D7] text-[#111C2D] font-medium text-[13px] hover:bg-[#F0F3FF] transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !hasInstitutions}
              className="h-10 px-6 rounded-lg bg-primary hover:bg-[#1749D2] text-white font-semibold text-[13px] inline-flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <RefreshCw size={18} className="animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={18} aria-hidden="true" />
                  <span>Simpan Aturan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
