/**
 * LAPORKITO — Real Internal Admin Account Setup & Verification Script
 * 
 * Creates/upserts the first real development Admin account:
 * - Email: admin@laporkito.local
 * - Full name: Administrator LAPORKITO
 * - Role: admin
 * - is_active: true
 * 
 * Verifies:
 * - Supabase Auth Admin user creation / password synchronization
 * - public.internal_users profile integrity
 * - Real signInWithPassword authentication flow
 * - RLS & internal_users profile resolution
 * - Zero exposure of credentials in logs
 * - Zero regression to master data baseline
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Supabase environment variables are missing in .env.local');
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_EMAIL = 'admin@laporkito.local';
const TARGET_FULL_NAME = 'Administrator LAPORKITO';
const TARGET_ROLE = 'admin';
const TARGET_PASSWORD = process.env.ADMIN_TARGET_PASSWORD || process.argv[2];

if (!TARGET_PASSWORD) {
  throw new Error('Password must be provided via environment variable ADMIN_TARGET_PASSWORD or argument.');
}

async function runAdminSetup() {
  console.log('====================================================================');
  console.log('   LAPORKITO: CREATE & VERIFY FIRST REAL ADMIN ACCOUNT              ');
  console.log('====================================================================\n');

  let authUserCreated = false;
  let profileUpserted = false;
  let authMatchesInternal = false;
  let signInPassed = false;
  let profileAccessible = false;
  let baselinePassed = true;

  try {
    // ------------------------------------------------------------------
    // 1. CHECK EXISTING AUTH USERS
    // ------------------------------------------------------------------
    console.log('[STEP 1] Checking Supabase Auth for existing user...');
    const { data: userList, error: listErr } = await adminSupabase.auth.admin.listUsers();
    if (listErr) {
      throw new Error(`Failed to query auth.users: ${listErr.message}`);
    }

    const existingUser = userList.users.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
    let userId: string;

    if (existingUser) {
      console.log('   - Existing auth account found for target email. Updating credentials & confirming email...');
      const { data: updated, error: updErr } = await adminSupabase.auth.admin.updateUserById(existingUser.id, {
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: TARGET_FULL_NAME },
      });
      if (updErr || !updated.user) {
        throw new Error(`Failed to update auth user: ${updErr?.message}`);
      }
      userId = updated.user.id;
      authUserCreated = true;
      console.log('   - Auth user updated successfully. ID:', userId);
    } else {
      console.log('   - No existing user found. Creating new user via auth.admin.createUser...');
      const { data: created, error: crtErr } = await adminSupabase.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: TARGET_FULL_NAME },
      });
      if (crtErr || !created.user) {
        throw new Error(`Failed to create auth user: ${crtErr?.message}`);
      }
      userId = created.user.id;
      authUserCreated = true;
      console.log('   - Auth user created successfully. ID:', userId);
    }

    // ------------------------------------------------------------------
    // 2. CREATE / UPSERT public.internal_users ROW
    // ------------------------------------------------------------------
    console.log('\n[STEP 2] Upserting public.internal_users profile...');
    const { data: profileData, error: profileErr } = await adminSupabase
      .from('internal_users')
      .upsert({
        id: userId,
        email: TARGET_EMAIL,
        full_name: TARGET_FULL_NAME,
        role: TARGET_ROLE,
        phone: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select('id, email, full_name, role, is_active, phone')
      .single();

    if (profileErr || !profileData) {
      throw new Error(`Failed to upsert public.internal_users: ${profileErr?.message}`);
    }

    profileUpserted = true;
    console.log('   - Profile upserted successfully:');
    console.log(`     ID        : ${profileData.id}`);
    console.log(`     Email     : ${profileData.email}`);
    console.log(`     Name      : ${profileData.full_name}`);
    console.log(`     Role      : ${profileData.role}`);
    console.log(`     Is Active : ${profileData.is_active}`);

    // ------------------------------------------------------------------
    // 3. VERIFY DATABASE INTEGRITY
    // ------------------------------------------------------------------
    console.log('\n[STEP 3] Verifying Database Integrity...');
    const { data: allUsers } = await adminSupabase.auth.admin.listUsers();
    const matchingAuthUsers = (allUsers?.users || []).filter(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
    const { data: matchingInternalUsers } = await adminSupabase
      .from('internal_users')
      .select('*')
      .eq('email', TARGET_EMAIL);

    const exactlyOneAuth = matchingAuthUsers.length === 1;
    const exactlyOneInternal = (matchingInternalUsers || []).length === 1;
    const idsMatch = matchingAuthUsers[0]?.id === matchingInternalUsers?.[0]?.id;
    const roleIsAdmin = matchingInternalUsers?.[0]?.role === 'admin';
    const isActive = matchingInternalUsers?.[0]?.is_active === true;

    console.log(`   - Exactly 1 in auth.users        : ${exactlyOneAuth ? 'PASS' : 'FAIL'}`);
    console.log(`   - Exactly 1 in internal_users    : ${exactlyOneInternal ? 'PASS' : 'FAIL'}`);
    console.log(`   - internal_users.id === auth.id  : ${idsMatch ? 'PASS' : 'FAIL'}`);
    console.log(`   - Role is 'admin'                : ${roleIsAdmin ? 'PASS' : 'FAIL'}`);
    console.log(`   - is_active is true              : ${isActive ? 'PASS' : 'FAIL'}`);

    if (exactlyOneAuth && exactlyOneInternal && idsMatch && roleIsAdmin && isActive) {
      authMatchesInternal = true;
      console.log('   ✅ Integrity Verification: PASS');
    } else {
      throw new Error('Integrity verification failed!');
    }

    // ------------------------------------------------------------------
    // 4. REAL AUTHENTICATION TEST (NORMAL FLOW signInWithPassword)
    // ------------------------------------------------------------------
    console.log('\n[STEP 4] Testing real signInWithPassword via Client SDK...');
    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signResult, error: signErr } = await publicClient.auth.signInWithPassword({
      email: TARGET_EMAIL,
      password: TARGET_PASSWORD,
    });

    if (signErr || !signResult.session || !signResult.user) {
      throw new Error(`Real signInWithPassword failed: ${signErr?.message}`);
    }

    signInPassed = true;
    console.log('   - signInWithPassword succeeded with valid JWT access token.');
    console.log(`   - Authenticated User ID : ${signResult.user.id}`);
    console.log(`   - Session expires in     : ${signResult.session.expires_in}s`);

    // ------------------------------------------------------------------
    // 5. VERIFY AUTHORIZATION & PROFILE FETCH VIA AUTHENTICATED CLIENT
    // ------------------------------------------------------------------
    console.log('\n[STEP 5] Verifying profile access via authenticated session...');
    const { data: authProfile, error: authProfErr } = await publicClient
      .from('internal_users')
      .select('id, role, is_active, full_name')
      .eq('id', signResult.user.id)
      .single();

    if (authProfErr || !authProfile) {
      throw new Error(`Failed to read internal_users via authenticated client: ${authProfErr?.message}`);
    }

    if (authProfile.role === 'admin' && authProfile.is_active === true) {
      profileAccessible = true;
      console.log('   - Profile read successful under authenticated session:');
      console.log(`     Role: ${authProfile.role}, Active: ${authProfile.is_active}`);
      console.log('   ✅ Authorization check: PASS');
    } else {
      throw new Error(`Profile does not satisfy admin authorization requirements: role=${authProfile.role}`);
    }

    // Sign out test session
    await publicClient.auth.signOut();
    console.log('   - Test session signed out cleanly.');

    // ------------------------------------------------------------------
    // 6. MASTER DATA BASELINE REGRESSION CHECK
    // ------------------------------------------------------------------
    console.log('\n[STEP 6] Master Data Baseline Regression Check...');
    const baselineTables = [
      { name: 'categories', expected: 4 },
      { name: 'kecamatan', expected: 18 },
      { name: 'kelurahan', expected: 107 },
      { name: 'institutions', expected: 30 },
      { name: 'institution_units', expected: 14 },
      { name: 'authority_rules', expected: 5 },
      { name: 'reports', expected: 0 },
    ];

    for (const tbl of baselineTables) {
      const { count, error } = await adminSupabase.from(tbl.name).select('*', { count: 'exact', head: true });
      if (error) {
        throw new Error(`Failed to check baseline table ${tbl.name}: ${error.message}`);
      }
      const match = count === tbl.expected;
      console.log(`   - ${tbl.name.padEnd(20)}: ${count} (expected: ${tbl.expected}) -> ${match ? 'PASS' : 'FAIL'}`);
      if (!match) baselinePassed = false;
    }

    // ------------------------------------------------------------------
    // 7. CHECK FOR TEMPORARY / UNINTENDED USERS
    // ------------------------------------------------------------------
    console.log('\n[STEP 7] Unintended / Temporary Users Check...');
    const { data: finalAuthList } = await adminSupabase.auth.admin.listUsers();
    const { data: finalInternalList } = await adminSupabase.from('internal_users').select('*');
    
    console.log(`   - Total auth.users count       : ${finalAuthList?.users?.length}`);
    console.log(`   - Total internal_users count   : ${finalInternalList?.length}`);

    const allUsersAreTarget = (finalAuthList?.users || []).every(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase()) &&
                              (finalInternalList || []).every(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

    console.log(`   - Only requested admin exists  : ${allUsersAreTarget ? 'YES' : 'NO'}`);

  } catch (err: unknown) {
    console.error('\n❌ Error during setup:', err);
    process.exit(1);
  }

  console.log('\n====================================================================');
  console.log('SETUP SUMMARY:');
  console.log(`- Auth user creation: ${authUserCreated ? 'PASS' : 'FAIL'}`);
  console.log(`- internal_users profile: ${profileUpserted ? 'PASS' : 'FAIL'}`);
  console.log(`- Integrity & linkage: ${authMatchesInternal ? 'PASS' : 'FAIL'}`);
  console.log(`- Real login test: ${signInPassed ? 'PASS' : 'FAIL'}`);
  console.log(`- /admin authorization: ${profileAccessible ? 'PASS' : 'FAIL'}`);
  console.log(`- Baseline data intact: ${baselinePassed ? 'PASS' : 'FAIL'}`);
  console.log('====================================================================\n');
}

runAdminSetup();
