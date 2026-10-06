import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/types/auth'

export interface InternalSessionResult {
  isAuthenticated: boolean
  authUser: { id: string; email?: string } | null
  internalUser: UserProfile | null
  error?: string
}

/**
 * Server-side helper to resolve and validate the current authenticated internal user.
 * Validates against public.internal_users table.
 */
export async function getCurrentInternalUser(): Promise<InternalSessionResult> {
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

  const { data: internalUser, error: dbError } = await supabase
    .from('internal_users')
    .select('id, email, full_name, role, phone, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (dbError || !internalUser) {
    return {
      isAuthenticated: true,
      authUser: { id: user.id, email: user.email },
      internalUser: null,
      error: 'Akun terautentikasi tetapi tidak terdaftar di direktori pengguna internal (public.internal_users).',
    }
  }

  return {
    isAuthenticated: true,
    authUser: { id: user.id, email: user.email },
    internalUser: internalUser as UserProfile,
  }
}
