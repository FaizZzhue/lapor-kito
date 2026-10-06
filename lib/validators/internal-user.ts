import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z
    .string()
    .email('Format surel tidak valid')
    .min(5, 'Surel minimal 5 karakter')
    .max(100, 'Surel maksimal 100 karakter'),
  full_name: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  role: z.enum(['admin', 'petugas'], {
    message: 'Peran akun harus admin atau petugas',
  }),
  phone: z
    .string()
    .max(25, 'Nomor telepon/kontak maksimal 25 karakter')
    .optional()
    .nullable(),
});

export const updateInternalUserSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .optional(),
  role: z
    .enum(['admin', 'petugas'], {
      message: 'Peran akun harus admin atau petugas',
    })
    .optional(),
  phone: z
    .string()
    .max(25, 'Nomor telepon/kontak maksimal 25 karakter')
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateInternalUserInput = z.infer<typeof updateInternalUserSchema>;
