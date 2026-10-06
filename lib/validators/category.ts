import { z } from 'zod';

export const createCategorySchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug minimal 2 karakter')
    .max(50, 'Slug maksimal 50 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh menggunakan huruf kecil, angka, dan tanda hubung (-)'),
  name_id: z
    .string()
    .min(3, 'Nama kategori (ID) minimal 3 karakter')
    .max(100, 'Nama kategori (ID) maksimal 100 karakter'),
  name_en: z
    .string()
    .max(100, 'Nama kategori (EN) maksimal 100 karakter')
    .optional()
    .nullable(),
  description: z
    .string()
    .min(10, 'Deskripsi minimal 10 karakter untuk panduan warga yang jelas')
    .max(500, 'Deskripsi maksimal 500 karakter'),
  icon: z
    .string()
    .min(1, 'Icon wajib dipilih')
    .max(50, 'Nama icon maksimal 50 karakter')
    .default('tag'),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).max(999).default(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  name_id: z
    .string()
    .min(3, 'Nama kategori (ID) minimal 3 karakter')
    .max(100, 'Nama kategori (ID) maksimal 100 karakter')
    .optional(),
  description: z
    .string()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
