"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  X,
  RefreshCw,
  Check,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => Promise<boolean | void>;
  onSwitchToGallery: () => void;
}

type ModalStep = "confirm" | "streaming" | "preview" | "error";

export function CameraCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
  onSwitchToGallery,
}: CameraCaptureModalProps) {
  const [step, setStep] = useState<ModalStep>("confirm");
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper to stop all tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore error stopping track
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup helper
  const cleanupAll = useCallback(() => {
    stopStream();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
    setCameraError(null);
    setIsLoadingCamera(false);
    setIsSubmittingPhoto(false);
    setStep("confirm");
  }, [stopStream, previewUrl]);

  // Handle modal close
  const handleClose = useCallback(() => {
    cleanupAll();
    onClose();
  }, [cleanupAll, onClose]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmittingPhoto) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmittingPhoto, handleClose]);

  // Stop tracks on component unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Start camera stream
  const startCamera = async () => {
    setCameraError(null);
    setIsLoadingCamera(true);
    setStep("streaming");

    // 1. Check browser support and secure context
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setIsLoadingCamera(false);
      setCameraError(
        "Perangkat atau peramban Anda tidak mendukung API kamera web (getUserMedia), atau halaman diakses melalui koneksi HTTP yang tidak aman. Silakan gunakan opsi unggah dari Galeri / Berkas."
      );
      setStep("error");
      return;
    }

    // Check secure context
    if (window.isSecureContext === false && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setIsLoadingCamera(false);
      setCameraError(
        "Akses kamera memerlukan protokol koneksi HTTPS yang aman. Silakan gunakan opsi unggah dari Galeri / Berkas."
      );
      setStep("error");
      return;
    }

    try {
      // Prioritize environment (rear) camera on mobile devices
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (firstErr: unknown) {
        // Fallback to basic video constraint if ideal constraints fail
        const isConstraintError =
          firstErr instanceof DOMException &&
          (firstErr.name === "OverconstrainedError" || firstErr.name === "ConstraintNotSatisfiedError");

        if (isConstraintError) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw firstErr;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoadingCamera(false);
    } catch (err: unknown) {
      stopStream();
      setIsLoadingCamera(false);
      setStep("error");

      let errorMsg = "Terjadi kendala saat mengakses kamera perangkat.";
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            errorMsg =
              "Izin akses kamera tidak diberikan atau diblokir oleh peramban Anda. Silakan berikan izin kamera pada pengaturan peramban atau gunakan opsi unggah dari Galeri.";
            break;
          case "NotFoundError":
          case "DevicesNotFoundError":
            errorMsg =
              "Sensor atau perangkat kamera tidak ditemukan pada perangkat Anda. Silakan gunakan opsi unggah dari Galeri.";
            break;
          case "NotReadableError":
          case "TrackStartError":
            errorMsg =
              "Kamera sedang digunakan oleh aplikasi lain atau sistem mengalami hambatan. Tutup aplikasi yang memakai kamera atau unggah foto dari Galeri.";
            break;
          case "SecurityError":
            errorMsg =
              "Akses kamera diblokir oleh kebijakan keamanan peramban. Silakan unggah foto dari Galeri.";
            break;
          default:
            errorMsg = `Gagal mengaktifkan kamera (${err.name}): ${err.message}`;
            break;
        }
      } else if (err instanceof Error) {
        errorMsg = `Gagal membuka kamera: ${err.message}`;
      }

      setCameraError(errorMsg);
    }
  };

  // Capture frame from video feed
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Stop live stream immediately so camera light turns off
    stopStream();

    // Export to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Gagal memproses hasil jepretan kamera.");
          setStep("error");
          return;
        }

        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setPreviewUrl(url);
        setStep("preview");
      },
      "image/jpeg",
      0.9
    );
  };

  // Retake photo: return to stream
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
    startCamera();
  };

  // Confirm and upload photo
  const handleConfirmPhoto = async () => {
    if (!capturedBlob) return;

    setIsSubmittingPhoto(true);
    const dateFormatted = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `foto-kamera-${dateFormatted}.jpg`;
    const file = new File([capturedBlob], fileName, { type: "image/jpeg" });

    try {
      await onPhotoCaptured(file);
      handleClose();
    } catch {
      setIsSubmittingPhoto(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <Camera className="h-5 w-5" />
            </span>
            <div>
              <h3
                id="camera-modal-title"
                className="text-sm font-bold text-slate-900 leading-tight"
              >
                {step === "confirm" && "Izin Akses Kamera Perangkat"}
                {step === "streaming" && "Ambil Foto Kondisi Lapangan"}
                {step === "preview" && "Pratinjau Hasil Foto Kamera"}
                {step === "error" && "Kendala Akses Kamera"}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {step === "confirm" && "Konfirmasi sebelum kamera diaktifkan"}
                {step === "streaming" && "Arahkan kamera ke titik kerusakan"}
                {step === "preview" && "Tinjau foto sebelum dilampirkan"}
                {step === "error" && "Informasi status & alternatif berkas"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmittingPhoto}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Tutup kamera"
            title="Tutup dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* STEP 1: CONFIRMATION / PERMISSION EXPLANATION */}
        {step === "confirm" && (
          <>
            <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto">
              <p>
                LAPORKITO memerlukan akses kamera perangkat Anda untuk mengambil foto bukti kondisi fisik fasilitas publik di Kota Palembang secara langsung dan faktual.
              </p>

              <div className="space-y-2 rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 text-slate-700">
                <div className="font-semibold text-blue-950 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                  <span>Ketentuan Akses Kamera:</span>
                </div>
                <ul className="space-y-1.5 text-[11px] pl-1">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Kamera <strong>hanya aktif</strong> saat Anda membidik foto dan langsung dimatikan setelah foto diambil.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Peramban akan meminta persetujuan resmi sistem jika izin belum pernah diberikan.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      Pastikan pencahayaan cukup dan objek kerusakan fasilitas terlihat jelas.
                    </span>
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                *Jika kamera tidak tersedia atau Anda memilih tidak mengizinkan, Anda tetap dapat mengunggah foto melalui opsi galeri / berkas.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto h-9 px-4 rounded-lg border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="w-full sm:w-auto h-9 px-4 rounded-lg bg-blue-700 font-mono text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Camera className="h-3.5 w-3.5 shrink-0" />
                <span>Lanjutkan ke Kamera</span>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: ACTIVE CAMERA STREAM */}
        {step === "streaming" && (
          <div className="p-4 sm:p-5 flex flex-col items-center gap-4 bg-slate-950">
            {/* Viewfinder Wrapper */}
            <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              {isLoadingCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white text-xs font-mono bg-black/80 z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  <span>Menghubungkan ke sensor kamera...</span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Status Badge */}
              {!isLoadingCamera && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Kamera Aktif</span>
                </div>
              )}

              {/* Viewfinder Grid Guide */}
              <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3 opacity-30">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-900/80 text-white font-mono text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={isLoadingCamera}
                className="h-11 px-6 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/50 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                <span>Ambil Foto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopStream();
                  onSwitchToGallery();
                  handleClose();
                }}
                className="h-10 px-3 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 font-mono text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Alihkan ke Galeri"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Galeri</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW CAPTURED PHOTO */}
        {step === "preview" && previewUrl && (
          <div className="p-4 sm:p-5 flex flex-col items-center gap-4 bg-slate-950">
            {/* Photo Preview Container */}
            <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Pratinjau Hasil Jepretan Kamera"
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Foto Terambil</span>
              </div>
            </div>

            {/* Preview Action Buttons */}
            <div className="w-full flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isSubmittingPhoto}
                className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Ambil Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                disabled={isSubmittingPhoto}
                className="h-11 px-6 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/50 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPhoto ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses Foto...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Gunakan Foto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: ERROR / FALLBACK */}
        {step === "error" && (
          <>
            <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs">Akses Kamera Tidak Dapat Dilanjutkan</span>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {cameraError || "Terjadi kesalahan saat meminta akses ke perangkat kamera Anda."}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="font-bold text-[11px] text-slate-800">
                  Langkah Alternatif:
                </span>
                <p className="text-[11px] text-slate-600">
                  Anda tetap dapat melanjutkan pengisian laporan dengan memilih berkas foto bukti yang sudah diambil sebelumnya melalui galeri atau penyimpanan berkas perangkat Anda.
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto h-9 px-4 rounded-lg border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-center"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onSwitchToGallery();
                }}
                className="w-full sm:w-auto h-9 px-4 rounded-lg bg-blue-700 font-mono text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Pilih dari Galeri / File</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
