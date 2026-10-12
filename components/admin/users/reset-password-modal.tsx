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
  Shield,
  Mail,
  Copy,
  Check,
  Dices,
} from 'lucide-react';
import {
  adminResetUserPasswordAction,
  adminSendUserRecoveryEmailAction,
} from '@/lib/actions/auth';
import type { InternalUserRow } from '@/types/database';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: InternalUserRow | null;
  onSuccess?: () => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: ResetPasswordModalProps) {
  const [tab, setTab] = useState<'manual' | 'email'>('manual');

  // Manual reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Email recovery state
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleResetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setRecoveryUrl(null);
    setIsCopied(false);
    setError(null);
    setSuccess(null);
    setTab('manual');
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setShowConfirm(true);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal harus terdiri dari 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminResetUserPasswordAction({
        userId: user.id,
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setError(res.error || 'Gagal mengatur ulang kata sandi pengguna.');
      } else {
        setSuccess(res.message || 'Kata sandi pengguna berhasil diatur ulang.');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          handleClose();
        }, 1800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecoveryEmail = async () => {
    setError(null);
    setSuccess(null);
    setRecoveryUrl(null);
    setIsCopied(false);

    setLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const res = await adminSendUserRecoveryEmailAction(user.id, origin);

      if (!res.success) {
        setError(res.error || res.message || 'Gagal memproses pemulihan kata sandi.');
      } else {
        setSuccess(res.message);
        if (res.recoveryUrl) {
          setRecoveryUrl(res.recoveryUrl);
        }
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecoveryUrl = async () => {
    if (!recoveryUrl) return;
    try {
      await navigator.clipboard.writeText(recoveryUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
    >
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#D9DEE7] shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9DEE7] flex items-center justify-between bg-[#F8F9FB] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#FFDAD6]/60 flex items-center justify-center text-[#BA1A1A] shrink-0 border border-[#BA1A1A]/20">
              <KeyRound className="w-4 h-4 text-[#BA1A1A]" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="reset-password-modal-title"
                className="text-[15px] font-bold text-[#111C2D] leading-tight"
              >
                Reset Kata Sandi Pengguna
              </h2>
              <p className="text-[11px] text-[#747686] mt-0.5">
                Pengelolaan kredensial akun staf internal oleh Administrator
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

        {/* Target User Info Card */}
        <div className="px-6 pt-5 pb-3">
          <div className="p-3.5 rounded-xl bg-[#F8F9FB] border border-[#D9DEE7] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                Akun Sasaran
              </span>
              <p className="text-[14px] font-bold text-[#111C2D] truncate mt-0.5">
                {user.full_name}
              </p>
              <p className="text-[12px] text-[#747686] font-mono truncate">
                {user.email}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                user.role === 'admin'
                  ? 'bg-[#EEF2FC] text-[#1749D2] border border-[#C4D3F8]'
                  : 'bg-[#F0F3FF] text-[#747686] border border-[#D9DEE7]'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>{user.role === 'admin' ? 'Administrator' : 'Petugas'}</span>
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pb-2">
          <div className="flex items-center p-1 bg-[#F0F3FF] rounded-lg border border-[#D9DEE7]">
            <button
              type="button"
              onClick={() => {
                setTab('manual');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-md text-[13px] font-medium transition-colors ${
                tab === 'manual'
                  ? 'bg-white text-[#0033A7] font-semibold shadow-xs'
                  : 'text-[#434654] hover:text-[#111C2D]'
              }`}
            >
              Tetapkan Kata Sandi Baru
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('email');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-md text-[13px] font-medium transition-colors ${
                tab === 'email'
                  ? 'bg-white text-[#0033A7] font-semibold shadow-xs'
                  : 'text-[#434654] hover:text-[#111C2D]'
              }`}
            >
              Kirim Tautan Pemulihan
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

          {tab === 'manual' ? (
            <form onSubmit={handleManualSubmit} id="admin-reset-form" className="space-y-4">
              <div className="p-3 rounded-lg bg-[#F8F9FB] border border-[#D9DEE7] text-[12px] text-[#434654] flex items-start justify-between gap-3">
                <p className="leading-relaxed">
                  Admin dapat menetapkan kata sandi sementara secara langsung. Pastikan menyampaikan kata sandi ini kepada pemilik akun dengan aman.
                </p>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="px-2.5 py-1 rounded bg-white border border-[#D9DEE7] text-[#0033A7] hover:bg-[#F0F3FF] text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                  title="Buat kata sandi acak yang kuat"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Acak Sandi</span>
                </button>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="admin-new-password"
                  className="block text-[13px] font-semibold text-[#111C2D] mb-1.5"
                >
                  Kata Sandi Baru <span className="text-[#BA1A1A]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin-new-password"
                    type={showPassword ? 'text' : 'password'}
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
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#111C2D] focus-visible:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="admin-confirm-password"
                  className="block text-[13px] font-semibold text-[#111C2D] mb-1.5"
                >
                  Konfirmasi Kata Sandi Baru <span className="text-[#BA1A1A]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin-confirm-password"
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
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#F8F9FB] border border-[#D9DEE7] text-[12px] text-[#434654] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#111C2D]">
                  <Mail className="w-4 h-4 text-[#0033A7]" />
                  <span>Kirim Tautan Pemulihan via Email / Salin URL</span>
                </div>
                <p className="leading-relaxed">
                  Sistem akan membuat tautan pemulihan resmi melalui Supabase Auth. Jika surel target terkonfigurasi dengan layanan pengiriman surel aktif, tautan dikirim langsung ke surel resmi staf.
                </p>
              </div>

              {recoveryUrl && (
                <div className="p-3.5 rounded-lg bg-white border border-[#D9DEE7] space-y-2">
                  <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                    Tautan Pemulihan Dibuat
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={recoveryUrl}
                      className="flex-1 h-9 px-3 rounded bg-[#F8F9FB] border border-[#D9DEE7] font-mono text-[11px] text-[#111C2D] select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyRecoveryUrl}
                      className="h-9 px-3 rounded bg-white border border-[#D9DEE7] text-[#0033A7] hover:bg-[#F0F3FF] text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#16845B]" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#747686]">
                    Serahkan tautan ini secara aman kepada pengguna terkait untuk membuka halaman reset kata sandi.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#D9DEE7] flex items-center justify-end gap-3 bg-[#F8F9FB] shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="h-9 px-4 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF] text-[13px] font-medium transition-colors focus-visible:outline-none cursor-pointer"
          >
            Batal
          </button>

          {tab === 'manual' ? (
            <button
              type="submit"
              form="admin-reset-form"
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-[#BA1A1A] hover:bg-[#93000A] text-white text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BA1A1A]/30 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" aria-hidden="true" />
                  <span>Reset Kata Sandi</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendRecoveryEmail}
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-[#1749D2] hover:bg-[#0033A7] text-white text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1749D2]/30 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Buat Tautan Pemulihan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
