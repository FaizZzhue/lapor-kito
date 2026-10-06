'use client';

import { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  Power,
  Edit2,
  Mail,
  Phone,
  Clock,
  Key,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toggleInternalUserStatusAction } from '@/lib/actions/internal-users';
import type { InternalUserRow } from '@/types/database';

interface UserAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: InternalUserRow | null;
  onEdit: (u: InternalUserRow) => void;
  onSuccess: () => void;
}

export function UserAccessModal({
  isOpen,
  onClose,
  user,
  onEdit,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-container flex items-start justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-headline-sm text-headline-sm font-semibold shrink-0 shadow-xs border border-surface-container-highest">
              {getInitials(user.full_name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {user.full_name}
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {user.email}
              </p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm flex items-start gap-2.5">
              <span className="font-semibold text-error shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Status & Role Strip */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-container-low/50 border border-surface-container">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Peran / Role
              </span>
              <span
                className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                  user.role === 'admin'
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container text-primary'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{user.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}</span>
              </span>
            </div>

            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Status Operasional
              </span>
              <span
                className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                  user.is_active
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    user.is_active ? 'bg-tertiary' : 'bg-outline'
                  }`}
                />
                <span>{user.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </span>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="space-y-3">
            <h3 className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
              <Key className="w-4 h-4 text-primary" />
              Identitas &amp; Autentikasi
            </h3>

            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-outline" /> Surel Akun:
                </span>
                <span className="font-semibold text-on-surface font-mono text-xs">{user.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-outline" /> Kontak / WhatsApp:
                </span>
                <span className="font-medium text-on-surface">
                  {user.phone || 'Belum ditambahkan'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-outline" /> Supabase UID:
                </span>
                <span className="font-mono text-[11px] text-outline truncate max-w-[200px]">
                  {user.id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-outline" /> Terdaftar Sejak:
                </span>
                <span className="font-medium text-on-surface">
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
          <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-container space-y-1.5 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5 font-semibold text-on-surface">
              <CheckCircle2 className="w-4 h-4 text-primary" />
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
        <div className="px-6 py-4 border-t border-surface-container flex items-center justify-between gap-3 bg-surface-container-low/40 shrink-0">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={loading}
            className={`h-9 px-3.5 rounded-lg border font-label-md text-label-md font-medium flex items-center gap-1.5 transition-colors ${
              user.is_active
                ? 'border-error/40 text-error hover:bg-error-container/40'
                : 'border-tertiary-fixed bg-tertiary-fixed text-on-tertiary-fixed-variant hover:bg-tertiary-fixed-dim font-semibold'
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : user.is_active ? (
              <Power className="w-3.5 h-3.5" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            <span>{user.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              className="h-9 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profil</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low font-label-md text-label-md font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
