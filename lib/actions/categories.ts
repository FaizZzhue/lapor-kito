'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentInternalUser } from '@/lib/auth/session';
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/lib/validators/category';
import type { CategoryRow } from '@/types/database';

export interface CategoryWithReportsCount extends CategoryRow {
  reports_count: number;
}

const CORE_CATEGORY_SLUGS = [
  'infrastruktur-jalan',
  'kebersihan-lingkungan',
  'drainase-saluran-air',
  'penerangan-jalan',
];

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
    throw new Error('Akses ditolak: Hanya Administrator Sistem yang memiliki hak kelola kategori.');
  }
  return internalUser;
}

/**
 * Get all categories with optional search and status filter.
 * Internal admins and staff can view full administrative lists.
 */
export async function getCategoriesAction(filters?: {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}): Promise<{
  success: boolean;
  data: CategoryWithReportsCount[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('categories')
      .select('*, reports(count)')
      .order('display_order', { ascending: true })
      .order('name_id', { ascending: true });

    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      query = query.or(`name_id.ilike.%${q}%,name_en.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const mapped: CategoryWithReportsCount[] = (data || []).map((row) => {
      const reportsData = (row as Record<string, unknown>).reports as
        | { count: number }[]
        | { count: number }
        | null
        | undefined;
      const count = Array.isArray(reportsData)
        ? (reportsData[0]?.count ?? 0)
        : (reportsData?.count ?? 0);
      return {
        ...row,
        reports_count: count,
      };
    });

    return { success: true, data: mapped };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat daftar kategori';
    return { success: false, data: [], error: msg };
  }
}

/**
 * Get detail of a specific category by ID.
 */
export async function getCategoryByIdAction(id: string): Promise<{
  success: boolean;
  data: CategoryWithReportsCount | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*, reports(count)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return { success: false, data: null, error: error?.message || 'Kategori tidak ditemukan' };
    }

    const reportsData = (data as Record<string, unknown>).reports as
      | { count: number }[]
      | { count: number }
      | null
      | undefined;
    const count = Array.isArray(reportsData)
      ? (reportsData[0]?.count ?? 0)
      : (reportsData?.count ?? 0);

    return {
      success: true,
      data: {
        ...data,
        reports_count: count,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memuat detail kategori';
    return { success: false, data: null, error: msg };
  }
}

/**
 * Create a new report category.
 */
export async function createCategoryAction(
  rawData: CreateCategoryInput
): Promise<{ success: boolean; data?: CategoryRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = createCategorySchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data kategori tidak valid' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Slug kategori "${parsed.data.slug}" sudah digunakan. Gunakan slug lain.` };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/kategori-laporan');
    revalidatePath('/lapor');
    revalidatePath('/admin');
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menambahkan kategori';
    return { success: false, error: msg };
  }
}

/**
 * Update an existing category.
 */
export async function updateCategoryAction(
  id: string,
  rawData: UpdateCategoryInput
): Promise<{ success: boolean; data?: CategoryRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = updateCategorySchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data pembaruan tidak valid' };
    }

    const supabase = await createClient();

    // Verify existing record
    const { data: existing, error: fetchErr } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Kategori tidak ditemukan' };
    }

    // Protect core MVP slugs from accidental modification
    if (parsed.data.slug && parsed.data.slug !== existing.slug && CORE_CATEGORY_SLUGS.includes(existing.slug)) {
      return {
        success: false,
        error: `Slug "${existing.slug}" adalah taksonomi inti sistem MVP dan tidak boleh diubah untuk menjaga kompatibilitas analitik AI dan riwayat laporan.`,
      };
    }

    const { data, error } = await supabase
      .from('categories')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Slug kategori "${parsed.data.slug}" sudah digunakan.` };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/kategori-laporan');
    revalidatePath('/lapor');
    revalidatePath('/admin');
    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui kategori';
    return { success: false, error: msg };
  }
}

/**
 * Toggle category active status.
 */
export async function toggleCategoryStatusAction(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('categories')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/kategori-laporan');
    revalidatePath('/lapor');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengubah status kategori';
    return { success: false, error: msg };
  }
}

/**
 * Delete category with strict historical safety:
 * 1. Prohibits deleting the 4 Core MVP taxonomy categories.
 * 2. Prohibits deleting any category referenced by existing reports.
 */
export async function deleteCategoryAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // 1. Check existing record
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id, slug, name_id')
      .eq('id', id)
      .single();

    if (catErr || !cat) {
      return { success: false, error: 'Kategori tidak ditemukan' };
    }

    // 2. Protect core taxonomy categories
    if (CORE_CATEGORY_SLUGS.includes(cat.slug)) {
      return {
        success: false,
        error: `Kategori "${cat.name_id}" adalah taksonomi standar MVP Kota Palembang dan tidak dapat dihapus. Anda dapat menonaktifkan statusnya jika tidak ingin ditampilkan kepada publik.`,
      };
    }

    // 3. Inspect FK reference from reports table
    const { count, error: countErr } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countErr) {
      return { success: false, error: countErr.message };
    }

    if (count && count > 0) {
      return {
        success: false,
        error: `Kategori "${cat.name_id}" tidak dapat dihapus karena telah terikat pada ${count} laporan masyarakat. Untuk menjaga integritas data historis, silakan non-aktifkan kategori ini.`,
      };
    }

    // 4. Safe delete
    const { error: delErr } = await supabase.from('categories').delete().eq('id', id);

    if (delErr) {
      return { success: false, error: delErr.message };
    }

    revalidatePath('/admin/kategori-laporan');
    revalidatePath('/lapor');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus kategori';
    return { success: false, error: msg };
  }
}
