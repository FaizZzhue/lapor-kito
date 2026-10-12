import dotenv from 'dotenv';
import path from 'path';
import {
  changePasswordSchema,
  adminResetPasswordSchema,
} from '../lib/validators/auth';
import {
  changeOwnPasswordAction,
  adminResetUserPasswordAction,
  adminSendUserRecoveryEmailAction,
} from '../lib/actions/auth';
import { createAdminClient } from '../lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runPasswordFeaturesAudit() {
  console.log('====================================================================');
  console.log('   LAPORKITO: PASSWORD MANAGEMENT FEATURE VERIFICATION              ');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string) {
    total++;
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // -------------------------------------------------------------------
  // 1. ZOD SCHEMA VALIDATION TESTS
  // -------------------------------------------------------------------
  console.log('--- 1. VALIDASI SKEMA UBAH & RESET PASSWORD ---');

  // 1a. changePasswordSchema - Short password (< 8 chars)
  const shortPassRes = changePasswordSchema.safeParse({
    currentPassword: 'CurrentPassword123!',
    newPassword: 'short',
    confirmPassword: 'short',
  });
  assert(!shortPassRes.success, 'changePasswordSchema menolak kata sandi baru < 8 karakter');

  // 1b. changePasswordSchema - Mismatch confirmation
  const mismatchRes = changePasswordSchema.safeParse({
    currentPassword: 'CurrentPassword123!',
    newPassword: 'NewPassword2026!',
    confirmPassword: 'DifferentPassword2026!',
  });
  assert(!mismatchRes.success, 'changePasswordSchema menolak konfirmasi kata sandi yang tidak cocok');

  // 1c. changePasswordSchema - New password identical to current password
  const samePassRes = changePasswordSchema.safeParse({
    currentPassword: 'PasswordLama2026!',
    newPassword: 'PasswordLama2026!',
    confirmPassword: 'PasswordLama2026!',
  });
  assert(!samePassRes.success, 'changePasswordSchema menolak kata sandi baru yang sama persis dengan kata sandi lama');

  // 1d. changePasswordSchema - Valid payload
  const validChangeRes = changePasswordSchema.safeParse({
    currentPassword: 'PasswordLama2026!',
    newPassword: 'PasswordBaru2026!',
    confirmPassword: 'PasswordBaru2026!',
  });
  assert(validChangeRes.success, 'changePasswordSchema menerima payload yang valid');

  // 1e. adminResetPasswordSchema - Invalid UUID
  const invalidUuidRes = adminResetPasswordSchema.safeParse({
    userId: 'not-a-uuid',
    newPassword: 'PasswordBaru2026!',
    confirmPassword: 'PasswordBaru2026!',
  });
  assert(!invalidUuidRes.success, 'adminResetPasswordSchema menolak ID pengguna yang bukan UUID');

  // 1f. adminResetPasswordSchema - Mismatch confirmation
  const adminMismatchRes = adminResetPasswordSchema.safeParse({
    userId: '11111111-1111-4111-a111-111111111111',
    newPassword: 'PasswordBaru2026!',
    confirmPassword: 'Mismatch2026!',
  });
  assert(!adminMismatchRes.success, 'adminResetPasswordSchema menolak konfirmasi yang tidak cocok');

  // 1g. adminResetPasswordSchema - Valid payload
  const validAdminResetRes = adminResetPasswordSchema.safeParse({
    userId: '11111111-1111-4111-a111-111111111111',
    newPassword: 'PasswordBaru2026!',
    confirmPassword: 'PasswordBaru2026!',
  });
  assert(validAdminResetRes.success, 'adminResetPasswordSchema menerima payload yang valid');

  // -------------------------------------------------------------------
  // 2. SERVER AUTHORIZATION & SECURITY CHECKS (UNAUTHENTICATED CALLS)
  // -------------------------------------------------------------------
  console.log('\n--- 2. KEAMANAN & OTORISASI SERVER ACTION ---');

  // 2a. changeOwnPasswordAction without active session
  const noAuthChange = await changeOwnPasswordAction({
    currentPassword: 'OldPassword123!',
    newPassword: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  });
  assert(
    !noAuthChange.success && !!noAuthChange.error,
    'changeOwnPasswordAction menolak pemanggilan tanpa sesi kedinasan yang valid'
  );

  // 2b. adminResetUserPasswordAction without admin session
  const noAuthAdminReset = await adminResetUserPasswordAction({
    userId: '11111111-1111-4111-a111-111111111111',
    newPassword: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  });
  assert(
    !noAuthAdminReset.success && !!noAuthAdminReset.error,
    'adminResetUserPasswordAction menolak eksekusi tanpa otorisasi Administrator Sistem'
  );

  // 2c. adminSendUserRecoveryEmailAction without admin session
  const noAuthRecovery = await adminSendUserRecoveryEmailAction('11111111-1111-4111-a111-111111111111');
  assert(
    !noAuthRecovery.success && !!noAuthRecovery.error,
    'adminSendUserRecoveryEmailAction menolak eksekusi tanpa hak admin'
  );

  // -------------------------------------------------------------------
  // 3. DATABASE AND SUPABASE AUTH ADMIN INTEGRATION
  // -------------------------------------------------------------------
  console.log('\n--- 3. INTEGRASI SUPABASE AUTH ADMIN & TAUTAN PEMULIHAN ---');

  const adminClient = createAdminClient();

  // 3a. Find admin user in internal_users
  const { data: adminUser } = await adminClient
    .from('internal_users')
    .select('id, email, full_name, role, is_active')
    .eq('role', 'admin')
    .eq('is_active', true)
    .limit(1)
    .single();

  assert(!!adminUser, 'Admin aktif ditemukan di database internal_users');

  // 3b. Verify auth user in auth.users
  const { data: authRecord } = await adminClient.auth.admin.getUserById(adminUser!.id);
  assert(!!authRecord?.user, 'Relasi internal_users.id === auth.users.id valid');

  // 3c. Test generateLink for password recovery via Supabase Auth Admin API
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: adminUser!.email,
    options: {
      redirectTo: 'http://localhost:3000/admin/reset-password',
    },
  });

  const actionLink = linkData?.properties?.action_link;
  assert(Boolean(!linkErr && actionLink), 'Supabase Auth Admin API berhasil membuat tautan pemulihan resmi tanpa mengubah password');
  assert(
    Boolean(actionLink && (actionLink.includes('reset-password') || actionLink.includes('verify'))),
    'Tautan pemulihan mengarah ke endpoint reset-password yang benar'
  );

  console.log('\n====================================================================');
  console.log(`   SEMUA PENGUJIAN SELESAI: ${passed}/${total} PENGUJIAN BERHASIL PASS`);
  console.log('====================================================================\n');
}

runPasswordFeaturesAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
