import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

export interface OfficialInstitutionSeed {
  code: string;
  name: string;
  short_name: string | null;
  category: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  mandate: string | null;
  is_active: boolean;
}

export const OFFICIAL_INSTITUTIONS_30: OfficialInstitutionSeed[] = [
  {
    code: 'DPUPR',
    name: 'Dinas Pekerjaan Umum dan Penataan Ruang',
    short_name: 'DPUPR',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DPRKPP',
    name: 'Dinas Perumahan Rakyat, Kawasan Permukiman dan Pertanahan',
    short_name: 'DPRKPP',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DLH',
    name: 'Dinas Lingkungan Hidup',
    short_name: 'DLH',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISHUB',
    name: 'Dinas Perhubungan',
    short_name: 'Dishub',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DAMKAR',
    name: 'Dinas Pemadam Kebakaran dan Penyelamatan',
    short_name: 'Damkar',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISKOMINFO',
    name: 'Dinas Komunikasi dan Informatika',
    short_name: 'Diskominfo',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'SATPOLPP',
    name: 'Satuan Polisi Pamong Praja',
    short_name: 'Satpol PP',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'BPBD',
    name: 'Badan Penanggulangan Bencana Daerah',
    short_name: 'BPBD',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DINKES',
    name: 'Dinas Kesehatan',
    short_name: 'Dinkes',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DINSOS',
    name: 'Dinas Sosial',
    short_name: 'Dinsos',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISDUKCAPIL',
    name: 'Dinas Kependudukan dan Pencatatan Sipil',
    short_name: 'Disdukcapil',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DPMPTSP',
    name: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu',
    short_name: 'DPMPTSP',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISDIK',
    name: 'Dinas Pendidikan',
    short_name: 'Disdik',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISDAG',
    name: 'Dinas Perdagangan',
    short_name: 'Disdag',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISKOPUKM',
    name: 'Dinas Koperasi, Usaha Kecil dan Menengah',
    short_name: 'Diskop UKM',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISNAKER',
    name: 'Dinas Ketenagakerjaan',
    short_name: 'Disnaker',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISPERIN',
    name: 'Dinas Perindustrian',
    short_name: 'Disperin',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISTANHAN',
    name: 'Dinas Pertanian dan Ketahanan Pangan',
    short_name: 'Distanhan',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISKAN',
    name: 'Dinas Perikanan',
    short_name: 'Diskan',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISBUD',
    name: 'Dinas Kebudayaan',
    short_name: 'Disbud',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISPAR',
    name: 'Dinas Pariwisata',
    short_name: 'Dispar',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISPORA',
    name: 'Dinas Kepemudaan dan Olahraga',
    short_name: 'Dispora',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DISPUSIP',
    name: 'Dinas Perpustakaan dan Kearsipan',
    short_name: 'Dispusip',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DP3A',
    name: 'Dinas Pemberdayaan Perempuan dan Perlindungan Anak',
    short_name: 'DP3A',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'DP2KB',
    name: 'Dinas Pengendalian Penduduk dan Keluarga Berencana',
    short_name: 'DP2KB',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'BAPENDA',
    name: 'Badan Pendapatan Daerah',
    short_name: 'Bapenda',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'BPKAD',
    name: 'Badan Pengelolaan Keuangan dan Aset Daerah',
    short_name: 'BPKAD',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'BAPPEDA_LITBANG',
    name: 'Badan Perencanaan Pembangunan Daerah, Penelitian dan Pengembangan',
    short_name: 'Bappeda Litbang',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'BKPSDM',
    name: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia',
    short_name: 'BKPSDM',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
  {
    code: 'BAKESBANGPOL',
    name: 'Badan Kesatuan Bangsa dan Politik',
    short_name: 'Bakesbangpol',
    category: 'Dinas / Badan Teknis',
    address: null,
    email: null,
    phone: null,
    mandate: null,
    is_active: true,
  },
];

async function run() {
  console.log('====================================================');
  console.log('1. PRE-VALIDATION CHECK');
  console.log('====================================================');

  if (OFFICIAL_INSTITUTIONS_30.length !== 30) {
    throw new Error(`Kandidat harus tepat 30, ditemukan ${OFFICIAL_INSTITUTIONS_30.length}`);
  }

  const codes = new Set<string>();
  const names = new Set<string>();

  const forbiddenNames = [
    'Inspektorat',
    'Sekretariat Daerah',
    'Sekretariat DPRD',
    'RSUD',
    'Kecamatan',
  ];

  for (const inst of OFFICIAL_INSTITUTIONS_30) {
    if (!inst.code || inst.code.trim() === '') {
      throw new Error(`Code tidak boleh kosong untuk: ${inst.name}`);
    }
    if (codes.has(inst.code)) {
      throw new Error(`Duplicate code terdeteksi: ${inst.code}`);
    }
    codes.add(inst.code);

    if (!inst.name || inst.name.trim() === '') {
      throw new Error(`Name tidak boleh kosong untuk code: ${inst.code}`);
    }
    if (names.has(inst.name)) {
      throw new Error(`Duplicate name terdeteksi: ${inst.name}`);
    }
    names.add(inst.name);

    for (const forbidden of forbiddenNames) {
      if (inst.name.toLowerCase().includes(forbidden.toLowerCase())) {
        throw new Error(`Nama terlarang / NEEDS_REVIEW ditemukan: ${inst.name}`);
      }
    }
  }

  console.log('✓ Pre-validation lolos: 30 kandidat unik, valid, dan bebas entitas terlarang.');

  console.log('\n====================================================');
  console.log('2. INITIAL DATABASE COUNT CHECK');
  console.log('====================================================');

  const { count: initialCount, error: countErr } = await adminClient
    .from('institutions')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    throw new Error(`Gagal membaca count awal institutions: ${countErr.message}`);
  }

  console.log(`Jumlah institutions sebelum import: ${initialCount}`);

  console.log('\n====================================================');
  console.log('3. EXECUTING DETERMINISTIC UPSERT ON CODE');
  console.log('====================================================');

  const { data: upsertData, error: upsertErr } = await adminClient
    .from('institutions')
    .upsert(
      OFFICIAL_INSTITUTIONS_30.map((inst) => ({
        code: inst.code,
        name: inst.name,
        short_name: inst.short_name,
        category: inst.category,
        address: inst.address,
        email: inst.email,
        phone: inst.phone,
        mandate: inst.mandate,
        is_active: inst.is_active,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'code' }
    )
    .select('id, code, name, is_active');

  if (upsertErr) {
    throw new Error(`Gagal mengeksekusi upsert institutions: ${upsertErr.message}`);
  }

  console.log(`✓ Berhasil melakukan upsert. Record count returned: ${upsertData?.length}`);

  console.log('\n====================================================');
  console.log('4. POST-IMPORT COUNT & INTEGRITY CHECK');
  console.log('====================================================');

  const { count: postCount } = await adminClient
    .from('institutions')
    .select('*', { count: 'exact', head: true });

  console.log(`Jumlah institutions setelah import: ${postCount}`);

  if (postCount !== 30) {
    throw new Error(`Ekspektasi 30 rows, ditemukan ${postCount}`);
  }

  console.log('\n====================================================');
  console.log('5. IDEMPOTENCY VERIFICATION (RE-RUN UPSERT)');
  console.log('====================================================');

  const { error: rerunErr } = await adminClient
    .from('institutions')
    .upsert(
      OFFICIAL_INSTITUTIONS_30.map((inst) => ({
        code: inst.code,
        name: inst.name,
        short_name: inst.short_name,
        category: inst.category,
        address: inst.address,
        email: inst.email,
        phone: inst.phone,
        mandate: inst.mandate,
        is_active: inst.is_active,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'code' }
    );

  if (rerunErr) {
    throw new Error(`Rerun upsert error: ${rerunErr.message}`);
  }

  const { count: rerunCount } = await adminClient
    .from('institutions')
    .select('*', { count: 'exact', head: true });

  console.log(`Jumlah institutions setelah re-run: ${rerunCount} (Harus tetap 30)`);
  if (rerunCount !== 30) {
    throw new Error(`Idempotency gagal! Count berubah menjadi ${rerunCount}`);
  }
  console.log('✓ Idempotency terverifikasi sempurna.');

  console.log('\n====================================================');
  console.log('6. RLS VERIFICATION');
  console.log('====================================================');

  // Anonymous client check
  const { data: anonData, error: anonErr } = await anonClient
    .from('institutions')
    .select('*');

  console.log('Anon client query result:', {
    rowCount: anonData?.length ?? 0,
    error: anonErr?.message ?? null,
  });
  if (anonData && anonData.length > 0) {
    throw new Error('RLS Breach: Anon client dapat membaca data internal institutions!');
  }
  console.log('✓ Anon access blocked: 0 rows returned (RLS aktif)');

  // Service role / staff check
  const { data: serviceData, error: serviceErr } = await adminClient
    .from('institutions')
    .select('code, name, is_active')
    .order('name', { ascending: true });

  console.log('Admin/Service role query result:', {
    rowCount: serviceData?.length ?? 0,
    error: serviceErr?.message ?? null,
  });
  if (!serviceData || serviceData.length !== 30) {
    throw new Error('Service role gagal membaca 30 rows institutions!');
  }
  console.log('✓ Admin/Staff access verified: 30 rows terbaca.');

  console.log('\n====================================================');
  console.log('7. REGRESSION COUNTS CHECK');
  console.log('====================================================');

  const [
    { count: catCount },
    { count: kecCount },
    { count: kelCount },
    { count: unitCount },
    { count: ruleCount },
    { count: repCount },
  ] = await Promise.all([
    adminClient.from('categories').select('*', { count: 'exact', head: true }),
    adminClient.from('kecamatan').select('*', { count: 'exact', head: true }),
    adminClient.from('kelurahan').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('authority_rules').select('*', { count: 'exact', head: true }),
    adminClient.from('reports').select('*', { count: 'exact', head: true }),
  ]);

  console.log({
    categories: catCount,
    kecamatan: kecCount,
    kelurahan: kelCount,
    institution_units: unitCount,
    authority_rules: ruleCount,
    reports: repCount,
  });

  if (catCount !== 4) throw new Error(`Regresi categories: ${catCount} != 4`);
  if (kecCount !== 18) throw new Error(`Regresi kecamatan: ${kecCount} != 18`);
  if (kelCount !== 107) throw new Error(`Regresi kelurahan: ${kelCount} != 107`);
  if (unitCount !== 0) throw new Error(`Regresi institution_units: ${unitCount} != 0`);
  if (ruleCount !== 0) throw new Error(`Regresi authority_rules: ${ruleCount} != 0`);
  if (repCount !== 0) throw new Error(`Regresi reports: ${repCount} != 0`);

  console.log('✓ Seluruh counter regresi konsisten.');
  console.log('\n=== TAHAP 5A.2 IMPORT DAN VERIFIKASI BERHASIL ===');
}

run().catch((err) => {
  console.error('ERROR IN IMPORT PROCESS:', err);
  process.exit(1);
});
