'use client';

import { useState, useCallback } from 'react';
import {
  Road,
  Trash2,
  Droplets,
  Lightbulb,
  Tag,
  AlertTriangle,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Sparkles,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import {
  getCategoriesAction,
  type CategoryWithReportsCount,
} from '@/lib/actions/categories';
import { CategoryFormModal } from '@/components/admin/categories/category-form-modal';
import { CategoryDetailModal } from '@/components/admin/categories/category-detail-modal';

function useCategoryData() {
  const [categories, setCategories] = useState<CategoryWithReportsCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(
    async (searchQuery: string, statusFilter: 'all' | 'active' | 'inactive') => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await getCategoriesAction({
          search: searchQuery.trim() || undefined,
          status: statusFilter,
        });
        if (!res.success) {
          setErrorMsg(res.error || 'Gagal memuat daftar kategori laporan');
        } else {
          setCategories(res.data);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { categories, isLoading, errorMsg, fetchData };
}

function renderCategoryIcon(iconName: string | null, className = 'w-4 h-4') {
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

export default function KategoriLaporanPage() {
  const { categories, isLoading, errorMsg, fetchData } = useCategoryData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [initialized, setInitialized] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithReportsCount | null>(null);

  // Initial fetch pattern
  if (!initialized) {
    setInitialized(true);
    fetchData(search, statusFilter);
  }

  const loadData = useCallback(() => {
    fetchData(search, statusFilter);
  }, [fetchData, search, statusFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    fetchData(val, statusFilter);
  };

  const handleStatusFilterChange = (newStatus: 'all' | 'active' | 'inactive') => {
    setStatusFilter(newStatus);
    fetchData(search, newStatus);
  };

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryWithReportsCount) => {
    setSelectedCategory(cat);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (cat: CategoryWithReportsCount) => {
    setSelectedCategory(cat);
    setIsDetailModalOpen(true);
  };

  // Status counts
  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;

  return (
    <div className="flex flex-col w-full gap-6 max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb / Hierarchy */}
      <div className="flex items-center gap-1.5 text-outline text-xs uppercase tracking-wider font-semibold">
        <span>SISTEM PUSAT • KONSOL ADMINISTRATOR OPERASIONAL</span>
        <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
        <span>DATA MASTER</span>
        <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
        <span className="text-primary font-bold">KATEGORI LAPORAN</span>
      </div>

      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Kategori Laporan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Kelola kategori yang digunakan dalam proses klasifikasi laporan dan perutean disposisi ke instansi berwenang.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="h-10 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors shadow-xs border border-outline-variant/60 flex items-center gap-2 font-label-md text-label-md font-medium"
          >
            <RefreshCw className={`w-4 h-4 text-on-surface-variant ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sinkronisasi Taksonomi</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-10 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-xs flex items-center gap-2 font-label-md text-label-md font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Search, Status Tabs & Badge Container */}
      <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-xs border border-outline-variant/40 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari kategori atau kata kunci..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-outline font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Filter Status Segment & Summary Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-0.5 bg-surface-container-low rounded-lg border border-surface-container">
              <button
                type="button"
                onClick={() => handleStatusFilterChange('all')}
                className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all ${
                  statusFilter === 'all'
                    ? 'font-semibold bg-surface-container-lowest text-primary shadow-xs'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua Status ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('active')}
                className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all ${
                  statusFilter === 'active'
                    ? 'font-semibold bg-surface-container-lowest text-primary shadow-xs'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('inactive')}
                className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all ${
                  statusFilter === 'inactive'
                    ? 'font-semibold bg-surface-container-lowest text-primary shadow-xs'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Non-Aktif ({inactiveCount})
              </button>
            </div>

            <div className="h-5 w-px bg-surface-container-high hidden sm:block" />

            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>Total: {activeCount} Kategori MVP Aktif | Standar Taksonomi Sipil Pemkot Palembang</span>
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm flex items-start gap-2.5">
            <span className="font-semibold text-error shrink-0">⚠</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-md text-body-md border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                <th scope="col" className="py-3 px-4 rounded-l-lg font-semibold w-[220px]">
                  Kategori &amp; Kode
                </th>
                <th scope="col" className="py-3 px-4 font-semibold">
                  Deskripsi &amp; Ruang Lingkup Masalah
                </th>
                <th scope="col" className="py-3 px-4 font-semibold w-[220px]">
                  Instansi Terkait (Induk)
                </th>
                <th scope="col" className="py-3 px-4 font-semibold w-[230px]">
                  Penggunaan Dalam Alur
                </th>
                <th scope="col" className="py-3 px-4 font-semibold w-[120px]">
                  Status
                </th>
                <th scope="col" className="py-3 px-4 rounded-r-lg font-semibold text-right w-[150px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Memuat taksonomi kategori laporan...</span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="font-semibold text-on-surface">Tidak ada kategori ditemukan</p>
                    <p className="text-xs text-outline mt-1">
                      {search ? `Tidak ada hasil untuk pencarian "${search}"` : 'Belum ada data kategori.'}
                    </p>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const isCore = [
                    'infrastruktur-jalan',
                    'kebersihan-lingkungan',
                    'drainase-saluran-air',
                    'penerangan-jalan',
                  ].includes(cat.slug);

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-surface-container-low/50 transition-colors group"
                    >
                      {/* 1. Kategori & Kode */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-surface-container-low text-primary flex items-center justify-center shrink-0 mt-0.5 border border-surface-container">
                            {renderCategoryIcon(cat.icon, "w-4 h-4")}
                          </div>
                          <div className="min-w-0">
                            <div className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
                              <span>{cat.name_id}</span>
                              {isCore && (
                                <span title="Standar MVP">
                                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold bg-surface-container text-primary uppercase tracking-wide">
                              {cat.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Deskripsi & Ruang Lingkup Masalah */}
                      <td className="py-4 px-4 align-top">
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-3">
                          {cat.description || 'Tidak ada deskripsi'}
                        </p>
                      </td>

                      {/* 3. Instansi Terkait (Induk) */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-body-md text-body-md font-medium text-on-surface">
                          {cat.slug === 'infrastruktur-jalan'
                            ? 'Dinas SDA BMBK (PUPR)'
                            : cat.slug === 'penerangan-jalan'
                            ? 'Dinas Perkimtan'
                            : cat.slug === 'kebersihan-lingkungan'
                            ? 'Dinas LHK (DLHK)'
                            : cat.slug === 'drainase-saluran-air'
                            ? 'Dinas SDA BMBK'
                            : 'Ditentukan via Data Kewenangan'}
                        </div>
                        <div className="font-label-sm text-label-sm text-outline mt-0.5">
                          {cat.slug === 'infrastruktur-jalan'
                            ? 'Unit Preservasi Jalan Kota'
                            : cat.slug === 'penerangan-jalan'
                            ? 'Bidang Prasarana & PJU'
                            : cat.slug === 'kebersihan-lingkungan'
                            ? 'Bidang Pengelolaan Sampah'
                            : cat.slug === 'drainase-saluran-air'
                            ? 'Seksi Saluran Sekunder & Banjir'
                            : 'Aturan Perutean Otomatis'}
                        </div>
                      </td>

                      {/* 4. Penggunaan Dalam Alur */}
                      <td className="py-4 px-4 align-top">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm border border-surface-container">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>Prioritas MVP • Analisis Citra &amp; GPS</span>
                        </span>
                      </td>

                      {/* 5. Status */}
                      <td className="py-4 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                            cat.is_active
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.is_active ? 'bg-tertiary' : 'bg-outline'
                            }`}
                          />
                          <span>{cat.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                        </span>
                      </td>

                      {/* 6. Aksi */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="font-label-md text-label-md font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <span className="text-outline-variant">•</span>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(cat)}
                            className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
                          >
                            Kelola Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Info */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-container text-sm text-on-surface-variant">
          <span>
            Menampilkan <strong className="text-on-surface">{categories.length}</strong> dari{' '}
            <strong className="text-on-surface">{totalCount}</strong> kategori laporan
          </span>
          <span className="text-xs text-outline">
            Sistem klasifikasi multi-modal berbasis Gemini 3.8 Flash
          </span>
        </div>
      </div>

      {/* Bottom Regulatory / Standard Card (from Stitch) */}
      <div className="rounded-xl bg-surface-container-low p-5 sm:p-6 shadow-xs border border-surface-container">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Standar Taksonomi Kategori &amp; Akurasi Disposisi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold bg-surface-container-highest text-primary border border-surface-container-high">
                Regulasi: SK Walikota No. 42 / 2024 • MVP Faktual
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Setiap kategori laporan dirancang dengan batasan deskriptif yang jelas agar verifikasi awal dan pendampingan warga menghasilkan data yang terstruktur sebelum diteruskan ke dinas teknis terkait tanpa bias atau misklasifikasi.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        category={selectedCategory}
        onSuccess={loadData}
      />

      <CategoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        category={selectedCategory}
        onEdit={handleOpenEdit}
        onSuccess={loadData}
      />
    </div>
  );
}
