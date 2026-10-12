'use client';

import { useState } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from 'lucide-react';
import { changeOwnPasswordAction } from '@/lib/actions/auth';
import type { UserProfile } from '@/types/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  user,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client validation
    if (!currentPassword) {
      setError('Kata sandi saat ini wajib diisi.');
      return;
    }
    if (!newPassword) {
      setError('Kata sandi baru wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal harus terdiri dari 8 karakter.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setLoading(true);
    try {
      const res = await changeOwnPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setError(res.error || 'Gagal mengubah kata sandi.');
      } else {
        setSuccess(res.message || 'Kata sandi berhasil diubah.');
        handleResetForm();
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
    >
      <div className="w-full max-w-md bg-white rounded-xl border border-[#D9DEE7] shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9DEE7] flex items-center justify-between bg-[#F8F9FB] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#F0F3FF] flex items-center justify-center text-[#0033A7] shrink-0 border border-[#D9DEE7]">
              <KeyRound className="w-4 h-4 text-[#0033A7]" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="change-password-modal-title"
                className="text-[15px] font-bold text-[#111C2D] leading-tight"
              >
                Ubah Kata Sandi
              </h2>
              <p className="text-[11px] text-[#747686] mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#747686] hover:text-[#111C2D] hover:bg-[#F0F3FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30 cursor-pointer"
            title="Tutup dialog"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[13px] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A] mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-lg bg-[#EDF7F2] border border-[#B5E2CD] text-[#16845B] text-[13px] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16845B] mt-0.5" aria-hidden="true" />
              <span>{success}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#F8F9FB] border border-[#D9DEE7] text-[12px] text-[#747686] flex items-start gap-2">
            <Lock className="w-4 h-4 text-[#0033A7] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              Demi keamanan akun kedinasan, Anda wajib memverifikasi kata sandi lama sebelum menetapkan kata sandi baru minimal 8 karakter.
            </p>
          </div>

          {/* Current Password Field */}
          <div>
            <label
              htmlFor="current-password-input"
              className="block text-[13px] font-semibold text-[#111C2D] mb-1.5"
            >
              Kata Sandi Saat Ini <span className="text-[#BA1A1A]">*</span>
            </label>
            <div className="relative">
              <input
                id="current-password-input"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama Anda"
                required
                autoComplete="current-password"
                className="w-full h-10 px-3.5 pr-10 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-[13px] focus:outline-none focus:border-[#0033A7] focus:ring-2 focus:ring-[#0033A7]/20 transition-all placeholder:text-[#747686]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                aria-label={showCurrent ? 'Sembunyikan kata sandi saat ini' : 'Tampilkan kata sandi saat ini'}
                title={showCurrent ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#111C2D] focus-visible:outline-none cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label
              htmlFor="new-password-input"
              className="block text-[13px] font-semibold text-[#111C2D] mb-1.5"
            >
              Kata Sandi Baru <span className="text-[#BA1A1A]">*</span>
            </label>
            <div className="relative">
              <input
                id="new-password-input"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full h-10 px-3.5 pr-10 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-[13px] focus:outline-none focus:border-[#0033A7] focus:ring-2 focus:ring-[#0033A7]/20 transition-all placeholder:text-[#747686]"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                aria-label={showNew ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                title={showNew ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#111C2D] focus-visible:outline-none cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirm-password-input"
              className="block text-[13px] font-semibold text-[#111C2D] mb-1.5"
            >
              Konfirmasi Kata Sandi Baru <span className="text-[#BA1A1A]">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-password-input"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full h-10 px-3.5 pr-10 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-[13px] focus:outline-none focus:border-[#0033A7] focus:ring-2 focus:ring-[#0033A7]/20 transition-all placeholder:text-[#747686]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                title={showConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#111C2D] focus-visible:outline-none cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#D9DEE7]/80">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF] text-[13px] font-medium transition-colors focus-visible:outline-none cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Simpan Kata Sandi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
