import type { ReportPriority } from './database'

export interface AIClassificationResult {
  categorySlug: string
  confidence: number
  urgency: ReportPriority
  reasoning: string
}

export interface AIEvidenceAnalysis {
  isValidEvidence: boolean
  confidence: number
  description: string
  labels: string[]
  detectedAnomalies?: string[]
}

export interface AIDuplicateCandidate {
  reportId: string
  trackingCode: string
  similarityScore: number
  similarityReason: string
}

export interface AITriageResult {
  categorySlug: string
  priority: ReportPriority
  confidence: number
  summary: string
  reasoning?: string
  recommendedAuthority: string
  isValidComplaint: boolean
  rejectionReason?: string
  evidenceAnalysis?: AIEvidenceAnalysis
  potentialDuplicates?: AIDuplicateCandidate[]
}
