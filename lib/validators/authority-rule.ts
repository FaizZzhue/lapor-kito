import { z } from "zod";

export const createAuthorityRuleSchema = z.object({
  ruleCode: z
    .string()
    .trim()
    .min(2, "Kode aturan minimal 2 karakter")
    .max(50, "Kode aturan maksimal 50 karakter")
    .regex(/^[A-Za-z0-9_-]+$/, "Kode aturan hanya boleh huruf, angka, strip (-), dan garis bawah (_)"),
  categoryId: z.string().uuid("Kategori harus dipilih"),
  kecamatanId: z
    .string()
    .uuid("Wilayah kecamatan tidak valid")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  contextTitle: z
    .string()
    .trim()
    .min(3, "Konteks masalah minimal 3 karakter")
    .max(200, "Konteks masalah maksimal 200 karakter"),
  contextDescription: z
    .string()
    .trim()
    .max(1000, "Deskripsi konteks maksimal 1000 karakter")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  institutionId: z.string().uuid("Instansi berwenang harus dipilih"),
  institutionUnitId: z
    .string()
    .uuid("Unit pelaksana teknis tidak valid")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  regulationBasis: z
    .string()
    .trim()
    .min(3, "Dasar regulasi minimal 3 karakter")
    .max(255, "Dasar regulasi maksimal 255 karakter"),
  isActive: z.boolean().default(true),
});

export const updateAuthorityRuleSchema = createAuthorityRuleSchema.extend({
  id: z.string().uuid("ID aturan tidak valid"),
});

export const toggleAuthorityRuleStatusSchema = z.object({
  id: z.string().uuid("ID aturan tidak valid"),
  isActive: z.boolean(),
});

export type CreateAuthorityRuleInput = z.infer<typeof createAuthorityRuleSchema>;
export type UpdateAuthorityRuleInput = z.infer<typeof updateAuthorityRuleSchema>;
export type ToggleAuthorityRuleStatusInput = z.infer<typeof toggleAuthorityRuleStatusSchema>;
