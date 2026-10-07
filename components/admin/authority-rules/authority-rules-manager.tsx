'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Info,
  ChevronRight,
  ChevronDown,
  Home,
  Building2,
  Pencil,
  Eye,
} from 'lucide-react';
import {
  type AuthorityRuleWithRelations,
  type AuthorityRuleFormData,
} from '@/lib/actions/authority-rules';
import { CreateRuleModal } from './create-rule-modal';

interface AuthorityRulesManagerProps {
  initialRules: AuthorityRuleWithRelations[];
  formData: AuthorityRuleFormData;
}

export function AuthorityRulesManager({ initialRules, formData }: AuthorityRulesManagerProps) {
  const [rules] = useState<AuthorityRuleWithRelations[]>(initialRules);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedInstitution, setSelectedInstitution] = useState('all');
  const [selectedKecamatan, setSelectedKecamatan] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSyncNotice, setShowSyncNotice] = useState(false);

  // Client-side filtering
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      // Search filter
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const codeMatch = rule.rule_code.toLowerCase().includes(q);
        const titleMatch = rule.context_title.toLowerCase().includes(q);
        const descMatch = rule.context_description?.toLowerCase().includes(q) ?? false;
        const regMatch = rule.regulation_basis.toLowerCase().includes(q);
        const catMatch = rule.category?.name_id.toLowerCase().includes(q) ?? false;
        const instMatch = rule.institution?.name.toLowerCase().includes(q) ?? false;
        const unitMatch = rule.institution_unit?.name.toLowerCase().includes(q) ?? false;
        const kecMatch = rule.kecamatan?.name.toLowerCase().includes(q) ?? false;

        if (!codeMatch && !titleMatch && !descMatch && !regMatch && !catMatch && !instMatch && !unitMatch && !kecMatch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && rule.category_id !== selectedCategory) {
        return false;
      }

      // Institution filter
      if (selectedInstitution !== 'all' && rule.institution_id !== selectedInstitution) {
        return false;
      }

      // Kecamatan filter
      if (selectedKecamatan !== 'all') {
        if (selectedKecamatan === 'all_palembang' && rule.kecamatan_id !== null) {
          return false;
        }
        if (selectedKecamatan !== 'all_palembang' && rule.kecamatan_id !== selectedKecamatan) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus === 'active' && !rule.is_active) {
        return false;
      }
      if (selectedStatus === 'inactive' && rule.is_active) {
        return false;
      }

      return true;
    });
  }, [rules, search, selectedCategory, selectedInstitution, selectedKecamatan, selectedStatus]);

  const activeCount = useMemo(() => {
    return rules.filter((r) => r.is_active).length;
  }, [rules]);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#747686] tracking-wider font-semibold uppercase mb-3">
        <Link href="/admin" className="inline-flex items-center gap-1 hover:text-[#0033A7] transition-colors">
          <Home size={13} aria-hidden="true" />
          <span>SISTEM PUSAT</span>
        </Link>
        <ChevronRight size={12} className="text-[#C4C5D7]" aria-hidden="true" />
        <span>DATA MASTER</span>
        <ChevronRight size={12} className="text-[#C4C5D7]" aria-hidden="true" />
        <span className="text-[#111C2D]">DATA KEWENANGAN</span>
      </div>

      {/* 2. Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[26px] font-bold text-[#111C2D] tracking-tight">Data Kewenangan</h1>
            <p className="text-[14px] text-[#434654] mt-0.5">
              Atur hubungan antara jenis masalah, wilayah, dan pihak penerima laporan.
            </p>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-[#F0F3FF] border border-[#C4C5D7]/60 w-fit">
              <Info size={16} className="text-[#747686] shrink-0" aria-hidden="true" />
              <span className="text-[12px] text-[#434654]">
                Data ini digunakan sebagai salah satu dasar rekomendasi pihak penerima laporan.
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowSyncNotice(true)}
            className="h-10 px-4 rounded-lg bg-white border border-[#C4C5D7] hover:bg-[#F0F3FF] text-[#111C2D] text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} className="text-[#747686]" aria-hidden="true" />
            <span>Sinkronisasi Matriks Regulasi</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-primary hover:bg-[#1749D2] text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} aria-hidden="true" />
            <span>Tambah Aturan</span>
          </button>
        </div>
      </div>

      {/* 3. Search and Compact Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#C4C5D7]/70 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aturan, konteks, regulasi..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-[#C4C5D7] text-[#111C2D] text-[13px] placeholder:text-[#747686] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-lg bg-white border border-[#C4C5D7] text-[#111C2D] text-[13px] appearance-none focus:outline-none focus:border-primary cursor-pointer hover:bg-[#F0F3FF]/40"
            >
              <option value="all">Kategori: Semua ({formData.categories.length})</option>
              {formData.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_id}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none" aria-hidden="true" />
          </div>

          {/* Institution Dropdown */}
          <div className="relative">
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-lg bg-white border border-[#C4C5D7] text-[#111C2D] text-[13px] appearance-none focus:outline-none focus:border-primary cursor-pointer hover:bg-[#F0F3FF]/40"
            >
              <option value="all">Instansi: Semua ({formData.institutions.length})</option>
              {formData.institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.short_name || inst.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none" aria-hidden="true" />
          </div>

          {/* Wilayah Dropdown */}
          <div className="relative">
            <select
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-lg bg-white border border-[#C4C5D7] text-[#111C2D] text-[13px] appearance-none focus:outline-none focus:border-primary cursor-pointer hover:bg-[#F0F3FF]/40"
            >
              <option value="all">Wilayah: Semua Cakupan</option>
              <option value="all_palembang">Kota Palembang (Semua Wilayah)</option>
              {formData.kecamatan.map((kec) => (
                <option key={kec.id} value={kec.id}>
                  Kec. {kec.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none" aria-hidden="true" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="h-10 pl-3 pr-8 rounded-lg bg-white border border-[#C4C5D7] text-[#111C2D] text-[13px] appearance-none focus:outline-none focus:border-primary cursor-pointer hover:bg-[#F0F3FF]/40"
            >
              <option value="all">Status: Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif / Ditangguhkan</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747686] pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* Right Summary Badge */}
        <div className="flex items-center shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F3FF] border border-[#C4C5D7]/60 text-[12px] text-[#434654] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>
              Total: <strong>{activeCount} Aturan Kewenangan Aktif</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Master Authority Rules Table Container */}
      <div className="bg-white rounded-xl border border-[#C4C5D7]/70 shadow-sm overflow-hidden flex flex-col">
        {filteredRules.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F0F3FF] border border-[#C4C5D7]/50 flex items-center justify-center text-primary">
              <ShieldCheck size={28} aria-hidden="true" />
            </div>
            <h3 className="text-[17px] font-bold text-[#111C2D]">
              {rules.length === 0
                ? 'Belum Ada Aturan Kewenangan Terdaftar'
                : 'Tidak Ada Aturan yang Cocok'}
            </h3>
            <p className="text-[13px] text-[#434654] max-w-md leading-relaxed">
              {rules.length === 0
                ? 'Matriks aturan kewenangan saat ini masih kosong. Buat aturan baru untuk menghubungkan taksonomi aduan warga ke instansi dan unit penanggung jawab teknis.'
                : 'Tidak ditemukan aturan kewenangan yang sesuai dengan kriteria filter atau pencarian Anda. Silakan sesuaikan filter.'}
            </p>
            {rules.length === 0 && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 h-10 px-5 rounded-lg bg-primary hover:bg-[#1749D2] text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Buat Aturan Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F0F3FF]/70 border-b border-[#C4C5D7]/60">
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#747686]">
                    Kategori & Kode
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#747686]">
                    Wilayah / Lokasi
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#747686]">
                    Konteks Masalah
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#747686]">
                    Instansi Berwenang
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#747686]">
                    Unit Pelaksana (UPT)
                  </th>
                  <th className="py-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#747686] text-center">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#747686] text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C4C5D7]/40 text-[13px] text-[#111C2D]">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#F0F3FF]/40 transition-colors">
                    {/* Category & Code */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-semibold text-[#111C2D]">
                          {rule.category?.name_id || 'Kategori Tidak Ditemukan'}
                        </span>
                        <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded bg-[#E8EEFF] border border-[#C4C5D7]/50 text-[11px] text-primary font-mono font-bold">
                          {rule.rule_code}
                        </span>
                      </div>
                    </td>

                    {/* Wilayah / Lokasi */}
                    <td className="py-3.5 px-4 align-top font-medium text-[#111C2D]">
                      {rule.kecamatan ? (
                        <>
                          <span>Kec. {rule.kecamatan.name}</span>
                          <span className="block text-[#747686] text-[11px] font-normal">
                            Wilayah Teritorial Spesifik
                          </span>
                        </>
                      ) : (
                        <>
                          <span>Kota Palembang</span>
                          <span className="block text-[#747686] text-[11px] font-normal">
                            (Semua Wilayah)
                          </span>
                        </>
                      )}
                    </td>

                    {/* Konteks Masalah */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-semibold text-[#111C2D] block">
                        {rule.context_title}
                      </span>
                      <span className="block text-[#747686] text-[11px] mt-0.5 truncate max-w-xs">
                        Dasar: {rule.regulation_basis}
                      </span>
                    </td>

                    {/* Instansi Berwenang */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 font-medium text-[#111C2D]">
                        <Building2 size={16} className="text-primary" aria-hidden="true" />
                        <span>{rule.institution?.name || 'Instansi Terhapus'}</span>
                      </div>
                    </td>

                    {/* Unit Pelaksana */}
                    <td className="py-3.5 px-4 align-top text-[#434654]">
                      {rule.institution_unit ? (
                        <span>{rule.institution_unit.name}</span>
                      ) : (
                        <span className="text-[#747686] italic text-[12px]">Induk Kedinasan</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 align-top text-center">
                      {rule.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#94F6C4]/30 border border-[#78D9AA] text-[#004A30] text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006443]"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-700 text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/data-kewenangan/${rule.id}`}
                          className="text-primary hover:text-[#1749D2] text-[12px] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <Pencil size={12} aria-hidden="true" />
                          <span>Edit</span>
                        </Link>
                        <span className="text-[#C4C5D7]">•</span>
                        <Link
                          href={`/admin/data-kewenangan/${rule.id}`}
                          className="text-[#434654] hover:text-[#111C2D] text-[12px] font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <Eye size={12} aria-hidden="true" />
                          <span>Detail Aturan</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {filteredRules.length > 0 && (
          <div className="p-3.5 bg-white border-t border-[#C4C5D7]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[12px] text-[#434654]">
              Menampilkan <strong>{filteredRules.length}</strong> dari <strong>{rules.length}</strong> aturan kewenangan terdaftar
            </span>
          </div>
        )}
      </div>

      {/* 5. Bottom Institutional Context Banner */}
      <div className="bg-[#F0F3FF] border border-[#C4C5D7]/60 p-5 rounded-xl flex items-start gap-4 mt-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
          <ShieldCheck size={22} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-[16px] font-semibold text-[#111C2D] tracking-tight">
              Prinsip Penentuan Otoritas & Perutean Deterministik
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-[#C4C5D7] text-[#434654]">
              Regulasi: Matriks Distribusi Resmi
            </span>
          </div>
          <p className="text-[12px] text-[#434654] leading-relaxed">
            Sistem LAPORKITO memanfaatkan perpaduan data taksonomi kategori, yurisdiksi spasial wilayah, dan konteks masalah teknis untuk memetakan instansi serta unit pelaksana penerima laporan secara akurat. Pengaturan kewenangan ini memastikan setiap aduan warga langsung terdisposisi ke dinas berwenang tanpa perantara birokrasi berulang atau ketidakpastian kewenangan.
          </p>
        </div>
      </div>

      {/* Create Rule Modal */}
      <CreateRuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        formData={formData}
      />

      {/* Sync Notice Modal */}
      {showSyncNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#C4C5D7] p-6 max-w-md w-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8EEFF] flex items-center justify-center shrink-0 text-primary">
                <RefreshCw size={20} aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[16px] font-bold text-[#111C2D]">Status Sinkronisasi Regulasi</h3>
                <span className="text-[12px] text-[#434654]">Koneksi API JDIH / E-Regulasi Pemkot</span>
              </div>
            </div>

            <p className="text-[13px] text-[#434654] leading-relaxed">
              Integrasi sinkronisasi otomatis dengan server JDIH / Regulasi Pemkot Palembang saat ini berstatus <strong>Operasional Manual</strong>. Pengelolaan aturan kewenangan dan dasar hukum dapat dikonfigurasikan langsung melalui konsol administrator ini.
            </p>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSyncNotice(false)}
                className="h-9 px-4 rounded-lg bg-primary hover:bg-[#1749D2] text-white text-[13px] font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
