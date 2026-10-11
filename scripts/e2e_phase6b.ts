/**
 * LAPORKITO — Phase 6B E2E Verification & Integration Test Suite
 * Verification + Status Transition + Operational Timeline + Restoration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { VALID_STATUS_TRANSITIONS } from '../lib/constants/report-status';
import { updateReportStatusSchema } from '../lib/validators/report';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(supabaseUrl, anonKey);

async function runE2E() {
  console.log('====================================================================');
  console.log('   LAPORKITO: PHASE 6B PETUGAS OPERATIONAL ACTION E2E TESTS        ');
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

  // ------------------------------------------------------------------
  // 1. MASTER DATA INTEGRITY BASELINE
  // ------------------------------------------------------------------
  console.log('--- TEST 1: MASTER DATA INTEGRITY BASELINE ---');
  const [catRes, kecRes, kelRes, instRes, unitRes, ruleRes] = await Promise.all([
    adminClient.from('categories').select('*', { count: 'exact', head: true }),
    adminClient.from('kecamatan').select('*', { count: 'exact', head: true }),
    adminClient.from('kelurahan').select('*', { count: 'exact', head: true }),
    adminClient.from('institutions').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('authority_rules').select('*', { count: 'exact', head: true }),
  ]);

  assert(catRes.count === 4, `categories = 4 (Actual: ${catRes.count})`);
  assert(kecRes.count === 18, `kecamatan = 18 (Actual: ${kecRes.count})`);
  assert(kelRes.count === 107, `kelurahan = 107 (Actual: ${kelRes.count})`);
  assert(instRes.count === 30, `institutions = 30 (Actual: ${instRes.count})`);
  assert(unitRes.count === 14, `institution_units = 14 (Actual: ${unitRes.count})`);
  assert(ruleRes.count === 5, `authority_rules = 5 (Actual: ${ruleRes.count})`);

  // ------------------------------------------------------------------
  // 2. STATUS TRANSITION GRAPH RULES AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- TEST 2: STATUS TRANSITION GRAPH INTEGRITY ---');
  assert(
    VALID_STATUS_TRANSITIONS.submitted.includes('verifying') &&
      VALID_STATUS_TRANSITIONS.submitted.length === 1,
    'submitted can only transition to verifying'
  );
  assert(
    VALID_STATUS_TRANSITIONS.verifying.includes('verified') &&
      VALID_STATUS_TRANSITIONS.verifying.includes('rejected') &&
      VALID_STATUS_TRANSITIONS.verifying.includes('duplicate'),
    'verifying can transition to verified, rejected, duplicate'
  );
  assert(
    VALID_STATUS_TRANSITIONS.verified.includes('in_progress') &&
      VALID_STATUS_TRANSITIONS.verified.includes('rejected') &&
      VALID_STATUS_TRANSITIONS.verified.includes('duplicate'),
    'verified can transition to in_progress, rejected, duplicate'
  );
  assert(
    VALID_STATUS_TRANSITIONS.in_progress.includes('resolved') &&
      VALID_STATUS_TRANSITIONS.in_progress.includes('rejected'),
    'in_progress can transition to resolved, rejected'
  );
  assert(
    VALID_STATUS_TRANSITIONS.resolved.length === 0,
    'resolved is terminal (no next transitions)'
  );
  assert(
    VALID_STATUS_TRANSITIONS.rejected.length === 0,
    'rejected is terminal (no next transitions)'
  );
  assert(
    VALID_STATUS_TRANSITIONS.duplicate.length === 0,
    'duplicate is terminal (no next transitions)'
  );
  assert(
    VALID_STATUS_TRANSITIONS.draft.length === 0,
    'draft cannot be mutated by operational petugas'
  );

  // ------------------------------------------------------------------
  // 3. ZOD SCHEMA & INPUT VALIDATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 3: INPUT VALIDATION (ZOD SCHEMA) ---');
  const validPayload = {
    reportId: '6acdba65-12ad-47dd-8eef-ee6e80390169',
    nextStatus: 'verifying',
    notes: 'Pemeriksaan berkas',
  };
  const parseValid = updateReportStatusSchema.safeParse(validPayload);
  assert(parseValid.success, 'Valid schema payload passes');

  const invalidUUID = {
    reportId: 'not-a-uuid',
    nextStatus: 'verifying',
  };
  const parseInvalidUUID = updateReportStatusSchema.safeParse(invalidUUID);
  assert(!parseInvalidUUID.success, 'Invalid UUID is rejected by schema');

  const invalidStatus = {
    reportId: '6acdba65-12ad-47dd-8eef-ee6e80390169',
    nextStatus: 'invalid_status_xyz',
  };
  const parseInvalidStatus = updateReportStatusSchema.safeParse(invalidStatus);
  assert(!parseInvalidStatus.success, 'Non-existent enum status is rejected by schema');

  // ------------------------------------------------------------------
  // 4. ANONYMOUS & PUBLIC ACCESS SECURITY (RLS)
  // ------------------------------------------------------------------
  console.log('\n--- TEST 4: ANONYMOUS / PUBLIC PERMISSIONS (RLS) ---');
  // Anon user attempting direct status update on reports
  const { data: anonUpdatedRows, error: anonUpdateErr } = await anonClient
    .from('reports')
    .update({ status: 'resolved' })
    .eq('tracking_code', 'LPK-20261007-DD43')
    .select();

  const { data: checkReportStatus } = await adminClient
    .from('reports')
    .select('status')
    .eq('tracking_code', 'LPK-20261007-DD43')
    .single();

  assert(
    !!anonUpdateErr || !anonUpdatedRows || anonUpdatedRows.length === 0,
    'Anonymous user cannot mutate report status via Supabase client (0 rows affected or RLS error)'
  );
  assert(
    checkReportStatus?.status !== 'resolved',
    `Database confirms report status was not compromised by anonymous client (Status: ${checkReportStatus?.status})`
  );

  // Anon user attempting to insert fake timeline event
  const { error: anonTimelineErr } = await anonClient
    .from('report_timeline')
    .insert({
      report_id: '6acdba65-12ad-47dd-8eef-ee6e80390169',
      actor_role: 'admin',
      action: 'Fake Event',
      notes: 'Hacked',
    });
  assert(!!anonTimelineErr, 'Anonymous user cannot insert into report_timeline (Blocked by RLS)');

  // ------------------------------------------------------------------
  // 5. INSPECT REAL REPORT LPK-20261007-DD43
  // ------------------------------------------------------------------
  console.log('\n--- TEST 5: REAL REPORT INSPECTION (LPK-20261007-DD43) ---');
  const { data: realReport, error: realReportErr } = await adminClient
    .from('reports')
    .select('id, tracking_code, status, priority, title, created_at')
    .eq('tracking_code', 'LPK-20261007-DD43')
    .single();

  assert(!realReportErr && !!realReport, 'Real report LPK-20261007-DD43 found in database');
  if (!realReport) {
    throw new Error('Real report LPK-20261007-DD43 not found in database');
  }
  const originalStatus = realReport.status;
  console.log(` - Original Status: ${originalStatus}`);
  console.log(` - Priority: ${realReport.priority}`);
  console.log(` - Title: ${realReport.title}`);

  // Query baseline timeline records count
  const { data: baselineTimeline } = await adminClient
    .from('report_timeline')
    .select('id')
    .eq('report_id', realReport.id);
  const baselineTimelineCount = baselineTimeline?.length || 0;
  console.log(` - Baseline Timeline entries count: ${baselineTimelineCount}`);

  // ------------------------------------------------------------------
  // 6. OPERATIONAL STATUS TRANSITION TEST ON REAL REPORT
  // ------------------------------------------------------------------
  console.log('\n--- TEST 6: STATUS TRANSITIONS & TIMELINE AUDITING ---');

  // Step 6a: Test submitted -> verifying
  console.log('Testing Transition 1: submitted -> verifying ...');
  const nowIso = new Date().toISOString();
  const { error: updateVerifyingErr } = await adminClient
    .from('reports')
    .update({ status: 'verifying', updated_at: nowIso })
    .eq('id', realReport.id);
  assert(!updateVerifyingErr, 'Status transitioned to verifying');

  // Insert timeline event
  const { data: tl1, error: tl1Err } = await adminClient
    .from('report_timeline')
    .insert({
      report_id: realReport.id,
      actor_role: 'petugas',
      action: 'Proses Verifikasi Dimulai',
      notes: '[E2E-TEST] Laporan masuk ke tahap verifikasi operasional.',
      metadata: { previous_status: 'submitted', next_status: 'verifying', test: true },
    })
    .select('id')
    .single();
  assert(!tl1Err && !!tl1, 'Timeline entry for verifying created successfully');

  // Step 6b: Verify public tracking reflects verifying status
  console.log('\nTesting Public Tracking API for LPK-20261007-DD43 ...');
  const resTrack = await fetch('http://localhost:3000/pantau/LPK-20261007-DD43');
  assert(resTrack.status === 200, 'Public tracking returns HTTP 200');
  const trackHtml = await resTrack.text();
  assert(
    trackHtml.includes('Verifikasi') || trackHtml.includes('verifying'),
    'Public tracking reflects "Verifikasi" status'
  );
  // Verify public privacy: no private emails or AI internals leaked in HTML
  assert(
    !trackHtml.includes('admin@laporkito.local'),
    'Public tracking does NOT leak staff email'
  );
  assert(
    !trackHtml.includes('prompt_version'),
    'Public tracking does NOT leak raw AI triage log metadata'
  );

  // Step 6c: Test verifying -> verified
  console.log('\nTesting Transition 2: verifying -> verified ...');
  const { error: updateVerifiedErr } = await adminClient
    .from('reports')
    .update({ status: 'verified', updated_at: new Date().toISOString() })
    .eq('id', realReport.id);
  assert(!updateVerifiedErr, 'Status transitioned to verified');

  const { data: tl2, error: tl2Err } = await adminClient
    .from('report_timeline')
    .insert({
      report_id: realReport.id,
      actor_role: 'petugas',
      action: 'Laporan Terverifikasi',
      notes: '[E2E-TEST] Laporan dinyatakan valid.',
      metadata: { previous_status: 'verifying', next_status: 'verified', test: true },
    })
    .select('id')
    .single();
  assert(!tl2Err && !!tl2, 'Timeline entry for verified created successfully');

  // Step 6d: Test invalid transition rejection (verified -> submitted is forbidden)
  console.log('\nTesting Invalid Transition Protection: verified -> submitted ...');
  const allowedNext = VALID_STATUS_TRANSITIONS['verified'];
  assert(
    !allowedNext.includes('submitted'),
    'Transition matrix correctly forbids verified -> submitted'
  );

  // ------------------------------------------------------------------
  // 7. RESTORATION OF REAL REPORT LPK-20261007-DD43
  // ------------------------------------------------------------------
  console.log('\n--- TEST 7: RESTORING REAL REPORT STATE ---');
  // Revert report status back to its original baseline state
  const { error: restoreErr } = await adminClient
    .from('reports')
    .update({ status: originalStatus, updated_at: realReport.created_at })
    .eq('id', realReport.id);
  assert(!restoreErr, `Real report restored back to original status: "${originalStatus}"`);

  // Clean up only the test timeline records created during this test
  const { error: cleanTlErr } = await adminClient
    .from('report_timeline')
    .delete()
    .eq('report_id', realReport.id)
    .like('notes', '[E2E-TEST]%');
  assert(!cleanTlErr, 'Test timeline records cleaned up without traces');

  // Verify timeline count is restored to baseline
  const { data: restoredTimeline } = await adminClient
    .from('report_timeline')
    .select('id')
    .eq('report_id', realReport.id);
  assert(
    restoredTimeline?.length === baselineTimelineCount,
    `Timeline entries count restored to baseline: ${baselineTimelineCount}`
  );

  // Verify final report status from DB
  const { data: verifiedRestoredReport } = await adminClient
    .from('reports')
    .select('status')
    .eq('id', realReport.id)
    .single();
  assert(
    verifiedRestoredReport?.status === originalStatus,
    `Database confirms report status is strictly "${originalStatus}"`
  );

  // ------------------------------------------------------------------
  // 8. FINAL MASTER DATA COUNTS RE-VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 8: FINAL MASTER DATA RE-VERIFICATION ---');
  const [catFinal, kecFinal, kelFinal, instFinal, unitFinal, ruleFinal] = await Promise.all([
    adminClient.from('categories').select('*', { count: 'exact', head: true }),
    adminClient.from('kecamatan').select('*', { count: 'exact', head: true }),
    adminClient.from('kelurahan').select('*', { count: 'exact', head: true }),
    adminClient.from('institutions').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('authority_rules').select('*', { count: 'exact', head: true }),
  ]);

  assert(catFinal.count === 4, 'Final categories = 4');
  assert(kecFinal.count === 18, 'Final kecamatan = 18');
  assert(kelFinal.count === 107, 'Final kelurahan = 107');
  assert(instFinal.count === 30, 'Final institutions = 30');
  assert(unitFinal.count === 14, 'Final institution_units = 14');
  assert(ruleFinal.count === 5, 'Final authority_rules = 5');

  console.log('\n====================================================================');
  console.log(`   PHASE 6B E2E TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================================\n');
}

runE2E().catch((err) => {
  console.error('\nE2E Test Execution Failed:', err);
  process.exit(1);
});
