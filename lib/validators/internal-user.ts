import { z } from 'zod';

export const inviteUserSchema = z
  .object({
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
    institution_id: z.string().uuid('ID Instansi tidak valid').optional().nullable(),
    institution_unit_id: z.string().uuid('ID Unit tidak valid').optional().nullable(),
    phone: z
      .string()
      .max(25, 'Nomor telepon/kontak maksimal 25 karakter')
      .optional()
      .nullable(),
    initialPassword: z
      .string()
      .min(8, 'Kata sandi minimal 8 karakter')
      .max(100, 'Kata sandi maksimal 100 karakter')
      .regex(/[A-Z]/, 'Kata sandi harus mengandung minimal 1 huruf kapital')
      .regex(/[a-z]/, 'Kata sandi harus mengandung minimal 1 huruf kecil')
      .regex(/[0-9]/, 'Kata sandi harus mengandung minimal 1 angka')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.role === 'petugas' && !data.institution_id) {
        return false;
      }
      return true;
    },
    {
      message: 'Instansi penugasan (OPD) wajib dipilih untuk peran Petugas',
      path: ['institution_id'],
    }
  );

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
  institution_id: z.string().uuid('ID Instansi tidak valid').optional().nullable(),
  institution_unit_id: z.string().uuid('ID Unit tidak valid').optional().nullable(),
  phone: z
    .string()
    .max(25, 'Nomor telepon/kontak maksimal 25 karakter')
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateInternalUserInput = z.infer<typeof updateInternalUserSchema>;
