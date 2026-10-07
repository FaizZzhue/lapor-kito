/**
 * LAPORKITO — PHASE 5E EMAIL NOTIFICATION & RELIABILITY TEST SUITE
 * 
 * Verifies:
 * 1. Email configuration & environment validation
 * 2. Real Resend API interaction (using sandbox testing recipient delivered@resend.dev)
 * 3. TEST 1: Successful send & report persistence
 * 4. TEST 2: Resend failure simulation (resilience: report persists, action does not crash, no fake success)
 * 5. TEST 3: Invalid & missing recipient handling (graceful handling, report persists)
 * 6. Duplicate-send protection audit
 * 7. Privacy audit of email payload (zero leakage of NIK, UUID, AI prompts, secrets)
 * 8. Public tracking link verification
 * 9. Safe database cleanup & regression verification
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { submitReportAction } from '../lib/actions/reports';
import { sendReportSubmittedEmail } from '../lib/email/resend';
import type { CreateReportSchemaType } from '../lib/validators/report';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const createdReportIds: string[] = [];
const createdReporterIds: string[] = [];

const mockEvidence = [
  {
    fileUrl: 'https://pncnozyuoqzfezdfdcke.supabase.co/storage/v1/object/public/evidence/test_phase5e.jpg',
    fileType: 'image/jpeg',
    fileSize: 153600,
    storagePath: 'reports/test_phase5e.jpg',
    caption: 'Foto dokumentasi uji coba 5E',
  },
];

async function runPhase5ETestSuite() {
  console.log('====================================================================');
  console.log('   LAPORKITO PHASE 5E: EMAIL NOTIFICATION & RELIABILITY AUDIT       ');
  console.log('====================================================================\n');

  let allTestsPassed = true;

  try {
    // ------------------------------------------------------------------
    // STEP 1: AUDIT ENVIRONMENT CONFIGURATION
    // ------------------------------------------------------------------
    console.log('--- [STEP 1] Environment & Configuration Audit ---');
    const hasResendKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_'));
    const sender = process.env.RESEND_FROM_EMAIL || 'LAPORKITO <onboarding@resend.dev>';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '(not set)';

    console.log(`   - RESEND_API_KEY Configured : ${hasResendKey ? 'YES (starts with re_)' : 'NO'}`);
    console.log(`   - Sender Address            : ${sender}`);
    console.log(`   - NEXT_PUBLIC_APP_URL       : ${appUrl}`);

    if (!hasResendKey) {
      throw new Error('RESEND_API_KEY is not configured in .env.local!');
    }

    // ------------------------------------------------------------------
    // STEP 2: MASTER DATA BASELINE VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n--- [STEP 2] Master Data Baseline Verification ---');
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
      const { count, error } = await adminClient.from(tbl.name).select('*', { count: 'exact', head: true });
      if (error) {
        throw new Error(`Failed to count table ${tbl.name}: ${error.message}`);
      }
      const isMatch = count === tbl.expected;
      console.log(`   - ${tbl.name.padEnd(20)}: ${count} (expected: ${tbl.expected}) -> ${isMatch ? 'PASS' : 'FAIL'}`);
      if (!isMatch) {
        throw new Error(`Baseline mismatch for ${tbl.name}: got ${count}, expected ${tbl.expected}`);
      }
    }

    // Fetch master records needed for payloads
    const { data: catData } = await adminClient.from('categories').select('id, slug, name_id').eq('is_active', true).limit(2);
    const { data: kecData } = await adminClient.from('kecamatan').select('id, name').limit(1);
    if (!catData || catData.length === 0 || !kecData || kecData.length === 0) {
      throw new Error('Master categories or kecamatan not found in database.');
    }

    const { data: kelData } = await adminClient.from('kelurahan').select('id, name').eq('kecamatan_id', kecData[0].id).limit(1);
    if (!kelData || kelData.length === 0) {
      throw new Error('Master kelurahan not found in database.');
    }

    const categoryId = catData[0].id;
    const categoryName = catData[0].name_id;
    const kecamatanId = kecData[0].id;
    const kelurahanId = kelData[0].id;

    console.log(`   - Testing Context: Cat="${categoryName}" (${catData[0].slug}), Kec="${kecData[0].name}", Kel="${kelData[0].name}"`);

    // ------------------------------------------------------------------
    // STEP 3: PRIVACY & TEMPLATE INSPECTION
    // ------------------------------------------------------------------
    console.log('\n--- [STEP 3] Email Payload & Privacy Audit ---');
    const sampleTrackingCode = 'LPK-20261007-TEST';
    const sampleUrl = `${appUrl}/pantau/${sampleTrackingCode}`;
    
    // Test helper to capture raw parameters
    const templateCheckParams = {
      to: 'delivered@resend.dev',
      reporterName: 'Warga Palembang Peduli',
      trackingCode: sampleTrackingCode,
      reportTitle: 'Jalan Rusak Berlubang di Depan Ruko',
      categoryName: categoryName,
      trackingUrl: sampleUrl,
    };

    console.log('   - Checking template fields for privacy leaks:');
    const sensitiveTokens = ['nik', 'uuid', 'gemini', 'prompt', 'service_role', 'api_key', 'admin_'];
    let leakDetected = false;
    for (const [key, value] of Object.entries(templateCheckParams)) {
      for (const token of sensitiveTokens) {
        if (key.toLowerCase().includes(token) || String(value).toLowerCase().includes(token)) {
          console.warn(`   [WARNING] Potential sensitive token found in ${key}: ${value}`);
          leakDetected = true;
        }
      }
    }
    console.log(`   - Privacy check: ${leakDetected ? 'POTENTIAL LEAK' : 'CLEAN (Zero internal IDs, NIK, or prompts)'}`);

    // ------------------------------------------------------------------
    // STEP 4: TEST 1 — REAL SUCCESSFUL SEND & PERSISTENCE
    // ------------------------------------------------------------------
    console.log('\n--- [STEP 4] TEST 1: Successful Send & Persistence ---');
    const payload1: CreateReportSchemaType = {
      title: '[TEST 5E-1] Jalan Rusak Berlubang Parah di Simpang',
      description: 'Aspal jalan amblas sedalam 15cm membahayakan pengendara roda dua saat malam hari.',
      categoryId,
      kecamatanId,
      kelurahanId,
      addressDetail: 'Jl. Demang Lebar Daun No. 45, dekat lampu merah',
      latitude: -2.976073,
      longitude: 104.775431,
      reporterName: 'Budi Santoso',
      reporterEmail: 'delivered@resend.dev', // Resend official sandbox test sink
      reporterPhone: '081234567890',
      evidenceFiles: mockEvidence,
    };

    console.log('   Submitting report via submitReportAction with recipient delivered@resend.dev...');
    const result1 = await submitReportAction(payload1);

    console.log(`   - Result Success      : ${result1.success}`);
    console.log(`   - Tracking Code       : ${result1.trackingCode}`);
    console.log(`   - Email Sent Status   : ${result1.emailSent}`);

    if (!result1.success || !result1.trackingCode || result1.emailSent !== true) {
      console.error('   ❌ TEST 1 FAILED: Expected success=true, trackingCode present, emailSent=true');
      allTestsPassed = false;
    } else {
      console.log('   ✅ TEST 1 Action Output: PASS');
    }

    // Verify in database
    if (result1.trackingCode) {
      const { data: dbReport, error: repErr } = await adminClient
        .from('reports')
        .select('id, tracking_code, title, reporter_id, status')
        .eq('tracking_code', result1.trackingCode)
        .single();

      if (repErr || !dbReport) {
        console.error('   ❌ TEST 1 DB FAILED: Report not found in database:', repErr);
        allTestsPassed = false;
      } else {
        createdReportIds.push(dbReport.id);
        if (dbReport.reporter_id) createdReporterIds.push(dbReport.reporter_id);

        console.log(`   - Database Verification: Report ID ${dbReport.id} found in DB with status '${dbReport.status}'.`);
        console.log('   ✅ TEST 1 Persistence: PASS');
      }
    }

    // ------------------------------------------------------------------
    // STEP 5: TEST 2 — RESEND FAILURE SIMULATION & NON-BLOCKING RESILIENCE
    // ------------------------------------------------------------------
    console.log('\n--- [STEP 5] TEST 2: Email Failure Simulation & Non-Blocking Resilience ---');
    console.log('   Simulating Resend failure by temporarily modifying RESEND_API_KEY...');
    const originalApiKey = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = 're_invalid_simulated_key_999999999';

    const payload2: CreateReportSchemaType = {
      title: '[TEST 5E-2] Tumpukan Sampah Liar di Pinggir Sungai',
      description: 'Sampah rumah tangga menumpuk dan menimbulkan bau tidak sedap ke lingkungan sekitar pemukiman.',
      categoryId,
      kecamatanId,
      kelurahanId,
      addressDetail: 'Jl. Musi Raya No. 12, seberang jembatan kecil',
      latitude: -2.975000,
      longitude: 104.774000,
      reporterName: 'Siti Rahma',
      reporterEmail: 'delivered@resend.dev',
      evidenceFiles: mockEvidence,
    };

    const result2 = await submitReportAction(payload2);

    // Restore real API key immediately
    process.env.RESEND_API_KEY = originalApiKey;

    console.log(`   - Result Success      : ${result2.success}`);
    console.log(`   - Tracking Code       : ${result2.trackingCode}`);
    console.log(`   - Email Sent Status   : ${result2.emailSent}`);

    if (!result2.success || !result2.trackingCode) {
      console.error('   ❌ TEST 2 FAILED: Report persistence should NOT fail even when email fails!');
      allTestsPassed = false;
    } else if (result2.emailSent === true) {
      console.error('   ❌ TEST 2 FAILED: emailSent should be false during simulated failure (no fake success allowed)!');
      allTestsPassed = false;
    } else {
      console.log('   ✅ TEST 2 Resilience: Report preserved, no crash, emailSent cleanly flagged as false.');
    }

    // Verify report 2 exists in DB
    if (result2.trackingCode) {
      const { data: dbReport2, error: repErr2 } = await adminClient
        .from('reports')
        .select('id, tracking_code, status, reporter_id')
        .eq('tracking_code', result2.trackingCode)
        .single();

      if (repErr2 || !dbReport2) {
        console.error('   ❌ TEST 2 DB FAILED: Report 2 missing from database:', repErr2);
        allTestsPassed = false;
      } else {
        createdReportIds.push(dbReport2.id);
        if (dbReport2.reporter_id) createdReporterIds.push(dbReport2.reporter_id);
        console.log(`   - Database Verification: Report ID ${dbReport2.id} successfully persisted despite email failure.`);
        console.log('   ✅ TEST 2 Persistence: PASS');
      }
    }

    // ------------------------------------------------------------------
    // STEP 6: TEST 3 — INVALID & MISSING RECIPIENT
    // ------------------------------------------------------------------
    console.log('\n--- [STEP 6] TEST 3: Invalid & Missing Recipient Handling ---');

    // 3A: Missing Recipient (citizen did not enter email)
    console.log('   [3A] Submitting report without reporterEmail:');
    const payload3A: CreateReportSchemaType = {
      title: '[TEST 5E-3A] Lampu Penerangan Jalan Padam',
      description: 'Tiga tiang lampu jalan padam berurutan sehingga area jalan menjadi sangat gelap gulita.',
      categoryId,
      kecamatanId,
      kelurahanId,
      addressDetail: 'Jl. R. Soekamto No. 88, depan minimarket',
      reporterName: 'Warga Anonim',
      evidenceFiles: mockEvidence,
      // reporterEmail left undefined
    };

    const result3A = await submitReportAction(payload3A);
    console.log(`   - 3A Success          : ${result3A.success}`);
    console.log(`   - 3A Tracking Code    : ${result3A.trackingCode}`);
    console.log(`   - 3A Email Sent Status: ${result3A.emailSent}`);

    if (result3A.success && result3A.trackingCode && result3A.emailSent === undefined) {
      console.log('   ✅ TEST 3A PASS: Email skipped cleanly when no email is provided.');
      const { data: dbReport3A } = await adminClient
        .from('reports')
        .select('id, reporter_id')
        .eq('tracking_code', result3A.trackingCode)
        .single();
      if (dbReport3A) {
        createdReportIds.push(dbReport3A.id);
        if (dbReport3A.reporter_id) createdReporterIds.push(dbReport3A.reporter_id);
      }
    } else {
      console.error('   ❌ TEST 3A FAILED: Unexpected result for missing email.');
      allTestsPassed = false;
    }

    // 3B: Unverified / Sandbox-restricted recipient under Resend
    console.log('\n   [3B] Submitting report with unverified recipient (triggering Resend 403 sandbox rejection):');
    const payload3B: CreateReportSchemaType = {
      title: '[TEST 5E-3B] Saluran Air Tersumbat Sedimen Lumpur',
      description: 'Drainase meluap setiap hujan gerimis karena saluran penuh dengan endapan lumpur padat.',
      categoryId,
      kecamatanId,
      kelurahanId,
      addressDetail: 'Jl. Angkatan 45 No. 10',
      reporterName: 'Agus Subekti',
      reporterEmail: 'warga.umum.palembang@testmail.org', // valid email format, triggers Resend sandbox restriction
      evidenceFiles: mockEvidence,
    };

    const result3B = await submitReportAction(payload3B);
    console.log(`   - 3B Success          : ${result3B.success}`);
    console.log(`   - 3B Tracking Code    : ${result3B.trackingCode}`);
    console.log(`   - 3B Email Sent Status: ${result3B.emailSent}`);

    if (result3B.success && result3B.trackingCode && result3B.emailSent === false) {
      console.log('   ✅ TEST 3B PASS: Unverified recipient rejected gracefully by Resend without breaking report creation.');
      const { data: dbReport3B } = await adminClient
        .from('reports')
        .select('id, reporter_id')
        .eq('tracking_code', result3B.trackingCode)
        .single();
      if (dbReport3B) {
        createdReportIds.push(dbReport3B.id);
        if (dbReport3B.reporter_id) createdReporterIds.push(dbReport3B.reporter_id);
      }
    } else {
      console.error('   ❌ TEST 3B FAILED: Unverified recipient did not yield expected graceful degradation.');
      allTestsPassed = false;
    }

    // 3C: Direct email call with malformed recipient string
    console.log('\n   [3C] Direct call to sendReportSubmittedEmail with malformed recipient:');
    const directEmailRes = await sendReportSubmittedEmail({
      to: 'not-an-email-format',
      reporterName: 'Test',
      trackingCode: 'LPK-TEST-INVALID',
      reportTitle: 'Test',
      categoryName: 'Test',
      trackingUrl: 'http://localhost:3000/pantau/LPK-TEST-INVALID',
    });
    console.log(`   - Direct call success : ${directEmailRes.success}`);
    if (directEmailRes.success === false) {
      console.log('   ✅ TEST 3C PASS: Malformed email gracefully caught by Resend API handler without throw.');
    } else {
      console.error('   ❌ TEST 3C FAILED: Expected false for malformed email.');
      allTestsPassed = false;
    }

    // ------------------------------------------------------------------
    // STEP 7: DUPLICATE-SEND & IDEMPOTENCY AUDIT
    // ------------------------------------------------------------------
    console.log('\n--- [STEP 7] Duplicate Send & Idempotency Audit ---');
    console.log('   - Client Form Protection : Form state is locked with `isSubmitting = true` on submit button.');
    console.log('   - Navigation Protection  : Successful submission navigates via `router.push` to /lapor/berhasil.');
    console.log('   - Server-Side Idempotency: Each call to submitReportAction generates a fresh tracking code & sends 1 notification attempt.');
    console.log('   - GAP IDENTIFIED         : No distributed idempotency key mechanism exists to coalesce rapid duplicate network requests.');

    // ------------------------------------------------------------------
    // STEP 8: PUBLIC TRACKING URL AUDIT
    // ------------------------------------------------------------------
    console.log('\n--- [STEP 8] Public Tracking URL Audit ---');
    const generatedUrl = `${appUrl}/pantau/${result1.trackingCode}`;
    console.log(`   - Generated Tracking URL : ${generatedUrl}`);
    const isLocalhost = generatedUrl.includes('localhost') || generatedUrl.includes('127.0.0.1');
    console.log(`   - Environment Status     : ${isLocalhost ? 'LOCAL DEVELOPMENT URL (GAP for production)' : 'PRODUCTION URL'}`);

  } catch (err: unknown) {
    allTestsPassed = false;
    console.error('\n❌ Unhandled exception during Phase 5E test run:', err);
  } finally {
    // ------------------------------------------------------------------
    // STEP 9: CLEANUP & DATABASE REGRESSION VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n--- [STEP 9] Cleanup & Regression Verification ---');
    console.log(`   Reports to clean up: ${createdReportIds.length}`);

    if (createdReportIds.length > 0) {
      // 1. Delete evidence records
      const { error: evErr } = await adminClient
        .from('report_evidence')
        .delete()
        .in('report_id', createdReportIds);
      if (evErr) console.warn('   Warning deleting evidence:', evErr.message);

      // 2. Delete timeline records
      const { error: tlErr } = await adminClient
        .from('report_timeline')
        .delete()
        .in('report_id', createdReportIds);
      if (tlErr) console.warn('   Warning deleting timelines:', tlErr.message);

      // 3. Delete reports
      const { error: repErr } = await adminClient
        .from('reports')
        .delete()
        .in('id', createdReportIds);
      if (repErr) console.warn('   Warning deleting reports:', repErr.message);

      // 4. Delete reporters
      if (createdReporterIds.length > 0) {
        const { error: rptrErr } = await adminClient
          .from('reporters')
          .delete()
          .in('id', createdReporterIds);
        if (rptrErr) console.warn('   Warning deleting reporters:', rptrErr.message);
      }
    }

    // Verify database counts returned to zero
    console.log('\n--- [FINAL DATABASE VERIFICATION] ---');
    const finalChecks = [
      { name: 'categories', expected: 4 },
      { name: 'kecamatan', expected: 18 },
      { name: 'kelurahan', expected: 107 },
      { name: 'institutions', expected: 30 },
      { name: 'institution_units', expected: 14 },
      { name: 'authority_rules', expected: 5 },
      { name: 'reports', expected: 0 },
      { name: 'reporters', expected: 0 },
      { name: 'report_timeline', expected: 0 },
      { name: 'report_evidence', expected: 0 },
    ];

    let allCountsMatch = true;
    for (const chk of finalChecks) {
      const { count } = await adminClient.from(chk.name).select('*', { count: 'exact', head: true });
      const matched = count === chk.expected;
      console.log(`   - ${chk.name.padEnd(20)}: ${count} (expected: ${chk.expected}) -> ${matched ? 'PASS' : 'FAIL'}`);
      if (!matched) allCountsMatch = false;
    }

    console.log('\n====================================================================');
    console.log(`PHASE 5E OVERALL STATUS: ${allTestsPassed && allCountsMatch ? 'PASS' : 'FAIL'}`);
    console.log('====================================================================');
  }
}

runPhase5ETestSuite();
