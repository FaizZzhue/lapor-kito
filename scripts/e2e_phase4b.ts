/**
 * LAPORKITO Phase 4B E2E Verification & Test Suite
 * 
 * Verifies:
 * 1. Database schema and tables (institutions & institution_units)
 * 2. Existing master data preservation (categories=4, kecamatan=18, kelurahan=107)
 * 3. Complete CRUD cycle for Institutions:
 *    - Empty state check
 *    - Create institution (isolated test data)
 *    - Detail & Read
 *    - Update institution
 *    - Toggle status (is_active)
 *    - Filter & Search
 *    - Duplicate code error validation
 * 4. Complete CRUD cycle for Units:
 *    - Create unit linked to test institution
 *    - Read & Filter by institution_id
 *    - Update unit
 *    - Toggle status (is_active)
 *    - Duplicate unit code error validation
 *    - Invalid foreign key error validation
 *    - ON DELETE RESTRICT constraint validation (cannot delete institution with units)
 * 5. Safe Test Data Cleanup:
 *    - Cascade-safe deletion of test units and test institutions
 *    - Post-cleanup DB verification
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// ---- Load .env.local ----
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Supabase URL or Service Role Key missing in .env.local');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_INST_CODE = `TEST-INST-${Date.now().toString().slice(-5)}`;
const TEST_UNIT_CODE = `TEST-UNIT-${Date.now().toString().slice(-5)}`;

async function runPhase4BE2E() {
  console.log('====================================================================');
  console.log('        LAPORKITO PHASE 4B: DATABASE & E2E VERIFICATION SUITE       ');
  console.log('====================================================================\n');

  const testReport: Record<string, 'PASS' | 'FAIL' | 'PENDING_MIGRATION'> = {};

  try {
    // ------------------------------------------------------------------
    // STEP 1: Verify Existing Core Master Data (Integrity Check)
    // ------------------------------------------------------------------
    console.log('[STEP 1] Verifying core master data integrity...');
    const { data: categories, error: errCat } = await adminClient.from('categories').select('id');
    const { data: kecamatan, error: errKec } = await adminClient.from('kecamatan').select('id');
    const { data: kelurahan, error: errKel } = await adminClient.from('kelurahan').select('id');

    if (errCat || errKec || errKel) {
      throw new Error(`Master data query error: ${errCat?.message || errKec?.message || errKel?.message}`);
    }

    console.log(` - Categories: ${categories.length} (expected: 4)`);
    console.log(` - Kecamatan:  ${kecamatan.length} (expected: 18)`);
    console.log(` - Kelurahan:  ${kelurahan.length} (expected: 107)`);

    if (categories.length !== 4 || kecamatan.length !== 18 || kelurahan.length !== 107) {
      throw new Error('Core master data count mismatch!');
    }
    testReport['Core Master Data Intact'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 2: Verify Schema Presence for Phase 4B Tables
    // ------------------------------------------------------------------
    console.log('\n[STEP 2] Verifying institutions & institution_units schema existence...');
    const { data: initialInst, error: errInstTable } = await adminClient
      .from('institutions')
      .select('id, code, name, is_active')
      .limit(10);

    const { data: initialUnits, error: errUnitsTable } = await adminClient
      .from('institution_units')
      .select('id, code, name, is_active')
      .limit(10);

    if (errInstTable || errUnitsTable) {
      const errMsg = errInstTable?.message || errUnitsTable?.message || '';
      console.log(` ⚠️ Tables not yet found in Supabase schema cache: "${errMsg}"`);
      testReport['Database Migration 00003 Status'] = 'PENDING_MIGRATION';
      console.log('\n>>> ACTION REQUIRED: Migration 00003 must be executed in Supabase SQL Editor. <<<');
      return { success: false, pendingMigration: true };
    }

    console.log(' - Table public.institutions: OK');
    console.log(' - Table public.institution_units: OK');
    console.log(` - Initial institutions count: ${initialInst.length}`);
    console.log(` - Initial units count: ${initialUnits.length}`);
    testReport['Tables Exist'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 3: Test Institutions CRUD & Filters
    // ------------------------------------------------------------------
    console.log('\n[STEP 3] Testing Institutions CRUD operations...');

    // 3a. Create Test Institution
    console.log(` - Creating test institution [${TEST_INST_CODE}]...`);
    const { data: createdInst, error: errCreateInst } = await adminClient
      .from('institutions')
      .insert({
        code: TEST_INST_CODE,
        name: 'Dinas Pengujian Sistem Terpadu Palembang',
        short_name: 'Dinas Uji',
        category: 'Dinas / Badan Teknis',
        address: 'Jl. Merdeka No. 1, Palembang',
        email: 'uji.sistem@palembang.go.id',
        phone: '0711-123456',
        mandate: 'Unit kerja otomatis untuk pengujian verifikasi E2E Phase 4B.',
        is_active: true,
      })
      .select()
      .single();

    if (errCreateInst || !createdInst) {
      throw new Error(`Failed to create test institution: ${errCreateInst?.message}`);
    }
    console.log(`   ✓ Created ID: ${createdInst.id}`);
    testReport['Institution: Create'] = 'PASS';

    // 3b. Read / Detail Institution
    console.log(' - Reading institution detail by ID...');
    const { data: fetchedInst, error: errFetchInst } = await adminClient
      .from('institutions')
      .select('*')
      .eq('id', createdInst.id)
      .single();

    if (errFetchInst || fetchedInst?.code !== TEST_INST_CODE) {
      throw new Error(`Failed to fetch institution: ${errFetchInst?.message}`);
    }
    console.log(`   ✓ Fetched: ${fetchedInst.name} (${fetchedInst.code})`);
    testReport['Institution: Detail Read'] = 'PASS';

    // 3c. Update Institution
    console.log(' - Updating institution phone & mandate...');
    const { data: updatedInst, error: errUpdateInst } = await adminClient
      .from('institutions')
      .update({
        phone: '0711-999999',
        mandate: 'Mandat diperbarui selama pengujian E2E.',
      })
      .eq('id', createdInst.id)
      .select()
      .single();

    if (errUpdateInst || updatedInst?.phone !== '0711-999999') {
      throw new Error(`Failed to update institution: ${errUpdateInst?.message}`);
    }
    console.log('   ✓ Updated successfully');
    testReport['Institution: Update'] = 'PASS';

    // 3d. Toggle Active Status
    console.log(' - Toggling institution status to inactive...');
    const { data: deactivatedInst, error: errDeactInst } = await adminClient
      .from('institutions')
      .update({ is_active: false })
      .eq('id', createdInst.id)
      .select()
      .single();

    if (errDeactInst || deactivatedInst?.is_active !== false) {
      throw new Error(`Failed to deactivate institution: ${errDeactInst?.message}`);
    }

    console.log(' - Restoring status to active...');
    await adminClient
      .from('institutions')
      .update({ is_active: true })
      .eq('id', createdInst.id);
    testReport['Institution: Toggle Status'] = 'PASS';

    // 3e. Search & Filter
    console.log(' - Testing filter by active status & search query...');
    const { data: searchResults, error: errSearch } = await adminClient
      .from('institutions')
      .select('id, code, name')
      .eq('is_active', true)
      .ilike('name', '%Pengujian Sistem%');

    if (errSearch || !searchResults || searchResults.length === 0) {
      throw new Error(`Search failed to find test institution: ${errSearch?.message}`);
    }
    console.log(`   ✓ Search matched ${searchResults.length} institution(s)`);
    testReport['Institution: Search & Filter'] = 'PASS';

    // 3f. Error Handling: Duplicate Institution Code
    console.log(' - Validating duplicate code constraint rejection...');
    const { error: errDuplicateInst } = await adminClient
      .from('institutions')
      .insert({
        code: TEST_INST_CODE, // duplicate!
        name: 'Duplikat OPD Test',
      });

    if (!errDuplicateInst || errDuplicateInst.code !== '23505') {
      throw new Error(`Expected unique violation (23505), but got: ${errDuplicateInst?.message}`);
    }
    console.log(`   ✓ Duplicate rejected as expected (code 23505: ${errDuplicateInst.message})`);
    testReport['Institution: Duplicate Code Error Handling'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 4: Test Institution Units CRUD & Constraints
    // ------------------------------------------------------------------
    console.log('\n[STEP 4] Testing Institution Units CRUD & Relations...');

    // 4a. Create Unit linked to test institution
    console.log(` - Creating test unit [${TEST_UNIT_CODE}] under institution [${TEST_INST_CODE}]...`);
    const { data: createdUnit, error: errCreateUnit } = await adminClient
      .from('institution_units')
      .insert({
        institution_id: createdInst.id,
        code: TEST_UNIT_CODE,
        name: 'Seksi Pengujian Otomasi & QA',
        work_area: 'Wilayah Seberang Ilir',
        description: 'Unit kerja teknis simulasi untuk pengujian E2E.',
        is_active: true,
      })
      .select()
      .single();

    if (errCreateUnit || !createdUnit) {
      throw new Error(`Failed to create test unit: ${errCreateUnit?.message}`);
    }
    console.log(`   ✓ Created Unit ID: ${createdUnit.id}`);
    testReport['Unit: Create Linked'] = 'PASS';

    // 4b. Read & Filter Units by Institution ID
    console.log(' - Fetching units filtered by institution_id...');
    const { data: instUnits, error: errFilterUnits } = await adminClient
      .from('institution_units')
      .select('*, institution:institutions(id, code, name)')
      .eq('institution_id', createdInst.id);

    if (errFilterUnits || !instUnits || instUnits.length !== 1) {
      throw new Error(`Filter units failed: ${errFilterUnits?.message}`);
    }
    console.log(`   ✓ Found ${instUnits.length} unit for parent institution`);
    testReport['Unit: Filter by Parent'] = 'PASS';

    // 4c. Update Unit
    console.log(' - Updating unit description & work_area...');
    const { data: updatedUnit, error: errUpdateUnit } = await adminClient
      .from('institution_units')
      .update({
        work_area: 'Seluruh Kota Palembang',
        description: 'Deskripsi unit telah diperbarui saat E2E.',
      })
      .eq('id', createdUnit.id)
      .select()
      .single();

    if (errUpdateUnit || updatedUnit?.work_area !== 'Seluruh Kota Palembang') {
      throw new Error(`Failed to update unit: ${errUpdateUnit?.message}`);
    }
    console.log('   ✓ Unit updated successfully');
    testReport['Unit: Update'] = 'PASS';

    // 4d. Toggle Unit Active Status
    console.log(' - Toggling unit status to inactive and back...');
    await adminClient.from('institution_units').update({ is_active: false }).eq('id', createdUnit.id);
    const { data: unitInactive } = await adminClient.from('institution_units').select('is_active').eq('id', createdUnit.id).single();
    if (unitInactive?.is_active !== false) throw new Error('Unit deactivation failed');

    await adminClient.from('institution_units').update({ is_active: true }).eq('id', createdUnit.id);
    testReport['Unit: Toggle Status'] = 'PASS';

    // 4e. Error Handling: Duplicate Unit Code
    console.log(' - Validating duplicate unit code constraint...');
    const { error: errDuplicateUnit } = await adminClient
      .from('institution_units')
      .insert({
        institution_id: createdInst.id,
        code: TEST_UNIT_CODE, // duplicate!
        name: 'Unit Duplikat Test',
      });

    if (!errDuplicateUnit || errDuplicateUnit.code !== '23505') {
      throw new Error(`Expected duplicate code rejection (23505), got: ${errDuplicateUnit?.message}`);
    }
    console.log('   ✓ Duplicate unit code rejected as expected');
    testReport['Unit: Duplicate Code Error Handling'] = 'PASS';

    // 4f. Error Handling: Invalid Foreign Key
    console.log(' - Validating invalid institution FK rejection...');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { error: errInvalidFk } = await adminClient
      .from('institution_units')
      .insert({
        institution_id: fakeId,
        code: `FAKE-FK-${Date.now()}`,
        name: 'Unit FK Invalid',
      });

    if (!errInvalidFk || errInvalidFk.code !== '23503') {
      throw new Error(`Expected foreign key error (23503), got: ${errInvalidFk?.message}`);
    }
    console.log('   ✓ Invalid FK rejected with 23503 as expected');
    testReport['Unit: Invalid FK Error Handling'] = 'PASS';

    // 4g. Constraint Validation: ON DELETE RESTRICT on Parent Institution
    console.log(' - Validating ON DELETE RESTRICT (cannot delete parent while child units exist)...');
    const { error: errRestrictDel } = await adminClient
      .from('institutions')
      .delete()
      .eq('id', createdInst.id);

    if (!errRestrictDel || errRestrictDel.code !== '23503') {
      throw new Error(`Expected 23503 foreign key violation on restrict delete, got: ${errRestrictDel?.message}`);
    }
    console.log('   ✓ Parent delete blocked by ON DELETE RESTRICT as required');
    testReport['Integrity: ON DELETE RESTRICT'] = 'PASS';

    // ------------------------------------------------------------------
    // STEP 5: Safe Cleanup
    // ------------------------------------------------------------------
    console.log('\n[STEP 5] Cleaning up test records safely...');
    // Delete child unit first
    const { error: errDelUnit } = await adminClient
      .from('institution_units')
      .delete()
      .eq('id', createdUnit.id);
    if (errDelUnit) throw new Error(`Cleanup unit failed: ${errDelUnit.message}`);
    console.log(` - Deleted test unit: ${createdUnit.id}`);

    // Delete parent institution
    const { error: errDelInst } = await adminClient
      .from('institutions')
      .delete()
      .eq('id', createdInst.id);
    if (errDelInst) throw new Error(`Cleanup institution failed: ${errDelInst.message}`);
    console.log(` - Deleted test institution: ${createdInst.id}`);

    // Verify DB cleanliness
    const { data: verifyInst } = await adminClient.from('institutions').select('id').eq('code', TEST_INST_CODE);
    const { data: verifyUnit } = await adminClient.from('institution_units').select('id').eq('code', TEST_UNIT_CODE);

    if ((verifyInst && verifyInst.length > 0) || (verifyUnit && verifyUnit.length > 0)) {
      throw new Error('Test records still remain in DB after cleanup!');
    }
    console.log(' - Cleanliness check: 0 test records remain.');
    testReport['Safe Test Data Cleanup'] = 'PASS';

    // Final core data check
    const { data: catAfter } = await adminClient.from('categories').select('id');
    const { data: kecAfter } = await adminClient.from('kecamatan').select('id');
    const { data: kelAfter } = await adminClient.from('kelurahan').select('id');
    if (catAfter?.length !== 4 || kecAfter?.length !== 18 || kelAfter?.length !== 107) {
      throw new Error('Core master data mutated during test!');
    }
    testReport['Post-Test Master Data Inviolate'] = 'PASS';

    console.log('\n====================================================================');
    console.log('                     PHASE 4B E2E RESULTS SUMMARY                   ');
    console.log('====================================================================');
    for (const [testName, result] of Object.entries(testReport)) {
      console.log(` ${testName.padEnd(45)} : [${result}]`);
    }
    console.log('====================================================================\n');

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ E2E TEST FAILED:', msg);
    return { success: false, error: msg };
  }
}

runPhase4BE2E();
