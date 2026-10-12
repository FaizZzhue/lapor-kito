'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-[#D9DEE7] shadow-xl overflow-hidden p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <Trash2 size={24} aria-hidden="true" />
        </div>

        <h3 className="text-base font-bold text-[#111C2D] mb-1">
          Hapus Instansi?
        </h3>
        <p className="text-xs text-[#434654] leading-relaxed mb-4">
          Anda akan menghapus instansi <strong className="text-[#111C2D]">{institutionName}</strong> secara permanen dari sistem.
        </p>

        {unitsCount > 0 && (
          <div className="p-3 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
              <span>
                Instansi ini tercatat memiliki <strong>{unitsCount} unit kerja</strong>. Penghapusan akan ditolak demi integritas data struktural. Disarankan untuk menonaktifkan instansi daripada menghapusnya.
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-left flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 rounded-lg bg-white border border-[#D9DEE7] text-[#434654] hover:bg-[#F0F3FF] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0033A7]/30"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ya, Hapus Instansi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
