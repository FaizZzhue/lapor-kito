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
import { sendInternalUserInvitationEmail } from '@/lib/email/resend';
import type { InternalUserRow } from '@/types/database';

export interface InviteUserResult {
  success: boolean;
  data?: InternalUserRow;
  deliveryStatus?: 'activated' | 'email_sent' | 'local_ready' | 'email_failed';
  activationUrl?: string;
  message?: string;
  error?: string;
}

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

    const { data: rawUsers, error } = await query;

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const users = rawUsers || [];
    const instIds = users.map((u: any) => u.institution_id).filter(Boolean);
    const unitIds = users.map((u: any) => u.institution_unit_id).filter(Boolean);

    const instMap = new Map<string, { id: string; code: string; name: string; short_name: string | null }>();
    const unitMap = new Map<string, { id: string; code: string; name: string }>();

    if (instIds.length > 0) {
      try {
        const { data: insts } = await adminClient
          .from('institutions')
          .select('id, code, name, short_name')
          .in('id', instIds);
        if (insts) {
          insts.forEach((i) => instMap.set(i.id, i));
        }
      } catch {
        // Non-fatal if query fails
      }
    }

    if (unitIds.length > 0) {
      try {
        const { data: units } = await adminClient
          .from('institution_units')
          .select('id, code, name')
          .in('id', unitIds);
        if (units) {
          units.forEach((u) => unitMap.set(u.id, u));
        }
      } catch {
        // Non-fatal if query fails
      }
    }

    const hydrated = users.map((u: any) => ({
      ...u,
      institution: u.institution_id ? instMap.get(u.institution_id) || null : null,
      unit: u.institution_unit_id ? unitMap.get(u.institution_unit_id) || null : null,
    }));

    return { success: true, data: hydrated as any };
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
 * Invite or directly provision a new internal user using Supabase Auth Admin API.
 * Ensures auth.users and internal_users stay in perfect sync, handles email delivery,
 * supports testing/local domains, and executes compensating rollback on failure.
 */
export async function inviteInternalUserAction(
  rawData: InviteUserInput
): Promise<InviteUserResult> {
  try {
    await requireAdmin();
    const parsed = inviteUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data pengguna tidak valid' };
    }

    const email = parsed.data.email.trim().toLowerCase();
    const adminClient = createAdminClient();

    // 1. For role 'petugas', verify institution_id is valid and active in database
    let targetInst: { id: string; name: string; code: string } | null = null;
    if (parsed.data.role === 'petugas') {
      if (!parsed.data.institution_id) {
        return { success: false, error: 'Instansi penugasan (OPD) wajib dipilih untuk peran Petugas.' };
      }

      const { data: instData, error: instErr } = await adminClient
        .from('institutions')
        .select('id, name, code, is_active')
        .eq('id', parsed.data.institution_id)
        .maybeSingle();

      if (instErr || !instData || !instData.is_active) {
        return { success: false, error: 'Instansi penugasan yang dipilih tidak ditemukan atau non-aktif.' };
      }
      targetInst = instData;

      if (parsed.data.institution_unit_id) {
        const { data: unitData } = await adminClient
          .from('institution_units')
          .select('id, name')
          .eq('id', parsed.data.institution_unit_id)
          .eq('institution_id', targetInst.id)
          .maybeSingle();

        if (!unitData) {
          return { success: false, error: 'Unit kerja yang dipilih tidak terdaftar di bawah instansi tersebut.' };
        }
      }
    }

    // 2. Check if user already exists in public.internal_users
    const { data: existingInternal } = await adminClient
      .from('internal_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingInternal) {
      return { success: false, error: `Surel "${email}" sudah terdaftar sebagai pengguna internal.` };
    }

    // 3. Check if orphan auth user exists in auth.users
    const { data: authList } = await adminClient.auth.admin.listUsers();
    const existingAuth = authList?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (existingAuth) {
      // Clean up orphaned auth user that lacks internal_users record to avoid conflict
      console.warn(`Cleaning up orphaned auth user ${existingAuth.id} (${email}) without internal profile`);
      await adminClient.auth.admin.deleteUser(existingAuth.id);
    }

    // 4. Provision User in Supabase Auth
    let authUserId: string | null = null;
    let deliveryStatus: 'activated' | 'email_sent' | 'local_ready' | 'email_failed' = 'activated';
    let activationUrl: string | undefined = undefined;
    let userMessage = '';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetRedirectTo = `${baseUrl}/admin/reset-password`;

    if (parsed.data.initialPassword) {
      // -------------------------------------------------------------
      // PATH A: DIRECT ACTIVATION (Initial Password Provided by Admin)
      // -------------------------------------------------------------
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: parsed.data.initialPassword,
        email_confirm: true,
        user_metadata: {
          full_name: parsed.data.full_name.trim(),
          role: parsed.data.role,
        },
      });

      if (createError || !createData.user) {
        return {
          success: false,
          error: `Gagal membuat kredensial akun: ${createError?.message || 'Layanan autentikasi menolak permintaan.'}`,
        };
      }

      authUserId = createData.user.id;
      deliveryStatus = 'activated';
      userMessage = `Akun aparatur "${parsed.data.full_name}" berhasil dibuat dan langsung diaktifkan dengan kata sandi awal.`;
    } else {
      // -------------------------------------------------------------
      // PATH B: EMAIL INVITATION & SECURE ACTIVATION LINK
      // -------------------------------------------------------------
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo: resetRedirectTo,
          data: {
            full_name: parsed.data.full_name.trim(),
            role: parsed.data.role,
          },
        },
      });

      if (linkError || !linkData?.user) {
        return {
          success: false,
          error: `Gagal menghasilkan tautan aktivasi akun: ${linkError?.message || 'Layanan autentikasi gagal.'}`,
        };
      }

      authUserId = linkData.user.id;
      const actionLink = linkData.properties?.action_link;
      activationUrl = actionLink || resetRedirectTo;

      if (email.endsWith('.local')) {
        // Local/testing domain: do not send to public SMTP/Resend
        deliveryStatus = 'local_ready';
        userMessage = `Akun dinas internal (.local) berhasil disiapkan. Karena surel berekstensi lokal/pengujian, gunakan tautan aktivasi untuk membuat kata sandi.`;
      } else {
        // Public domain: Attempt official branded invitation via Resend
        const emailRes = await sendInternalUserInvitationEmail({
          to: email,
          fullName: parsed.data.full_name.trim(),
          role: parsed.data.role,
          institutionName: targetInst?.name || null,
          activationUrl: activationUrl,
        });

        if (emailRes.success) {
          deliveryStatus = 'email_sent';
          userMessage = `Undangan aktivasi akun berhasil dikirimkan ke surel resmi "${email}".`;
        } else {
          deliveryStatus = 'email_failed';
          userMessage = `Akun berhasil didaftarkan di sistem, namun pengiriman surel undangan gagal (${emailRes.reason || 'Koneksi email tidak tersedia'}). Silakan salin tautan aktivasi berikut secara manual.`;
        }
      }
    }

    if (!authUserId) {
      return { success: false, error: 'Gagal memperoleh ID autentikasi pengguna.' };
    }

    // 5. Insert into public.internal_users
    const userPayload: Record<string, any> = {
      id: authUserId,
      email,
      full_name: parsed.data.full_name.trim(),
      role: parsed.data.role,
      phone: parsed.data.phone?.trim() || null,
      institution_id: parsed.data.role === 'petugas' ? parsed.data.institution_id : null,
      institution_unit_id:
        parsed.data.role === 'petugas' && parsed.data.institution_id
          ? parsed.data.institution_unit_id || null
          : null,
      is_active: true,
    };

    let createdInternalUser: any = null;
    const { data: insertedFull, error: insertFullError } = await adminClient
      .from('internal_users')
      .insert(userPayload)
      .select()
      .single();

    if (!insertFullError && insertedFull) {
      createdInternalUser = insertedFull;
    } else {
      // Compensating rollback: delete auth user to prevent orphan account
      console.error('Failed to insert internal user profile. Executing compensating rollback:', insertFullError);
      await adminClient.auth.admin.deleteUser(authUserId);
      return {
        success: false,
        error: `Gagal menyimpan profil pengguna internal: ${insertFullError?.message || 'Kesalahan basis data'}. Pembuatan akun dibatalkan.`,
      };
    }

    try {
      revalidatePath('/admin/pengguna-internal');
      revalidatePath('/admin');
    } catch {
      // Non-fatal if outside request context
    }

    return {
      success: true,
      data: createdInternalUser,
      deliveryStatus,
      activationUrl,
      message: userMessage,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengundang pengguna baru';
    return { success: false, error: msg };
  }
}

/**
 * Update internal user profile (full_name, role, phone, institution).
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
    const updatePayload: Record<string, any> = { ...parsed.data };

    const { data, error } = await adminClient
      .from('internal_users')
      .update(updatePayload as any)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      revalidatePath('/admin/pengguna-internal');
      revalidatePath('/admin');
      return { success: true, data: data as InternalUserRow };
    }

    // Fallback if institution_id column not present in DB
    delete updatePayload.institution_id;
    delete updatePayload.institution_unit_id;
    const { data: fallbackData, error: fallbackError } = await adminClient
      .from('internal_users')
      .update(updatePayload as any)
      .eq('id', id)
      .select()
      .single();

    if (fallbackError) {
      return { success: false, error: fallbackError.message };
    }

    revalidatePath('/admin/pengguna-internal');
    revalidatePath('/admin');
    return { success: true, data: fallbackData as InternalUserRow };
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
