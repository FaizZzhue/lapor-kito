import { z } from 'zod'

export const aiTriageOutputSchema = z.object({
  isValidComplaint: z.boolean(),
  rejectionReason: z.string().optional(),
  categorySlug: z.string().min(1, 'Category slug is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  recommendedAuthority: z.string().default(''),
  reasoning: z.string().optional(),
})

export type AITriageOutput = z.infer<typeof aiTriageOutputSchema>

export const aiEvidenceAnalysisSchema = z.object({
  isValidEvidence: z.boolean(),
  confidence: z.number().min(0).max(1),
  description: z.string().min(1),
  labels: z.array(z.string()).default([]),
  detectedAnomalies: z.array(z.string()).optional(),
})

export type AIEvidenceAnalysisOutput = z.infer<typeof aiEvidenceAnalysisSchema>

export const aiDuplicateCandidateSchema = z.object({
  reportId: z.string(),
  trackingCode: z.string(),
  similarityScore: z.number().min(0).max(1),
  similarityReason: z.string(),
})

export type AIDuplicateCandidateOutput = z.infer<typeof aiDuplicateCandidateSchema>
