import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

export interface OfficialUnitInput {
  institutionCode: string;
  name: string;
  code: string;
  workArea: string | null;
  description: string | null;
}

export const VERIFIED_UNITS_14: OfficialUnitInput[] = [
  {
    institutionCode: 'DINKES',
    name: 'RSUD Palembang BARI',
    code: 'DINKES_RSUD_BARI',
    workArea: null,
    description: 'Unit Organisasi Bersifat Khusus (UOBK) pelayanan kesehatan rujukan dan BLUD di bawah Dinas Kesehatan',
  },
  {
    institutionCode: 'DINKES',
    name: 'RSUD Gandus Kota Palembang',
    code: 'DINKES_RSUD_GANDUS',
    workArea: null,
    description: 'Unit Organisasi Bersifat Khusus (UOBK) pelayanan kesehatan dan BLUD di bawah Dinas Kesehatan',
  },
  {
    institutionCode: 'DINKES',
    name: 'UPTD Laboratorium Kesehatan Daerah (Labkesda)',
    code: 'DINKES_UPTD_LABKESDA',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pengujian laboratorium kesehatan dan diagnostik klinis',
  },
  {
    institutionCode: 'DINKES',
    name: 'UPTD Instalasi Farmasi Kota (IFK)',
    code: 'DINKES_UPTD_FARMASI',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pengelolaan, penyimpanan, dan pendistribusian obat serta perbekalan kesehatan',
  },
  {
    institutionCode: 'DISHUB',
    name: 'UPTD Pengujian Kendaraan Bermotor (PKB)',
    code: 'DISHUB_UPTD_PKB',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pelayanan pengujian kelaikan jalan kendaraan bermotor (Uji KIR)',
  },
  {
    institutionCode: 'DISHUB',
    name: 'UPTD Pengelolaan Perparkiran',
    code: 'DISHUB_UPTD_PARKIR',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pembinaan, pengawasan, dan pengelolaan retribusi parkir tepi jalan umum',
  },
  {
    institutionCode: 'DISHUB',
    name: 'UPTD Pelabuhan Penyeberangan 35 Ilir',
    code: 'DISHUB_UPTD_PELABUHAN',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pelayanan kepelabuhanan dan angkutan penyeberangan 35 Ilir',
  },
  {
    institutionCode: 'DLH',
    name: 'UPTD Tempat Pemrosesan Akhir (TPA) Sukawinatan',
    code: 'DLH_UPTD_TPA_SUKAWINATAN',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah operasional dan pemrosesan akhir sampah kota di Sukawinatan',
  },
  {
    institutionCode: 'DPRKPP',
    name: 'UPTD Pengelolaan Rumah Susun',
    code: 'DPRKPP_UPTD_RUSUNAWA',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pengelolaan dan operasional rumah susun sederhana sewa (Rusunawa)',
  },
  {
    institutionCode: 'DISDAG',
    name: 'UPTD Balai Pelayanan Kemetrologian (Metrologi Legal)',
    code: 'DISDAG_UPTD_METROLOGI',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pelayanan tera dan tera ulang alat ukur, takar, timbang, dan perlengkapannya (UTTP)',
  },
  {
    institutionCode: 'DISTANHAN',
    name: 'UPTD Rumah Potong Hewan (RPH) Gandus',
    code: 'DISTANHAN_UPTD_RPH',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pemotongan hewan ruminansia dengan jaminan mutu ASUH',
  },
  {
    institutionCode: 'DISTANHAN',
    name: 'UPTD Pusat Kesehatan Hewan (Puskeswan)',
    code: 'DISTANHAN_UPTD_PUSKESWAN',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah pelayanan kesehatan hewan dan pencegahan penyakit zoonosis/rabies',
  },
  {
    institutionCode: 'DP3A',
    name: 'UPTD Perlindungan Perempuan dan Anak (PPA)',
    code: 'DP3A_UPTD_PPA',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah layanan penanganan, perlindungan, dan pendampingan korban kekerasan perempuan dan anak',
  },
  {
    institutionCode: 'DISDIK',
    name: 'UPTD Sanggar Kegiatan Belajar (SKB)',
    code: 'DISDIK_UPTD_SKB',
    workArea: null,
    description: 'Unit Pelaksana Teknis Daerah penyelenggaraan program pendidikan nonformal dan kesetaraan',
  },
];

async function run() {
  console.log('====================================================');
  console.log('1. PRE-CHECK DATA & DATABASE STATE');
  console.log('====================================================');

  if (VERIFIED_UNITS_14.length !== 14) {
    throw new Error(`Kandidat unit harus tepat 14, ditemukan ${VERIFIED_UNITS_14.length}`);
  }

  // Pre-validate unit codes and uniqueness
  const unitCodes = new Set<string>();
  const unitNames = new Set<string>();
  for (const u of VERIFIED_UNITS_14) {
    if (!u.code || u.code.trim() === '') throw new Error(`Code kosong untuk unit ${u.name}`);
    if (unitCodes.has(u.code)) throw new Error(`Duplicate unit code: ${u.code}`);
    unitCodes.add(u.code);

    if (!u.name || u.name.trim() === '') throw new Error(`Name kosong untuk unit ${u.code}`);
    if (unitNames.has(u.name)) throw new Error(`Duplicate unit name: ${u.name}`);
    unitNames.add(u.name);
  }
  console.log('✓ Pre-validation kode dan nama unik lolos.');

  // Check database counts prior to import
  const [
    { count: preInstCount },
    { count: preUnitCount },
    { count: preRuleCount },
  ] = await Promise.all([
    adminClient.from('institutions').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('authority_rules').select('*', { count: 'exact', head: true }),
  ]);

  console.log(`Pre-check counts -> institutions: ${preInstCount}, units: ${preUnitCount}, rules: ${preRuleCount}`);
  if (preInstCount !== 30) throw new Error(`Ekspektasi 30 institutions, ditemukan: ${preInstCount}`);
  if (preUnitCount !== 0) throw new Error(`Ekspektasi 0 units sebelum import, ditemukan: ${preUnitCount}`);
  if (preRuleCount !== 0) throw new Error(`Ekspektasi 0 authority_rules, ditemukan: ${preRuleCount}`);

  console.log('\n====================================================');
  console.log('2. RESOLVE PARENT INSTITUTIONS (CODE -> ID)');
  console.log('====================================================');

  const { data: dbInstitutions, error: instFetchErr } = await adminClient
    .from('institutions')
    .select('id, code, name');

  if (instFetchErr || !dbInstitutions) {
    throw new Error(`Gagal membaca institutions: ${instFetchErr?.message}`);
  }

  const instMap = new Map<string, { id: string; name: string }>();
  for (const inst of dbInstitutions) {
    instMap.set(inst.code, { id: inst.id, name: inst.name });
  }

  // Map units to payload with resolved institution_id
  const payload = VERIFIED_UNITS_14.map((unit) => {
    const parent = instMap.get(unit.institutionCode);
    if (!parent) {
      throw new Error(`Parent institution dengan code '${unit.institutionCode}' TIDAK DITEMUKAN di database! Operasi dibatalkan.`);
    }
    return {
      institution_id: parent.id,
      code: unit.code,
      name: unit.name,
      work_area: unit.workArea,
      description: unit.description,
      is_active: true,
      updated_at: new Date().toISOString(),
    };
  });

  console.log(`✓ Seluruh 14 unit berhasil me-resolve institution_id induk masing-masing secara valid.`);

  console.log('\n====================================================');
  console.log('3. EXECUTING DETERMINISTIC UPSERT ON CODE');
  console.log('====================================================');

  const { data: insertedUnits, error: insertErr } = await adminClient
    .from('institution_units')
    .upsert(payload, { onConflict: 'code' })
    .select('id, code, name, institution_id, is_active');

  if (insertErr) {
    throw new Error(`Gagal melakukan upsert unit: ${insertErr.message}`);
  }

  console.log(`✓ Berhasil upsert ${insertedUnits?.length} institution_units.`);

  console.log('\n====================================================');
  console.log('4. VERIFY IMPORT INTEGRITY & PARENT MAPPING');
  console.log('====================================================');

  const { data: allUnits, error: fetchAllErr } = await adminClient
    .from('institution_units')
    .select('id, code, name, institution_id, is_active, institutions(code, name)')
    .order('name');

  if (fetchAllErr || !allUnits) {
    throw new Error(`Gagal membaca ulang units: ${fetchAllErr?.message}`);
  }

  if (allUnits.length !== 14) {
    throw new Error(`Ekspektasi 14 units, ditemukan ${allUnits.length}`);
  }

  for (const u of allUnits) {
    const expected = VERIFIED_UNITS_14.find((v) => v.code === u.code);
    if (!expected) throw new Error(`Unit tidak terdaftar ditemukan: ${u.code}`);
    const parentInst = u.institutions as unknown as { code: string; name: string } | null;
    if (!parentInst || parentInst.code !== expected.institutionCode) {
      throw new Error(`Mismatched parent! Unit ${u.code} parent code adalah ${parentInst?.code}, harusnya ${expected.institutionCode}`);
    }
    if (!u.is_active) {
      throw new Error(`Unit ${u.code} tidak aktif!`);
    }
  }

  console.log('✓ Seluruh 14 unit terverifikasi memiliki FK yang tepat ke induk masing-masing.');

  console.log('\n====================================================');
  console.log('5. IDEMPOTENCY VERIFICATION (RE-RUN UPSERT)');
  console.log('====================================================');

  const { error: rerunErr } = await adminClient
    .from('institution_units')
    .upsert(payload, { onConflict: 'code' });

  if (rerunErr) throw new Error(`Rerun upsert error: ${rerunErr.message}`);

  const { count: rerunCount } = await adminClient
    .from('institution_units')
    .select('*', { count: 'exact', head: true });

  console.log(`Jumlah units setelah re-run upsert: ${rerunCount} (Harus tetap 14)`);
  if (rerunCount !== 14) {
    throw new Error(`Idempotency gagal! Count berubah menjadi ${rerunCount}`);
  }
  console.log('✓ Idempotency terverifikasi sempurna (tidak ada duplikasi baris).');

  console.log('\n====================================================');
  console.log('6. RLS VERIFICATION');
  console.log('====================================================');

  // Anonymous check: should be blocked
  const { data: anonUnits, error: anonErr } = await anonClient
    .from('institution_units')
    .select('*');

  console.log('Anon client query result:', {
    rowCount: anonUnits?.length ?? 0,
    error: anonErr?.message ?? null,
  });
  if (anonUnits && anonUnits.length > 0) {
    throw new Error('RLS Breach: Anon client dapat membaca institution_units!');
  }
  console.log('✓ Anon access blocked: 0 rows returned (RLS aktif).');

  // Staff / admin check: should return 14
  const { data: staffUnits, error: staffErr } = await adminClient
    .from('institution_units')
    .select('code, name');

  console.log('Staff/Admin query result:', {
    rowCount: staffUnits?.length ?? 0,
    error: staffErr?.message ?? null,
  });
  if (!staffUnits || staffUnits.length !== 14) {
    throw new Error(`Staff gagal membaca 14 rows units! rowCount: ${staffUnits?.length}`);
  }
  console.log('✓ Staff/Admin access verified: 14 rows terbaca.');

  console.log('\n====================================================');
  console.log('7. REGRESSION COUNTS CHECK');
  console.log('====================================================');

  const [
    { count: postCat },
    { count: postKec },
    { count: postKel },
    { count: postInst },
    { count: postUnit },
    { count: postRule },
    { count: postRep },
  ] = await Promise.all([
    adminClient.from('categories').select('*', { count: 'exact', head: true }),
    adminClient.from('kecamatan').select('*', { count: 'exact', head: true }),
    adminClient.from('kelurahan').select('*', { count: 'exact', head: true }),
    adminClient.from('institutions').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('authority_rules').select('*', { count: 'exact', head: true }),
    adminClient.from('reports').select('*', { count: 'exact', head: true }),
  ]);

  const summary = {
    categories: postCat,
    kecamatan: postKec,
    kelurahan: postKel,
    institutions: postInst,
    institution_units: postUnit,
    authority_rules: postRule,
    reports: postRep,
  };
  console.log(summary);

  if (postCat !== 4) throw new Error(`Regresi categories: ${postCat} != 4`);
  if (postKec !== 18) throw new Error(`Regresi kecamatan: ${postKec} != 18`);
  if (postKel !== 107) throw new Error(`Regresi kelurahan: ${postKel} != 107`);
  if (postInst !== 30) throw new Error(`Regresi institutions: ${postInst} != 30`);
  if (postUnit !== 14) throw new Error(`Regresi institution_units: ${postUnit} != 14`);
  if (postRule !== 0) throw new Error(`Regresi authority_rules: ${postRule} != 0`);
  if (postRep !== 0) throw new Error(`Regresi reports: ${postRep} != 0`);

  console.log('✓ Seluruh counter regresi konsisten.');
  console.log('\n=== TAHAP 5A.4 IMPORT UNIT/UPT VERIFIED BERHASIL ===');
}

run().catch((err) => {
  console.error('ERROR IN IMPORT PROCESS:', err);
  process.exit(1);
});
