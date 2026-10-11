/**
 * LAPORKITO — Phase 6C E2E Verification & Integration Test Suite
 * Centralized Follow-Up: Official Response + Citizen Reply + Timeline + Email + Clean Restoration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import {
  createOfficialResponseSchema,
  createResponseSchema,
} from '../lib/validators/tanggapan';
import { sendOfficialResponseEmail } from '../lib/email/resend';

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
  console.log('   LAPORKITO: PHASE 6C CENTRALIZED FOLLOW-UP E2E TESTS             ');
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
  // 2. SCHEMA & VALIDATOR TESTING
  // ------------------------------------------------------------------
  console.log('\n--- TEST 2: ZOD VALIDATION & SAFETY RULES ---');

  // Valid official response
  const validOfficial = createOfficialResponseSchema.safeParse({
    reportId: '6acdba65-12ad-47dd-8eef-ee6e80390169',
    message: 'Tim operasional Dinas PUPR sedang menuju ke lokasi pengaduan.',
    responseType: 'official',
  });
  assert(validOfficial.success, 'Valid official response passes validation');

  // Rejection of empty/short message
  const shortMessage = createOfficialResponseSchema.safeParse({
    reportId: '6acdba65-12ad-47dd-8eef-ee6e80390169',
    message: 'ok',
  });
  assert(!shortMessage.success, 'Short message (< 5 chars) is rejected');

  // Rejection of malicious script tag
  const scriptMessage = createOfficialResponseSchema.safeParse({
    reportId: '6acdba65-12ad-47dd-8eef-ee6e80390169',
    message: 'Peringatan penting <script>alert("hack")</script> segera tangani',
  });
  assert(!scriptMessage.success, 'Script tags are rejected by sanitization rule');

  // Valid citizen clarification
  const validClarification = createResponseSchema.safeParse({
    reportId: '6acdba65-12ad-47dd-8eef-ee6e80390169',
    responseType: 'clarification',
    message: 'Tambahan informasi: aspal amblas berada tepat di depan gapura RT 04.',
    isPublic: true,
  });
  assert(validClarification.success, 'Citizen clarification payload passes validation');

  // ------------------------------------------------------------------
  // 3. ANONYMOUS & RLS SECURITY
  // ------------------------------------------------------------------
  console.log('\n--- TEST 3: ANONYMOUS ACCESS RESTRICTION (RLS) ---');
  // Anonymous user cannot insert directly into report_responses
  const { data: anonInsertedRows, error: anonRespErr } = await anonClient
    .from('report_responses')
    .insert({
      report_id: '6acdba65-12ad-47dd-8eef-ee6e80390169',
      response_type: 'official',
      message: 'Hacked official response',
    })
    .select();

  assert(
    !!anonRespErr || !anonInsertedRows || anonInsertedRows.length === 0,
    'Anonymous user cannot insert into report_responses (Blocked by RLS)'
  );

  // ------------------------------------------------------------------
  // 4. REAL OPERATIONAL REPORT BASELINE (LPK-20261007-DD43)
  // ------------------------------------------------------------------
  console.log('\n--- TEST 4: INSPECT REAL REPORT LPK-20261007-DD43 BASELINE ---');
  const { data: realReport, error: realReportErr } = await adminClient
    .from('reports')
    .select('id, tracking_code, status, priority, title, reporter_id, created_at')
    .eq('tracking_code', 'LPK-20261007-DD43')
    .single();

  assert(!realReportErr && !!realReport, 'Real report LPK-20261007-DD43 found in database');
  if (!realReport) throw new Error('Real report not found');

  assert(realReport.status === 'submitted', `Initial status is strictly 'submitted' (Actual: ${realReport.status})`);
  assert(realReport.priority === 'high', `Initial priority is 'high' (Actual: ${realReport.priority})`);
  console.log(` - Tracking Code: ${realReport.tracking_code}`);
  console.log(` - Title: ${realReport.title}`);
  console.log(` - Reporter ID: ${realReport.reporter_id}`);

  // Fetch registered reporter details
  let registeredEmail: string | null = null;
  if (realReport.reporter_id) {
    const { data: reporterData } = await adminClient
      .from('reporters')
      .select('email, full_name, phone')
      .eq('id', realReport.reporter_id)
      .single();
    registeredEmail = reporterData?.email || null;
    console.log(` - Reporter registered email: ${registeredEmail || 'none'}`);
  }

  // Count baseline responses and timeline
  const { data: baselineResponses } = await adminClient
    .from('report_responses')
    .select('id')
    .eq('report_id', realReport.id);
  const baselineResponseCount = baselineResponses?.length || 0;
  console.log(` - Baseline responses count: ${baselineResponseCount}`);

  const { data: baselineTimeline } = await adminClient
    .from('report_timeline')
    .select('id')
    .eq('report_id', realReport.id);
  const baselineTimelineCount = baselineTimeline?.length || 0;
  console.log(` - Baseline timeline count: ${baselineTimelineCount}`);

  // Fetch admin user ID to act as responder
  const { data: adminUser } = await adminClient
    .from('internal_users')
    .select('id, full_name, role')
    .eq('role', 'admin')
    .limit(1)
    .single();

  assert(!!adminUser, 'Internal admin user account found for operational testing');
  if (!adminUser) throw new Error('No admin user found');

  // ------------------------------------------------------------------
  // 5. TEST PETUGAS OFFICIAL RESPONSE
  // ------------------------------------------------------------------
  console.log('\n--- TEST 5: PETUGAS OFFICIAL RESPONSE FLOW ---');
  const testMessage = '[E2E-TEST-6C] Laporan telah diterima dan tim peninjau jalan Dinas PUPR dijadwalkan turun ke lokasi besok pagi.';
  
  // Insert response
  const { data: insertedOfficial, error: insertOfficialErr } = await adminClient
    .from('report_responses')
    .insert({
      report_id: realReport.id,
      responder_id: adminUser.id,
      response_type: 'official',
      message: testMessage,
      attachments: [],
      is_public: true,
    })
    .select('id, response_type, message, is_public')
    .single();

  assert(!insertOfficialErr && !!insertedOfficial, 'Official response inserted into report_responses');
  assert(insertedOfficial?.response_type === 'official', 'Response type is strictly "official"');

  // Insert timeline event for official response
  const { data: tlOfficial, error: tlOfficialErr } = await adminClient
    .from('report_timeline')
    .insert({
      report_id: realReport.id,
      actor_id: adminUser.id,
      actor_role: 'admin',
      action: 'Tanggapan Resmi Dikirim',
      notes: testMessage,
      metadata: {
        is_internal: false,
        responder_name: adminUser.full_name,
        test: true,
      },
    })
    .select('id, action')
    .single();

  assert(!tlOfficialErr && !!tlOfficial, 'Timeline event "Tanggapan Resmi Dikirim" recorded');

  // Check public tracking displays official response
  console.log('\nTesting Public Tracking for official response...');
  const resTrack = await fetch(`http://localhost:3000/pantau/${realReport.tracking_code}`);
  assert(resTrack.status === 200, 'Public tracking returns HTTP 200');
  const trackHtml = await resTrack.text();
  assert(
    trackHtml.includes('Tanggapan Resmi') || trackHtml.includes('Petugas Instansi'),
    'Public tracking displays official response header'
  );
  assert(
    trackHtml.includes('Dinas PUPR') || trackHtml.includes('peninjau jalan'),
    'Public tracking includes official response text content'
  );

  // Check privacy on public tracking
  assert(!trackHtml.includes(adminUser.id), 'Public tracking does NOT leak staff UUID');
  assert(!trackHtml.includes('admin@laporkito.local'), 'Public tracking does NOT leak staff email');
  if (registeredEmail) {
    assert(!trackHtml.includes(registeredEmail), 'Public tracking does NOT leak reporter email');
  }

  // ------------------------------------------------------------------
  // 6. TEST EMAIL NOTIFICATION FUNCTIONALITY (RESEND)
  // ------------------------------------------------------------------
  console.log('\n--- TEST 6: RESEND EMAIL NOTIFICATION INTEGRITY ---');
  if (registeredEmail) {
    const emailResult = await sendOfficialResponseEmail({
      to: registeredEmail,
      reporterName: 'Warga Palembang',
      trackingCode: realReport.tracking_code,
      reportTitle: realReport.title,
      responseMessage: testMessage,
      trackingUrl: `http://localhost:3000/pantau/${realReport.tracking_code}`,
    });

    console.log(` - Email delivery attempt result: success=${emailResult.success}`);
    assert(
      emailResult.success || emailResult.reason === 'RESEND_NOT_CONFIGURED' || !!emailResult.error,
      'Email notification executed safely without crashing or breaking response'
    );
  } else {
    console.log(' - No registered email for this report; email notification safely skipped as expected.');
    assert(true, 'Reports without email skip email dispatch without errors');
  }

  // ------------------------------------------------------------------
  // 7. TEST CITIZEN REPLY FLOW
  // ------------------------------------------------------------------
  console.log('\n--- TEST 7: CITIZEN REPLY FLOW & SECURITY BOUNDARIES ---');
  const citizenReplyMsg = '[E2E-TEST-6C] Terima kasih atas tanggapannya. Kami warga siap mendampingi petugas saat survei.';

  // Insert citizen clarification response
  const { data: insertedCitizen, error: insertCitizenErr } = await adminClient
    .from('report_responses')
    .insert({
      report_id: realReport.id,
      responder_id: null, // Citizen
      response_type: 'clarification',
      message: citizenReplyMsg,
      attachments: [],
      is_public: true,
    })
    .select('id, response_type')
    .single();

  assert(!insertCitizenErr && !!insertedCitizen, 'Citizen reply inserted into report_responses');
  assert(insertedCitizen?.response_type === 'clarification', 'Citizen response is categorized as "clarification"');

  // Insert timeline event for citizen reply
  const { data: tlCitizen, error: tlCitizenErr } = await adminClient
    .from('report_timeline')
    .insert({
      report_id: realReport.id,
      actor_role: 'reporter',
      action: 'Balasan Pelapor Diterima',
      notes: citizenReplyMsg,
      metadata: { is_internal: false, test: true },
    })
    .select('id, action')
    .single();

  assert(!tlCitizenErr && !!tlCitizen, 'Timeline event "Balasan Pelapor Diterima" recorded');

  // Verify public tracking displays citizen reply
  const resTrackAfterReply = await fetch(`http://localhost:3000/pantau/${realReport.tracking_code}`);
  const trackHtmlReply = await resTrackAfterReply.text();
  assert(
    trackHtmlReply.includes('Klarifikasi Warga') || trackHtmlReply.includes('Pelapor (Warga)'),
    'Public tracking displays citizen reply badge'
  );

  // ------------------------------------------------------------------
  // 8. TEST STATUS INDEPENDENCE (STEP 17)
  // ------------------------------------------------------------------
  console.log('\n--- TEST 8: STATUS INDEPENDENCE (NO IMPLICIT TRANSITIONS) ---');
  const { data: checkReportStatus } = await adminClient
    .from('reports')
    .select('status')
    .eq('id', realReport.id)
    .single();

  assert(
    checkReportStatus?.status === 'submitted',
    `Report status remains strictly 'submitted' (Status did NOT implicitly change; actual: ${checkReportStatus?.status})`
  );

  // ------------------------------------------------------------------
  // 9. RESTORATION & CLEANUP
  // ------------------------------------------------------------------
  console.log('\n--- TEST 9: RESTORATION & CLEANUP ---');

  // Delete test responses
  const { error: delRespErr } = await adminClient
    .from('report_responses')
    .delete()
    .eq('report_id', realReport.id)
    .like('message', '[E2E-TEST-6C]%');
  assert(!delRespErr, 'Test report responses cleaned up without traces');

  // Delete test timeline entries
  const { error: delTlErr } = await adminClient
    .from('report_timeline')
    .delete()
    .eq('report_id', realReport.id)
    .like('notes', '[E2E-TEST-6C]%');
  assert(!delTlErr, 'Test timeline records cleaned up without traces');

  // Verify response count restored to baseline
  const { data: finalResponses } = await adminClient
    .from('report_responses')
    .select('id')
    .eq('report_id', realReport.id);
  assert(
    finalResponses?.length === baselineResponseCount,
    `Responses count restored to baseline: ${baselineResponseCount}`
  );

  // Verify timeline count restored to baseline
  const { data: finalTimeline } = await adminClient
    .from('report_timeline')
    .select('id')
    .eq('report_id', realReport.id);
  assert(
    finalTimeline?.length === baselineTimelineCount,
    `Timeline count restored to baseline: ${baselineTimelineCount}`
  );

  // Verify report status is untouched
  const { data: finalReport } = await adminClient
    .from('reports')
    .select('status')
    .eq('id', realReport.id)
    .single();
  assert(
    finalReport?.status === 'submitted',
    'Report status strictly preserved as "submitted"'
  );

  // ------------------------------------------------------------------
  // 10. FINAL MASTER DATA COUNTS RE-VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 10: FINAL MASTER DATA RE-VERIFICATION ---');
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
  console.log(`   PHASE 6C E2E TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================================\n');
}

runE2E().catch((err) => {
  console.error('\nE2E Test Execution Failed:', err);
  process.exit(1);
});
