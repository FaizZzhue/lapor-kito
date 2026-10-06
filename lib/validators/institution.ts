import { z } from 'zod';

export const createInstitutionSchema = z.object({
  code: z
    .string()
    .min(2, 'Kode instansi minimal 2 karakter')
    .max(30, 'Kode instansi maksimal 30 karakter')
    .trim()
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(3, 'Nama instansi minimal 3 karakter')
    .max(200, 'Nama instansi maksimal 200 karakter')
    .trim(),
  short_name: z
    .string()
    .max(50, 'Singkatan maksimal 50 karakter')
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
  category: z
    .string()
    .max(100, 'Kategori maksimal 100 karakter')
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || 'Dinas / Badan Teknis'),
  address: z
    .string()
    .max(500, 'Alamat maksimal 500 karakter')
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Format surel tidak valid',
    })
    .transform((v) => v || null),
  phone: z
    .string()
    .max(50, 'Nomor kontak telepon maksimal 50 karakter')
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
  mandate: z
    .string()
    .max(1000, 'Tupoksi maksimal 1000 karakter')
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
  is_active: z.boolean().default(true),
});

export const updateInstitutionSchema = createInstitutionSchema.partial();

export const createUnitSchema = z.object({
  institution_id: z.string().uuid('ID Instansi induk harus berformat UUID valid'),
  code: z
    .string()
    .min(2, 'Kode unit minimal 2 karakter')
    .max(30, 'Kode unit maksimal 30 karakter')
    .trim()
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(3, 'Nama unit minimal 3 karakter')
    .max(200, 'Nama unit maksimal 200 karakter')
    .trim(),
  work_area: z
    .string()
    .max(300, 'Cakupan wilayah maksimal 300 karakter')
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
  description: z
    .string()
    .max(1000, 'Deskripsi unit maksimal 1000 karakter')
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
  is_active: z.boolean().default(true),
});

export const updateUnitSchema = createUnitSchema.partial();

export type CreateInstitutionInput = z.input<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.input<typeof updateInstitutionSchema>;
export type CreateUnitInput = z.input<typeof createUnitSchema>;
export type UpdateUnitInput = z.input<typeof updateUnitSchema>;
