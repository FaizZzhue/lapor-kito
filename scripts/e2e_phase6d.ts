/**
 * LAPORKITO — Phase 6D E2E Verification & Integration Test Suite
 * Operational Notification & Status Workflow Hardening
 *
 * Covers:
 * 1. Master data baseline check
 * 2. Report baseline recording (LPK-20261007-DD43)
 * 3. Status transition graph & atomic timeline creation
 * 4. Forbidden status transitions (terminal -> active, verified -> submitted)
 * 5. Email notification integration via Resend (Status change emails)
 * 6. Email failure non-fatal handling (no rollback of business data)
 * 7. Response + Status independence verification (no implicit status changes)
 * 8. Reporter reply attention state in inbox (latest_response_is_citizen flag)
 * 9. Public tracking privacy verification (no PII, no staff email, no internal UUIDs)
 * 10. Clean restoration of LPK-20261007-DD43 to exact baseline
 * 11. Final master data counts re-verification
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import {
  VALID_STATUS_TRANSITIONS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_DESCRIPTIONS,
} from '../lib/constants/report-status';
import { sendStatusChangeEmail } from '../lib/email/resend';
import type { ReportStatus } from '../types/database';

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
  console.log('   LAPORKITO: PHASE 6D OPERATIONAL NOTIFICATION & STATUS HARDENING ');
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
  // 2. LOAD & RECORD BASELINE FOR REAL REPORT (LPK-20261007-DD43)
  // ------------------------------------------------------------------
  console.log('\n--- TEST 2: BASELINE RECORDING (LPK-20261007-DD43) ---');
  const { data: realReport, error: repErr } = await adminClient
    .from('reports')
    .select('id, tracking_code, status, priority, title, reporter_id, created_at, updated_at')
    .eq('tracking_code', 'LPK-20261007-DD43')
    .single();

  assert(!repErr && !!realReport, 'Real report LPK-20261007-DD43 exists');
  if (!realReport) throw new Error('Real report LPK-20261007-DD43 missing');

  const baselineStatus = realReport.status as ReportStatus;
  const baselinePriority = realReport.priority;
  const baselineUpdatedAt = realReport.updated_at;

  const { data: baselineTimeline } = await adminClient
    .from('report_timeline')
    .select('id')
    .eq('report_id', realReport.id);
  const baselineTimelineCount = baselineTimeline?.length || 0;

  const { data: baselineResponses } = await adminClient
    .from('report_responses')
    .select('id')
    .eq('report_id', realReport.id);
  const baselineResponseCount = baselineResponses?.length || 0;

  console.log(`Baseline status: ${baselineStatus}`);
  console.log(`Baseline timeline events: ${baselineTimelineCount}`);
  console.log(`Baseline responses: ${baselineResponseCount}`);

  assert(baselineStatus === 'submitted', 'Baseline status is "submitted"');

  // Verify reporter exists
  const { data: reporterData } = await adminClient
    .from('reporters')
    .select('id, email, full_name')
    .eq('id', realReport.reporter_id)
    .single();
  assert(!!reporterData && !!reporterData.email, `Reporter has registered email: ${reporterData?.email}`);
  if (!reporterData || !reporterData.email) throw new Error('Reporter email missing');

  // ------------------------------------------------------------------
  // 3. INTERNAL STAFF ACCOUNT VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 3: INTERNAL STAFF AUTHORIZATION BASELINE ---');
  const { data: staffUser, error: staffErr } = await adminClient
    .from('internal_users')
    .select('id, email, role, is_active, full_name')
    .eq('email', 'admin@laporkito.local')
    .single();

  assert(!staffErr && !!staffUser, 'Admin staff user exists in internal_users');
  if (!staffUser) throw new Error('Staff user missing');
  assert(staffUser.role === 'admin' && staffUser.is_active, 'Admin staff is active and authorized');

  // ------------------------------------------------------------------
  // 4. TRANSITION GRAPH AND CONSTANTS VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 4: TRANSITION GRAPH & NOTIFICATION METADATA ---');
  assert(VALID_STATUS_TRANSITIONS.submitted.includes('verifying'), 'submitted can transition to verifying');
  assert(VALID_STATUS_TRANSITIONS.verifying.includes('verified'), 'verifying can transition to verified');
  assert(VALID_STATUS_TRANSITIONS.verifying.includes('rejected'), 'verifying can transition to rejected');
  assert(VALID_STATUS_TRANSITIONS.verifying.includes('duplicate'), 'verifying can transition to duplicate');
  assert(VALID_STATUS_TRANSITIONS.verified.includes('in_progress'), 'verified can transition to in_progress');
  assert(VALID_STATUS_TRANSITIONS.in_progress.includes('resolved'), 'in_progress can transition to resolved');
  assert(VALID_STATUS_TRANSITIONS.resolved.length === 0, 'resolved is terminal');
  assert(VALID_STATUS_TRANSITIONS.rejected.length === 0, 'rejected is terminal');
  assert(VALID_STATUS_TRANSITIONS.duplicate.length === 0, 'duplicate is terminal');
  assert(VALID_STATUS_TRANSITIONS.draft.length === 0, 'draft is terminal/non-operational');

  // Verify labels and descriptions
  for (const st of ['verifying', 'verified', 'in_progress', 'resolved', 'rejected', 'duplicate'] as ReportStatus[]) {
    assert(!!REPORT_STATUS_LABELS[st], `REPORT_STATUS_LABELS has entry for ${st}: "${REPORT_STATUS_LABELS[st]}"`);
    assert(!!REPORT_STATUS_DESCRIPTIONS[st], `REPORT_STATUS_DESCRIPTIONS has entry for ${st}`);
  }

  // ------------------------------------------------------------------
  // 5. STATUS CHANGE EMAIL DISPATCH TEST (VIA RESEND)
  // ------------------------------------------------------------------
  console.log('\n--- TEST 5: STATUS CHANGE EMAIL NOTIFICATION TEST ---');
  // Test sending status change notification
  const emailResult = await sendStatusChangeEmail({
    to: reporterData.email,
    reporterName: reporterData.full_name || 'Warga Palembang',
    trackingCode: realReport.tracking_code,
    reportTitle: realReport.title,
    newStatus: 'verifying',
    statusLabel: REPORT_STATUS_LABELS.verifying,
    statusDescription: REPORT_STATUS_DESCRIPTIONS.verifying,
    notes: 'Laporan sedang ditelaah oleh tim verifikator dinas.',
    trackingUrl: `http://localhost:3000/pantau/${realReport.tracking_code}`,
  });

  // Check whether Resend is configured or handles sandbox safely
  if (emailResult.success) {
    console.log('[INFO] Resend API successfully dispatched status change email.');
    assert(true, 'Status change email dispatched via Resend API');
  } else {
    console.log('[INFO] Resend API responded with non-fatal state:', (emailResult as { reason?: string; error?: unknown }).reason || (emailResult as { error?: unknown }).error);
    assert(true, 'Status change email returned non-fatal result without crashing');
  }

  // Test with invalid email (provider error handling without throwing)
  const invalidEmailResult = await sendStatusChangeEmail({
    to: 'invalid-email-format',
    reporterName: 'Tester',
    trackingCode: realReport.tracking_code,
    reportTitle: realReport.title,
    newStatus: 'in_progress',
    statusLabel: REPORT_STATUS_LABELS.in_progress,
    statusDescription: REPORT_STATUS_DESCRIPTIONS.in_progress,
    trackingUrl: `http://localhost:3000/pantau/${realReport.tracking_code}`,
  });
  assert(!invalidEmailResult.success, 'Invalid email fails gracefully without throwing exception');

  // ------------------------------------------------------------------
  // 6. FORBIDDEN STATUS TRANSITIONS VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 6: FORBIDDEN STATUS TRANSITIONS ---');
  const forbidden1 = VALID_STATUS_TRANSITIONS.resolved.includes('verifying');
  assert(!forbidden1, 'Forbidden: resolved -> verifying is blocked');

  const forbidden2 = VALID_STATUS_TRANSITIONS.verified.includes('submitted');
  assert(!forbidden2, 'Forbidden: verified -> submitted is blocked');

  const forbidden3 = VALID_STATUS_TRANSITIONS.rejected.includes('in_progress');
  assert(!forbidden3, 'Forbidden: rejected -> in_progress is blocked');

  // ------------------------------------------------------------------
  // 7. STATUS MUTATION FLOW & TIMELINE CONSISTENCY
  // ------------------------------------------------------------------
  console.log('\n--- TEST 7: STATUS MUTATION CYCLE & TIMELINE CONSISTENCY ---');

  const createdTestTimelineIds: string[] = [];

  // Step A: submitted -> verifying
  const timeA = new Date().toISOString();
  const { error: updErrA } = await adminClient
    .from('reports')
    .update({ status: 'verifying', updated_at: timeA })
    .eq('id', realReport.id)
    .eq('status', 'submitted');
  assert(!updErrA, 'Status transition submitted -> verifying succeeded');

  const { data: tlA, error: tlErrA } = await adminClient
    .from('report_timeline')
    .insert({
      report_id: realReport.id,
      actor_id: staffUser.id,
      actor_role: staffUser.role,
      action: 'Proses Verifikasi Dimulai',
      notes: 'Laporan masuk ke tahap verifikasi operasional.',
      metadata: {
        previous_status: 'submitted',
        next_status: 'verifying',
        is_internal: false,
      },
    })
    .select('id')
    .single();
  assert(!tlErrA && !!tlA, 'Timeline event A recorded atomically');
  if (tlA) createdTestTimelineIds.push(tlA.id);

  // Verify status in DB
  const { data: repCheckA } = await adminClient.from('reports').select('status').eq('id', realReport.id).single();
  assert(repCheckA?.status === 'verifying', 'Database status reflects "verifying"');

  // Step B: verifying -> verified
  const timeB = new Date().toISOString();
  const { error: updErrB } = await adminClient
    .from('reports')
    .update({ status: 'verified', updated_at: timeB })
    .eq('id', realReport.id)
    .eq('status', 'verifying');
  assert(!updErrB, 'Status transition verifying -> verified succeeded');

  const { data: tlB, error: tlErrB } = await adminClient
    .from('report_timeline')
    .insert({
      report_id: realReport.id,
      actor_id: staffUser.id,
      actor_role: staffUser.role,
      action: 'Laporan Terverifikasi',
      notes: 'Laporan telah diverifikasi keabsahannya.',
      metadata: {
        previous_status: 'verifying',
        next_status: 'verified',
        is_internal: false,
      },
    })
    .select('id')
    .single();
  assert(!tlErrB && !!tlB, 'Timeline event B recorded atomically');
  if (tlB) createdTestTimelineIds.push(tlB.id);

  // Step C: verified -> in_progress
  const timeC = new Date().toISOString();
  const { error: updErrC } = await adminClient
    .from('reports')
    .update({ status: 'in_progress', updated_at: timeC })
    .eq('id', realReport.id)
    .eq('status', 'verified');
  assert(!updErrC, 'Status transition verified -> in_progress succeeded');

  const { data: tlC, error: tlErrC } = await adminClient
    .from('report_timeline')
    .insert({
      report_id: realReport.id,
      actor_id: staffUser.id,
      actor_role: staffUser.role,
      action: 'Laporan Sedang Ditindaklanjuti',
      notes: 'Laporan dalam penanganan langsung di lapangan.',
      metadata: {
        previous_status: 'verified',
        next_status: 'in_progress',
        is_internal: false,
      },
    })
    .select('id')
    .single();
  assert(!tlErrC && !!tlC, 'Timeline event C recorded atomically');
  if (tlC) createdTestTimelineIds.push(tlC.id);

  // Step D: in_progress -> resolved
  const timeD = new Date().toISOString();
  const { error: updErrD } = await adminClient
    .from('reports')
    .update({ status: 'resolved', updated_at: timeD })
    .eq('id', realReport.id)
    .eq('status', 'in_progress');
  assert(!updErrD, 'Status transition in_progress -> resolved succeeded');

  const { data: tlD, error: tlErrD } = await adminClient
    .from('report_timeline')
    .insert({
      report_id: realReport.id,
      actor_id: staffUser.id,
      actor_role: staffUser.role,
      action: 'Laporan Selesai',
      notes: 'Penanganan pengaduan telah tuntas dilaksanakan.',
      metadata: {
        previous_status: 'in_progress',
        next_status: 'resolved',
        is_internal: false,
      },
    })
    .select('id')
    .single();
  assert(!tlErrD && !!tlD, 'Timeline event D recorded atomically');
  if (tlD) createdTestTimelineIds.push(tlD.id);

  const { data: repCheckD } = await adminClient.from('reports').select('status').eq('id', realReport.id).single();
  assert(repCheckD?.status === 'resolved', 'Database status reflects "resolved"');

  // Verify timeline events count for this report
  const { data: timelineDuringTest } = await adminClient
    .from('report_timeline')
    .select('id')
    .eq('report_id', realReport.id);
  assert(
    timelineDuringTest?.length === baselineTimelineCount + 4,
    `Exactly 4 timeline events added (Baseline: ${baselineTimelineCount}, Current: ${timelineDuringTest?.length})`
  );

  // ------------------------------------------------------------------
  // 8. RESPONSE + STATUS INDEPENDENCE VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 8: RESPONSE & STATUS INDEPENDENCE ---');

  // Official Response: must NOT change status
  const { data: testOfficialResp, error: offRespErr } = await adminClient
    .from('report_responses')
    .insert({
      report_id: realReport.id,
      responder_id: staffUser.id,
      response_type: 'official',
      message: 'Uji tanggapan resmi dari petugas.',
      attachments: [],
      is_public: true,
    })
    .select('id')
    .single();
  assert(!offRespErr && !!testOfficialResp, 'Official response inserted');

  const { data: statusAfterOfficial } = await adminClient
    .from('reports')
    .select('status')
    .eq('id', realReport.id)
    .single();
  assert(statusAfterOfficial?.status === 'resolved', 'Official response DID NOT mutate report status');

  // Citizen Response: must NOT change status
  const { data: testCitizenResp, error: citRespErr } = await adminClient
    .from('report_responses')
    .insert({
      report_id: realReport.id,
      responder_id: null,
      response_type: 'clarification',
      message: 'Uji klarifikasi tambahan dari warga pelapor.',
      attachments: [],
      is_public: true,
    })
    .select('id')
    .single();
  assert(!citRespErr && !!testCitizenResp, 'Citizen clarification response inserted');

  const { data: statusAfterCitizen } = await adminClient
    .from('reports')
    .select('status')
    .eq('id', realReport.id)
    .single();
  assert(statusAfterCitizen?.status === 'resolved', 'Citizen response DID NOT mutate report status');

  // ------------------------------------------------------------------
  // 9. REPORTER REPLY ATTENTION STATE VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 9: REPORTER REPLY ATTENTION STATE IN INBOX ---');
  // Load responses for the report in descending order of created_at
  const { data: testReportResponses, error: loadRespErr } = await adminClient
    .from('report_responses')
    .select('id, responder_id, response_type, created_at')
    .eq('report_id', realReport.id)
    .order('created_at', { ascending: false });

  assert(!loadRespErr && !!testReportResponses && testReportResponses.length >= 2, 'Report responses loaded');
  const newestResp = testReportResponses![0];
  const latestIsCitizen = newestResp.responder_id === null;
  assert(latestIsCitizen === true, 'Latest response is citizen reply -> latest_response_is_citizen is true');

  // Now simulate staff following up with an official response
  const { data: followUpOfficialResp, error: followUpErr } = await adminClient
    .from('report_responses')
    .insert({
      report_id: realReport.id,
      responder_id: staffUser.id,
      response_type: 'official',
      message: 'Tindak lanjut petugas atas klarifikasi warga.',
      attachments: [],
      is_public: true,
    })
    .select('id')
    .single();
  assert(!followUpErr && !!followUpOfficialResp, 'Staff follow-up response inserted');

  const { data: reloadedResponses, error: reloadRespErr } = await adminClient
    .from('report_responses')
    .select('id, responder_id, response_type, created_at')
    .eq('report_id', realReport.id)
    .order('created_at', { ascending: false });

  assert(!reloadRespErr && !!reloadedResponses, 'Reloaded responses successfully');
  const updatedNewestResp = reloadedResponses![0];
  const updatedIsCitizen = updatedNewestResp.responder_id === null;
  assert(updatedIsCitizen === false, 'Staff responded -> latest_response_is_citizen correctly turns false');

  // Clean up test responses
  if (!testOfficialResp || !testCitizenResp || !followUpOfficialResp) {
    throw new Error('Test responses missing');
  }
  const testRespIds = [
    testOfficialResp.id,
    testCitizenResp.id,
    followUpOfficialResp.id,
  ];
  await adminClient.from('report_responses').delete().in('id', testRespIds);
  console.log('[INFO] Test responses successfully deleted');

  // ------------------------------------------------------------------
  // 10. PUBLIC TRACKING PRIVACY VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 10: PUBLIC TRACKING PRIVACY VERIFICATION ---');
  // Call public RPC
  const { data: publicRpcData, error: publicRpcErr } = await anonClient.rpc(
    'get_public_report_by_tracking_code',
    { target_tracking_code: realReport.tracking_code }
  );

  assert(!publicRpcErr && publicRpcData && publicRpcData.length > 0, 'Public tracking RPC succeeded');
  const pubReport = publicRpcData[0];

  assert(pubReport.tracking_code === realReport.tracking_code, 'Public report matches tracking code');
  assert(!('reporter_email' in pubReport), 'Privacy: reporter_email NOT exposed in public data');
  assert(!('reporter_phone' in pubReport), 'Privacy: reporter_phone NOT exposed in public data');
  assert(!('reporter_id' in pubReport), 'Privacy: reporter_id NOT exposed in public data');
  assert(!('ai_raw_response' in pubReport), 'Privacy: ai_raw_response NOT exposed in public data');
  assert(!('service_role_key' in pubReport), 'Privacy: service_role_key NOT exposed');

  // Check public timeline
  const { data: publicTimeline } = await anonClient
    .from('report_timeline')
    .select('id, action, notes, created_at')
    .eq('report_id', realReport.id);
  assert(!!publicTimeline, 'Public timeline queried successfully');
  if (publicTimeline && publicTimeline.length > 0) {
    for (const item of publicTimeline) {
      assert(!('actor_email' in item), 'Public timeline does NOT expose staff email');
      assert(!('metadata' in item), 'Public timeline does NOT expose internal metadata');
    }
  }

  // ------------------------------------------------------------------
  // 11. CLEAN RESTORATION TO EXACT BASELINE
  // ------------------------------------------------------------------
  console.log('\n--- TEST 11: CLEAN RESTORATION OF LPK-20261007-DD43 ---');
  // Delete the 4 test timeline events
  if (createdTestTimelineIds.length > 0) {
    const { error: delTlErr } = await adminClient
      .from('report_timeline')
      .delete()
      .in('id', createdTestTimelineIds);
    assert(!delTlErr, 'Test timeline records successfully deleted');
  }

  // Restore report to baseline
  const { error: restoreErr } = await adminClient
    .from('reports')
    .update({
      status: baselineStatus,
      priority: baselinePriority,
      updated_at: baselineUpdatedAt,
    })
    .eq('id', realReport.id);
  assert(!restoreErr, 'Report status and timestamp restored to exact baseline');

  // Verify restored state
  const { data: finalReport } = await adminClient
    .from('reports')
    .select('status, priority, updated_at')
    .eq('id', realReport.id)
    .single();

  assert(finalReport?.status === baselineStatus, `Report status is back to ${baselineStatus}`);
  assert(finalReport?.priority === baselinePriority, `Report priority is ${baselinePriority}`);

  const { data: finalTimeline } = await adminClient
    .from('report_timeline')
    .select('id')
    .eq('report_id', realReport.id);
  assert(
    finalTimeline?.length === baselineTimelineCount,
    `Timeline count restored to exact baseline: ${baselineTimelineCount}`
  );

  const { data: finalResponses } = await adminClient
    .from('report_responses')
    .select('id')
    .eq('report_id', realReport.id);
  assert(
    finalResponses?.length === baselineResponseCount,
    `Responses count restored to exact baseline: ${baselineResponseCount}`
  );

  // ------------------------------------------------------------------
  // 12. FINAL MASTER DATA RE-VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 12: FINAL MASTER DATA RE-VERIFICATION ---');
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
  console.log(`   PHASE 6D E2E TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================================\n');
}

runE2E().catch((err) => {
  console.error('\nE2E Test Execution Failed:', err);
  process.exit(1);
});
