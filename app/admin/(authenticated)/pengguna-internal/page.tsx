'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  Pencil,
  Shield,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Mail,
  Phone,
  Home,
} from 'lucide-react';
import { getInternalUsersAction } from '@/lib/actions/internal-users';
import { InviteUserModal } from '@/components/admin/users/invite-user-modal';
import { EditUserModal } from '@/components/admin/users/edit-user-modal';
import { UserAccessModal } from '@/components/admin/users/user-access-modal';
import type { InternalUserRow } from '@/types/database';

function useInternalUserData(
  searchQuery: string,
  roleFilter: 'all' | 'admin' | 'petugas',
  statusFilter: 'all' | 'active' | 'inactive'
) {
  const [users, setUsers] = useState<InternalUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    async function runFetch() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await getInternalUsersAction({
          search: searchQuery.trim() || undefined,
          role: roleFilter,
          status: statusFilter,
        });
        if (!isMounted) return;
        if (!res.success) {
          setErrorMsg(res.error || 'Gagal memuat daftar pengguna internal');
        } else {
          setUsers(res.data);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi sistem');
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
  }, [searchQuery, roleFilter, statusFilter]);

  return { users, isLoading, errorMsg, fetchData };
}

export default function PenggunaInternalPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'petugas'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { users, isLoading, errorMsg, fetchData } = useInternalUserData(
    debouncedSearch,
    roleFilter,
    statusFilter
  );

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InternalUserRow | null>(null);

  const loadData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
  };

  const handleRoleFilterChange = (role: 'all' | 'admin' | 'petugas') => {
    setRoleFilter(role);
  };

  const handleStatusFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
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
        <span className="text-[#0033A7] font-bold">PENGGUNA INTERNAL</span>
      </nav>

      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-[26px] font-semibold text-[#111C2D] tracking-tight">
              Pengguna Internal
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
            <span>Sinkronisasi ASN</span>
          </button>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white transition-colors shadow-sm text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
          >
            <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DEE7] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747686] w-4 h-4 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama, email, atau kontak..."
              aria-label="Cari pengguna internal"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F0F3FF] text-[#111C2D] placeholder:text-[#747686] text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 transition-all border border-transparent focus:border-[#1749D2]"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center">
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value as 'all' | 'admin' | 'petugas')}
              aria-label="Filter peran pengguna"
              className="h-10 px-3 bg-[#F0F3FF] text-[#111C2D] text-[13px] rounded-lg border border-transparent focus:border-[#1749D2] cursor-pointer focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 outline-none"
            >
              <option value="all">Semua Peran</option>
              <option value="admin">Administrator Sistem</option>
              <option value="petugas">Petugas Lapangan</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              aria-label="Filter status pengguna"
              className="h-10 px-3 bg-[#F0F3FF] text-[#111C2D] text-[13px] rounded-lg border border-transparent focus:border-[#1749D2] cursor-pointer focus:bg-white focus:ring-2 focus:ring-[#1749D2]/20 outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-[#747686] text-[13px]">
          <span>
            Total: <strong className="text-[#111C2D] font-semibold">{users.length} Pengguna</strong>
          </span>
          <div className="h-4 w-px bg-[#D9DEE7] hidden sm:block" />
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#F0F3FF] text-[#747686] font-medium uppercase tracking-wider hidden sm:inline-block">
            Hak Akses Kedinasan
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Data Table Container */}
      <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F8F9FB] text-[#747686] text-[11px] font-semibold uppercase tracking-wider border-b border-[#D9DEE7]">
                <th scope="col" className="py-3 px-5 text-left min-w-[240px]">
                  Nama &amp; Identitas
                </th>
                <th scope="col" className="py-3 px-5 text-left w-[180px]">
                  Peran / Role
                </th>
                <th scope="col" className="py-3 px-5 text-left w-[140px]">
                  Status
                </th>
                <th scope="col" className="py-3 px-5 text-left w-[160px]">
                  Terdaftar Sejak
                </th>
                <th scope="col" className="py-3 px-5 text-right w-[100px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F3FF] text-[13px] text-[#111C2D]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#747686]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1749D2]" aria-hidden="true" />
                    <span>Memuat daftar pengguna internal...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#747686]">
                    <div className="w-14 h-14 rounded-2xl bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7 text-[#0033A7]" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-[#111C2D] text-base">Belum Ada Pengguna Internal</p>
                    <p className="text-[12px] text-[#747686] mt-1 max-w-md mx-auto">
                      {search || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'Tidak ada pengguna yang cocok dengan kriteria pencarian dan filter.'
                        : 'Tambahkan atau undang akun aparatur kedinasan pertama untuk mulai mengelola disposisi laporan warga.'}
                    </p>
                    {!search && roleFilter === 'all' && statusFilter === 'all' && (
                      <button
                        type="button"
                        onClick={() => setIsInviteModalOpen(true)}
                        className="mt-4 px-4 py-2 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                        <span>Undang Pengguna Pertama</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F9F9FF] transition-colors">
                    {/* 1. Nama & Identitas */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F0F3FF] text-[#0033A7] flex items-center justify-center text-[12px] font-semibold shrink-0">
                          {getInitials(u.full_name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-[#111C2D] truncate">
                            {u.full_name}
                          </span>
                          <span className="text-[12px] text-[#747686] truncate flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#747686] shrink-0" aria-hidden="true" />
                            {u.email}
                          </span>
                          {u.phone && (
                            <span className="text-[11px] text-[#747686] truncate flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-[#747686] shrink-0" aria-hidden="true" />
                              {u.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Peran / Role */}
                    <td className="py-3.5 px-5 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${u.role === 'admin'
                          ? 'bg-[#EEF2FC] text-[#1749D2] border border-[#C4D3F8]'
                          : 'bg-[#F0F3FF] text-[#747686] border border-[#D9DEE7]'
                          }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{u.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}</span>
                      </span>
                    </td>

                    {/* 3. Status */}
                    <td className="py-3.5 px-5 align-middle">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] text-[11px] font-semibold border border-[#B5E2CD]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16845B]" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] text-[11px] font-medium border border-[#FFB4AB]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    {/* 4. Terdaftar Sejak */}
                    <td className="py-3.5 px-5 align-middle text-[12px] text-[#747686]">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* 5. Aksi */}
                    <td className="py-3.5 px-5 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenAccess(u)}
                          className="p-1.5 rounded-lg text-[#747686] hover:text-[#0033A7] hover:bg-[#F0F3FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
                          title="Kelola Akses Pengguna"
                          aria-label={`Kelola akses pengguna ${u.full_name}`}
                        >
                          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-[#747686] hover:text-[#0033A7] hover:bg-[#F0F3FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30"
                          title="Edit Pengguna"
                          aria-label={`Edit pengguna ${u.full_name}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
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
        <div className="p-4 bg-white border-t border-[#D9DEE7] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#747686]">
          <span>
            Menampilkan <strong className="text-[#111C2D] font-semibold">{users.length}</strong> pengguna internal terdaftar
          </span>
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
