import type { ReportPriority } from './database'

export interface AIClassificationResult {
  categorySlug: string
  confidence: number
  urgency: ReportPriority
  reasoning: string
}

export type EvidenceVerificationStatus = 'relevant' | 'irrelevant' | 'ambiguous' | 'technical_failure'

export interface AIEvidenceAnalysis {
  status: EvidenceVerificationStatus
  isValidEvidence: boolean
  confidence: number
  description: string
  labels: string[]
  detectedAnomalies?: string[]
  reasoning?: string
}

export interface AIDuplicateCandidate {
  reportId: string
  trackingCode: string
  similarityScore: number
  similarityReason: string
}

export interface AIAuthorityRecommendation {
  rule_code: string | null
  decision: 'RECOMMEND' | 'NEEDS_REVIEW'
  confidence: number
  reasoning: string
  institution_name?: string | null
  institution_code?: string | null
  unit_name?: string | null
  unit_code?: string | null
  context_title?: string | null
}

export interface AITriageResult {
  categorySlug: string
  priority: ReportPriority
  confidence: number
  summary: string
  reasoning?: string
  recommendedAuthority: string
  authorityRecommendation?: AIAuthorityRecommendation
  isValidComplaint: boolean
  rejectionReason?: string
  originalLanguageDetected?: string
  statedFacts?: string[]
  inferences?: string[]
  unverifiedDetails?: string[]
  ambiguousFlags?: string[]
  evidenceAnalysis?: AIEvidenceAnalysis
  evidenceAnalyses?: AIEvidenceAnalysis[]
  potentialDuplicates?: AIDuplicateCandidate[]
}

