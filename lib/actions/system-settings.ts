'use server';

import { revalidatePath } from 'next/cache';
import type { Json } from '@/types/database';
import { createClient } from '@/lib/supabase/server';
import { getCurrentInternalUser } from '@/lib/auth/session';
import { z } from 'zod';

// ====================================================================
// TYPES
// ====================================================================

export interface SystemSettingRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
}

// ====================================================================
// VALIDATION
// ====================================================================

const upsertSettingSchema = z.object({
  key: z
    .string()
    .min(1, 'Key wajib diisi')
    .max(100, 'Key maksimal 100 karakter')
    .regex(/^[a-z][a-z0-9_]*$/, 'Key harus lowercase snake_case'),
  value: z.record(z.string(), z.unknown()),
  description: z.string().max(500).nullable().optional(),
});

// Keys that must NEVER be stored or returned via system_settings UI
const FORBIDDEN_KEYS = [
  'gemini_api_key',
  'supabase_service_role_key',
  'resend_api_key',
  'secret',
  'token',
  'password',
  'private_key',
];

function isForbiddenKey(key: string): boolean {
  const lower = key.toLowerCase();
  return FORBIDDEN_KEYS.some((fk) => lower.includes(fk));
}

// ====================================================================
// AUTH HELPERS
// ====================================================================

async function requireStaff() {
  const { isAuthenticated, internalUser } = await getCurrentInternalUser();
  if (!isAuthenticated || !internalUser) {
    throw new Error('Sesi kedinasan tidak valid. Silakan masuk kembali.');
  }
  if (!internalUser.is_active) {
    throw new Error('Akun Anda dinonaktifkan. Hubungi Administrator Sistem.');
  }
  return internalUser;
}

async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== 'admin') {
    throw new Error('Akses ditolak: Hanya Administrator yang dapat mengubah pengaturan sistem.');
  }
  return user;
}

// ====================================================================
// READ ACTIONS
// ====================================================================

/**
 * Fetch all system settings. Available to active internal staff.
 */
export async function getSystemSettingsAction(): Promise<{
  success: boolean;
  data: SystemSettingRow[];
  error?: string;
}> {
  try {
    await requireStaff();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('system_settings')
      .select('id, key, value, description, updated_at')
      .order('key', { ascending: true });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    // Filter out any settings with forbidden keys (defense in depth)
    const safeData = (data ?? []).filter(
      (s) => !isForbiddenKey(s.key)
    ) as SystemSettingRow[];

    return { success: true, data: safeData };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Gagal memuat pengaturan.' };
  }
}

/**
 * Fetch a single setting by key.
 */
export async function getSettingByKeyAction(key: string): Promise<{
  success: boolean;
  data: SystemSettingRow | null;
  error?: string;
}> {
  try {
    await requireStaff();

    if (isForbiddenKey(key)) {
      return { success: false, data: null, error: 'Pengaturan ini tidak dapat diakses melalui UI.' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('id, key, value, description, updated_at')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data as SystemSettingRow | null };
  } catch (err) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Gagal memuat pengaturan.' };
  }
}

// ====================================================================
// MUTATION ACTIONS (ADMIN ONLY)
// ====================================================================

/**
 * Upsert a system setting. Admin only.
 */
export async function upsertSettingAction(input: {
  key: string;
  value: Record<string, unknown>;
  description?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // Validate input
    const parsed = upsertSettingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validasi gagal.' };
    }

    // Block forbidden keys
    if (isForbiddenKey(parsed.data.key)) {
      return { success: false, error: 'Kunci pengaturan ini tidak boleh disimpan melalui UI admin.' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          key: parsed.data.key,
          value: parsed.data.value as unknown as Json,
          description: parsed.data.description ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/pengaturan-sistem');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.' };
  }
}

/**
 * Delete a system setting by key. Admin only.
 */
export async function deleteSettingAction(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (isForbiddenKey(key)) {
      return { success: false, error: 'Pengaturan ini tidak dapat dihapus melalui UI.' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('key', key);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/pengaturan-sistem');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal menghapus pengaturan.' };
  }
}
