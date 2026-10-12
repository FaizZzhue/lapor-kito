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
  RefreshCw,
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

function renderCategoryIcon(iconName: string | null, className = 'w-5 h-5') {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-[#D9DEE7] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D9DEE7] flex items-start justify-between bg-[#F8F9FB] shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#EDF2FE] text-[#0033A7] flex items-center justify-center shrink-0 border border-[#D9DEE7]">
              {renderCategoryIcon(category.icon, "w-5 h-5")}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[#111C2D]">
                  {category.name_id}
                </h2>
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-[#F0F3FF] text-[#0033A7] uppercase tracking-wide">
                  {category.slug}
                </span>
                {isCoreCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF2FE] text-[#0033A7] text-[11px] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Standar MVP
                  </span>
                )}
              </div>
              {category.name_en && (
                <p className="text-xs text-[#747686] italic mt-0.5">
                  EN: {category.name_en}
                </p>
              )}
            </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Status & Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#F8F9FB] border border-[#D9DEE7]">
            <div>
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  category.is_active
                    ? 'bg-[#EDF7F2] text-[#16845B]'
                    : 'bg-[#F0F3FF] text-[#747686]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    category.is_active ? 'bg-[#16845B]' : 'bg-slate-400'
                  }`}
                />
                {category.is_active ? 'Aktif' : 'Non-Aktif'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                Urutan
              </span>
              <span className="text-sm font-semibold text-[#111C2D] mt-1 block">
                Posisi #{category.display_order}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                Laporan Terkait
              </span>
              <span className="text-sm font-semibold text-[#0033A7] mt-1 block">
                {category.reports_count} Laporan
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                Dibuat Pada
              </span>
              <span className="text-xs text-[#434654] mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#747686]" />
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
            <h3 className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0033A7]" />
              Deskripsi &amp; Ruang Lingkup Masalah
            </h3>
            <div className="p-4 rounded-xl bg-white border border-[#D9DEE7] text-sm text-[#434654] leading-relaxed">
              {category.description || 'Tidak ada deskripsi rinci untuk kategori ini.'}
            </div>
          </div>

          {/* Penggunaan Dalam Alur AI & Disposisi */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0033A7]" />
              Penggunaan Dalam Alur &amp; Tata Kelola
            </h3>
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#D9DEE7] space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#747686] font-medium">Model Klasifikasi AI:</span>
                <span className="font-semibold text-[#111C2D]">Gemini 3.8 Flash Civic Triage</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#747686] font-medium">Validasi Pelapor Warga:</span>
                <span className="font-semibold text-[#111C2D]">Form Publik /lapor (Guest Mode)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#747686] font-medium">Pemetaan Disposisi:</span>
                <span className="font-semibold text-[#0033A7]">Data Kewenangan &amp; Aturan Perutean</span>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Box if triggered */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-red-700">
                    Konfirmasi Penghapusan Kategori
                  </h4>
                  <p className="text-xs text-red-600">
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
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#D9DEE7] text-xs font-medium text-[#434654] hover:bg-[#F0F3FF] transition-colors"
                >
                  Batal
                </button>
                {!isCoreCategory && category.reports_count === 0 && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1.5"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Hapus Permanen</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#D9DEE7] flex flex-wrap items-center justify-between gap-3 bg-[#F8F9FB] shrink-0">
          <div className="flex items-center gap-2">
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-9 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Kategori</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={loading}
              className={`h-9 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                category.is_active
                  ? 'border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF]'
                  : 'border-[#16845B] bg-[#EDF7F2] text-[#16845B] hover:bg-[#d8efe4]'
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
              className="h-9 px-4 rounded-lg bg-[#0033A7] text-white hover:bg-[#1749D2] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Kategori</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF] text-xs font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
