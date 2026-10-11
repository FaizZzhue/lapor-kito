'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email/resend'
import { redirect } from 'next/navigation'

/**
 * Server action to sign out current authenticated user and redirect to login page.
 */
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

/**
 * Server action to sign in internal staff user with email/username and password.
 */
export async function signInAction(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let loginEmail = emailOrUsername.trim()
    if (!loginEmail.includes('@')) {
      loginEmail = `${loginEmail}@laporkito.local`
    } else if (loginEmail.toLowerCase().endsWith('@laporkito.id')) {
      loginEmail = loginEmail.replace(/@laporkito\.id$/i, '@laporkito.local')
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    })

    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : 'unknown'
    const isNormalized = loginEmail !== emailOrUsername
    const isExpected = loginEmail.toLowerCase() === 'admin@laporkito.local'

    if (error) {
      const errCode = (error as { code?: string }).code || 'unknown'
      console.warn('[AUTH_DIAGNOSTIC_SERVER]', {
        operation: 'signInAction',
        httpStatus: error.status,
        errorName: error.name,
        errorCode: errCode,
        sanitizedMessage: error.message,
        supabaseHost,
        inputNormalized: isNormalized,
        sentEmail: loginEmail,
        isExpectedEmail: isExpected,
      })

      if (error.message.toLowerCase().includes('invalid login credentials') || errCode === 'invalid_credentials') {
        return {
          success: false,
          error: `Kredensial tidak cocok [${errCode} HTTP ${error.status || 400}]. Surel atau kata sandi tidak sesuai dengan data terdaftar di Supabase Auth untuk "${loginEmail}".`,
        }
      }
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Autentikasi gagal. Pengguna tidak ditemukan.' }
    }

    // Verify internal profile
    const { data: internalUser, error: profileErr } = await supabase
      .from('internal_users')
      .select('id, role, is_active')
      .eq('id', data.user.id)
      .single()

    if (profileErr || !internalUser) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Akun Anda terdaftar di autentikasi, namun belum memiliki profil staf internal aktif (public.internal_users).',
      }
    }

    if (!internalUser.is_active) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Akun Anda berstatus non-aktif. Silakan hubungi Administrator Sistem untuk aktivasi.',
      }
    }

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat masuk'
    return { success: false, error: msg }
  }
}

/**
 * Server action to request password reset for internal staff.
 * Handles both public deliverable emails via Resend and internal (.local) domains.
 */
export async function requestPasswordResetAction(
  emailOrUsername: string,
  originUrl?: string
): Promise<{
  success: boolean
  message: string
  isLocalDomain?: boolean
  recoveryUrl?: string
}> {
  try {
    let loginEmail = emailOrUsername.trim().toLowerCase()
    if (!loginEmail.includes('@')) {
      loginEmail = `${loginEmail}@laporkito.local`
    } else if (loginEmail.endsWith('@laporkito.id')) {
      loginEmail = loginEmail.replace(/@laporkito\.id$/i, '@laporkito.local')
    }

    const adminSupabase = createAdminClient()

    // Verify user exists in internal_users
    const { data: internalUser, error: queryError } = await adminSupabase
      .from('internal_users')
      .select('id, email, full_name, role, is_active')
      .ilike('email', loginEmail)
      .maybeSingle()

    if (queryError || !internalUser) {
      return {
        success: true,
        message: 'Jika akun terdaftar sebagai staf internal dinas, instruksi pemulihan telah diproses.',
      }
    }

    if (!internalUser.is_active) {
      return {
        success: false,
        message: 'Akun staf berstatus non-aktif. Silakan hubungi Administrator Sistem untuk aktivasi akun.',
      }
    }

    const baseUrl = originUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectTo = `${baseUrl}/admin/reset-password`

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: internalUser.email,
      options: {
        redirectTo,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[AUTH_RECOVERY_ERROR]', linkError)
      return {
        success: false,
        message: `Gagal membuat tautan pemulihan: ${linkError?.message || 'Kesalahan sistem autentikasi'}.`,
      }
    }

    const recoveryActionLink = linkData.properties.action_link
    const isLocal = internalUser.email.endsWith('.local')

    // If local development domain or .local TLD
    if (isLocal) {
      return {
        success: true,
        isLocalDomain: true,
        recoveryUrl: recoveryActionLink,
        message: 'Tautan pemulihan akun dinas internal (.local) berhasil dibuat.',
      }
    }

    // Attempt to send email via Resend for standard public domains
    if (process.env.RESEND_API_KEY) {
      const emailResult = await sendPasswordResetEmail({
        to: internalUser.email,
        fullName: internalUser.full_name || 'Staf Kedinasan',
        resetUrl: recoveryActionLink,
      })

      if (emailResult.success) {
        return {
          success: true,
          message: `Tautan pengaturan ulang kata sandi telah dikirimkan ke surel resmi "${internalUser.email}".`,
        }
      }
    }

    return {
      success: true,
      message: 'Tautan pemulihan kata sandi telah dibuat. Silakan hubungi Administrator TI untuk penyelesaian.',
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat memproses pemulihan kata sandi.'
    return {
      success: false,
      message: msg,
    }
  }
}


