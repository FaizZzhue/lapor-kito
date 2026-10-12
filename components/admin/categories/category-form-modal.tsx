'use client';

import { useState } from 'react';
import { X, RefreshCw, Sparkles, Tag, Road, Trash2, Droplets, Lightbulb, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';
import { createCategoryAction, updateCategoryAction } from '@/lib/actions/categories';
import type { CategoryWithReportsCount } from '@/lib/actions/categories';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryWithReportsCount | null;
  onSuccess: () => void;
}

const COMMON_ICONS = [
  { name: 'road', label: 'Jalan', icon: Road },
  { name: 'trash-2', label: 'Sampah', icon: Trash2 },
  { name: 'droplets', label: 'Air / Drainase', icon: Droplets },
  { name: 'lightbulb', label: 'PJU / Lampu', icon: Lightbulb },
  { name: 'tag', label: 'Umum', icon: Tag },
  { name: 'alert-triangle', label: 'Peringatan', icon: AlertTriangle },
  { name: 'shield-check', label: 'Keamanan', icon: ShieldCheck },
];

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: CategoryFormModalProps) {
  const isEditing = Boolean(category);
  const isCoreCategory = category?.slug
    ? ['infrastruktur-jalan', 'kebersihan-lingkungan', 'drainase-saluran-air', 'penerangan-jalan'].includes(category.slug)
    : false;

  const [nameId, setNameId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('tag');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);

  // Sync state when category changes
  const [prevCategory, setPrevCategory] = useState<CategoryWithReportsCount | null | undefined>(undefined);
  if (category !== prevCategory) {
    setPrevCategory(category);
    if (category) {
      setNameId(category.name_id);
      setNameEn(category.name_en || '');
      setSlug(category.slug);
      setDescription(category.description || '');
      setIcon(category.icon || 'tag');
      setDisplayOrder(String(category.display_order ?? 0));
      setIsActive(category.is_active);
    } else {
      setNameId('');
      setNameEn('');
      setSlug('');
      setDescription('');
      setIcon('tag');
      setDisplayOrder('1');
      setIsActive(true);
    }
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameIdChange = (val: string) => {
    setNameId(val);
    if (!isEditing && !slug) {
      // Auto generate slug from name
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name_id: nameId.trim(),
        name_en: nameEn.trim() || null,
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        icon: icon.trim() || 'tag',
        display_order: parseInt(displayOrder, 10) || 0,
        is_active: isActive,
      };

      let res;
      if (isEditing && category) {
        res = await updateCategoryAction(category.id, payload);
      } else {
        res = await createCategoryAction(payload);
      }

      if (!res.success) {
        setError(res.error || 'Terjadi kesalahan saat menyimpan kategori.');
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-[#D9DEE7] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D9DEE7] flex items-center justify-between bg-[#F8F9FB] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#EDF2FE] text-[#0033A7]">
                <Tag className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-[#111C2D]">
                {isEditing ? 'Perbarui Kategori Laporan' : 'Tambah Kategori Laporan Baru'}
              </h2>
            </div>
            <p className="text-xs text-[#747686] mt-1">
              {isEditing
                ? 'Perbarui taksonomi insiden sipil dan panduan klasifikasi laporan.'
                : 'Definisikan kategori baru untuk klasifikasi pengaduan warga dan disposisi ke OPD.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#747686] hover:text-[#111C2D] hover:bg-[#F0F3FF] transition-colors"
            title="Tutup dialog"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {isCoreCategory && (
            <div className="p-3 rounded-lg bg-[#EDF2FE] border border-[#D9DEE7] text-[#434654] text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#0033A7] shrink-0 mt-0.5" />
              <span>
                Kategori ini merupakan <strong>Taksonomi Standar MVP</strong>. Slug dikunci untuk menjaga konsistensi perutean AI dan riwayat pengaduan.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Kategori (ID) */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#111C2D] block">
                Nama Kategori (Bahasa Indonesia) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={nameId}
                onChange={(e) => handleNameIdChange(e.target.value)}
                placeholder="Contoh: Infrastruktur & Jalan"
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686]"
              />
            </div>

            {/* Nama Kategori (EN) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111C2D] block">
                Nama Kategori (English)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Infrastructure & Roads"
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686]"
              />
            </div>

            {/* Slug / Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111C2D] block">
                Slug / Kode Unik <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isCoreCategory}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="infrastruktur-jalan"
                className={`w-full h-10 px-3.5 rounded-lg border font-mono text-sm outline-none transition-all ${isCoreCategory
                    ? 'bg-[#F8F9FB] text-[#747686] border-[#D9DEE7] cursor-not-allowed'
                    : 'bg-white border-[#D9DEE7] text-[#111C2D] focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7]'
                  }`}
              />
            </div>

            {/* Urutan Tampilan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111C2D] block">
                Urutan Tampilan
              </label>
              <input
                type="number"
                min="0"
                max="999"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all"
              />
            </div>

            {/* Status Aktif */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111C2D] block">
                Status Operasional
              </label>
              <div className="flex items-center gap-3 h-10">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 transition-all peer-checked:bg-[#0033A7]"></div>
                </label>
                <span className="text-sm text-[#111C2D] font-medium">
                  {isActive ? 'Aktif (Dapat dipilih warga)' : 'Non-Aktif (Diarsipkan)'}
                </span>
              </div>
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111C2D] block">
              Icon Taksonomi
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ICONS.map((ic) => {
                const IconComponent = ic.icon;
                const isSelected = icon === ic.name;
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setIcon(ic.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${isSelected
                        ? 'border-[#0033A7] bg-[#EDF2FE] text-[#0033A7] font-semibold'
                        : 'border-[#D9DEE7] bg-white text-[#434654] hover:bg-[#F0F3FF]'
                      }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{ic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deskripsi & Ruang Lingkup */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111C2D] block">
              Deskripsi &amp; Ruang Lingkup Masalah <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Laporan kerusakan jalan, jembatan, trotoar, dan fasilitas umum transportasi darat di wilayah Kota Palembang."
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#D9DEE7] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF] transition-colors text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-lg bg-[#0033A7] text-white hover:bg-[#1749D2] transition-colors text-xs font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Simpan Perubahan' : 'Buat Kategori'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
