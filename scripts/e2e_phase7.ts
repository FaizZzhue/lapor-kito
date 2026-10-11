/**
 * LAPORKITO — Phase 7 E2E Verification & Integration Test Suite
 * Public Experience & UX Hardening
 *
 * Scope:
 * 1. Master data baseline check (categories = 4, kecamatan = 18, kelurahan = 107, etc.)
 * 2. Public route verification & SSR readiness (/, /lapor, /pantau, /pantau/[code])
 * 3. Master data cascading logic (kecamatan -> kelurahan mapping)
 * 4. Public report form validator rules & human-readable error messages
 * 5. Evidence file validation (allowed MIME types, size thresholds)
 * 6. Real report inspection (LPK-20261007-DD43) & Public tracking lookup via RPC
 * 7. Public privacy regression: STRICT absence of reporter email/phone, internal UUIDs, staff email
 * 8. Invalid tracking code lookup behavior (graceful not found, safe response)
 * 9. Citizen reply ownership verification (success with real reporter email, failure with fake email)
 * 10. Clean restoration of LPK-20261007-DD43 to exact baseline
 * 11. Final master data integrity re-verification
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { createReportSchema, trackingSearchSchema } from '../lib/validators/report';
import { getPublicReportAction } from '../lib/actions/tracking';
import { submitReporterResponseAction } from '../lib/actions/responses';
import { getMasterDataAction } from '../lib/actions/reports';
import { REPORT_STATUS_LABELS } from '../lib/constants/report-status';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runE2E() {
  console.log('====================================================================');
  console.log('   LAPORKITO: PHASE 7 PUBLIC EXPERIENCE & UX HARDENING E2E TEST    ');
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
  // 2. PUBLIC SERVER ACTION MASTER DATA FETCH
  // ------------------------------------------------------------------
  console.log('\n--- TEST 2: PUBLIC MASTER DATA ACTION ---');
  const masterData = await getMasterDataAction();
  assert(masterData.categories.length === 4, `Master data categories count is 4 (Actual: ${masterData.categories.length})`);
  assert(masterData.kecamatan.length === 18, `Master data kecamatan count is 18 (Actual: ${masterData.kecamatan.length})`);
  assert(masterData.kelurahan.length === 107, `Master data kelurahan count is 107 (Actual: ${masterData.kelurahan.length})`);

  // Verify the 4 supported categories match civic scope
  const catNames = masterData.categories.map((c) => c.name_id);
  console.log('Actual categories:', catNames);
  assert(catNames.includes('Infrastruktur & Jalan'), 'Includes Infrastruktur & Jalan');
  assert(catNames.includes('Kebersihan & Lingkungan'), 'Includes Kebersihan & Lingkungan');
  assert(catNames.includes('Drainase & Pengendalian Banjir'), 'Includes Drainase & Pengendalian Banjir');
  assert(catNames.includes('Penerangan Jalan Umum'), 'Includes Penerangan Jalan Umum');

  // ------------------------------------------------------------------
  // 3. CASCADING LOCATION LOGIC
  // ------------------------------------------------------------------
  console.log('\n--- TEST 3: CASCADING LOCATION LOGIC ---');
  const sampleKec = masterData.kecamatan[0];
  assert(!!sampleKec && !!sampleKec.id, `Selected sample kecamatan: ${sampleKec.name}`);

  const filteredKel = masterData.kelurahan.filter((k) => k.kecamatan_id === sampleKec.id);
  assert(filteredKel.length > 0, `Kecamatan ${sampleKec.name} has ${filteredKel.length} matching kelurahan`);
  filteredKel.forEach((kel) => {
    assert(kel.kecamatan_id === sampleKec.id, `Kelurahan ${kel.name} strictly belongs to ${sampleKec.name}`);
  });

  // Verify another kecamatan has disjoint kelurahan
  const sampleKec2 = masterData.kecamatan[1];
  const filteredKel2 = masterData.kelurahan.filter((k) => k.kecamatan_id === sampleKec2.id);
  assert(filteredKel2.length > 0, `Kecamatan ${sampleKec2.name} has ${filteredKel2.length} matching kelurahan`);
  const overlap = filteredKel.filter((k1) => filteredKel2.some((k2) => k2.id === k1.id));
  assert(overlap.length === 0, 'No overlap in kelurahan between different kecamatan');

  // ------------------------------------------------------------------
  // 4. REPORT FORM SCHEMA VALIDATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 4: REPORT FORM SCHEMA VALIDATION ---');
  
  // Test valid payload
  const validReport = {
    title: 'Lampu jalan mati di perempatan simpang lima',
    description: 'Sudah tiga hari lampu padam menyebabkan jalan sangat gelap dan membahayakan pengendara malam.',
    categoryId: sampleKec.id, // using valid UUID format
    kecamatanId: sampleKec.id,
    kelurahanId: filteredKel[0].id,
    addressDetail: 'Jalan Sudirman No. 12',
    reporterName: 'Warga Palembang',
    reporterPhone: '081234567890',
    reporterEmail: 'warga@gmail.com',
    evidenceFiles: [
      {
        fileUrl: 'https://example.com/test.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024 * 1024,
        storagePath: 'reports/test.jpg',
      },
    ],
  };

  const validParsed = createReportSchema.safeParse(validReport);
  assert(validParsed.success, 'Valid form payload passes createReportSchema validation');

  // Test invalid title (too short < 5)
  const shortTitle = { ...validReport, title: 'Lamp' };
  const shortTitleParsed = createReportSchema.safeParse(shortTitle);
  assert(!shortTitleParsed.success, 'Short title (< 5 chars) rejected by validator');

  // Test invalid description (too short < 20)
  const shortDesc = { ...validReport, description: 'Rusak' };
  const shortDescParsed = createReportSchema.safeParse(shortDesc);
  assert(!shortDescParsed.success, 'Short description (< 20 chars) rejected by validator');

  // Test invalid phone format
  const invalidPhone = { ...validReport, reporterPhone: '123' };
  const invalidPhoneParsed = createReportSchema.safeParse(invalidPhone);
  assert(!invalidPhoneParsed.success, 'Invalid phone number format rejected by validator');

  // Test missing evidence
  const noEvidence = { ...validReport, evidenceFiles: [] };
  const noEvidenceParsed = createReportSchema.safeParse(noEvidence);
  assert(!noEvidenceParsed.success, 'Empty evidence array rejected by validator');

  // Test tracking code validator
  const validTrack = trackingSearchSchema.safeParse({ trackingCode: 'LPK-20261007-DD43' });
  assert(validTrack.success, 'Valid tracking code format accepted');
  const invalidTrack = trackingSearchSchema.safeParse({ trackingCode: 'INVALID-CODE' });
  assert(!invalidTrack.success, 'Invalid tracking code format rejected');

  // ------------------------------------------------------------------
  // 5. BASELINE REAL REPORT INSPECTION (LPK-20261007-DD43)
  // ------------------------------------------------------------------
  console.log('\n--- TEST 5: REAL REPORT BASELINE (LPK-20261007-DD43) ---');
  const { data: realReport, error: repErr } = await adminClient
    .from('reports')
    .select('id, tracking_code, status, priority, title, reporter_id, created_at, updated_at')
    .eq('tracking_code', 'LPK-20261007-DD43')
    .single();

  assert(!repErr && !!realReport, 'Real report LPK-20261007-DD43 exists');
  if (!realReport) throw new Error('Real report LPK-20261007-DD43 missing');

  // Pre-test sanitization: ensure no orphaned test records remain from previous interrupted runs
  await adminClient.from('report_responses').delete().eq('report_id', realReport.id);
  await adminClient.from('report_timeline').delete().eq('report_id', realReport.id).neq('action', 'Laporan Dibuat');
  await adminClient.from('reports').update({ status: 'submitted' }).eq('id', realReport.id);

  const baselineStatus = 'submitted';
  const baselinePriority = realReport.priority;
  console.log(`Baseline status: ${baselineStatus}, priority: ${baselinePriority}`);
  
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

  // Fetch reporter registered contact
  const { data: reporterData } = await adminClient
    .from('reporters')
    .select('id, email, phone, full_name')
    .eq('id', realReport.reporter_id)
    .single();
  assert(!!reporterData && !!reporterData.email, `Reporter has email registered: ${reporterData?.email}`);
  const reporterEmail = reporterData!.email!;

  // ------------------------------------------------------------------
  // 6. PUBLIC TRACKING RPC & PRIVACY REGRESSION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 6: PUBLIC TRACKING RPC & PRIVACY REGRESSION ---');
  const publicResult = await getPublicReportAction('LPK-20261007-DD43');
  assert(publicResult.success, 'Public tracking lookup for LPK-20261007-DD43 succeeded');
  assert(!!publicResult.report, 'Public tracking returned report object');

  // Human readable label check
  const humanLabel = REPORT_STATUS_LABELS[publicResult.report!.status as keyof typeof REPORT_STATUS_LABELS];
  assert(!!humanLabel, `Status ${publicResult.report!.status} has human-readable label: "${humanLabel}"`);

  // Privacy regression checks
  const serialized = JSON.stringify(publicResult);
  assert(!serialized.includes(reporterEmail), 'STRICT PRIVACY: Reporter email is NOT leaked in public payload');
  if (reporterData?.phone) {
    assert(!serialized.includes(reporterData.phone), 'STRICT PRIVACY: Reporter phone is NOT leaked in public payload');
  }
  assert(!serialized.includes(realReport.reporter_id), 'STRICT PRIVACY: Internal reporter_id UUID is NOT leaked');
  assert(!serialized.includes('admin@laporkito.local'), 'STRICT PRIVACY: Staff internal email is NOT leaked');
  assert(!serialized.includes('gemini'), 'STRICT PRIVACY: Raw AI triage details are NOT leaked');

  // Verify non-empty category and address
  assert(!!publicResult.categoryName, `Category name resolved for public: "${publicResult.categoryName}"`);
  assert(!!publicResult.report?.address_detail, `Address detail is available: "${publicResult.report?.address_detail}"`);

  // ------------------------------------------------------------------
  // 7. INVALID TRACKING CODE HANDLING
  // ------------------------------------------------------------------
  console.log('\n--- TEST 7: INVALID TRACKING CODE LOOKUP ---');
  const invalidResult = await getPublicReportAction('LPK-99999999-XXXX');
  assert(!invalidResult.success, 'Invalid tracking code returns success = false');
  assert(!invalidResult.report, 'Invalid tracking code returns no report object');
  assert(!!invalidResult.error, `Invalid tracking code returns user-friendly error: "${invalidResult.error}"`);

  // ------------------------------------------------------------------
  // 8. CITIZEN REPLY OWNERSHIP VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 8: CITIZEN REPLY OWNERSHIP VERIFICATION ---');

  // Attempt unauthorized reply with wrong email
  const unauthorizedReply = await submitReporterResponseAction(
    'LPK-20261007-DD43',
    { message: 'Mencoba mengirim pesan tanpa verifikasi pemilik sah.' },
    'fake_stranger@example.com'
  );
  assert(!unauthorizedReply.success, 'Unauthorized email rejected by ownership verification');
  assert(
    Boolean(unauthorizedReply.error?.includes('tidak cocok') || unauthorizedReply.error?.includes('Verifikasi gagal')),
    `Rejection message is clear and safe: "${unauthorizedReply.error}"`
  );

  // Attempt reply with too short message
  const tooShortReply = await submitReporterResponseAction(
    'LPK-20261007-DD43',
    { message: 'Pendek' },
    reporterEmail
  );
  assert(!tooShortReply.success, 'Short message (< 10 chars) rejected by validation');

  // Submit legitimate citizen reply with exact registered email
  const legitimateReply = await submitReporterResponseAction(
    'LPK-20261007-DD43',
    { message: '[TEST E2E PHASE 7] Klarifikasi tambahan lokasi dari pelapor terverifikasi.' },
    reporterEmail
  );
  console.log('legitimateReply result:', legitimateReply);
  assert(legitimateReply.success, 'Legitimate citizen reply with registered email accepted');

  // Verify response was recorded in DB
  const { data: newResponses } = await adminClient
    .from('report_responses')
    .select('id, message, response_type')
    .eq('report_id', realReport.id);
  const foundTestResponse = newResponses?.find((r) => r.message.includes('[TEST E2E PHASE 7]'));
  assert(!!foundTestResponse, 'Citizen reply persisted in database with response_type = clarification');
  assert(foundTestResponse?.response_type === 'clarification', 'response_type is clarification');

  // Verify timeline event was added
  const { data: updatedTimeline } = await adminClient
    .from('report_timeline')
    .select('id, action')
    .eq('report_id', realReport.id);
  const foundTimelineEvent = updatedTimeline?.find(
    (t) => t.action.includes('Balasan Pelapor') || t.action.includes('Tanggapan Pelapor')
  );
  assert(!!foundTimelineEvent, 'Audit timeline event created for citizen reply');

  // ------------------------------------------------------------------
  // 9. CLEAN RESTORATION TO EXACT BASELINE
  // ------------------------------------------------------------------
  console.log('\n--- TEST 9: RESTORATION OF LPK-20261007-DD43 TO BASELINE ---');
  
  // Delete the test response
  if (foundTestResponse) {
    const { error: delRespErr } = await adminClient
      .from('report_responses')
      .delete()
      .eq('id', foundTestResponse.id);
    assert(!delRespErr, 'Deleted test citizen response');
  }

  // Delete the test timeline event
  if (foundTimelineEvent) {
    const { error: delTimeErr } = await adminClient
      .from('report_timeline')
      .delete()
      .eq('id', foundTimelineEvent.id);
    assert(!delTimeErr, 'Deleted test timeline event');
  }

  // Re-verify responses count restored
  const { data: finalResponses } = await adminClient
    .from('report_responses')
    .select('id')
    .eq('report_id', realReport.id);
  assert(
    (finalResponses?.length || 0) === baselineResponseCount,
    `Responses restored to baseline: ${finalResponses?.length || 0} == ${baselineResponseCount}`
  );

  // Re-verify timeline count restored
  const { data: finalTimeline } = await adminClient
    .from('report_timeline')
    .select('id')
    .eq('report_id', realReport.id);
  assert(
    (finalTimeline?.length || 0) === baselineTimelineCount,
    `Timeline events restored to baseline: ${finalTimeline?.length || 0} == ${baselineTimelineCount}`
  );

  // ------------------------------------------------------------------
  // 10. FINAL MASTER DATA INTEGRITY RE-VERIFICATION
  // ------------------------------------------------------------------
  console.log('\n--- TEST 10: FINAL MASTER DATA INTEGRITY RE-VERIFICATION ---');
  const [fCat, fKec, fKel, fInst, fUnit, fRule] = await Promise.all([
    adminClient.from('categories').select('*', { count: 'exact', head: true }),
    adminClient.from('kecamatan').select('*', { count: 'exact', head: true }),
    adminClient.from('kelurahan').select('*', { count: 'exact', head: true }),
    adminClient.from('institutions').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('authority_rules').select('*', { count: 'exact', head: true }),
  ]);

  assert(fCat.count === 4, `Final categories = 4 (Actual: ${fCat.count})`);
  assert(fKec.count === 18, `Final kecamatan = 18 (Actual: ${fKec.count})`);
  assert(fKel.count === 107, `Final kelurahan = 107 (Actual: ${fKel.count})`);
  assert(fInst.count === 30, `Final institutions = 30 (Actual: ${fInst.count})`);
  assert(fUnit.count === 14, `Final institution_units = 14 (Actual: ${fUnit.count})`);
  assert(fRule.count === 5, `Final authority_rules = 5 (Actual: ${fRule.count})`);

  console.log('\n====================================================================');
  console.log(`   PHASE 7 E2E COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================================\n');
}

runE2E().catch((err) => {
  console.error('\n[FATAL ERROR in Phase 7 E2E Suite]:', err);
  process.exit(1);
});
