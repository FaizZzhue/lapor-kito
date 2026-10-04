"use client";

import { useState, useMemo } from "react";
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
  Shield,
  Trash2,
  Info,
  Navigation,
} from "lucide-react";
import {
  analyzeReportAction,
  uploadEvidenceAction,
  submitReportAction,
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

  // Geolocation detector
  const [isLocating, setIsLocating] = useState(false);
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Perangkat Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert(`Gagal mendeteksi lokasi GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadEvidenceAction(formData);
    setIsUploading(false);

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
      <div className="mb-8 rounded-xl border border-[#D9DEE7] bg-white p-4 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-[#1749D2] bg-[#F0F3FF] p-2.5">
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
            className={`flex items-center gap-3 rounded-lg border p-2.5 ${
              aiResult
                ? "border-[#16845B] bg-[#E6F7EF]"
                : isAnalyzing
                ? "border-[#E58A1F] bg-[#FFF8EF]"
                : "border-[#D9DEE7] bg-[#F9F9FF]"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                aiResult
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
            className={`flex items-center gap-3 rounded-lg border p-2.5 ${
              aiResult?.recommendedAuthority
                ? "border-[#0033A7] bg-[#F0F3FF]"
                : "border-[#D9DEE7] bg-[#F9F9FF]"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                aiResult?.recommendedAuthority
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

          <div className="flex items-center gap-3 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-2.5">
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
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-[#D9DEE7] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between pb-4 border-b border-[#D9DEE7]">
              <div>
                <span className="rounded bg-[#F0F3FF] border border-[#D9DEE7] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1749D2] uppercase tracking-wider">
                  Borang Pra-Pelaporan Warga
                </span>
                <h2 className="text-xl font-bold text-[#111C2D] mt-1">
                  Ada masalah apa di sekitar Anda?
                </h2>
                <p className="text-xs text-[#434654] mt-1 leading-relaxed">
                  Ceritakan kondisi dengan bahasa sehari-hari. Sistem AI akan membantu menyusun rincian teknisnya.
                </p>
              </div>
              <span className="rounded bg-[#F0F3FF] border border-[#D9DEE7] px-2.5 py-1 font-mono text-xs font-semibold text-[#434654]">
                TAHAP 01
              </span>
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
                        {kecamatanId ? "-- Tidak ada data kelurahan --" : "-- Pilih kecamatan dahulu --"}
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
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#1749D2] hover:underline"
                  >
                    <Navigation className={`h-3 w-3 ${isLocating ? "animate-spin" : ""}`} />
                    <span>{isLocating ? "Mendeteksi..." : "Deteksi GPS"}</span>
                  </button>
                </div>
                <input
                  id="report-address"
                  type="text"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="Contoh: Jl. Sudirman KM 3.5, depan toko roti, dekat tiang listrik No. 12"
                  className="w-full h-10 rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] px-3 text-sm text-[#111C2D] placeholder:text-[#667085] focus:border-[#1749D2] focus:bg-white focus:outline-none"
                  required
                />
                {latitude !== null && longitude !== null && (
                  <div className="flex items-center gap-2 rounded-md bg-[#E6F7EF] border border-[#78D9AA]/50 px-2.5 py-1 text-xs font-mono text-[#006443]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      Koordinat GPS Terdeteksi: {latitude}, {longitude}
                    </span>
                  </div>
                )}
              </div>

              {/* Bukti Foto Pendukung (Supabase Storage) */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-semibold uppercase text-[#111C2D]">
                  Foto Bukti Kondisi Fisik <span className="text-[#BA1A1A]">*</span>
                </label>

                {/* Uploaded Files Preview */}
                {evidenceFiles.length > 0 && (
                  <div className="space-y-2">
                    {evidenceFiles.map((ev, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-white border border-[#D9DEE7]">
                            <Image
                              src={ev.fileUrl}
                              alt="Bukti Laporan"
                              fill
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
                          className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6]/50 rounded"
                          aria-label="Hapus foto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
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
                  <span className="font-mono text-[10px] text-[#16845B] bg-[#E6F7EF] px-2 py-0.5 rounded border border-[#78D9AA]/50">
                    Bukan Akun Login
                  </span>
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
            <div className="bg-[#F0F3FF] border-b border-[#D9DEE7] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E58A1F] animate-pulse" />
                <span className="font-mono text-xs font-semibold text-[#111C2D]">
                  DRAF LAPORAN SIPIL
                </span>
              </div>
              <span className="rounded bg-white border border-[#D9DEE7] px-2 py-0.5 font-mono text-[10px] text-[#667085]">
                PRA-PELAPORAN
              </span>
            </div>

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
                    ANALISIS AI · KLASIFIKASI MASALAH
                  </span>
                  {aiResult && (
                    <span className="font-mono text-[10px] bg-[#E6F7EF] text-[#006443] px-2 py-0.5 rounded border border-[#78D9AA]/50 font-medium">
                      Keyakinan: {Math.round(aiResult.confidence * 100)}%
                    </span>
                  )}
                </div>

                <div className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3.5 space-y-2 text-xs">
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
                      <div className="flex justify-between items-center pt-1 border-t border-[#D9DEE7]/70">
                        <span className="font-mono text-[11px] text-[#667085]">
                          Tingkat Urgensi:
                        </span>
                        <span
                          className={`font-mono text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                            aiResult.priority === "critical"
                              ? "bg-[#FFF5F5] text-[#BA1A1A] border border-[#FFDAD6]"
                              : aiResult.priority === "high"
                              ? "bg-[#FFF8EF] text-[#8C5000] border border-[#E58A1F]/40"
                              : "bg-[#F0F3FF] text-[#1749D2] border border-[#D9DEE7]"
                          }`}
                        >
                          {aiResult.priority}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#D9DEE7]/70">
                        <span className="font-mono text-[11px] text-[#667085] block mb-1">
                          Penalaran Semantik:
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
                          <span>Menganalisis masukan warga...</span>
                        </div>
                      ) : (
                        <span>
                          Klik tombol &quot;Uji Analisis AI Pra-Lapor&quot; untuk melihat estimasi
                          klasifikasi dan instansi terkait.
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
                        INSTANSI TUJUAN:
                      </span>
                      <h4 className="text-sm font-bold text-[#111C2D] leading-tight mt-0.5">
                        {aiResult?.recommendedAuthority || "Menunggu Verifikasi Instansi"}
                      </h4>
                      {!aiResult?.recommendedAuthority && (
                        <p className="text-[10px] text-[#667085] mt-0.5 leading-relaxed">
                          Data master instansi/OPD resmi belum tersedia. Instansi akan ditentukan oleh petugas verifikator setelah laporan diterima.
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
                  RINGKASAN SIAP DITERUSKAN
                </span>

                {aiResult?.summary && (
                  <div className="rounded-lg border border-[#D9DEE7] bg-white p-3 space-y-1">
                    <span className="font-mono text-[10px] text-[#667085] uppercase tracking-wider block font-semibold">
                      Ringkasan Masalah (Telaah AI):
                    </span>
                    <p className="text-xs text-[#111C2D] leading-relaxed">
                      {aiResult.summary}
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-[#D9DEE7] bg-[#F9F9FF] p-3 text-xs font-mono space-y-1.5 text-[#434654]">
                  <div className="flex justify-between">
                    <span>Judul:</span>
                    <span className="font-semibold text-[#111C2D] truncate max-w-[200px]">
                      {title || "(Belum diisi)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kategori:</span>
                    <span className="text-[#111C2D]">
                      {selectedCategory?.name_id || "(Belum dipilih)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prioritas AI:</span>
                    <span className="font-semibold text-[#111C2D] capitalize">
                      {aiResult?.priority || "Medium (Standar)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bukti Foto:</span>
                    <span className="font-semibold text-[#16845B]">
                      {evidenceFiles.length} berkas terunggah
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelapor:</span>
                    <span className="text-[#111C2D]">
                      {reporterEmail ? `Notifikasi ke ${reporterEmail}` : "Anonim (Tanpa Kontak)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Institutional Principle */}
              <div className="rounded-lg border border-[#D9DEE7] bg-[#F0F3FF] p-3 flex items-start gap-2 text-xs text-[#434654]">
                <Shield className="h-4 w-4 text-[#1749D2] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Prinsip Kedaulatan Warga:</strong> AI hanya memberikan rekomendasi awal. Anda
                  dapat mengoreksi atau mengubah data sebelum laporan disimpan secara resmi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
