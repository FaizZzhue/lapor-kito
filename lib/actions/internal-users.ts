'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentInternalUser } from '@/lib/auth/session';
import {
  inviteUserSchema,
  updateInternalUserSchema,
  type InviteUserInput,
  type UpdateInternalUserInput,
} from '@/lib/validators/internal-user';
import type { InternalUserRow } from '@/types/database';

/**
 * Verify caller is an active administrator.
 */
async function requireAdmin() {
  const { isAuthenticated, internalUser } = await getCurrentInternalUser();
  if (!isAuthenticated || !internalUser) {
    throw new Error('Sesi kedinasan tidak valid. Silakan masuk kembali.');
  }
  if (!internalUser.is_active) {
    throw new Error('Akun Anda dinonaktifkan. Hubungi Administrator Sistem.');
  }
  if (internalUser.role !== 'admin') {
    throw new Error('Akses ditolak: Hanya Administrator Sistem yang memiliki hak kelola pengguna internal.');
  }
  return internalUser;
}

/**
 * Get internal users with search, role, and status filters.
 */
export async function getInternalUsersAction(filters?: {
  search?: string;
  role?: 'all' | 'admin' | 'petugas';
  status?: 'all' | 'active' | 'inactive';
}): Promise<{
  success: boolean;
  data: InternalUserRow[];
  error?: string;
}> {
  try {
    await requireAdmin();
    const adminClient = createAdminClient();

    let query = adminClient
      .from('internal_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }

    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pengguna internal';
    return { success: false, data: [], error: msg };
  }
}

/**
 * Get detail of an internal user by ID.
 */
export async function getInternalUserByIdAction(id: string): Promise<{
  success: boolean;
  data: InternalUserRow | null;
  error?: string;
}> {
  try {
    await requireAdmin();
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('internal_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return { success: false, data: null, error: error?.message || 'Pengguna tidak ditemukan' };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat profil pengguna';
    return { success: false, data: null, error: msg };
  }
}

/**
 * Invite a new internal user using Supabase Auth Invitation API.
 * Never handles plaintext passwords.
 */
export async function inviteInternalUserAction(
  rawData: InviteUserInput
): Promise<{ success: boolean; data?: InternalUserRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = inviteUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data pengguna tidak valid' };
    }

    const email = parsed.data.email.trim().toLowerCase();
    const adminClient = createAdminClient();

    // 1. Check if user already exists in internal_users
    const { data: existingInternal } = await adminClient
      .from('internal_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingInternal) {
      return { success: false, error: `Surel "${email}" sudah terdaftar sebagai pengguna internal.` };
    }

    // 2. Provision user via Supabase Auth Admin API (invitation mechanism)
    let authUserId: string | null = null;

    // First attempt: Official inviteUserByEmail
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: parsed.data.full_name.trim(),
          role: parsed.data.role,
        },
      }
    );

    if (!inviteError && inviteData?.user) {
      authUserId = inviteData.user.id;
    } else {
      // Fallback: Generate invitation link or create pre-confirmed user
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          data: {
            full_name: parsed.data.full_name.trim(),
            role: parsed.data.role,
          },
        },
      });

      if (!linkError && linkData?.user) {
        authUserId = linkData.user.id;
      } else {
        return {
          success: false,
          error: `Gagal mengirim undangan autentikasi: ${inviteError?.message || linkError?.message || 'Layanan autentikasi menolak permintaan.'}`,
        };
      }
    }

    if (!authUserId) {
      return { success: false, error: 'Gagal mendapatkan ID kredensial autentikasi pengguna.' };
    }

    // 3. Insert into public.internal_users
    const { data: createdInternalUser, error: insertError } = await adminClient
      .from('internal_users')
      .insert({
        id: authUserId,
        email,
        full_name: parsed.data.full_name.trim(),
        role: parsed.data.role,
        phone: parsed.data.phone?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up orphaned auth user if insert fails
      await adminClient.auth.admin.deleteUser(authUserId);
      return { success: false, error: `Gagal menyimpan profil pengguna internal: ${insertError.message}` };
    }

    revalidatePath('/admin/pengguna-internal');
    revalidatePath('/admin');
    return { success: true, data: createdInternalUser };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengundang pengguna baru';
    return { success: false, error: msg };
  }
}

/**
 * Update internal user profile (full_name, role, phone).
 */
export async function updateInternalUserAction(
  id: string,
  rawData: UpdateInternalUserInput
): Promise<{ success: boolean; data?: InternalUserRow; error?: string }> {
  try {
    const currentAdmin = await requireAdmin();
    const parsed = updateInternalUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data pembaruan tidak valid' };
    }

    // Safety: Admin cannot downgrade their own role
    if (currentAdmin.id === id && parsed.data.role && parsed.data.role !== 'admin') {
      return {
        success: false,
        error: 'Anda tidak dapat mencabut hak Administrator dari akun Anda sendiri saat sedang mengelola sistem.',
      };
    }

    // Safety: Admin cannot deactivate their own account
    if (currentAdmin.id === id && parsed.data.is_active === false) {
      return {
        success: false,
        error: 'Anda tidak dapat menonaktifkan akun Administrator Anda sendiri saat sedang aktif.',
      };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('internal_users')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/pengguna-internal');
    revalidatePath('/admin');
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil pengguna';
    return { success: false, error: msg };
  }
}

/**
 * Toggle user active/inactive status.
 */
export async function toggleInternalUserStatusAction(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentAdmin = await requireAdmin();

    // Safety: Admin cannot deactivate their own account
    if (currentAdmin.id === id && !is_active) {
      return {
        success: false,
        error: 'Anda tidak dapat menonaktifkan akun Administrator Anda sendiri saat sedang aktif.',
      };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('internal_users')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/pengguna-internal');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengubah status pengguna';
    return { success: false, error: msg };
  }
}
