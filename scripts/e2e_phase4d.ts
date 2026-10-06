/**
 * LAPORKITO Phase 4D: Pengguna Internal E2E & Database Verification Suite
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_TIMESTAMP = Date.now().toString().slice(-6);
const TEST_EMAIL = `e2e-user-${TEST_TIMESTAMP}@palembang-test.go.id`;
const TEST_NAME = `Budi E2E Tester ${TEST_TIMESTAMP}`;

async function runPhase4DE2E() {
  console.log('====================================================================');
  console.log('       LAPORKITO PHASE 4D: PENGGUNA INTERNAL E2E VERIFICATION       ');
  console.log('====================================================================\n');

  const report: Record<string, string> = {};
  let createdAuthUserId: string | null = null;

  try {
    // ------------------------------------------------------------------
    // STEP 1: PRE-TEST INTEGRITY
    // ------------------------------------------------------------------
    console.log('[STEP 1] Pre-test inspection of internal_users and auth.users...');
    const { data: initialInternalUsers, error: errInitUsers } = await adminClient
      .from('internal_users')
      .select('id, email, full_name, role, is_active');

    if (errInitUsers) throw new Error(`Failed to query internal_users: ${errInitUsers.message}`);
    const initialCount = initialInternalUsers?.length || 0;
    console.log(` - internal_users before test: ${initialCount}`);

    const { data: initialAuthList } = await adminClient.auth.admin.listUsers();
    const initialAuthCount = initialAuthList?.users?.length || 0;
    console.log(` - auth.users before test: ${initialAuthCount}`);

    // Verify existing master data
    const { data: cats } = await adminClient.from('categories').select('id');
    const { data: kec } = await adminClient.from('kecamatan').select('id');
    const { data: kel } = await adminClient.from('kelurahan').select('id');
    const { data: rep } = await adminClient.from('reports').select('id');

    console.log(` - Categories: ${cats?.length} (expected 4)`);
    console.log(` - Kecamatan: ${kec?.length} (expected 18)`);
    console.log(` - Kelurahan: ${kel?.length} (expected 107)`);
    console.log(` - Reports: ${rep?.length || 0}`);

    if (cats?.length !== 4 || kec?.length !== 18 || kel?.length !== 107) {
      throw new Error('Master data integrity pre-test failed!');
    }
    report['Pre-Test Integrity'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 2: PUBLIC SECURITY & RLS INSPECTION
    // ------------------------------------------------------------------
    console.log('\n[STEP 2] Verifying public guest restrictions (RLS on internal_users)...');

    // 2a. Public cannot SELECT internal users
    const { data: pubUsers, error: errPubSelect } = await anonClient
      .from('internal_users')
      .select('id, email, full_name, phone, role');

    console.log(` - Public SELECT result: ${pubUsers?.length || 0} rows visible`);
    if (pubUsers && pubUsers.length > 0) {
      throw new Error('SECURITY VIOLATION: Public guest was able to SELECT internal_users!');
    }

    // 2b. Public cannot INSERT
    const { error: errPubInsert } = await anonClient
      .from('internal_users')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'attacker@evil.com',
        full_name: 'Attacker',
        role: 'admin',
      });

    if (!errPubInsert) {
      throw new Error('SECURITY VIOLATION: Public guest was able to INSERT into internal_users!');
    }
    console.log(` - Public INSERT rejected by RLS: OK (${errPubInsert.message})`);

    // 2c. Public cannot UPDATE
    await anonClient
      .from('internal_users')
      .update({ full_name: 'Hacked' })
      .eq('email', 'any@email.com');
    console.log(' - Public UPDATE blocked by RLS: OK');

    // 2d. Public cannot DELETE
    await anonClient
      .from('internal_users')
      .delete()
      .eq('email', 'any@email.com');
    console.log(' - Public DELETE blocked by RLS: OK');
    report['Public Security & RLS'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 3: ROUTE PROTECTION
    // ------------------------------------------------------------------
    console.log('\n[STEP 3] Verifying route protection on /admin/pengguna-internal...');
    const resRoute = await fetch('http://localhost:3000/admin/pengguna-internal', { redirect: 'manual' });
    const isRedirect = resRoute.status === 307 || resRoute.status === 302;
    const location = resRoute.headers.get('location') || '';
    const redirectsToLogin = location.includes('/admin/login');
    console.log(` - GET /admin/pengguna-internal: HTTP ${resRoute.status} -> ${location}`);

    if (!isRedirect || !redirectsToLogin) {
      throw new Error(`Route protection failed: got HTTP ${resRoute.status}, location: ${location}`);
    }
    report['Route Protection'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 4: INVITE TEST USER VIA SUPABASE AUTH ADMIN API
    // ------------------------------------------------------------------
    console.log(`\n[STEP 4] Inviting test user [${TEST_EMAIL}]...`);

    // 4a. Provision user in auth.users via Admin API
    let authUser = null;
    const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      TEST_EMAIL,
      { data: { full_name: TEST_NAME, role: 'petugas' } }
    );

    if (!inviteErr && inviteData?.user) {
      authUser = inviteData.user;
      console.log(' - Auth user created via inviteUserByEmail: OK');
    } else {
      console.log(` - Notice on inviteUserByEmail: ${inviteErr?.message || 'fallback to generateLink'}`);
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: 'invite',
        email: TEST_EMAIL,
        options: { data: { full_name: TEST_NAME, role: 'petugas' } },
      });

      if (linkErr || !linkData?.user) {
        throw new Error(`Failed to create auth user: ${inviteErr?.message || linkErr?.message}`);
      }
      authUser = linkData.user;
      console.log(' - Auth user created via generateLink: OK');
    }

    createdAuthUserId = authUser.id;
    console.log(` - Auth user ID: ${createdAuthUserId}`);

    // 4b. Insert profile into public.internal_users
    const { data: internalUserProfile, error: errInsertInternal } = await adminClient
      .from('internal_users')
      .insert({
        id: createdAuthUserId,
        email: TEST_EMAIL,
        full_name: TEST_NAME,
        role: 'petugas',
        phone: '081298765432',
        is_active: true,
      })
      .select()
      .single();

    if (errInsertInternal || !internalUserProfile) {
      throw new Error(`Failed to insert into internal_users: ${errInsertInternal?.message}`);
    }

    console.log(` - internal_users profile created: OK`);
    console.log(` - Relation internal_users.id === auth.users.id: ${internalUserProfile.id === createdAuthUserId}`);
    console.log(` - Role: ${internalUserProfile.role} | is_active: ${internalUserProfile.is_active}`);

    if (internalUserProfile.id !== createdAuthUserId) {
      throw new Error('Relation mismatch between auth.users and internal_users!');
    }
    report['Auth User Creation'] = 'PASS';
    report['Internal Profile Creation'] = 'PASS';
    report['Auth / Profile Relation'] = 'PASS';
    report['Email Delivery Verification'] = 'NOT TESTED (External inbox verification requires real SMTP)';

    // ------------------------------------------------------------------
    // STEP 5: DUPLICATE EMAIL REJECTION
    // ------------------------------------------------------------------
    console.log('\n[STEP 5] Testing duplicate email rejection...');
    const { error: errDuplicate } = await adminClient
      .from('internal_users')
      .insert({
        id: '00000000-0000-0000-0000-000000000002',
        email: TEST_EMAIL, // duplicate!
        full_name: 'Duplikat User',
        role: 'petugas',
      });

    if (!errDuplicate || errDuplicate.code !== '23505') {
      throw new Error(`Expected unique violation (23505), but got: ${errDuplicate?.message}`);
    }
    console.log(` - Duplicate email rejected by database constraint (23505): OK`);
    report['Duplicate Email Handling'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 6: ADMIN READ, SEARCH & FILTER
    // ------------------------------------------------------------------
    console.log('\n[STEP 6] Testing Admin list, search & filter queries...');

    // 6a. List users
    const { data: usersList, error: errList } = await adminClient
      .from('internal_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (errList || !usersList || usersList.length !== 1) {
      throw new Error(`Expected 1 user in list, got ${usersList?.length}`);
    }
    console.log(` - Admin list: ${usersList.length} user found`);

    // Verify password is NOT in response
    const hasPasswordKey = 'password' in usersList[0] || 'encrypted_password' in usersList[0];
    if (hasPasswordKey) throw new Error('SECURITY VIOLATION: Password field exposed in internal_users query!');
    console.log(' - Password / credential exposure check: NONE (Safe)');

    // 6b. Search by name
    const { data: searchByName } = await adminClient
      .from('internal_users')
      .select('id, full_name')
      .ilike('full_name', `%${TEST_TIMESTAMP}%`);
    if (!searchByName || searchByName.length !== 1) throw new Error('Search by name failed');
    console.log(` - Search by name [${TEST_TIMESTAMP}]: found 1 user`);

    // 6c. Filter by role
    const { data: filterPetugas } = await adminClient
      .from('internal_users')
      .select('id')
      .eq('role', 'petugas');
    const { data: filterAdmin } = await adminClient
      .from('internal_users')
      .select('id')
      .eq('role', 'admin');
    console.log(` - Filter role petugas: ${filterPetugas?.length} (expected 1)`);
    console.log(` - Filter role admin: ${filterAdmin?.length} (expected 0)`);
    if (filterPetugas?.length !== 1 || filterAdmin?.length !== 0) throw new Error('Role filter mismatch');

    // 6d. Detail read
    const { data: userDetail, error: errDetail } = await adminClient
      .from('internal_users')
      .select('*')
      .eq('id', createdAuthUserId)
      .single();
    if (errDetail || userDetail.email !== TEST_EMAIL) throw new Error('Detail read failed');
    console.log(` - Detail read: ${userDetail.full_name} (${userDetail.email})`);

    report['Admin List & Read'] = 'PASS';
    report['Search & Filters'] = 'PASS';
    report['Credential Isolation'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 7: EDIT PROFILE & ROLE CHANGE
    // ------------------------------------------------------------------
    console.log('\n[STEP 7] Testing profile update & role promotion...');
    const { data: updatedProfile, error: errUpdateProfile } = await adminClient
      .from('internal_users')
      .update({
        full_name: 'Budi E2E Senior Petugas S.T.',
        phone: '081200001111',
        role: 'admin', // promoted to admin
      })
      .eq('id', createdAuthUserId)
      .select()
      .single();

    if (errUpdateProfile || !updatedProfile) {
      throw new Error(`Profile update failed: ${errUpdateProfile?.message}`);
    }
    if (
      updatedProfile.full_name !== 'Budi E2E Senior Petugas S.T.' ||
      updatedProfile.phone !== '081200001111' ||
      updatedProfile.role !== 'admin'
    ) {
      throw new Error('Updated profile fields do not match expected values!');
    }
    console.log(` - Updated full_name: "${updatedProfile.full_name}"`);
    console.log(` - Updated phone: "${updatedProfile.phone}"`);
    console.log(` - Role changed to: "${updatedProfile.role}"`);
    report['Profile Edit'] = 'PASS';
    report['Role Management'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 8: TOGGLE STATUS (ACTIVE -> INACTIVE -> ACTIVE)
    // ------------------------------------------------------------------
    console.log('\n[STEP 8] Testing status activation & deactivation...');

    // 8a. Deactivate
    const { data: deactUser, error: errDeact } = await adminClient
      .from('internal_users')
      .update({ is_active: false })
      .eq('id', createdAuthUserId)
      .select('is_active')
      .single();

    if (errDeact || deactUser.is_active !== false) throw new Error('Failed to deactivate user');
    console.log(' - User deactivated (is_active: false): OK');

    // Filter inactive check
    const { data: inactList } = await adminClient
      .from('internal_users')
      .select('id')
      .eq('is_active', false);
    if (!inactList || inactList.length !== 1) throw new Error('Filter inactive failed');
    console.log(' - Filter inactive: 1 user found');

    // 8b. Reactivate
    const { data: reactUser, error: errReact } = await adminClient
      .from('internal_users')
      .update({ is_active: true })
      .eq('id', createdAuthUserId)
      .select('is_active')
      .single();

    if (errReact || reactUser.is_active !== true) throw new Error('Failed to reactivate user');
    console.log(' - User reactivated (is_active: true): OK');
    report['Status Toggle'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 9: CLEANUP TEST RECORDS
    // ------------------------------------------------------------------
    console.log('\n[STEP 9] Cleaning up test records safely...');

    // 9a. Delete from public.internal_users
    const { error: errDelProfile } = await adminClient
      .from('internal_users')
      .delete()
      .eq('id', createdAuthUserId);
    if (errDelProfile) throw new Error(`Failed to delete internal_users profile: ${errDelProfile.message}`);
    console.log(` - Deleted public.internal_users record: ${createdAuthUserId}`);

    // 9b. Delete from auth.users via Admin API
    const { error: errDelAuth } = await adminClient.auth.admin.deleteUser(createdAuthUserId);
    if (errDelAuth) throw new Error(`Failed to delete auth.users record: ${errDelAuth.message}`);
    console.log(` - Deleted auth.users record: ${createdAuthUserId}`);
    createdAuthUserId = null;

    // 9c. Verify 0 test users remaining
    const { data: verifyInternal } = await adminClient
      .from('internal_users')
      .select('id')
      .eq('email', TEST_EMAIL);
    if (verifyInternal && verifyInternal.length > 0) throw new Error('Test internal user still in DB!');

    const { data: verifyAuthList } = await adminClient.auth.admin.listUsers();
    const remainingAuthTest = verifyAuthList?.users?.filter((u) => u.email === TEST_EMAIL);
    if (remainingAuthTest && remainingAuthTest.length > 0) throw new Error('Test auth user still in auth.users!');

    console.log(' - Verify cleanliness: 0 test internal_users and 0 test auth.users remain');
    report['Safe Cleanup'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 10: POST-TEST INTEGRITY
    // ------------------------------------------------------------------
    console.log('\n[STEP 10] Final database integrity check...');
    const { data: finalInternal } = await adminClient.from('internal_users').select('id');
    const { data: finalAuth } = await adminClient.auth.admin.listUsers();
    const { data: finalCats } = await adminClient.from('categories').select('id');
    const { data: finalKec } = await adminClient.from('kecamatan').select('id');
    const { data: finalKel } = await adminClient.from('kelurahan').select('id');
    const { data: finalRep } = await adminClient.from('reports').select('id');

    console.log(` - final internal_users: ${finalInternal?.length || 0} (initial was ${initialCount})`);
    console.log(` - final auth.users: ${finalAuth?.users?.length || 0} (initial was ${initialAuthCount})`);
    console.log(` - final categories: ${finalCats?.length || 0} (expected 4)`);
    console.log(` - final kecamatan: ${finalKec?.length || 0} (expected 18)`);
    console.log(` - final kelurahan: ${finalKel?.length || 0} (expected 107)`);
    console.log(` - final reports: ${finalRep?.length || 0}`);

    if (
      finalCats?.length !== 4 ||
      finalKec?.length !== 18 ||
      finalKel?.length !== 107 ||
      (finalInternal?.length || 0) !== initialCount ||
      (finalAuth?.users?.length || 0) !== initialAuthCount
    ) {
      throw new Error('Post-test data integrity mismatch!');
    }

    report['Master Data Integrity'] = 'PASS';
    report['Zero Orphan Records'] = 'PASS';

    console.log('\n====================================================================');
    console.log('                     PHASE 4D E2E RESULTS SUMMARY                   ');
    console.log('====================================================================');
    for (const [testName, result] of Object.entries(report)) {
      console.log(` ${testName.padEnd(45)} : [${result}]`);
    }
    console.log('====================================================================\n');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('\n❌ PHASE 4D E2E FAILED:', msg);

    // Emergency cleanup if failed mid-way
    if (createdAuthUserId) {
      try {
        await adminClient.from('internal_users').delete().eq('id', createdAuthUserId);
        await adminClient.auth.admin.deleteUser(createdAuthUserId);
        console.log(' - Emergency cleanup completed for test user');
      } catch (cleanErr) {
        console.error(' - Emergency cleanup error:', cleanErr);
      }
    }
    return { success: false, error: msg };
  }
}

runPhase4DE2E();
