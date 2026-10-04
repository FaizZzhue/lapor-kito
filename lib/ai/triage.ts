import {
  getAIProvider,
  type TriageInput,
  type EvidenceVerificationInput,
  type DuplicateDetectionInput,
} from './provider'
import type { AITriageResult, AIEvidenceAnalysis, AIDuplicateCandidate } from '@/types/ai'

export type { TriageInput, EvidenceVerificationInput, DuplicateDetectionInput }

/**
 * Triage civic complaint via the configured AI provider abstraction.
 * Throws AIConfigurationError if provider credentials are not set.
 * Throws AIProviderError if execution or schema validation fails.
 */
export async function triageReportWithAI(input: TriageInput): Promise<AITriageResult> {
  const provider = getAIProvider()
  return await provider.triageReport(input)
}

/**
 * Verify report evidence attachment validity.
 */
export async function verifyEvidenceWithAI(
  input: EvidenceVerificationInput
): Promise<AIEvidenceAnalysis> {
  const provider = getAIProvider()
  return await provider.verifyEvidence(input)
}

/**
 * Detect potential duplicate reports among candidates.
 */
export async function detectDuplicatesWithAI(
  input: DuplicateDetectionInput
): Promise<AIDuplicateCandidate[]> {
  const provider = getAIProvider()
  return await provider.detectDuplicates(input)
}
