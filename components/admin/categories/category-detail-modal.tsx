'use client';

import { useState } from 'react';
import {
  X,
  Pencil,
  Trash2,
  Power,
  Road,
  Droplets,
  Lightbulb,
  Tag,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toggleCategoryStatusAction, deleteCategoryAction } from '@/lib/actions/categories';
import type { CategoryWithReportsCount } from '@/lib/actions/categories';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryWithReportsCount | null;
  onEdit: (cat: CategoryWithReportsCount) => void;
  onSuccess: () => void;
}

function renderCategoryIcon(iconName: string | null, className = 'w-6 h-6') {
  switch (iconName) {
    case 'road':
      return <Road className={className} />;
    case 'trash-2':
      return <Trash2 className={className} />;
    case 'droplets':
      return <Droplets className={className} />;
    case 'lightbulb':
      return <Lightbulb className={className} />;
    case 'alert-triangle':
      return <AlertTriangle className={className} />;
    case 'shield-check':
      return <ShieldCheck className={className} />;
    default:
      return <Tag className={className} />;
  }
}

export function CategoryDetailModal({
  isOpen,
  onClose,
  category,
  onEdit,
  onSuccess,
}: CategoryDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !category) return null;

  const isCoreCategory = [
    'infrastruktur-jalan',
    'kebersihan-lingkungan',
    'drainase-saluran-air',
    'penerangan-jalan',
  ].includes(category.slug);

  const handleToggleStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await toggleCategoryStatusAction(category.id, !category.is_active);
      if (!res.success) {
        setError(res.error || 'Gagal mengubah status kategori.');
        return;
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteCategoryAction(category.id);
      if (!res.success) {
        setError(res.error || 'Gagal menghapus kategori.');
        return;
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus kategori.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-container flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0 shadow-xs border border-surface-container-high">
              {renderCategoryIcon(category.icon, "w-6 h-6")}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  {category.name_id}
                </h2>
                <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-surface-container text-primary uppercase tracking-wide">
                  {category.slug}
                </span>
                {isCoreCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Standar MVP
                  </span>
                )}
              </div>
              {category.name_en && (
                <p className="font-body-sm text-body-sm text-on-surface-variant italic mt-0.5">
                  EN: {category.name_en}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Status & Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-container-low/50 border border-surface-container">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                  category.is_active
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    category.is_active ? 'bg-tertiary' : 'bg-outline'
                  }`}
                />
                {category.is_active ? 'Aktif' : 'Non-Aktif'}
              </span>
            </div>

            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Urutan
              </span>
              <span className="font-body-md text-body-md font-semibold text-on-surface mt-1 block">
                Posisi #{category.display_order}
              </span>
            </div>

            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Laporan Terkait
              </span>
              <span className="font-body-md text-body-md font-semibold text-primary mt-1 block">
                {category.reports_count} Laporan
              </span>
            </div>

            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Dibuat Pada
              </span>
              <span className="font-body-sm text-body-sm text-on-surface mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-outline" />
                {new Date(category.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Deskripsi & Batasan Masalah */}
          <div className="space-y-2">
            <h3 className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              Deskripsi & Ruang Lingkup Masalah
            </h3>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {category.description || 'Tidak ada deskripsi rinci untuk kategori ini.'}
            </div>
          </div>

          {/* Penggunaan Dalam Alur AI & Disposisi */}
          <div className="space-y-2">
            <h3 className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Penggunaan Dalam Alur & Tata Kelola
            </h3>
            <div className="p-4 rounded-xl bg-surface-container-low/40 border border-surface-container space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant font-medium">Model Klasifikasi AI:</span>
                <span className="font-semibold text-on-surface">Gemini 3.8 Flash Civic Triage</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant font-medium">Validasi Pelapor Warga:</span>
                <span className="font-semibold text-on-surface">Form Publik /lapor (Guest Mode)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant font-medium">Pemetaan Disposisi:</span>
                <span className="font-semibold text-primary">Data Kewenangan & Aturan Perutean</span>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Box if triggered */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-label-md text-label-md font-semibold text-error">
                    Konfirmasi Penghapusan Kategori
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {isCoreCategory
                      ? 'Kategori standar MVP tidak dapat dihapus karena dilindungi oleh sistem tata kelola.'
                      : category.reports_count > 0
                      ? `Kategori ini memiliki ${category.reports_count} laporan historis dan tidak dapat dihapus. Non-aktifkan statusnya sebagai gantinya.`
                      : 'Apakah Anda yakin ingin menghapus kategori ini secara permanen? Tindakan ini tidak dapat dibatalkan.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Batal
                </button>
                {!isCoreCategory && category.reports_count === 0 && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3.5 py-1.5 rounded-lg bg-error text-on-error font-label-md text-label-md font-semibold hover:bg-error/90 transition-colors flex items-center gap-1.5"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Hapus Permanen</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-container flex flex-wrap items-center justify-between gap-3 bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-2">
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-9 px-3 rounded-lg border border-outline-variant/60 text-error hover:bg-error-container/40 transition-colors font-label-md text-label-md flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Kategori</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={loading}
              className={`h-9 px-3 rounded-lg border font-label-md text-label-md flex items-center gap-1.5 transition-colors ${
                category.is_active
                  ? 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                  : 'border-tertiary-fixed bg-tertiary-fixed text-on-tertiary-fixed-variant hover:bg-tertiary-fixed-dim font-semibold'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{category.is_active ? 'Non-aktifkan' : 'Aktifkan Kategori'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(category);
              }}
              className="h-9 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Kategori</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
