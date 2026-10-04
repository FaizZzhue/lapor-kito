import { GoogleGenAI } from '@google/genai'
import type {
  AIProvider,
  TriageInput,
  EvidenceVerificationInput,
  DuplicateDetectionInput,
} from './provider'
import { AIConfigurationError, AIProviderError } from './provider'
import type { AITriageResult, AIEvidenceAnalysis, AIDuplicateCandidate } from '@/types/ai'
import {
  aiTriageOutputSchema,
  aiEvidenceAnalysisSchema,
  aiDuplicateCandidateSchema,
} from '@/lib/validators/ai'
import { z } from 'zod'

export const GEMINI_MODEL = 'gemini-3.8-flash'

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini AI'
  private readonly client: GoogleGenAI | null = null

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey && apiKey.trim().length > 0) {
      this.client = new GoogleGenAI({ apiKey: apiKey.trim() })
    }
  }

  get isConfigured(): boolean {
    return this.client !== null
  }

  private ensureClient(): GoogleGenAI {
    if (!this.client) {
      throw new AIConfigurationError(
        'Gemini API key is not configured. Set GEMINI_API_KEY in server environment.'
      )
    }
    return this.client
  }

  private async generateWithRetry(
    ai: GoogleGenAI,
    params: Parameters<typeof ai.models.generateContent>[0],
    maxRetries = 2
  ) {
    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent(params)
      } catch (err: unknown) {
        lastError = err
        const status = (err as { status?: number })?.status
        const message = (err as Error)?.message || ''
        const isTransient =
          status === 503 ||
          status === 429 ||
          message.includes('503') ||
          message.includes('high demand')
        if (isTransient && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
          continue
        }
        throw err
      }
    }
    throw lastError
  }

  /**
   * Triage a civic complaint report.
   * Classifies category, assesses urgency, generates summary, and matches official authorities.
   */
  async triageReport(input: TriageInput): Promise<AITriageResult> {
    const ai = this.ensureClient()

    const categoriesList = input.availableCategories && input.availableCategories.length > 0
      ? `Daftar Kategori Resmi Terdaftar:\n${input.availableCategories.map((c) => `- ${c.slug}: ${c.name}`).join('\n')}`
      : 'Kategori: Tentukan kategori yang paling relevan secara netral.'

    const authoritiesList = input.availableAuthorities && input.availableAuthorities.length > 0
      ? `Daftar Instansi/OPD Berwenang Resmi Terdaftar:\n${input.availableAuthorities.map((a) => `- ${a.name} (${a.code}): ${a.scope || '-'}`).join('\n')}\nATURAN KETAT: Rekomendasikan nama instansi HANYA jika ada dalam daftar di atas. Jika tidak ada yang cocok, isi dengan string kosong (""). JANGAN PERNAH mereka-reka nama instansi.`
      : 'ATURAN KETAT: Belum ada daftar instansi terdaftar. Kosongkan nilai "recommendedAuthority" ("").'

    const prompt = `Anda adalah sistem AI profesional untuk pra-pelaporan pengaduan sipil publik.
Tugas Anda adalah memverifikasi validitas pengaduan, menentukan kategori, mengevaluasi tingkat urgensi/prioritas, merangkum inti masalah, dan merekomendasikan instansi yang berwenang HANYA dari daftar resmi.

${categoriesList}

${authoritiesList}

Data Pengaduan Warga:
- Judul: ${input.title}
- Deskripsi: ${input.description}
- Alamat/Patokan Lokasi: ${input.addressDetail || '-'}
- Kecamatan/Kelurahan: ${input.subdistrictName || '-'}, ${input.districtName || '-'}
- Kategori yang dipilih warga: ${input.categoryName || '-'}
- Jumlah bukti lampiran: ${input.evidenceUrls?.length || 0}

Berikan respon HANYA dalam format JSON valid sesuai schema berikut:
{
  "isValidComplaint": true | false,
  "rejectionReason": "Alasan penolakan jika spam/hoax/ujaran kebencian, atau kosongkan jika valid",
  "categorySlug": "slug-kategori-terpilih",
  "priority": "low" | "medium" | "high" | "critical",
  "confidence": 0.85,
  "summary": "Ringkasan padat dan objektif masalah dalam 1-2 kalimat",
  "recommendedAuthority": "Nama instansi HANYA jika ada dalam daftar resmi, atau kosongkan jika tidak ada",
  "reasoning": "Penjelasan singkat alasan klasifikasi dan urgensi"
}`

    try {
      const response = await this.generateWithRetry(ai, {
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      })

      const text = response.text?.trim()
      if (!text) {
        throw new AIProviderError('Gemini returned an empty response.')
      }

      const parsed = JSON.parse(text)
      const validated = aiTriageOutputSchema.parse(parsed)

      // Strict enforcement: ensure recommendedAuthority is actually from the provided list
      let finalAuthority = validated.recommendedAuthority
      if (input.availableAuthorities && input.availableAuthorities.length > 0) {
        const match = input.availableAuthorities.find(
          (a) => a.name.toLowerCase() === finalAuthority.toLowerCase() ||
                 a.code.toLowerCase() === finalAuthority.toLowerCase()
        )
        finalAuthority = match ? match.name : ''
      } else {
        finalAuthority = ''
      }

      return {
        isValidComplaint: validated.isValidComplaint,
        rejectionReason: validated.rejectionReason,
        categorySlug: validated.categorySlug,
        priority: validated.priority,
        confidence: validated.confidence,
        summary: validated.summary,
        reasoning: validated.reasoning,
        recommendedAuthority: finalAuthority,
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AIProviderError(`Gemini structured output failed schema validation: ${err.message}`, err)
      }
      throw new AIProviderError(`Gemini triage invocation failed: ${(err as Error).message}`, err)
    }
  }

  /**
   * Verify evidence validity and identify media content.
   */
  async verifyEvidence(input: EvidenceVerificationInput): Promise<AIEvidenceAnalysis> {
    const ai = this.ensureClient()

    const prompt = `Analisis bukti lampiran pengaduan berikut:
- URL Lampiran: ${input.fileUrl}
- Tipe File: ${input.fileType}
- Judul Aduan: ${input.reportTitle}
- Kategori Aduan: ${input.categoryName || '-'}

Tentukan apakah file ini adalah bukti yang relevan dan dapat diverifikasi untuk aduan tersebut.
Keluarkan output HANYA format JSON valid:
{
  "isValidEvidence": true | false,
  "confidence": 0.85,
  "description": "Deskripsi singkat isi lampiran",
  "labels": ["label1", "label2"],
  "detectedAnomalies": []
}`

    try {
      const response = await this.generateWithRetry(ai, {
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      })

      const text = response.text?.trim()
      if (!text) {
        throw new AIProviderError('Gemini returned an empty response during evidence verification.')
      }

      const parsed = JSON.parse(text)
      const validated = aiEvidenceAnalysisSchema.parse(parsed)

      return {
        isValidEvidence: validated.isValidEvidence,
        confidence: validated.confidence,
        description: validated.description,
        labels: validated.labels,
        detectedAnomalies: validated.detectedAnomalies,
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AIProviderError(`Gemini evidence output validation failed: ${err.message}`, err)
      }
      throw new AIProviderError(`Gemini evidence verification failed: ${(err as Error).message}`, err)
    }
  }

  /**
   * Compare a new report against recent candidate reports to detect duplicates.
   */
  async detectDuplicates(input: DuplicateDetectionInput): Promise<AIDuplicateCandidate[]> {
    if (!input.candidates || input.candidates.length === 0) {
      return []
    }

    const ai = this.ensureClient()

    const candidatesText = input.candidates
      .map(
        (c, idx) =>
          `Candidate #${idx + 1}:
  ID: ${c.id}
  Kode Lacak: ${c.trackingCode}
  Judul: ${c.title}
  Deskripsi: ${c.description}
  Lokasi: ${c.addressDetail || '-'}`
      )
      .join('\n\n')

    const prompt = `Bandingkan aduan baru berikut dengan daftar aduan kandidat yang ada untuk mendeteksi kesamaan/duplikasi kejadian fisik:

Aduan Baru:
- Judul: ${input.targetReport.title}
- Deskripsi: ${input.targetReport.description}
- Lokasi: ${input.targetReport.addressDetail || '-'}

Daftar Kandidat:
${candidatesText}

Kembalikan daftar duplikat HANYA jika kesamaan substansi masalah dan lokasi sangat tinggi (skor >= 0.75).
Format output HANYA array JSON:
[
  {
    "reportId": "ID kandidat",
    "trackingCode": "Kode Lacak",
    "similarityScore": 0.85,
    "similarityReason": "Alasan kesamaan masalah dan lokasi"
  }
]`

    try {
      const response = await this.generateWithRetry(ai, {
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      })

      const text = response.text?.trim()
      if (!text) {
        return []
      }

      const parsed = JSON.parse(text)
      const validated = z.array(aiDuplicateCandidateSchema).parse(parsed)

      return validated.map((item) => ({
        reportId: item.reportId,
        trackingCode: item.trackingCode,
        similarityScore: item.similarityScore,
        similarityReason: item.similarityReason,
      }))
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AIProviderError(`Gemini duplicate output validation failed: ${err.message}`, err)
      }
      throw new AIProviderError(`Gemini duplicate detection failed: ${(err as Error).message}`, err)
    }
  }
}

// Singleton provider instance
let geminiInstance: GeminiProvider | null = null

export function getGeminiProvider(): GeminiProvider {
  if (!geminiInstance) {
    geminiInstance = new GeminiProvider()
  }
  return geminiInstance
}
