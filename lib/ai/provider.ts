import type { AITriageResult, AIEvidenceAnalysis, AIDuplicateCandidate, AIAuthorityRecommendation } from '@/types/ai'
import { getGeminiProvider } from './gemini'

export class AIConfigurationError extends Error {
  constructor(message = 'AI Provider credential is not configured.') {
    super(message)
    this.name = 'AIConfigurationError'
  }
}

export class AIProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export interface AuthorityOption {
  code: string
  name: string
  scope?: string
}

export interface CategoryOption {
  slug: string
  name: string
}

/**
 * Structured authority candidate provided to AI from authority_rules DB table.
 * These are pre-filtered by category_slug and active status.
 */
export interface AuthorityCandidateForAI {
  rule_code: string
  institution_name: string
  institution_code: string
  unit_name: string | null
  unit_code: string | null
  context_title: string
  context_description: string | null
  regulation_basis: string
}

export interface AuthorityRecommendationInput {
  title: string
  description: string
  categorySlug: string
  categoryName?: string
  districtName?: string
  subdistrictName?: string
  addressDetail?: string
  candidates: AuthorityCandidateForAI[]
}

export interface TriageInput {
  title: string
  description: string
  categoryName?: string
  districtName?: string
  subdistrictName?: string
  addressDetail?: string
  evidenceUrls?: string[]
  availableCategories?: CategoryOption[]
  availableAuthorities?: AuthorityOption[]
}

export interface EvidenceVerificationInput {
  fileUrl: string
  fileType: string
  reportTitle: string
  categoryName?: string
}

export interface CandidateReport {
  id: string
  trackingCode: string
  title: string
  description: string
  categorySlug?: string
  addressDetail?: string
}

export interface DuplicateDetectionInput {
  targetReport: {
    title: string
    description: string
    categorySlug?: string
    addressDetail?: string
  }
  candidates: CandidateReport[]
}

export interface AIProvider {
  readonly name: string
  readonly isConfigured: boolean
  triageReport(input: TriageInput): Promise<AITriageResult>
  recommendAuthority(input: AuthorityRecommendationInput): Promise<AIAuthorityRecommendation>
  verifyEvidence(input: EvidenceVerificationInput): Promise<AIEvidenceAnalysis>
  detectDuplicates(input: DuplicateDetectionInput): Promise<AIDuplicateCandidate[]>
}

/**
 * Returns the configured AI provider.
 * Throws AIConfigurationError if credentials are not configured in environment.
 */
export function getAIProvider(): AIProvider {
  const provider = getGeminiProvider()
  if (!provider.isConfigured) {
    throw new AIConfigurationError(
      'Gemini API key (GEMINI_API_KEY) is not configured in the environment.'
    )
  }
  return provider
}
