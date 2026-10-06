'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentInternalUser } from '@/lib/auth/session';
import {
  createAuthorityRuleSchema,
  updateAuthorityRuleSchema,
  type CreateAuthorityRuleInput,
  type UpdateAuthorityRuleInput,
} from '@/lib/validators/authority-rule';
import type {
  AuthorityRuleRow,
  CategoryRow,
  InstitutionRow,
  InstitutionUnitRow,
} from '@/types/database';

export interface AuthorityRuleWithRelations extends AuthorityRuleRow {
  category: {
    id: string;
    slug: string;
    name_id: string;
  } | null;
  kecamatan: {
    id: string;
    code: string;
    name: string;
  } | null;
  institution: {
    id: string;
    code: string;
    name: string;
    short_name: string | null;
  } | null;
  institution_unit: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface AuthorityRuleFormData {
  categories: Array<Pick<CategoryRow, 'id' | 'slug' | 'name_id'>>;
  kecamatan: Array<{ id: string; code: string; name: string }>;
  institutions: Array<Pick<InstitutionRow, 'id' | 'code' | 'name' | 'short_name'>>;
  institutionUnits: Array<Pick<InstitutionUnitRow, 'id' | 'institution_id' | 'code' | 'name'>>;
}

/**
 * Verify caller is an active internal staff member (admin or petugas).
 */
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

/**
 * Verify caller is an active administrator.
 */
async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== 'admin') {
    throw new Error('Akses ditolak: Hanya Administrator Sistem yang memiliki hak kelola aturan kewenangan.');
  }
  return user;
}

/**
 * Fetch list of authority rules with filter and search options.
 */
export async function getAuthorityRulesAction(filters?: {
  search?: string;
  categoryId?: string;
  institutionId?: string;
  kecamatanId?: string;
  status?: 'all' | 'active' | 'inactive';
}): Promise<{
  success: boolean;
  data: AuthorityRuleWithRelations[];
  totalCount: number;
  error?: string;
}> {
  try {
    await requireStaff();
    const supabase = await createClient();

    let query = supabase
      .from('authority_rules')
      .select(`
        *,
        category:categories(id, slug, name_id),
        kecamatan:kecamatan(id, code, name),
        institution:institutions(id, code, name, short_name),
        institution_unit:institution_units!fk_authority_rules_unit_institution(id, code, name)
      `, { count: 'exact' });

    // Status filter
    if (filters?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Category filter
    if (filters?.categoryId && filters.categoryId !== 'all') {
      query = query.eq('category_id', filters.categoryId);
    }

    // Institution filter
    if (filters?.institutionId && filters.institutionId !== 'all') {
      query = query.eq('institution_id', filters.institutionId);
    }

    // Kecamatan filter
    if (filters?.kecamatanId && filters.kecamatanId !== 'all') {
      if (filters.kecamatanId === 'all_palembang') {
        query = query.is('kecamatan_id', null);
      } else {
        query = query.eq('kecamatan_id', filters.kecamatanId);
      }
    }

    // Search filter
    if (filters?.search && filters.search.trim() !== '') {
      const s = `%${filters.search.trim()}%`;
      query = query.or(`rule_code.ilike.${s},context_title.ilike.${s},context_description.ilike.${s},regulation_basis.ilike.${s}`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching authority rules:', error);
      return { success: false, data: [], totalCount: 0, error: error.message };
    }

    return {
      success: true,
      data: (data as unknown as AuthorityRuleWithRelations[]) || [],
      totalCount: count ?? 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data kewenangan';
    return { success: false, data: [], totalCount: 0, error: message };
  }
}

/**
 * Fetch a single authority rule by ID.
 */
export async function getAuthorityRuleByIdAction(
  id: string
): Promise<{ success: boolean; data: AuthorityRuleWithRelations | null; error?: string }> {
  try {
    await requireStaff();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('authority_rules')
      .select(`
        *,
        category:categories(id, slug, name_id),
        kecamatan:kecamatan(id, code, name),
        institution:institutions(id, code, name, short_name),
        institution_unit:institution_units!fk_authority_rules_unit_institution(id, code, name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return { success: false, data: null, error: error?.message || 'Aturan kewenangan tidak ditemukan' };
    }

    return { success: true, data: data as unknown as AuthorityRuleWithRelations };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat detail aturan kewenangan';
    return { success: false, data: null, error: message };
  }
}

/**
 * Fetch supporting master data needed for creating and editing authority rules.
 */
export async function getAuthorityRuleFormDataAction(): Promise<{
  success: boolean;
  data: AuthorityRuleFormData;
  error?: string;
}> {
  try {
    await requireStaff();
    const supabase = await createClient();

    const [catRes, kecRes, instRes, unitRes] = await Promise.all([
      supabase.from('categories').select('id, slug, name_id').eq('is_active', true).order('display_order'),
      supabase.from('kecamatan').select('id, code, name').order('name'),
      supabase.from('institutions').select('id, code, name, short_name').eq('is_active', true).order('name'),
      supabase.from('institution_units').select('id, institution_id, code, name').eq('is_active', true).order('name'),
    ]);

    if (catRes.error || kecRes.error || instRes.error || unitRes.error) {
      const err = catRes.error || kecRes.error || instRes.error || unitRes.error;
      return {
        success: false,
        data: { categories: [], kecamatan: [], institutions: [], institutionUnits: [] },
        error: err?.message || 'Gagal memuat master data pendukung formulir',
      };
    }

    return {
      success: true,
      data: {
        categories: catRes.data || [],
        kecamatan: kecRes.data || [],
        institutions: instRes.data || [],
        institutionUnits: unitRes.data || [],
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data pendukung formulir';
    return {
      success: false,
      data: { categories: [], kecamatan: [], institutions: [], institutionUnits: [] },
      error: message,
    };
  }
}

/**
 * Create a new authority rule.
 */
export async function createAuthorityRuleAction(
  payload: CreateAuthorityRuleInput
): Promise<{ success: boolean; data?: AuthorityRuleRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = createAuthorityRuleSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Validasi formulir gagal' };
    }

    const {
      ruleCode,
      categoryId,
      kecamatanId,
      contextTitle,
      contextDescription,
      institutionId,
      institutionUnitId,
      regulationBasis,
      isActive,
    } = parsed.data;

    const supabase = await createClient();

    // Verify unit belongs to the institution if provided
    if (institutionUnitId) {
      const { data: unit, error: unitErr } = await supabase
        .from('institution_units')
        .select('id, institution_id')
        .eq('id', institutionUnitId)
        .eq('institution_id', institutionId)
        .maybeSingle();

      if (unitErr || !unit) {
        return {
          success: false,
          error: 'Unit pelaksana teknis yang dipilih tidak terdaftar di bawah instansi berwenang tersebut.',
        };
      }
    }

    const { data: newRule, error: insertErr } = await supabase
      .from('authority_rules')
      .insert({
        rule_code: ruleCode.trim(),
        category_id: categoryId,
        kecamatan_id: kecamatanId || null,
        context_title: contextTitle.trim(),
        context_description: contextDescription?.trim() || null,
        institution_id: institutionId,
        institution_unit_id: institutionUnitId || null,
        regulation_basis: regulationBasis.trim(),
        is_active: isActive,
      })
      .select()
      .single();

    if (insertErr || !newRule) {
      if (insertErr?.code === '23505') {
        return { success: false, error: `Kode aturan "${ruleCode}" sudah terdaftar dalam sistem.` };
      }
      return { success: false, error: insertErr?.message || 'Gagal menyimpan aturan kewenangan.' };
    }

    revalidatePath('/admin/data-kewenangan');
    return { success: true, data: newRule };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat aturan kewenangan';
    return { success: false, error: message };
  }
}

/**
 * Update an existing authority rule.
 */
export async function updateAuthorityRuleAction(
  payload: UpdateAuthorityRuleInput
): Promise<{ success: boolean; data?: AuthorityRuleRow; error?: string }> {
  try {
    await requireAdmin();
    const parsed = updateAuthorityRuleSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Validasi formulir gagal' };
    }

    const {
      id,
      ruleCode,
      categoryId,
      kecamatanId,
      contextTitle,
      contextDescription,
      institutionId,
      institutionUnitId,
      regulationBasis,
      isActive,
    } = parsed.data;

    const supabase = await createClient();

    // Verify unit belongs to the institution if provided
    if (institutionUnitId) {
      const { data: unit, error: unitErr } = await supabase
        .from('institution_units')
        .select('id, institution_id')
        .eq('id', institutionUnitId)
        .eq('institution_id', institutionId)
        .maybeSingle();

      if (unitErr || !unit) {
        return {
          success: false,
          error: 'Unit pelaksana teknis yang dipilih tidak terdaftar di bawah instansi berwenang tersebut.',
        };
      }
    }

    const { data: updatedRule, error: updateErr } = await supabase
      .from('authority_rules')
      .update({
        rule_code: ruleCode.trim(),
        category_id: categoryId,
        kecamatan_id: kecamatanId || null,
        context_title: contextTitle.trim(),
        context_description: contextDescription?.trim() || null,
        institution_id: institutionId,
        institution_unit_id: institutionUnitId || null,
        regulation_basis: regulationBasis.trim(),
        is_active: isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updatedRule) {
      if (updateErr?.code === '23505') {
        return { success: false, error: `Kode aturan "${ruleCode}" sudah digunakan aturan lain.` };
      }
      return { success: false, error: updateErr?.message || 'Gagal memperbarui aturan kewenangan.' };
    }

    revalidatePath('/admin/data-kewenangan');
    revalidatePath(`/admin/data-kewenangan/${id}`);
    return { success: true, data: updatedRule };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui aturan kewenangan';
    return { success: false, error: message };
  }
}

/**
 * Toggle active status of an authority rule.
 */
export async function toggleAuthorityRuleStatusAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('authority_rules')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/data-kewenangan');
    revalidatePath(`/admin/data-kewenangan/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui status keaktifan aturan';
    return { success: false, error: message };
  }
}

/**
 * Delete an authority rule.
 */
export async function deleteAuthorityRuleAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('authority_rules')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/data-kewenangan');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus aturan kewenangan';
    return { success: false, error: message };
  }
}
