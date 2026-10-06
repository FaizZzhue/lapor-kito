'use client';

import { useState } from 'react';
import { X, UserCheck, Mail, User, Phone, Shield, Loader2 } from 'lucide-react';
import { updateInternalUserAction } from '@/lib/actions/internal-users';
import type { InternalUserRow } from '@/types/database';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: InternalUserRow | null;
  onSuccess: () => void;
}

export function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'petugas' | 'admin'>('petugas');
  const [phone, setPhone] = useState('');

  // Sync state when user prop changes
  const [prevUser, setPrevUser] = useState<InternalUserRow | null | undefined>(undefined);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setFullName(user.full_name);
      setRole(user.role);
      setPhone(user.phone || '');
    } else {
      setFullName('');
      setRole('petugas');
      setPhone('');
    }
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await updateInternalUserAction(user.id, {
        full_name: fullName.trim(),
        role,
        phone: phone.trim() || null,
      });

      if (!res.success) {
        setError(res.error || 'Gagal memperbarui profil pengguna.');
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
        <div className="px-6 py-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low/40 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-surface-container text-primary">
                <UserCheck className="w-4 h-4" />
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Edit Profil Pengguna Internal
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Perbarui identitas dan penugasan peran aparatur kedinasan.
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
              <span className="font-semibold text-error shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Surel (Read-only anchor) */}
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-outline" />
              <span>Surel Kedinasan (Terkunci)</span>
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full h-10 px-3.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface-variant font-mono text-sm cursor-not-allowed"
            />
          </div>

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Nama Lengkap &amp; Gelar</span>
              <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso, S.T."
              className="w-full h-10 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline"
            />
          </div>

          {/* Peran / Role */}
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Peran / Role Otoritas</span>
              <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  role === 'petugas'
                    ? 'border-primary bg-surface-container-low text-primary ring-1 ring-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit-role"
                    value="petugas"
                    checked={role === 'petugas'}
                    onChange={() => setRole('petugas')}
                    className="sr-only"
                  />
                  <span className="font-label-md text-label-md font-semibold">Petugas Lapangan</span>
                </div>
                <span className="text-xs text-on-surface-variant mt-1">
                  Verifikasi laporan &amp; tindak lanjut aduan.
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  role === 'admin'
                    ? 'border-primary bg-surface-container-low text-primary ring-1 ring-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edit-role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                    className="sr-only"
                  />
                  <span className="font-label-md text-label-md font-semibold">Administrator</span>
                </div>
                <span className="text-xs text-on-surface-variant mt-1">
                  Kelola master data &amp; akses pengguna.
                </span>
              </label>
            </div>
          </div>

          {/* Nomor Telepon */}
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>Nomor Kontak / WhatsApp</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full h-10 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline"
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
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
