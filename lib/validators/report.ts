import { z } from 'zod'

export const evidenceItemSchema = z.object({
  fileUrl: z.string().url('URL bukti tidak valid'),
  fileType: z.string().min(1, 'Tipe file harus ditentukan'),
  fileSize: z.number().max(10 * 1024 * 1024, 'Ukuran file maksimal 10MB'),
  storagePath: z.string().min(1, 'Path penyimpanan harus ditentukan'),
  caption: z.string().max(255).optional(),
})

export const createReportSchema = z.object({
  title: z
    .string()
    .min(5, 'Judul laporan minimal 5 karakter')
    .max(150, 'Judul laporan maksimal 150 karakter'),
  description: z
    .string()
    .min(20, 'Deskripsi kejadian minimal 20 karakter untuk kejelasan laporan')
    .max(2000, 'Deskripsi laporan maksimal 2000 karakter'),
  categoryId: z.string().uuid('Kategori laporan harus dipilih'),
  kecamatanId: z.string().uuid('Kecamatan harus dipilih'),
  kelurahanId: z.string().uuid('Kelurahan harus dipilih'),
  addressDetail: z
    .string()
    .min(5, 'Alamat atau patokan lokasi minimal 5 karakter')
    .max(300, 'Alamat maksimal 300 karakter'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  reporterName: z.string().max(100).optional(),
  reporterPhone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, 'Format nomor HP tidak valid (contoh: 08123456789)')
    .optional()
    .or(z.literal('')),
  reporterEmail: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
  evidenceFiles: z.array(evidenceItemSchema).min(1, 'Unggah minimal 1 foto/bukti lampiran'),
})

export type CreateReportSchemaType = z.infer<typeof createReportSchema>

export const trackingSearchSchema = z.object({
  trackingCode: z
    .string()
    .trim()
    .regex(/^LPK-\d{8}-[A-Za-z0-9]{4}$/i, 'Format kode lacak harus LPK-YYYYMMDD-XXXX (contoh: LPK-20261002-7A9B)'),
})

export type TrackingSearchSchemaType = z.infer<typeof trackingSearchSchema>
