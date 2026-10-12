'use client';

import { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Mail,
  User,
  Phone,
  Shield,
  RefreshCw,
  AlertCircle,
  Building2,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { inviteInternalUserAction, type InviteUserResult } from '@/lib/actions/internal-users';
import { getInstitutionsAction, getUnitsAction } from '@/lib/actions/institutions';

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
  const [institutionId, setInstitutionId] = useState<string>('');
  const [institutionUnitId, setInstitutionUnitId] = useState<string>('');

  // Creation mode: 'invite' (email invitation link) or 'direct' (initial password for test/internal)
  const [creationMode, setCreationMode] = useState<'invite' | 'direct'>('invite');
  const [initialPassword, setInitialPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [institutions, setInstitutions] = useState<
    Array<{ id: string; code: string; name: string; short_name: string | null }>
  >([]);
  const [units, setUnits] = useState<Array<{ id: string; code: string; name: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success result state for displaying transparent delivery/activation info
  const [resultInfo, setResultInfo] = useState<InviteUserResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load institutions list
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadInsts() {
      try {
        const res = await getInstitutionsAction({ status: 'active' });
        if (isMounted && res.success && res.data) {
          setInstitutions(res.data);
        }
      } catch {
        // Non-fatal
      }
    }
    loadInsts();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Load units when institution changes
  useEffect(() => {
    if (!institutionId) {
      setUnits([]);
      return;
    }
    let isMounted = true;
    async function loadUnits() {
      try {
        const res = await getUnitsAction({ institutionId, status: 'active' });
        if (isMounted && res.success && res.data) {
          setUnits(res.data);
        }
      } catch {
        // Non-fatal
      }
    }
    loadUnits();
    return () => {
      isMounted = false;
    };
  }, [institutionId]);

  // Auto-switch to direct mode suggestion if user types .local domain
  useEffect(() => {
    if (email.trim().toLowerCase().endsWith('.local') && creationMode === 'invite') {
      // Suggest direct or let user know
    }
  }, [email, creationMode]);

  // Reset form when modal closes/opens
  const handleResetForm = () => {
    setEmail('');
    setFullName('');
    setRole('petugas');
    setPhone('');
    setInstitutionId('');
    setInstitutionUnitId('');
    setCreationMode('invite');
    setInitialPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError(null);
    setResultInfo(null);
    setCopiedLink(false);
  };

  const handleClose = () => {
    if (resultInfo?.success) {
      onSuccess();
    }
    handleResetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend validations
    if (role === 'petugas' && !institutionId) {
      setError('Instansi penugasan (OPD) wajib dipilih untuk peran Petugas Lapangan.');
      setLoading(false);
      return;
    }

    if (creationMode === 'direct') {
      if (initialPassword.length < 8) {
        setError('Kata sandi awal minimal 8 karakter.');
        setLoading(false);
        return;
      }
      if (initialPassword !== confirmPassword) {
        setError('Konfirmasi kata sandi awal tidak cocok.');
        setLoading(false);
        return;
      }
      if (!/[A-Z]/.test(initialPassword) || !/[a-z]/.test(initialPassword) || !/[0-9]/.test(initialPassword)) {
        setError('Kata sandi harus mengandung kombinasi huruf besar, huruf kecil, dan angka.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await inviteInternalUserAction({
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        phone: phone.trim() || null,
        institution_id: role === 'petugas' ? (institutionId || null) : null,
        institution_unit_id: role === 'petugas' && institutionId ? (institutionUnitId || null) : null,
        initialPassword: creationMode === 'direct' ? initialPassword : null,
      });

      if (!res.success) {
        setError(res.error || 'Gagal membuat akun pengguna.');
        return;
      }

      setResultInfo(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (resultInfo?.activationUrl) {
      navigator.clipboard.writeText(resultInfo.activationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-[#D9DEE7] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
              Tambahkan akun aparatur kedinasan dengan wewenang resmi LAPORKITO.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#747686] hover:text-[#111C2D] hover:bg-[#F0F3FF] transition-colors"
            title="Tutup dialog"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {resultInfo ? (
          /* SUCCESS / RESULT PANEL */
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="p-5 rounded-xl border bg-[#F8FDF9] border-[#B5E2CD] text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#EDF7F2] text-[#16845B] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#111C2D]">
                {resultInfo.deliveryStatus === 'activated'
                  ? 'Akun Pengguna Berhasil Diaktifkan Langsung'
                  : resultInfo.deliveryStatus === 'email_sent'
                  ? 'Undangan Resmi Berhasil Dikirim'
                  : 'Akun Berhasil Dibuat (Menunggu Aktivasi)'}
              </h3>
              <p className="text-xs text-[#434654] leading-relaxed max-w-md mx-auto">
                {resultInfo.message}
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="p-4 rounded-xl bg-[#F0F3FF]/70 border border-[#C4D3F8] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#D9DEE7]">
                <span className="text-[#747686]">Nama Lengkap:</span>
                <span className="font-semibold text-[#111C2D]">{fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D9DEE7]">
                <span className="text-[#747686]">Surel Login:</span>
                <span className="font-mono font-semibold text-[#0033A7]">{email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D9DEE7]">
                <span className="text-[#747686]">Peran Otoritas:</span>
                <span className="font-semibold text-[#111C2D]">
                  {role === 'admin' ? 'Administrator Sistem' : 'Petugas Lapangan'}
                </span>
              </div>
              {role === 'petugas' && (
                <div className="flex justify-between py-1">
                  <span className="text-[#747686]">Instansi Penugasan:</span>
                  <span className="font-semibold text-[#0033A7]">
                    {institutions.find((i) => i.id === institutionId)?.name || 'OPD Terpilih'}
                  </span>
                </div>
              )}
            </div>

            {/* Activation Link Box if available */}
            {resultInfo.activationUrl && (
              <div className="space-y-2 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <label className="text-xs font-semibold text-amber-900 flex items-center justify-between">
                  <span>Tautan Aktivasi Resmi / Pengaturan Kata Sandi</span>
                  <span className="text-[10px] text-amber-700 font-normal">Berlaku satu kali</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resultInfo.activationUrl}
                    className="flex-1 h-9 px-3 text-xs bg-white border border-amber-300 rounded-lg font-mono text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-9 px-3.5 rounded-lg bg-[#0033A7] text-white hover:bg-[#1749D2] transition-colors text-xs font-medium flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Tautan</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800">
                  Kirim tautan ini kepada aparatur bersangkutan agar dapat membuat kata sandi pertama kali.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-6 rounded-lg bg-[#0033A7] text-white hover:bg-[#1749D2] transition-colors text-xs font-semibold shadow-xs"
              >
                Selesai &amp; Perbarui Daftar ASN
              </button>
            </div>
          </div>
        ) : (
          /* FORM BODY */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Surel Kedinasan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#111C2D] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0033A7]" />
                  <span>Surel Kedinasan / Akun Login</span>
                  <span className="text-red-600">*</span>
                </span>
                {email.endsWith('.local') && (
                  <span className="text-[10px] font-mono text-[#0033A7] bg-[#EDF2FE] px-1.5 py-0.5 rounded">
                    Domain Lokal
                  </span>
                )}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="petugas.dpupr@laporkito.local atau nama@palembang.go.id"
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686]"
              />
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
                placeholder="Contoh: Rahmat Hidayat, S.T."
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686]"
              />
            </div>

            {/* Peran / Role Otoritas */}
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
                    Verifikasi lapangan &amp; tanggapan aduan OPD.
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
                    Pengawasan lintas dinas &amp; tata kelola master.
                  </span>
                </label>
              </div>
            </div>

            {/* Instansi (OPD) & Unit Penugasan untuk Petugas */}
            {role === 'petugas' && (
              <div className="p-4 rounded-xl bg-[#F0F3FF]/70 border border-[#C4D3F8] space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0033A7]" />
                    <span>Instansi Penugasan (OPD)</span>
                    <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={institutionId}
                    required
                    onChange={(e) => {
                      setInstitutionId(e.target.value);
                      setInstitutionUnitId('');
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-xs font-medium focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Wajib Pilih Instansi (OPD) --</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.code ? `[${inst.code}] ` : ''}{inst.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#747686]">
                    Petugas hanya dapat membaca dan menindaklanjuti laporan yang ditugaskan ke OPD ini.
                  </p>
                </div>

                {institutionId && units.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#747686]" />
                      <span>Unit Pelaksana Teknis (Opsional)</span>
                    </label>
                    <select
                      value={institutionUnitId}
                      onChange={(e) => setInstitutionUnitId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-xs font-medium focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Seluruh Unit / Induk Instansi --</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

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

            {/* Mode Pembuatan Akun: Undangan Email vs Aktivasi Langsung */}
            <div className="pt-2 border-t border-[#D9DEE7] space-y-3">
              <label className="text-xs font-semibold text-[#111C2D] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#0033A7]" />
                  <span>Metode Aktivasi Akun</span>
                </span>
                <span className="text-[11px] text-[#747686]">Pilih alur kredensial</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCreationMode('invite')}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                    creationMode === 'invite'
                      ? 'border-[#0033A7] bg-[#EDF2FE] text-[#0033A7]'
                      : 'border-[#D9DEE7] bg-white text-[#434654] hover:bg-[#F0F3FF]'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Undangan Email
                  </span>
                  <span className="text-[10px] text-[#747686]">
                    Tautan aktivasi dikirimkan ke surel resmi aparatur.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationMode('direct')}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                    creationMode === 'direct'
                      ? 'border-[#0033A7] bg-[#EDF2FE] text-[#0033A7]'
                      : 'border-[#D9DEE7] bg-white text-[#434654] hover:bg-[#F0F3FF]'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Aktivasi Langsung
                  </span>
                  <span className="text-[10px] text-[#747686]">
                    Tetapkan kata sandi awal untuk pengujian / domain lokal.
                  </span>
                </button>
              </div>

              {/* Direct Password Form */}
              {creationMode === 'direct' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#111C2D] flex items-center justify-between">
                      <span>Kata Sandi Awal</span>
                      <span className="text-[10px] text-[#747686]">Min. 8 karakter (A-Z, a-z, 0-9)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={initialPassword}
                        onChange={(e) => setInitialPassword(e.target.value)}
                        placeholder="Contoh: PetugasPalembang2026!"
                        className="w-full h-10 px-3.5 pr-10 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747686] hover:text-[#111C2D]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#111C2D]">
                      Konfirmasi Kata Sandi Awal
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi awal"
                      className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none font-mono"
                    />
                  </div>

                  <p className="text-[11px] text-[#747686]">
                    Akun akan langsung aktif di Supabase Auth dan dapat langsung digunakan untuk masuk ke sistem tanpa menunggu email.
                  </p>
                </div>
              )}
            </div>

            {/* Privacy & Governance Notice */}
            <div className="p-3 rounded-lg bg-[#EDF2FE] border border-[#D9DEE7] text-[#434654] text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#0033A7] shrink-0 mt-0.5" />
              <span>
                Kredensial dikelola oleh <strong>Supabase Auth Admin</strong>. Kata sandi tidak pernah disimpan dalam bentuk plaintext.
              </span>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-[#D9DEE7] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClose}
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
                <span>
                  {creationMode === 'direct' ? 'Buat & Aktifkan Akun' : 'Kirim Undangan Resmi'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
