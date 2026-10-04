import type { Database, ReportPriority, ReportStatus, ResponseType } from './database'
import type { Kecamatan, Kelurahan } from './location'

export type { ReportPriority, ReportStatus, ResponseType }

export type ReportRow = Database['public']['Tables']['reports']['Row']
export type ReporterRow = Database['public']['Tables']['reporters']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type ReportEvidenceRow = Database['public']['Tables']['report_evidence']['Row']
export type ReportTimelineRow = Database['public']['Tables']['report_timeline']['Row']
export type ReportResponseRow = Database['public']['Tables']['report_responses']['Row']
export type PublicTrackingReport = Database['public']['Functions']['get_public_report_by_tracking_code']['Returns'][number]

export interface ReportWithDetails extends ReportRow {
  reporter?: ReporterRow | null
  category?: CategoryRow | null
  kelurahan?: (Kelurahan & { kecamatan?: Kecamatan | null }) | null
  evidence?: ReportEvidenceRow[]
  timeline?: ReportTimelineRow[]
  responses?: ReportResponseRow[]
}

export interface CreateReportInput {
  title: string
  description: string
  categoryId: string
  kecamatanId: string
  kelurahanId: string
  addressDetail: string
  latitude?: number | null
  longitude?: number | null
  reporterName?: string
  reporterPhone?: string
  reporterEmail?: string
  evidenceFiles?: Array<{
    fileUrl: string
    fileType: string
    fileSize: number
    storagePath: string
    caption?: string
  }>
}

export interface ReportFilterParams {
  status?: ReportStatus | 'all'
  categoryId?: string | 'all'
  kecamatanId?: string | 'all'
  search?: string
  priority?: ReportPriority | 'all'
  limit?: number
  offset?: number
}
