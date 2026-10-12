/**
 * LAPORKITO — Automated Security Test Suite: Institution-Based Report Access Control
 * 
 * Membuktikan secara komprehensif:
 * 1. Petugas Instansi A tidak dapat melihat daftar laporan Instansi B.
 * 2. Petugas Instansi A tidak dapat mengakses detail laporan Instansi B via ID atau kode lacak.
 * 3. Petugas Instansi A tidak dapat mengubah status laporan Instansi B.
 * 4. Petugas Instansi A tidak dapat menambahkan tanggapan resmi pada laporan Instansi B.
 * 5. Admin LAPORKITO memiliki wewenang penuh untuk melihat, menugaskan, dan mengelola seluruh laporan lintas instansi.
 * 6. Laporan tanpa penugasan valid (unassigned) hanya dapat diakses/ditangani oleh Admin dan tidak bocor ke petugas instansi manapun.
 * 7. Isolasi data penuh: Data uji dibuat secara khusus dan seluruhnya dibersihkan (teardown).
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { setTestMockUser } from '../lib/auth/session';
import {
  getInternalReportsAction,
  getInternalReportDetailAction,
  updateReportStatusAction,
  assignReportInstitutionAction,
} from '../lib/actions/reports';
import { createReportResponseAction } from '../lib/actions/responses';
import type { UserProfile } from '../types/auth';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase environment variables missing in .env.local');
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_TIMESTAMP = Date.now();
const PREFIX = `TEST-SEC-${TEST_TIMESTAMP}`;

async function runSecurityTestSuite() {
  console.log('====================================================================');
  console.log('  LAPORKITO: INSTITUTION-BASED ACCESS CONTROL SECURITY AUDIT        ');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // Track created entities for 100% clean teardown
  const createdReportIds: string[] = [];
  const createdResponseIds: string[] = [];
  const createdTimelineIds: string[] = [];

  try {
    // ------------------------------------------------------------------
    // STEP 1: RESOLVE REAL INSTITUTIONS & MASTER DATA
    // ------------------------------------------------------------------
    console.log('[STEP 1] Memuat master data instansi acuan...');
    const { data: institutions, error: instErr } = await adminSupabase
      .from('institutions')
      .select('id, code, name, short_name')
      .in('code', ['DPUPR', 'DLH']);

    if (instErr || !institutions || institutions.length < 2) {
      throw new Error('Dibutuhkan minimal 2 instansi master (DPUPR & DLH) untuk pengujian.');
    }

    const instA = institutions.find((i) => i.code === 'DPUPR')!;
    const instB = institutions.find((i) => i.code === 'DLH')!;

    console.log(` - Instansi A: ${instA.name} (${instA.code}) [ID: ${instA.id}]`);
    console.log(` - Instansi B: ${instB.name} (${instB.code}) [ID: ${instB.id}]`);

    // Get default category
    const { data: category } = await adminSupabase
      .from('categories')
      .select('id')
      .limit(1)
      .single();

    if (!category) throw new Error('Data kategori tidak ditemukan.');

    // ------------------------------------------------------------------
    // STEP 2: SETUP TEST USERS (PETUGAS A, PETUGAS B, ADMIN)
    // ------------------------------------------------------------------
    // Fetch an existing internal user ID to satisfy foreign key constraints on report_timeline(actor_id)
    const { data: realUser } = await adminSupabase
      .from('internal_users')
      .select('id')
      .limit(1)
      .maybeSingle();

    const validActorId = realUser?.id || `00000000-0000-0000-0000-0000000000a1`;

    const petugasA: UserProfile = {
      id: validActorId,
      email: `petugas-a-${TEST_TIMESTAMP}@laporkito.local`,
      full_name: 'Petugas Pengujian DPUPR',
      role: 'petugas',
      phone: '081200000001',
      institution_id: instA.id,
      institution_unit_id: null,
      institution: {
        id: instA.id,
        code: instA.code,
        name: instA.name,
        short_name: instA.short_name,
      },
      unit: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const petugasB: UserProfile = {
      id: validActorId,
      email: `petugas-b-${TEST_TIMESTAMP}@laporkito.local`,
      full_name: 'Petugas Pengujian DLH',
      role: 'petugas',
      phone: '081200000002',
      institution_id: instB.id,
      institution_unit_id: null,
      institution: {
        id: instB.id,
        code: instB.code,
        name: instB.name,
        short_name: instB.short_name,
      },
      unit: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const adminUser: UserProfile = {
      id: validActorId,
      email: `admin-${TEST_TIMESTAMP}@laporkito.local`,
      full_name: 'Admin Pengawas Sistem',
      role: 'admin',
      phone: '081200000099',
      institution_id: null,
      institution_unit_id: null,
      institution: null,
      unit: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(` - Profil Petugas A (DPUPR) diinisialisasi.`);
    console.log(` - Profil Petugas B (DLH) diinisialisasi.`);
    console.log(` - Profil Admin Pengawas diinisialisasi.`);

    // ------------------------------------------------------------------
    // STEP 3: CREATE ISOLATED TEST REPORTS
    // ------------------------------------------------------------------
    console.log('\n[STEP 3] Membuat 3 laporan pengujian terisolasi...');

    // Report 1: Ditugaskan ke DPUPR (Instansi A)
    const codeA = `LPK-TEST-A-${TEST_TIMESTAMP.toString().slice(-4)}`;
    const { data: rep1, error: errRep1 } = await adminSupabase
      .from('reports')
      .insert({
        tracking_code: codeA,
        title: `[${PREFIX}] Jalan Rusak Berlubang (DPUPR)`,
        description: 'Pengujian akses laporan instansi DPUPR.',
        address_detail: 'Jl. Merdeka Uji Keamanan No. 1',
        category_id: category.id,
        status: 'submitted',
        priority: 'high',
        authority_target: instA.name,
      })
      .select('id, tracking_code')
      .single();

    if (errRep1 || !rep1) throw new Error(`Gagal membuat Laporan 1: ${errRep1?.message}`);
    createdReportIds.push(rep1.id);
    console.log(` - Laporan 1 dibuat: ${rep1.tracking_code} (Ditugaskan ke DPUPR)`);

    // Report 2: Ditugaskan ke DLH (Instansi B)
    const codeB = `LPK-TEST-B-${TEST_TIMESTAMP.toString().slice(-4)}`;
    const { data: rep2, error: errRep2 } = await adminSupabase
      .from('reports')
      .insert({
        tracking_code: codeB,
        title: `[${PREFIX}] Tumpukan Sampah Liar (DLH)`,
        description: 'Pengujian akses laporan instansi DLH.',
        address_detail: 'Jl. Kolonel Burlian Uji No. 2',
        category_id: category.id,
        status: 'submitted',
        priority: 'medium',
        authority_target: instB.name,
      })
      .select('id, tracking_code')
      .single();

    if (errRep2 || !rep2) throw new Error(`Gagal membuat Laporan 2: ${errRep2?.message}`);
    createdReportIds.push(rep2.id);
    console.log(` - Laporan 2 dibuat: ${rep2.tracking_code} (Ditugaskan ke DLH)`);

    // Report 3: Belum memiliki penugasan valid (Unassigned)
    const codeC = `LPK-TEST-C-${TEST_TIMESTAMP.toString().slice(-4)}`;
    const { data: rep3, error: errRep3 } = await adminSupabase
      .from('reports')
      .insert({
        tracking_code: codeC,
        title: `[${PREFIX}] Laporan Masuk Baru Tanpa Penugasan`,
        description: 'Laporan warga belum diverifikasi atau ditugaskan.',
        address_detail: 'Jl. Sudirman Uji No. 3',
        category_id: category.id,
        status: 'submitted',
        priority: 'low',
        authority_target: null, // Tanpa target penugasan
      })
      .select('id, tracking_code')
      .single();

    if (errRep3 || !rep3) throw new Error(`Gagal membuat Laporan 3: ${errRep3?.message}`);
    createdReportIds.push(rep3.id);
    console.log(` - Laporan 3 dibuat: ${rep3.tracking_code} (Tanpa Penugasan / Unassigned)`);

    // ------------------------------------------------------------------
    // TEST SUITE 1: ISOLASI DAFTAR LAPORAN (getInternalReportsAction)
    // ------------------------------------------------------------------
    console.log('\n--- UJI 1: ISOLASI DAFTAR LAPORAN (LIST INBOX) ---');

    // 1a. Petugas A (DPUPR) hanya melihat laporan DPUPR
    setTestMockUser(petugasA);
    const listPetugasA = await getInternalReportsAction();
    assert(listPetugasA.success, 'Petugas A dapat mengeksekusi getInternalReportsAction');
    const idsPetugasA = (listPetugasA.data || []).map((r) => r.id);
    assert(
      idsPetugasA.includes(rep1.id),
      'Petugas A (DPUPR) DAPAT melihat Laporan 1 (DPUPR)'
    );
    assert(
      !idsPetugasA.includes(rep2.id),
      'Petugas A (DPUPR) DILARANG melihat Laporan 2 (DLH)'
    );
    assert(
      !idsPetugasA.includes(rep3.id),
      'Petugas A (DPUPR) DILARANG melihat Laporan 3 (Unassigned)'
    );

    // 1b. Petugas B (DLH) hanya melihat laporan DLH
    setTestMockUser(petugasB);
    const listPetugasB = await getInternalReportsAction();
    assert(listPetugasB.success, 'Petugas B dapat mengeksekusi getInternalReportsAction');
    const idsPetugasB = (listPetugasB.data || []).map((r) => r.id);
    assert(
      !idsPetugasB.includes(rep1.id),
      'Petugas B (DLH) DILARANG melihat Laporan 1 (DPUPR)'
    );
    assert(
      idsPetugasB.includes(rep2.id),
      'Petugas B (DLH) DAPAT melihat Laporan 2 (DLH)'
    );
    assert(
      !idsPetugasB.includes(rep3.id),
      'Petugas B (DLH) DILARANG melihat Laporan 3 (Unassigned)'
    );

    // 1c. Admin LAPORKITO dapat melihat seluruh laporan lintas instansi & unassigned
    setTestMockUser(adminUser);
    const listAdmin = await getInternalReportsAction();
    assert(listAdmin.success, 'Admin dapat mengeksekusi getInternalReportsAction');
    const idsAdmin = (listAdmin.data || []).map((r) => r.id);
    assert(
      idsAdmin.includes(rep1.id) && idsAdmin.includes(rep2.id) && idsAdmin.includes(rep3.id),
      'Admin LAPORKITO DAPAT melihat seluruh laporan lintas instansi (DPUPR, DLH, dan Unassigned)'
    );

    // ------------------------------------------------------------------
    // TEST SUITE 2: RESTRIKSI DETAIL LAPORAN (getInternalReportDetailAction)
    // ------------------------------------------------------------------
    console.log('\n--- UJI 2: RESTRIKSI DETAIL LAPORAN (DETAIL VIEW ACCESS) ---');

    // 2a. Petugas A membuka laporan miliknya sendiri (DPUPR) -> BERHASIL
    setTestMockUser(petugasA);
    const detailOwn = await getInternalReportDetailAction(rep1.id);
    assert(
      detailOwn.success === true && detailOwn.data?.report.id === rep1.id,
      'Petugas A diizinkan membuka detail Laporan 1 (DPUPR)'
    );

    // 2b. Petugas A mencoba membuka laporan instansi lain (DLH) via ID -> DIBLOKIR 403
    const detailOtherById = await getInternalReportDetailAction(rep2.id);
    assert(
      detailOtherById.success === false &&
        (detailOtherById.error?.includes('Akses ditolak') || false),
      'Petugas A DIBLOKIR saat mengakses detail Laporan 2 (DLH) via UUID'
    );

    // 2c. Petugas A mencoba membuka laporan instansi lain via Tracking Code -> DIBLOKIR
    const detailOtherByCode = await getInternalReportDetailAction(rep2.tracking_code);
    assert(
      detailOtherByCode.success === false &&
        (detailOtherByCode.error?.includes('Akses ditolak') || false),
      'Petugas A DIBLOKIR saat mengakses detail Laporan 2 (DLH) via Tracking Code'
    );

    // 2d. Petugas A mencoba membuka laporan unassigned -> DIBLOKIR
    const detailUnassigned = await getInternalReportDetailAction(rep3.id);
    assert(
      detailUnassigned.success === false &&
        (detailUnassigned.error?.includes('Akses ditolak') || false),
      'Petugas A DIBLOKIR saat mengakses detail Laporan 3 (Unassigned)'
    );

    // 2e. Admin mengakses detail seluruh laporan -> BERHASIL
    setTestMockUser(adminUser);
    const adminDetail1 = await getInternalReportDetailAction(rep1.id);
    const adminDetail2 = await getInternalReportDetailAction(rep2.id);
    const adminDetail3 = await getInternalReportDetailAction(rep3.id);
    assert(
      adminDetail1.success && adminDetail2.success && adminDetail3.success,
      'Admin LAPORKITO berhasil mengakses detail seluruh laporan (DPUPR, DLH, Unassigned)'
    );

    // ------------------------------------------------------------------
    // TEST SUITE 3: RESTRIKSI MUTASI STATUS (updateReportStatusAction)
    // ------------------------------------------------------------------
    console.log('\n--- UJI 3: RESTRIKSI MUTASI STATUS LAPORAN ---');

    // 3a. Petugas A mencoba mengubah status laporan DLH -> DITOLAK
    setTestMockUser(petugasA);
    const crossStatusRes = await updateReportStatusAction({
      reportId: rep2.id,
      nextStatus: 'verifying',
      notes: 'Percobaan ilegal perubahan status instansi lain',
    });
    assert(
      crossStatusRes.success === false &&
        (crossStatusRes.error?.includes('Akses ditolak') || false),
      'Petugas A DITOLAK saat mencoba mengubah status Laporan 2 (DLH)'
    );

    // Verifikasi database: status Laporan 2 TIDAK berubah
    const { data: checkRep2 } = await adminSupabase
      .from('reports')
      .select('status')
      .eq('id', rep2.id)
      .single();
    assert(
      checkRep2?.status === 'submitted',
      'Integritas data terjamin: Status Laporan 2 tetap "submitted"'
    );

    // 3b. Petugas A mengubah status laporan miliknya sendiri (DPUPR) -> BERHASIL
    const ownStatusRes = await updateReportStatusAction({
      reportId: rep1.id,
      nextStatus: 'verifying',
      notes: 'Verifikasi faktual lapangan oleh Petugas DPUPR',
    });
    assert(
      ownStatusRes.success === true,
      'Petugas A BERHASIL memperbarui status Laporan 1 (DPUPR) menjadi "verifying"'
    );

    // ------------------------------------------------------------------
    // TEST SUITE 4: RESTRIKSI TANGGAPAN RESMI (createReportResponseAction)
    // ------------------------------------------------------------------
    console.log('\n--- UJI 4: RESTRIKSI TANGGAPAN RESMI ---');

    // 4a. Petugas A mencoba memberi tanggapan resmi pada laporan DLH -> DITOLAK
    setTestMockUser(petugasA);
    const crossRespRes = await createReportResponseAction({
      reportId: rep2.id,
      message: 'Tanggapan resmi ilegal dari petugas instansi lain.',
      responseType: 'official',
    });
    assert(
      crossRespRes.success === false &&
        (crossRespRes.error?.includes('Akses ditolak') || false),
      'Petugas A DITOLAK saat mencoba mengirim tanggapan pada Laporan 2 (DLH)'
    );

    // 4b. Petugas A memberi tanggapan resmi pada laporan miliknya (DPUPR) -> BERHASIL
    const ownRespRes = await createReportResponseAction({
      reportId: rep1.id,
      message: 'Tim teknis DPUPR telah menjadwalkan perbaikan jalan pada pekan ini.',
      responseType: 'official',
    });
    assert(
      ownRespRes.success === true,
      'Petugas A BERHASIL mengirim tanggapan resmi pada Laporan 1 (DPUPR)'
    );
    if (ownRespRes.responseId) createdResponseIds.push(ownRespRes.responseId);

    // ------------------------------------------------------------------
    // TEST SUITE 5: HAK PENUGASAN RESMI ADMIN (assignReportInstitutionAction)
    // ------------------------------------------------------------------
    console.log('\n--- UJI 5: PENUGASAN RESMI OLEH ADMIN LAPORKITO ---');

    // 5a. Petugas A mencoba menetapkan penugasan -> DITOLAK (Bukan Admin)
    setTestMockUser(petugasA);
    const unauthorizedAssign = await assignReportInstitutionAction({
      reportId: rep3.id,
      institutionId: instA.id,
      notes: 'Penugasan ilegal oleh staf petugas',
    });
    assert(
      unauthorizedAssign.success === false &&
        (unauthorizedAssign.error?.includes('Akses ditolak') || false),
      'Petugas DITOLAK saat mencoba mengeksekusi assignReportInstitutionAction'
    );

    // 5b. Admin menetapkan penugasan Laporan 3 ke DPUPR (Instansi A) -> BERHASIL
    setTestMockUser(adminUser);
    const adminAssign = await assignReportInstitutionAction({
      reportId: rep3.id,
      institutionId: instA.id,
      notes: 'Verifikasi Admin: Pengaduan resmi dialokasikan ke DPUPR.',
    });
    assert(adminAssign.success === true, 'Admin BERHASIL menugaskan Laporan 3 ke DPUPR');

    // 5c. Setelah ditugaskan ke DPUPR, Petugas A kini memiliki hak akses ke Laporan 3!
    setTestMockUser(petugasA);
    const newlyAccessibleDetail = await getInternalReportDetailAction(rep3.id);
    assert(
      newlyAccessibleDetail.success === true,
      'Setelah penugasan resmi, Petugas A (DPUPR) sekarang DAPAT mengakses Laporan 3'
    );

    console.log('\n====================================================================');
    console.log(`  HASIL PENGUJIAN KEAMANAN: ${passed} / ${total} PENGUJIAN BERHASIL (100%) `);
    console.log('====================================================================\n');
  } finally {
    // ------------------------------------------------------------------
    // STEP 4: TEARDOWN & COMPLETE CLEANUP OF ISOLATED TEST DATA
    // ------------------------------------------------------------------
    console.log('[TEARDOWN] Membersihkan seluruh data pengujian terisolasi...');
    setTestMockUser(null);

    if (createdReportIds.length > 0) {
      // Delete child responses and timeline first
      await adminSupabase.from('report_responses').delete().in('report_id', createdReportIds);
      await adminSupabase.from('report_timeline').delete().in('report_id', createdReportIds);
      await adminSupabase.from('report_evidence').delete().in('report_id', createdReportIds);
      await adminSupabase.from('reports').delete().in('id', createdReportIds);
      console.log(` - ${createdReportIds.length} laporan pengujian terisolasi berhasil dibersihkan.`);
    }

    console.log('[TEARDOWN] Basis data kembali bersih tanpa polusi data riil.\n');
  }
}

runSecurityTestSuite().catch((err) => {
  console.error('\n[FATAL ERROR] Security test suite gagal:', err);
  process.exit(1);
});
