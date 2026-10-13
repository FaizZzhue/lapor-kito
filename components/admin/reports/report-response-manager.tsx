"use client";

import { useState, useRef, useTransition } from "react";
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
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  Maximize2,
  X,
  FileImage,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { createReportResponseAction } from "@/lib/actions/responses";
import { uploadFieldDocumentationAction } from "@/lib/actions/reports";
import { CameraCaptureModal } from "@/components/lapor/camera-capture-modal";
import type { ResponseType, ReportStatus } from "@/types/database";
import type { DocumentationAttachmentType } from "@/lib/validators/tanggapan";

export interface ResponseItem {
  id: string;
  responder_id: string | null;
  responder_name: string | null;
  responder_role: string | null;
  response_type: ResponseType;
  message: string;
  attachments?: DocumentationAttachmentType[] | unknown[] | null;
  is_public: boolean;
  created_at: string;
}

interface PendingPhotoItem {
  id: string;
  file?: File;
  previewUrl: string;
  caption: string;
  isUploading: boolean;
  uploadError?: string | null;
  uploadedAttachment?: DocumentationAttachmentType;
}

interface ReportResponseManagerProps {
  reportId: string;
  trackingCode: string;
  currentStatus?: ReportStatus;
  responses: ResponseItem[];
  reporterEmail?: string | null;
  onResponseAdded?: (newResponse: ResponseItem) => void;
  onStatusUpdated?: (newStatus: ReportStatus) => void;
}

export function ReportResponseManager({
  reportId,
  trackingCode,
  currentStatus = "in_progress",
  responses: initialResponses,
  reporterEmail,
  onResponseAdded,
  onStatusUpdated,
}: ReportResponseManagerProps) {
  const router = useRouter();
  const [responseList, setResponseList] = useState<ResponseItem[]>(initialResponses);
  const [message, setMessage] = useState("");
  const [responseType, setResponseType] = useState<"official" | "update">("official");
  const [documentationType, setDocumentationType] = useState<
    "progress" | "completion" | "investigation"
  >("progress");
  const [nextStatus, setNextStatus] = useState<string>("keep");

  // Pending documentation photos
  const [photos, setPhotos] = useState<PendingPhotoItem[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [replacingPhotoId, setReplacingPhotoId] = useState<string | null>(null);

  // Lightbox preview modal
  const [previewImage, setPreviewImage] = useState<{ url: string; caption?: string } | null>(null);

  // Submission state
  const [formError, setFormError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    text: string;
    emailSent: boolean;
    photoCount: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const charCount = message.trim().length;
  const isTooShort = charCount > 0 && charCount < 5;
  const isTooLong = charCount > 2000;
  const isAnyPhotoUploading = photos.some((p) => p.isUploading);

  // Helper to process and upload a single file
  const handleUploadFile = async (file: File, targetId?: string) => {
    // Basic client validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setFormError("Format gambar tidak didukung. Harap gunakan format JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Ukuran gambar maksimal 10MB per berkas.");
      return;
    }

    const photoId = targetId || `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const previewUrl = URL.createObjectURL(file);

    if (targetId) {
      // Replace existing photo
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === targetId
            ? {
                ...p,
                file,
                previewUrl,
                isUploading: true,
                uploadError: null,
                uploadedAttachment: undefined,
              }
            : p
        )
      );
    } else {
      // Add new photo
      setPhotos((prev) => [
        ...prev,
        {
          id: photoId,
          file,
          previewUrl,
          caption: "",
          isUploading: true,
          uploadError: null,
        },
      ]);
    }

    try {
      const formData = new FormData();
      formData.append("reportId", reportId);
      formData.append("file", file);

      const res = await uploadFieldDocumentationAction(formData);

      if (!res.success || !res.fileUrl || !res.storagePath) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? {
                  ...p,
                  isUploading: false,
                  uploadError: res.error || "Gagal mengunggah gambar ke cloud.",
                }
              : p
          )
        );
        return;
      }

      const attachment: DocumentationAttachmentType = {
        fileUrl: res.fileUrl,
        storagePath: res.storagePath,
        fileName: res.fileName,
        fileSize: res.fileSize,
        fileType: res.fileType,
        caption: "",
      };

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                isUploading: false,
                uploadedAttachment: attachment,
                uploadError: null,
              }
            : p
        )
      );
    } catch (err: unknown) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                isUploading: false,
                uploadError:
                  err instanceof Error ? err.message : "Kesalahan server saat mengunggah foto.",
              }
            : p
        )
      );
    }
  };

  // Multiple files selected from gallery
  const handleGalleryFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);
    e.target.value = "";

    // Upload each selected file
    selectedFiles.forEach((file) => {
      handleUploadFile(file);
    });
  };

  // Single file captured from native camera input
  const handleCameraFileCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = "";
    handleUploadFile(file);
  };

  // Replacement file selected
  const handleReplaceFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (!e.target.files || e.target.files.length === 0 || !replacingPhotoId) return;
    const file = e.target.files[0];
    e.target.value = "";
    handleUploadFile(file, replacingPhotoId);
    setReplacingPhotoId(null);
  };

  // Photo captured from webcam modal
  const handleCameraModalCaptured = async (file: File) => {
    setFormError(null);
    await handleUploadFile(file);
    setIsCameraModalOpen(false);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered;
    });
  };

  const handleUpdateCaption = (id: string, captionText: string) => {
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedAtt = p.uploadedAttachment
            ? { ...p.uploadedAttachment, caption: captionText }
            : undefined;
          return { ...p, caption: captionText, uploadedAttachment: updatedAtt };
        }
        return p;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessInfo(null);

    const trimmed = message.trim();
    if (trimmed.length < 5) {
      setFormError("Pesan tindak lanjut / keterangan resmi minimal 5 karakter.");
      return;
    }

    if (trimmed.length > 2000) {
      setFormError("Pesan tindak lanjut maksimal 2000 karakter.");
      return;
    }

    if (isAnyPhotoUploading) {
      setFormError("Harap tunggu hingga seluruh foto dokumentasi selesai diunggah.");
      return;
    }

    const hasFailedPhoto = photos.some((p) => p.uploadError);
    if (hasFailedPhoto) {
      setFormError("Terdapat foto yang gagal diunggah. Hapus atau ganti foto tersebut sebelum menyimpan.");
      return;
    }

    const targetStatusParam =
      nextStatus !== "keep"
        ? (nextStatus as "in_progress" | "resolved")
        : undefined;

    // Strict validation: if marking resolved or completion type, must have at least 1 photo!
    const effectiveCompletion =
      targetStatusParam === "resolved" || documentationType === "completion";
    const uploadedAttachments: DocumentationAttachmentType[] = photos
      .map((p) => {
        if (p.uploadedAttachment) {
          return {
            ...p.uploadedAttachment,
            caption: p.caption.trim() || undefined,
          };
        }
        return null;
      })
      .filter(Boolean) as DocumentationAttachmentType[];

    if (effectiveCompletion && uploadedAttachments.length === 0) {
      setFormError(
        "Dokumentasi foto hasil akhir lapangan wajib dilampirkan untuk menyelesaikan laporan."
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await createReportResponseAction({
          reportId,
          message: trimmed,
          responseType,
          documentationType,
          attachments: uploadedAttachments,
          nextStatus: targetStatusParam,
        });

        if (!result.success || !result.responseId) {
          setFormError(result.error || "Gagal menyimpan tanggapan dan dokumentasi resmi.");
          return;
        }

        const newRespItem: ResponseItem = {
          id: result.responseId,
          responder_id: "current-user",
          responder_name: "Petugas Operasional",
          responder_role: "petugas",
          response_type: responseType,
          message: trimmed,
          attachments: uploadedAttachments,
          is_public: true,
          created_at: new Date().toISOString(),
        };

        setResponseList((prev) => [...prev, newRespItem]);
        setMessage("");
        setPhotos([]);
        setNextStatus("keep");
        setSuccessInfo({
          text: `Dokumentasi dan tanggapan resmi berhasil disimpan untuk laporan #${trackingCode}.`,
          emailSent: !!result.emailSent,
          photoCount: uploadedAttachments.length,
        });

        if (onResponseAdded) {
          onResponseAdded(newRespItem);
        }

        if (result.newStatus && onStatusUpdated) {
          onStatusUpdated(result.newStatus);
        }

        router.refresh();
      } catch (err: unknown) {
        setFormError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan sistem saat menyimpan dokumentasi tindak lanjut."
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

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-[#D9DEE7] shadow-sm p-5 sm:p-6 space-y-6">
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleCameraFileCaptured}
        className="hidden"
        aria-hidden="true"
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleGalleryFilesSelected}
        className="hidden"
        aria-hidden="true"
      />
      <input
        type="file"
        ref={replaceInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleReplaceFileSelected}
        className="hidden"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F3FF]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EBF7F2] border border-[#B5E2CD] flex items-center justify-center text-[#16845B]">
            <MessageSquare size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#111C2D]">
              Tindak Lanjut & Tanggapan Resmi Instansi ({responseList.length})
            </h2>
            <p className="text-[12px] text-[#747686]">
              Dokumentasikan bukti penanganan lapangan dan sampaikan perkembangan resmi kepada warga
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
        <div className="p-3.5 rounded-lg bg-[#EBF7F2] border border-[#2E8B57]/30 text-[#14532D] text-[13px] flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-[#16845B] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="font-semibold">{successInfo.text}</p>
            {successInfo.photoCount > 0 && (
              <p className="text-[12px] text-[#16845B]">
                {successInfo.photoCount} foto bukti lapangan berhasil tersimpan di cloud storage.
              </p>
            )}
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

      {/* Existing Conversation & Documentation Thread */}
      <div className="space-y-4">
        {responseList.length > 0 ? (
          <div className="space-y-3.5">
            {responseList.map((item) => {
              const isCitizen =
                item.response_type === "clarification" ||
                item.responder_id === null ||
                item.responder_role === "reporter";

              const attachmentsList = (Array.isArray(item.attachments)
                ? item.attachments
                : []) as DocumentationAttachmentType[];

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
                        {attachmentsList.length > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-[#EBF7F2] text-[#16845B] border border-[#B5E2CD] flex items-center gap-1">
                            <Camera size={11} aria-hidden="true" />
                            <span>{attachmentsList.length} Foto Lapangan</span>
                          </span>
                        )}
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

                  {/* Attachments Gallery */}
                  {attachmentsList.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#D9DEE7]/70">
                      <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block mb-2">
                        Foto Bukti Tindak Lanjut:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {attachmentsList.map((att, attIdx) => (
                          <div
                            key={att.storagePath || attIdx}
                            className="relative aspect-video rounded-lg overflow-hidden border border-[#D9DEE7] bg-white group shadow-2xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.fileUrl}
                              alt={att.caption || `Foto bukti lapangan ${attIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImage({
                                  url: att.fileUrl,
                                  caption: att.caption || `Foto Tindak Lanjut #${attIdx + 1}`,
                                })
                              }
                              aria-label={`Perbesar foto tindak lanjut ${attIdx + 1}`}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-medium text-[11px] gap-1"
                            >
                              <Maximize2 size={14} aria-hidden="true" />
                              <span>Lihat</span>
                            </button>
                            {att.caption && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1.5 py-0.5 text-[10px] text-white truncate">
                                {att.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-lg border border-dashed border-[#D9DEE7] bg-[#F9F9FF] text-center space-y-1.5">
            <MessageSquare size={24} className="mx-auto text-[#747686]/60" aria-hidden="true" />
            <p className="text-[13px] font-semibold text-[#434654]">
              Belum ada riwayat tindak lanjut lapangan atau tanggapan resmi
            </p>
            <p className="text-[12px] text-[#747686] max-w-md mx-auto">
              Gunakan formulir dokumentasi di bawah untuk mengunggah foto lapangan dan mencatat keterangan resmi instansi penanganan.
            </p>
          </div>
        )}
      </div>

      {/* Main Response & Field Documentation Form */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-[#F0F3FF] space-y-5">
        {/* SECTION 2: DOKUMENTASI TINDAK LANJUT LAPANGAN */}
        <div className="p-4 sm:p-5 rounded-xl border border-[#0033A7]/20 bg-[#F9F9FF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#D9DEE7]/70">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-[#0033A7]" aria-hidden="true" />
              <h3 className="text-[14px] font-bold text-[#111C2D]">
                Dokumentasi Tindak Lanjut Lapangan
              </h3>
            </div>
            <span className="text-[11px] text-[#747686]">
              {photos.length} foto terpilih (maks. 10MB per foto)
            </span>
          </div>

          {/* Action buttons: Ambil Foto (Kamera) & Unggah Foto (Galeri) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Native Mobile Camera Trigger */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0033A7] hover:bg-[#1749D2] text-white text-[12px] font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Camera size={15} aria-hidden="true" />
              <span>Ambil Foto</span>
            </button>

            {/* Optional Webcam Dialog (Browser getUserMedia) */}
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              disabled={isPending}
              title="Buka kamera browser webcam laptop/PC"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0033A7] bg-white hover:bg-[#EEF2FC] text-[#0033A7] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>Kamera Peramban</span>
            </button>

            {/* Gallery / File Picker */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D9DEE7] bg-white hover:bg-[#F0F3FF] text-[#111C2D] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload size={15} aria-hidden="true" />
              <span>Unggah Foto</span>
            </button>

            {/* Documentation Stage Selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-medium text-[#747686]">Tahapan:</span>
              <select
                value={documentationType}
                onChange={(e) =>
                  setDocumentationType(
                    e.target.value as "progress" | "completion" | "investigation"
                  )
                }
                disabled={isPending}
                className="text-[11px] font-semibold px-2 py-1.5 rounded-md border border-[#D9DEE7] bg-white text-[#111C2D] focus:outline-none focus:ring-1 focus:ring-[#0033A7]"
              >
                <option value="progress">Pekerjaan Lapangan (Progres)</option>
                <option value="investigation">Pemeriksaan Lokasi</option>
                <option value="completion">Hasil Akhir (Penyelesaian)</option>
              </select>
            </div>
          </div>

          {/* Photos Preview Grid */}
          {photos.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#747686] uppercase tracking-wider block">
                Pratinjau Foto Sebelum Dikirim:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border overflow-hidden bg-white flex flex-col shadow-2xs transition-colors ${
                      item.uploadError
                        ? "border-[#BA1A1A] bg-[#FFF0EF]"
                        : "border-[#D9DEE7]"
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative aspect-video bg-[#EEF2FC] flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={`Pratinjau foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Upload Loading Spinner */}
                      {item.isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white text-[11px]">
                          <Loader2 size={18} className="animate-spin text-[#6EA4FF]" />
                          <span>Mengunggah...</span>
                        </div>
                      )}

                      {/* Error State */}
                      {item.uploadError && (
                        <div className="absolute inset-0 bg-[#BA1A1A]/80 p-2 flex flex-col items-center justify-center text-center text-white text-[11px]">
                          <AlertCircle size={18} className="mb-1" />
                          <span className="line-clamp-2">{item.uploadError}</span>
                        </div>
                      )}

                      {/* Maximize Button */}
                      {!item.isUploading && !item.uploadError && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              url: item.previewUrl,
                              caption: item.caption || `Foto Dokumentasi ${idx + 1}`,
                            })
                          }
                          aria-label={`Perbesar foto ${idx + 1}`}
                          className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/50 hover:bg-black/80 text-white transition-colors"
                        >
                          <Maximize2 size={12} />
                        </button>
                      )}

                      {/* Status indicator pill */}
                      {item.uploadedAttachment && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#16845B] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                          <CheckCircle2 size={10} />
                          <span>Tersimpan</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-2.5 flex flex-col gap-2">
                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) => handleUpdateCaption(item.id, e.target.value)}
                        placeholder="Keterangan foto (opsional)..."
                        disabled={isPending || item.isUploading}
                        className="w-full px-2 py-1 text-[11px] rounded border border-[#D9DEE7] bg-[#F9F9FF] text-[#111C2D] placeholder-[#747686]/60 focus:outline-none focus:ring-1 focus:ring-[#0033A7]"
                      />

                      <div className="flex items-center justify-between text-[11px] text-[#747686] pt-1 border-t border-[#D9DEE7]/50">
                        <span>{formatBytes(item.file?.size)}</span>
                        <div className="flex items-center gap-1.5">
                          {/* Replace Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingPhotoId(item.id);
                              replaceInputRef.current?.click();
                            }}
                            disabled={isPending || item.isUploading}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#D9DEE7] hover:bg-[#F0F3FF] text-[#0033A7] text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <RefreshCw size={11} />
                            <span>Ganti</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(item.id)}
                            disabled={isPending || item.isUploading}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#FFDAD6] hover:bg-[#FFF0EF] text-[#BA1A1A] text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-[#D9DEE7] bg-white text-center space-y-1">
              <FileImage size={20} className="mx-auto text-[#747686]/60" aria-hidden="true" />
              <p className="text-[12px] font-medium text-[#434654]">
                Belum ada foto dokumentasi yang dipilih
              </p>
              <p className="text-[11px] text-[#747686]">
                Tekan tombol &quot;Ambil Foto&quot; untuk mengaktifkan kamera atau &quot;Unggah Foto&quot; untuk memilih berkas gambar.
              </p>
            </div>
          )}
        </div>

        {/* Message Notes & Status Options */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="official-message" className="text-[13px] font-bold text-[#111C2D]">
              Catatan & Keterangan Tindak Lanjut Resmi <span className="text-[#BA1A1A]">*</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
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

              {/* Status synchronization select */}
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-[#747686]">Sinkron Status:</span>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  disabled={isPending}
                  className="text-[12px] font-medium px-2 py-1 rounded-md border border-[#D9DEE7] bg-white text-[#111C2D] focus:outline-none focus:ring-1 focus:ring-[#0033A7]"
                >
                  <option value="keep">Tetap ({currentStatus})</option>
                  {currentStatus !== "in_progress" && (
                    <option value="in_progress">Ubah ke: Dalam Proses</option>
                  )}
                  {currentStatus !== "resolved" && (
                    <option value="resolved">Ubah ke: Selesai</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <textarea
              id="official-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPending}
              placeholder="Tuliskan catatan tindak lanjut, hasil pemeriksaan, atau pekerjaan yang telah dilaksanakan oleh instansi terkait..."
              className="w-full px-3.5 py-2.5 text-[13px] rounded-lg border border-[#D9DEE7] bg-white text-[#111C2D] placeholder-[#747686]/60 focus:outline-none focus:ring-2 focus:ring-[#0033A7] resize-y"
            />
            <div className="flex items-center justify-between text-[11px] text-[#747686]">
              <span>
                Keterangan ini akan tampil di pelacakan publik warga & tercatat permanen di linimasa operasional.
              </span>
              <span className={isTooShort || isTooLong ? "text-[#BA1A1A] font-semibold" : ""}>
                {charCount} / 2000 karakter
              </span>
            </div>
          </div>
        </div>

        {/* Notice for Completion requirement */}
        {(nextStatus === "resolved" || documentationType === "completion") && (
          <div className="p-3 rounded-lg bg-[#EDF7F2] border border-[#B5E2CD] text-[#16845B] text-[12px] flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>
              <strong>Perhatian:</strong> Penyelesaian laporan mewajibkan foto bukti hasil akhir penanganan yang jelas.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {formError && (
          <div className="p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#93000A] text-[12px] flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="submit"
            disabled={
              isPending ||
              charCount < 5 ||
              isTooLong ||
              isAnyPhotoUploading ||
              ((nextStatus === "resolved" || documentationType === "completion") &&
                photos.length === 0)
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0033A7] hover:bg-[#1749D2] text-white text-[13px] font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0033A7]/40 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                <span>Menyimpan Dokumentasi...</span>
              </>
            ) : (
              <>
                <Send size={15} aria-hidden="true" />
                <span>Simpan Tindak Lanjut & Dokumentasi</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal: Camera Capture Modal for Direct Browser Webcam */}
      {isCameraModalOpen && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onPhotoCaptured={handleCameraModalCaptured}
          onSwitchToGallery={() => {
            setIsCameraModalOpen(false);
            galleryInputRef.current?.click();
          }}
        />
      )}

      {/* Modal: Image Lightbox Preview */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#111C2D] text-white flex items-center justify-between">
              <span className="text-[13px] font-medium truncate max-w-lg">
                {previewImage.caption || "Pratinjau Foto Dokumentasi Lapangan"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                aria-label="Tutup pratinjau foto"
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black/90 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.caption || "Pratinjau foto"}
                className="max-h-[80vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
