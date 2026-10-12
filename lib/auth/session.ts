import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/types/auth'

export interface InternalSessionResult {
  isAuthenticated: boolean
  authUser: { id: string; email?: string } | null
  internalUser: UserProfile | null
  error?: string
}

let testMockUser: UserProfile | null = null;

/**
 * Test hook to mock internal user session during automated security verification scripts.
 */
export function setTestMockUser(user: UserProfile | null) {
  testMockUser = user;
}

/**
 * Server-side helper to resolve and validate the current authenticated internal user.
 * Validates against public.internal_users table.
 */
export async function getCurrentInternalUser(): Promise<InternalSessionResult> {
  if (testMockUser) {
    return {
      isAuthenticated: true,
      authUser: { id: testMockUser.id, email: testMockUser.email },
      internalUser: testMockUser,
    };
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      isAuthenticated: false,
      authUser: null,
      internalUser: null,
    }
  }

  // 1. Attempt selecting with institution relation columns
  let rawInternalUser: (UserProfile & { institution_id?: string | null; institution_unit_id?: string | null }) | null = null

  const { data: fullUser, error: fullError } = await supabase
    .from('internal_users')
    .select('id, email, full_name, role, phone, institution_id, institution_unit_id, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (!fullError && fullUser) {
    rawInternalUser = fullUser as any
  } else {
    // Fallback: If migration 00005 is pending in Supabase, query base columns safely
    const { data: baseUser, error: baseError } = await supabase
      .from('internal_users')
      .select('id, email, full_name, role, phone, is_active, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (baseError || !baseUser) {
      return {
        isAuthenticated: true,
        authUser: { id: user.id, email: user.email },
        internalUser: null,
        error: 'Akun terautentikasi tetapi tidak terdaftar di direktori pengguna internal (public.internal_users).',
      }
    }
    rawInternalUser = baseUser as any
  }

  // 2. Hydrate institution & unit metadata if institution_id is present
  let resolvedInstitution: UserProfile['institution'] = null
  let resolvedUnit: UserProfile['unit'] = null

  if (rawInternalUser?.institution_id) {
    const { data: instData } = await supabase
      .from('institutions')
      .select('id, code, name, short_name')
      .eq('id', rawInternalUser.institution_id)
      .maybeSingle()

    if (instData) {
      resolvedInstitution = instData
    }

    if (rawInternalUser.institution_unit_id) {
      const { data: unitData } = await supabase
        .from('institution_units')
        .select('id, code, name')
        .eq('id', rawInternalUser.institution_unit_id)
        .maybeSingle()

      if (unitData) {
        resolvedUnit = unitData
      }
    }
  }

  if (!rawInternalUser) {
    return {
      isAuthenticated: true,
      authUser: { id: user.id, email: user.email },
      internalUser: null,
      error: 'Data pengguna tidak ditemukan.',
    }
  }

  const userProfile: UserProfile = {
    id: rawInternalUser.id,
    email: rawInternalUser.email,
    full_name: rawInternalUser.full_name,
    role: rawInternalUser.role,
    phone: rawInternalUser.phone,
    institution_id: rawInternalUser.institution_id || null,
    institution_unit_id: rawInternalUser.institution_unit_id || null,
    institution: resolvedInstitution,
    unit: resolvedUnit,
    is_active: rawInternalUser.is_active,
    created_at: rawInternalUser.created_at,
    updated_at: rawInternalUser.updated_at,
  }

  return {
    isAuthenticated: true,
    authUser: { id: user.id, email: user.email },
    internalUser: userProfile,
  }
}
