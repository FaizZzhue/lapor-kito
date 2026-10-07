'use client';

import { useState } from 'react';
import { X, Loader2, Sparkles, Tag, Road, Trash2, Droplets, Lightbulb, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low/40 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-surface-container text-primary">
                <Tag className="w-4 h-4" />
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                {isEditing ? 'Perbarui Kategori Laporan' : 'Tambah Kategori Laporan Baru'}
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {isEditing
                ? 'Perbarui taksonomi insiden sipil dan panduan klasifikasi laporan.'
                : 'Definisikan kategori baru untuk klasifikasi pengaduan warga dan disposisi ke OPD.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {isCoreCategory && (
            <div className="p-3 rounded-lg bg-surface-container-high/60 border border-surface-container-highest text-on-surface-variant font-body-sm text-body-sm flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Kategori ini merupakan <strong>Taksonomi Standar MVP</strong>. Slug dikunci untuk menjaga konsistensi perutean AI dan riwayat pengaduan.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Kategori (ID) */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Nama Kategori (Bahasa Indonesia) <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={nameId}
                onChange={(e) => handleNameIdChange(e.target.value)}
                placeholder="Contoh: Infrastruktur & Jalan"
                className="w-full h-10 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline"
              />
            </div>

            {/* Nama Kategori (EN) */}
            <div className="space-y-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Nama Kategori (English)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Infrastructure & Roads"
                className="w-full h-10 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline"
              />
            </div>

            {/* Slug / Code */}
            <div className="space-y-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Slug / Kode Unik <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isCoreCategory}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="infrastruktur-jalan"
                className={`w-full h-10 px-3.5 rounded-lg border font-mono text-sm outline-none transition-all ${
                  isCoreCategory
                    ? 'bg-surface-container-low text-on-surface-variant border-surface-container cursor-not-allowed'
                    : 'bg-surface-container-lowest border-outline-variant text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20'
                }`}
              />
            </div>

            {/* Urutan Tampilan */}
            <div className="space-y-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Urutan Tampilan
              </label>
              <input
                type="number"
                min="0"
                max="999"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            {/* Status Aktif */}
            <div className="space-y-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
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
                  <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  {isActive ? 'Aktif (Dapat dipilih warga)' : 'Non-Aktif (Diarsipkan)'}
                </span>
              </div>
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md font-semibold text-on-surface">
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? 'border-primary bg-surface-container text-primary font-semibold shadow-xs'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
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
            <label className="font-label-md text-label-md font-semibold text-on-surface">
              Deskripsi & Ruang Lingkup Masalah <span className="text-error">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Laporan kerusakan jalan, jembatan, trotoar, dan fasilitas umum transportasi darat di wilayah Kota Palembang."
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-surface-container flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-label-md font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Simpan Perubahan' : 'Buat Kategori'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
