import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

if (typeof window !== 'undefined') {
  throw new Error('createAdminClient must only be called on the server.');
}

/**
 * Server-only Supabase client with Service Role privileges.
 * NEVER import or execute this on the client side.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Konfigurasi Supabase Service Role Key tidak ditemukan.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
