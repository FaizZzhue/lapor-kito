import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { signInAction, requestPasswordResetAction } from '../lib/actions/auth';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const authClient = createClient(supabaseUrl, anonKey);

async function runVerification() {
  console.log('====================================================================');
  console.log('   LAPORKITO: ADMIN AUTHENTICATION VERIFICATION SUITE              ');
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

  const validPassword = process.env.ADMIN_TARGET_PASSWORD || 'AdminLaporKito2026!';
  const newAdminPassword = process.env.NEW_ADMIN_PASSWORD || 'password123!';

  // 1. Database schema and relationship
  console.log('--- 1. DATABASE SCHEMA & RELATIONSHIP VERIFICATION ---');
  const { data: authList } = await adminSupabase.auth.admin.listUsers();
  const adminAuth = authList?.users?.find(u => u.email?.toLowerCase() === 'admin@laporkito.local');
  assert(!!adminAuth, 'admin@laporkito.local exists in auth.users');
  assert(!!adminAuth?.email_confirmed_at, 'admin@laporkito.local email is confirmed');

  const { data: adminProfile } = await adminSupabase
    .from('internal_users')
    .select('id, email, role, is_active')
    .eq('id', adminAuth!.id)
    .single();

  assert(!!adminProfile, 'admin@laporkito.local exists in public.internal_users');
  assert(adminProfile?.id === adminAuth?.id, 'internal_users.id strictly matches auth.users.id');
  assert(adminProfile?.role === 'admin', 'internal_users.role is "admin"');
  assert(adminProfile?.is_active === true, 'internal_users.is_active is true');

  // Verify newly created admin user: fynyourbaeid18@gmail.com
  const newAdminAuth = authList?.users?.find(u => u.email?.toLowerCase() === 'fynyourbaeid18@gmail.com');
  assert(!!newAdminAuth, 'fynyourbaeid18@gmail.com exists in auth.users');
  assert(!!newAdminAuth?.email_confirmed_at, 'fynyourbaeid18@gmail.com email is confirmed');

  const { data: newAdminProfile } = await adminSupabase
    .from('internal_users')
    .select('id, email, role, is_active, full_name')
    .eq('id', newAdminAuth!.id)
    .single();

  assert(!!newAdminProfile, 'fynyourbaeid18@gmail.com exists in public.internal_users');
  assert(newAdminProfile?.id === newAdminAuth?.id, 'fynyourbaeid18@gmail.com internal_users.id strictly matches auth.users.id');
  assert(newAdminProfile?.role === 'admin', 'fynyourbaeid18@gmail.com role is "admin"');
  assert(newAdminProfile?.is_active === true, 'fynyourbaeid18@gmail.com is_active is true');

  // 2. CLIENT-SIDE signInWithPassword VERIFICATION (Exact path used by browser UI)
  console.log('\n--- 2. CLIENT-SIDE signInWithPassword VERIFICATION (BROWSER PATH) ---');
  
  // Helper simulating the exact normalization from app/admin/login/page.tsx
  function normalizeLoginInput(input: string): string {
    let clean = input.trim();
    if (!clean.includes('@')) {
      clean = `${clean}@laporkito.local`;
    } else if (clean.toLowerCase().endsWith('@laporkito.id')) {
      clean = clean.replace(/@laporkito\.id$/i, '@laporkito.local');
    }
    return clean;
  }

  // 2a. Full email
  const clientRes1 = await authClient.auth.signInWithPassword({
    email: normalizeLoginInput('admin@laporkito.local'),
    password: validPassword,
  });
  assert(!clientRes1.error && !!clientRes1.data.session, 'Client SDK signInWithPassword succeeds with admin@laporkito.local');

  // 2b. Shorthand username "admin"
  const clientRes2 = await authClient.auth.signInWithPassword({
    email: normalizeLoginInput('admin'),
    password: validPassword,
  });
  assert(!clientRes2.error && !!clientRes2.data.session, 'Client SDK signInWithPassword succeeds with normalized username "admin"');

  // 2c. Normalized domain "admin@laporkito.id"
  const clientRes3 = await authClient.auth.signInWithPassword({
    email: normalizeLoginInput('admin@laporkito.id'),
    password: validPassword,
  });
  assert(!clientRes3.error && !!clientRes3.data.session, 'Client SDK signInWithPassword succeeds with normalized domain "admin@laporkito.id"');

  // 2d. Wrong password returns 400 with invalid_credentials
  const clientResBad = await authClient.auth.signInWithPassword({
    email: normalizeLoginInput('admin@laporkito.local'),
    password: 'WrongPassword123!',
  });
  assert(clientResBad.error?.status === 400, 'Client SDK returns HTTP 400 on wrong password');
  assert(
    Boolean(
      (clientResBad.error as { code?: string })?.code === 'invalid_credentials' ||
        clientResBad.error?.message.toLowerCase().includes('invalid login credentials')
    ),
    'Client SDK error is specifically "invalid_credentials"'
  );

  // 2e. New Admin User fynyourbaeid18@gmail.com
  const clientResNewAdmin = await authClient.auth.signInWithPassword({
    email: normalizeLoginInput('fynyourbaeid18@gmail.com'),
    password: newAdminPassword,
  });
  assert(!clientResNewAdmin.error && !!clientResNewAdmin.data.session, 'Client SDK signInWithPassword succeeds with fynyourbaeid18@gmail.com');

  const clientResNewAdminBad = await authClient.auth.signInWithPassword({
    email: normalizeLoginInput('fynyourbaeid18@gmail.com'),
    password: 'WrongPassword123!',
  });
  assert(clientResNewAdminBad.error?.status === 400, 'Client SDK returns HTTP 400 on wrong password for fynyourbaeid18@gmail.com');

  // 3. SERVER ACTION signInAction VERIFICATION (Server path)
  console.log('\n--- 3. SERVER ACTION signInAction VERIFICATION ---');
  const resEmail = await signInAction('admin@laporkito.local', validPassword);
  assert(resEmail.success, 'signInAction succeeds with admin@laporkito.local');

  const resNewAdminAction = await signInAction('fynyourbaeid18@gmail.com', newAdminPassword);
  assert(resNewAdminAction.success, 'signInAction succeeds with fynyourbaeid18@gmail.com');

  const resUsername = await signInAction('admin', validPassword);
  assert(resUsername.success, 'signInAction succeeds with username shorthand "admin"');

  const resDomainId = await signInAction('admin@laporkito.id', validPassword);
  assert(resDomainId.success, 'signInAction succeeds with normalized mistyped "admin@laporkito.id"');

  const resBadPw = await signInAction('admin@laporkito.local', 'WrongPassword123!');
  assert(!resBadPw.success, 'signInAction rejects wrong password');
  assert(
    Boolean(resBadPw.error?.includes('tidak cocok') || resBadPw.error?.includes('resmi internal')),
    'signInAction returns clear user-friendly guidance on wrong password'
  );

  const resGhost = await signInAction('nonexistent_user_12345@gmail.com', 'SomePassword123!');
  assert(!resGhost.success, 'signInAction rejects non-existent user');

  // 4. PASSWORD RESET & RECOVERY FLOW VERIFICATION
  console.log('\n--- 4. PASSWORD RESET & RECOVERY FLOW VERIFICATION ---');
  const resetResFull = await requestPasswordResetAction('admin@laporkito.local', 'http://localhost:3000');
  assert(resetResFull.success, 'requestPasswordResetAction succeeds for admin@laporkito.local');
  assert(resetResFull.isLocalDomain === true, 'requestPasswordResetAction identifies internal .local domain');
  assert(!!resetResFull.recoveryUrl, 'requestPasswordResetAction generates valid recovery URL for .local domain');

  const resetResShort = await requestPasswordResetAction('admin', 'http://localhost:3000');
  assert(resetResShort.success, 'requestPasswordResetAction succeeds for shorthand username "admin"');
  assert(!!resetResShort.recoveryUrl, 'requestPasswordResetAction generates valid recovery URL for username "admin"');

  // Verify the recovery link against Supabase endpoint
  const verifyRes = await fetch(resetResFull.recoveryUrl!, { redirect: 'manual' });
  assert(
    verifyRes.status === 303 || verifyRes.status === 302,
    `Supabase recovery endpoint validates token and issues 302/303 redirect (Status: ${verifyRes.status})`
  );
  const locationHeader = verifyRes.headers.get('location') || '';
  assert(
    locationHeader.includes('/admin/reset-password'),
    'Supabase recovery redirect points to /admin/reset-password'
  );
  assert(
    locationHeader.includes('#') || locationHeader.includes('code=') || locationHeader.includes('token'),
    'Supabase recovery redirect contains valid recovery session payload'
  );

  // Verify /admin/reset-password page exists and renders
  const resetPageRes = await fetch('http://localhost:3000/admin/reset-password');
  assert(resetPageRes.status === 200, `GET /admin/reset-password returns HTTP 200 (Status: ${resetPageRes.status})`);
  const resetHtml = await resetPageRes.text();
  assert(
    resetHtml.includes('Kata Sandi') || resetHtml.includes('Pemulihan'),
    'Reset password page HTML renders recovery UI components'
  );

  // 5. HTTP Route Protection
  console.log('\n--- 5. HTTP ROUTE PROTECTION & DASHBOARD ACCESS ---');
  const unauthRes = await fetch('http://localhost:3000/admin', { redirect: 'manual' });
  assert(
    unauthRes.status === 307 || unauthRes.status === 302,
    `Unauthenticated GET /admin returns redirect (Status: ${unauthRes.status})`
  );
  assert(
    (unauthRes.headers.get('location') || '').includes('/admin/login'),
    'Unauthenticated GET /admin redirects to /admin/login'
  );

  // 6. Authenticated HTTP Dashboard Access (fynyourbaeid18@gmail.com)
  const { data: signDataNew } = await authClient.auth.signInWithPassword({
    email: 'fynyourbaeid18@gmail.com',
    password: newAdminPassword,
  });
  assert(!!signDataNew.session, 'Client SDK signInWithPassword produces valid session for fynyourbaeid18@gmail.com');

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = encodeURIComponent(JSON.stringify({
    access_token: signDataNew.session!.access_token,
    refresh_token: signDataNew.session!.refresh_token,
    expires_at: signDataNew.session!.expires_at,
    expires_in: signDataNew.session!.expires_in,
    token_type: signDataNew.session!.token_type,
    user: signDataNew.session!.user,
  }));

  const authResNew = await fetch('http://localhost:3000/admin', {
    headers: {
      Cookie: `${cookieName}=${cookieValue}; ${cookieName}.0=${cookieValue}`,
    },
    redirect: 'manual',
  });
  assert(authResNew.status === 200, `Authenticated GET /admin with fynyourbaeid18@gmail.com returns HTTP 200 (Actual: ${authResNew.status})`);

  const htmlNew = await authResNew.text();
  assert(
    htmlNew.includes('LAPORKITO') && (htmlNew.includes('Konsol') || htmlNew.includes('Dashboard') || htmlNew.includes('sidebar') || htmlNew.includes('admin')),
    'Admin dashboard HTML rendered with operational components for fynyourbaeid18@gmail.com'
  );



  console.log('\n====================================================================');
  console.log(`   AUTH VERIFICATION COMPLETE: ${passed}/${total} TESTS PASSED     `);
  console.log('====================================================================\n');
}

runVerification().catch(err => {
  console.error('\n[FATAL ERROR in Auth Verification]:', err);
  process.exit(1);
});
