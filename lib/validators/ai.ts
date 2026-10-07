import { z } from 'zod'

export const aiClassificationOutputSchema = z.object({
  isValidComplaint: z.boolean(),
  rejectionReason: z.string().optional(),
  categorySlug: z.string().min(1, 'Category slug is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  reasoning: z.string().optional(),
})

export type AIClassificationOutput = z.infer<typeof aiClassificationOutputSchema>

export const aiAuthorityRecommendationSchema = z
  .object({
    rule_code: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v ? v.trim() : null)),
    decision: z.enum(['RECOMMEND', 'NEEDS_REVIEW']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
  })
  .refine(
    (data) => {
      if (data.decision === 'NEEDS_REVIEW') {
        return data.rule_code === null
      }
      if (data.decision === 'RECOMMEND') {
        return typeof data.rule_code === 'string' && data.rule_code.length > 0
      }
      return true
    },
    {
      message:
        'Jika decision = NEEDS_REVIEW maka rule_code wajib null; jika RECOMMEND maka rule_code wajib diisi.',
    }
  )

export type AIAuthorityRecommendationOutput = z.infer<typeof aiAuthorityRecommendationSchema>

export const aiTriageOutputSchema = z.object({
  isValidComplaint: z.boolean(),
  rejectionReason: z.string().optional(),
  categorySlug: z.string().min(1, 'Category slug is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  recommendedAuthority: z.string().default(''),
  reasoning: z.string().optional(),
  authorityRecommendation: aiAuthorityRecommendationSchema.optional(),
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
