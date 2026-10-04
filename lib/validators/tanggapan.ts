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
