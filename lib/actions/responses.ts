"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createResponseSchema,
  createOfficialResponseSchema,
  type CreateResponseSchemaType,
  type CreateOfficialResponseSchemaType,
} from "@/lib/validators/tanggapan";
import { trackingSearchSchema } from "@/lib/validators/report";
import { getCurrentInternalUser } from "@/lib/auth/session";
import { sendOfficialResponseEmail } from "@/lib/email/resend";
import { resolveReportInstitutionAssignment } from "@/lib/actions/reports";

export interface CreateOfficialResponseResult {
  success: boolean;
  responseId?: string;
  timelineId?: string;
  emailSent?: boolean;
  error?: string;
}

export interface SubmitReporterResponseResult {
  success: boolean;
  responseId?: string;
  timelineId?: string;
  error?: string;
  isBlockedByAuth?: boolean;
}

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

/**
 * Creates an official response from authorized Petugas/Admin to citizens.
 * 
 * Enforces:
 * 1. Active staff session verification (requireStaff)
 * 2. Zod validation of message and responseType
 * 3. Report existence verification
 * 4. Atomic insertion of response and report_timeline (with compensating rollback)
 * 5. Email notification to reporter (non-fatal if email fails)
 * 6. Cache revalidation across internal and public tracking routes
 */
export async function createReportResponseAction(
  input: CreateOfficialResponseSchemaType
): Promise<CreateOfficialResponseResult> {
  try {
    // 1. Authorize staff
    const staff = await requireStaff();

    // 2. Validate input schema
    const parsed = createOfficialResponseSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Format tanggapan tidak valid";
      return { success: false, error: issue };
    }

    const { reportId, message, responseType } = parsed.data;
    const adminSupabase = createAdminClient();

    // 3. Verify report exists
    let report: {
      id: string;
      tracking_code: string;
      title: string;
      reporter_id?: string | null;
      category_id?: string | null;
      authority_target?: string | null;
      assigned_institution_id?: string | null;
      assigned_unit_id?: string | null;
    } | null = null;

    const { data: repWithAssigned, error: assignedErr } = await adminSupabase
      .from("reports")
      .select("id, tracking_code, title, reporter_id, category_id, authority_target, assigned_institution_id, assigned_unit_id")
      .eq("id", reportId)
      .maybeSingle();

    if (!assignedErr && repWithAssigned) {
      report = repWithAssigned;
    } else {
      const { data: baseRep, error: baseErr } = await adminSupabase
        .from("reports")
        .select("id, tracking_code, title, reporter_id, category_id, authority_target")
        .eq("id", reportId)
        .maybeSingle();

      if (baseErr || !baseRep) {
        return {
          success: false,
          error: "Laporan tidak ditemukan dalam sistem.",
        };
      }
      report = baseRep;
    }

    // STRICT SERVER AUTHORIZATION: Petugas can only respond to reports assigned to their institution
    if (staff.role === "petugas") {
      const assignment = await resolveReportInstitutionAssignment(report as any, adminSupabase);
      if (!staff.institution_id || !assignment.institutionId || assignment.institutionId !== staff.institution_id) {
        return {
          success: false,
          error: "Akses ditolak: Anda hanya dapat memberikan tanggapan resmi pada laporan yang ditugaskan kepada instansi Anda.",
        };
      }
    }

    // 4. Persist response in report_responses
    const { data: insertedResponse, error: respError } = await adminSupabase
      .from("report_responses")
      .insert({
        report_id: report.id,
        responder_id: staff.id,
        response_type: responseType || "official",
        message: message.trim(),
        attachments: [],
        is_public: true,
      })
      .select("id")
      .single();

    if (respError || !insertedResponse) {
      console.error("Failed to insert report response:", respError);
      return {
        success: false,
        error: "Gagal menyimpan tanggapan resmi ke basis data.",
      };
    }

    // 5. Atomic timeline audit recording
    const { data: insertedTimeline, error: timelineError } = await adminSupabase
      .from("report_timeline")
      .insert({
        report_id: report.id,
        actor_id: staff.id,
        actor_role: staff.role,
        action: "Tanggapan Resmi Dikirim",
        notes: message.trim(),
        metadata: {
          is_internal: false,
          response_type: responseType || "official",
          responder_name: staff.full_name,
        },
      })
      .select("id")
      .single();

    if (timelineError || !insertedTimeline) {
      console.error(
        "Timeline insert failed for official response. Executing compensating rollback:",
        timelineError
      );
      // Compensating rollback: delete created response
      await adminSupabase.from("report_responses").delete().eq("id", insertedResponse.id);
      return {
        success: false,
        error: "Gagal mencatat linimasa tanggapan resmi. Operasi dibatalkan.",
      };
    }

    // 6. Non-fatal Email Notification
    let emailSent = false;
    if (report.reporter_id) {
      try {
        const { data: reporterData } = await adminSupabase
          .from("reporters")
          .select("email, full_name")
          .eq("id", report.reporter_id)
          .maybeSingle();

        if (reporterData?.email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://laporkito.id";
          const trackingUrl = `${appUrl}/pantau/${report.tracking_code}`;

          const emailRes = await sendOfficialResponseEmail({
            to: reporterData.email,
            reporterName: reporterData.full_name || "Warga Palembang",
            trackingCode: report.tracking_code,
            reportTitle: report.title,
            responseMessage: message.trim(),
            trackingUrl,
          });

          emailSent = emailRes.success;
          if (!emailRes.success) {
            console.warn(
              "Official response notification email non-fatal failure:",
              emailRes.error || emailRes.reason
            );
          }
        }
      } catch (emailErr) {
        console.warn("Email notification error (non-fatal):", emailErr);
      }
    }

    // 7. Cache revalidation
    try {
      revalidatePath("/admin/laporan");
      revalidatePath(`/admin/laporan/${report.id}`);
      revalidatePath(`/admin/laporan/${report.tracking_code}`);
      revalidatePath(`/pantau/${report.tracking_code}`);
      revalidatePath(`/pantau/${report.tracking_code}/tanggapan`);
    } catch {
      // Safe fallback when executed outside Next.js request context (e.g. CLI E2E tests)
    }

    return {
      success: true,
      responseId: insertedResponse.id,
      timelineId: insertedTimeline.id,
      emailSent,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem saat membuat tanggapan";
    return { success: false, error: msg };
  }
}

/**
 * Handles public citizen/reporter responses.
 * Enforces ownership verification: requires reporter email/phone verification matching the report.
 * Does not allow arbitrary guests to post responses on another person's report.
 */
export async function submitReporterResponseAction(
  trackingCode: string,
  payload: {
    message: string;
    attachments?: Array<{ url: string; name: string; type?: string }>;
  },
  verificationEmail?: string
): Promise<SubmitReporterResponseResult> {
  try {
    // 1. Validate tracking code format
    const parsedCode = trackingSearchSchema.safeParse({ trackingCode });
    if (!parsedCode.success) {
      return { success: false, error: "Format kode lacak tidak valid." };
    }

    const cleanCode = parsedCode.data.trackingCode.toUpperCase().trim();
    const adminSupabase = createAdminClient();

    // 2. Fetch report and reporter data server-side
    const { data: report, error: reportErr } = await adminSupabase
      .from("reports")
      .select("id, tracking_code, reporter_id")
      .eq("tracking_code", cleanCode)
      .maybeSingle();

    if (reportErr || !report) {
      return {
        success: false,
        error: `Laporan #${cleanCode} tidak ditemukan dalam sistem.`,
      };
    }

    // 3. Ownership Verification Boundary Check
    if (!report.reporter_id) {
      // Report was submitted completely anonymously without any contact information
      return {
        success: false,
        isBlockedByAuth: true,
        error:
          "Laporan ini didaftarkan tanpa data kontak pelapor (anonim murni). Demi integritas berkas dan mencegah tanggapan dari pihak yang tidak berwenang, penambahan keterangan harus melalui verifikasi petugas.",
      };
    }

    const { data: reporter, error: repErr } = await adminSupabase
      .from("reporters")
      .select("id, email, phone")
      .eq("id", report.reporter_id)
      .maybeSingle();

    if (repErr || !reporter) {
      return {
        success: false,
        isBlockedByAuth: true,
        error: "Data kepemilikan pelapor tidak dapat diverifikasi.",
      };
    }

    // Require email verification matching registered reporter email
    if (reporter.email) {
      if (!verificationEmail || !verificationEmail.trim()) {
        return {
          success: false,
          isBlockedByAuth: true,
          error:
            "Masukkan alamat email yang Anda gunakan saat pertama kali membuat laporan untuk memverifikasi kepemilikan.",
        };
      }

      if (verificationEmail.trim().toLowerCase() !== reporter.email.trim().toLowerCase()) {
        return {
          success: false,
          isBlockedByAuth: true,
          error:
            "Email verifikasi tidak cocok dengan data kontak pelapor laporan ini. Anda hanya dapat membalas laporan milik Anda sendiri.",
        };
      }
    } else if (reporter.phone) {
      // If reporter registered with phone only, check phone
      if (!verificationEmail || !verificationEmail.trim()) {
        return {
          success: false,
          isBlockedByAuth: true,
          error: "Masukkan nomor HP yang Anda gunakan saat membuat laporan untuk verifikasi.",
        };
      }

      const cleanInput = verificationEmail.trim().replace(/\D/g, "");
      const cleanPhone = reporter.phone.trim().replace(/\D/g, "");
      if (cleanInput !== cleanPhone) {
        return {
          success: false,
          isBlockedByAuth: true,
          error: "Nomor HP verifikasi tidak cocok dengan data pelapor terdaftar.",
        };
      }
    }

    // 4. Validate response message with Zod
    const responsePayload: CreateResponseSchemaType = {
      reportId: report.id,
      responseType: "clarification",
      message: payload.message.trim(),
      isPublic: true,
      attachments: payload.attachments || [],
    };

    const parsedResponse = createResponseSchema.safeParse(responsePayload);
    if (!parsedResponse.success) {
      const issue = parsedResponse.error.issues[0]?.message || "Format tanggapan tidak valid";
      return { success: false, error: issue };
    }

    // 5. Persist response in report_responses
    const { data: insertedResp, error: insertErr } = await adminSupabase
      .from("report_responses")
      .insert({
        report_id: report.id,
        responder_id: null, // Citizen clarification (non-internal staff)
        response_type: "clarification",
        message: parsedResponse.data.message,
        attachments: parsedResponse.data.attachments,
        is_public: true,
      })
      .select("id")
      .single();

    if (insertErr || !insertedResp) {
      console.error("Failed to insert report response:", insertErr);
      return {
        success: false,
        error: "Gagal menyimpan tanggapan ke basis data.",
      };
    }

    // 6. Record in report_timeline with compensating rollback
    const { data: insertedTimeline, error: timelineErr } = await adminSupabase
      .from("report_timeline")
      .insert({
        report_id: report.id,
        actor_role: "reporter",
        action: "Balasan Pelapor Diterima",
        notes: parsedResponse.data.message,
        metadata: { is_internal: false },
      })
      .select("id")
      .single();

    if (timelineErr || !insertedTimeline) {
      console.error(
        "Timeline insert failed for citizen response. Executing compensating rollback:",
        timelineErr
      );
      await adminSupabase.from("report_responses").delete().eq("id", insertedResp.id);
      return {
        success: false,
        error: "Gagal mencatat riwayat linimasa balasan. Tanggapan dibatalkan.",
      };
    }

    // 7. Cache revalidation
    try {
      revalidatePath("/admin/laporan");
      revalidatePath(`/admin/laporan/${report.id}`);
      revalidatePath(`/admin/laporan/${cleanCode}`);
      revalidatePath(`/pantau/${cleanCode}`);
      revalidatePath(`/pantau/${cleanCode}/tanggapan`);
    } catch {
      // Safe fallback when executed outside Next.js request context (e.g. CLI E2E tests)
    }

    return {
      success: true,
      responseId: insertedResp.id,
      timelineId: insertedTimeline.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan sistem tanggapan";
    return { success: false, error: message };
  }
}
