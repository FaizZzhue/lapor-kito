"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  LoaderCircle,
  X,
  FileCheck2,
  Scale,
} from "lucide-react";
import { assignReportInstitutionAction } from "@/lib/actions/reports";

export interface AvailableInstitutionItem {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
}

export interface AvailableUnitItem {
  id: string;
  code: string;
  name: string;
  institution_id: string;
}

interface ReportAssignmentManagerProps {
  reportId: string;
  trackingCode: string;
  reportTitle: string;
  currentAssignedInstitutionId: string | null;
  currentAssignedInstitutionName: string | null;
  currentAssignedUnitId: string | null;
  currentAssignedUnitName: string | null;
  assignedAt: string | null;
  recommendedInstitution: {
    id: string;
    code: string;
    name: string;
    short_name: string | null;
  } | null;
  recommendedUnit: {
    id: string;
    code: string;
    name: string;
  } | null;
  authorityRuleContext?: string | null;
  availableInstitutions: AvailableInstitutionItem[];
  availableUnits: AvailableUnitItem[];
  userRole?: "admin" | "petugas";
  onAssignmentSuccess?: (data: {
    assignedInstitutionId: string;
    assignedInstitutionName: string;
    assignedUnitId: string | null;
    assignedUnitName: string | null;
    assignedAt: string;
    timelineEntry: {
      id: string;
      action: string;
      notes: string | null;
      actor_role: string;
      created_at: string;
    };
  }) => void;
}

export function ReportAssignmentManager({
  reportId,
  trackingCode,
  reportTitle,
  currentAssignedInstitutionId,
  currentAssignedInstitutionName,
  currentAssignedUnitId,
  currentAssignedUnitName,
  assignedAt,
  recommendedInstitution,
  recommendedUnit,
  authorityRuleContext,
  availableInstitutions,
  availableUnits,
  userRole = "petugas",
  onAssignmentSuccess,
}: ReportAssignmentManagerProps) {
  const router = useRouter();
  const [assignedInstId, setAssignedInstId] = useState<string | null>(
    currentAssignedInstitutionId
  );
  const [assignedInstName, setAssignedInstName] = useState<string | null>(
    currentAssignedInstitutionName
  );
  const [assignedUnitNameState, setAssignedUnitNameState] = useState<string | null>(
    currentAssignedUnitName
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Units filtered by selected institution in modal
  const filteredUnits = useMemo(() => {
    if (!selectedInstId) return [];
    return availableUnits.filter((u) => u.institution_id === selectedInstId);
  }, [selectedInstId, availableUnits]);

  // Open modal pre-filled with either current assignment or recommended
  const openAssignmentModal = (targetInstId?: string, targetUnitId?: string) => {
    const instIdToSet =
      targetInstId ||
      assignedInstId ||
      recommendedInstitution?.id ||
      availableInstitutions[0]?.id ||
      "";

    setSelectedInstId(instIdToSet);
    setSelectedUnitId(targetUnitId !== undefined ? targetUnitId : (currentAssignedUnitId || ""));
    setNotes("");
    setActionError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isPending) return;
    setIsModalOpen(false);
    setActionError(null);
  };

  const handleConfirmAssignment = () => {
    if (!selectedInstId) {
      setActionError("Pilih instansi tujuan penugasan.");
      return;
    }

    setActionError(null);

    startTransition(async () => {
      try {
        const result = await assignReportInstitutionAction({
          reportId,
          institutionId: selectedInstId,
          unitId: selectedUnitId || null,
          notes: notes.trim() || undefined,
        });

        if (!result.success || !result.data) {
          setActionError(result.error || "Gagal menetapkan penugasan instansi.");
          return;
        }

        const data = result.data;
        setAssignedInstId(data.assignedInstitutionId);
        setAssignedInstName(data.assignedInstitutionName);
        setAssignedUnitNameState(data.assignedUnitName);
        setSuccessMessage(
          `Laporan berhasil ditugaskan ke ${data.assignedInstitutionName}.`
        );

        if (onAssignmentSuccess) {
          onAssignmentSuccess(data);
        }

        setIsModalOpen(false);
        router.refresh();

        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: unknown) {
        setActionError(
          err instanceof Error ? err.message : "Kesalahan sistem saat penugasan."
        );
      }
    });
  };

  const isAssigned = Boolean(assignedInstId);

  return (
    <div className="flex flex-col gap-3">
      {/* SUCCESS NOTIFICATION */}
      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#EDF7F2] border border-[#B5E2CD] rounded-xl text-[#16845B] text-[13px] font-medium shadow-xs animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ADMIN OPERATIONAL ASSIGNMENT BANNER */}
      {userRole === "admin" && (
        <div
          className={`p-4 rounded-xl border shadow-xs transition-all ${
            !isAssigned
              ? "bg-[#FEF3E6]/70 border-[#FCD7A9]"
              : "bg-white border-[#D9DEE7]"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  !isAssigned
                    ? "bg-[#FEF3E6] text-[#B2640A] border border-[#FCD7A9]"
                    : "bg-[#EEF2FC] text-[#0033A7] border border-[#C4D3F8]"
                }`}
              >
                <Building2 size={18} aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#747686]">
                    Penugasan Instansi (OPD)
                  </span>
                  {!isAssigned ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3E6] text-[#B2640A] border border-[#FCD7A9]">
                      Belum Ditugaskan
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#16845B] border border-[#B5E2CD]">
                      Ditugaskan Resmi
                    </span>
                  )}
                </div>

                {!isAssigned ? (
                  <p className="text-[13px] text-[#434654] mt-0.5 leading-snug">
                    Laporan ini belum dialokasikan ke OPD. Petugas instansi belum dapat melihat atau menangani laporan sebelum Admin menetapkan penugasan.
                  </p>
                ) : (
                  <div>
                    <p className="text-[14px] font-bold text-[#111C2D] mt-0.5">
                      {assignedInstName}
                      {assignedUnitNameState && (
                        <span className="text-[12px] font-normal text-[#747686] ml-1.5">
                          ({assignedUnitNameState})
                        </span>
                      )}
                    </p>
                    {assignedAt && (
                      <p className="text-[11px] text-[#747686] mt-0.5">
                        Ditugaskan pada: {new Date(assignedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS FOR ADMIN */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              {!isAssigned && recommendedInstitution && (
                <button
                  type="button"
                  onClick={() =>
                    openAssignmentModal(
                      recommendedInstitution.id,
                      recommendedUnit?.id || ""
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0033A7] hover:bg-[#1749D2] text-white text-[12px] font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>Tugaskan ke {recommendedInstitution.short_name || recommendedInstitution.code}</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              )}

              <button
                type="button"
                onClick={() => openAssignmentModal()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border shadow-xs cursor-pointer ${
                  !isAssigned
                    ? "bg-white hover:bg-[#F9F9FF] text-[#111C2D] border-[#D9DEE7]"
                    : "bg-[#F0F3FF] hover:bg-[#DFE8FF] text-[#0033A7] border-[#C4D3F8]"
                }`}
              >
                <span>{!isAssigned ? "Pilih Instansi..." : "Disposisi Ulang / Ubah Instansi"}</span>
              </button>
            </div>
          </div>

          {/* AUTHORITY RULE RECOMMENDATION NOTICE */}
          {!isAssigned && recommendedInstitution && (
            <div className="mt-3 pt-3 border-t border-[#FCD7A9]/60 flex items-start gap-2 text-[12px] text-[#B2640A]">
              <Scale size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold">Rekomendasi Matriks Kewenangan Resmi: </span>
                <span>{recommendedInstitution.name}</span>
                {authorityRuleContext && (
                  <span className="text-[#434654] block mt-0.5">
                    Dasar: {authorityRuleContext}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ASSIGNMENT MODAL / DIALOG */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#D9DEE7] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#F0F3FF] border-b border-[#D9DEE7] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0033A7] text-white flex items-center justify-center shadow-xs">
                  <FileCheck2 size={18} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#111C2D]">
                    {isAssigned ? "Disposisi Ulang Instansi" : "Penugasan Resmi Instansi"}
                  </h3>
                  <p className="font-mono text-[11px] text-[#0033A7] font-semibold">
                    {trackingCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                aria-label="Tutup formulir penugasan"
                className="p-1 rounded-lg text-[#747686] hover:text-[#111C2D] hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              {/* Report title reference */}
              <div className="p-3 bg-[#F9F9FF] rounded-lg border border-[#D9DEE7]/70 text-[12px]">
                <span className="text-[#747686] block">Judul Laporan:</span>
                <span className="font-semibold text-[#111C2D] block mt-0.5">
                  {reportTitle}
                </span>
              </div>

              {/* Error display */}
              {actionError && (
                <div className="p-3 bg-[#FFDAD6] border border-[#FFB4AB] rounded-lg text-[#BA1A1A] text-[12px] flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Institution Select */}
              <div>
                <label
                  htmlFor="assign-inst-select"
                  className="block text-[12px] font-bold text-[#111C2D] uppercase tracking-wider mb-1.5"
                >
                  Instansi Penanggung Jawab (OPD) <span className="text-[#BA1A1A]">*</span>
                </label>
                <select
                  id="assign-inst-select"
                  value={selectedInstId}
                  onChange={(e) => {
                    setSelectedInstId(e.target.value);
                    setSelectedUnitId("");
                  }}
                  disabled={isPending}
                  className="w-full py-2.5 px-3 text-[13px] bg-white border border-[#D9DEE7] rounded-lg text-[#111C2D] focus:outline-none focus:ring-2 focus:ring-[#1749D2]/30 focus:border-[#1749D2] transition-colors cursor-pointer"
                >
                  <option value="">-- Pilih Instansi (OPD) --</option>
                  {availableInstitutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.code} - {inst.name}
                    </option>
                  ))}
                </select>
                {recommendedInstitution && (
                  <p className="text-[11px] text-[#747686] mt-1">
                    Rekomendasi sistem:{" "}
                    <button
                      type="button"
                      onClick={() => setSelectedInstId(recommendedInstitution.id)}
                      className="font-semibold text-[#0033A7] hover:underline"
                    >
                      {recommendedInstitution.name} ({recommendedInstitution.code})
                    </button>
                  </p>
                )}
              </div>

              {/* Unit Select (if institution has units) */}
              {filteredUnits.length > 0 && (
                <div>
                  <label
                    htmlFor="assign-unit-select"
                    className="block text-[12px] font-bold text-[#111C2D] uppercase tracking-wider mb-1.5"
                  >
                    Unit Pelaksana Teknis (UPT / Bidang) <span className="text-[#747686] font-normal">(Opsional)</span>
                  </label>
                  <select
                    id="assign-unit-select"
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    disabled={isPending}
                    className="w-full py-2.5 px-3 text-[13px] bg-white border border-[#D9DEE7] rounded-lg text-[#111C2D] focus:outline-none focus:ring-2 focus:ring-[#1749D2]/30 focus:border-[#1749D2] transition-colors cursor-pointer"
                  >
                    <option value="">-- Seluruh Unit / Induk Instansi --</option>
                    {filteredUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes Input */}
              <div>
                <label
                  htmlFor="assign-notes-input"
                  className="block text-[12px] font-bold text-[#111C2D] uppercase tracking-wider mb-1.5"
                >
                  Catatan Penugasan / Disposisi <span className="text-[#747686] font-normal">(Opsional)</span>
                </label>
                <textarea
                  id="assign-notes-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isPending}
                  placeholder="Contoh: Diteruskan ke DPUPR untuk verifikasi teknis dan penanganan kerusakan fisik di lapangan."
                  className="w-full p-3 text-[13px] bg-white border border-[#D9DEE7] rounded-lg text-[#111C2D] focus:outline-none focus:ring-2 focus:ring-[#1749D2]/30 focus:border-[#1749D2] transition-colors resize-none placeholder:text-[#747686]/60"
                />
              </div>

              {/* Informational Security Notice */}
              <div className="p-3 bg-[#EEF2FC]/70 border border-[#C4D3F8] rounded-lg text-[11px] text-[#0033A7] leading-relaxed">
                <span className="font-bold">Keamanan & Pemisahan Wewenang: </span>
                Setelah penugasan dikonfirmasi, seluruh akun Petugas dari instansi yang dipilih akan diberikan hak akses operasional untuk memverifikasi, menindaklanjuti, dan membalas laporan ini.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#F9F9FF] border-t border-[#D9DEE7] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="px-4 py-2 rounded-lg border border-[#D9DEE7] bg-white hover:bg-[#F0F3FF] text-[#434654] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={isPending || !selectedInstId}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0033A7] hover:bg-[#1749D2] disabled:bg-[#D9DEE7] disabled:text-[#747686] text-white text-[13px] font-semibold transition-colors shadow-xs cursor-pointer"
              >
                {isPending && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
                <span>{isAssigned ? "Simpan Perubahan Penugasan" : "Konfirmasi Penugasan Resmi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
