"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createResponseSchema, type CreateResponseSchemaType } from "@/lib/validators/tanggapan";
import { trackingSearchSchema } from "@/lib/validators/report";

export interface SubmitReporterResponseResult {
  success: boolean;
  error?: string;
  isBlockedByAuth?: boolean;
}

/**
 * Handles public citizen/reporter responses.
 * Enforces ownership verification: requires reporter email verification matching the report.
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
    const { error: insertErr } = await adminSupabase.from("report_responses").insert({
      report_id: report.id,
      responder_id: null, // Citizen clarification (non-internal staff)
      response_type: "clarification",
      message: parsedResponse.data.message,
      attachments: parsedResponse.data.attachments,
      is_public: true,
    });

    if (insertErr) {
      console.error("Failed to insert report response:", insertErr);
      return {
        success: false,
        error: "Gagal menyimpan tanggapan ke basis data.",
      };
    }

    // 6. Record in report_timeline
    try {
      await adminSupabase.from("report_timeline").insert({
        report_id: report.id,
        actor_role: "reporter",
        action: "Tanggapan Warga",
        notes: "Warga memberikan keterangan atau klarifikasi tambahan.",
        metadata: { is_internal: false },
      });
    } catch {
      // Non-fatal audit log warning
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan sistem tanggapan";
    return { success: false, error: message };
  }
}
