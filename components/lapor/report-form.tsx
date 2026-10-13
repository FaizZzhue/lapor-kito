"use client";

import { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Send,
  Loader2,
  Trash2,
  Info,
  Navigation,
  RefreshCw,
  FileText,
  Check,
  HelpCircle,
  ExternalLink,
  MapPin,
  Camera,
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
import { LocationPermissionModal } from "./location-permission-modal";
import { PhotoSourceModal } from "./photo-source-modal";
import { CameraCaptureModal } from "./camera-capture-modal";

const InteractiveMapPicker = dynamic(
  () => import("./interactive-map-picker").then((mod) => mod.InteractiveMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[270px] sm:h-[320px] w-full rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 font-mono">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span>Memuat peta interaktif Palembang...</span>
      </div>
    ),
  }
);

export type GpsAccuracyTier = "high" | "acceptable" | "coarse" | "very_coarse";

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

  // GPS, Map & Geolocation State
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsAccuracyTier, setGpsAccuracyTier] = useState<GpsAccuracyTier | null>(null);
  const [isManualPin, setIsManualPin] = useState(false);
  const [initialGpsCoords, setInitialGpsCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number | null;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsBlocked, setGpsBlocked] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [detectedRoad, setDetectedRoad] = useState<string | null>(null);
  const [detectedKecamatan, setDetectedKecamatan] = useState<{ id: string; name: string } | null>(null);
  const [detectedKelurahan, setDetectedKelurahan] = useState<{ id: string; name: string } | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Request counter to prevent race conditions on fast repeated geolocation/map clicks
  const geocodeRequestIdRef = useRef(0);

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

  // Photo Source Selection & Camera Capture Modal state
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AITriageResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [analyzedSignature, setAnalyzedSignature] = useState<string | null>(null);
  const aiRequestIdRef = useRef(0);

  // Checks whether the current title/description has changed since the last AI analysis
  const currentTextSignature = `${title.trim()}:::${description.trim()}`;
  const isTextStale = Boolean(aiResult && analyzedSignature && analyzedSignature !== currentTextSignature);

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

  // Step 1: User clicks "Deteksi GPS" -> Show explanatory permission dialog first
  const handleRequestLocation = () => {
    setShowLocationModal(true);
  };

  // Step 2: User approves via "Izinkan & Deteksi Lokasi" in dialog
  const handleConfirmLocation = () => {
    setShowLocationModal(false);
    executeGeolocation();
  };

  // Resolve address and administrative area for a given coordinate
  const resolveAddress = async (
    lat: number,
    lng: number,
    tier: GpsAccuracyTier | "manual",
    manualTrigger: boolean
  ) => {
    const currentReqId = ++geocodeRequestIdRef.current;
    setIsResolvingAddress(true);
    setGeocodingError(null);

    try {
      const res = await reverseGeocodeAction(lat, lng);
      if (currentReqId !== geocodeRequestIdRef.current) return;
      setIsResolvingAddress(false);

      if (res.success) {
        if (res.road) {
          setDetectedRoad(res.road);
          // STRICT NON-OVERWRITE POLICY:
          // 1. If manualTrigger (user placed/dragged pin on map), NEVER auto-fill addressDetail.
          //    The user can review it as a suggestion and click "Gunakan Saran Alamat Ini".
          // 2. If geolocation: ONLY auto-fill if tier is "high" (accuracy <= 25m) AND user hasn't typed anything.
          //    If accuracy is coarse (e.g. ±333m) or moderate, DO NOT auto-fill addressDetail.
          if (!manualTrigger && tier === "high" && !addressDetailRef.current.trim()) {
            setAddressDetail(res.road);
            addressDetailRef.current = res.road;
          }
        } else {
          setDetectedRoad(null);
          setGeocodingError(
            "Nama jalan spesifik tidak terdata pada peta OpenStreetMap di titik koordinat ini. Alamat manual dapat diisikan pada kolom alamat."
          );
        }

        // Administrative boundary detection
        if (res.kecamatanMatch) {
          setDetectedKecamatan(res.kecamatanMatch);
          setDetectedKelurahan(res.kelurahanMatch ?? null);

          // STRICT POLICY for Kecamatan & Kelurahan:
          // 1. NEVER overwrite if user has already chosen a kecamatan.
          // 2. If user has NOT chosen a kecamatan:
          //    - Only auto-select if GPS tier is "high" (<= 25m) or "acceptable" (<= 100m) AND NOT manual pin.
          //    - If tier is "coarse" (e.g. ±333m) or "very_coarse", NEVER auto-select!
          //      A ±333m uncertainty radius can easily cross district borders. Show explicit suggestion button instead.
          if (!manualTrigger && (tier === "high" || tier === "acceptable")) {
            setKecamatanId((prevKecId) => {
              if (!prevKecId) {
                if (res.kelurahanMatch) {
                  setKelurahanId(res.kelurahanMatch.id);
                } else {
                  setKelurahanId("");
                }
                return res.kecamatanMatch!.id;
              }
              return prevKecId;
            });
          }
        } else {
          setDetectedKecamatan(null);
          setDetectedKelurahan(null);
          setGeocodingError(
            "Titik koordinat berada di luar batas administrasi Kota Palembang atau belum terdata. Silakan pilih Kecamatan dan Kelurahan secara manual."
          );
        }
      } else {
        setGeocodingError(
          res.error || "Pencarian alamat terdekat tidak berhasil. Alamat dapat diisi secara manual."
        );
      }
    } catch {
      if (currentReqId !== geocodeRequestIdRef.current) return;
      setIsResolvingAddress(false);
      setGeocodingError(
        "Kendala teknis saat menghubungi layanan geocoding OpenStreetMap. Alamat manual dapat diisikan pada kolom alamat."
      );
    }
  };

  // Step 3: Execute browser Geolocation API
  const executeGeolocation = () => {
    setGpsError(null);
    setGpsBlocked(false);
    setDetectedRoad(null);
    setGeocodingError(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError(
        "Perangkat atau peramban Anda tidak mendukung API geolokasi otomatis. Anda dapat menentukan titik langsung pada peta interaktif di bawah atau menuliskan alamat patokan secara manual."
      );
      return;
    }

    const currentReqId = ++geocodeRequestIdRef.current;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (currentReqId !== geocodeRequestIdRef.current) return;

        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(accuracy);
        setIsManualPin(false);
        setInitialGpsCoords({ lat, lng, accuracy });
        setIsLocating(false);
        setGpsBlocked(false);

        // Strict, honest accuracy tiering:
        // <= 25m: high (True high-accuracy GPS outdoors)
        // 26 - 100m: acceptable (Moderate neighborhood radius)
        // 101 - 1000m: coarse (Low accuracy, e.g. ±333m - Wi-Fi/cell tower)
        // > 1000m: very_coarse (Very low / IP-based estimate)
        const tier: GpsAccuracyTier =
          accuracy <= 25
            ? "high"
            : accuracy <= 100
              ? "acceptable"
              : accuracy <= 1000
                ? "coarse"
                : "very_coarse";
        setGpsAccuracyTier(tier);

        // Trigger address and district resolution
        resolveAddress(lat, lng, tier, false);
      },
      (err) => {
        if (currentReqId !== geocodeRequestIdRef.current) return;
        setIsLocating(false);
        setIsResolvingAddress(false);
        let errorMsg = `Gagal mendeteksi lokasi GPS: ${err.message}`;
        let isBlocked = false;

        if (err.code === 1) {
          isBlocked = true;
          errorMsg =
            "Izin akses lokasi tidak diberikan atau diblokir oleh peramban Anda. Anda tetap dapat menentukan titik pada peta interaktif di bawah atau memilih Kecamatan, Kelurahan, dan menuliskan alamat patokan secara manual.";
        } else if (err.code === 2) {
          errorMsg =
            "Sinyal lokasi perangkat tidak tersedia. Pastikan fitur lokasi perangkat aktif, coba di area terbuka, atau pilih titik langsung pada peta interaktif di bawah.";
        } else if (err.code === 3) {
          errorMsg =
            "Waktu pencarian sinyal lokasi GPS habis (timeout). Silakan coba lagi atau tentukan titik pada peta interaktif di bawah.";
        }
        setGpsBlocked(isBlocked);
        setGpsError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Handler for manual pin drag/click on interactive map
  const handleMapLocationSelect = (newLat: number, newLng: number) => {
    setLatitude(newLat);
    setLongitude(newLng);
    setIsManualPin(true);
    setGpsAccuracy(null); // Clear GPS accuracy circle for manual placement
    setGpsAccuracyTier(null);
    resolveAddress(newLat, newLng, "manual", true);
  };

  // Handler to restore initial GPS coordinates
  const handleResetToGps = () => {
    if (!initialGpsCoords) return;
    setLatitude(initialGpsCoords.lat);
    setLongitude(initialGpsCoords.lng);
    setGpsAccuracy(initialGpsCoords.accuracy);
    setIsManualPin(false);
    const tier: GpsAccuracyTier =
      initialGpsCoords.accuracy === null
        ? "coarse"
        : initialGpsCoords.accuracy <= 25
          ? "high"
          : initialGpsCoords.accuracy <= 100
            ? "acceptable"
            : initialGpsCoords.accuracy <= 1000
              ? "coarse"
              : "very_coarse";
    setGpsAccuracyTier(tier);
    resolveAddress(initialGpsCoords.lat, initialGpsCoords.lng, tier, false);
  };

  // Unified Photo Processing and Upload (Camera and Gallery)
  const processAndUploadFile = async (file: File): Promise<boolean> => {
    setUploadError(null);

    if (evidenceFiles.length >= 3) {
      setUploadError("Maksimal 3 foto bukti yang dapat dilampirkan.");
      return false;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Format berkas harus JPG, PNG, atau WebP.");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran foto maksimal 10 MB per berkas.");
      return false;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadEvidenceAction(formData);
    setIsUploading(false);

    if (res.success && res.fileUrl && res.storagePath && res.fileType && res.fileSize) {
      setEvidenceFiles((prev) => [
        ...prev,
        {
          fileUrl: res.fileUrl!,
          fileType: res.fileType!,
          fileSize: res.fileSize!,
          storagePath: res.storagePath!,
          caption: file.name,
        },
      ]);
      return true;
    } else {
      setUploadError(res.error || "Gagal mengunggah foto bukti.");
      return false;
    }
  };

  // Handle File Upload from Gallery / Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processAndUploadFile(file);
    e.target.value = "";
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Trigger AI Analysis
  const handleTriggerAnalysis = async () => {
    if (description.trim().length < 15) {
      setFormError("Tuliskan uraian masalah minimal 15 karakter sebelum meminta analisis AI.");
      return;
    }

    setFormError(null);
    setAiError(null);
    setIsAnalyzing(true);

    const currentReqId = ++aiRequestIdRef.current;
    const currentSig = `${title.trim()}:::${description.trim()}`;

    const selectedKec = initialMasterData.kecamatan.find((k) => k.id === kecamatanId);
    const selectedKel = initialMasterData.kelurahan.find((k) => k.id === kelurahanId);

    // Only send categoryName if user previously analyzed this exact text, avoiding stale category bias
    const categoryToSend = analyzedSignature === currentSig ? selectedCategory?.name_id : undefined;

    const res = await analyzeReportAction({
      title: title.trim() || description.slice(0, 50),
      description: description.trim(),
      categoryName: categoryToSend,
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

    // Guard against race conditions: if a newer analysis request was fired, ignore this one
    if (currentReqId !== aiRequestIdRef.current) {
      return;
    }

    setIsAnalyzing(false);
    setAiConfigured(res.isConfigured);

    if (res.success && res.triage) {
      setAiResult(res.triage);
      setAnalyzedSignature(currentSig);

      // Automatically sync form category to AI recommendation when valid
      if (res.triage.isValidComplaint && res.triage.categorySlug && res.triage.categorySlug !== "invalid") {
        const matched = initialMasterData.categories.find(
          (c) => c.slug.toLowerCase() === res.triage?.categorySlug.toLowerCase()
        );
        if (matched) {
          setCategoryId(matched.id);
        }
      }
    } else {
      setAiError(res.error || "Analisis AI tidak dapat diselesaikan.");
    }
  };

  // Submit Final Report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

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
    const isKelInKec = initialMasterData.kelurahan.some(
      (k) => k.id === kelurahanId && k.kecamatan_id === kecamatanId
    );
    if (!isKelInKec) {
      setFormError("Kelurahan yang dipilih tidak sesuai dengan Kecamatan. Silakan pilih kembali Kelurahan.");
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
      const queryParams = new URLSearchParams();
      queryParams.set("code", res.trackingCode);
      if (res.emailNotification?.attempted) {
        queryParams.set("emailSent", res.emailNotification.sent ? "true" : "false");
        if (res.emailNotification.recipient) {
          queryParams.set("recipient", res.emailNotification.recipient);
        }
        if (res.emailNotification.errorReason) {
          queryParams.set("emailReason", res.emailNotification.errorReason);
        }
      }
      router.push(`/lapor/berhasil?${queryParams.toString()}`);
    } else {
      setFormError(res.error || "Gagal menyimpan laporan ke sistem.");
    }
  };

  return (
    <div className="w-full">
      {/* Route-Line Step Bar */}
      <div className="mb-6 sm:mb-8 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Step 1 */}
          <div className="flex items-center gap-3 rounded-lg border border-blue-600 bg-blue-50/70 p-2 sm:p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-700 font-mono text-xs font-bold text-white">
              01
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                CERITAKAN
              </span>
              <p className="truncate text-xs font-semibold text-slate-900">Masukkan Masalah</p>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-3 rounded-lg border p-2 sm:p-2.5 transition-colors ${aiResult
              ? "border-emerald-600 bg-emerald-50/70"
              : isAnalyzing
                ? "border-amber-500 bg-amber-50/70"
                : "border-slate-200 bg-slate-50/60"
              }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${aiResult
                ? "bg-emerald-700 text-white"
                : isAnalyzing
                  ? "bg-amber-600 text-white animate-pulse"
                  : "bg-slate-200 text-slate-600"
                }`}
            >
              02
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                ANALISIS AI
              </span>
              <p className="truncate text-xs font-semibold text-slate-900">
                {aiResult ? "Saran Tersedia" : isAnalyzing ? "Menganalisis..." : "Uji Analisis AI"}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-3 rounded-lg border p-2 sm:p-2.5 transition-colors ${aiResult?.recommendedAuthority
              ? "border-blue-700 bg-blue-50/70"
              : "border-slate-200 bg-slate-50/60"
              }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${aiResult?.recommendedAuthority
                ? "bg-blue-700 text-white"
                : "bg-slate-200 text-slate-600"
                }`}
            >
              03
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                REKOMENDASI
              </span>
              <p className="truncate text-xs font-semibold text-slate-900">
                {aiResult?.recommendedAuthority ? "Instansi Ditemukan" : "Cari Instansi"}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-2 sm:p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-200 font-mono text-xs font-bold text-slate-600">
              04
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                KODE LACAK
              </span>
              <p className="truncate text-xs font-semibold text-slate-900">Simpan & Pantau</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Input Form Sections */}
        <div className="lg:col-span-7 space-y-6">
          {/* Form Error Banner */}
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-2xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold font-mono">Pemeriksaan Formulir:</span>
                <p className="leading-relaxed">{formError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: DETAIL MASALAH */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                    01
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Detail Kerusakan Fasilitas
                  </h2>
                </div>
              </div>

              {/* Judul Laporan */}
              <div className="space-y-1.5">
                <label
                  htmlFor="report-title"
                  className="block text-xs font-mono font-semibold uppercase text-slate-800"
                >
                  Judul Ringkas Masalah <span className="text-red-600">*</span>
                </label>
                <input
                  id="report-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Aspal amblas di Jalan R. Sukamto depan lorong musholla"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                />
              </div>

              {/* Kategori Masalah */}
              <div className="space-y-1.5">
                <label
                  htmlFor="report-category"
                  className="block text-xs font-mono font-semibold uppercase text-slate-800"
                >
                  Kategori Fasilitas <span className="text-red-600">*</span>
                </label>
                <select
                  id="report-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                >
                  <option value="">-- Pilih Kategori Permasalahan --</option>
                  {initialMasterData.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Uraian Kondisi Lapangan */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="report-description"
                    className="block text-xs font-mono font-semibold uppercase text-slate-800"
                  >
                    Uraian Kondisi di Lapangan <span className="text-red-600">*</span>
                  </label>
                  <span className="font-mono text-[11px] text-slate-400">
                    {description.length} karakter (min. 20)
                  </span>
                </div>
                <textarea
                  id="report-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan kejadian dengan bebas, boleh bahasa sehari-hari atau bahasa Palembang. Contoh: Lobang jalan la lamo dak dibeneri, pas ujan terendam banyu dak keliatan samo sekali, la banyak motor taborong..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y leading-relaxed transition-all"
                  required
                />
              </div>
            </div>

            {/* SECTION 2: LOKASI KEJADIAN */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                    02
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Lokasi di Kota Palembang
                  </h2>
                </div>
              </div>

              {/* Kecamatan & Kelurahan Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="report-kecamatan"
                    className="block text-xs font-mono font-semibold uppercase text-slate-800"
                  >
                    Kecamatan <span className="text-red-600">*</span>
                  </label>
                  {initialMasterData.kecamatan.length > 0 ? (
                    <select
                      id="report-kecamatan"
                      value={kecamatanId}
                      onChange={(e) => {
                        setKecamatanId(e.target.value);
                        setKelurahanId("");
                      }}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
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
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 font-mono">
                      Data Kecamatan sedang dimuat...
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="report-kelurahan"
                    className="block text-xs font-mono font-semibold uppercase text-slate-800"
                  >
                    Kelurahan <span className="text-red-600">*</span>
                  </label>
                  {availableKelurahan.length > 0 ? (
                    <select
                      id="report-kelurahan"
                      value={kelurahanId}
                      onChange={(e) => setKelurahanId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
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
                      className="w-full h-10 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs text-slate-400 cursor-not-allowed"
                    >
                      <option value="">
                        {kecamatanId ? "-- Tidak ada kelurahan terdaftar --" : "-- Pilih kecamatan terlebih dahulu --"}
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Patokan Alamat Detail & GPS Deteksi */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="report-address"
                    className="block text-xs font-mono font-semibold uppercase text-slate-800"
                  >
                    Alamat Detail / Patokan Lapangan <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    disabled={isLocating || isResolvingAddress}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
                    <span>
                      {isLocating
                        ? "Mencari Sinyal GPS..."
                        : isResolvingAddress
                          ? "Membaca Peta Jalan..."
                          : latitude !== null
                            ? "Deteksi Ulang GPS"
                            : "Deteksi Koordinat GPS"}
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
                  placeholder="Contoh: Jl. Demang Lebar Daun No. 42, depan minimarket, samping tiang trafo"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  required
                />

                {/* GPS Status & Error Handling Box */}
                {gpsError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="leading-relaxed font-semibold text-amber-900">
                          {gpsError}
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Anda tetap dapat melanjutkan pengisian formulir dengan memilih <strong>Kecamatan</strong>, <strong>Kelurahan</strong>, dan menuliskan alamat patokan secara manual pada kolom di atas.
                        </p>
                      </div>

                      {gpsBlocked && (
                        <div className="rounded-lg bg-white/95 p-3 border border-amber-200/90 text-[11px] text-slate-700 space-y-1.5">
                          <p className="font-bold text-slate-900">Petunjuk mengaktifkan izin lokasi di peramban:</p>
                          <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-0.5">
                            <li>Klik ikon <strong>Setelan Situs / Gembok (🔒)</strong> di bilah alamat browser Anda.</li>
                            <li>Ubah opsi izin <strong>Lokasi</strong> menjadi <strong>Izinkan (Allow)</strong>.</li>
                            <li>Tekan tombol <strong>Coba Deteksi Ulang</strong> di bawah atau muat ulang halaman.</li>
                          </ol>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleRequestLocation}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Coba Deteksi Ulang</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Koordinat Terdeteksi / Dipilih Manual */}
                {latitude !== null && longitude !== null && (
                  <div className="space-y-2">
                    <div
                      className={`rounded-lg p-3 text-xs space-y-2 border ${isManualPin
                        ? "bg-blue-50/80 border-blue-200 text-blue-950"
                        : gpsAccuracyTier === "very_coarse"
                          ? "bg-red-50/90 border-red-200 text-red-950"
                          : gpsAccuracyTier === "coarse"
                            ? "bg-amber-50/90 border-amber-300 text-amber-950"
                            : gpsAccuracyTier === "acceptable"
                              ? "bg-blue-50/80 border-blue-200 text-blue-950"
                              : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {isManualPin ? (
                            <MapPin className="h-4 w-4 shrink-0 text-blue-700" />
                          ) : gpsAccuracyTier === "coarse" || gpsAccuracyTier === "very_coarse" ? (
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                          )}
                          <div className="font-mono text-xs font-semibold leading-tight">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>
                                {isManualPin
                                  ? "Titik Peta: "
                                  : gpsAccuracyTier === "very_coarse"
                                    ? "Perkiraan Jaringan: "
                                    : "Koordinat Lokasi: "}
                                {latitude}, {longitude}
                              </span>
                              {!isManualPin && gpsAccuracy !== null && (
                                <span className="text-[11px] font-normal opacity-90">
                                  (Toleransi: ±{gpsAccuracy >= 1000 ? `${(gpsAccuracy / 1000).toFixed(1)} km` : `${gpsAccuracy} m`})
                                </span>
                              )}
                              <a
                                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 underline ml-1 cursor-pointer"
                                title="Buka titik koordinat pada Google Maps"
                              >
                                <span>Lihat di Google Maps</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${isManualPin
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : gpsAccuracyTier === "very_coarse"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : gpsAccuracyTier === "coarse"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : gpsAccuracyTier === "acceptable"
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}
                          >
                            {isManualPin
                              ? "Titik Manual Peta"
                              : gpsAccuracyTier === "very_coarse"
                                ? "Akurasi Sangat Rendah (IP)"
                                : gpsAccuracyTier === "coarse"
                                  ? `Akurasi Rendah (±${gpsAccuracy} m)`
                                  : gpsAccuracyTier === "acceptable"
                                    ? `Akurasi Sedang (±${gpsAccuracy} m)`
                                    : `Akurasi Tinggi (±${gpsAccuracy} m)`}
                          </span>
                          <button
                            type="button"
                            onClick={handleRequestLocation}
                            disabled={isLocating || isResolvingAddress}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold underline hover:opacity-80 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${isLocating || isResolvingAddress ? "animate-spin" : ""}`} />
                            <span>Perbarui GPS</span>
                          </button>
                        </div>
                      </div>

                      {/* Warning notice if accuracy is low (> 100m) or IP-based */}
                      {!isManualPin && gpsAccuracy !== null && gpsAccuracy > 100 && (
                        <div className="pt-2 border-t border-amber-200/80 text-[11px] text-amber-900 leading-relaxed space-y-1">
                          <p className="font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                            Akurasi sinyal lokasi saat ini ±{gpsAccuracy >= 1000 ? `${(gpsAccuracy / 1000).toFixed(1)} km` : `${gpsAccuracy} m`}.
                          </p>
                          <p className="text-amber-800 text-[10px]">
                            {gpsAccuracyTier === "very_coarse"
                              ? "Sinyal berasal dari perkiraan jaringan internet/IP penyedia dengan radius sangat luas (>1 km). Pastikan Anda menyesuaikan posisi pin pada peta interaktif di bawah atau memilih Kecamatan/Kelurahan secara manual."
                              : "Toleransi lokasi mencapai ratusan meter dari titik fisik sebenarnya. Anda dapat menggeser pin biru pada peta interaktif di bawah agar titik laporan lebih tepat sasaran."}
                          </p>
                        </div>
                      )}

                      {/* Resolving Status */}
                      {isResolvingAddress && (
                        <div className="pt-2 border-t border-slate-200/70 flex items-center gap-1.5 text-[11px] text-slate-700">
                          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-blue-600" />
                          <span>Mencari nama jalan dan wilayah terdekat pada OpenStreetMap...</span>
                        </div>
                      )}

                      {/* Nama Jalan Berhasil */}
                      {!isResolvingAddress && detectedRoad && (
                        <div className="pt-2 border-t border-slate-200/70 space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10px] font-mono font-bold uppercase opacity-80">
                                {isManualPin
                                  ? "Saran Alamat dari Titik Peta:"
                                  : gpsAccuracyTier === "high"
                                    ? "Alamat Jalan Terdeteksi:"
                                    : "Saran Alamat Terdekat (Estimasi Peta):"}
                              </span>
                              <p className="font-semibold text-xs break-words mt-0.5">
                                {detectedRoad}
                              </p>
                              {addressDetail.trim() !== detectedRoad && (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                                  {addressDetail.trim() && (
                                    <span className="opacity-80">
                                      (Alamat manual Anda tetap dipertahankan)
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddressDetail(detectedRoad);
                                      addressDetailRef.current = detectedRoad;
                                    }}
                                    className="font-bold underline text-blue-900 hover:text-blue-950 cursor-pointer"
                                  >
                                    Gunakan Saran Alamat Ini
                                  </button>
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 text-[10px] opacity-70 font-mono sm:self-end">
                              Peta & Geocoding: © OpenStreetMap
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Sugesti wilayah terdeteksi (tidak menimpa pilihan manual) */}
                      {!isResolvingAddress && detectedKecamatan && !kecamatanId && (
                        <div className="pt-2 border-t border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
                          <span>
                            Estimasi wilayah dari titik: <strong>Kec. {detectedKecamatan.name}</strong>
                            {detectedKelurahan && `, Kel. ${detectedKelurahan.name}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setKecamatanId(detectedKecamatan.id);
                              if (detectedKelurahan) setKelurahanId(detectedKelurahan.id);
                            }}
                            className="font-bold underline text-blue-900 hover:text-blue-950 cursor-pointer self-start sm:self-auto"
                          >
                            Gunakan Wilayah Ini
                          </button>
                        </div>
                      )}

                      {!isResolvingAddress && detectedKecamatan && kecamatanId && detectedKecamatan.id !== kecamatanId && (
                        <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] bg-amber-100/50 p-2 rounded">
                          <span className="text-amber-950">
                            Titik koordinat berada di <strong>Kec. {detectedKecamatan.name}</strong> (Pilihan manual Anda: <strong>Kec. {initialMasterData.kecamatan.find(k => k.id === kecamatanId)?.name || kecamatanId}</strong>)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setKecamatanId(detectedKecamatan.id);
                              if (detectedKelurahan) setKelurahanId(detectedKelurahan.id);
                            }}
                            className="font-bold underline text-amber-900 hover:text-amber-950 cursor-pointer self-start sm:self-auto"
                          >
                            Sesuaikan ke Wilayah Titik
                          </button>
                        </div>
                      )}

                      {!isResolvingAddress && !detectedKecamatan && (
                        <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-600">
                          <p className="leading-relaxed opacity-90">
                            Wilayah kecamatan tidak dapat dipetakan secara pasti dari koordinat ini. Pilihan Kecamatan dan Kelurahan pada menu di atas dipertahankan secara manual.
                          </p>
                        </div>
                      )}

                      {!isResolvingAddress && !detectedRoad && (
                        <div className="pt-2 border-t border-slate-200/70">
                          <p className="text-[11px] leading-relaxed opacity-90">
                            {geocodingError ||
                              "Nama jalan spesifik belum terpetakan di titik koordinat ini. Alamat manual Anda di atas akan digunakan sebagai patokan utama."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Interactive Map Pin Picker */}
                <div className="pt-2">
                  <InteractiveMapPicker
                    latitude={latitude}
                    longitude={longitude}
                    accuracy={gpsAccuracy}
                    isManualPin={isManualPin}
                    onLocationSelect={handleMapLocationSelect}
                    onResetToGps={initialGpsCoords ? handleResetToGps : undefined}
                    gpsCoords={initialGpsCoords}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: BUKTI FOTO PENDUKUNG */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                    03
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Foto Bukti Kondisi Fisik Lapangan
                  </h2>
                </div>
                <span className="font-mono text-xs font-bold text-blue-700">
                  {evidenceFiles.length}/3 Berkas
                </span>
              </div>

              {/* Upload Drop / Action Area */}
              {evidenceFiles.length < 3 && (
                <div className="space-y-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !isUploading && setShowPhotoSourceModal(true)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                        e.preventDefault();
                        setShowPhotoSourceModal(true);
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center hover:bg-blue-50/50 hover:border-blue-400 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-800 block">
                        {isUploading
                          ? "Mengunggah berkas ke penyimpanan..."
                          : "Klik untuk Ambil Foto Kamera atau Pilih Berkas"}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Format: JPG, PNG, atau WebP (Maksimal 10 MB per foto, hingga 3 berkas)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isUploading) setShowCameraModal(true);
                        }}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-mono text-[11px] font-semibold hover:bg-blue-800 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isUploading) fileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-mono text-[11px] font-semibold hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Galeri / File</span>
                      </button>
                    </div>
                  </div>

                  {/* Hidden file input for gallery picker */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Uploaded Evidence Grid */}
              {evidenceFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {evidenceFiles.map((ev, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden group shadow-2xs"
                    >
                      <div className="relative h-28 w-full bg-slate-200">
                        <Image
                          src={ev.fileUrl}
                          alt={ev.caption || `Bukti ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="p-2 flex items-center justify-between text-[11px] font-mono bg-white">
                        <span className="truncate max-w-[120px] text-slate-700">
                          {ev.caption || `Foto ${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(idx)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                          aria-label="Hapus foto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 4: INFORMASI PELAPOR (OPSIONAL & DILINDUNGI) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                    04
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Informasi Pelapor (Opsional & Dirahasiakan)
                  </h2>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Data Pribadi Terlindungi
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Anda dapat melapor secara anonim tanpa memasukkan data pribadi. Jika dicantumkan, kontak hanya dipakai untuk mengirimkan notifikasi status dan verifikasi lapangan oleh petugas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-slate-600">Nama Pelapor</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nama Lengkap / Panggilan"
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-slate-600">Nomor HP / WhatsApp</label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-slate-600">Email Notifikasi</label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="alamat@email.com"
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS (SUBMIT & AI TRIGGER) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzing || isSubmitting}
                className="w-full sm:w-auto flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 font-mono text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
                    <span>Menganalisis Uraian & Foto...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Uji Analisis AI Pra-Lapor</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isAnalyzing}
                className="w-full sm:w-auto flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 font-mono text-xs font-bold text-white shadow-md hover:bg-blue-800 transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan Laporan Resmi...</span>
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

        {/* RIGHT COLUMN: TELAAH AI PRA-PELAPORAN & REKOMENDASI INSTANSI */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 space-y-5">
              {/* Notice if Gemini AI is not configured */}
              {!aiConfigured && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <Info className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Konfigurasi Gemini AI Belum Diaktifkan</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Kunci API Gemini belum dipasang di environment server. Fitur analisis otomatis ditangguhkan, namun laporan Anda tetap dapat dikirimkan langsung untuk diverifikasi manual oleh petugas.
                  </p>
                </div>
              )}

              {/* AI Error Notice */}
              {aiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-0.5">
                  <p className="font-bold font-mono">Catatan Sistem AI:</p>
                  <p className="text-[11px]">{aiError}</p>
                </div>
              )}

              {/* IF AI RESULT IS PRESENT */}
              {aiResult ? (
                <div className="space-y-4">
                  {/* Stale Text Warning */}
                  {isTextStale && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 space-y-1 text-amber-950">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-900">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Teks Telah Diubah Sejak Analisis Terakhir</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        Hasil evaluasi di bawah mencerminkan versi teks sebelumnya. Tekan tombol{" "}
                        <strong className="text-amber-950">&quot;Uji Analisis AI Pra-Lapor&quot;</strong> di sebelah kiri untuk mengevaluasi teks terbaru Anda.
                      </p>
                    </div>
                  )}
                  {/* Alert Banner: Laporan Di Luar Cakupan / Perlu Peninjauan Khusus */}
                  {!aiResult.isValidComplaint && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-2 text-red-950">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-red-800">
                        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                        <span>Perlu Peninjauan Khusus / Di Luar Lingkup Fasilitas Publik</span>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">
                        {aiResult.rejectionReason ||
                          "Uraian laporan atau kombinasi judul dan deskripsi terdeteksi tidak saling mendukung, bersifat privat/non-publik, atau tidak memuat kerusakan fasilitas publik kota yang sah."}
                      </p>
                      <div className="text-[11px] text-red-800 bg-white/80 p-2.5 rounded border border-red-200">
                        <strong>Catatan Sistem:</strong> Laporan ini tidak direkomendasikan langsung ke dinas tertentu dan akan ditandai untuk peninjauan verifikator sebelum diproses.
                      </div>
                    </div>
                  )}

                  {/* Card A: Ringkasan Resmi Bahasa Indonesia */}
                  <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-blue-700" />
                        Ringkasan Resmi Bahasa Indonesia
                      </span>
                      <span className="font-mono text-[10px] bg-white text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-bold">
                        Disusun AI
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {aiResult.summary}
                    </p>
                    <span className="font-mono text-[10px] text-slate-500 block">
                      *Disusun baku dan lugas untuk mempermudah telaah instansi tanpa menambah fakta baru.
                    </span>
                  </div>

                  {/* Card B: Klasifikasi & Evaluasi Multidimensi */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold uppercase text-slate-800">
                        Evaluasi Semantik & Kategori
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Status Kelengkapan Informasi */}
                        {aiResult.informationCompleteness === "minimal" ? (
                          <span className="font-mono text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-300 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            Informasi Terbatas
                          </span>
                        ) : aiResult.informationCompleteness === "lengkap" ? (
                          <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-bold flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-600" />
                            Informasi Lengkap
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-bold">
                            Informasi Cukup
                          </span>
                        )}

                        {/* Nilai Kecocokan Kategori (Bukan probabilitas kebenaran laporan) */}
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300 font-bold">
                          Kecocokan Kategori: {Math.round(aiResult.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block uppercase">Kategori Terdeteksi:</span>
                        <span className={`font-bold mt-0.5 block truncate ${aiResult.categorySlug === "invalid" ? "text-red-700" : "text-slate-900"}`}>
                          {aiResult.categorySlug === "invalid" ? "Di Luar Cakupan Publik" : aiResult.categorySlug}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block uppercase">Estimasi Prioritas:</span>
                        <span
                          className={`font-bold mt-0.5 uppercase block ${aiResult.priority === "critical"
                            ? "text-red-700"
                            : aiResult.priority === "high"
                              ? "text-amber-700"
                              : "text-blue-700"
                            }`}
                        >
                          {aiResult.priority}
                        </span>
                      </div>
                    </div>

                    {/* Dukungan Bukti Teks terhadap Prioritas */}
                    {aiResult.urgencyEvidence && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        <span className="text-[10px] text-slate-500 font-mono block uppercase font-medium">
                          Dukungan Bukti Tingkat Urgensi:
                        </span>
                        <p className="text-slate-700 text-[11px] mt-0.5 leading-relaxed">
                          {aiResult.urgencyEvidence}
                        </p>
                      </div>
                    )}

                    {aiResult.originalLanguageDetected && (
                      <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-600">
                        <span>Bahasa Asal Terdeteksi:</span>
                        <span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                          {aiResult.originalLanguageDetected}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card B.1: Saran Melengkapi Laporan (Klarifikasi Proaktif jika Informasi Terbatas) */}
                  {aiResult.needsClarification && aiResult.clarificationQuestions && aiResult.clarificationQuestions.length > 0 && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-mono text-xs font-bold uppercase tracking-wider">
                        <HelpCircle className="h-4 w-4 text-amber-700 shrink-0" />
                        <span>Saran Rincian untuk Mempercepat Verifikasi</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Laporan Anda memiliki informasi ringkas. Menambahkan rincian berikut pada kolom deskripsi akan membantu petugas OPD menindaklanjuti lebih cepat tanpa perlu survei pendahuluan:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-800 bg-white/90 p-3 rounded-lg border border-amber-200/80">
                        {aiResult.clarificationQuestions.map((q, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px]">
                            <span className="font-mono text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-snug text-slate-700">{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Card C: Rekomendasi Instansi Berwenang (Rule Engine) */}
                  <div className="rounded-xl border border-blue-600/30 bg-blue-50/70 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                      <span className="font-mono text-xs font-bold uppercase text-blue-900 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-blue-700" />
                        Rekomendasi Instansi Berwenang
                      </span>
                      <span className="rounded bg-white text-blue-800 px-2 py-0.5 font-mono text-[10px] font-bold border border-blue-200">
                        Rule & Authority Engine
                      </span>
                    </div>

                    <div className="space-y-1">
                      {/* <span className="font-mono text-[10px] text-slate-500 uppercase">
                        Organisasi Perangkat Daerah (OPD) Tujuan:
                      </span> */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {aiResult.recommendedAuthority || "Menunggu Verifikasi Petugas"}
                      </h4>
                      {/* {aiResult.authorityRecommendation?.rule_code && (
                        <p className="font-mono text-[11px] text-blue-700 mt-1">
                          Dasar Katalog Kewenangan: {aiResult.authorityRecommendation.rule_code}
                        </p>
                      )} */}
                    </div>

                    <div className="rounded-lg bg-white/90 p-2.5 border border-blue-200 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                        <span>Status Peninjauan:</span>
                      </div>
                      <p className="leading-relaxed">
                        Rekomendasi instansi memerlukan peninjauan oleh petugas verifikator sebelum disposisi lapangan dilakukan. Rekomendasi ini bukan penetapan resmi.
                      </p>
                    </div>
                  </div>

                  {/* Card D: Fakta Eksplisit vs Inferensi */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
                    {/* Stated Facts */}
                    {aiResult.statedFacts && aiResult.statedFacts.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-mono text-[11px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-700" />
                          Fakta Eksplisit dari Uraian Warga:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-800 leading-relaxed pl-1">
                          {aiResult.statedFacts.map((fact, idx) => (
                            <li key={idx}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Technical Inferences */}
                    {aiResult.inferences && aiResult.inferences.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="font-mono text-[11px] font-bold uppercase text-blue-800 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-blue-600" />
                          Inferensi Teknis AI:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 leading-relaxed pl-1">
                          {aiResult.inferences.map((inf, idx) => (
                            <li key={idx}>{inf}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Unverified Details / Informasi Belum Lengkap */}
                    {aiResult.unverifiedDetails && aiResult.unverifiedDetails.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="font-mono text-[11px] font-bold uppercase text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          Informasi Belum Lengkap (Butuh Konfirmasi):
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 leading-relaxed pl-1">
                          {aiResult.unverifiedDetails.map((det, idx) => (
                            <li key={idx}>{det}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ambiguous Flags Notice */}
                    {aiResult.ambiguousFlags && aiResult.ambiguousFlags.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900 space-y-1 mt-2">
                        <div className="flex items-center gap-1 font-bold font-mono">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                          <span>Catatan Bahasa Daerah / Informasi Ambigu:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {aiResult.ambiguousFlags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Semantic Reasoning */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="font-mono text-[10px] text-slate-500 uppercase block">
                        Penalaran Semantik Model:
                      </span>
                      <blockquote className="rounded-lg bg-slate-50 p-3 border-l-2 border-blue-600 italic text-slate-700 text-xs leading-relaxed">
                        &quot;{aiResult.reasoning}&quot;
                      </blockquote>
                    </div>
                  </div>
                </div>
              ) : (
                /* EMPTY STATE / PANDUAN AWAL */
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wide">
                      Belum Diuji Analisis AI
                    </h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                      Ketikkan uraian masalah Anda di kolom kiri, lalu klik tombol{" "}
                      <strong className="text-blue-700">&quot;Uji Analisis AI Pra-Lapor&quot;</strong>.
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-200 text-left text-[11px] font-mono text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800">Manfaat Uji Analisis AI:</div>
                    <div>• Menyusun ringkasan formal Bahasa Indonesia</div>
                    <div>• Memvalidasi kesesuaian kategori masalah</div>
                    <div>• Merekomendasikan dinas/OPD yang berwenang</div>
                    <div>• Menilai apakah foto pendukung sudah memadai</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Permission Explanation Dialog */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onConfirm={handleConfirmLocation}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Photo Source Selection Dialog */}
      <PhotoSourceModal
        isOpen={showPhotoSourceModal}
        onClose={() => setShowPhotoSourceModal(false)}
        onSelectCamera={() => setShowCameraModal(true)}
        onSelectGallery={() => fileInputRef.current?.click()}
        currentCount={evidenceFiles.length}
        maxCount={3}
      />

      {/* Camera Capture Dialog */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={async (file) => {
          await processAndUploadFile(file);
        }}
        onSwitchToGallery={() => {
          fileInputRef.current?.click();
        }}
      />
    </div>
  );
}
