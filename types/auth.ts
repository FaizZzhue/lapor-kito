import type { Database, UserRole } from './database'

export type InternalUserRow = Database['public']['Tables']['internal_users']['Row']

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone: string | null
  institution_id?: string | null
  institution_unit_id?: string | null
  institution?: {
    id: string
    code: string
    name: string
    short_name: string | null
  } | null
  unit?: {
    id: string
    code: string
    name: string
  } | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthSession {
  user: UserProfile | null
  token: string | null
  role: UserRole | null
}
