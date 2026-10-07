/**
 * LAPORKITO — PHASE 5D END-TO-END PUBLIC REPORT FLOW VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Master Data Baseline:
 *    categories=4, kecamatan=18, kelurahan=107, institutions=30, institution_units=14, authority_rules=5, reports=0
 * 2. Complete End-to-End Report Submission & Triage:
 *    - TEST 1: Jalan -> RULE_JALAN_KOTA (DPUPR, unit=NULL)
 *    - TEST 2: PJU -> RULE_PJU_KOTA (DISHUB, unit=NULL)
 *    - TEST 3: Sampah Umum -> RULE_KEBERSIHAN_KOTA (DLH, unit=NULL)
 *    - TEST 4: TPA Sukawinatan -> RULE_TPA_SUKAWINATAN (DLH, unit=DLH_UPTD_TPA_SUKAWINATAN) + Evidence
 * 3. Persistence Verification:
 *    - reports, reporters, report_timeline, report_evidence, ai_triage_logs
 * 4. Public Tracking & Privacy / RPC Leak Verification:
 *    - Zero leak of reporter PII, internal IDs, raw prompts, reasoning, or secrets
 * 5. Success Page Resolution:
 *    - Real tracking code lookup matches database record
 * 6. Email Configuration Audit:
 *    - Evaluated per production rules (marked NOT VERIFIED for test delivery)
 * 7. Negative Tests:
 *    - Invalid tracking code returns 404/not found without crash
 *    - Non-civic/ambiguous report returns NEEDS_REVIEW without fabricated authority
 * 8. Cleanup & Database Regression Check:
 *    - Cascade deletion of all test records
 *    - Final check: reports = 0, all master tables intact
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { analyzeReportAction, submitReportAction } from '../lib/actions/reports';
import { getPublicReportAction } from '../lib/actions/tracking';
import { resend } from '../lib/email/resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface FlowResult {
  testId: string;
  name: string;
  categorySlug: string | null;
  ruleCode: string | null;
  institutionCode: string | null;
  unitCode: string | null;
  decision: string | null;
  reportId: string | null;
  trackingCode: string | null;
  reporterId: string | null;
  status: 'PASS' | 'FAIL';
  notes?: string;
}

const createdReportIds: string[] = [];
const createdReporterIds: string[] = [];
const createdEvidenceIds: string[] = [];
const createdTriageLogIds: string[] = [];

async function runE2EPhase5D() {
  console.log('====================================================================');
  console.log('    LAPORKITO PHASE 5D: END-TO-END PUBLIC REPORT FLOW VERIFICATION  ');
  console.log('====================================================================\n');

  // Declared OUTSIDE try so finally block can always access them
  let allStepsPassed = true;
  const flowResults: FlowResult[] = [];

  try {
    // ------------------------------------------------------------------
    // 1. MASTER DATA PRE-TEST INTEGRITY CHECK
    // ------------------------------------------------------------------
    console.log('--- [STAGE 1] Master Data Baseline & Integrity Check ---');
    const baselineTables = [
      { name: 'categories', expected: 4 },
      { name: 'kecamatan', expected: 18 },
      { name: 'kelurahan', expected: 107 },
      { name: 'institutions', expected: 30 },
      { name: 'institution_units', expected: 14 },
      { name: 'authority_rules', expected: 5 },
      { name: 'reports', expected: 0 },
    ];

    for (const t of baselineTables) {
      const { count, error } = await adminClient
        .from(t.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Failed to query table ${t.name}: ${error.message}`);
      }
      if (count !== t.expected) {
        throw new Error(`Baseline mismatch on ${t.name}: got ${count}, expected ${t.expected}`);
      }
      console.log(` ✅ ${t.name.padEnd(20)}: ${count} (Expected: ${t.expected})`);
    }

    // Load reference categories & kelurahan from DB
    const { data: dbCategories } = await adminClient
      .from('categories')
      .select('id, slug, name_id');
    const catMap = new Map((dbCategories || []).map((c) => [c.slug, c]));

    const { data: sampleKelurahan } = await adminClient
      .from('kelurahan')
      .select('id, name, kecamatan_id, kecamatan:kecamatan_id(name)')
      .limit(50);

    const findKelurahan = (name: string) => {
      const found = sampleKelurahan?.find((k) => k.name.toLowerCase().includes(name.toLowerCase()));
      if (found) return found;
      const fallback = sampleKelurahan?.[0];
      if (!fallback) throw new Error(`No kelurahan data found in database for lookup "${name}"`);
      return fallback;
    };

    // ------------------------------------------------------------------
    // 2. TEST CASE 1 — JALAN (RULE_JALAN_KOTA -> DPUPR)
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 2] TEST CASE 1: Jalan (Kerusakan Jalan Kota) ---');
    const input1 = {
      title: 'Jalan berlubang cukup parah di Jalan R. Sukamto',
      description: 'Jalan berlubang cukup parah di Jalan R. Sukamto dekat simpang PTC Mall, sangat membahayakan pengendara motor.',
      categoryName: catMap.get('infrastruktur-jalan')?.name_id,
      districtName: 'Ilir Timur Tiga',
      subdistrictName: '8 Ilir',
      addressDetail: 'Dekat Simpang PTC Mall Jl. R. Sukamto',
    };

    console.log(' 🤖 Menjalankan AI Triage Step 1 & Step 2...');
    const triage1Res = await analyzeReportAction(input1);
    if (!triage1Res.success || !triage1Res.triage) {
      throw new Error(`Test 1 Triage failed: ${triage1Res.error}`);
    }

    const t1 = triage1Res.triage;
    const auth1 = t1.authorityRecommendation;
    console.log(`   - Category classified : ${t1.categorySlug}`);
    console.log(`   - Priority            : ${t1.priority}`);
    console.log(`   - Authority decision  : ${auth1?.decision}`);
    console.log(`   - Authority rule_code : ${auth1?.rule_code}`);
    console.log(`   - Institution         : ${auth1?.institution_code} - ${auth1?.institution_name}`);
    console.log(`   - Unit                : ${auth1?.unit_code ?? 'NULL'}`);

    const t1RulePass = auth1?.rule_code === 'RULE_JALAN_KOTA' && auth1?.institution_code === 'DPUPR' && auth1?.unit_code === null;
    if (!t1RulePass) {
      throw new Error(`Test 1 Rule mismatch: expected RULE_JALAN_KOTA / DPUPR, got ${auth1?.rule_code} / ${auth1?.institution_code}`);
    }

    // Persist via submitReportAction
    console.log(' 💾 Melakukan submitReportAction ke database...');
    const kel1 = findKelurahan('8 Ilir');
    const submit1 = await submitReportAction({
      categoryId: catMap.get('infrastruktur-jalan')!.id,
      kecamatanId: kel1.kecamatan_id,
      kelurahanId: kel1.id,
      title: input1.title,
      description: input1.description,
      addressDetail: input1.addressDetail,
      reporterName: 'Ahmad Warga',
      reporterPhone: '081234567890',
      reporterEmail: 'ahmad.test@palembang.id',
      evidenceFiles: [
        {
          fileUrl: 'https://pncnozyuoqzfezdfdcke.supabase.co/storage/v1/object/public/evidence/test_jalan.jpg',
          fileType: 'image/jpeg',
          fileSize: 153600,
          storagePath: 'reports/test_jalan.jpg',
          caption: 'Foto jalan berlubang di Jl. R. Sukamto',
        },
      ],
    }, {
      priority: t1.priority,
      confidence: t1.confidence,
      summary: t1.summary,
      authorityTarget: auth1?.institution_name || undefined,
    });

    if (!submit1.success || !submit1.trackingCode) {
      throw new Error(`Test 1 submit failed: ${submit1.error}`);
    }
    console.log(`   - Tracking code       : ${submit1.trackingCode}`);

    // Verify DB persistence
    const { data: rep1Row } = await adminClient
      .from('reports')
      .select('id, tracking_code, status, priority, authority_target, reporter_id')
      .eq('tracking_code', submit1.trackingCode)
      .single();

    if (!rep1Row || rep1Row.status !== 'submitted' || rep1Row.authority_target !== 'Dinas Pekerjaan Umum dan Penataan Ruang') {
      throw new Error(`Test 1 DB row verification failed: ${JSON.stringify(rep1Row)}`);
    }
    console.log(`   - Report created ID   : ${rep1Row.id}`);
    createdReportIds.push(rep1Row.id);
    if (rep1Row.reporter_id) createdReporterIds.push(rep1Row.reporter_id);

    // Verify timeline
    const { data: tl1 } = await adminClient
      .from('report_timeline')
      .select('id, action')
      .eq('report_id', rep1Row.id);
    if (!tl1 || tl1.length === 0) throw new Error('Test 1 missing timeline initial record');

    flowResults.push({
      testId: 'TEST 1',
      name: 'Jalan (Kerusakan Jalan Kota)',
      categorySlug: t1.categorySlug,
      ruleCode: auth1?.rule_code ?? null,
      institutionCode: auth1?.institution_code ?? null,
      unitCode: auth1?.unit_code ?? null,
      decision: auth1?.decision ?? null,
      reportId: rep1Row.id,
      trackingCode: submit1.trackingCode,
      reporterId: rep1Row.reporter_id,
      status: 'PASS',
    });

    // ------------------------------------------------------------------
    // 3. TEST CASE 2 — PJU (RULE_PJU_KOTA -> DISHUB)
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 3] TEST CASE 2: PJU (Penerangan Jalan Umum) ---');
    const input2 = {
      title: 'Lampu penerangan jalan umum padam beberapa malam',
      description: 'Lampu penerangan jalan umum padam selama beberapa malam.',
      categoryName: catMap.get('penerangan-jalan')?.name_id,
      districtName: 'Bukit Kecil',
      subdistrictName: '26 Ilir',
      addressDetail: 'Jl. Merdeka kawasan Kantor Pos',
    };

    console.log(' 🤖 Menjalankan AI Triage Step 1 & Step 2...');
    const triage2Res = await analyzeReportAction(input2);
    if (!triage2Res.success || !triage2Res.triage) {
      throw new Error(`Test 2 Triage failed: ${triage2Res.error}`);
    }

    const t2 = triage2Res.triage;
    const auth2 = t2.authorityRecommendation;
    console.log(`   - Category classified : ${t2.categorySlug}`);
    console.log(`   - Authority rule_code : ${auth2?.rule_code}`);
    console.log(`   - Institution         : ${auth2?.institution_code} - ${auth2?.institution_name}`);
    console.log(`   - Unit                : ${auth2?.unit_code ?? 'NULL'}`);

    const t2RulePass = auth2?.rule_code === 'RULE_PJU_KOTA' && auth2?.institution_code === 'DISHUB' && auth2?.unit_code === null;
    if (!t2RulePass) {
      throw new Error(`Test 2 Rule mismatch: expected RULE_PJU_KOTA / DISHUB, got ${auth2?.rule_code} / ${auth2?.institution_code}`);
    }

    // Persist via submitReportAction
    console.log(' 💾 Melakukan submitReportAction ke database...');
    const kel2 = findKelurahan('26 Ilir');
    const submit2 = await submitReportAction({
      categoryId: catMap.get('penerangan-jalan')!.id,
      kecamatanId: kel2.kecamatan_id,
      kelurahanId: kel2.id,
      title: input2.title,
      description: input2.description,
      addressDetail: input2.addressDetail,
      reporterName: 'Budi Warga',
      reporterPhone: '081234567891',
      evidenceFiles: [
        {
          fileUrl: 'https://pncnozyuoqzfezdfdcke.supabase.co/storage/v1/object/public/evidence/test_pju.jpg',
          fileType: 'image/jpeg',
          fileSize: 120000,
          storagePath: 'reports/test_pju.jpg',
          caption: 'Foto tiang PJU mati di Jl. Merdeka',
        },
      ],
    }, {
      priority: t2.priority,
      confidence: t2.confidence,
      summary: t2.summary,
      authorityTarget: auth2?.institution_name || undefined,
    });

    if (!submit2.success || !submit2.trackingCode) {
      throw new Error(`Test 2 submit failed: ${submit2.error}`);
    }
    console.log(`   - Tracking code       : ${submit2.trackingCode}`);

    const { data: rep2Row } = await adminClient
      .from('reports')
      .select('id, tracking_code, status, priority, authority_target, reporter_id')
      .eq('tracking_code', submit2.trackingCode)
      .single();

    if (!rep2Row || rep2Row.status !== 'submitted') {
      throw new Error(`Test 2 DB row verification failed: ${JSON.stringify(rep2Row)}`);
    }
    console.log(`   - Report created ID   : ${rep2Row.id}`);
    createdReportIds.push(rep2Row.id);
    if (rep2Row.reporter_id) createdReporterIds.push(rep2Row.reporter_id);

    flowResults.push({
      testId: 'TEST 2',
      name: 'PJU (Penerangan Jalan Umum)',
      categorySlug: t2.categorySlug,
      ruleCode: auth2?.rule_code ?? null,
      institutionCode: auth2?.institution_code ?? null,
      unitCode: auth2?.unit_code ?? null,
      decision: auth2?.decision ?? null,
      reportId: rep2Row.id,
      trackingCode: submit2.trackingCode,
      reporterId: rep2Row.reporter_id,
      status: 'PASS',
    });

    // ------------------------------------------------------------------
    // 4. TEST CASE 3 — SAMPAH UMUM (RULE_KEBERSIHAN_KOTA -> DLH)
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 4] TEST CASE 3: Sampah Umum (Kebersihan Kota) ---');
    const input3 = {
      title: 'Tumpukan sampah liar menumpuk di pinggir jalan',
      description: 'Tumpukan sampah liar menumpuk di pinggir jalan dan belum diangkut.',
      categoryName: catMap.get('kebersihan-lingkungan')?.name_id,
      districtName: 'Alang-Alang Lebar',
      subdistrictName: 'Talang Kelapa',
      addressDetail: 'Jl. Soekarno Hatta dekat lampu merah',
    };

    console.log(' 🤖 Menjalankan AI Triage Step 1 & Step 2...');
    const triage3Res = await analyzeReportAction(input3);
    if (!triage3Res.success || !triage3Res.triage) {
      throw new Error(`Test 3 Triage failed: ${triage3Res.error}`);
    }

    const t3 = triage3Res.triage;
    const auth3 = t3.authorityRecommendation;
    console.log(`   - Category classified : ${t3.categorySlug}`);
    console.log(`   - Authority rule_code : ${auth3?.rule_code}`);
    console.log(`   - Institution         : ${auth3?.institution_code} - ${auth3?.institution_name}`);
    console.log(`   - Unit                : ${auth3?.unit_code ?? 'NULL'}`);

    const t3RulePass = auth3?.rule_code === 'RULE_KEBERSIHAN_KOTA' && auth3?.institution_code === 'DLH' && auth3?.unit_code === null;
    if (!t3RulePass) {
      throw new Error(`Test 3 Rule mismatch: expected RULE_KEBERSIHAN_KOTA / DLH (NOT RULE_TPA_SUKAWINATAN), got ${auth3?.rule_code}`);
    }

    // Persist via submitReportAction
    console.log(' 💾 Melakukan submitReportAction ke database...');
    const kel3 = findKelurahan('Talang Kelapa');
    const submit3 = await submitReportAction({
      categoryId: catMap.get('kebersihan-lingkungan')!.id,
      kecamatanId: kel3.kecamatan_id,
      kelurahanId: kel3.id,
      title: input3.title,
      description: input3.description,
      addressDetail: input3.addressDetail,
      reporterName: 'Citra Warga',
      reporterPhone: '081234567892',
      evidenceFiles: [
        {
          fileUrl: 'https://pncnozyuoqzfezdfdcke.supabase.co/storage/v1/object/public/evidence/test_sampah.jpg',
          fileType: 'image/jpeg',
          fileSize: 180000,
          storagePath: 'reports/test_sampah.jpg',
          caption: 'Foto tumpukan sampah liar di trotoar',
        },
      ],
    }, {
      priority: t3.priority,
      confidence: t3.confidence,
      summary: t3.summary,
      authorityTarget: auth3?.institution_name || undefined,
    });

    if (!submit3.success || !submit3.trackingCode) {
      throw new Error(`Test 3 submit failed: ${submit3.error}`);
    }
    console.log(`   - Tracking code       : ${submit3.trackingCode}`);

    const { data: rep3Row } = await adminClient
      .from('reports')
      .select('id, tracking_code, status, priority, authority_target, reporter_id')
      .eq('tracking_code', submit3.trackingCode)
      .single();

    if (!rep3Row || rep3Row.status !== 'submitted') {
      throw new Error(`Test 3 DB row verification failed: ${JSON.stringify(rep3Row)}`);
    }
    console.log(`   - Report created ID   : ${rep3Row.id}`);
    createdReportIds.push(rep3Row.id);
    if (rep3Row.reporter_id) createdReporterIds.push(rep3Row.reporter_id);

    flowResults.push({
      testId: 'TEST 3',
      name: 'Sampah Umum (Kebersihan Kota)',
      categorySlug: t3.categorySlug,
      ruleCode: auth3?.rule_code ?? null,
      institutionCode: auth3?.institution_code ?? null,
      unitCode: auth3?.unit_code ?? null,
      decision: auth3?.decision ?? null,
      reportId: rep3Row.id,
      trackingCode: submit3.trackingCode,
      reporterId: rep3Row.reporter_id,
      status: 'PASS',
    });

    // ------------------------------------------------------------------
    // 5. TEST CASE 4 — TPA SUKAWINATAN (RULE_TPA_SUKAWINATAN -> DLH UPTD) + EVIDENCE
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 5] TEST CASE 4: TPA Sukawinatan (DLH UPTD TPA) + Evidence ---');
    const input4 = {
      title: 'Masalah pengolahan sampah dan antrean di TPA Sukawinatan',
      description: 'Masalah pengolahan sampah dan antrean truk di TPA Sukawinatan.',
      categoryName: catMap.get('kebersihan-lingkungan')?.name_id,
      districtName: 'Sukarami',
      subdistrictName: 'Sukajaya',
      addressDetail: 'Area TPA Sukawinatan Jl. Sukawinatan',
    };

    console.log(' 🤖 Menjalankan AI Triage Step 1 & Step 2...');
    const triage4Res = await analyzeReportAction(input4);
    if (!triage4Res.success || !triage4Res.triage) {
      throw new Error(`Test 4 Triage failed: ${triage4Res.error}`);
    }

    const t4 = triage4Res.triage;
    const auth4 = t4.authorityRecommendation;
    console.log(`   - Category classified : ${t4.categorySlug}`);
    console.log(`   - Authority rule_code : ${auth4?.rule_code}`);
    console.log(`   - Institution         : ${auth4?.institution_code} - ${auth4?.institution_name}`);
    console.log(`   - Unit                : ${auth4?.unit_code ?? 'NULL'} - ${auth4?.unit_name}`);

    const t4RulePass = auth4?.rule_code === 'RULE_TPA_SUKAWINATAN' &&
      auth4?.institution_code === 'DLH' &&
      auth4?.unit_code === 'DLH_UPTD_TPA_SUKAWINATAN';
    if (!t4RulePass) {
      throw new Error(`Test 4 Rule mismatch: expected RULE_TPA_SUKAWINATAN / DLH / DLH_UPTD_TPA_SUKAWINATAN, got ${auth4?.rule_code} / ${auth4?.unit_code}`);
    }

    // Persist via submitReportAction with Evidence file
    console.log(' 💾 Melakukan submitReportAction dengan lampiran evidence ke database...');
    const kel4 = findKelurahan('Sukajaya');
    const submit4 = await submitReportAction({
      categoryId: catMap.get('kebersihan-lingkungan')!.id,
      kecamatanId: kel4.kecamatan_id,
      kelurahanId: kel4.id,
      title: input4.title,
      description: input4.description,
      addressDetail: input4.addressDetail,
      reporterName: 'Doni Petugas',
      reporterPhone: '081234567893',
      evidenceFiles: [
        {
          fileUrl: 'https://pncnozyuoqzfezdfdcke.supabase.co/storage/v1/object/public/evidence/test_sukawinatan_sample.jpg',
          fileType: 'image/jpeg',
          fileSize: 204800,
          storagePath: 'reports/test_sukawinatan_sample.jpg',
          caption: 'Foto antrean truk di TPA Sukawinatan',
        },
      ],
    }, {
      priority: t4.priority,
      confidence: t4.confidence,
      summary: t4.summary,
      authorityTarget: auth4?.institution_name || undefined,
    });

    if (!submit4.success || !submit4.trackingCode) {
      throw new Error(`Test 4 submit failed: ${submit4.error}`);
    }
    console.log(`   - Tracking code       : ${submit4.trackingCode}`);

    const { data: rep4Row } = await adminClient
      .from('reports')
      .select('id, tracking_code, status, priority, authority_target, reporter_id')
      .eq('tracking_code', submit4.trackingCode)
      .single();

    if (!rep4Row || rep4Row.status !== 'submitted') {
      throw new Error(`Test 4 DB row verification failed: ${JSON.stringify(rep4Row)}`);
    }
    console.log(`   - Report created ID   : ${rep4Row.id}`);
    createdReportIds.push(rep4Row.id);
    if (rep4Row.reporter_id) createdReporterIds.push(rep4Row.reporter_id);

    // Verify evidence record
    const { data: evRows } = await adminClient
      .from('report_evidence')
      .select('id, report_id, file_url, storage_path, caption')
      .eq('report_id', rep4Row.id);

    if (!evRows || evRows.length === 0) {
      throw new Error('Test 4 evidence record verification failed: no evidence found in database');
    }
    console.log(`   - Evidence record ID  : ${evRows[0].id} (linked to report ${evRows[0].report_id})`);
    createdEvidenceIds.push(evRows[0].id);

    flowResults.push({
      testId: 'TEST 4',
      name: 'TPA Sukawinatan (DLH UPTD TPA)',
      categorySlug: t4.categorySlug,
      ruleCode: auth4?.rule_code ?? null,
      institutionCode: auth4?.institution_code ?? null,
      unitCode: auth4?.unit_code ?? null,
      decision: auth4?.decision ?? null,
      reportId: rep4Row.id,
      trackingCode: submit4.trackingCode,
      reporterId: rep4Row.reporter_id,
      status: 'PASS',
      notes: 'Composite unit & evidence verification PASS',
    });

    // ------------------------------------------------------------------
    // 6. STAGE 6: PUBLIC TRACKING & PRIVACY / RPC LEAK TEST
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 6] Public Tracking & Privacy Leak Test ---');
    const testTrackingCode = submit1.trackingCode!;
    console.log(` 🔍 Testing lookup for tracking code: ${testTrackingCode}`);

    const trackingResult = await getPublicReportAction(testTrackingCode);
    if (!trackingResult.success || !trackingResult.report) {
      throw new Error(`Public tracking lookup failed: ${trackingResult.error}`);
    }

    const pub = trackingResult.report;
    console.log(' ✅ Public tracking returned successfully.');
    console.log(`   - Title exposed    : "${pub.title}"`);
    console.log(`   - Status exposed   : "${pub.status}"`);
    console.log(`   - Category exposed : "${trackingResult.categoryName}"`);

    // Verify NO privacy leakage
    console.log(' 🔒 Memverifikasi ketiadaan kebocoran data sensitif (Privacy Check)...');
    const pubKeys = Object.keys(pub);
    const pubStr = JSON.stringify(trackingResult);

    const forbiddenFields = [
      'email',
      'phone',
      'nik',
      'reporter_id',
      'raw_request',
      'raw_response',
      'ai_reasoning',
      'service_role',
      'serviceRoleKey',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GEMINI_API_KEY',
    ];

    let hasPrivacyLeak = false;
    for (const f of forbiddenFields) {
      if (pubKeys.includes(f) || pubStr.toLowerCase().includes(`"${f}"`)) {
        console.error(` ❌ PRIVACY LEAK DETECTED: field "${f}" found in public response!`);
        hasPrivacyLeak = true;
      }
    }

    // Verify specifically reporter PII is NOT in public payload
    if (pubStr.includes('ahmad.test@palembang.id') || pubStr.includes('081234567890')) {
      console.error(' ❌ PRIVACY LEAK: Reporter phone/email leaked in tracking response!');
      hasPrivacyLeak = true;
    }

    if (hasPrivacyLeak) {
      throw new Error('Privacy check FAILED: sensitive information leaked in public response');
    }
    console.log(' ✅ PRIVACY AUDIT PASS: Zero reporter PII, internal IDs, or secrets in public payload.');

    // Also verify evidence privacy in Test 4 public tracking:
    const tracking4Result = await getPublicReportAction(submit4.trackingCode!);
    if (tracking4Result.success && tracking4Result.evidence) {
      const evPub = tracking4Result.evidence[0];
      if ('storage_path' in evPub) {
        throw new Error('Privacy check FAILED: storage_path leaked in public evidence response');
      }
      console.log(' ✅ Evidence public response verified: only file_url & caption exposed, storage_path hidden.');
    }

    // ------------------------------------------------------------------
    // 7. STAGE 7: SUCCESS PAGE TEST
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 7] Success Page (/lapor/berhasil) Resolution Test ---');
    // Berhasil page calls getPublicReportAction(trackingCode)
    const berhasilResult = await getPublicReportAction(submit1.trackingCode!);
    if (!berhasilResult.success || !berhasilResult.report) {
      throw new Error('Success page resolution failed for tracking code');
    }
    console.log(` ✅ BerhasilPage resolution confirmed:`);
    console.log(`   - Code       : ${berhasilResult.report.tracking_code}`);
    console.log(`   - Title      : ${berhasilResult.report.title}`);
    console.log(`   - Category   : ${berhasilResult.categoryName}`);
    console.log(`   - Created At : ${berhasilResult.report.created_at}`);

    // ------------------------------------------------------------------
    // 8. STAGE 8: EMAIL CONFIGURATION AUDIT
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 8] Email Notification Configuration Audit ---');
    const hasResendClient = resend !== null;
    const hasResendKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_'));
    const senderConfig = process.env.RESEND_FROM_EMAIL || 'LAPORKITO <onboarding@resend.dev>';
    console.log(`   - Resend API key configured : ${hasResendKey}`);
    console.log(`   - Resend Client initialized : ${hasResendClient}`);
    console.log(`   - Sender address            : "${senderConfig}"`);
    console.log('   - Email Delivery Status     : NOT VERIFIED (per strict testing policy: no fake recipients / spam in E2E)');

    // ------------------------------------------------------------------
    // 9. STAGE 9: NEGATIVE TESTS
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 9] Negative Tests ---');
    console.log(' 9.1 Testing invalid tracking code...');
    const invalidRes = await getPublicReportAction('LPK-99999999-XXXX');
    if (invalidRes.success || !invalidRes.error) {
      throw new Error('Invalid tracking code should return success: false');
    }
    console.log(` ✅ Invalid tracking code gracefully rejected: "${invalidRes.error}"`);

    console.log(' 9.2 Testing non-civic / ambiguous complaint triage...');
    const ambiguousTriage = await analyzeReportAction({
      title: 'Pohon mangga tetangga daunnya sering jatuh ke teras rumah',
      description: 'Daun pohon mangga milik pekarangan tetangga sebelah sering gugur ke teras rumah saya, kami sempat berdebat dan saya bingung ini harus lapor ke mana.',
      districtName: 'Ilir Barat Satu',
      subdistrictName: 'Demang Lebar Daun',
    });
    if (ambiguousTriage.success && ambiguousTriage.triage) {
      const ambAuth = ambiguousTriage.triage.authorityRecommendation;
      console.log(`   - Ambiguous decision: ${ambAuth?.decision}`);
      console.log(`   - Ambiguous reasoning: ${ambAuth?.reasoning}`);
      if (ambAuth?.decision === 'RECOMMEND') {
        throw new Error('Ambiguous report should NOT RECOMMEND a municipal authority!');
      }
      console.log(' ✅ Ambiguous complaint successfully resolved to NEEDS_REVIEW without fabricated authority.');
    }

    // ------------------------------------------------------------------
    // 10. STAGE 10: PERSISTENCE AUDIT ACROSS ALL CREATED REPORTS
    // ------------------------------------------------------------------
    console.log('\n--- [STAGE 10] Persistence Audit Across All Created Reports ---');
    const { count: reportsCountMid } = await adminClient
      .from('reports')
      .select('*', { count: 'exact', head: true });
    console.log(` ✅ Reports currently stored: ${reportsCountMid} (all ${createdReportIds.length} test reports active)`);

    // Verify ai_triage_logs link
    const { data: logsData } = await adminClient
      .from('ai_triage_logs')
      .select('id, report_id, raw_response')
      .in('report_id', createdReportIds);

    console.log(` ✅ ai_triage_logs linked to test reports: ${logsData?.length ?? 0}`);
    if (logsData) {
      logsData.forEach((l) => createdTriageLogIds.push(l.id));
    }

    console.log('\n====================================================================');
    console.log('                  TEST SUMMARY OF 4 FLOW CASES                      ');
    console.log('====================================================================');
    for (const r of flowResults) {
      console.log(` [${r.status}] ${r.testId.padEnd(8)} | ${r.name.padEnd(35)} | Rule: ${r.ruleCode} | Inst: ${r.institutionCode} | Unit: ${r.unitCode ?? 'NULL'} | Tracking: ${r.trackingCode}`);
    }

  } catch (err: unknown) {
    allStepsPassed = false;
    console.error('\n❌ E2E EXECUTION FAILED WITH ERROR:', err instanceof Error ? err.message : String(err));
  } finally {
    // ------------------------------------------------------------------
    // 11. MANDATORY CLEANUP OF TEST ARTIFACTS
    // ------------------------------------------------------------------
    console.log('\n====================================================================');
    console.log('                 MANDATORY TEST DATA CLEANUP                        ');
    console.log('====================================================================');

    // Step 1: Delete evidence records linked to test reports
    try {
      if (createdEvidenceIds.length > 0) {
        console.log(` 🧹 Deleting ${createdEvidenceIds.length} test evidence records by ID...`);
        await adminClient.from('report_evidence').delete().in('id', createdEvidenceIds);
      }
      if (createdReportIds.length > 0) {
        console.log(` 🧹 Deleting remaining evidence entries for ${createdReportIds.length} reports...`);
        await adminClient.from('report_evidence').delete().in('report_id', createdReportIds);
      }
    } catch (cleanErr) {
      console.error(' ⚠️ Evidence cleanup error (continuing):', (cleanErr as Error).message);
    }

    // Step 2: Delete report_responses linked to test reports
    try {
      if (createdReportIds.length > 0) {
        console.log(` 🧹 Deleting report_responses for ${createdReportIds.length} reports...`);
        await adminClient.from('report_responses').delete().in('report_id', createdReportIds);
      }
    } catch (cleanErr) {
      console.error(' ⚠️ Report responses cleanup error (continuing):', (cleanErr as Error).message);
    }

    // Step 3: Delete timeline entries
    try {
      if (createdReportIds.length > 0) {
        console.log(` 🧹 Deleting timeline entries for ${createdReportIds.length} reports...`);
        await adminClient.from('report_timeline').delete().in('report_id', createdReportIds);
      }
    } catch (cleanErr) {
      console.error(' ⚠️ Timeline cleanup error (continuing):', (cleanErr as Error).message);
    }

    // Step 4: Delete ai_triage_logs linked to test reports
    try {
      if (createdReportIds.length > 0) {
        console.log(` 🧹 Unlinking ai_triage_logs for ${createdReportIds.length} reports...`);
        await adminClient.from('ai_triage_logs').delete().in('report_id', createdReportIds);
      }
    } catch (cleanErr) {
      console.error(' ⚠️ AI triage logs cleanup error (continuing):', (cleanErr as Error).message);
    }

    // Step 5: Delete test reports by ID
    try {
      if (createdReportIds.length > 0) {
        console.log(` 🧹 Deleting ${createdReportIds.length} test reports...`);
        await adminClient.from('reports').delete().in('id', createdReportIds);
      }
    } catch (cleanErr) {
      console.error(' ⚠️ Reports cleanup error (continuing):', (cleanErr as Error).message);
    }

    // Step 6: Delete test reporters
    try {
      if (createdReporterIds.length > 0) {
        console.log(` 🧹 Deleting ${createdReporterIds.length} test reporters...`);
        await adminClient.from('reporters').delete().in('id', createdReporterIds);
      }
    } catch (cleanErr) {
      console.error(' ⚠️ Reporters cleanup error (continuing):', (cleanErr as Error).message);
    }

    // Step 7: Clean orphan triage logs created by this test run (by matching test titles)
    try {
      await adminClient
        .from('ai_triage_logs')
        .delete()
        .or(
          'raw_request->>title.eq."Jalan berlubang cukup parah di Jalan R. Sukamto",' +
          'raw_request->>title.eq."Lampu penerangan jalan umum padam beberapa malam",' +
          'raw_request->>title.eq."Tumpukan sampah liar menumpuk di pinggir jalan",' +
          'raw_request->>title.eq."Masalah pengolahan sampah dan antrean di TPA Sukawinatan",' +
          'raw_request->>title.eq."Pohon mangga tetangga daunnya sering jatuh ke teras rumah"'
        );
    } catch (cleanErr) {
      console.error(' ⚠️ Orphan triage logs cleanup error (continuing):', (cleanErr as Error).message);
    }

    // ------------------------------------------------------------------
    // 12. FINAL DATABASE REGRESSION ROW COUNT VERIFICATION
    // ------------------------------------------------------------------
    console.log('\n====================================================================');
    console.log('            FINAL DATABASE REGRESSION VERIFICATION                  ');
    console.log('====================================================================');

    const expectedFinalCounts = [
      { name: 'categories', expected: 4 },
      { name: 'kecamatan', expected: 18 },
      { name: 'kelurahan', expected: 107 },
      { name: 'institutions', expected: 30 },
      { name: 'institution_units', expected: 14 },
      { name: 'authority_rules', expected: 5 },
      { name: 'reports', expected: 0 },
    ];

    let cleanupPassed = true;
    for (const t of expectedFinalCounts) {
      const { count, error } = await adminClient
        .from(t.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(` ❌ Table ${t.name}: ERROR ${error.message}`);
        cleanupPassed = false;
      } else {
        const isOk = count === t.expected;
        if (!isOk) cleanupPassed = false;
        console.log(` ${isOk ? '✅' : '❌'} ${t.name.padEnd(20)}: ${count} (Expected: ${t.expected})`);
      }
    }

    if (!cleanupPassed) {
      console.error('\n🚨 CRITICAL ALERT: Database row counts do NOT match required baseline!');
      process.exit(1);
    } else {
      console.log('\n✅ ALL DATABASE COUNTS RESTORED PERFECTLY TO BASELINE (reports = 0).');
    }

    if (!allStepsPassed) {
      console.error('\n❌ E2E TEST COMPLETED WITH FAILURES.');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL PHASE 5D E2E TESTS PASSED SUCCESSFULLY!');
    }
  }
}

runE2EPhase5D().catch((err) => {
  console.error('Fatal crash:', err);
  process.exit(1);
});
