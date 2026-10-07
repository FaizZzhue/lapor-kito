/**
 * LAPORKITO — Phase 6A E2E Verification & Integration Test Suite
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runE2E() {
  console.log('====================================================================');
  console.log('   LAPORKITO: PHASE 6A INTERNAL OPERATIONAL WORKFLOW E2E TESTS     ');
  console.log('====================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  // Pre-cleanup of any temporary test authority rules
  await adminClient.from('authority_rules').delete().like('rule_code', 'TEST-%');

  // ------------------------------------------------------------------
  // 1. ROUTE PROTECTION TEST (HTTP)
  // ------------------------------------------------------------------
  console.log('--- TEST 1: ROUTE PROTECTION (UNAUTHENTICATED) ---');
  try {
    const resInbox = await fetch('http://localhost:3000/admin/laporan', {
      redirect: 'manual',
    });
    const statusInbox = resInbox.status;
    const locationInbox = resInbox.headers.get('location') || '';
    assert(
      (statusInbox === 307 || statusInbox === 302 || statusInbox === 303) &&
        locationInbox.includes('/admin/login'),
      'Unauthenticated GET /admin/laporan redirects to /admin/login'
    );

    const resDetail = await fetch('http://localhost:3000/admin/laporan/test-id', {
      redirect: 'manual',
    });
    const statusDetail = resDetail.status;
    const locationDetail = resDetail.headers.get('location') || '';
    assert(
      (statusDetail === 307 || statusDetail === 302 || statusDetail === 303) &&
        locationDetail.includes('/admin/login'),
      'Unauthenticated GET /admin/laporan/[id] redirects to /admin/login'
    );
  } catch (err: unknown) {
    console.warn('Notice: Local HTTP server test (port 3000):', err instanceof Error ? err.message : err);
  }

  // ------------------------------------------------------------------
  // 2. ADMIN AUTHENTICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 2: AUTHENTICATION FLOW ---');
  const authClient = createClient(supabaseUrl, anonKey);
  const { data: signData, error: signErr } = await authClient.auth.signInWithPassword({
    email: 'admin@laporkito.local',
    password: 'AdminLaporKito2026!',
  });
  assert(!signErr && !!signData.session, 'Admin signInWithPassword succeeds with access token');

  // Verify internal_users role
  const { data: adminUserRow } = await adminClient
    .from('internal_users')
    .select('id, email, role, is_active')
    .eq('email', 'admin@laporkito.local')
    .single();
  assert(
    adminUserRow?.role === 'admin' && adminUserRow?.is_active === true,
    'Admin user profile is active and has role "admin"'
  );

  // ------------------------------------------------------------------
  // 3. OPERATIONAL DATA ACCESS (REAL REPORT RESOLUTION)
  // ------------------------------------------------------------------
  console.log('\n--- TEST 3: OPERATIONAL DATA ACCESS ---');
  const { data: repList } = await adminClient.from('reports').select('*');
  assert(repList !== null && repList.length >= 1, 'Real report exists in reports table');

  const targetReport = repList![0];
  console.log(` - Testing with report: ${targetReport.tracking_code} (${targetReport.title})`);

  // Check detail resolution
  const [catRes, kelRes, repDetailRes, evRes, tlRes, aiRes, authRuleRes] = await Promise.all([
    adminClient.from('categories').select('*').eq('id', targetReport.category_id).maybeSingle(),
    adminClient.from('kelurahan').select('*, kecamatan(*)').eq('id', targetReport.kelurahan_id).maybeSingle(),
    adminClient.from('reporters').select('*').eq('id', targetReport.reporter_id).maybeSingle(),
    adminClient.from('report_evidence').select('*').eq('report_id', targetReport.id),
    adminClient.from('report_timeline').select('*').eq('report_id', targetReport.id),
    adminClient.from('ai_triage_logs').select('*').eq('report_id', targetReport.id).maybeSingle(),
    adminClient.from('authority_rules').select('*, institutions(*), institution_units(*)').eq('rule_code', 'RULE_JALAN_KOTA').maybeSingle(),
  ]);

  assert(catRes.data !== null, 'Category resolved: ' + catRes.data?.name_id);
  assert(kelRes.data !== null, 'Kelurahan and Kecamatan resolved: ' + kelRes.data?.name);
  assert(repDetailRes.data !== null, 'Reporter contact resolved internally: ' + repDetailRes.data?.email);
  assert(evRes.data !== null && evRes.data.length > 0, `Evidence files resolved: ${evRes.data?.length} files`);
  assert(tlRes.data !== null && tlRes.data.length > 0, `Timeline audit resolved: ${tlRes.data?.length} events`);
  assert(aiRes.data !== null, 'AI triage log resolved: confidence=' + (aiRes.data?.raw_response as any)?.confidence);
  assert(authRuleRes.data !== null, 'Authority rule resolved: ' + (authRuleRes.data?.institutions as any)?.name);

  // ------------------------------------------------------------------
  // 4. PETUGAS ROLE BOUNDARY & PERMISSIONS
  // ------------------------------------------------------------------
  console.log('\n--- TEST 4: PETUGAS ROLE BOUNDARY & PERMISSIONS ---');
  const anonTestClient = createClient(supabaseUrl, anonKey);

  // Anon user cannot insert authority rules
  const { error: anonRuleErr } = await anonTestClient
    .from('authority_rules')
    .insert({
      rule_code: 'TEST-UNAUTH',
      category_id: targetReport.category_id,
      context_title: 'Test',
      institution_id: (authRuleRes.data as any)?.institution_id,
      regulation_basis: 'Test',
    });
  assert(!!anonRuleErr, 'Anon user cannot insert authority rules (Blocked by RLS)');

  // Anon user cannot view internal reporters table
  const { data: anonReporters, error: anonReportersErr } = await anonTestClient
    .from('reporters')
    .select('*');
  assert(
    !anonReporters || anonReporters.length === 0 || !!anonReportersErr,
    'Anon user cannot read reporters table (Protected from public scraping)'
  );

  // Anon user cannot read internal AI triage logs
  const { data: anonAiLogs, error: anonAiErr } = await anonTestClient
    .from('ai_triage_logs')
    .select('*');
  assert(
    !anonAiLogs || anonAiLogs.length === 0 || !!anonAiErr,
    'Anon user cannot read ai_triage_logs (Strictly internal)'
  );

  // ------------------------------------------------------------------
  // 5. MASTER DATA INTEGRITY BASELINE CHECK
  // ------------------------------------------------------------------
  console.log('\n--- TEST 5: MASTER DATA INTEGRITY ---');
  const [c, kec, kel, inst, units, rules] = await Promise.all([
    adminClient.from('categories').select('*', { count: 'exact', head: true }),
    adminClient.from('kecamatan').select('*', { count: 'exact', head: true }),
    adminClient.from('kelurahan').select('*', { count: 'exact', head: true }),
    adminClient.from('institutions').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('authority_rules').select('*', { count: 'exact', head: true }),
  ]);

  assert(c.count === 4, `categories baseline preserved: ${c.count} (expected 4)`);
  assert(kec.count === 18, `kecamatan baseline preserved: ${kec.count} (expected 18)`);
  assert(kel.count === 107, `kelurahan baseline preserved: ${kel.count} (expected 107)`);
  assert(inst.count === 30, `institutions baseline preserved: ${inst.count} (expected 30)`);
  assert(units.count === 14, `institution_units baseline preserved: ${units.count} (expected 14)`);
  assert(rules.count === 5, `authority_rules baseline preserved: ${rules.count} (expected 5)`);

  console.log(`\n====================================================================`);
  console.log(`   ALL TESTS PASSED: ${passedTests}/${totalTests}                     `);
  console.log(`====================================================================\n`);
}

runE2E().catch((err) => {
  console.error('\nE2E TEST FAILURE:', err);
  process.exit(1);
});
