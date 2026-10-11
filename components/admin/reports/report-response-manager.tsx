"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Reply,
  Send,
  Clock3,
  Building2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Loader2,
} from "lucide-react";
import { createReportResponseAction } from "@/lib/actions/responses";
import type { ResponseType } from "@/types/database";

export interface ResponseItem {
  id: string;
  responder_id: string | null;
  responder_name: string | null;
  responder_role: string | null;
  response_type: ResponseType;
  message: string;
  attachments?: unknown[] | null;
  is_public: boolean;
  created_at: string;
}

interface ReportResponseManagerProps {
  reportId: string;
  trackingCode: string;
  responses: ResponseItem[];
  reporterEmail?: string | null;
  onResponseAdded?: (newResponse: ResponseItem) => void;
}

export function ReportResponseManager({
  reportId,
  trackingCode,
  responses: initialResponses,
  reporterEmail,
  onResponseAdded,
}: ReportResponseManagerProps) {
  const router = useRouter();
  const [responseList, setResponseList] = useState<ResponseItem[]>(initialResponses);
  const [message, setMessage] = useState("");
  const [responseType, setResponseType] = useState<"official" | "update">("official");
  const [formError, setFormError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    text: string;
    emailSent: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const charCount = message.trim().length;
  const isTooShort = charCount > 0 && charCount < 5;
  const isTooLong = charCount > 2000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessInfo(null);

    const trimmed = message.trim();
    if (trimmed.length < 5) {
      setFormError("Pesan tanggapan resmi minimal 5 karakter.");
      return;
    }

    if (trimmed.length > 2000) {
      setFormError("Pesan tanggapan resmi maksimal 2000 karakter.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createReportResponseAction({
          reportId,
          message: trimmed,
          responseType,
        });

        if (!result.success || !result.responseId) {
          setFormError(result.error || "Gagal mengirimkan tanggapan resmi.");
          return;
        }

        const newRespItem: ResponseItem = {
          id: result.responseId,
          responder_id: "current-user",
          responder_name: "Petugas Operasional",
          responder_role: "petugas",
          response_type: responseType,
          message: trimmed,
          attachments: [],
          is_public: true,
          created_at: new Date().toISOString(),
        };

        setResponseList((prev) => [...prev, newRespItem]);
        setMessage("");
        setSuccessInfo({
          text: `Tanggapan resmi berhasil dikirim ke berkas #${trackingCode}.`,
          emailSent: !!result.emailSent,
        });

        if (onResponseAdded) {
          onResponseAdded(newRespItem);
        }

        router.refresh();
      } catch (err: unknown) {
        setFormError(
          err instanceof Error ? err.message : "Terjadi kesalahan sistem saat mengirim tanggapan."
        );
      }
    });
  };

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F3FF]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EBF7F2] border border-[#B5E2CD] flex items-center justify-center text-[#16845B]">
            <MessageSquare size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#111C2D]">
              Tanggapan Resmi & Riwayat Komunikasi ({responseList.length})
            </h2>
            <p className="text-[12px] text-[#747686]">
              Tindak lanjut komunikasi terpusat antara petugas instansi dan warga pelapor
            </p>
          </div>
        </div>

        {reporterEmail && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F3FF] border border-[#C4D3F8] text-[11px] text-[#0033A7] font-medium">
            <Mail size={13} aria-hidden="true" />
            <span>Notifikasi email aktif</span>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {successInfo && (
        <div className="p-3.5 rounded-lg bg-[#EBF7F2] border border-[#2E8B57]/30 text-[#14532D] text-[13px] flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-[#16845B] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="font-semibold">{successInfo.text}</p>
            {successInfo.emailSent ? (
              <p className="text-[12px] text-[#16845B]">
                Pemberitahuan email telah berhasil dikirimkan ke pelapor ({reporterEmail}).
              </p>
            ) : reporterEmail ? (
              <p className="text-[12px] text-[#747686]">
                Notifikasi email dilewati atau dalam simulasi sandbox.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="space-y-4">
        {responseList.length > 0 ? (
          <div className="space-y-3.5">
            {responseList.map((item) => {
              const isCitizen =
                item.response_type === "clarification" ||
                item.responder_id === null ||
                item.responder_role === "reporter";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border text-[13px] transition-colors ${
                    isCitizen
                      ? "bg-[#FFFDF5] border-[#F4E3B5] ml-4 sm:ml-8"
                      : "bg-[#F0F3FF] border-[#C4D3F8] mr-4 sm:mr-8"
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#D9DEE7]/60">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${
                          isCitizen ? "bg-[#D97706]" : "bg-[#0033A7]"
                        }`}
                      >
                        {isCitizen ? (
                          <Reply size={13} aria-hidden="true" />
                        ) : (
                          <Building2 size={13} aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[#111C2D]">
                          {isCitizen
                            ? "Pelapor (Warga)"
                            : item.responder_name || "Petugas Instansi"}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded uppercase ${
                            isCitizen
                              ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                              : "bg-[#DFE8FF] text-[#0033A7] border border-[#C4D3F8]"
                          }`}
                        >
                          {isCitizen
                            ? "Klarifikasi Warga"
                            : item.response_type === "update"
                            ? "Pembaruan Petugas"
                            : "Tanggapan Resmi"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#747686]">
                      <Clock3 size={12} aria-hidden="true" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Message Body */}
                  <p className="text-[#111C2D] leading-relaxed whitespace-pre-line">
                    {item.message}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-lg border border-dashed border-[#D9DEE7] bg-[#F9F9FF] text-center space-y-1.5">
            <MessageSquare size={24} className="mx-auto text-[#747686]/60" aria-hidden="true" />
            <p className="text-[13px] font-semibold text-[#434654]">
              Belum ada tanggapan resmi atau komunikasi terdaftar
            </p>
            <p className="text-[12px] text-[#747686] max-w-md mx-auto">
              Berikan tanggapan resmi di bawah ini untuk menginformasikan tindak lanjut kasus kepada
              warga pelapor.
            </p>
          </div>
        )}
      </div>

      {/* Response Creation Form */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-[#F0F3FF] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="official-message" className="text-[13px] font-bold text-[#111C2D]">
            Kirim Tanggapan Resmi Baru
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#747686]">Tipe:</span>
            <select
              value={responseType}
              onChange={(e) => setResponseType(e.target.value as "official" | "update")}
              disabled={isPending}
              className="text-[12px] font-medium px-2 py-1 rounded-md border border-[#D9DEE7] bg-white text-[#111C2D] focus:outline-none focus:ring-1 focus:ring-[#0033A7]"
            >
              <option value="official">Tanggapan Resmi (OPD)</option>
              <option value="update">Pembaruan Penanganan</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <textarea
            id="official-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isPending}
            placeholder="Tuliskan keterangan resmi, hasil peninjauan lapangan, atau tindak lanjut instansi terkait..."
            className="w-full px-3.5 py-2.5 text-[13px] rounded-lg border border-[#D9DEE7] bg-white text-[#111C2D] placeholder-[#747686]/60 focus:outline-none focus:ring-2 focus:ring-[#0033A7] resize-y"
          />
          <div className="flex items-center justify-between text-[11px] text-[#747686]">
            <span>
              Tanggapan ini akan ditampilkan di pelacakan publik warga & dicatat ke linimasa audit.
            </span>
            <span className={isTooShort || isTooLong ? "text-[#BA1A1A] font-semibold" : ""}>
              {charCount} / 2000 karakter
            </span>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[12px] flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="submit"
            disabled={isPending || charCount < 5 || isTooLong}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0033A7] hover:bg-[#1749D2] text-white text-[13px] font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0033A7]/40 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                <span>Mengirim Tanggapan...</span>
              </>
            ) : (
              <>
                <Send size={15} aria-hidden="true" />
                <span>Kirim Tanggapan Resmi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
