"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Send,
  Loader2,
  Trash2,
  Info,
  Navigation,
  RefreshCw,
} from "lucide-react";
import {
  analyzeReportAction,
  uploadEvidenceAction,
  submitReportAction,
  reverseGeocodeAction,
  type MasterDataResult,
} from "@/lib/actions/reports";
import type { AITriageResult } from "@/types/ai";
import type { CreateReportSchemaType } from "@/lib/validators/report";

interface ReportFormProps {
  initialMasterData: MasterDataResult;
}

export function ReportForm({ initialMasterData }: ReportFormProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const [kelurahanId, setKelurahanId] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");

  // GPS & Geolocation State
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [detectedRoad, setDetectedRoad] = useState<string | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Ref to track addressDetail to avoid race condition when reverse geocoding completes
  const addressDetailRef = useRef(addressDetail);

  // Evidence state
  const [evidenceFiles, setEvidenceFiles] = useState<
    Array<{
      fileUrl: string;
      fileType: string;
      fileSize: number;
      storagePath: string;
      caption?: string;
    }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AITriageResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState(true);

  // Submission state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Kelurahan by selected Kecamatan
  const availableKelurahan = useMemo(() => {
    if (!kecamatanId) return [];
    return initialMasterData.kelurahan.filter((k) => k.kecamatan_id === kecamatanId);
  }, [kecamatanId, initialMasterData.kelurahan]);

  // Selected Category Object
  const selectedCategory = useMemo(() => {
    return initialMasterData.categories.find((c) => c.id === categoryId);
  }, [categoryId, initialMasterData.categories]);

  // Robust Geolocation & Reverse Geocoding Detector
  const handleDetectLocation = () => {
    setGpsError(null);
    setDetectedRoad(null);
    setGeocodingError(null);

    if (!navigator.geolocation) {
      setGpsError("Perangkat atau peramban Anda tidak mendukung API geolokasi otomatis. Silakan masukkan alamat patokan secara manual.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(accuracy);
        setIsLocating(false);

        // Reverse geocoding to resolve street name and administrative area
        setIsResolvingAddress(true);
        try {
          const res = await reverseGeocodeAction(lat, lng);
          setIsResolvingAddress(false);

          if (res.success) {
            if (res.road) {
              setDetectedRoad(res.road);
              // Jangan menimpa jika kolom alamat sudah diisi manual oleh pengguna
              if (!addressDetailRef.current.trim()) {
                setAddressDetail(res.road);
                addressDetailRef.current = res.road;
              }
            } else {
              setGeocodingError("Nama jalan tidak ditemukan pada peta di titik koordinat ini. Anda dapat melengkapi alamat patokan secara manual.");
            }

            // Auto-suggest kecamatan & kelurahan if not yet selected by user
            if (res.kecamatanMatch && !kecamatanId) {
              setKecamatanId(res.kecamatanMatch.id);
              if (res.kelurahanMatch && !kelurahanId) {
                setKelurahanId(res.kelurahanMatch.id);
              }
            }
          } else {
            setGeocodingError(res.error || "Resolusi alamat otomatis tidak berhasil. Silakan isi alamat secara manual.");
          }
        } catch {
          setIsResolvingAddress(false);
          setGeocodingError("Kendala teknis saat menghubungi layanan reverse geocoding. Alamat manual dapat diisikan pada kolom alamat.");
        }
      },
      (err) => {
        setIsLocating(false);
        setIsResolvingAddress(false);
        let errorMsg = `Gagal mendeteksi lokasi GPS: ${err.message}`;
        if (err.code === 1) {
          // PERMISSION_DENIED
          errorMsg = "Izin akses lokasi ditolak oleh peramban. Silakan aktifkan izin lokasi di pengaturan browser Anda, atau isi alamat patokan secara manual di bawah.";
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          errorMsg = "Sinyal GPS atau informasi lokasi tidak tersedia pada perangkat. Silakan isi alamat secara manual.";
        } else if (err.code === 3) {
          // TIMEOUT
          errorMsg = "Waktu pencarian sinyal lokasi GPS habis (timeout). Silakan coba lagi atau isi alamat manual.";
        }
        setGpsError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Client-side file type validation
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Format berkas harus JPG, PNG, atau WebP.");
      e.target.value = "";
      return;
    }

    // Client-side file size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran foto maksimal 10 MB per berkas.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadEvidenceAction(formData);
    setIsUploading(false);
    e.target.value = "";

    if (res.success && res.fileUrl && res.storagePath && res.fileType && res.fileSize) {
      setEvidenceFiles([
        ...evidenceFiles,
        {
          fileUrl: res.fileUrl,
          fileType: res.fileType,
          fileSize: res.fileSize,
          storagePath: res.storagePath,
          caption: file.name,
        },
      ]);
    } else {
      setUploadError(res.error || "Gagal mengunggah foto bukti.");
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  // Trigger AI Analysis
  const handleTriggerAnalysis = async () => {
    if (description.trim().length < 15) {
      setFormError("Tuliskan deskripsi masalah minimal 15 karakter sebelum meminta analisis AI.");
      return;
    }

    setFormError(null);
    setAiError(null);
    setIsAnalyzing(true);

    const selectedKec = initialMasterData.kecamatan.find((k) => k.id === kecamatanId);
    const selectedKel = initialMasterData.kelurahan.find((k) => k.id === kelurahanId);

    const res = await analyzeReportAction({
      title: title.trim() || description.slice(0, 50),
      description: description.trim(),
      categoryName: selectedCategory?.name_id,
      districtName: selectedKec?.name,
      subdistrictName: selectedKel?.name,
      addressDetail: addressDetail.trim(),
      evidenceUrls: evidenceFiles.map((f) => f.fileUrl),
      availableCategories: initialMasterData.categories.map((c) => ({
        slug: c.slug,
        name: c.name_id,
      })),
      availableAuthorities: initialMasterData.authorities ?? [],
    });

    setIsAnalyzing(false);
    setAiConfigured(res.isConfigured);

    if (res.success && res.triage) {
      setAiResult(res.triage);
      // Auto-suggest category if not set
      if (!categoryId && res.triage.categorySlug) {
        const matched = initialMasterData.categories.find(
          (c) => c.slug.toLowerCase() === res.triage?.categorySlug.toLowerCase()
        );
        if (matched) setCategoryId(matched.id);
      }
    } else {
      setAiError(res.error || "Analisis AI tidak dapat diselesaikan.");
    }
  };

  // Submit Final Report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic UX checks
    if (!title.trim() || title.length < 5) {
      setFormError("Judul laporan minimal 5 karakter.");
      return;
    }
    if (!description.trim() || description.length < 20) {
      setFormError("Uraian kondisi lapangan minimal 20 karakter agar laporan jelas.");
      return;
    }
    if (!categoryId) {
      setFormError("Silakan pilih kategori laporan yang sesuai.");
      return;
    }
    if (!kecamatanId) {
      setFormError("Silakan pilih Kecamatan di Kota Palembang.");
      return;
    }
    if (!kelurahanId) {
      setFormError("Silakan pilih Kelurahan.");
      return;
    }
    if (!addressDetail.trim() || addressDetail.length < 5) {
      setFormError("Alamat atau patokan lokasi minimal 5 karakter.");
      return;
    }
    if (evidenceFiles.length === 0) {
      setFormError("Unggah minimal 1 foto bukti kondisi di lapangan.");
      return;
    }

    setIsSubmitting(true);

    const payload: CreateReportSchemaType = {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      kecamatanId,
      kelurahanId,
      addressDetail: addressDetail.trim(),
      latitude,
      longitude,
      reporterName: reporterName.trim() || undefined,
      reporterPhone: reporterPhone.trim() || undefined,
      reporterEmail: reporterEmail.trim() || undefined,
      evidenceFiles,
    };

    const aiMetadata = aiResult
      ? {
        confidence: aiResult.confidence,
        summary: aiResult.summary,
        authorityTarget: aiResult.recommendedAuthority || undefined,
        priority: aiResult.priority,
      }
      : undefined;

    const res = await submitReportAction(payload, aiMetadata);
    setIsSubmitting(false);

    if (res.success && res.trackingCode) {
      router.push(`/lapor/berhasil?code=${res.trackingCode}`);
    } else {
      setFormError(res.error || "Gagal menyimpan laporan ke sistem.");
    }
  };

  return (
    <div className="w-full">
      {/* Route-Line Step Bar */}
      <div className="mb-6 sm:mb-8 rounded-xl border border-[#D9DEE7] bg-white p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-[#1749D2] bg-[#F0F3FF] p-2 sm:p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1749D2] font-mono text-xs font-bold text-white">
              01
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold text-[#1749D2] uppercase tracking-wider block">
                CERITAKAN
              </span>
              <p className="truncate text-xs font-semibold text-[#111C2D]">Masukkan Masalah</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-lg border p-2 sm:p-2.5 ${aiResult
              ? "border-[#16845B] bg-[#E6F7EF]"
              : isAnalyzing
                ? "border-[#E58A1F] bg-[#FFF8EF]"
                : "border-[#D9DEE7] bg-[#F9F9FF]"
              }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${aiResult
                ? "bg-[#16845B] text-white"
                : isAnalyzing
                  ? "bg-[#E58A1F] text-white"
                  : "bg-white border border-[#D9DEE7] text-[#667085]"
                }`}
            >
              02
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                ANALISIS AI
              </span>
              <p className="truncate text-xs font-semibold text-[#111C2D]">
                {aiResult ? "Tervalidasi" : isAnalyzing ? "Memproses..." : "Pahami Masalah"}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-lg border p-2 sm:p-2.5 ${aiResult?.recommendedAuthority
              ? "border-[#0033A7] bg-[#F0F3FF]"
              : "border-[#D9DEE7] bg-[#F9F9FF]"
              }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${aiResult?.recommendedAuthority
                ? "bg-[#0033A7] text-white"
                : "bg-white border border-[#D9DEE7] text-[#667085]"
                }`}
            >
              03
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                REKOMENDASI
              </span>
              <p className="truncate text-xs font-semibold text-[#111C2D]">Pilih Instansi</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-2 sm:p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white border border-[#D9DEE7] font-mono text-xs font-bold text-[#667085]">
              04
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                SIAP KIRIM
              </span>
              <p className="truncate text-xs font-semibold text-[#111C2D]">Konfirmasi Laporan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-[#D9DEE7] bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between pb-4 border-b border-[#D9DEE7]">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#111C2D] mt-1">
                  Ada masalah apa di sekitar Anda?
                </h2>
                {/* <p className="text-xs text-[#434654] mt-1 leading-relaxed">
                  Ceritakan kondisi dengan bahasa sehari-hari. Sistem AI akan membantu menyusun rincian teknisnya.
                </p> */}
              </div>
              {/* <span className="rounded bg-[#F0F3FF] border border-[#D9DEE7] px-2.5 py-1 font-mono text-xs font-semibold text-[#434654]">
                01
              </span> */}
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#FFDAD6] bg-[#FFF5F5] p-3 text-xs text-[#BA1A1A]">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Judul Laporan */}
              <div className="space-y-1.5">
                <label
                  htmlFor="report-title"
                  className="block text-xs font-mono font-semibold uppercase text-[#111C2D]"
                >
                  Judul Singkat Masalah <span className="text-[#BA1A1A]">*</span>
                </label>
                <input
                  id="report-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Aspal Berlubang Parah di Simpang Lampu Merah Charitas"
                  className="w-full h-10 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] px-3 text-sm text-[#111C2D] placeholder:text-[#667085] focus:border-[#1749D2] focus:bg-white focus:outline-none"
                  required
                />
              </div>

              {/* Uraian Cerita */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="report-desc"
                    className="block text-xs font-mono font-semibold uppercase text-[#111C2D]"
                  >
                    Uraian Kondisi Lapangan <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <span className="font-mono text-[11px] text-[#667085]">
                    {description.length} karakter (min. 20)
                  </span>
                </div>
                <textarea
                  id="report-desc"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan dengan jelas apa yang terjadi, sejak kapan, perkiraan dimensi (misal: lubang 30cm), dan dampaknya bagi warga sekitar..."
                  className="w-full rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3 text-sm text-[#111C2D] placeholder:text-[#667085] focus:border-[#1749D2] focus:bg-white focus:outline-none leading-relaxed resize-y"
                  required
                />
                <p className="text-[11px] text-[#667085] flex items-center gap-1 font-mono">
                  <Info className="h-3 w-3 text-[#16845B]" />
                  <span>Sebutkan indikasi bahaya fisik dan dampak bagi kenyamanan mobilitas warga.</span>
                </p>
              </div>

              {/* Kategori */}
              <div className="space-y-1.5">
                <label
                  htmlFor="report-category"
                  className="block text-xs font-mono font-semibold uppercase text-[#111C2D]"
                >
                  Kategori Permasalahan <span className="text-[#BA1A1A]">*</span>
                </label>
                {initialMasterData.categories.length > 0 ? (
                  <select
                    id="report-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] px-3 text-sm text-[#111C2D] focus:border-[#1749D2] focus:bg-white focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Kategori Permasalahan --</option>
                    {initialMasterData.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-3 text-xs text-[#434654] font-mono">
                    <p className="font-semibold text-[#8C5000]">Status Data Master Kategori:</p>
                    <p className="mt-0.5">
                      Belum ada data kategori tersimpan di database. Sistem tetap dapat menerima laporan
                      berdasarkan analisis teks awal oleh petugas.
                    </p>
                  </div>
                )}
              </div>

              {/* Wilayah Palembang: Kecamatan & Kelurahan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="report-kecamatan"
                    className="block text-xs font-mono font-semibold uppercase text-[#111C2D]"
                  >
                    Kecamatan di Palembang <span className="text-[#BA1A1A]">*</span>
                  </label>
                  {initialMasterData.kecamatan.length > 0 ? (
                    <select
                      id="report-kecamatan"
                      value={kecamatanId}
                      onChange={(e) => {
                        setKecamatanId(e.target.value);
                        setKelurahanId("");
                      }}
                      className="w-full h-10 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] px-3 text-sm text-[#111C2D] focus:border-[#1749D2] focus:bg-white focus:outline-none"
                      required
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {initialMasterData.kecamatan.map((k) => (
                        <option key={k.id} value={k.id}>
                          Kec. {k.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-2.5 text-xs text-[#667085] font-mono">
                      Data Kecamatan belum dimigrasi di database.
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="report-kelurahan"
                    className="block text-xs font-mono font-semibold uppercase text-[#111C2D]"
                  >
                    Kelurahan <span className="text-[#BA1A1A]">*</span>
                  </label>
                  {availableKelurahan.length > 0 ? (
                    <select
                      id="report-kelurahan"
                      value={kelurahanId}
                      onChange={(e) => setKelurahanId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] px-3 text-sm text-[#111C2D] focus:border-[#1749D2] focus:bg-white focus:outline-none"
                      required
                    >
                      <option value="">-- Pilih Kelurahan --</option>
                      {availableKelurahan.map((kel) => (
                        <option key={kel.id} value={kel.id}>
                          Kel. {kel.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      id="report-kelurahan"
                      disabled
                      className="w-full h-10 rounded-lg border border-[#D9DEE7] bg-gray-100 px-3 text-xs text-[#667085] cursor-not-allowed"
                    >
                      <option value="">
                        {kecamatanId ? "-- Tidak ada kelurahan terdaftar --" : "-- Pilih kecamatan terlebih dahulu --"}
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Patokan Alamat Detail & GPS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="report-address"
                    className="block text-xs font-mono font-semibold uppercase text-[#111C2D]"
                  >
                    Alamat Detail / Patokan Lapangan <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating || isResolvingAddress}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#1749D2] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={`h-3 w-3 ${isLocating ? "animate-spin" : ""}`} />
                    <span>
                      {isLocating
                        ? "Mencari Sinyal GPS..."
                        : isResolvingAddress
                        ? "Mengambil Nama Jalan..."
                        : latitude !== null
                        ? "Deteksi Ulang GPS"
                        : "Deteksi GPS"}
                    </span>
                  </button>
                </div>
                <input
                  id="report-address"
                  type="text"
                  value={addressDetail}
                  onChange={(e) => {
                    setAddressDetail(e.target.value);
                    addressDetailRef.current = e.target.value;
                  }}
                  placeholder="Contoh: Jl. Sudirman KM 3.5, depan toko roti, dekat tiang listrik No. 12"
                  className="w-full h-10 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] px-3 text-sm text-[#111C2D] placeholder:text-[#667085] focus:border-[#1749D2] focus:bg-white focus:outline-none"
                  required
                />

                {/* GPS Status & Error Messages */}
                {gpsError && (
                  <div className="flex items-start gap-2 rounded-lg border border-[#FFDAD6] bg-[#FFF5F5] p-2.5 text-xs text-[#BA1A1A]">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="leading-relaxed">{gpsError}</p>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#BA1A1A] underline cursor-pointer hover:text-[#93000A]"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Coba Deteksi Ulang</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Status GPS Terdeteksi (Kotak Hijau) */}
                {latitude !== null && longitude !== null && (
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-[#E6F7EF] border border-[#78D9AA]/50 p-2.5 sm:p-3 text-xs text-[#006443]">
                      {/* Baris Utama: Status Sukses, Koordinat, Akurasi, dan Tombol Deteksi Ulang */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#006443]" />
                          <span className="font-mono text-xs break-all">
                            Koordinat GPS: {latitude}, {longitude}
                            {gpsAccuracy !== null && ` (Akurasi: ±${gpsAccuracy} meter)`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={isLocating || isResolvingAddress}
                          className="self-start sm:self-auto inline-flex items-center gap-1 font-mono text-[11px] font-semibold underline text-[#006443] hover:text-[#004D33] cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLocating || isResolvingAddress ? "animate-spin" : ""}`} />
                          <span>Deteksi Ulang</span>
                        </button>
                      </div>

                      {/* Status Pemuatan Resolusi Alamat */}
                      {isResolvingAddress && (
                        <div className="mt-2 pt-2 border-t border-[#78D9AA]/40 flex items-center gap-1.5 text-[11px] text-[#006443]">
                          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                          <span>Menghubungi peta satelit untuk mengenali nama jalan...</span>
                        </div>
                      )}

                      {/* Kondisi 1: Nama Jalan Berhasil Diperoleh */}
                      {!isResolvingAddress && detectedRoad && (
                        <div className="mt-2 pt-2 border-t border-[#78D9AA]/40 space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10px] font-mono font-semibold uppercase text-[#004D33]">
                                Nama Jalan / Alamat Terdeteksi:
                              </span>
                              <p className="font-semibold text-xs text-[#004D33] break-words">
                                {detectedRoad}
                              </p>
                              {/* Jika alamat di input berbeda (pengguna sudah mengetik manual), sediakan tombol ganti */}
                              {addressDetail.trim() && addressDetail.trim() !== detectedRoad && (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                                  <span className="text-[#006443]">
                                    (Alamat manual Anda tetap dipertahankan)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddressDetail(detectedRoad);
                                      addressDetailRef.current = detectedRoad;
                                    }}
                                    className="font-semibold underline text-[#004D33] hover:text-[#003322] cursor-pointer"
                                  >
                                    Gunakan Alamat Ini
                                  </button>
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 text-[10px] text-[#006443]/80 font-mono sm:self-end">
                              Data peta: © OpenStreetMap contributors
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Kondisi 2: Nama Jalan Tidak Ditemukan atau Gagal */}
                      {!isResolvingAddress && !detectedRoad && (
                        <div className="mt-2 pt-2 border-t border-[#78D9AA]/40">
                          <p className="text-[11px] text-[#006443] leading-relaxed break-words">
                            {geocodingError ||
                              "Alamat atau nama jalan belum dapat dikenali dari peta satelit. Silakan isi alamat patokan secara manual pada kolom di atas."}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-[#667085] font-mono leading-tight">
                      *Koordinat GPS merekam titik lokasi perangkat pelapor dan tidak menggantikan bukti kerusakan fisik di lapangan.
                    </p>
                  </div>
                )}
              </div>

              {/* Bukti Foto Pendukung (Supabase Storage) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-semibold uppercase text-[#111C2D]">
                    Foto Bukti Kondisi Fisik <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <span className="font-mono text-[11px] text-[#667085]">
                    {evidenceFiles.length}/3 berkas terunggah
                  </span>
                </div>

                {/* Uploaded Files Preview with Multi-image Verification */}
                {evidenceFiles.length > 0 && (
                  <div className="space-y-2">
                    {evidenceFiles.map((ev, index) => {
                      const evAnalysis =
                        aiResult?.evidenceAnalyses?.[index] ||
                        (index === 0 ? aiResult?.evidenceAnalysis : undefined);

                      return (
                        <div
                          key={index}
                          className="rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-2.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-white border border-[#D9DEE7]">
                                <Image
                                  src={ev.fileUrl}
                                  alt="Bukti Laporan"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-[#111C2D]">
                                  {ev.caption || `Bukti ${index + 1}`}
                                </p>
                                <span className="font-mono text-[10px] text-[#667085]">
                                  {(ev.fileSize / (1024 * 1024)).toFixed(2)} MB · Terunggah
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEvidence(index)}
                              className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6]/50 rounded cursor-pointer"
                              aria-label="Hapus foto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Verification Analysis Badge */}
                          {evAnalysis && (
                            <div className="pt-1.5 border-t border-[#D9DEE7]/70 text-[11px]">
                              {evAnalysis.status === "relevant" && (
                                <div className="flex items-start gap-1.5 text-[#006443] bg-[#E6F7EF] border border-[#78D9AA]/60 rounded p-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold font-mono text-[10px] uppercase">Bukti Visual Sesuai:</span>{" "}
                                    <span>{evAnalysis.description}</span>
                                  </div>
                                </div>
                              )}
                              {evAnalysis.status === "irrelevant" && (
                                <div className="flex items-start gap-1.5 text-[#BA1A1A] bg-[#FFF5F5] border border-[#FFDAD6] rounded p-1.5">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold font-mono text-[10px] uppercase">Peringatan: Bukti Tidak Sesuai</span>
                                    <p className="mt-0.5 text-[10px] leading-relaxed">
                                      {evAnalysis.reasoning || evAnalysis.description}
                                    </p>
                                    <p className="mt-1 text-[10px] font-semibold">
                                      Foto terdeteksi bukan bukti fisik kerusakan di lapangan (misal logo/poster/gambar tidak terkait). Mohon ganti dengan foto kondisi lapangan sebenarnya.
                                    </p>
                                  </div>
                                </div>
                              )}
                              {evAnalysis.status === "ambiguous" && (
                                <div className="flex items-start gap-1.5 text-[#8C5000] bg-[#FFF8EF] border border-[#E58A1F]/40 rounded p-1.5">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold font-mono text-[10px] uppercase">Peringatan: Foto Kurang Jelas / Buram</span>
                                    <p className="mt-0.5 text-[10px] leading-relaxed">
                                      {evAnalysis.reasoning || evAnalysis.description}. Disarankan mengambil foto dengan sudut dan pencahayaan lebih jelas.
                                    </p>
                                  </div>
                                </div>
                              )}
                              {evAnalysis.status === "technical_failure" && (
                                <div className="flex items-start gap-1.5 text-[#434654] bg-[#F9F9FF] border border-[#D9DEE7] rounded p-1.5">
                                  <Info className="h-3.5 w-3.5 text-[#1749D2] shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold font-mono text-[10px] uppercase">Verifikasi Visual Tertunda</span>
                                    <p className="mt-0.5 text-[10px] leading-relaxed">
                                      Analisis otomatis tidak dapat disimpulkan karena gangguan teknis. Bukti akan diperiksa langsung oleh petugas verifikator.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload Trigger Box */}
                {evidenceFiles.length < 3 && (
                  <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D9DEE7] bg-[#F9F9FF] p-6 text-center cursor-pointer transition-colors hover:bg-[#F0F3FF]">
                    <UploadCloud className="h-8 w-8 text-[#1749D2] mb-2" />
                    <span className="text-xs font-semibold text-[#1749D2]">
                      {isUploading ? "Mengunggah berkas..." : "+ Unggah Foto Bukti Lapangan"}
                    </span>
                    <span className="font-mono text-[10px] text-[#667085] mt-1">
                      Format JPG, PNG, atau WebP (Maksimal 10MB per berkas)
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                )}

                {uploadError && (
                  <p className="text-xs text-[#BA1A1A] font-mono">{uploadError}</p>
                )}
              </div>

              {/* Data Pelapor (Opsional) */}
              <div className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE7]">
                  <span className="font-mono text-xs font-semibold uppercase text-[#111C2D]">
                    Identitas Pelapor (Opsional)
                  </span>
                  {/* <span className="font-mono text-[10px] text-[#16845B] bg-[#E6F7EF] px-2 py-0.5 rounded border border-[#78D9AA]/50">
                    Bukan Akun Login
                  </span> */}
                </div>
                <p className="text-xs text-[#434654] leading-relaxed">
                  Warga tidak perlu membuat akun. Jika Anda menyertakan email atau nomor HP, sistem
                  akan mengirimkan kode lacak dan notifikasi kemajuan penanganan secara otomatis.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono text-[#667085] mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full h-9 rounded-md border border-[#D9DEE7] bg-white px-2.5 text-xs text-[#111C2D] focus:border-[#1749D2] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#667085] mb-1">
                      Nomor HP / WA
                    </label>
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full h-9 rounded-md border border-[#D9DEE7] bg-white px-2.5 text-xs text-[#111C2D] focus:border-[#1749D2] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#667085] mb-1">
                      Email Notifikasi
                    </label>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full h-9 rounded-md border border-[#D9DEE7] bg-white px-2.5 text-xs text-[#111C2D] focus:border-[#1749D2] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#D9DEE7]">
                <button
                  type="button"
                  onClick={handleTriggerAnalysis}
                  disabled={isAnalyzing || isSubmitting}
                  className="w-full sm:w-auto flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#1749D2] bg-[#F0F3FF] px-4 font-mono text-xs font-semibold text-[#1749D2] hover:bg-[#DFE8FF] transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menganalisis Teks & Bukti...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Uji Analisis AI Pra-Lapor</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isAnalyzing}
                  className="w-full sm:w-auto flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1749D2] px-6 font-mono text-xs font-semibold text-white shadow-sm hover:bg-[#0033A7] transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan Laporan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Kirim Laporan Resmi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Draf Laporan Sipil Tervalidasi */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-[#D9DEE7] bg-white shadow-sm overflow-hidden">
            {/* Header */}
            {/* <div className="bg-[#F0F3FF] border-b border-[#D9DEE7] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E58A1F] animate-pulse" />
                <span className="font-mono text-xs font-semibold text-[#111C2D]">
                  DRAF LAPORAN SIPIL
                </span>
              </div>
              <span className="rounded bg-white border border-[#D9DEE7] px-2 py-0.5 font-mono text-[10px] text-[#667085]">
                PRA-PELAPORAN
              </span>
            </div> */}

            <div className="p-5 space-y-5">
              {/* AI Status / Error Notice */}
              {!aiConfigured && (
                <div className="rounded-lg border border-[#E58A1F]/40 bg-[#FFF8EF] p-3 text-xs text-[#8C5000] space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold font-mono">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>Konfigurasi Gemini AI Belum Disetel</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Kunci API Gemini (GEMINI_API_KEY) belum aktif di server. Fitur analisis otomatis
                    ditangguhkan. Laporan Anda tetap dapat dikirimkan secara langsung untuk diperiksa
                    oleh petugas.
                  </p>
                </div>
              )}

              {aiError && (
                <div className="rounded-lg border border-[#FFDAD6] bg-[#FFF5F5] p-3 text-xs text-[#BA1A1A]">
                  <p className="font-semibold">Catatan Sistem:</p>
                  <p className="mt-0.5 text-[11px]">{aiError}</p>
                </div>
              )}

              {/* SECTION: 02 / ANALISIS AI */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase text-[#1749D2] flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#DFE8FF] text-[#0033A7] text-[10px] font-bold">
                      02
                    </span>
                    ANALISIS AI · KLASIFIKASI & REKONSTRUKSI BAHASA
                  </span>
                  {aiResult && (
                    <span className="font-mono text-[10px] bg-[#E6F7EF] text-[#006443] px-2 py-0.5 rounded border border-[#78D9AA]/50 font-medium">
                      Keyakinan AI: {Math.round(aiResult.confidence * 100)}%
                    </span>
                  )}
                </div>

                {aiResult && (
                  <p className="text-[10px] text-[#667085] font-mono leading-tight">
                    *Tingkat keyakinan model bahasa (self-assessed confidence) atas pemahaman teks, bukan jaminan verifikasi fisik di lapangan.
                  </p>
                )}

                <div className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3.5 space-y-2.5 text-xs">
                  {aiResult ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[11px] text-[#667085]">
                          Kategori Terdeteksi:
                        </span>
                        <span className="font-semibold text-[#111C2D]">
                          {aiResult.categorySlug}
                        </span>
                      </div>

                      {aiResult.originalLanguageDetected && (
                        <div className="flex justify-between items-center pt-1 border-t border-[#D9DEE7]/70">
                          <span className="font-mono text-[11px] text-[#667085]">
                            Bahasa Input:
                          </span>
                          <span className="font-mono text-[11px] bg-[#F0F3FF] text-[#1749D2] px-2 py-0.5 rounded border border-[#D9DEE7]">
                            {aiResult.originalLanguageDetected}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1 border-t border-[#D9DEE7]/70">
                        <span className="font-mono text-[11px] text-[#667085]">
                          Tingkat Urgensi:
                        </span>
                        <span
                          className={`font-mono text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${aiResult.priority === "critical"
                            ? "bg-[#FFF5F5] text-[#BA1A1A] border border-[#FFDAD6]"
                            : aiResult.priority === "high"
                              ? "bg-[#FFF8EF] text-[#8C5000] border border-[#E58A1F]/40"
                              : "bg-[#F0F3FF] text-[#1749D2] border border-[#D9DEE7]"
                            }`}
                        >
                          {aiResult.priority}
                        </span>
                      </div>

                      {/* Ambiguous Flags Notice */}
                      {aiResult.ambiguousFlags && aiResult.ambiguousFlags.length > 0 && (
                        <div className="rounded-md border border-[#E58A1F]/40 bg-[#FFF8EF] p-2 text-[11px] text-[#8C5000] space-y-1">
                          <div className="flex items-center gap-1 font-semibold font-mono">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Catatan Kiasan / Informasi Ambigu:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {aiResult.ambiguousFlags.map((flag, idx) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Stated Facts vs Inferences Separation */}
                      {aiResult.statedFacts && aiResult.statedFacts.length > 0 && (
                        <div className="pt-2 border-t border-[#D9DEE7]/70 space-y-1">
                          <span className="font-mono text-[10px] text-[#006443] uppercase tracking-wider block font-semibold">
                            Fakta Eksplisit dari Warga:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#111C2D]">
                            {aiResult.statedFacts.map((fact, idx) => (
                              <li key={idx}>{fact}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiResult.inferences && aiResult.inferences.length > 0 && (
                        <div className="pt-2 border-t border-[#D9DEE7]/70 space-y-1">
                          <span className="font-mono text-[10px] text-[#1749D2] uppercase tracking-wider block font-semibold">
                            Inferensi Teknis AI:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#434654]">
                            {aiResult.inferences.map((inf, idx) => (
                              <li key={idx}>{inf}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiResult.unverifiedDetails && aiResult.unverifiedDetails.length > 0 && (
                        <div className="pt-2 border-t border-[#D9DEE7]/70 space-y-1">
                          <span className="font-mono text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                            Informasi Belum Disebutkan (Butuh Konfirmasi):
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#667085]">
                            {aiResult.unverifiedDetails.map((det, idx) => (
                              <li key={idx}>{det}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#D9DEE7]/70">
                        <span className="font-mono text-[11px] text-[#667085] block mb-1">
                          Penalaran Semantik Klasifikasi:
                        </span>
                        <blockquote className="rounded bg-white p-2.5 border-l-2 border-[#1749D2] italic text-[#111C2D] text-[11px] leading-relaxed">
                          &quot;{aiResult.reasoning}&quot;
                        </blockquote>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-center text-[#667085] font-mono text-[11px]">
                      {isAnalyzing ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#1749D2]" />
                          <span>Menganalisis masukan warga & bukti visual...</span>
                        </div>
                      ) : (
                        <span>
                          Klik tombol &quot;Uji Analisis AI Pra-Lapor&quot; untuk melihat estimasi
                          klasifikasi, normalisasi bahasa, dan instansi berwenang.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: 03 / REKOMENDASI INSTANSI */}
              <div className="space-y-2.5 pt-3 border-t border-[#D9DEE7]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase text-[#1749D2] flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#DFE8FF] text-[#0033A7] text-[10px] font-bold">
                      03
                    </span>
                    REKOMENDASI INSTANSI PENANGANAN
                  </span>
                </div>

                <div className="rounded-xl border border-[#1749D2]/30 bg-[#F0F3FF] p-4 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#D9DEE7] text-[#1749D2]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-[#667085] uppercase tracking-wider block">
                        INSTANSI TUJUAN (BERDASARKAN ATURAN RESMI):
                      </span>
                      <h4 className="text-sm font-bold text-[#111C2D] leading-tight mt-0.5">
                        {aiResult?.recommendedAuthority || "Menunggu Verifikasi Instansi"}
                      </h4>
                      {aiResult?.authorityRecommendation?.rule_code && (
                        <p className="font-mono text-[10px] text-[#1749D2] mt-1">
                          Dasar Aturan: {aiResult.authorityRecommendation.rule_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: 04 / RINGKASAN SIAP DITERUSKAN */}
              <div className="space-y-2.5 pt-3 border-t border-[#D9DEE7]">
                <span className="font-mono text-xs font-semibold uppercase text-[#16845B] flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[#E6F7EF] text-[#16845B] text-[10px] font-bold">
                    04
                  </span>
                  PRATINJAU DRAF LAPORAN SEBELUM PENGIRIMAN
                </span>

                {/* Side-by-side original vs normalized preview */}
                <div className="space-y-2">
                  <div className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3 space-y-1">
                    <span className="font-mono text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                      Deskripsi Asli Warga:
                    </span>
                    <p className="text-xs text-[#111C2D] leading-relaxed italic">
                      &quot;{description || "(Belum diisi)"}&quot;
                    </p>
                  </div>

                  {aiResult?.summary && (
                    <div className="rounded-lg border border-[#16845B]/40 bg-[#E6F7EF] p-3 space-y-1">
                      <span className="font-mono text-[10px] text-[#006443] uppercase tracking-wider block font-semibold">
                        Ringkasan Resmi Bahasa Indonesia (Disusun AI):
                      </span>
                      <p className="text-xs text-[#111C2D] leading-relaxed font-medium">
                        {aiResult.summary}
                      </p>
                      <span className="font-mono text-[9px] text-[#006443] block mt-1">
                        *Disusun tegas untuk disposisi instansi tanpa menambah fakta baru.
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3 text-xs font-mono space-y-2 text-[#434654]">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <span>Judul:</span>
                    <span className="font-semibold text-[#111C2D] truncate sm:max-w-[200px]">
                      {title || "(Belum diisi)"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <span>Kategori:</span>
                    <span className="text-[#111C2D]">
                      {selectedCategory?.name_id || "(Belum dipilih)"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <span>Prioritas AI:</span>
                    <span className="font-semibold text-[#111C2D] capitalize">
                      {aiResult?.priority || "Medium (Standar)"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <span>Bukti Foto:</span>
                    <span className="font-semibold text-[#16845B]">
                      {evidenceFiles.length} berkas terunggah
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <span>Pelapor:</span>
                    <span className="text-[#111C2D] break-all sm:break-normal">
                      {reporterEmail ? `Notifikasi ke ${reporterEmail}` : "Anonim (Tanpa Kontak)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Institutional Principle */}
              {/* <div className="rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-3 flex items-start gap-2 text-xs text-[#434654]">
                <Shield className="h-4 w-4 text-[#1749D2] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Prinsip Kedaulatan Warga:</strong> AI hanya memberikan rekomendasi awal. Anda
                  dapat mengoreksi atau mengubah data sebelum laporan disimpan secara resmi.
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
