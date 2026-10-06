'use client';

import { useState, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Shield,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { getInternalUsersAction } from '@/lib/actions/internal-users';
import { InviteUserModal } from '@/components/admin/users/invite-user-modal';
import { EditUserModal } from '@/components/admin/users/edit-user-modal';
import { UserAccessModal } from '@/components/admin/users/user-access-modal';
import type { InternalUserRow } from '@/types/database';

function useInternalUserData() {
  const [users, setUsers] = useState<InternalUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(
    async (
      searchQuery: string,
      roleFilter: 'all' | 'admin' | 'petugas',
      statusFilter: 'all' | 'active' | 'inactive'
    ) => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await getInternalUsersAction({
          search: searchQuery.trim() || undefined,
          role: roleFilter,
          status: statusFilter,
        });
        if (!res.success) {
          setErrorMsg(res.error || 'Gagal memuat daftar pengguna internal');
        } else {
          setUsers(res.data);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi sistem');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { users, isLoading, errorMsg, fetchData };
}

export default function PenggunaInternalPage() {
  const { users, isLoading, errorMsg, fetchData } = useInternalUserData();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'petugas'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [initialized, setInitialized] = useState(false);

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InternalUserRow | null>(null);

  // Initial fetch pattern
  if (!initialized) {
    setInitialized(true);
    fetchData(search, roleFilter, statusFilter);
  }

  const loadData = useCallback(() => {
    fetchData(search, roleFilter, statusFilter);
  }, [fetchData, search, roleFilter, statusFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    fetchData(val, roleFilter, statusFilter);
  };

  const handleRoleFilterChange = (role: 'all' | 'admin' | 'petugas') => {
    setRoleFilter(role);
    fetchData(search, role, statusFilter);
  };

  const handleStatusFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    fetchData(search, roleFilter, status);
  };

  const handleOpenEdit = (user: InternalUserRow) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleOpenAccess = (user: InternalUserRow) => {
    setSelectedUser(user);
    setIsAccessModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col w-full gap-6 max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb / Hierarchy */}
      <div className="flex items-center gap-1.5 text-outline text-xs uppercase tracking-wider font-semibold">
        <span>SISTEM PUSAT • KONSOL ADMINISTRATOR OPERASIONAL</span>
        <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
        <span>DATA MASTER</span>
        <ChevronRight className="w-3.5 h-3.5 text-outline-variant" />
        <span className="text-primary font-bold">PENGGUNA INTERNAL</span>
      </div>

      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
            Pengguna Internal
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Kelola akses pengguna yang bekerja pada instansi penerima laporan di lingkungan Pemerintah Kota Palembang.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="h-10 px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors shadow-xs border border-outline-variant/60 flex items-center gap-2 font-label-md text-label-md font-medium"
          >
            <RefreshCw className={`w-4 h-4 text-on-surface-variant ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sinkronisasi ASN / Kepegawaian</span>
          </button>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-xs flex items-center gap-2 font-label-md text-label-md font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/40 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative min-w-[280px] max-w-md flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama pengguna, surel, atau kontak..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-outline font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-outline hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value as 'all' | 'admin' | 'petugas')}
              className="h-10 px-3 bg-surface-container-lowest text-on-surface font-body-sm text-body-sm rounded-lg border border-outline-variant cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="all">Semua Peran</option>
              <option value="admin">Administrator Sistem</option>
              <option value="petugas">Petugas Lapangan</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              className="h-10 px-3 bg-surface-container-lowest text-on-surface font-body-sm text-body-sm rounded-lg border border-outline-variant cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 self-start xl:self-center px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm shrink-0 border border-surface-container">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="font-semibold text-on-surface">Total: {users.length} Pengguna Terdaftar</span>
          <span className="text-outline">|</span>
          <span className="text-on-surface-variant font-normal">Hak Akses Portal Kedinasan</span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm flex items-start gap-2.5">
          <span className="font-semibold text-error shrink-0">⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Data Table Container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/40 overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low/75 text-on-surface-variant text-label-sm font-label-sm uppercase tracking-wider border-b border-surface-container">
                <th scope="col" className="py-3 px-4 font-semibold text-left">
                  Nama &amp; Identitas
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-left w-[200px]">
                  Peran / Role
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-left w-[140px]">
                  Status
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-left w-[180px]">
                  Terdaftar Sejak
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-right w-[180px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Memuat daftar pengguna internal...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-on-surface-variant">
                    <div className="w-12 h-12 rounded-full bg-surface-container-low text-outline flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-on-surface text-base">Belum Ada Pengguna Internal</p>
                    <p className="text-xs text-outline mt-1 max-w-md mx-auto">
                      {search || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'Tidak ada pengguna yang cocok dengan kriteria pencarian dan filter.'
                        : 'Tambahkan atau undang akun aparatur kedinasan pertama untuk mulai mengelola disposisi laporan warga.'}
                    </p>
                    {!search && roleFilter === 'all' && statusFilter === 'all' && (
                      <button
                        type="button"
                        onClick={() => setIsInviteModalOpen(true)}
                        className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Undang Pengguna Pertama</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors">
                    {/* 1. Nama & Identitas */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-label-md text-label-md font-semibold shrink-0 border border-surface-container-highest">
                          {getInitials(u.full_name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                            {u.full_name}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            {u.email}
                          </span>
                          {u.phone && (
                            <span className="font-body-sm text-[12px] text-outline truncate">
                              Kontak: {u.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Peran / Role */}
                    <td className="py-3.5 px-4 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm font-semibold ${
                          u.role === 'admin'
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container text-primary'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{u.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}</span>
                      </span>
                    </td>

                    {/* 3. Status */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.is_active ? 'bg-tertiary' : 'bg-outline'
                          }`}
                        />
                        <span>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </div>
                    </td>

                    {/* 4. Terdaftar Sejak */}
                    <td className="py-3.5 px-4 align-middle text-body-sm text-on-surface-variant">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* 5. Aksi */}
                    <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1 text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAccess(u)}
                          className="px-3 py-1 bg-surface-container text-primary hover:bg-surface-container-high rounded text-label-sm font-label-sm font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>Kelola Akses</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-surface-container-lowest border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 text-body-sm font-body-sm">
          <span className="text-on-surface-variant">
            Menampilkan <strong className="text-on-surface">{users.length}</strong> pengguna internal terdaftar
          </span>
          <span className="text-xs text-outline">
            Otoritas akses terintegrasi Supabase Auth &amp; Role-based Governance
          </span>
        </div>
      </div>

      {/* Bottom Governance Card */}
      <div className="rounded-xl p-5 sm:p-6 bg-surface-container-lowest shadow-xs border border-outline-variant/40 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Prinsip Otoritas Akun Kedinasan &amp; Perlindungan Data Pribadi
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold tracking-wide">
              Regulasi: Perwali No. 18 / 2023 • Enkripsi TLS 1.3 ASN Gate
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Setiap akun pengguna internal terikat dengan identitas kedinasan dan kredensial resmi Pemerintah Kota Palembang. Administrator LAPORKITO mengelola penugasan unit kerja dan hak tanggapan laporan tanpa memaparkan kontak pribadi demi menjaga keamanan aparatur dan rekam jejak audit penanganan aduan warga secara akuntabel.
          </p>
        </div>
      </div>

      {/* Modals */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={loadData}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onSuccess={loadData}
      />

      <UserAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        user={selectedUser}
        onEdit={handleOpenEdit}
        onSuccess={loadData}
      />
    </div>
  );
}
