'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Road,
  Trash2,
  Droplets,
  Lightbulb,
  Tag,
  Tags,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Sparkles,
  ChevronRight,
  FolderOpen,
  Eye,
  Home,
} from 'lucide-react';
import {
  getCategoriesAction,
  type CategoryWithReportsCount,
} from '@/lib/actions/categories';
import { CategoryFormModal } from '@/components/admin/categories/category-form-modal';
import { CategoryDetailModal } from '@/components/admin/categories/category-detail-modal';

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
  const [categories, setCategories] = useState<CategoryWithReportsCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithReportsCount | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getCategoriesAction({
        search: debouncedSearch.trim() || undefined,
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
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    async function runFetch() {
      try {
        const res = await getCategoriesAction({
          search: debouncedSearch.trim() || undefined,
          status: statusFilter,
        });
        if (!isMounted) return;
        if (!res.success) {
          setErrorMsg(res.error || 'Gagal memuat daftar kategori laporan');
        } else {
          setCategories(res.data);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    runFetch();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, statusFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
  };

  const handleStatusFilterChange = (newStatus: 'all' | 'active' | 'inactive') => {
    setStatusFilter(newStatus);
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
    <div className="flex flex-col w-full gap-6">
      {/* Breadcrumb / Hierarchy */}
      <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-[#747686]" aria-label="Breadcrumb">
        <span className="inline-flex items-center gap-1">
          <Home className="w-3.5 h-3.5" aria-hidden="true" />
          SISTEM PUSAT
        </span>
        <ChevronRight className="w-3 h-3 text-[#C4C5D7]" aria-hidden="true" />
        <span>DATA MASTER</span>
        <ChevronRight className="w-3 h-3 text-[#C4C5D7]" aria-hidden="true" />
        <span className="text-[#0033A7] font-bold">KATEGORI LAPORAN</span>
      </nav>

      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center shrink-0">
            <Tags className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">
              Kategori Laporan
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] hover:bg-[#F0F3FF] transition-colors shadow-sm text-[13px] font-medium disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
          >
            <RefreshCw className={`w-4 h-4 text-[#747686] ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Sinkronisasi Taksonomi</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white transition-colors shadow-sm text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Search, Status Tabs & Badge Container */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] w-4 h-4 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari kategori atau kata kunci..."
              aria-label="Cari kategori laporan"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F0F3FF] text-[#111C2D] placeholder:text-[#747686] text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 transition-all border border-transparent focus:border-[#1749D2]"
            />
          </div>

          {/* Filter Status Buttons */}
          <div className="flex items-center bg-[#F0F3FF] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => handleStatusFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${statusFilter === 'all'
                ? 'bg-white text-[#0033A7] font-semibold shadow-sm'
                : 'text-[#434654] hover:text-[#111C2D]'
                }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange('active')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${statusFilter === 'active'
                ? 'bg-white text-[#0033A7] font-semibold shadow-sm'
                : 'text-[#434654] hover:text-[#111C2D]'
                }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange('inactive')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${statusFilter === 'inactive'
                ? 'bg-white text-[#0033A7] font-semibold shadow-sm'
                : 'text-[#434654] hover:text-[#111C2D]'
                }`}
            >
              Non-Aktif ({inactiveCount})
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-[#747686] text-[13px]">
          <span>
            Total: <strong className="text-[#111C2D] font-semibold">{totalCount} Kategori</strong>
          </span>
          <div className="h-4 w-px bg-[#D9DEE7] hidden sm:block" />
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#F0F3FF] text-[#747686] font-medium uppercase tracking-wider hidden sm:inline-block">
            Standar Taksonomi Palembang
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#BA1A1A]" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Categories Table Container */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#F8F9FB] text-[#747686] text-[11px] font-semibold uppercase tracking-wider border-b border-[#D9DEE7]">
                <th scope="col" className="py-3 px-5 min-w-[220px]">
                  Kategori &amp; Kode
                </th>
                <th scope="col" className="py-3 px-5">
                  Deskripsi &amp; Ruang Lingkup Masalah
                </th>
                <th scope="col" className="py-3 px-5 min-w-[200px]">
                  Instansi Terkait (Induk)
                </th>
                <th scope="col" className="py-3 px-5 min-w-[160px]">
                  Penggunaan Alur
                </th>
                <th scope="col" className="py-3 px-5 w-[120px]">
                  Status
                </th>
                <th scope="col" className="py-3 px-5 w-[100px] text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F3FF] text-[13px] text-[#111C2D]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#747686]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1749D2]" aria-hidden="true" />
                    <span>Memuat taksonomi kategori laporan...</span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#747686]">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-[#747686]" aria-hidden="true" />
                    <p className="font-semibold text-[#111C2D]">Tidak ada kategori ditemukan</p>
                    <p className="text-[12px] text-[#747686] mt-1">
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
                      className="hover:bg-[#F9F9FF] transition-colors"
                    >
                      {/* 1. Kategori & Kode */}
                      <td className="py-4 px-5 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center shrink-0 mt-0.5">
                            {renderCategoryIcon(cat.icon, "w-4 h-4")}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-[#111C2D] flex items-center gap-1.5">
                              <span>{cat.name_id}</span>
                              {isCore && (
                                <span title="Standar MVP">
                                  <Sparkles className="w-3.5 h-3.5 text-[#0033A7] shrink-0" aria-hidden="true" />
                                </span>
                              )}
                            </div>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold bg-[#F0F3FF] text-[#0033A7] uppercase tracking-wide">
                              {cat.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Deskripsi & Ruang Lingkup Masalah */}
                      <td className="py-4 px-5 align-top">
                        <p className="text-[13px] text-[#434654] leading-relaxed line-clamp-3">
                          {cat.description || 'Tidak ada deskripsi'}
                        </p>
                      </td>

                      {/* 3. Instansi Terkait (Induk) */}
                      <td className="py-4 px-5 align-top">
                        <div className="font-semibold text-[#111C2D]">
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
                        <div className="text-[12px] text-[#747686] mt-0.5">
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
                      <td className="py-4 px-5 align-top">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F3FF] text-[#434654] text-[12px] font-medium border border-[#D9DEE7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0033A7] shrink-0" />
                          <span>Analisis Citra</span>
                        </span>
                      </td>

                      {/* 5. Status */}
                      <td className="py-4 px-5 align-top whitespace-nowrap">
                        {cat.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] text-[11px] font-semibold border border-[#B5E2CD]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16845B]" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0F3FF] text-[#747686] text-[11px] font-medium border border-[#D9DEE7]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#747686]" />
                            Non-Aktif
                          </span>
                        )}
                      </td>

                      {/* 6. Aksi */}
                      <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(cat)}
                            className="p-1.5 rounded-lg text-[#747686] hover:text-[#0033A7] hover:bg-[#F0F3FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
                            title="Kelola Detail Kategori"
                            aria-label={`Kelola detail kategori ${cat.name_id}`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 rounded-lg text-[#747686] hover:text-[#0033A7] hover:bg-[#F0F3FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
                            title="Edit Kategori"
                            aria-label={`Edit kategori ${cat.name_id}`}
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
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
        <div className="p-4 bg-white border-t border-[#D9DEE7] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#747686]">
          <span>
            Menampilkan <strong className="text-[#111C2D] font-semibold">{categories.length}</strong> dari{' '}
            <strong className="text-[#111C2D] font-semibold">{totalCount}</strong> kategori laporan
          </span>
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
    </div >
  );
}
