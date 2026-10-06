'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentInternalUser } from '@/lib/auth/session';
import type { ReportStatus } from '@/types/database';

// ====================================================================
// TYPES
// ====================================================================

export interface DashboardMetrics {
  // Master data counts
  totalCategories: number;
  totalInstitutions: number;
  totalUnits: number;
  totalAuthorityRules: number;
  totalActiveStaff: number;

  // Report counts by status
  totalReports: number;
  reportsByStatus: Record<ReportStatus, number>;

  // Recent activity sources
  recentTimelineCount: number;
  recentResponsesCount: number;
}

// ====================================================================
// AUTH
// ====================================================================

async function requireStaff() {
  const { isAuthenticated, internalUser } = await getCurrentInternalUser();
  if (!isAuthenticated || !internalUser) {
    throw new Error('Sesi kedinasan tidak valid.');
  }
  if (!internalUser.is_active) {
    throw new Error('Akun dinonaktifkan.');
  }
  return internalUser;
}

// ====================================================================
// DASHBOARD DATA
// ====================================================================

/**
 * Fetch real-time dashboard metrics from Supabase.
 * Available to active internal staff (admin or petugas with admin layout access).
 */
export async function getDashboardMetricsAction(): Promise<{
  success: boolean;
  data: DashboardMetrics | null;
  error?: string;
}> {
  try {
    await requireStaff();
    const supabase = await createClient();

    // Parallel queries for all counts
    const [
      catRes,
      instRes,
      unitRes,
      ruleRes,
      staffRes,
      reportRes,
      timelineRes,
      responsesRes,
    ] = await Promise.all([
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('institutions').select('*', { count: 'exact', head: true }),
      supabase.from('institution_units').select('*', { count: 'exact', head: true }),
      supabase.from('authority_rules').select('*', { count: 'exact', head: true }),
      supabase.from('internal_users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('reports').select('id, status'),
      supabase.from('report_timeline').select('*', { count: 'exact', head: true }),
      supabase.from('report_responses').select('*', { count: 'exact', head: true }),
    ]);

    // Build status breakdown from actual reports
    const statusCounts: Record<ReportStatus, number> = {
      draft: 0,
      submitted: 0,
      verifying: 0,
      verified: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      duplicate: 0,
    };

    const reports = reportRes.data ?? [];
    for (const r of reports) {
      const status = r.status as ReportStatus;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    }

    const metrics: DashboardMetrics = {
      totalCategories: catRes.count ?? 0,
      totalInstitutions: instRes.count ?? 0,
      totalUnits: unitRes.count ?? 0,
      totalAuthorityRules: ruleRes.count ?? 0,
      totalActiveStaff: staffRes.count ?? 0,
      totalReports: reports.length,
      reportsByStatus: statusCounts,
      recentTimelineCount: timelineRes.count ?? 0,
      recentResponsesCount: responsesRes.count ?? 0,
    };

    return { success: true, data: metrics };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Gagal memuat data dashboard.',
    };
  }
}
