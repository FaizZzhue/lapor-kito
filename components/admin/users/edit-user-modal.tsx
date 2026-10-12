import { useState, useEffect } from 'react';
import { X, UserCheck, Mail, User, Phone, Shield, RefreshCw, AlertCircle, Building2 } from 'lucide-react';
import { updateInternalUserAction } from '@/lib/actions/internal-users';
import { getInstitutionsAction, getUnitsAction } from '@/lib/actions/institutions';
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
  const [institutionId, setInstitutionId] = useState<string>('');
  const [institutionUnitId, setInstitutionUnitId] = useState<string>('');

  const [institutions, setInstitutions] = useState<Array<{ id: string; code: string; name: string; short_name: string | null }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);

  // Sync state when user prop changes
  const [prevUser, setPrevUser] = useState<InternalUserRow | null | undefined>(undefined);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setFullName(user.full_name);
      setRole(user.role);
      setPhone(user.phone || '');
      setInstitutionId((user as any).institution_id || '');
      setInstitutionUnitId((user as any).institution_unit_id || '');
    } else {
      setFullName('');
      setRole('petugas');
      setPhone('');
      setInstitutionId('');
      setInstitutionUnitId('');
    }
  }

  // Load institutions list when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadInsts() {
      setIsLoadingInstitutions(true);
      try {
        const res = await getInstitutionsAction({ status: 'active' });
        if (isMounted && res.success && res.data) {
          setInstitutions(res.data);
        }
      } finally {
        if (isMounted) setIsLoadingInstitutions(false);
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
        institution_id: role === 'petugas' ? (institutionId || null) : null,
        institution_unit_id: role === 'petugas' && institutionId ? (institutionUnitId || null) : null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-[#D9DEE7] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D9DEE7] flex items-center justify-between bg-[#F8F9FB] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#EDF2FE] text-[#0033A7]">
                <UserCheck className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-[#111C2D]">
                Edit Profil Pengguna Internal
              </h2>
            </div>
            <p className="text-xs text-[#747686] mt-1">
              Perbarui identitas dan penugasan peran aparatur kedinasan.
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

          {/* Surel (Read-only anchor) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#747686]" />
              <span>Surel Kedinasan (Terkunci)</span>
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full h-10 px-3.5 rounded-lg bg-[#F8F9FB] border border-[#D9DEE7] text-[#747686] font-mono text-sm cursor-not-allowed"
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
                    name="edit-role"
                    value="petugas"
                    checked={role === 'petugas'}
                    onChange={() => setRole('petugas')}
                    className="sr-only"
                  />
                  <span className="text-xs font-semibold">Petugas Lapangan</span>
                </div>
                <span className="text-[11px] text-[#747686] mt-1">
                  Verifikasi laporan &amp; tindak lanjut aduan.
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
                    name="edit-role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                    className="sr-only"
                  />
                  <span className="text-xs font-semibold">Administrator</span>
                </div>
                <span className="text-[11px] text-[#747686] mt-1">
                  Kelola master data &amp; akses pengguna.
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
                  onChange={(e) => {
                    setInstitutionId(e.target.value);
                    setInstitutionUnitId('');
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-xs font-medium focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Pilih Instansi (OPD) --</option>
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

          {/* Nomor Telepon */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#111C2D] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0033A7]" />
              <span>Nomor Kontak / WhatsApp</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D9DEE7] text-[#111C2D] text-sm focus:border-[#0033A7] focus:ring-1 focus:ring-[#0033A7] outline-none transition-all placeholder:text-[#747686]"
            />
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
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
