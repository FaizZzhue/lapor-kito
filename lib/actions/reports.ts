"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createReportSchema, type CreateReportSchemaType } from "@/lib/validators/report";
import { triageReportWithAI, type TriageInput } from "@/lib/ai/triage";
import { sendReportSubmittedEmail } from "@/lib/email/resend";
import type { AITriageResult } from "@/types/ai";
import crypto from "crypto";

export interface MasterDataResult {
  categories: Array<{ id: string; slug: string; name_id: string; description: string | null }>;
  kecamatan: Array<{ id: string; code: string; name: string }>;
  kelurahan: Array<{ id: string; kecamatan_id: string; code: string; name: string }>;
  isConfigured: boolean;
  error?: string;
}

/**
 * Fetches master categories and Palembang administrative units from Supabase.
 * Returns explicit empty / unconfigured state if database is empty or not yet migrated.
 */
export async function getMasterDataAction(): Promise<MasterDataResult> {
  try {
    const supabase = await createClient();

    const [catRes, kecRes, kelRes] = await Promise.all([
      supabase.from("categories").select("id, slug, name_id, description").eq("is_active", true).order("display_order"),
      supabase.from("kecamatan").select("id, code, name").order("name"),
      supabase.from("kelurahan").select("id, kecamatan_id, code, name").order("name"),
    ]);

    if (catRes.error || kecRes.error || kelRes.error) {
      console.warn("Supabase master data query error:", catRes.error || kecRes.error || kelRes.error);
      return {
        categories: [],
        kecamatan: [],
        kelurahan: [],
        isConfigured: false,
        error: "Basis data LAPORKITO belum terhubung atau tabel belum dimigrasi.",
      };
    }

    const categories = catRes.data || [];
    const kecamatan = kecRes.data || [];
    const kelurahan = kelRes.data || [];

    return {
      categories,
      kecamatan,
      kelurahan,
      isConfigured: categories.length > 0 || kecamatan.length > 0,
      error: categories.length === 0 ? "Data master kategori belum diisi oleh pengelola sistem." : undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan sistem basis data";
    return {
      categories: [],
      kecamatan: [],
      kelurahan: [],
      isConfigured: false,
      error: message,
    };
  }
}

export interface AnalyzeReportResult {
  success: boolean;
  isConfigured: boolean;
  triage?: AITriageResult;
  error?: string;
}

/**
 * Executes AI triage via the provider abstraction.
 * If Gemini is not configured, returns truthful configuration error without fake data.
 */
export async function analyzeReportAction(input: TriageInput): Promise<AnalyzeReportResult> {
  try {
    const triage = await triageReportWithAI(input);
    return {
      success: true,
      isConfigured: true,
      triage,
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Gagal menjalankan analisis AI";
    const isConfigError =
      errMessage.includes("GEMINI_API_KEY") ||
      errMessage.includes("not configured") ||
      errMessage.includes("AIConfigurationError");

    return {
      success: false,
      isConfigured: !isConfigError,
      error: isConfigError
        ? "Konfigurasi Gemini AI belum aktif di environment server (GEMINI_API_KEY belum disetel)."
        : `Analisis AI mengalami kendala: ${errMessage}`,
    };
  }
}

export interface UploadEvidenceResult {
  success: boolean;
  fileUrl?: string;
  storagePath?: string;
  fileType?: string;
  fileSize?: number;
  error?: string;
}

/**
 * Securely uploads evidence attachment to Supabase Storage bucket 'report-evidence'.
 */
export async function uploadEvidenceAction(formData: FormData): Promise<UploadEvidenceResult> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "File lampiran tidak ditemukan" };
    }

    // Validate mime type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Format berkas harus berupa JPG, PNG, atau WebP",
      };
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "Ukuran berkas maksimal 10MB" };
    }

    const supabase = await createClient();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const ext = file.name.split(".").pop() || "jpg";
    const randomHex = crypto.randomBytes(6).toString("hex");
    const storagePath = `evidence/${dateStr}/${randomHex}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("report-evidence")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.warn("Supabase storage upload error:", uploadError);
      return {
        success: false,
        error:
          "Gagal mengunggah berkas ke Supabase Storage. Pastikan bucket 'report-evidence' telah dibuat dan memiliki izin upload publik.",
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from("report-evidence")
      .getPublicUrl(storagePath);

    return {
      success: true,
      fileUrl: publicUrlData.publicUrl,
      storagePath,
      fileType: file.type,
      fileSize: file.size,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah berkas";
    return { success: false, error: message };
  }
}

/**
 * Helper to generate tracking code formatted as LPK-YYYYMMDD-XXXX
 */
function generateLocalTrackingCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `LPK-${datePart}-${randomPart}`;
}

export interface SubmitReportResult {
  success: boolean;
  trackingCode?: string;
  error?: string;
}

/**
 * Creates public report through the real backend data layer.
 * Validates with Zod server-side, generates tracking code, persists to Supabase.
 */
export async function submitReportAction(
  payload: CreateReportSchemaType,
  aiMetadata?: {
    confidence?: number;
    summary?: string;
    authorityTarget?: string;
  }
): Promise<SubmitReportResult> {
  try {
    // 1. Authoritative Zod validation
    const parsed = createReportSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Data formulir tidak valid";
      return { success: false, error: issue };
    }

    const data = parsed.data;
    const adminSupabase = createAdminClient();

    // 2. Handle Reporter Record (if name/phone/email provided)
    let reporterId: string | null = null;
    const hasReporterInfo = data.reporterEmail || data.reporterPhone || data.reporterName;

    if (hasReporterInfo) {
      const { data: newReporter, error: reporterErr } = await adminSupabase
        .from("reporters")
        .insert({
          full_name: data.reporterName?.trim() || null,
          email: data.reporterEmail?.trim() || null,
          phone: data.reporterPhone?.trim() || null,
          last_reported_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!reporterErr && newReporter) {
        reporterId = newReporter.id;
      }
    }

    // 3. Generate Tracking Code
    let trackingCode = generateLocalTrackingCode();

    // Try database RPC if available
    try {
      const { data: rpcCode } = await adminSupabase.rpc("generate_tracking_code");
      if (rpcCode && typeof rpcCode === "string") {
        trackingCode = rpcCode;
      }
    } catch {
      // Fallback to local code generator if RPC not installed
    }

    // 4. Insert Report Record
    const { data: newReport, error: reportErr } = await adminSupabase
      .from("reports")
      .insert({
        tracking_code: trackingCode,
        reporter_id: reporterId,
        category_id: data.categoryId,
        kelurahan_id: data.kelurahanId,
        title: data.title.trim(),
        description: data.description.trim(),
        address_detail: data.addressDetail.trim(),
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: "submitted",
        priority: "medium",
        ai_confidence: aiMetadata?.confidence ?? null,
        ai_summary: aiMetadata?.summary ?? null,
        authority_target: aiMetadata?.authorityTarget ?? null,
      })
      .select("id, tracking_code, title")
      .single();

    if (reportErr || !newReport) {
      console.error("Failed to insert report:", reportErr);
      return {
        success: false,
        error:
          "Gagal menyimpan laporan ke database. Pastikan koneksi Supabase telah terkonfigurasi dan tabel 'reports' tersedia.",
      };
    }

    // 5. Insert Evidence Records
    if (data.evidenceFiles && data.evidenceFiles.length > 0) {
      const evidenceRows = data.evidenceFiles.map((ev) => ({
        report_id: newReport.id,
        file_url: ev.fileUrl,
        file_type: ev.fileType,
        file_size: ev.fileSize,
        storage_path: ev.storagePath,
        caption: ev.caption || null,
        ai_is_valid: true,
      }));

      const { error: evErr } = await adminSupabase.from("report_evidence").insert(evidenceRows);
      if (evErr) {
        console.warn("Evidence insertion warning:", evErr);
      }
    }

    // 6. Insert Initial Timeline Audit Record
    try {
      await adminSupabase.from("report_timeline").insert({
        report_id: newReport.id,
        actor_role: "system",
        action: "Laporan Dibuat",
        notes: "Laporan berhasil didaftarkan ke sistem pra-pelaporan LAPORKITO oleh warga.",
        metadata: { is_internal: false },
      });
    } catch (timelineErr) {
      console.warn("Timeline insertion non-fatal warning:", timelineErr);
    }

    // 7. Optional Email Confirmation via Resend
    if (data.reporterEmail) {
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://laporkito.id"}/pantau/${newReport.tracking_code}`;
      try {
        await sendReportSubmittedEmail({
          to: data.reporterEmail,
          reporterName: data.reporterName || "Warga Palembang",
          trackingCode: newReport.tracking_code,
          reportTitle: newReport.title,
          categoryName: "Pengaduan Publik",
          trackingUrl,
        });
      } catch (emailErr) {
        console.warn("Resend email notification warning:", emailErr);
      }
    }

    return {
      success: true,
      trackingCode: newReport.tracking_code,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan tidak terduga saat membuat laporan";
    return { success: false, error: message };
  }
}
