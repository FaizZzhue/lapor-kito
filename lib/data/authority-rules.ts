import { createAdminClient } from '@/lib/supabase/server';

export interface AuthorityCandidateItem {
  id: string;
  rule_code: string;
  category_id: string;
  category_slug: string;
  institution_id: string;
  institution_code: string;
  institution_name: string;
  institution_unit_id: string | null;
  unit_code: string | null;
  unit_name: string | null;
  context_title: string;
  context_description: string | null;
  regulation_basis: string;
  is_active: boolean;
}

/**
 * Server-side service to fetch active authority rule candidates for a specific category slug.
 * Query executes using admin client to ensure authoritative access without client-side RLS constraints.
 * Filters strictly for active rules, active categories, and active institutions/units.
 */
export async function getAuthorityCandidatesByCategorySlug(
  categorySlug: string
): Promise<AuthorityCandidateItem[]> {
  try {
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('authority_rules')
      .select(`
        id,
        rule_code,
        category_id,
        institution_id,
        institution_unit_id,
        context_title,
        context_description,
        regulation_basis,
        is_active,
        categories(id, slug, name_id, is_active),
        institutions(id, code, name, is_active),
        institution_units(id, code, name, is_active)
      `)
      .eq('is_active', true);

    if (error || !data) {
      console.warn('Gagal memuat kandidat aturan kewenangan dari database:', error?.message);
      return [];
    }

    // Filter in-memory for exact active category slug and active institutions
    const filtered = data
      .filter((row) => {
        const cat = row.categories as unknown as { slug: string; is_active: boolean } | null;
        const inst = row.institutions as unknown as { code: string; is_active: boolean } | null;
        const unit = row.institution_units as unknown as { code: string; is_active: boolean } | null;

        if (!cat || !cat.is_active || cat.slug !== categorySlug) return false;
        if (!inst || !inst.is_active) return false;
        if (row.institution_unit_id && unit && !unit.is_active) return false;
        return true;
      })
      .map((row) => {
        const cat = row.categories as unknown as { id: string; slug: string; name_id: string };
        const inst = row.institutions as unknown as { id: string; code: string; name: string };
        const unit = row.institution_units as unknown as { id: string; code: string; name: string } | null;

        return {
          id: row.id,
          rule_code: row.rule_code,
          category_id: row.category_id,
          category_slug: cat.slug,
          institution_id: row.institution_id,
          institution_code: inst.code,
          institution_name: inst.name,
          institution_unit_id: row.institution_unit_id,
          unit_code: unit?.code ?? null,
          unit_name: unit?.name ?? null,
          context_title: row.context_title,
          context_description: row.context_description,
          regulation_basis: row.regulation_basis,
          is_active: row.is_active,
        };
      });

    return filtered;
  } catch (err) {
    console.warn('Kesalahan sistem saat mengambil kandidat authority_rules:', err);
    return [];
  }
}
