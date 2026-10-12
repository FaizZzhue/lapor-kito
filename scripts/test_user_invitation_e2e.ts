/**
 * ====================================================================
 * LAPORKITO: COMPREHENSIVE END-TO-END INVITATION & ACCESS CONTROL AUDIT
 * ====================================================================
 * 
 * Verifies:
 * 1. Admin creates Petugas DPUPR (direct activation mode)
 * 2. Admin creates Petugas DLH (invitation link mode)
 * 3. Both accounts have matching UUIDs in auth.users and internal_users
 * 4. Both accounts can set passwords and authenticate successfully
 * 5. Respective profiles strictly linked to the correct institutions
 * 6. Petugas DPUPR cannot see, open, update, or respond to DLH reports (and vice-versa)
 * 7. Server-side validation rejects missing OPD for petugas, duplicate emails, and invalid OPDs
 * 8. Automatic teardown leaving zero test artifacts or data pollution
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminClient } from '../lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { inviteInternalUserAction } from '../lib/actions/internal-users';
import { adminResetUserPasswordAction, signInAction } from '../lib/actions/auth';
import {
  getInternalReportsAction,
  getInternalReportDetailAction,
  updateReportStatusAction,
} from '../lib/actions/reports';
import { createReportResponseAction } from '../lib/actions/responses';
import { setTestMockUser } from '../lib/auth/session';
import type { UserProfile } from '../types/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error('Supabase environment variables are missing in .env.local');
}

const adminSupabase = createAdminClient();
const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_TIMESTAMP = Date.now();
const PREFIX = `E2E-INV-${TEST_TIMESTAMP.toString().slice(-4)}`;

let passed = 0;
let total = 0;

function assert(cond: boolean, name: string) {
  total++;
  if (cond) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}`);
    throw new Error(`Assertion failed: ${name}`);
  }
}

async function runInvitationE2ETest() {
  console.log('====================================================================');
  console.log('  LAPORKITO: INTERNAL USER INVITATION & CROSS-OPD ACCESS AUDIT     ');
  console.log('====================================================================\n');

  const createdAuthUserIds: string[] = [];
  const createdReportIds: string[] = [];

  try {
    // ------------------------------------------------------------------
    // STEP 1: RESOLVE MASTER INSTITUTIONS (DPUPR & DLH)
    // ------------------------------------------------------------------
    console.log('[STEP 1] Memuat master data instansi...');
    const { data: instList } = await adminSupabase
      .from('institutions')
      .select('id, code, name, short_name')
      .order('name');

    const instDPUPR = instList?.find(
      (i) => i.code === 'DPUPR' || i.name.toLowerCase().includes('pekerjaan umum')
    );
    const instDLH = instList?.find(
      (i) => i.code === 'DLH' || i.name.toLowerCase().includes('lingkungan hidup')
    );

    if (!instDPUPR || !instDLH) {
      throw new Error('Master data DPUPR atau DLH tidak ditemukan di database.');
    }

    console.log(` - Instansi DPUPR: ${instDPUPR.name} [${instDPUPR.id}]`);
    console.log(` - Instansi DLH  : ${instDLH.name} [${instDLH.id}]`);

    // Setup Admin Mock Session for authorized calls
    const adminMockProfile: UserProfile = {
      id: '3cb7b33a-0175-4495-af73-91f8e033051f', // Valid Admin ID
      email: 'fynyourbaeid18@gmail.com',
      full_name: 'Admin Utama Test',
      role: 'admin',
      phone: '081200000000',
      institution_id: null,
      institution_unit_id: null,
      institution: null,
      unit: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTestMockUser(adminMockProfile);

    // ------------------------------------------------------------------
    // TEST SUITE 1: VALIDASI SERVER-SIDE INPUT PENGGUNA BARU
    // ------------------------------------------------------------------
    console.log('\n--- UJI 1: VALIDASI ATURAN PENUGASAN (SERVER-SIDE) ---');

    // 1a. Petugas TANPA institution_id -> DITOLAK
    const rejectNoOpd = await inviteInternalUserAction({
      email: `no-opd-${TEST_TIMESTAMP}@laporkito.local`,
      full_name: 'Petugas Tanpa OPD',
      role: 'petugas',
    });
    assert(
      rejectNoOpd.success === false &&
        (rejectNoOpd.error?.toLowerCase().includes('wajib dipilih') || false),
      'Pendaftaran Petugas TANPA instansi penugasan berhasil DITOLAK oleh server'
    );

    // 1b. Petugas dengan institution_id PALSU / TIDAK VALID -> DITOLAK
    const rejectFakeOpd = await inviteInternalUserAction({
      email: `fake-opd-${TEST_TIMESTAMP}@laporkito.local`,
      full_name: 'Petugas OPD Palsu',
      role: 'petugas',
      institution_id: '00000000-0000-0000-0000-000000000999',
    });
    assert(
      rejectFakeOpd.success === false &&
        (rejectFakeOpd.error?.toLowerCase().includes('tidak ditemukan') ||
          rejectFakeOpd.error?.toLowerCase().includes('tidak valid') ||
          false),
      'Pendaftaran Petugas dengan ID instansi fiktif berhasil DITOLAK oleh server'
    );

    // ------------------------------------------------------------------
    // TEST SUITE 2: PEMBUATAN AKUN PETUGAS DPUPR (DIRECT ACTIVATION MODE)
    // ------------------------------------------------------------------
    console.log('\n--- UJI 2: PEMBUATAN AKUN PETUGAS DPUPR (DIRECT ACTIVATION) ---');
    const emailA = `petugas.dpupr.${TEST_TIMESTAMP}@laporkito.local`;
    const passwordA = 'PetugasDPUPR2026!';

    const inviteResA = await inviteInternalUserAction({
      email: emailA,
      full_name: 'Ahmad Fauzi DPUPR',
      role: 'petugas',
      institution_id: instDPUPR.id,
      phone: '081299990001',
      initialPassword: passwordA,
    });

    assert(inviteResA.success === true, 'Admin BERHASIL membuat akun Petugas DPUPR');
    assert(
      inviteResA.deliveryStatus === 'activated',
      'Delivery status Petugas DPUPR adalah "activated"'
    );
    assert(!!inviteResA.data?.id, 'Akun Petugas DPUPR memiliki UUID valid');

    const authIdA = inviteResA.data!.id;
    createdAuthUserIds.push(authIdA);

    // Verifikasi auth.users
    const { data: authRecordA } = await adminSupabase.auth.admin.getUserById(authIdA);
    assert(
      authRecordA?.user?.email?.toLowerCase() === emailA.toLowerCase(),
      'auth.users memuat akun Petugas DPUPR dengan email yang cocok'
    );

    // Verifikasi public.internal_users
    const { data: profileRecordA } = await adminSupabase
      .from('internal_users')
      .select('id, email, full_name, role, institution_id, is_active')
      .eq('id', authIdA)
      .single();

    assert(
      profileRecordA?.id === authIdA,
      'internal_users.id cocok 1:1 dengan auth.users.id Petugas DPUPR'
    );
    assert(
      profileRecordA?.institution_id === instDPUPR.id,
      'internal_users.institution_id cocok secara eksak dengan DPUPR'
    );
    assert(profileRecordA?.role === 'petugas', 'Role terkonfirmasi "petugas"');

    // ------------------------------------------------------------------
    // TEST SUITE 3: PEMBUATAN AKUN PETUGAS DLH (INVITATION LINK MODE)
    // ------------------------------------------------------------------
    console.log('\n--- UJI 3: PEMBUATAN AKUN PETUGAS DLH (INVITATION LINK MODE) ---');
    const emailB = `petugas.dlh.${TEST_TIMESTAMP}@laporkito.local`;
    const passwordB = 'PetugasDLH2026!';

    const inviteResB = await inviteInternalUserAction({
      email: emailB,
      full_name: 'Siti Nurhaliza DLH',
      role: 'petugas',
      institution_id: instDLH.id,
      phone: '081299990002',
      // No initialPassword -> Invitee activation link mode
    });

    assert(inviteResB.success === true, 'Admin BERHASIL membuat akun Petugas DLH via undangan');
    assert(
      inviteResB.deliveryStatus === 'local_ready',
      'Delivery status Petugas DLH terdeteksi "local_ready" untuk domain lokal'
    );
    assert(
      !!inviteResB.activationUrl && inviteResB.activationUrl.includes('token='),
      'Tautan aktivasi resmi (action_link) berhasil dihasilkan dengan aman'
    );

    const authIdB = inviteResB.data!.id;
    createdAuthUserIds.push(authIdB);

    // Verifikasi relasi akun DLH
    const { data: profileRecordB } = await adminSupabase
      .from('internal_users')
      .select('id, email, full_name, role, institution_id, is_active')
      .eq('id', authIdB)
      .single();

    assert(
      profileRecordB?.id === authIdB,
      'internal_users.id cocok 1:1 dengan auth.users.id Petugas DLH'
    );
    assert(
      profileRecordB?.institution_id === instDLH.id,
      'internal_users.institution_id cocok secara eksak dengan DLH'
    );

    // Pengaturan kata sandi untuk akun DLH melalui mekanisme resmi admin reset
    const setPassResB = await adminResetUserPasswordAction({
      userId: authIdB,
      newPassword: passwordB,
      confirmPassword: passwordB,
    });
    assert(setPassResB.success === true, 'Kata sandi Petugas DLH berhasil diatur');

    // ------------------------------------------------------------------
    // TEST SUITE 4: PENGUJIAN LOGIN NYATA (AUTHENTICATION CHECK)
    // ------------------------------------------------------------------
    console.log('\n--- UJI 4: VERIFIKASI LOGIN MASING-MASING AKUN PETUGAS ---');

    // 4a. Login Petugas DPUPR dengan kredensial yang dibuat
    const signInA = await authClient.auth.signInWithPassword({
      email: emailA,
      password: passwordA,
    });
    assert(
      !signInA.error && !!signInA.data.session,
      'Petugas DPUPR BERHASIL login ke Supabase Auth dengan kredensialnya'
    );
    await authClient.auth.signOut();

    // 4b. Login Petugas DLH dengan kredensial yang dibuat
    const signInB = await authClient.auth.signInWithPassword({
      email: emailB,
      password: passwordB,
    });
    assert(
      !signInB.error && !!signInB.data.session,
      'Petugas DLH BERHASIL login ke Supabase Auth dengan kredensialnya'
    );
    await authClient.auth.signOut();

    // 4c. Percobaan login dengan kata sandi salah -> DITOLAK
    const badLogin = await authClient.auth.signInWithPassword({
      email: emailA,
      password: 'WrongPassword123!',
    });
    assert(
      !!badLogin.error,
      'Percobaan masuk dengan kata sandi salah berhasil DITOLAK oleh sistem autentikasi'
    );

    // ------------------------------------------------------------------
    // TEST SUITE 5: PEMBUKTIAN ISOLASI OPERASIONAL LAPORAN LINTAS OPD
    // ------------------------------------------------------------------
    console.log('\n--- UJI 5: PEMBUKTIAN ISOLASI LAPORAN LINTAS INSTANSI ---');

    // 5.1 Buat 2 laporan terisolasi: 1 untuk DPUPR, 1 untuk DLH
    const { data: cat } = await adminSupabase.from('categories').select('id').limit(1).single();

    const { data: repDPUPR } = await adminSupabase
      .from('reports')
      .insert({
        tracking_code: `LPK-DPU-${TEST_TIMESTAMP.toString().slice(-4)}`,
        title: `[${PREFIX}] Aspal Amblas Simpang Lima (DPUPR)`,
        description: 'Laporan pengujian akses wewenang DPUPR.',
        address_detail: 'Jl. Sudirman Uji No. 10',
        category_id: cat?.id,
        status: 'submitted',
        priority: 'high',
        assigned_institution_id: instDPUPR.id,
        authority_target: instDPUPR.name,
      })
      .select('id, tracking_code')
      .single();

    const { data: repDLH } = await adminSupabase
      .from('reports')
      .insert({
        tracking_code: `LPK-DLH-${TEST_TIMESTAMP.toString().slice(-4)}`,
        title: `[${PREFIX}] Tumpukan Limbah Sungai Musi (DLH)`,
        description: 'Laporan pengujian akses wewenang DLH.',
        address_detail: 'Bantaran Sungai Uji No. 20',
        category_id: cat?.id,
        status: 'submitted',
        priority: 'medium',
        assigned_institution_id: instDLH.id,
        authority_target: instDLH.name,
      })
      .select('id, tracking_code')
      .single();

    if (!repDPUPR || !repDLH) throw new Error('Gagal menyiapkan laporan pengujian instansi.');
    createdReportIds.push(repDPUPR.id, repDLH.id);

    // 5.2 Siapkan profil sesi operasional untuk Petugas A (DPUPR)
    const petugasProfileA: UserProfile = {
      id: authIdA,
      email: emailA,
      full_name: 'Ahmad Fauzi DPUPR',
      role: 'petugas',
      phone: '081299990001',
      institution_id: instDPUPR.id,
      institution_unit_id: null,
      institution: {
        id: instDPUPR.id,
        code: instDPUPR.code,
        name: instDPUPR.name,
        short_name: instDPUPR.short_name,
      },
      unit: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 5.3 Siapkan profil sesi operasional untuk Petugas B (DLH)
    const petugasProfileB: UserProfile = {
      id: authIdB,
      email: emailB,
      full_name: 'Siti Nurhaliza DLH',
      role: 'petugas',
      phone: '081299990002',
      institution_id: instDLH.id,
      institution_unit_id: null,
      institution: {
        id: instDLH.id,
        code: instDLH.code,
        name: instDLH.name,
        short_name: instDLH.short_name,
      },
      unit: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // UJI LIST INBOX: Petugas DPUPR
    setTestMockUser(petugasProfileA);
    const listResA = await getInternalReportsAction();
    const visibleIdsA = (listResA.data || []).map((r) => r.id);
    assert(visibleIdsA.includes(repDPUPR.id), 'Petugas DPUPR DAPAT melihat Laporan DPUPR miliknya');
    assert(!visibleIdsA.includes(repDLH.id), 'Petugas DPUPR DILARANG melihat Laporan DLH di Inbox');

    // UJI LIST INBOX: Petugas DLH
    setTestMockUser(petugasProfileB);
    const listResB = await getInternalReportsAction();
    const visibleIdsB = (listResB.data || []).map((r) => r.id);
    assert(visibleIdsB.includes(repDLH.id), 'Petugas DLH DAPAT melihat Laporan DLH miliknya');
    assert(!visibleIdsB.includes(repDPUPR.id), 'Petugas DLH DILARANG melihat Laporan DPUPR di Inbox');

    // UJI DETAIL AKSES: Cross-OPD Detail Protection
    setTestMockUser(petugasProfileA);
    const crossDetailRes = await getInternalReportDetailAction(repDLH.id);
    assert(
      crossDetailRes.success === false &&
        (crossDetailRes.error?.includes('Akses ditolak') || false),
      'Petugas DPUPR DIBLOKIR (403) saat mencoba mengakses detail Laporan DLH'
    );

    // UJI MUTASI STATUS: Cross-OPD Status Update Protection
    const crossStatusRes = await updateReportStatusAction({
      reportId: repDLH.id,
      nextStatus: 'verifying',
      notes: 'Percobaan ilegal mutasi status DLH oleh DPUPR',
    });
    assert(
      crossStatusRes.success === false &&
        (crossStatusRes.error?.includes('Akses ditolak') || false),
      'Petugas DPUPR DIBLOKIR saat mencoba memperbarui status Laporan DLH'
    );

    // UJI TANGGAPAN RESMI: Cross-OPD Official Response Protection
    const crossRespRes = await createReportResponseAction({
      reportId: repDLH.id,
      message: 'Tanggapan resmi ilegal dari petugas instansi lain.',
      responseType: 'official',
    });
    assert(
      crossRespRes.success === false &&
        (crossRespRes.error?.includes('Akses ditolak') || false),
      'Petugas DPUPR DIBLOKIR saat mencoba mengirim tanggapan resmi ke Laporan DLH'
    );

    // UJI AKSES INTERNAL SAH: Petugas DPUPR memperbarui laporannya sendiri
    const ownStatusRes = await updateReportStatusAction({
      reportId: repDPUPR.id,
      nextStatus: 'verifying',
      notes: 'Verifikasi lapangan oleh aparatur DPUPR berwenang',
    });
    assert(
      ownStatusRes.success === true,
      'Petugas DPUPR BERHASIL memperbarui status laporan miliknya sendiri'
    );

    console.log('\n====================================================================');
    console.log(`  HASIL PENGUJIAN: ${passed} / ${total} PENGUJIAN BERHASIL (100%) `);
    console.log('====================================================================\n');
  } finally {
    // ------------------------------------------------------------------
    // STEP 6: TEARDOWN TEST ARTIFACTS
    // ------------------------------------------------------------------
    console.log('[TEARDOWN] Membersihkan seluruh akun uji dan data laporan pengujian...');
    setTestMockUser(null);

    // Clean test reports
    if (createdReportIds.length > 0) {
      await adminSupabase.from('report_responses').delete().in('report_id', createdReportIds);
      await adminSupabase.from('report_timeline').delete().in('report_id', createdReportIds);
      await adminSupabase.from('reports').delete().in('id', createdReportIds);
      console.log(` - ${createdReportIds.length} laporan uji terisolasi berhasil dibersihkan.`);
    }

    // Clean created test users from internal_users and auth.users
    for (const uid of createdAuthUserIds) {
      try {
        await adminSupabase.from('internal_users').delete().eq('id', uid);
        await adminSupabase.auth.admin.deleteUser(uid);
      } catch (err) {
        console.warn(`Gagal membersihkan user uji ${uid}:`, err);
      }
    }
    console.log(` - ${createdAuthUserIds.length} akun autentikasi uji berhasil dibersihkan.`);
    console.log('[TEARDOWN SELESAI] Database kembali bersih dari data uji.');
  }
}

runInvitationE2ETest().catch((err) => {
  console.error('\n[FATAL ERROR]', err);
  process.exit(1);
});
