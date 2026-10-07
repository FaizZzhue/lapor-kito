"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  createReportSchema,
  type CreateReportSchemaType,
  reportAIMetadataSchema,
  type ReportAIMetadataType,
} from "@/lib/validators/report";
import { triageReportWithAI, recommendAuthorityWithAI, type TriageInput } from "@/lib/ai/triage";
import type { AuthorityOption, AuthorityCandidateForAI, CategoryOption } from "@/lib/ai/provider";
import { getGeminiModel } from "@/lib/ai/gemini";
import { sendReportSubmittedEmail } from "@/lib/email/resend";
import { getAuthorityCandidatesByCategorySlug } from "@/lib/data/authority-rules";
import type { AITriageResult } from "@/types/ai";
import type { ReportPriority, ReportStatus } from "@/types/database";
import { getCurrentInternalUser } from "@/lib/auth/session";
import crypto from "crypto";

export interface MasterDataResult {
  categories: Array<{ id: string; slug: string; name_id: string; description: string | null }>;
  kecamatan: Array<{ id: string; code: string; name: string }>;
  kelurahan: Array<{ id: string; kecamatan_id: string; code: string; name: string }>;
  authorities?: AuthorityOption[];
  isConfigured: boolean;
  error?: string;
}

/**
 * Queries distinct institutions that are referenced by active authority_rules.
 * Returns AuthorityOption[] for display and initial triage context.
 * Only includes institutions that actually have a published authority rule.
 */
export async function getAuthoritativeAuthorities(): Promise<AuthorityOption[]> {
  try {
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from("authority_rules")
      .select(`
        rule_code,
        context_title,
        institutions(code, name, is_active)
      `)
      .eq("is_active", true);

    if (error || !data) {
      console.warn("Gagal memuat daftar instansi dari authority_rules:", error?.message);
      return [];
    }

    // Deduplicate by institution code, collecting scope info
    const institutionMap = new Map<string, AuthorityOption>();
    for (const row of data) {
      const inst = row.institutions as unknown as { code: string; name: string; is_active: boolean } | null;
      if (!inst || !inst.is_active) continue;

      if (!institutionMap.has(inst.code)) {
        institutionMap.set(inst.code, {
          code: inst.code,
          name: inst.name,
          scope: row.context_title,
        });
      } else {
        // Append scope info for institutions with multiple rules
        const existing = institutionMap.get(inst.code)!;
        if (existing.scope && !existing.scope.includes(row.context_title)) {
          existing.scope = `${existing.scope}; ${row.context_title}`;
        }
      }
    }

    return Array.from(institutionMap.values());
  } catch (err) {
    console.warn("Kesalahan saat mengambil daftar instansi berwenang:", err);
    return [];
  }
}

/**
 * Fetches master categories and Palembang administrative units from Supabase.
 * Returns explicit empty / unconfigured state if database is empty or not yet migrated.
 */
export async function getMasterDataAction(): Promise<MasterDataResult> {
  try {
    const supabase = await createClient();

    const [catRes, kecRes, kelRes, authorities] = await Promise.all([
      supabase.from("categories").select("id, slug, name_id, description").eq("is_active", true).order("display_order"),
      supabase.from("kecamatan").select("id, code, name").order("name"),
      supabase.from("kelurahan").select("id, kecamatan_id, code, name").order("name"),
      getAuthoritativeAuthorities(),
    ]);

    if (catRes.error || kecRes.error || kelRes.error) {
      console.warn("Supabase master data query error:", catRes.error || kecRes.error || kelRes.error);
      return {
        categories: [],
        kecamatan: [],
        kelurahan: [],
        authorities: [],
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
      authorities,
      isConfigured: categories.length > 0 || kecamatan.length > 0,
      error: categories.length === 0 ? "Data master kategori belum diisi oleh pengelola sistem." : undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan sistem basis data";
    return {
      categories: [],
      kecamatan: [],
      kelurahan: [],
      authorities: [],
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
 * Executes two-step AI triage via the provider abstraction:
 * 1. Category classification + basic triage (priority, validity, summary)
 * 2. Authority recommendation using DB-sourced candidates filtered by the classified categorySlug
 *
 * If Gemini is not configured, returns truthful configuration error without fake data.
 * Persists triage audit log to ai_triage_logs for governance trail.
 */
export async function analyzeReportAction(input: TriageInput): Promise<AnalyzeReportResult> {
  try {
    // ──── STEP 1: Category Classification + Basic Triage ────
    const adminSupabase = createAdminClient();
    const { data: catData } = await adminSupabase
      .from("categories")
      .select("slug, name_id")
      .eq("is_active", true);

    const availableCategories: CategoryOption[] = (catData || []).map((c) => ({
      slug: c.slug,
      name: c.name_id,
    }));

    const authoritativeAuthorities = await getAuthoritativeAuthorities();
    const triageInput: TriageInput = {
      ...input,
      availableCategories: input.availableCategories || availableCategories,
      availableAuthorities: authoritativeAuthorities,
    };

    const startTime = Date.now();
    const triage = await triageReportWithAI(triageInput);

    // ──── STEP 1.5: Enforce categorySlug against DB taxonomy ────
    // Gemini may return a slug not exactly matching the DB (e.g. "penerangan-jalan-umum" vs "penerangan-jalan").
    // We resolve it to the canonical DB slug to ensure authority_rules lookup succeeds.
    if (triage.categorySlug && availableCategories.length > 0) {
      const exactMatch = availableCategories.find((c) => c.slug === triage.categorySlug);
      if (!exactMatch) {
        // Try substring match: DB slug is a prefix of AI slug, or AI slug starts with DB slug
        const substringMatch = availableCategories.find(
          (c) =>
            triage.categorySlug.startsWith(c.slug) ||
            c.slug.startsWith(triage.categorySlug)
        );
        if (substringMatch) {
          console.warn(
            `[AI Triage] Gemini returned categorySlug "${triage.categorySlug}" not in DB. ` +
            `Resolved to "${substringMatch.slug}" via substring match.`
          );
          triage.categorySlug = substringMatch.slug;
        } else {
          // Last resort: if the user provided a categoryName, try to match it
          const userCategoryMatch = input.categoryName
            ? availableCategories.find((c) => c.name === input.categoryName)
            : null;
          if (userCategoryMatch) {
            console.warn(
              `[AI Triage] Gemini returned categorySlug "${triage.categorySlug}" not in DB. ` +
              `Falling back to user-provided category "${userCategoryMatch.slug}".`
            );
            triage.categorySlug = userCategoryMatch.slug;
          } else {
            console.warn(
              `[AI Triage] Gemini returned categorySlug "${triage.categorySlug}" which does not match any DB category. ` +
              `Authority lookup may return zero candidates.`
            );
          }
        }
      }
    }

    // ──── STEP 2: Authority Recommendation from DB Rules ────
    let authorityRecommendation = triage.authorityRecommendation;

    if (triage.isValidComplaint && triage.categorySlug) {
      try {
        const dbCandidates = await getAuthorityCandidatesByCategorySlug(triage.categorySlug);

        if (dbCandidates.length > 0) {
          // Map DB candidates to AI-consumable format
          const aiCandidates: AuthorityCandidateForAI[] = dbCandidates.map((c) => ({
            rule_code: c.rule_code,
            institution_name: c.institution_name,
            institution_code: c.institution_code,
            unit_name: c.unit_name,
            unit_code: c.unit_code,
            context_title: c.context_title,
            context_description: c.context_description,
            regulation_basis: c.regulation_basis,
          }));

          authorityRecommendation = await recommendAuthorityWithAI({
            title: input.title,
            description: input.description,
            categorySlug: triage.categorySlug,
            categoryName: input.categoryName,
            districtName: input.districtName,
            subdistrictName: input.subdistrictName,
            addressDetail: input.addressDetail,
            candidates: aiCandidates,
          });

          // If AI successfully matched, also populate the legacy recommendedAuthority field
          if (
            authorityRecommendation.decision === "RECOMMEND" &&
            authorityRecommendation.institution_name
          ) {
            triage.recommendedAuthority = authorityRecommendation.institution_name;
          }
        } else {
          // No authority_rules for this category — NEEDS_REVIEW
          authorityRecommendation = {
            rule_code: null,
            decision: "NEEDS_REVIEW",
            confidence: 0,
            reasoning: `Belum ada aturan kewenangan terdaftar untuk kategori "${triage.categorySlug}".`,
            institution_name: null,
            institution_code: null,
            unit_name: null,
            unit_code: null,
            context_title: null,
          };
        }
      } catch (authErr) {
        console.warn("Authority recommendation step non-fatal error:", authErr);
        authorityRecommendation = {
          rule_code: null,
          decision: "NEEDS_REVIEW",
          confidence: 0,
          reasoning: "Gagal memproses rekomendasi kewenangan otomatis. Diperlukan review manual.",
          institution_name: null,
          institution_code: null,
          unit_name: null,
          unit_code: null,
          context_title: null,
        };
      }
    }

    // Attach authority recommendation to triage result
    triage.authorityRecommendation = authorityRecommendation;

    const processingTimeMs = Date.now() - startTime;

    // Persist audit log (non-fatal if it fails)
    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.from("ai_triage_logs").insert({
        report_id: null, // report not yet created at triage time
        prompt_version: "v1.1-authority-rules",
        model: getGeminiModel(),
        raw_request: {
          title: triageInput.title,
          description: triageInput.description.slice(0, 500),
          categoryName: triageInput.categoryName ?? null,
          districtName: triageInput.districtName ?? null,
          subdistrictName: triageInput.subdistrictName ?? null,
          evidenceCount: triageInput.evidenceUrls?.length ?? 0,
          authoritiesCount: triageInput.availableAuthorities?.length ?? 0,
        },
        raw_response: {
          categorySlug: triage.categorySlug,
          priority: triage.priority,
          confidence: triage.confidence,
          summary: triage.summary,
          recommendedAuthority: triage.recommendedAuthority,
          authorityRecommendation: authorityRecommendation
            ? {
                rule_code: authorityRecommendation.rule_code,
                decision: authorityRecommendation.decision,
                confidence: authorityRecommendation.confidence,
                institution_name: authorityRecommendation.institution_name,
                unit_name: authorityRecommendation.unit_name,
              }
            : null,
          isValidComplaint: triage.isValidComplaint,
        },
        processing_time_ms: processingTimeMs,
      });
    } catch (logErr) {
      console.warn("AI triage audit log non-fatal warning:", logErr);
    }

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
  emailSent?: boolean;
}

/**
 * Creates public report through the real backend data layer.
 * Validates with Zod server-side, generates tracking code, persists to Supabase.
 */
export async function submitReportAction(
  payload: CreateReportSchemaType,
  aiMetadata?: ReportAIMetadataType
): Promise<SubmitReportResult> {
  try {
    // 1. Authoritative Zod validation for payload and AI metadata
    const parsed = createReportSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Data formulir tidak valid";
      return { success: false, error: issue };
    }

    let validatedAiMetadata: ReportAIMetadataType | undefined = undefined;
    if (aiMetadata) {
      const metaParsed = reportAIMetadataSchema.safeParse(aiMetadata);
      if (metaParsed.success) {
        validatedAiMetadata = metaParsed.data;
      }
    }

    // 2. Authoritative server-side validation of authorityTarget:
    // Only permit authorityTarget if it strictly matches a verified authority from getAuthoritativeAuthorities().
    // If the authoritative list is empty, authorityTarget MUST remain null.
    const authoritativeAuthorities = await getAuthoritativeAuthorities();
    let finalAuthorityTarget: string | null = null;
    if (validatedAiMetadata?.authorityTarget && authoritativeAuthorities.length > 0) {
      const matched = authoritativeAuthorities.find(
        (a) =>
          a.name.toLowerCase() === validatedAiMetadata?.authorityTarget?.toLowerCase() ||
          a.code.toLowerCase() === validatedAiMetadata?.authorityTarget?.toLowerCase()
      );
      if (matched) {
        finalAuthorityTarget = matched.name;
      }
    }

    // 3. Priority resolution: Use validated AI priority if provided; fallback to 'medium' per domain contract
    const finalPriority: ReportPriority = validatedAiMetadata?.priority ?? "medium";

    const data = parsed.data;
    const adminSupabase = createAdminClient();

    // 4. Handle Reporter Record (if name/phone/email provided)
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

    // 5. Generate Tracking Code
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

    // 6. Insert Report Record
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
        priority: finalPriority,
        ai_confidence: validatedAiMetadata?.confidence ?? null,
        ai_summary: validatedAiMetadata?.summary ?? null,
        authority_target: finalAuthorityTarget,
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

    // 7. Associate recent AI triage log to this report record
    try {
      await adminSupabase
        .from("ai_triage_logs")
        .update({ report_id: newReport.id })
        .eq("raw_request->>title", newReport.title)
        .is("report_id", null);
    } catch (triageLinkErr) {
      console.warn("AI triage log association non-fatal warning:", triageLinkErr);
    }

    // 8. Optional Email Confirmation via Resend (Notification Layer)
    let emailSent = false;
    if (data.reporterEmail) {
      let resolvedCategoryName = "Pengaduan Publik";
      try {
        const { data: catData } = await adminSupabase
          .from("categories")
          .select("name_id")
          .eq("id", data.categoryId)
          .maybeSingle();
        if (catData?.name_id) {
          resolvedCategoryName = catData.name_id;
        }
      } catch {
        // non-fatal category name fallback
      }

      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://laporkito.id"}/pantau/${newReport.tracking_code}`;
      try {
        const emailResult = await sendReportSubmittedEmail({
          to: data.reporterEmail,
          reporterName: data.reporterName || "Warga Palembang",
          trackingCode: newReport.tracking_code,
          reportTitle: newReport.title,
          categoryName: resolvedCategoryName,
          trackingUrl,
        });
        emailSent = emailResult.success;
        if (!emailResult.success) {
          console.warn("Resend email notification non-fatal failure:", emailResult.error || emailResult.reason);
        }
      } catch (emailErr) {
        console.warn("Resend email notification warning:", emailErr);
      }
    }

    return {
      success: true,
      trackingCode: newReport.tracking_code,
      emailSent: data.reporterEmail ? emailSent : undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan tidak terduga saat membuat laporan";
    return { success: false, error: message };
  }
}

// ====================================================================
// PHASE 6A: INTERNAL OPERATIONAL WORKFLOW (PETUGAS & ADMIN)
// ====================================================================

/**
 * Verify caller is an active internal staff member (admin or petugas).
 */
async function requireStaff() {
  const { isAuthenticated, internalUser } = await getCurrentInternalUser();
  if (!isAuthenticated || !internalUser) {
    throw new Error("Sesi kedinasan tidak valid. Silakan masuk kembali.");
  }
  if (!internalUser.is_active) {
    throw new Error("Akun Anda dinonaktifkan. Hubungi Administrator Sistem.");
  }
  if (internalUser.role !== "admin" && internalUser.role !== "petugas") {
    throw new Error("Akses ditolak: Bukan staf kedinasan yang berwenang.");
  }
  return internalUser;
}

export interface InternalReportListItem {
  id: string;
  tracking_code: string;
  title: string;
  description: string;
  address_detail: string;
  category_id: string | null;
  category_name: string;
  category_slug: string | null;
  kelurahan_id: string | null;
  kelurahan_name: string | null;
  kecamatan_name: string | null;
  status: ReportStatus;
  priority: ReportPriority;
  ai_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface InternalReportsFilter {
  search?: string;
  status?: ReportStatus | "all";
  priority?: ReportPriority | "all";
  categoryId?: string | "all";
  sortBy?: "newest" | "oldest" | "priority_desc";
}

export interface InternalReportsResponse {
  success: boolean;
  data: InternalReportListItem[];
  totalCount: number;
  error?: string;
}

export interface InternalReportDetailData {
  report: {
    id: string;
    tracking_code: string;
    title: string;
    description: string;
    address_detail: string;
    latitude: number | null;
    longitude: number | null;
    status: ReportStatus;
    priority: ReportPriority;
    ai_confidence: number | null;
    ai_summary: string | null;
    authority_target: string | null;
    created_at: string;
    updated_at: string;
  };
  category: {
    id: string;
    name_id: string;
    slug: string;
    description: string | null;
  } | null;
  location: {
    kelurahan_name: string | null;
    kecamatan_name: string | null;
  };
  reporter: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    verification_count: number;
    created_at: string;
  } | null;
  evidence: Array<{
    id: string;
    file_url: string;
    file_type: string;
    file_size: number;
    caption: string | null;
    ai_is_valid: boolean | null;
    created_at: string;
  }>;
  timeline: Array<{
    id: string;
    actor_id: string | null;
    actor_role: string;
    action: string;
    notes: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>;
  aiTriage: {
    hasData: boolean;
    model?: string;
    confidence?: number | null;
    summary?: string | null;
    reasoning?: string | null;
    priority?: ReportPriority | null;
    categorySlug?: string | null;
    recommendedAuthority?: string | null;
    decision?: "RECOMMEND" | "NEEDS_REVIEW" | null;
    ruleCode?: string | null;
    processingTimeMs?: number | null;
    createdAt?: string;
  } | null;
  authorityRule: {
    hasData: boolean;
    rule_code?: string;
    context_title?: string;
    context_description?: string | null;
    regulation_basis?: string;
    institution?: {
      code: string;
      name: string;
      short_name: string | null;
    } | null;
    unit?: {
      code: string;
      name: string;
    } | null;
  } | null;
}

export interface InternalReportDetailResult {
  success: boolean;
  data?: InternalReportDetailData;
  error?: string;
}

/**
 * Fetch reports for internal operational inbox (Admin & Petugas).
 * Strictly server-authorized via requireStaff.
 */
export async function getInternalReportsAction(
  filters?: InternalReportsFilter
): Promise<InternalReportsResponse> {
  try {
    await requireStaff();
    const adminSupabase = createAdminClient();

    let query = adminSupabase.from("reports").select(`
      id,
      tracking_code,
      title,
      description,
      address_detail,
      category_id,
      kelurahan_id,
      status,
      priority,
      ai_confidence,
      created_at,
      updated_at
    `);

    // Status filter
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // Priority filter
    if (filters?.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }

    // Category filter
    if (filters?.categoryId && filters.categoryId !== "all") {
      query = query.eq("category_id", filters.categoryId);
    }

    // Initial SQL sort order
    if (filters?.sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: reports, error } = await query;
    if (error) {
      console.error("getInternalReportsAction error:", error);
      return { success: false, data: [], totalCount: 0, error: "Gagal memuat daftar laporan dari basis data." };
    }

    // Load category and geographic reference lookups in parallel
    const [catRes, kelRes, kecRes] = await Promise.all([
      adminSupabase.from("categories").select("id, name_id, slug"),
      adminSupabase.from("kelurahan").select("id, name, kecamatan_id"),
      adminSupabase.from("kecamatan").select("id, name"),
    ]);

    const catMap = new Map((catRes.data || []).map((c) => [c.id, { name: c.name_id, slug: c.slug }]));
    const kecMap = new Map((kecRes.data || []).map((k) => [k.id, k.name]));
    const kelMap = new Map(
      (kelRes.data || []).map((kl) => [
        kl.id,
        { name: kl.name, kecamatanName: kecMap.get(kl.kecamatan_id) || null },
      ])
    );

    let items: InternalReportListItem[] = (reports || []).map((r) => {
      const catInfo = r.category_id ? catMap.get(r.category_id) : undefined;
      const kelInfo = r.kelurahan_id ? kelMap.get(r.kelurahan_id) : undefined;
      return {
        id: r.id,
        tracking_code: r.tracking_code,
        title: r.title,
        description: r.description,
        address_detail: r.address_detail,
        category_id: r.category_id,
        category_name: catInfo?.name || "Kategori Umum",
        category_slug: catInfo?.slug || null,
        kelurahan_id: r.kelurahan_id,
        kelurahan_name: kelInfo?.name || null,
        kecamatan_name: kelInfo?.kecamatanName || null,
        status: r.status,
        priority: r.priority,
        ai_confidence: r.ai_confidence,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    // In-memory multi-field search across tracking code, title, description, address, category, location
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter((item) => {
        return (
          item.tracking_code.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.address_detail.toLowerCase().includes(q) ||
          item.category_name.toLowerCase().includes(q) ||
          (item.kelurahan_name && item.kelurahan_name.toLowerCase().includes(q)) ||
          (item.kecamatan_name && item.kecamatan_name.toLowerCase().includes(q))
        );
      });
    }

    // Priority sort if requested
    if (filters?.sortBy === "priority_desc") {
      const priorityWeight: Record<ReportPriority, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      items.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    }

    return {
      success: true,
      data: items,
      totalCount: items.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem saat memuat laporan";
    return { success: false, data: [], totalCount: 0, error: msg };
  }
}

/**
 * Fetch full report details for authorized internal staff inspection (Phase 6A Read-Only).
 * Accepts either UUID id or tracking_code string.
 */
export async function getInternalReportDetailAction(
  idOrCode: string
): Promise<InternalReportDetailResult> {
  try {
    await requireStaff();
    const adminSupabase = createAdminClient();

    const cleanInput = idOrCode.trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanInput);

    let reportQuery = adminSupabase.from("reports").select("*");
    if (isUUID) {
      reportQuery = reportQuery.eq("id", cleanInput);
    } else {
      reportQuery = reportQuery.eq("tracking_code", cleanInput.toUpperCase());
    }

    const { data: report, error: repError } = await reportQuery.maybeSingle();

    if (repError || !report) {
      return {
        success: false,
        error: `Laporan "${cleanInput}" tidak ditemukan dalam sistem.`,
      };
    }

    // Fetch related records in parallel: category, kelurahan, reporter, evidence, timeline, ai log
    const [catRes, kelRes, reporterRes, evRes, tlRes, aiLogRes] = await Promise.all([
      report.category_id
        ? adminSupabase
            .from("categories")
            .select("id, name_id, slug, description")
            .eq("id", report.category_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      report.kelurahan_id
        ? adminSupabase
            .from("kelurahan")
            .select("id, name, kecamatan_id")
            .eq("id", report.kelurahan_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      report.reporter_id
        ? adminSupabase
            .from("reporters")
            .select("id, full_name, email, phone, verification_count, created_at")
            .eq("id", report.reporter_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      adminSupabase
        .from("report_evidence")
        .select("id, file_url, file_type, file_size, caption, ai_is_valid, created_at")
        .eq("report_id", report.id)
        .order("created_at", { ascending: true }),
      adminSupabase
        .from("report_timeline")
        .select("id, actor_id, actor_role, action, notes, metadata, created_at")
        .eq("report_id", report.id)
        .order("created_at", { ascending: true }),
      adminSupabase
        .from("ai_triage_logs")
        .select("id, model, raw_request, raw_response, processing_time_ms, created_at")
        .eq("report_id", report.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Resolve kecamatan if kelurahan exists
    let kecamatanName: string | null = null;
    const kelurahanData = kelRes.data;
    if (kelurahanData?.kecamatan_id) {
      const { data: kecData } = await adminSupabase
        .from("kecamatan")
        .select("name")
        .eq("id", kelurahanData.kecamatan_id)
        .maybeSingle();
      if (kecData?.name) kecamatanName = kecData.name;
    }

    // Resolve AI Triage data from log or fallback to persisted reports fields
    let aiLog = aiLogRes.data;
    if (!aiLog && report.title) {
      // Fallback search by title if log association was delayed
      const { data: fallbackLog } = await adminSupabase
        .from("ai_triage_logs")
        .select("id, model, raw_request, raw_response, processing_time_ms, created_at")
        .eq("raw_request->>title", report.title)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fallbackLog) aiLog = fallbackLog;
    }

    let aiTriageData: InternalReportDetailData["aiTriage"] = null;
    let recommendedRuleCode: string | null = null;

    if (aiLog && aiLog.raw_response) {
      const rawResp = aiLog.raw_response as Record<string, unknown>;
      const authRec = rawResp.authorityRecommendation as Record<string, unknown> | undefined;
      recommendedRuleCode = (authRec?.rule_code as string) || null;

      aiTriageData = {
        hasData: true,
        model: aiLog.model,
        confidence: typeof rawResp.confidence === "number" ? rawResp.confidence : report.ai_confidence,
        summary: (rawResp.summary as string) || report.ai_summary || null,
        reasoning: (rawResp.reasoning as string) || null,
        priority: (rawResp.priority as ReportPriority) || report.priority,
        categorySlug: (rawResp.categorySlug as string) || null,
        recommendedAuthority: (rawResp.recommendedAuthority as string) || report.authority_target || null,
        decision: (authRec?.decision as "RECOMMEND" | "NEEDS_REVIEW") || null,
        ruleCode: recommendedRuleCode,
        processingTimeMs: aiLog.processing_time_ms,
        createdAt: aiLog.created_at,
      };
    } else if (report.ai_summary || report.ai_confidence !== null) {
      aiTriageData = {
        hasData: true,
        confidence: report.ai_confidence,
        summary: report.ai_summary,
        priority: report.priority,
        recommendedAuthority: report.authority_target,
      };
    } else {
      aiTriageData = {
        hasData: false,
      };
    }

    // Resolve authoritative legal rule from public.authority_rules
    let authorityRuleData: InternalReportDetailData["authorityRule"] = null;

    if (recommendedRuleCode) {
      const { data: ruleWithRels } = await adminSupabase
        .from("authority_rules")
        .select(`
          rule_code,
          context_title,
          context_description,
          regulation_basis,
          institutions(code, name, short_name),
          institution_units(code, name)
        `)
        .eq("rule_code", recommendedRuleCode)
        .maybeSingle();

      if (ruleWithRels) {
        const inst = ruleWithRels.institutions as unknown as { code: string; name: string; short_name: string | null } | null;
        const unit = ruleWithRels.institution_units as unknown as { code: string; name: string } | null;
        authorityRuleData = {
          hasData: true,
          rule_code: ruleWithRels.rule_code,
          context_title: ruleWithRels.context_title,
          context_description: ruleWithRels.context_description,
          regulation_basis: ruleWithRels.regulation_basis,
          institution: inst ? { code: inst.code, name: inst.name, short_name: inst.short_name } : null,
          unit: unit ? { code: unit.code, name: unit.name } : null,
        };
      }
    }

    // Fallback rule match by category if not resolved by rule code
    if (!authorityRuleData && report.category_id) {
      const { data: fallbackRule } = await adminSupabase
        .from("authority_rules")
        .select(`
          rule_code,
          context_title,
          context_description,
          regulation_basis,
          institutions(code, name, short_name),
          institution_units(code, name)
        `)
        .eq("category_id", report.category_id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fallbackRule) {
        const inst = fallbackRule.institutions as unknown as { code: string; name: string; short_name: string | null } | null;
        const unit = fallbackRule.institution_units as unknown as { code: string; name: string } | null;
        authorityRuleData = {
          hasData: true,
          rule_code: fallbackRule.rule_code,
          context_title: fallbackRule.context_title,
          context_description: fallbackRule.context_description,
          regulation_basis: fallbackRule.regulation_basis,
          institution: inst ? { code: inst.code, name: inst.name, short_name: inst.short_name } : null,
          unit: unit ? { code: unit.code, name: unit.name } : null,
        };
      }
    }

    // Fallback if authority_target is set in reports but no authority_rules match
    if (!authorityRuleData && report.authority_target) {
      const { data: matchedInst } = await adminSupabase
        .from("institutions")
        .select("code, name, short_name")
        .or(`name.ilike.%${report.authority_target}%,short_name.ilike.%${report.authority_target}%`)
        .limit(1)
        .maybeSingle();

      if (matchedInst) {
        authorityRuleData = {
          hasData: true,
          context_title: `Kewenangan ${matchedInst.name}`,
          regulation_basis: "Peraturan Wali Kota Palembang tentang Tugas Pokok dan Fungsi Perangkat Daerah",
          institution: {
            code: matchedInst.code,
            name: matchedInst.name,
            short_name: matchedInst.short_name,
          },
          unit: null,
        };
      }
    }

    return {
      success: true,
      data: {
        report: {
          id: report.id,
          tracking_code: report.tracking_code,
          title: report.title,
          description: report.description,
          address_detail: report.address_detail,
          latitude: report.latitude,
          longitude: report.longitude,
          status: report.status,
          priority: report.priority,
          ai_confidence: report.ai_confidence,
          ai_summary: report.ai_summary,
          authority_target: report.authority_target,
          created_at: report.created_at,
          updated_at: report.updated_at,
        },
        category: catRes.data || null,
        location: {
          kelurahan_name: kelurahanData?.name || null,
          kecamatan_name: kecamatanName,
        },
        reporter: reporterRes.data
          ? {
              id: reporterRes.data.id,
              full_name: reporterRes.data.full_name,
              email: reporterRes.data.email,
              phone: reporterRes.data.phone,
              verification_count: reporterRes.data.verification_count,
              created_at: reporterRes.data.created_at,
            }
          : null,
        evidence: (evRes.data || []).map((e) => ({
          id: e.id,
          file_url: e.file_url,
          file_type: e.file_type,
          file_size: e.file_size,
          caption: e.caption,
          ai_is_valid: e.ai_is_valid,
          created_at: e.created_at,
        })),
        timeline: (tlRes.data || []).map((t) => ({
          id: t.id,
          actor_id: t.actor_id,
          actor_role: t.actor_role,
          action: t.action,
          notes: t.notes,
          metadata: t.metadata as Record<string, unknown> | null,
          created_at: t.created_at,
        })),
        aiTriage: aiTriageData,
        authorityRule: authorityRuleData,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Kesalahan saat memuat detail laporan";
    return { success: false, error: msg };
  }
}

