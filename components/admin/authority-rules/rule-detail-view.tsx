'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Save,
  Trash2,
  ChevronRight,
  Home,
} from 'lucide-react';
import {
  updateAuthorityRuleAction,
  deleteAuthorityRuleAction,
  type AuthorityRuleWithRelations,
  type AuthorityRuleFormData,
} from '@/lib/actions/authority-rules';

interface RuleDetailViewProps {
  rule: AuthorityRuleWithRelations;
  formData: AuthorityRuleFormData;
}

export function RuleDetailView({ rule, formData }: RuleDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [ruleCode, setRuleCode] = useState(rule.rule_code);
  const [categoryId, setCategoryId] = useState(rule.category_id);
  const [kecamatanId, setKecamatanId] = useState(rule.kecamatan_id || '');
  const [contextTitle, setContextTitle] = useState(rule.context_title);
  const [contextDescription, setContextDescription] = useState(rule.context_description || '');
  const [institutionId, setInstitutionId] = useState(rule.institution_id);
  const [institutionUnitId, setInstitutionUnitId] = useState(rule.institution_unit_id || '');
  const [regulationBasis, setRegulationBasis] = useState(rule.regulation_basis);
  const [isActive, setIsActive] = useState(rule.is_active);

  // Available units filtered by chosen institution
  const availableUnits = formData.institutionUnits.filter(
    (unit) => unit.institution_id === institutionId
  );

  const handleInstitutionChange = (newInstId: string) => {
    setInstitutionId(newInstId);
    setInstitutionUnitId('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await updateAuthorityRuleAction({
        id: rule.id,
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
        setError(res.error || 'Gagal memperbarui aturan kewenangan');
        return;
      }

      setSuccessMessage('Perubahan aturan kewenangan berhasil disimpan.');
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteAuthorityRuleAction(rule.id);
      if (!res.success) {
        setError(res.error || 'Gagal menghapus aturan kewenangan');
        setShowDeleteConfirm(false);
        return;
      }
      router.push('/admin/data-kewenangan');
      router.refresh();
    });
  };

  const formattedDate = new Date(rule.updated_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <Link
          href="/admin/data-kewenangan"
          className="inline-flex items-center gap-2 text-[13px] text-[#434654] hover:text-primary transition-colors group font-medium"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          <span>Kembali ke Data Kewenangan</span>
        </Link>
        <div className="flex items-center gap-1.5 text-[11px] text-[#747686] tracking-wider font-semibold uppercase">
          <Link href="/admin" className="inline-flex items-center gap-1 hover:text-[#0033A7] transition-colors">
            <Home size={12} aria-hidden="true" />
            <span>SISTEM PUSAT</span>
          </Link>
          <ChevronRight size={11} className="text-[#C4C5D7]" aria-hidden="true" />
          <span>DATA MASTER</span>
          <ChevronRight size={11} className="text-[#C4C5D7]" aria-hidden="true" />
          <Link href="/admin/data-kewenangan" className="hover:text-[#0033A7] transition-colors">
            DATA KEWENANGAN
          </Link>
          <ChevronRight size={11} className="text-[#C4C5D7]" aria-hidden="true" />
          <span className="text-[#111C2D] font-bold">EDIT ATURAN #{rule.rule_code}</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#C4C5D7]/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[26px] font-bold text-[#111C2D] tracking-tight">Aturan Kewenangan</h1>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#94F6C4]/30 border border-[#78D9AA] text-[#004A30] text-[12px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006443]"></span>
                <span>Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-700 text-[12px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                <span>Nonaktif / Ditangguhkan</span>
              </span>
            )}
          </div>
          <p className="text-[14px] text-[#434654]">
            Atur pihak penerima yang sesuai untuk kondisi laporan tertentu secara deterministik dan terverifikasi.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F0F3FF] border border-[#C4C5D7]/50 self-start lg:self-center">
          <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
          <div className="flex flex-col text-left">
            <span className="text-[12px] font-semibold text-[#111C2D] tracking-wide font-mono">
              ID Aturan: {rule.rule_code}
            </span>
            <span className="text-[11px] text-[#434654] truncate max-w-[240px]">
              Dasar: {rule.regulation_basis}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-[13px] flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#E8EEFF] border border-primary/30 text-primary text-[13px] flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form
        onSubmit={handleUpdate}
        className="bg-white rounded-xl border border-[#C4C5D7]/70 shadow-sm p-6 lg:p-8 flex flex-col gap-8"
      >
        {/* SECTION 1: Dasar Laporan & Yurisdiksi */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#DDE1FF] text-primary text-[11px] font-bold">01</span>
              <h2 className="text-[18px] font-bold text-[#111C2D]">Dasar Laporan & Yurisdiksi</h2>
            </div>
            <p className="mt-1 text-[13px] text-[#434654]">
              Tentukan kombinasi klasifikasi masalah, cakupan wilayah, dan kondisi lapangan dari aduan warga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rule Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                <span>Kode Aturan</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ruleCode}
                onChange={(e) => setRuleCode(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono uppercase"
              />
              <span className="text-[11px] text-[#747686]">Pengenal kode unik matriks kewenangan.</span>
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
                className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary cursor-pointer"
              >
                {formData.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_id}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#747686]">Taksonomi laporan warga yang sesuai.</span>
            </div>

            {/* Wilayah / Kecamatan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#111C2D]">
                Wilayah / Cakupan Kecamatan
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
              <span className="text-[11px] text-[#747686]">Batas yurisdiksi administratif lokasi pelaporan.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Context Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                <span>Konteks Masalah / Status Teknis</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={contextTitle}
                onChange={(e) => setContextTitle(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="text-[11px] text-[#747686]">Klasifikasi teknis kewenangan jalan atau status ruang publik.</span>
            </div>

            {/* Context Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#111C2D]">
                Deskripsi / Kriteria Lapangan
              </label>
              <input
                type="text"
                value={contextDescription}
                onChange={(e) => setContextDescription(e.target.value)}
                placeholder="Rincian kondisi lapangan tambahan..."
                className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="text-[11px] text-[#747686]">Kondisi lapangan spesifik yang diverifikasi sistem.</span>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#E8EEFF] w-full" />

        {/* SECTION 2: Pihak Penerima Laporan */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#DDE1FF] text-primary text-[11px] font-bold">02</span>
              <h2 className="text-[18px] font-bold text-[#111C2D]">Pihak Penerima Laporan</h2>
            </div>
            <p className="mt-1 text-[13px] text-[#434654]">
              Pilih instansi kedinasan induk dan unit pelaksana teknis (UPT) yang bertanggung jawab menindaklanjuti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary cursor-pointer"
              >
                {formData.institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} {inst.short_name ? `(${inst.short_name})` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#747686]">Organisasi Perangkat Daerah penanggung jawab regulasi.</span>
            </div>

            {/* Institution Unit (Filtered) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#111C2D]">
                Unit Pelaksana Teknis (UPT / Seksi Lapangan)
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
              <span className="text-[11px] text-[#747686]">Tim teknis lapangan penerima notifikasi berkas penanganan.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Regulation Basis */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                <span>Dasar Regulasi Resmi</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={regulationBasis}
                onChange={(e) => setRegulationBasis(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="text-[11px] text-[#747686]">Perwali, SK Walikota, atau ketetapan hukum rujukan.</span>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#111C2D] flex items-center gap-1">
                <span>Status Keaktifan Aturan</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="h-10 px-3 rounded-lg border border-[#C4C5D7] bg-white text-[14px] focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="true">Aktif (Digunakan dalam Perutean Otomatis)</option>
                <option value="false">Nonaktif / Ditangguhkan</option>
              </select>
              <span className="text-[11px] text-[#747686]">Status operasional aturan pada mesin disposisi laporan.</span>
            </div>
          </div>
        </section>

        {/* Civic Note Callout */}
        <div className="rounded-lg bg-[#F0F3FF] border border-[#C4C5D7]/60 p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck size={19} className="text-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5 leading-relaxed">
            <span className="text-[13px] text-[#111C2D] font-semibold">
              Pedoman Penentuan Matriks Kewenangan Otomatis
            </span>
            <p className="text-[12px] text-[#434654]">
              Data ini digunakan sebagai dasar rekomendasi pihak penerima laporan. Sistem memetakan aduan secara deterministik mengacu pada matriks kewenangan resmi agar tidak terjadi misdisposisi atau lempar tanggung jawab antar dinas.
            </p>
          </div>
        </div>

        <div className="h-px bg-[#E8EEFF] w-full" />

        {/* Footer Actions & Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 text-[#747686] text-[12px]">
            <Clock size={16} aria-hidden="true" />
            <span>Terakhir diperbarui: {formattedDate}</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="h-10 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              Hapus Aturan
            </button>
            <Link
              href="/admin/data-kewenangan"
              className="h-10 px-5 rounded-lg border border-[#C4C5D7] bg-white text-[#111C2D] text-[13px] font-medium hover:bg-[#F0F3FF] transition-colors flex items-center justify-center"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 px-6 rounded-lg bg-primary hover:bg-[#1749D2] text-white text-[13px] font-semibold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <RefreshCw size={18} className="animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={18} aria-hidden="true" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 p-6 max-w-md w-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-red-600" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[16px] font-bold text-[#111C2D]">Hapus Aturan Kewenangan?</h3>
                <span className="text-[12px] text-[#434654]">Tindakan ini tidak dapat dibatalkan.</span>
              </div>
            </div>

            <p className="text-[13px] text-[#434654] leading-relaxed">
              Aturan <strong>#{rule.rule_code}</strong> ({rule.context_title}) akan dihapus secara permanen dari matriks kewenangan. Pastikan tidak ada alur yang terganggu.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="h-9 px-4 rounded-lg border border-[#C4C5D7] text-[#111C2D] text-[13px] font-medium hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold flex items-center gap-2"
              >
                {isPending ? 'Menghapus...' : 'Ya, Hapus Aturan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
