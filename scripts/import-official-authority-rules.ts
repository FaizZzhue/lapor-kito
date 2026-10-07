import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthorityRuleSeed {
  ruleCode: string;
  categorySlug: string;
  institutionCode: string;
  unitCode: string | null;
  kecamatanId: string | null;
  contextTitle: string;
  contextDescription: string;
  regulationBasis: string;
  isActive: boolean;
}

export const VERIFIED_RULES_5: AuthorityRuleSeed[] = [
  {
    ruleCode: 'RULE_JALAN_KOTA',
    categorySlug: 'infrastruktur-jalan',
    institutionCode: 'DPUPR',
    unitCode: null,
    kecamatanId: null,
    contextTitle: 'Pemeliharaan dan Perbaikan Jalan Kota',
    contextDescription:
      'Penanganan kerusakan, penambalan lubang, dan rehabilitasi konstruksi ruas jalan yang berstatus sebagai jalan kewenangan Pemerintah Kota Palembang.',
    regulationBasis:
      'UU No. 38 Tahun 2004 jo UU No. 2 Tahun 2022 tentang Jalan; PP No. 34 Tahun 2006 tentang Jalan (Pasal 27 & 30); Peraturan Walikota Palembang Nomor 38 Tahun 2022 tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi Dinas Pekerjaan Umum dan Penataan Ruang Kota Palembang.',
    isActive: true,
  },
  {
    ruleCode: 'RULE_KEBERSIHAN_KOTA',
    categorySlug: 'kebersihan-lingkungan',
    institutionCode: 'DLH',
    unitCode: null,
    kecamatanId: null,
    contextTitle: 'Pengangkutan Sampah dan Kebersihan Ruang Publik',
    contextDescription:
      'Pengangkutan sampah dari Tempat Penampungan Sementara (TPS), pembersihan sampah liar di ruang publik, jalan protokol, dan fasilitas umum Kota Palembang.',
    regulationBasis:
      'UU No. 18 Tahun 2008 tentang Pengelolaan Sampah; Peraturan Daerah Kota Palembang Nomor 3 Tahun 2015 jo Peraturan Daerah Nomor 3 Tahun 2020 tentang Pengelolaan Sampah Rumah Tangga dan Sampah Sejenis Sampah Rumah Tangga; Peraturan Walikota Palembang Nomor 65 Tahun 2022 tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi Dinas Lingkungan Hidup Kota Palembang.',
    isActive: true,
  },
  {
    ruleCode: 'RULE_TPA_SUKAWINATAN',
    categorySlug: 'kebersihan-lingkungan',
    institutionCode: 'DLH',
    unitCode: 'DLH_UPTD_TPA_SUKAWINATAN',
    kecamatanId: null,
    contextTitle: 'Pengelolaan Pemrosesan Akhir Sampah di TPA Sukawinatan',
    contextDescription:
      'Penimbangan armada sampah, pemrosesan akhir, penataan zona timbunan sampah, dan pengelolaan kolam lindi di Tempat Pemrosesan Akhir Sukawinatan.',
    regulationBasis:
      'Peraturan Daerah Kota Palembang Nomor 3 Tahun 2015 jo Peraturan Daerah Nomor 3 Tahun 2020 tentang Pengelolaan Sampah; Peraturan Walikota Palembang Nomor 65 Tahun 2022; Keputusan Walikota tentang Pembentukan UPTD TPA Sukawinatan.',
    isActive: true,
  },
  {
    ruleCode: 'RULE_DRAINASE_KOTA',
    categorySlug: 'drainase-saluran-air',
    institutionCode: 'DPUPR',
    unitCode: null,
    kecamatanId: null,
    contextTitle: 'Pemeliharaan Saluran Drainase Perkotaan dan Kolam Retensi',
    contextDescription:
      'Pengerukan sedimentasi lumpur, pembersihan hambatan aliran air, pemeliharaan dinding penahan drainase kota, dan pengelolaan kolam retensi pengendali genangan air di Kota Palembang.',
    regulationBasis:
      'UU No. 17 Tahun 2019 tentang Sumber Daya Air; Peraturan Daerah Kota Palembang Nomor 6 Tahun 2016 jo Peraturan Daerah Nomor 6 Tahun 2022; Peraturan Walikota Palembang Nomor 38 Tahun 2022 tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi Dinas Pekerjaan Umum dan Penataan Ruang Kota Palembang.',
    isActive: true,
  },
  {
    ruleCode: 'RULE_PJU_KOTA',
    categorySlug: 'penerangan-jalan',
    institutionCode: 'DISHUB',
    unitCode: null,
    kecamatanId: null,
    contextTitle: 'Pemeliharaan dan Perbaikan Penerangan Jalan Umum',
    contextDescription:
      'Perbaikan lampu PJU padam, penggantian komponen lampu LED/merkuri, perbaikan jaringan kabel dan panel PJU di ruas jalan Kota Palembang.',
    regulationBasis:
      'UU No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (Pasal 25 ayat 1 huruf g); UU No. 23 Tahun 2014 tentang Pemerintahan Daerah; Berita Acara Serah Terima (BAST) dan Keputusan Walikota Palembang per 1 Januari 2025 tentang Pengalihan Pengelolaan dan Personel PJU dari Dinas Perkimtan ke Dinas Perhubungan Kota Palembang.',
    isActive: true,
  },
];

async function run() {
  console.log('====================================================');
  console.log('1. PRE-CHECK DATA & DATABASE STATE');
  console.log('====================================================');

  if (VERIFIED_RULES_5.length !== 5) {
    throw new Error(`Kandidat rule harus tepat 5, ditemukan ${VERIFIED_RULES_5.length}`);
  }

  const [
    { count: preInstCount },
    { count: preUnitCount },
    { count: preRuleCount },
    { count: preCatCount },
    { count: preKecCount },
    { count: preKelCount },
    { count: preRepCount },
  ] = await Promise.all([
    adminClient.from('institutions').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('authority_rules').select('*', { count: 'exact', head: true }),
    adminClient.from('categories').select('*', { count: 'exact', head: true }),
    adminClient.from('kecamatan').select('*', { count: 'exact', head: true }),
    adminClient.from('kelurahan').select('*', { count: 'exact', head: true }),
    adminClient.from('reports').select('*', { count: 'exact', head: true }),
  ]);

  console.log({
    categories: preCatCount,
    kecamatan: preKecCount,
    kelurahan: preKelCount,
    institutions: preInstCount,
    institution_units: preUnitCount,
    authority_rules: preRuleCount,
    reports: preRepCount,
  });

  if (preCatCount !== 4) throw new Error(`Categories ${preCatCount} != 4`);
  if (preKecCount !== 18) throw new Error(`Kecamatan ${preKecCount} != 18`);
  if (preKelCount !== 107) throw new Error(`Kelurahan ${preKelCount} != 107`);
  if (preInstCount !== 30) throw new Error(`Institutions ${preInstCount} != 30`);
  if (preUnitCount !== 14) throw new Error(`Units ${preUnitCount} != 14`);
  if (preRuleCount !== 0) throw new Error(`Rules ${preRuleCount} != 0 sebelum import`);
  if (preRepCount !== 0) throw new Error(`Reports ${preRepCount} != 0`);

  console.log('✓ Pre-check state database lolos: 0 rules sebelum import.');

  console.log('\n====================================================');
  console.log('2. RESOLVE FOREIGN KEYS DYNAMICALLY');
  console.log('====================================================');

  // Fetch all categories
  const { data: dbCategories, error: catErr } = await adminClient
    .from('categories')
    .select('id, slug, name_id');
  if (catErr || !dbCategories) throw new Error(`Gagal fetch categories: ${catErr?.message}`);

  const catMap = new Map<string, string>();
  for (const c of dbCategories) {
    catMap.set(c.slug, c.id);
  }

  // Fetch all institutions
  const { data: dbInstitutions, error: instErr } = await adminClient
    .from('institutions')
    .select('id, code, name');
  if (instErr || !dbInstitutions) throw new Error(`Gagal fetch institutions: ${instErr?.message}`);

  const instMap = new Map<string, string>();
  for (const i of dbInstitutions) {
    instMap.set(i.code, i.id);
  }

  // Fetch all units
  const { data: dbUnits, error: unitErr } = await adminClient
    .from('institution_units')
    .select('id, code, name, institution_id');
  if (unitErr || !dbUnits) throw new Error(`Gagal fetch units: ${unitErr?.message}`);

  const unitMap = new Map<string, { id: string; institution_id: string }>();
  for (const u of dbUnits) {
    unitMap.set(u.code, { id: u.id, institution_id: u.institution_id });
  }

  // Build payload
  const payload = VERIFIED_RULES_5.map((rule) => {
    const categoryId = catMap.get(rule.categorySlug);
    if (!categoryId) {
      throw new Error(`Category slug '${rule.categorySlug}' tidak ditemukan!`);
    }

    const institutionId = instMap.get(rule.institutionCode);
    if (!institutionId) {
      throw new Error(`Institution code '${rule.institutionCode}' tidak ditemukan!`);
    }

    let institutionUnitId: string | null = null;
    if (rule.unitCode) {
      const u = unitMap.get(rule.unitCode);
      if (!u) {
        throw new Error(`Unit code '${rule.unitCode}' tidak ditemukan!`);
      }
      if (u.institution_id !== institutionId) {
        throw new Error(`Composite FK mismatch! Unit '${rule.unitCode}' bukan milik institution '${rule.institutionCode}'!`);
      }
      institutionUnitId = u.id;
    }

    return {
      rule_code: rule.ruleCode,
      category_id: categoryId,
      kecamatan_id: null,
      context_title: rule.contextTitle,
      context_description: rule.contextDescription,
      institution_id: institutionId,
      institution_unit_id: institutionUnitId,
      regulation_basis: rule.regulationBasis,
      is_active: rule.isActive,
      updated_at: new Date().toISOString(),
    };
  });

  console.log(`✓ Resolusi FK berhasil untuk seluruh 5 rule.`);

  console.log('\n====================================================');
  console.log('3. EXECUTING DETERMINISTIC UPSERT ON rule_code');
  console.log('====================================================');

  const { data: insertedRules, error: insertErr } = await adminClient
    .from('authority_rules')
    .upsert(payload, { onConflict: 'rule_code' })
    .select('id, rule_code, context_title, institution_id, institution_unit_id, category_id, is_active');

  if (insertErr) {
    throw new Error(`Gagal upsert authority_rules: ${insertErr.message}`);
  }

  console.log(`✓ Berhasil upsert ${insertedRules?.length} authority_rules.`);

  console.log('\n====================================================');
  console.log('4. VERIFY IMPORT INTEGRITY & RELATIONS');
  console.log('====================================================');

  const { data: allRules, error: fetchErr } = await adminClient
    .from('authority_rules')
    .select(`
      id,
      rule_code,
      context_title,
      context_description,
      regulation_basis,
      is_active,
      kecamatan_id,
      categories(slug, name_id),
      institutions(code, name),
      institution_units(code, name)
    `)
    .order('rule_code');

  if (fetchErr || !allRules) {
    throw new Error(`Gagal fetch rules: ${fetchErr?.message}`);
  }

  if (allRules.length !== 5) {
    throw new Error(`Ekspektasi 5 rules, ditemukan ${allRules.length}`);
  }

  for (const r of allRules) {
    const expected = VERIFIED_RULES_5.find((v) => v.ruleCode === r.rule_code);
    if (!expected) throw new Error(`Rule tidak terdaftar ditemukan: ${r.rule_code}`);

    const cat = r.categories as unknown as { slug: string; name_id: string } | null;
    const inst = r.institutions as unknown as { code: string; name: string } | null;
    const unit = r.institution_units as unknown as { code: string; name: string } | null;

    if (!cat || cat.slug !== expected.categorySlug) {
      throw new Error(`Mismatch category for ${r.rule_code}: ${cat?.slug} != ${expected.categorySlug}`);
    }
    if (!inst || inst.code !== expected.institutionCode) {
      throw new Error(`Mismatch institution for ${r.rule_code}: ${inst?.code} != ${expected.institutionCode}`);
    }
    if (expected.unitCode) {
      if (!unit || unit.code !== expected.unitCode) {
        throw new Error(`Mismatch unit for ${r.rule_code}: ${unit?.code} != ${expected.unitCode}`);
      }
    } else {
      if (unit !== null) {
        throw new Error(`Unit should be NULL for ${r.rule_code}, got ${unit}`);
      }
    }
    if (r.kecamatan_id !== null) {
      throw new Error(`kecamatan_id should be NULL for ${r.rule_code}, got ${r.kecamatan_id}`);
    }
    if (!r.is_active) {
      throw new Error(`is_active should be true for ${r.rule_code}`);
    }
    if (!r.regulation_basis || r.regulation_basis.trim() === '') {
      throw new Error(`regulation_basis cannot be empty for ${r.rule_code}`);
    }
  }

  console.log('✓ Seluruh 5 rule terverifikasi valid, FK tepat, dan atribut sesuai ketentuan.');

  console.log('\n====================================================');
  console.log('5. IDEMPOTENCY VERIFICATION (RE-RUN UPSERT)');
  console.log('====================================================');

  const { error: rerunErr } = await adminClient
    .from('authority_rules')
    .upsert(payload, { onConflict: 'rule_code' });

  if (rerunErr) throw new Error(`Rerun upsert error: ${rerunErr.message}`);

  const { count: rerunCount } = await adminClient
    .from('authority_rules')
    .select('*', { count: 'exact', head: true });

  console.log(`Jumlah authority_rules setelah re-run upsert: ${rerunCount} (Harus tetap 5)`);
  if (rerunCount !== 5) {
    throw new Error(`Idempotency gagal! Count berubah menjadi ${rerunCount}`);
  }
  console.log('✓ Idempotency terverifikasi sempurna (tidak ada duplikasi baris).');

  console.log('\n====================================================');
  console.log('6. RLS VERIFICATION');
  console.log('====================================================');

  // Anonymous check: should return 0 rows
  const { data: anonRules, error: anonErr } = await anonClient
    .from('authority_rules')
    .select('*');

  console.log('Anon client query result:', {
    rowCount: anonRules?.length ?? 0,
    error: anonErr?.message ?? null,
  });
  if (anonRules && anonRules.length > 0) {
    throw new Error('RLS Breach: Anon client dapat membaca authority_rules!');
  }
  console.log('✓ Anon access blocked: 0 rows returned (RLS aktif).');

  // Service role / internal staff check: should return 5
  const { data: staffRules, error: staffErr } = await adminClient
    .from('authority_rules')
    .select('rule_code, context_title');

  console.log('Staff/Admin query result:', {
    rowCount: staffRules?.length ?? 0,
    error: staffErr?.message ?? null,
  });
  if (!staffRules || staffRules.length !== 5) {
    throw new Error(`Staff gagal membaca 5 rows authority_rules! rowCount: ${staffRules?.length}`);
  }
  console.log('✓ Staff/Admin access verified: 5 rows terbaca.');

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
  if (postRule !== 5) throw new Error(`Regresi authority_rules: ${postRule} != 5`);
  if (postRep !== 0) throw new Error(`Regresi reports: ${postRep} != 0`);

  console.log('✓ Seluruh counter regresi konsisten.');
  console.log('\n=== TAHAP 5B.2 IMPORT 5 MASTER DATA KEWENANGAN VERIFIED BERHASIL ===');
}

run().catch((err) => {
  console.error('ERROR IN IMPORT PROCESS:', err);
  process.exit(1);
});
