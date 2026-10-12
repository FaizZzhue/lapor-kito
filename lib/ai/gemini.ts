import { GoogleGenAI } from '@google/genai'
import type {
  AIProvider,
  TriageInput,
  EvidenceVerificationInput,
  DuplicateDetectionInput,
  AuthorityRecommendationInput,
} from './provider'
import { AIConfigurationError, AIProviderError } from './provider'
import type { AITriageResult, AIEvidenceAnalysis, AIDuplicateCandidate, AIAuthorityRecommendation } from '@/types/ai'
import {
  aiTriageOutputSchema,
  aiEvidenceAnalysisSchema,
  aiDuplicateCandidateSchema,
  aiAuthorityRecommendationSchema,
} from '@/lib/validators/ai'
import { z } from 'zod'

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash'
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini AI'
  private client: GoogleGenAI | null = null

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey && apiKey.trim().length > 0) {
      this.client = new GoogleGenAI({ apiKey: apiKey.trim() })
    }
  }

  get isConfigured(): boolean {
    if (this.client) return true
    const apiKey = process.env.GEMINI_API_KEY
    return Boolean(apiKey && apiKey.trim().length > 0)
  }

  private ensureClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY
      if (apiKey && apiKey.trim().length > 0) {
        this.client = new GoogleGenAI({ apiKey: apiKey.trim() })
      }
    }
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
    maxRetries = 3
  ) {
    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent(params)
      } catch (err: unknown) {
        lastError = err
        const status = (err as { status?: number | string })?.status
        const message = (err as Error)?.message || ''
        const isTransient =
          status === 503 ||
          status === 429 ||
          status === 'RESOURCE_EXHAUSTED' ||
          message.includes('503') ||
          message.includes('429') ||
          message.includes('RESOURCE_EXHAUSTED') ||
          message.includes('Quota exceeded') ||
          message.includes('high demand')
        if (isTransient && attempt < maxRetries) {
          const waitMs = 3000 * Math.pow(2, attempt)
          console.warn(`[Gemini API Backoff] Rate limit or transient error. Waiting ${waitMs}ms before attempt ${attempt + 1}/${maxRetries}...`)
          await new Promise((resolve) => setTimeout(resolve, waitMs))
          continue
        }
        throw err
      }
    }
    throw lastError
  }

  /**
   * Triage a civic complaint report.
   * Classifies category, assesses urgency, generates concise normalized Indonesian summary,
   * detects Palembang/informal language, and strictly separates stated facts from inferences.
   */
  async triageReport(input: TriageInput): Promise<AITriageResult> {
    const ai = this.ensureClient()

    const categoriesList = input.availableCategories && input.availableCategories.length > 0
      ? `Daftar Kategori Resmi Terdaftar (PILIH SALAH SATU YANG PALING RELEVAN):\n${input.availableCategories.map((c) => `- ${c.slug}: ${c.name}`).join('\n')}`
      : `Daftar Kategori Resmi Terdaftar:
- infrastruktur-jalan: Kerusakan jalan, aspal berlubang, trotoar, jembatan, marka/pembatas jalan.
- kebersihan-lingkungan: Sampah liar, penumpukan sampah, TPS meluap, sampah di ruang publik/sungai.
- drainase-saluran-air: Saluran got tersumbat, sedimentasi parit, luapan air/banjir, tanggul rusak.
- penerangan-jalan: Lampu Penerangan Jalan Umum (PJU) mati/padam, redup, tiang roboh, kabel putus.`

    const authoritiesList = input.availableAuthorities && input.availableAuthorities.length > 0
      ? `Daftar Instansi/OPD Berwenang Resmi Terdaftar:\n${input.availableAuthorities.map((a) => `- ${a.name} (${a.code}): ${a.scope || '-'}`).join('\n')}\nATURAN KETAT: Rekomendasikan nama instansi HANYA jika ada dalam daftar di atas. Jika tidak ada yang cocok, isi dengan string kosong (""). JANGAN PERNAH mereka-reka nama instansi.`
      : 'ATURAN KETAT: Belum ada daftar instansi terdaftar. Kosongkan nilai "recommendedAuthority" ("").'

    const prompt = `Anda adalah sistem AI profesional untuk pra-pelaporan pengaduan sipil publik LAPORKITO Kota Palembang.
Tugas Anda:
1. Memverifikasi validitas pengaduan warga.
2. Memahami bahasa masukan warga — baik Bahasa Indonesia formal, informal, maupun Bahasa Palembang (dan campurannya).
3. Mengklasifikasikan ke dalam SALAH SATU dari empat kategori resmi terdaftar.
4. Mengevaluasi tingkat urgensi/prioritas secara objektif (low, medium, high, critical).
5. Menyusun kembali deskripsi warga menjadi RINGKASAN BAHASA INDONESIA yang jelas, padat, tertata, dan tegas tanpa mengubah makna asli.
6. Membedakan secara ketat antara: FAKTA yang dinyatakan pelapor, INFERENSI teknis AI, dan INFORMASI YANG BELUM DIKETAHUI.

${categoriesList}

${authoritiesList}

PANDUAN KATA & UNGKAPAN BAHASA PALEMBANG / SEHARI-HARI:
- "belobang" / "tebengkalai" = berlubang / rusak tidak terawat
- "buntet" / "tesumbet" = tersumbat / mampet
- "banyu meluber" = air meluap / menggenang
- "bau bacin" / "nyengat" = bau busuk menyengat
- "ari ujan" = saat hujan / musim hujan
- "lebak" = rawa / cekungan tanah berair
- "padem" / "padam" = lampu mati / tidak menyala
- "kelam kabut" = gelap gulita
- "tecampak" / "lokak jatu" = terjatuh / berpotensi jatuh
- "ringam" = terganggu / resah
- "numpuk serakan" = menumpuk berserakan
- "uwong" = orang / warga

ATURAN ANTI-HALUSINASI DAN KETEPATAN (SANGAT KETAT):
1. DILARANG MENAMBAHKAN PENYEBAB yang tidak dinyatakan pelapor (misal: JANGAN mengarang "diduga akibat truk bertonase besar" atau "akibat buangan limbah industri" jika pelapor tidak menyatakannya).
2. DILARANG MENGARANG WAKTU, LOKASI, DAMPAK, ATAU KONDISI FISIK yang tidak ada di teks warga (misal: jika warga tidak menyebut waktu, jangan tulis "sejak seminggu lalu"; jika warga tidak menyebut korban, jangan sebutkan "memakan korban luka").
3. JANGAN MENGUBAH KETIDAKPASTIAN MENJADI KEPASTIAN: Jika warga menyatakan dugaan ("caknyo", "mungkin", "katonyo"), pertahankan sebagai dugaan atau catat sebagai informasi belum terverifikasi.
4. KATA/UNGKAPAN AMBIGU ATAU KIASAN: Jika warga menggunakan kiasan (misal "cak kapal karam", "lokak makan korban", "ancur mincur"), jangan artikan sebagai kapal karam sungguhan atau korban jiwa nyata. Pahami maksud kiasannya sebagai tingkat kerusakan berat dan catat di "ambiguousFlags".
5. ATURAN VALIDITAS PENGADUAN: Jika laporan memuat objek masalah fasilitas/layanan publik nyata (seperti jalan rusak, tumpukan sampah, saluran got/banjir, lampu jalan padam), MAKA LAPORAN ADALAH VALID ("isValidComplaint": true), meskipun pelapor belum menuliskan lokasi detail. JANGAN menolak laporan hanya karena alamat belum lengkap (catat saja lokasi yang belum disebutkan di "unverifiedDetails"). HANYA tandai "isValidComplaint": false jika teks sama sekali tidak memuat masalah fisik (contoh: hanya "tolong min", sapaan "halo siang", spam, ujaran kebencian, atau teks tanpa substansi).
6. BEDAKAN SECARA STRUKTURAL:
   - "statedFacts": Daftar poin fakta yang benar-benar dinyatakan pelapor secara eksplisit.
   - "inferences": Inferensi/kesimpulan teknis AI yang relevan (misal: potensi risiko keselamatan pengguna jalan).
   - "unverifiedDetails": Rincian penting yang belum diketahui dari teks (misal: dimensi pasti, waktu awal kejadian, alamat lengkap jika belum ada).
   - "ambiguousFlags": Peringatan kata kiasan atau ketidakjelasan yang butuh konfirmasi lanjutan.

Data Pengaduan Warga:
- Judul: ${input.title}
- Deskripsi: ${input.description}
- Alamat/Patokan Lokasi: ${input.addressDetail || '-'}
- Kecamatan/Kelurahan: ${input.subdistrictName || '-'}, ${input.districtName || '-'}
- Kategori yang dipilih warga: ${input.categoryName || '-'}
- Jumlah bukti lampiran: ${input.evidenceUrls?.length || 0}

Berikan respon HANYA dalam format JSON valid:
{
  "isValidComplaint": true,
  "rejectionReason": "",
  "categorySlug": "infrastruktur-jalan",
  "priority": "medium",
  "confidence": 0.85,
  "summary": "Ringkasan formal Bahasa Indonesia tertata, objektif, padat (1-2 kalimat) tanpa menambah fakta baru",
  "originalLanguageDetected": "Bahasa Palembang",
  "statedFacts": ["fakta 1", "fakta 2"],
  "inferences": ["inferensi 1"],
  "unverifiedDetails": ["detail belum diketahui 1"],
  "ambiguousFlags": [],
  "recommendedAuthority": "Nama instansi resmi atau kosongkan",
  "reasoning": "Penjelasan singkat dasar klasifikasi berdasarkan teks warga"
}`

    try {
      const response = await this.generateWithRetry(ai, {
        model: getGeminiModel(),
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
        originalLanguageDetected: validated.originalLanguageDetected,
        statedFacts: validated.statedFacts,
        inferences: validated.inferences,
        unverifiedDetails: validated.unverifiedDetails,
        ambiguousFlags: validated.ambiguousFlags,
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AIProviderError(`Gemini structured output failed schema validation: ${err.message}`, err)
      }
      throw new AIProviderError(`Gemini triage invocation failed: ${(err as Error).message}`, err)
    }
  }

  /**
   * Second-step authority recommendation.
   * Given pre-filtered candidates from authority_rules, asks AI to select the best match.
   * The AI can ONLY select from the provided candidates or declare NEEDS_REVIEW.
   */
  async recommendAuthority(input: AuthorityRecommendationInput): Promise<AIAuthorityRecommendation> {
    const ai = this.ensureClient()

    if (input.candidates.length === 0) {
      return {
        rule_code: null,
        decision: 'NEEDS_REVIEW',
        confidence: 0,
        reasoning: 'Tidak ada aturan kewenangan yang terdaftar untuk kategori ini.',
        institution_name: null,
        institution_code: null,
        unit_name: null,
        unit_code: null,
        context_title: null,
      }
    }

    const candidatesList = input.candidates
      .map(
        (c, idx) =>
          `Kandidat #${idx + 1}:\n` +
          `  rule_code: ${c.rule_code}\n` +
          `  Instansi: ${c.institution_name} (${c.institution_code})\n` +
          `  Unit/UPTD: ${c.unit_name || '-'}${c.unit_code ? ` (${c.unit_code})` : ''}\n` +
          `  Konteks Kewenangan: ${c.context_title}\n` +
          `  Deskripsi: ${c.context_description || '-'}\n` +
          `  Dasar Hukum: ${c.regulation_basis}`
      )
      .join('\n\n')

    const prompt = `Anda adalah sistem AI LAPORKITO untuk menentukan instansi berwenang atas aduan warga Kota Palembang.

Tugas Anda: Dari daftar kandidat aturan kewenangan di bawah, pilih SATU yang paling sesuai untuk menangani aduan ini.

ATURAN MUTLAK:
1. Anda HANYA boleh memilih dari daftar kandidat yang disediakan.
2. Jika tidak ada kandidat yang sesuai, pilih decision = "NEEDS_REVIEW" dan rule_code = null.
3. JANGAN PERNAH mengarang rule_code, nama instansi, atau kode yang tidak ada dalam daftar.

Data Pengaduan:
- Judul: ${input.title}
- Deskripsi: ${input.description}
- Kategori: ${input.categorySlug}${input.categoryName ? ` (${input.categoryName})` : ''}
- Kecamatan: ${input.districtName || '-'}
- Kelurahan: ${input.subdistrictName || '-'}
- Alamat: ${input.addressDetail || '-'}

Daftar Kandidat Aturan Kewenangan:
${candidatesList}

Berikan respon HANYA dalam format JSON valid:
{
  "rule_code": "RULE_CODE dari daftar di atas, atau null jika tidak sesuai",
  "decision": "RECOMMEND" | "NEEDS_REVIEW",
  "confidence": 0.85,
  "reasoning": "Penjelasan singkat alasan pemilihan atau alasan memerlukan review manual"
}`

    try {
      const response = await this.generateWithRetry(ai, {
        model: getGeminiModel(),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      })

      const text = response.text?.trim()
      if (!text) {
        throw new AIProviderError('Gemini returned an empty response for authority recommendation.')
      }

      const parsed = JSON.parse(text)
      const validated = aiAuthorityRecommendationSchema.parse(parsed)

      // Server-side enforcement: verify rule_code is from the provided candidates
      let matchedCandidate = null
      if (validated.decision === 'RECOMMEND' && validated.rule_code) {
        matchedCandidate = input.candidates.find(
          (c) => c.rule_code === validated.rule_code
        )
        if (!matchedCandidate) {
          // AI hallucinated a rule_code not in the list — override to NEEDS_REVIEW
          return {
            rule_code: null,
            decision: 'NEEDS_REVIEW',
            confidence: 0,
            reasoning: `AI merekomendasikan rule_code "${validated.rule_code}" yang tidak ada dalam daftar kandidat. Dialihkan ke review manual.`,
            institution_name: null,
            institution_code: null,
            unit_name: null,
            unit_code: null,
            context_title: null,
          }
        }
      }

      return {
        rule_code: validated.rule_code,
        decision: validated.decision,
        confidence: validated.confidence,
        reasoning: validated.reasoning,
        institution_name: matchedCandidate?.institution_name ?? null,
        institution_code: matchedCandidate?.institution_code ?? null,
        unit_name: matchedCandidate?.unit_name ?? null,
        unit_code: matchedCandidate?.unit_code ?? null,
        context_title: matchedCandidate?.context_title ?? null,
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AIProviderError(`Gemini authority recommendation schema validation failed: ${err.message}`, err)
      }
      throw new AIProviderError(`Gemini authority recommendation failed: ${(err as Error).message}`, err)
    }
  }

  /**
   * Verify evidence validity and identify media content using Gemini multimodal.
   * Evaluates if evidence is relevant, irrelevant, ambiguous, or technical_failure.
   */
  async verifyEvidence(input: EvidenceVerificationInput): Promise<AIEvidenceAnalysis> {
    const ai = this.ensureClient()

    // 1. Resolve image base64 data
    let base64Data: string | null = null
    let mimeType = input.fileType || 'image/jpeg'

    if (input.base64Data && input.base64Data.trim().length > 0) {
      base64Data = input.base64Data.trim()
    } else if (input.buffer) {
      base64Data = Buffer.isBuffer(input.buffer)
        ? input.buffer.toString('base64')
        : Buffer.from(input.buffer as ArrayBuffer).toString('base64')
    } else if (input.fileUrl) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const fetchRes = await fetch(input.fileUrl, { signal: controller.signal })
        clearTimeout(timeout)

        if (!fetchRes.ok) {
          return {
            status: 'technical_failure',
            isValidEvidence: false,
            confidence: 0,
            description: `Gagal mengakses berkas bukti lampiran dari URL penyimpanan (HTTP ${fetchRes.status}).`,
            labels: [],
            detectedAnomalies: ['file_fetch_http_error'],
            reasoning: 'URL berkas tidak dapat diunduh untuk analisis visual. Verifikasi tidak dapat disimpulkan.',
          }
        }

        const contentType = fetchRes.headers.get('content-type')
        if (contentType) mimeType = contentType.split(';')[0].trim()

        const arrayBuf = await fetchRes.arrayBuffer()
        base64Data = Buffer.from(arrayBuf).toString('base64')
      } catch (fetchErr) {
        return {
          status: 'technical_failure',
          isValidEvidence: false,
          confidence: 0,
          description: 'Gagal mengunduh berkas bukti lampiran karena gangguan jaringan atau batas waktu (timeout).',
          labels: [],
          detectedAnomalies: ['file_fetch_network_failure'],
          reasoning: `Kendala teknis jaringan saat mengunduh berkas: ${(fetchErr as Error).message}`,
        }
      }
    }

    if (!base64Data) {
      return {
        status: 'technical_failure',
        isValidEvidence: false,
        confidence: 0,
        description: 'Tidak ada data gambar yang dapat diproses untuk verifikasi visual.',
        labels: [],
        detectedAnomalies: ['missing_image_data'],
        reasoning: 'URL atau data gambar bukti tidak disertakan.',
      }
    }

    const prompt = `Anda adalah sistem AI forensik bukti visual untuk pra-pelaporan pengaduan sipil perkotaan LAPORKITO Palembang.
Tugas Anda: Evaluasi secara visual apakah foto lampiran ini merupakan bukti fisik nyata yang relevan untuk aduan yang dilaporkan warga.

Data Pengaduan Warga:
- Judul Aduan: ${input.reportTitle}
- Deskripsi Aduan: ${input.reportDescription || '-'}
- Kategori Aduan: ${input.categoryName || '-'}

ATURAN KLASIFIKASI STATUS BUKTI:
1. "relevant": Foto secara visual dan nyata memperlihatkan objek masalah fisik di lapangan yang sesuai dengan isi aduan (contoh: foto jalan berlubang/aspal rusak untuk aduan infrastruktur jalan; tumpukan sampah berserakan untuk aduan sampah; banjir/genangan air/parit tumpat untuk aduan drainase; tiang/lampu jalan rusak untuk aduan penerangan).
2. "irrelevant": Foto secara visual tidak memiliki relevansi dengan masalah fisik yang diadukan (contoh: gambar logo perusahaan/instansi, grafik/ikon, brosur/poster teks/pengumuman, tangkapan layar chat, foto wajah/selfie semata, foto interior rumah, foto hewan, atau foto jalan mulus tanpa masalah).
3. "ambiguous": Foto buram/kabur (blurry), terlalu gelap, objek terhalang, resolusi terlalu rendah, atau sudut pandang tidak jelas sehingga tidak dapat dipastikan apakah terdapat masalah fasilitas publik.

ATURAN KETAT:
- Evaluasi HANYA bukti visual pada gambar. Jangan mencampurkan penilaian teks dengan validitas visual.
- Jika gambar adalah poster/logo/grafik dokumen dan bukan foto kondisi lapangan nyata, tandai sebagai "irrelevant".
- Jika gambar buram atau tidak jelas objeknya, tandai sebagai "ambiguous".
- Nilai isValidEvidence HARUS true jika status "relevant", dan false jika status "irrelevant" atau "ambiguous".

Keluarkan output HANYA format JSON valid:
{
  "status": "relevant" | "irrelevant" | "ambiguous",
  "isValidEvidence": true | false,
  "confidence": 0.85,
  "description": "Deskripsi objektif apa yang tampak pada foto dalam 1-2 kalimat",
  "labels": ["objek1", "objek2"],
  "detectedAnomalies": [],
  "reasoning": "Alasan penentuan status relevansi bukti"
}`

    try {
      const response = await this.generateWithRetry(ai, {
        model: getGeminiModel(),
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      })

      const text = response.text?.trim()
      if (!text) {
        return {
          status: 'technical_failure',
          isValidEvidence: false,
          confidence: 0,
          description: 'Model AI memberikan respon kosong pada analisis gambar.',
          labels: [],
          detectedAnomalies: ['empty_model_response'],
          reasoning: 'Respon model tidak berisi data.',
        }
      }

      const parsed = JSON.parse(text)
      const validated = aiEvidenceAnalysisSchema.parse(parsed)

      // Strict sanity check on boolean matching status
      const isActuallyRelevant = validated.status === 'relevant'

      return {
        status: validated.status,
        isValidEvidence: isActuallyRelevant,
        confidence: validated.confidence,
        description: validated.description,
        labels: validated.labels,
        detectedAnomalies: validated.detectedAnomalies,
        reasoning: validated.reasoning,
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return {
          status: 'technical_failure',
          isValidEvidence: false,
          confidence: 0,
          description: 'Struktur luaran model AI tidak memenuhi skema validasi bukti.',
          labels: [],
          detectedAnomalies: ['schema_validation_error'],
          reasoning: `Validasi skema gagal: ${err.message}`,
        }
      }
      return {
        status: 'technical_failure',
        isValidEvidence: false,
        confidence: 0,
        description: 'Gagal menjalankan evaluasi bukti visual karena kendala teknis pada model AI.',
        labels: [],
        detectedAnomalies: ['model_invocation_error'],
        reasoning: `Pemanggilan model Gemini multimodal gagal: ${(err as Error).message}`,
      }
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
        model: getGeminiModel(),
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
