'use client';

import { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  Power,
  AlertCircle,
  Mail,
  Phone,
  Clock,
  Key,
  RefreshCw,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { toggleInternalUserStatusAction } from '@/lib/actions/internal-users';
import type { InternalUserRow } from '@/types/database';

interface UserAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: InternalUserRow | null;
  onEdit: (u: InternalUserRow) => void;
  onResetPassword?: (u: InternalUserRow) => void;
  onSuccess: () => void;
}

export function UserAccessModal({
  isOpen,
  onClose,
  user,
  onEdit,
  onResetPassword,
  onSuccess,
}: UserAccessModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  const handleToggleStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await toggleInternalUserStatusAction(user.id, !user.is_active);
      if (!res.success) {
        setError(res.error || 'Gagal mengubah status pengguna.');
        return;
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#D9DEE7] shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D9DEE7] flex items-start justify-between bg-[#F8F9FB] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#EDF2FE] text-[#0033A7] flex items-center justify-center text-sm font-bold shrink-0 border border-[#D9DEE7]">
              {getInitials(user.full_name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-[#111C2D]">
                  {user.full_name}
                </h2>
              </div>
              <p className="text-xs text-[#747686] mt-0.5">
                {user.email}
              </p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Status & Role Strip */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8F9FB] border border-[#D9DEE7]">
            <div>
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                Peran / Role
              </span>
              <span
                className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  user.role === 'admin'
                    ? 'bg-[#EDF2FE] text-[#0033A7]'
                    : 'bg-[#F0F3FF] text-[#434654]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{user.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                Status Operasional
              </span>
              <span
                className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  user.is_active
                    ? 'bg-[#EDF7F2] text-[#16845B]'
                    : 'bg-[#F0F3FF] text-[#747686]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    user.is_active ? 'bg-[#16845B]' : 'bg-slate-400'
                  }`}
                />
                <span>{user.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </span>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#0033A7]" />
              Identitas &amp; Autentikasi
            </h3>

            <div className="p-4 rounded-xl bg-white border border-[#D9DEE7] space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#747686] flex items-center gap-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5 text-[#747686]" /> Surel Akun:
                </span>
                <span className="font-semibold text-[#111C2D] font-mono text-xs">{user.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#747686] flex items-center gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-[#747686]" /> Kontak / WhatsApp:
                </span>
                <span className="font-medium text-[#111C2D] text-xs">
                  {user.phone || 'Belum ditambahkan'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#747686] flex items-center gap-1.5 text-xs">
                  <Key className="w-3.5 h-3.5 text-[#747686]" /> Supabase UID:
                </span>
                <span className="font-mono text-[11px] text-[#747686] truncate max-w-[200px]">
                  {user.id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#747686] flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-[#747686]" /> Terdaftar Sejak:
                </span>
                <span className="font-medium text-[#111C2D] text-xs">
                  {new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Access Policy Note */}
          <div className="p-3.5 rounded-xl bg-[#F8F9FB] border border-[#D9DEE7] space-y-1.5 text-xs text-[#747686]">
            <div className="flex items-center gap-1.5 font-semibold text-[#111C2D]">
              <CheckCircle2 className="w-4 h-4 text-[#0033A7]" />
              <span>Cakupan Hak Akses Portal</span>
            </div>
            <p className="leading-relaxed">
              {user.role === 'admin'
                ? 'Akun ini memiliki hak akses penuh untuk mengelola instansi, unit, pengguna, kategori, serta aturan perutean kewenangan platform.'
                : 'Akun ini berwenang untuk meninjau laporan masuk, melakukan penelaahan lapangan, serta memberikan tanggapan resmi kedinasan.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#D9DEE7] flex items-center justify-between gap-3 bg-[#F8F9FB] shrink-0">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={loading}
            className={`h-9 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              user.is_active
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-[#16845B] bg-[#EDF7F2] text-[#16845B] hover:bg-[#d8efe4]'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : user.is_active ? (
              <Power className="w-3.5 h-3.5" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            <span>{user.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onResetPassword && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResetPassword(user);
                }}
                className="h-9 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#BA1A1A] hover:bg-[#FFDAD6]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Reset kata sandi akun ini"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Reset Kata Sandi</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              className="h-9 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] hover:bg-[#F0F3FF] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profil</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF] text-xs font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
