import { z } from 'zod'

export const createResponseSchema = z.object({
  reportId: z.string().uuid('ID laporan tidak valid'),
  responseType: z.enum(['official', 'update', 'clarification'], {
    message: 'Tipe tanggapan tidak valid',
  }),
  message: z
    .string()
    .min(10, 'Pesan tanggapan minimal 10 karakter')
    .max(2000, 'Pesan tanggapan maksimal 2000 karakter'),
  isPublic: z.boolean().default(true),
  attachments: z
    .array(
      z.object({
        url: z.string().url('URL lampiran tidak valid'),
        name: z.string().min(1),
        type: z.string().optional(),
      })
    )
    .optional()
    .default([]),
})

export type CreateResponseSchemaType = z.infer<typeof createResponseSchema>

export const documentationAttachmentSchema = z.object({
  fileUrl: z.string().url('URL lampiran tidak valid'),
  storagePath: z.string().min(1, 'Path penyimpanan harus ditentukan'),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  caption: z.string().max(255).optional(),
})

export type DocumentationAttachmentType = z.infer<typeof documentationAttachmentSchema>

export const createOfficialResponseSchema = z.object({
  reportId: z.string().uuid('ID laporan tidak valid'),
  message: z
    .string()
    .trim()
    .min(5, 'Pesan tanggapan resmi minimal 5 karakter')
    .max(2000, 'Pesan tanggapan resmi maksimal 2000 karakter')
    .refine((val) => !/<[^>]*script/i.test(val), {
      message: 'Pesan tidak boleh mengandung tag script atau kode berbahaya',
    }),
  responseType: z.enum(['official', 'update']).default('official').optional(),
  documentationType: z.enum(['progress', 'completion', 'investigation', 'general']).default('progress').optional(),
  attachments: z.array(documentationAttachmentSchema).default([]).optional(),
  nextStatus: z.enum(['verifying', 'verified', 'in_progress', 'resolved', 'rejected', 'duplicate']).optional(),
})

export type CreateOfficialResponseSchemaType = z.input<typeof createOfficialResponseSchema>
