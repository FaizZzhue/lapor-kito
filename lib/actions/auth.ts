'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email/resend'
import { redirect } from 'next/navigation'
import { getCurrentInternalUser } from '@/lib/auth/session'
import {
  changePasswordSchema,
  adminResetPasswordSchema,
  type ChangePasswordInput,
  type AdminResetPasswordInput,
} from '@/lib/validators/auth'

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

/**
 * Server action for authenticated internal user to change their own password.
 * Strictly verifies current password before updating to the new password.
 */
export async function changeOwnPasswordAction(
  rawData: ChangePasswordInput
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { isAuthenticated, authUser, internalUser } = await getCurrentInternalUser()
    if (!isAuthenticated || !authUser || !internalUser) {
      return { success: false, error: 'Sesi kedinasan tidak valid. Silakan masuk kembali.' }
    }
    if (!internalUser.is_active) {
      return { success: false, error: 'Akun Anda dinonaktifkan. Hubungi Administrator Sistem.' }
    }

    const parsed = changePasswordSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data kata sandi tidak valid.' }
    }

    const email = authUser.email || internalUser.email
    const supabase = await createClient()

    // 1. Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.currentPassword,
    })

    if (verifyError) {
      return {
        success: false,
        error: 'Kata sandi saat ini tidak cocok. Mohon periksa kembali kata sandi lama Anda.',
      }
    }

    // 2. Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.newPassword,
    })

    if (updateError) {
      return {
        success: false,
        error: updateError.message || 'Gagal memperbarui kata sandi di sistem autentikasi.',
      }
    }

    return {
      success: true,
      message: 'Kata sandi Anda berhasil diperbarui. Gunakan kata sandi baru untuk sesi masuk berikutnya.',
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat memperbarui kata sandi'
    return { success: false, error: msg }
  }
}

/**
 * Server action for active administrators to reset an internal staff member's password.
 * Uses Supabase Auth Admin API without exposing service keys to client or mutating other profile attributes.
 */
export async function adminResetUserPasswordAction(
  rawData: AdminResetPasswordInput
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { isAuthenticated, internalUser: currentAdmin } = await getCurrentInternalUser()
    if (!isAuthenticated || !currentAdmin) {
      return { success: false, error: 'Sesi kedinasan tidak valid. Silakan masuk kembali.' }
    }
    if (!currentAdmin.is_active) {
      return { success: false, error: 'Akun Anda dinonaktifkan. Hubungi Administrator Sistem.' }
    }
    if (currentAdmin.role !== 'admin') {
      return { success: false, error: 'Akses ditolak: Hanya Administrator Sistem yang berhak mereset kata sandi staf.' }
    }

    const parsed = adminResetPasswordSchema.safeParse(rawData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data kata sandi tidak valid.' }
    }

    const adminSupabase = createAdminClient()

    // Verify target exists in public.internal_users
    const { data: targetUser, error: targetError } = await adminSupabase
      .from('internal_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', parsed.data.userId)
      .maybeSingle()

    if (targetError || !targetUser) {
      return { success: false, error: 'Pengguna target tidak ditemukan di direktori internal.' }
    }

    // Verify target exists in auth.users
    const { data: authUserRecord, error: authUserError } = await adminSupabase.auth.admin.getUserById(targetUser.id)
    if (authUserError || !authUserRecord?.user) {
      return { success: false, error: 'Akun autentikasi Supabase tidak ditemukan untuk pengguna ini.' }
    }

    // Update password via Supabase Auth Admin API and confirm email if not yet activated
    const { error: resetError } = await adminSupabase.auth.admin.updateUserById(targetUser.id, {
      password: parsed.data.newPassword,
      email_confirm: true,
    })

    if (resetError) {
      return { success: false, error: `Gagal mereset kata sandi: ${resetError.message}` }
    }

    return {
      success: true,
      message: `Kata sandi untuk "${targetUser.full_name}" (${targetUser.email}) berhasil diatur ulang.`,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat mereset kata sandi staf'
    return { success: false, error: msg }
  }
}

/**
 * Server action for active administrators to generate a password recovery email or link for a staff user.
 */
export async function adminSendUserRecoveryEmailAction(
  targetUserId: string,
  originUrl?: string
): Promise<{
  success: boolean
  message: string
  isLocalDomain?: boolean
  recoveryUrl?: string
  error?: string
}> {
  try {
    const { isAuthenticated, internalUser: currentAdmin } = await getCurrentInternalUser()
    if (!isAuthenticated || !currentAdmin) {
      return { success: false, error: 'Sesi kedinasan tidak valid. Silakan masuk kembali.', message: 'Sesi tidak valid' }
    }
    if (!currentAdmin.is_active) {
      return { success: false, error: 'Akun Anda dinonaktifkan.', message: 'Akun dinonaktifkan' }
    }
    if (currentAdmin.role !== 'admin') {
      return { success: false, error: 'Akses ditolak: Hanya Administrator Sistem yang berhak mengirim tautan pemulihan.', message: 'Akses ditolak' }
    }

    const adminSupabase = createAdminClient()

    const { data: targetUser, error: targetError } = await adminSupabase
      .from('internal_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', targetUserId)
      .maybeSingle()

    if (targetError || !targetUser) {
      return { success: false, error: 'Pengguna target tidak ditemukan di direktori internal.', message: 'Pengguna tidak ditemukan' }
    }

    const baseUrl = originUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectTo = `${baseUrl}/admin/reset-password`

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: targetUser.email,
      options: {
        redirectTo,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      return {
        success: false,
        error: `Gagal membuat tautan pemulihan: ${linkError?.message || 'Layanan autentikasi gagal'}.`,
        message: 'Gagal membuat tautan pemulihan',
      }
    }

    const recoveryActionLink = linkData.properties.action_link
    const isLocal = targetUser.email.endsWith('.local')

    if (isLocal) {
      return {
        success: true,
        isLocalDomain: true,
        recoveryUrl: recoveryActionLink,
        message: `Tautan pemulihan untuk akun internal (.local) "${targetUser.email}" berhasil dibuat.`,
      }
    }

    if (process.env.RESEND_API_KEY) {
      const emailResult = await sendPasswordResetEmail({
        to: targetUser.email,
        fullName: targetUser.full_name || 'Staf Kedinasan',
        resetUrl: recoveryActionLink,
      })

      if (emailResult.success) {
        return {
          success: true,
          message: `Tautan pengaturan ulang kata sandi berhasil dikirimkan ke surel "${targetUser.email}".`,
        }
      }
    }

    return {
      success: true,
      recoveryUrl: recoveryActionLink,
      message: `Tautan pemulihan untuk "${targetUser.email}" berhasil dibuat.`,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat membuat tautan pemulihan'
    return { success: false, error: msg, message: msg }
  }
}


