'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { deleteInstitutionAction } from '@/lib/actions/institutions';

interface DeleteInstitutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutionId: string;
  institutionName: string;
  unitsCount?: number;
}

export function DeleteInstitutionDialog({
  isOpen,
  onClose,
  onSuccess,
  institutionId,
  institutionName,
  unitsCount = 0,
}: DeleteInstitutionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await deleteInstitutionAction(institutionId);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menghapus instansi');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan komunikasi');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-[#D9DEE7] shadow-xl overflow-hidden p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} aria-hidden="true" />
        </div>

        <h3 className="text-[17px] font-semibold text-[#111C2D] mb-1">
          Hapus Instansi?
        </h3>
        <p className="text-[13px] text-[#434654] leading-relaxed mb-4">
          Anda akan menghapus instansi <strong className="text-[#111C2D]">{institutionName}</strong>. Tindakan ini bersifat permanen.
        </p>

        {unitsCount > 0 && (
          <div className="p-3 mb-4 rounded-lg bg-[#FEF3E6] border border-[#FCD7A9] text-[#B2640A] text-[12px] text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Instansi ini tercatat memiliki <strong>{unitsCount} unit kerja</strong>. Penghapusan akan ditolak demi integritas data struktural. Disarankan untuk menon-aktifkan instansi daripada menghapusnya.
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 mb-4 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[12px] text-left flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-white border border-[#C4C5D7] text-[#434654] hover:bg-[#F0F3FF] text-[13px] font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-[#BA1A1A] hover:bg-[#93000A] text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isLoading ? 'Menghapus...' : 'Ya, Hapus Instansi'}
          </button>
        </div>
      </div>
    </div>
  );
}
