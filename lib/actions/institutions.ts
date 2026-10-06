'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentInternalUser } from '@/lib/auth/session';
import {
  createInstitutionSchema,
  updateInstitutionSchema,
  createUnitSchema,
  updateUnitSchema,
  type CreateInstitutionInput,
  type UpdateInstitutionInput,
  type CreateUnitInput,
  type UpdateUnitInput,
} from '@/lib/validators/institution';
import type { InstitutionRow, InstitutionUnitRow } from '@/types/database';

export interface InstitutionWithUnitsCount extends InstitutionRow {
  units_count: number;
}

export interface UnitWithInstitution extends InstitutionUnitRow {
  institution?: {
    id: string;
    code: string;
    name: string;
    short_name: string | null;
  } | null;
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
    throw new Error('Akses ditolak: Hanya Administrator Sistem yang memiliki hak kelola data master.');
  }
  return internalUser;
}

// ====================================================================
// INSTITUTION ACTIONS
// ====================================================================

export async function getInstitutionsAction(filters?: {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}): Promise<{ success: boolean; data: InstitutionWithUnitsCount[]; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    let query = supabase
      .from('institutions')
      .select('*, institution_units(count)')
      .order('name', { ascending: true });

    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,short_name.ilike.%${q}%,mandate.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet on remote DB (pending migration), return empty list gracefully
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { success: true, data: [] };
      }
      return { success: false, data: [], error: error.message };
    }

    const mapped: InstitutionWithUnitsCount[] = (data || []).map((row) => {
      const unitsData = (row as Record<string, unknown>).institution_units as
        | { count: number }[]
        | { count: number }
        | null
        | undefined;
      const count = Array.isArray(unitsData)
        ? (unitsData[0]?.count ?? 0)
        : (unitsData?.count ?? 0);
      return {
        ...row,
        units_count: count,
      };
    });

    return { success: true, data: mapped };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat daftar instansi';
    return { success: false, data: [], error: msg };
  }
}

export async function getInstitutionByIdAction(id: string): Promise<{
  success: boolean;
  data: (InstitutionRow & { units: InstitutionUnitRow[] }) | null;
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: inst, error: instErr } = await supabase
      .from('institutions')
      .select('*')
      .eq('id', id)
      .single();

    if (instErr) {
      if (instErr.code === '42P01') return { success: false, data: null, error: 'Tabel instansi belum siap.' };
      return { success: false, data: null, error: instErr.message };
    }

    const { data: units, error: unitsErr } = await supabase
      .from('institution_units')
      .select('*')
      .eq('institution_id', id)
      .order('name', { ascending: true });

    if (unitsErr && unitsErr.code !== '42P01') {
      return { success: false, data: null, error: unitsErr.message };
    }

    return {
      success: true,
      data: {
        ...inst,
        units: units || [],
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat detail instansi';
    return { success: false, data: null, error: msg };
  }
}

export async function createInstitutionAction(
  rawData: CreateInstitutionInput
): Promise<{ success: boolean; data?: InstitutionRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = createInstitutionSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('institutions')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Kode instansi "${parsed.data.code}" sudah digunakan. Gunakan kode lain.` };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/instansi');
    revalidatePath('/admin');
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menambahkan instansi';
    return { success: false, error: msg };
  }
}

export async function updateInstitutionAction(
  id: string,
  rawData: UpdateInstitutionInput
): Promise<{ success: boolean; data?: InstitutionRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = updateInstitutionSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('institutions')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Kode instansi "${parsed.data.code}" sudah digunakan.` };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/instansi');
    revalidatePath(`/admin/instansi/${id}`);
    revalidatePath('/admin/unit');
    revalidatePath('/admin');
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui instansi';
    return { success: false, error: msg };
  }
}

export async function deleteInstitutionAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Check for dependent units
    const { count, error: countErr } = await supabase
      .from('institution_units')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', id);

    if (countErr && countErr.code !== '42P01') {
      return { success: false, error: countErr.message };
    }

    if (count && count > 0) {
      return {
        success: false,
        error: `Instansi ini tidak dapat dihapus karena masih memiliki ${count} unit kerja terdaftar. Untuk menjaga integritas data, non-aktifkan instansi atau hapus unit kerja terkait terlebih dahulu.`,
      };
    }

    const { error: delErr } = await supabase.from('institutions').delete().eq('id', id);

    if (delErr) {
      return { success: false, error: delErr.message };
    }

    revalidatePath('/admin/instansi');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus instansi';
    return { success: false, error: msg };
  }
}

// ====================================================================
// UNIT ACTIONS
// ====================================================================

export async function getUnitsAction(filters?: {
  search?: string;
  institutionId?: string;
  status?: 'all' | 'active' | 'inactive';
}): Promise<{ success: boolean; data: UnitWithInstitution[]; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    let query = supabase
      .from('institution_units')
      .select('*, institution:institutions(id, code, name, short_name)')
      .order('name', { ascending: true });

    if (filters?.institutionId && filters.institutionId !== 'all') {
      query = query.eq('institution_id', filters.institutionId);
    }

    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,work_area.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { success: true, data: [] };
      }
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data as UnitWithInstitution[]) || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat daftar unit';
    return { success: false, data: [], error: msg };
  }
}

export async function createUnitAction(
  rawData: CreateUnitInput
): Promise<{ success: boolean; data?: InstitutionUnitRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = createUnitSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data unit tidak valid' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('institution_units')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Kode unit "${parsed.data.code}" sudah digunakan.` };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/unit');
    revalidatePath(`/admin/instansi/${parsed.data.institution_id}`);
    revalidatePath('/admin/instansi');
    revalidatePath('/admin');
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menambahkan unit';
    return { success: false, error: msg };
  }
}

export async function updateUnitAction(
  id: string,
  rawData: UpdateUnitInput
): Promise<{ success: boolean; data?: InstitutionUnitRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = updateUnitSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data unit tidak valid' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('institution_units')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Kode unit "${parsed.data.code}" sudah digunakan.` };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/unit');
    if (data?.institution_id) {
      revalidatePath(`/admin/instansi/${data.institution_id}`);
    }
    revalidatePath('/admin/instansi');
    revalidatePath('/admin');
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui unit';
    return { success: false, error: msg };
  }
}

export async function deleteUnitAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase.from('institution_units').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/unit');
    revalidatePath('/admin/instansi');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus unit';
    return { success: false, error: msg };
  }
}
