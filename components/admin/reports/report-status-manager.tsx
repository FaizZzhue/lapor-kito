"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  CircleCheck,
  CircleX,
  Copy,
  LoaderCircle,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  X,
  FileCheck2,
} from "lucide-react";
import { updateReportStatusAction } from "@/lib/actions/reports";
import {
  STATUS_TRANSITIONS_METADATA,
  type StatusTransitionConfig,
} from "@/lib/constants/report-status";
import { ReportStatusBadge } from "./report-status-badge";
import type { ReportStatus } from "@/types/database";

interface ReportStatusManagerProps {
  reportId: string;
  trackingCode: string;
  currentStatus: ReportStatus;
  userRole?: "admin" | "petugas";
  onStatusChange?: (
    newStatus: ReportStatus,
    newTimelineItem: {
      id: string;
      action: string;
      notes: string | null;
      actor_role: string;
      created_at: string;
    }
  ) => void;
}

export function ReportStatusManager({
  reportId,
  trackingCode,
  currentStatus: initialStatus,
  userRole = "petugas",
  onStatusChange,
}: ReportStatusManagerProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>(initialStatus);
  const [selectedTransition, setSelectedTransition] = useState<StatusTransitionConfig | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableTransitions = STATUS_TRANSITIONS_METADATA[currentStatus] || [];
  const isTerminal = ["resolved", "rejected", "duplicate"].includes(currentStatus);

  const openConfirmation = (config: StatusTransitionConfig) => {
    setSelectedTransition(config);
    setNotesInput(config.requiresReason ? "" : config.defaultNotes);
    setValidationError(null);
    setActionError(null);
  };

  const closeConfirmation = () => {
    if (isPending) return;
    setSelectedTransition(null);
    setNotesInput("");
    setValidationError(null);
    setActionError(null);
  };

  const handleConfirm = () => {
    if (!selectedTransition) return;

    if (selectedTransition.requiresReason && !notesInput.trim()) {
      setValidationError("Catatan atau alasan wajib diisi untuk tindakan ini.");
      return;
    }

    setValidationError(null);
    setActionError(null);

    startTransition(async () => {
      try {
        const result = await updateReportStatusAction({
          reportId,
          nextStatus: selectedTransition.targetStatus,
          notes: notesInput.trim() || undefined,
        });

        if (!result.success || !result.newStatus) {
          setActionError(result.error || "Gagal memperbarui status laporan");
          return;
        }

        const updatedStatus = result.newStatus;
        setCurrentStatus(updatedStatus);
        let msg = `Status laporan #${trackingCode} berhasil diubah menjadi ${selectedTransition.label}.`;
        if (result.emailSent) {
          msg += " Notifikasi email berhasil dikirim ke pelapor.";
        } else if (result.emailSent === false) {
          msg += " (Notifikasi email dilewati atau tidak terkirim).";
        }
        setSuccessMessage(msg);
        setSelectedTransition(null);

        if (onStatusChange && result.timelineId) {
          onStatusChange(updatedStatus, {
            id: result.timelineId,
            action: selectedTransition.actionTitle,
            notes: notesInput.trim() || selectedTransition.defaultNotes,
            actor_role: userRole,
            created_at: new Date().toISOString(),
          });
        }

        router.refresh();
      } catch (err: unknown) {
        setActionError(
          err instanceof Error ? err.message : "Terjadi kesalahan pada jaringan server."
        );
      }
    });
  };

  const getButtonIcon = (status: ReportStatus) => {
    switch (status) {
      case "verifying":
        return <RefreshCw size={15} aria-hidden="true" />;
      case "verified":
        return <CircleCheck size={15} aria-hidden="true" />;
      case "in_progress":
        return <LoaderCircle size={15} aria-hidden="true" />;
      case "resolved":
        return <CheckCircle2 size={15} aria-hidden="true" />;
      case "rejected":
        return <CircleX size={15} aria-hidden="true" />;
      case "duplicate":
        return <Copy size={15} aria-hidden="true" />;
      default:
        return <FileCheck2 size={15} aria-hidden="true" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 sm:p-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#F0F3FF]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] border border-[#C4D3F8] flex items-center justify-center text-[#0033A7]">
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#111C2D]">
              Tindakan Operasional & Status Laporan
            </h2>
            <p className="text-[12px] text-[#747686]">
              Kelola kemajuan tindak lanjut penanganan pengaduan secara terverifikasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#747686]">Status Saat Ini:</span>
          <ReportStatusBadge status={currentStatus} size="md" />
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-3.5 rounded-lg bg-[#EBF7F2] border border-[#2E8B57]/30 text-[#14532D] text-[13px] flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#16845B] shrink-0" aria-hidden="true" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[#14532D]/70 hover:text-[#14532D] p-1 rounded"
            aria-label="Tutup notifikasi"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Action Buttons or Terminal Banner */}
      {isTerminal ? (
        <div className="bg-[#F9F9FF] border border-[#D9DEE7] rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-[#434654] font-semibold text-[13px]">
            <ShieldCheck size={16} className="text-[#0033A7]" aria-hidden="true" />
            <span>Laporan Berada dalam Status Terminal</span>
          </div>
          <p className="text-[12px] text-[#747686] mt-1 max-w-lg mx-auto">
            Laporan ini telah mencapai tahap akhir ({currentStatus}) dan tidak menerima transisi
            status operasional lanjutan.
          </p>
        </div>
      ) : availableTransitions.length > 0 ? (
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-semibold text-[#434654] uppercase tracking-wider">
            Tindakan yang Tersedia:
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {availableTransitions.map((transition) => {
              const isDestructive = transition.variant === "destructive";
              const isWarning = transition.variant === "warning";
              const isSuccess = transition.variant === "success";

              let btnClasses =
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

              if (isDestructive) {
                btnClasses +=
                  " bg-[#BA1A1A] hover:bg-[#93000A] text-white focus-visible:ring-[#BA1A1A]/40";
              } else if (isWarning) {
                btnClasses +=
                  " bg-[#FFF4E5] hover:bg-[#FFE7C8] border border-[#F4A261] text-[#A74100] focus-visible:ring-[#F4A261]/40";
              } else if (isSuccess) {
                btnClasses +=
                  " bg-[#16845B] hover:bg-[#0E6040] text-white focus-visible:ring-[#16845B]/40";
              } else {
                btnClasses +=
                  " bg-[#0033A7] hover:bg-[#1749D2] text-white focus-visible:ring-[#0033A7]/40";
              }

              return (
                <button
                  key={transition.targetStatus}
                  type="button"
                  disabled={isPending}
                  onClick={() => openConfirmation(transition)}
                  className={btnClasses}
                >
                  {getButtonIcon(transition.targetStatus)}
                  <span>{transition.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-[#747686]">
          Tidak ada tindakan transisi status yang tersedia untuk laporan ini.
        </p>
      )}

      {/* Confirmation Modal Dialog */}
      {selectedTransition && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-white rounded-xl border border-[#D9DEE7] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#F0F3FF] border-b border-[#D9DEE7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedTransition.variant === "destructive" ||
                selectedTransition.variant === "warning" ? (
                  <AlertTriangle className="w-5 h-5 text-[#BA1A1A]" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-[#0033A7]" aria-hidden="true" />
                )}
                <h3 id="status-dialog-title" className="text-[16px] font-bold text-[#111C2D]">
                  {selectedTransition.confirmTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={isPending}
                aria-label="Tutup dialog konfirmasi"
                className="text-[#747686] hover:text-[#111C2D] p-1.5 rounded-lg hover:bg-white/60 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Transition Preview Badges */}
              <div className="bg-[#F9F9FF] p-3.5 rounded-lg border border-[#D9DEE7] flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#747686]">Status Saat Ini</span>
                  <ReportStatusBadge status={currentStatus} size="sm" />
                </div>
                <div className="text-[#0033A7] font-bold text-[18px]">→</div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[11px] font-medium text-[#747686]">Status Baru</span>
                  <ReportStatusBadge status={selectedTransition.targetStatus} size="sm" />
                </div>
              </div>

              {/* Consequence Description */}
              <div
                className={`p-3.5 rounded-lg text-[13px] leading-relaxed border ${
                  selectedTransition.variant === "destructive"
                    ? "bg-[#FFF0EF] border-[#FFDAD6] text-[#93000A]"
                    : selectedTransition.variant === "warning"
                    ? "bg-[#FFF9F0] border-[#FFE7C8] text-[#8C3B00]"
                    : "bg-[#EEF2FC] border-[#C4D3F8] text-[#0033A7]"
                }`}
              >
                <p className="font-semibold mb-0.5">Konsekuensi Operasional:</p>
                <p>{selectedTransition.confirmDescription}</p>
              </div>

              {/* Notes Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="status-notes" className="text-[13px] font-semibold text-[#111C2D]">
                  {selectedTransition.requiresReason ? (
                    <>
                      Alasan / Catatan Resmi <span className="text-[#BA1A1A]">*</span>
                    </>
                  ) : (
                    "Catatan Operasional (Opsional)"
                  )}
                </label>
                <textarea
                  id="status-notes"
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder={
                    selectedTransition.requiresReason
                      ? "Cantumkan alasan penolakan atau duplikasi secara jelas..."
                      : "Catatan tambahan untuk riwayat linimasa (opsional)..."
                  }
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#D9DEE7] bg-white text-[#111C2D] placeholder-[#747686]/60 focus:outline-none focus:ring-2 focus:ring-[#0033A7] resize-none"
                  disabled={isPending}
                />
                <span className="text-[11px] text-[#747686]">
                  Catatan ini akan dicatat ke dalam linimasa audit laporan.
                </span>
              </div>

              {/* Validation or Server Error */}
              {validationError && (
                <div className="p-3 rounded-lg bg-[#FFDAD6] text-[#93000A] text-[12px] flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
                  <span>{validationError}</span>
                </div>
              )}

              {actionError && (
                <div className="p-3 rounded-lg bg-[#FFDAD6] text-[#93000A] text-[12px] flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-[#F9F9FF] border-t border-[#D9DEE7] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-[#434654] hover:bg-[#E8EDF5] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
                  selectedTransition.variant === "destructive"
                    ? "bg-[#BA1A1A] hover:bg-[#93000A]"
                    : selectedTransition.variant === "warning"
                    ? "bg-[#D97706] hover:bg-[#B45309]"
                    : selectedTransition.variant === "success"
                    ? "bg-[#16845B] hover:bg-[#0E6040]"
                    : "bg-[#0033A7] hover:bg-[#1749D2]"
                }`}
              >
                {isPending ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} aria-hidden="true" />
                    <span>Konfirmasi Ubah Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
