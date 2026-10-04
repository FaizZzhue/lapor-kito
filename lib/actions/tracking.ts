"use server";

import { createClient } from "@/lib/supabase/server";
import { trackingSearchSchema } from "@/lib/validators/report";
import type { Database } from "@/types/database";

export type PublicReportData =
  Database["public"]["Functions"]["get_public_report_by_tracking_code"]["Returns"][0];

export interface TrackingLookupResult {
  success: boolean;
  report?: PublicReportData;
  categoryName?: string;
  kelurahanName?: string;
  kecamatanName?: string;
  evidence?: Array<{ id: string; file_url: string; caption: string | null }>;
  timeline?: Array<{
    id: string;
    action: string;
    notes: string | null;
    created_at: string;
  }>;
  responses?: Array<{
    id: string;
    response_type: string;
    message: string;
    created_at: string;
  }>;
  error?: string;
}

/**
 * Public tracking lookup using the secure database function:
 * get_public_report_by_tracking_code
 * Strictly exposes ONLY public fields.
 */
export async function getPublicReportAction(
  rawTrackingCode: string
): Promise<TrackingLookupResult> {
  try {
    const parsed = trackingSearchSchema.safeParse({ trackingCode: rawTrackingCode });
    if (!parsed.success) {
      return {
        success: false,
        error: "Format kode lacak tidak valid. Format yang benar: LPK-YYYYMMDD-XXXX (contoh: LPK-20261002-7A9B)",
      };
    }

    const cleanCode = parsed.data.trackingCode.toUpperCase().trim();
    const supabase = await createClient();

    // 1. Call secure RPC function
    const { data: reportRows, error: rpcError } = await supabase.rpc(
      "get_public_report_by_tracking_code",
      { target_tracking_code: cleanCode }
    );

    let report: PublicReportData | null = null;

    if (!rpcError && reportRows && reportRows.length > 0) {
      report = reportRows[0];
    } else {
      // Fallback query if RPC has not been migrated
      const { data: directRow, error: directError } = await supabase
        .from("reports")
        .select(
          "id, tracking_code, category_id, kelurahan_id, title, description, address_detail, latitude, longitude, status, priority, authority_target, created_at, updated_at"
        )
        .eq("tracking_code", cleanCode)
        .maybeSingle();

      if (directError || !directRow) {
        return {
          success: false,
          error: `Laporan dengan kode "${cleanCode}" tidak ditemukan dalam sistem.`,
        };
      }
      report = directRow as PublicReportData;
    }

    if (!report) {
      return {
        success: false,
        error: `Laporan dengan kode "${cleanCode}" tidak ditemukan.`,
      };
    }

    // 2. Fetch public category name if category_id exists
    let categoryName = "Infrastruktur / Layanan Publik";
    if (report.category_id) {
      const { data: cat } = await supabase
        .from("categories")
        .select("name_id")
        .eq("id", report.category_id)
        .maybeSingle();
      if (cat?.name_id) categoryName = cat.name_id;
    }

    // 3. Fetch public kelurahan & kecamatan names
    let kelurahanName = "";
    let kecamatanName = "";
    if (report.kelurahan_id) {
      const { data: kel } = await supabase
        .from("kelurahan")
        .select("name, kecamatan_id")
        .eq("id", report.kelurahan_id)
        .maybeSingle();
      if (kel?.name) {
        kelurahanName = kel.name;
        if (kel.kecamatan_id) {
          const { data: kec } = await supabase
            .from("kecamatan")
            .select("name")
            .eq("id", kel.kecamatan_id)
            .maybeSingle();
          if (kec?.name) kecamatanName = kec.name;
        }
      }
    }

    // 4. Fetch public evidence
    const { data: evidenceRows } = await supabase
      .from("report_evidence")
      .select("id, file_url, caption")
      .eq("report_id", report.id);

    // 5. Fetch public timeline (excluding internal metadata per RLS)
    const { data: timelineRows } = await supabase
      .from("report_timeline")
      .select("id, action, notes, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });

    // 6. Fetch public responses (is_public = true)
    const { data: responseRows } = await supabase
      .from("report_responses")
      .select("id, response_type, message, created_at")
      .eq("report_id", report.id)
      .eq("is_public", true)
      .order("created_at", { ascending: true });

    return {
      success: true,
      report,
      categoryName,
      kelurahanName,
      kecamatanName,
      evidence: evidenceRows || [],
      timeline: timelineRows || [],
      responses: responseRows || [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan sistem pelacakan";
    return { success: false, error: message };
  }
}
