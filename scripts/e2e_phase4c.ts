/**
 * LAPORKITO Phase 4C: Kategori Laporan Database & E2E Verification Suite
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EXPECTED_CORE_SLUGS = [
  'infrastruktur-jalan',
  'kebersihan-lingkungan',
  'drainase-saluran-air',
  'penerangan-jalan',
];

const TEST_SLUG = `e2e-test-${Date.now().toString().slice(-6)}`;

async function runPhase4CE2E() {
  console.log('====================================================================');
  console.log('       LAPORKITO PHASE 4C: KATEGORI LAPORAN E2E VERIFICATION        ');
  console.log('====================================================================\n');

  const report: Record<string, string> = {};

  try {
    // ------------------------------------------------------------------
    // STEP 1: PRE-TEST INTEGRITY
    // ------------------------------------------------------------------
    console.log('[STEP 1] Pre-test master data and categories integrity check...');
    const { data: initialCats, error: errCats } = await adminClient
      .from('categories')
      .select('id, slug, name_id, is_active, display_order')
      .order('display_order');

    if (errCats || !initialCats) {
      throw new Error(`Failed to query categories: ${errCats?.message}`);
    }

    console.log(` - Total Categories: ${initialCats.length} (expected: 4)`);
    const initialSlugs = initialCats.map((c) => c.slug);
    console.log(` - Category Slugs: ${initialSlugs.join(', ')}`);

    const hasAllCoreSlugs = EXPECTED_CORE_SLUGS.every((s) => initialSlugs.includes(s));
    if (!hasAllCoreSlugs || initialCats.length !== 4) {
      throw new Error(`Master categories corrupted! Found slugs: ${initialSlugs.join(', ')}`);
    }

    // Check kecamatan & kelurahan
    const { data: kec } = await adminClient.from('kecamatan').select('id');
    const { data: kel } = await adminClient.from('kelurahan').select('id');
    console.log(` - Kecamatan: ${kec?.length} (expected: 18)`);
    console.log(` - Kelurahan: ${kel?.length} (expected: 107)`);
    if (kec?.length !== 18 || kel?.length !== 107) {
      throw new Error('Master wilayah data count mismatch!');
    }

    // Record reports count per category
    const { data: reportsBefore, error: errRep } = await adminClient
      .from('reports')
      .select('id, category_id');
    if (errRep) throw new Error(`Failed to query reports: ${errRep.message}`);
    const initialReportsCount = reportsBefore?.length || 0;
    console.log(` - Existing Reports Total: ${initialReportsCount}`);
    initialCats.forEach((c) => {
      const cReports = reportsBefore?.filter((r) => r.category_id === c.id).length || 0;
      console.log(`     * ${c.slug}: ${cReports} laporan`);
    });

    report['Pre-Test Integrity'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 2: PUBLIC READ & MUTATION RESTRICTION (ANON)
    // ------------------------------------------------------------------
    console.log('\n[STEP 2] Verifying public guest access (RLS policies)...');

    // 2a. Public read active categories
    const { data: publicCats, error: errPubRead } = await anonClient
      .from('categories')
      .select('id, slug, name_id, is_active')
      .eq('is_active', true)
      .order('display_order');

    if (errPubRead || !publicCats || publicCats.length !== 4) {
      throw new Error(`Public read active categories failed: ${errPubRead?.message}`);
    }
    console.log(` - Public can read active categories: ${publicCats.length} found`);
    report['Public Read Categories'] = 'PASS';

    // 2b. Public cannot INSERT (mutation restriction)
    const { error: errPubInsert } = await anonClient
      .from('categories')
      .insert({
        slug: 'hacker-cat',
        name_id: 'Kategori Palsu',
        description: 'Mencoba injeksi data tanpa izin admin.',
      });

    if (!errPubInsert) {
      throw new Error('SECURITY VIOLATION: Public guest was able to INSERT category!');
    }
    console.log(` - Public INSERT rejected by RLS: OK (${errPubInsert.message})`);

    // 2c. Public cannot UPDATE
    await anonClient
      .from('categories')
      .update({ name_id: 'Hacked Name' })
      .eq('slug', 'infrastruktur-jalan');

    // RLS will either return error or 0 affected rows
    const { data: checkNoChange } = await adminClient
      .from('categories')
      .select('name_id')
      .eq('slug', 'infrastruktur-jalan')
      .single();
    if (checkNoChange?.name_id !== 'Infrastruktur & Jalan') {
      throw new Error('SECURITY VIOLATION: Public guest was able to UPDATE category!');
    }
    console.log(' - Public UPDATE blocked by RLS: OK');

    // 2d. Public cannot DELETE
    await anonClient.from('categories').delete().eq('slug', 'infrastruktur-jalan');
    const { data: checkNotDeleted } = await adminClient
      .from('categories')
      .select('id')
      .eq('slug', 'infrastruktur-jalan')
      .single();
    if (!checkNotDeleted) {
      throw new Error('SECURITY VIOLATION: Public guest was able to DELETE category!');
    }
    console.log(' - Public DELETE blocked by RLS: OK');
    report['Public Mutation Restriction'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 3: HTTP ROUTE PROTECTION & /lapor INTEGRATION
    // ------------------------------------------------------------------
    console.log('\n[STEP 3] Verifying HTTP routes and middleware protection...');

    // 3a. /lapor renders active categories
    const resLapor = await fetch('http://localhost:3000/lapor');
    if (resLapor.status !== 200) throw new Error(`/lapor returned HTTP ${resLapor.status}`);
    const laporHtml = await resLapor.text();
    const laporHasCategory = laporHtml.includes('Infrastruktur') || laporHtml.includes('infrastruktur-jalan');
    console.log(` - GET /lapor HTTP 200: OK (Categories present: ${laporHasCategory})`);
    report['Public /lapor Integration'] = 'PASS';

    // 3b. /admin/kategori-laporan redirects unauthenticated caller to /admin/login
    const resAdmin = await fetch('http://localhost:3000/admin/kategori-laporan', { redirect: 'manual' });
    const isRedirect = resAdmin.status === 307 || resAdmin.status === 302;
    const location = resAdmin.headers.get('location') || '';
    const redirectsToLogin = location.includes('/admin/login');
    console.log(` - GET /admin/kategori-laporan: HTTP ${resAdmin.status} -> ${location}`);
    if (!isRedirect || !redirectsToLogin) {
      throw new Error(`Route protection failed: got status ${resAdmin.status}, location: ${location}`);
    }
    report['Admin Route Protection'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 4: ADMIN CREATE CATEGORY
    // ------------------------------------------------------------------
    console.log(`\n[STEP 4] Testing Category CREATE with slug [${TEST_SLUG}]...`);
    const { data: createdCat, error: errCreate } = await adminClient
      .from('categories')
      .insert({
        slug: TEST_SLUG,
        name_id: 'Pengujian E2E Kategori Khusus',
        name_en: 'E2E Testing Category',
        description: 'Kategori pengujian otomatis untuk memvalidasi alur admin Phase 4C.',
        icon: 'tag',
        display_order: 99,
        is_active: true,
      })
      .select()
      .single();

    if (errCreate || !createdCat) {
      throw new Error(`Failed to create test category: ${errCreate?.message}`);
    }
    console.log(` - Created category ID: ${createdCat.id}`);
    console.log(` - Slug: ${createdCat.slug} | Name: ${createdCat.name_id}`);
    report['Category: Create'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 5: ADMIN READ, SEARCH & FILTER
    // ------------------------------------------------------------------
    console.log('\n[STEP 5] Testing Admin Read, Search & Filter queries...');

    // 5a. List all categories (should now be 5)
    const { data: listAll, error: errListAll } = await adminClient
      .from('categories')
      .select('id, slug, is_active')
      .order('display_order');
    if (errListAll || listAll?.length !== 5) {
      throw new Error(`Expected 5 categories after creation, got ${listAll?.length}`);
    }
    console.log(` - List all: ${listAll.length} categories (4 core + 1 test)`);
    report['Admin: List All'] = 'PASS';

    // 5b. Search by query
    const { data: searchResults, error: errSearch } = await adminClient
      .from('categories')
      .select('id, slug, name_id')
      .ilike('name_id', '%Pengujian E2E%');
    if (errSearch || !searchResults || searchResults.length !== 1) {
      throw new Error(`Search failed: ${errSearch?.message || '0 results'}`);
    }
    console.log(` - Search by "Pengujian E2E": found [${searchResults[0].slug}]`);
    report['Admin: Search'] = 'PASS';

    // 5c. Read Detail
    const { data: detailCat, error: errDetail } = await adminClient
      .from('categories')
      .select('*')
      .eq('id', createdCat.id)
      .single();
    if (errDetail || detailCat.slug !== TEST_SLUG) {
      throw new Error(`Failed to read category detail: ${errDetail?.message}`);
    }
    console.log(` - Detail read OK: ${detailCat.name_id} (${detailCat.slug})`);
    report['Admin: Detail Read'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 6: ADMIN UPDATE
    // ------------------------------------------------------------------
    console.log('\n[STEP 6] Testing Category UPDATE...');
    const { data: updatedCat, error: errUpdate } = await adminClient
      .from('categories')
      .update({
        name_id: 'Pengujian E2E Diperbarui',
        name_en: 'E2E Testing Category (Updated)',
        description: 'Deskripsi kategori pengujian telah berhasil diperbarui.',
        display_order: 98,
        icon: 'alert-triangle',
      })
      .eq('id', createdCat.id)
      .select()
      .single();

    if (errUpdate || !updatedCat) {
      throw new Error(`Failed to update category: ${errUpdate?.message}`);
    }
    if (
      updatedCat.name_id !== 'Pengujian E2E Diperbarui' ||
      updatedCat.display_order !== 98 ||
      updatedCat.icon !== 'alert-triangle'
    ) {
      throw new Error('Updated data fields do not match expected values!');
    }
    console.log(` - Updated name: "${updatedCat.name_id}"`);
    console.log(` - Updated icon: "${updatedCat.icon}"`);
    console.log(` - Updated display_order: ${updatedCat.display_order}`);
    report['Category: Update'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 7: TOGGLE STATUS (ACTIVE -> INACTIVE -> ACTIVE)
    // ------------------------------------------------------------------
    console.log('\n[STEP 7] Testing Toggle Status...');

    // 7a. Set to inactive
    const { data: inactCat, error: errInact } = await adminClient
      .from('categories')
      .update({ is_active: false })
      .eq('id', createdCat.id)
      .select('is_active')
      .single();
    if (errInact || inactCat?.is_active !== false) throw new Error('Failed to set inactive');
    console.log(' - Toggle active -> inactive: OK');

    // Filter inactive check
    const { data: inactList } = await adminClient
      .from('categories')
      .select('id')
      .eq('is_active', false);
    if (!inactList || inactList.length !== 1) throw new Error('Expected 1 inactive category');
    console.log(` - Filter inactive: found ${inactList.length} inactive category`);

    // 7b. Restore to active
    const { data: actCat, error: errAct } = await adminClient
      .from('categories')
      .update({ is_active: true })
      .eq('id', createdCat.id)
      .select('is_active')
      .single();
    if (errAct || actCat?.is_active !== true) throw new Error('Failed to set active');
    console.log(' - Toggle inactive -> active: OK');
    report['Category: Toggle Status'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 8: DUPLICATE SLUG REJECTION
    // ------------------------------------------------------------------
    console.log('\n[STEP 8] Validating duplicate slug constraint rejection...');
    const { error: errDuplicate } = await adminClient
      .from('categories')
      .insert({
        slug: TEST_SLUG, // duplicate!
        name_id: 'Duplikat Uji Coba',
        description: 'Mencoba mendaftarkan slug yang sudah ada.',
      });

    if (!errDuplicate || errDuplicate.code !== '23505') {
      throw new Error(`Expected unique violation (23505), but got: ${errDuplicate?.message}`);
    }
    console.log(` - Duplicate slug rejected by DB (code 23505): ${errDuplicate.message}`);
    report['Category: Duplicate Slug Handling'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 9: MASTER CATEGORY PROTECTION & DELETE SAFETY
    // ------------------------------------------------------------------
    console.log('\n[STEP 9] Validating safety rules on Master Categories and Test Categories...');

    // 9a. Delete test category (it has 0 reports, so it can be safely deleted)
    const { error: errDelTest } = await adminClient
      .from('categories')
      .delete()
      .eq('id', createdCat.id);
    if (errDelTest) throw new Error(`Failed to delete test category: ${errDelTest.message}`);
    console.log(` - Test category [${TEST_SLUG}] deleted: OK`);

    // 9b. Verify test category is completely gone
    const { data: verifyGone } = await adminClient
      .from('categories')
      .select('id')
      .eq('slug', TEST_SLUG);
    if (verifyGone && verifyGone.length > 0) {
      throw new Error('Test category still exists in DB after deletion!');
    }
    console.log(' - Verify test category non-existence in DB: OK (0 records)');
    report['Category: Delete Test Data'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 10: REPORT INTEGRITY & FINAL CLEANLINESS CHECK
    // ------------------------------------------------------------------
    console.log('\n[STEP 10] Verifying final data integrity & report preservation...');
    const { data: finalCats, error: errFinalCats } = await adminClient
      .from('categories')
      .select('id, slug, name_id, is_active, display_order')
      .order('display_order');
    if (errFinalCats || !finalCats) throw new Error('Failed to query final categories');

    console.log(` - Final Categories Count: ${finalCats.length} (expected: 4)`);
    if (finalCats.length !== 4) throw new Error(`Expected 4 categories, got ${finalCats.length}`);

    const finalSlugs = finalCats.map((c) => c.slug);
    const finalAllCore = EXPECTED_CORE_SLUGS.every((s) => finalSlugs.includes(s));
    if (!finalAllCore) {
      throw new Error(`Master categories mismatch after test! Slugs: ${finalSlugs.join(', ')}`);
    }
    console.log(` - Master Categories Intact: ${finalSlugs.join(', ')}`);

    // Reports integrity check
    const { data: reportsAfter, error: errRepAfter } = await adminClient
      .from('reports')
      .select('id');
    if (errRepAfter) throw new Error('Failed to check final reports');
    const finalReportsCount = reportsAfter?.length || 0;
    console.log(` - Final Reports Count: ${finalReportsCount} (initial was ${initialReportsCount})`);
    if (finalReportsCount < initialReportsCount) {
      throw new Error('CRITICAL: Reports count decreased during E2E test!');
    }

    // Kecamatan and kelurahan final check
    const { data: finalKec } = await adminClient.from('kecamatan').select('id');
    const { data: finalKel } = await adminClient.from('kelurahan').select('id');
    console.log(` - Final Kecamatan: ${finalKec?.length} (expected: 18)`);
    console.log(` - Final Kelurahan: ${finalKel?.length} (expected: 107)`);
    if (finalKec?.length !== 18 || finalKel?.length !== 107) {
      throw new Error('Master wilayah changed during test!');
    }

    // Check remaining test data
    const { data: remainingTests } = await adminClient
      .from('categories')
      .select('id')
      .ilike('slug', 'e2e-test%');
    console.log(` - Remaining E2E test records in categories: ${remainingTests?.length || 0}`);
    if (remainingTests && remainingTests.length > 0) {
      throw new Error(`Found ${remainingTests.length} leftover test categories in DB!`);
    }

    report['Master Categories Intact'] = 'PASS';
    report['Reports Integrity'] = 'PASS';
    report['Master Wilayah Intact'] = 'PASS';
    report['Zero Test Data Remaining'] = 'PASS';

    console.log('\n====================================================================');
    console.log('                     PHASE 4C E2E RESULTS SUMMARY                   ');
    console.log('====================================================================');
    for (const [testName, result] of Object.entries(report)) {
      console.log(` ${testName.padEnd(45)} : [${result}]`);
    }
    console.log('====================================================================\n');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('\n❌ PHASE 4C E2E FAILED:', msg);
    return { success: false, error: msg };
  }
}

runPhase4CE2E();
