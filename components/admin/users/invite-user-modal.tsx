'use client';

import { useState } from 'react';
import { X, UserPlus, Mail, User, Phone, Shield, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { inviteInternalUserAction } from '@/lib/actions/internal-users';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'petugas' | 'admin'>('petugas');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await inviteInternalUserAction({
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        phone: phone.trim() || null,
      });

      if (!res.success) {
        setError(res.error || 'Gagal mengundang pengguna.');
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
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-[#D9DEE7] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D9DEE7] flex items-center justify-between bg-[#F8F9FB] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#EDF2FE] text-[#0033A7]">
                <UserPlus className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-[#111C2D]">
                Tambah / Undang Pengguna Internal
              </h2>
            </div>
            <p className="text-xs text-[#747686] mt-1">
              Undang aparatur atau staf operasional ke Portal Konsol Internal LAPORKITO.
            </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Surel Kedinasan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0033A7]" />
              <span>Surel Kedinasan / Email Resmi</span>
              <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama.staf@palembang.go.id"
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686]"
            />
            <p className="text-[11px] text-[#747686]">
              Tautan aktivasi kredensial akan dikirimkan langsung ke alamat surel ini secara aman.
            </p>
          </div>

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0033A7]" />
              <span>Nama Lengkap &amp; Gelar</span>
              <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso, S.T."
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686]"
            />
          </div>

          {/* Peran / Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0033A7]" />
              <span>Peran / Role Otoritas</span>
              <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                  role === 'petugas'
                    ? 'border-[#0033A7] bg-[#EDF2FE] text-[#0033A7]'
                    : 'border-[#D9DEE7] bg-white text-[#434654] hover:bg-[#F0F3FF]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="petugas"
                    checked={role === 'petugas'}
                    onChange={() => setRole('petugas')}
                    className="sr-only"
                  />
                  <span className="text-xs font-semibold">Petugas Lapangan</span>
                </div>
                <span className="text-[11px] text-[#747686] mt-1">
                  Verifikasi lapangan &amp; tanggapan aduan warga.
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                  role === 'admin'
                    ? 'border-[#0033A7] bg-[#EDF2FE] text-[#0033A7]'
                    : 'border-[#D9DEE7] bg-white text-[#434654] hover:bg-[#F0F3FF]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                    className="sr-only"
                  />
                  <span className="text-xs font-semibold">Administrator</span>
                </div>
                <span className="text-[11px] text-[#747686] mt-1">
                  Hak penuh tata kelola master data &amp; pengguna.
                </span>
              </label>
            </div>
          </div>

          {/* Nomor Kontak / Telepon */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0033A7]" />
              <span>Nomor Kontak / WhatsApp</span>
              <span className="text-xs font-normal text-[#747686]">(Opsional)</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686]"
            />
          </div>

          {/* Privacy & Governance Notice */}
          <div className="p-3 rounded-lg bg-[#EDF2FE] border border-[#D9DEE7] text-[#434654] text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#0033A7] shrink-0 mt-0.5" />
            <span>
              Kredensial dikelola oleh <strong>Supabase Auth</strong>. Sistem tidak pernah menyimpan atau mengirim kata sandi secara plaintext.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#D9DEE7] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF] transition-colors text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-lg bg-[#0033A7] text-white hover:bg-[#1749D2] transition-colors text-xs font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Kirim Undangan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
