'use client';

import { useState } from 'react';
import { Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { deleteUnitAction } from '@/lib/actions/institutions';

interface DeleteUnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unitId: string;
  unitName: string;
}

export function DeleteUnitDialog({
  isOpen,
  onClose,
  onSuccess,
  unitId,
  unitName,
}: DeleteUnitDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await deleteUnitAction(unitId);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menghapus unit kerja');
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
          <Trash2 className="w-6 h-6 text-red-600" aria-hidden="true" />
        </div>

        <h3 className="text-base font-bold text-[#111C2D] mb-1">
          Hapus Unit Kerja?
        </h3>
        <p className="text-xs text-[#434654] leading-relaxed mb-4">
          Anda akan menghapus unit pelaksana <strong className="text-[#111C2D]">{unitName}</strong>. Tindakan ini tidak dapat dibatalkan.
        </p>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
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
                <span>Ya, Hapus Unit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
