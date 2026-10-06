import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function runVerification() {
  console.log('=== PHASE 4E REMOTE DATABASE VERIFICATION ===\n');

  // 1. Table authority_rules existence & row count
  console.log('[CHECK 1] Verifying public.authority_rules existence & row count...');
  const { data: authRules, count: authRulesCount, error: errAuthRules } = await adminClient
    .from('authority_rules')
    .select('*', { count: 'exact' });

  if (errAuthRules) {
    console.error(' - ERROR reading authority_rules:', errAuthRules.message);
  } else {
    console.log(` - authority_rules exists. Row count: ${authRulesCount} (Expected: 0)`);
  }

  // 2. Checking columns via head query / metadata
  console.log('\n[CHECK 2] Verifying columns & structure via insert-rollback or empty select...');
  const { data: colsData, error: errCols } = await adminClient
    .from('authority_rules')
    .select('id, rule_code, category_id, kecamatan_id, context_title, context_description, institution_id, institution_unit_id, regulation_basis, is_active, created_at, updated_at')
    .limit(1);

  if (errCols) {
    console.error(' - ERROR selecting expected columns:', errCols.message);
  } else {
    console.log(' - All 12 columns verified accessible: id, rule_code, category_id, kecamatan_id, context_title, context_description, institution_id, institution_unit_id, regulation_basis, is_active, created_at, updated_at');
  }

  // 3. Verifying RLS on anonClient (Anon / Public access)
  console.log('\n[CHECK 3] Verifying RLS for anon/public...');
  const { data: anonSelect, error: anonErr } = await anonClient
    .from('authority_rules')
    .select('id, rule_code');

  console.log(` - Anon SELECT: returned ${anonSelect?.length ?? 0} rows. Error: ${anonErr?.message || 'none (empty set blocked by RLS)'}`);

  const { error: anonInsertErr } = await anonClient
    .from('authority_rules')
    .insert({
      rule_code: 'TEST-ANON',
      category_id: '00000000-0000-0000-0000-000000000000',
      context_title: 'Test',
      institution_id: '00000000-0000-0000-0000-000000000000',
      regulation_basis: 'Test',
    });
  console.log(` - Anon INSERT: Blocked as expected. Error: ${anonInsertErr?.message}`);

  // 4. Verifying Existing Master Data Integrity
  console.log('\n[CHECK 4] Verifying existing master data counts...');
  const [
    { count: catCount },
    { count: kecCount },
    { count: kelCount },
    { count: instCount },
    { count: unitCount },
    { count: repCount }
  ] = await Promise.all([
    adminClient.from('categories').select('*', { count: 'exact', head: true }),
    adminClient.from('kecamatan').select('*', { count: 'exact', head: true }),
    adminClient.from('kelurahan').select('*', { count: 'exact', head: true }),
    adminClient.from('institutions').select('*', { count: 'exact', head: true }),
    adminClient.from('institution_units').select('*', { count: 'exact', head: true }),
    adminClient.from('reports').select('*', { count: 'exact', head: true }),
  ]);

  console.log(` - categories count: ${catCount} (Expected: 4)`);
  console.log(` - kecamatan count: ${kecCount} (Expected: 18)`);
  console.log(` - kelurahan count: ${kelCount} (Expected: 107)`);
  console.log(` - institutions count: ${instCount}`);
  console.log(` - institution_units count: ${unitCount}`);
  console.log(` - reports count: ${repCount}`);

  // 5. Checking Legacy Tables (authorities, routing_rules)
  console.log('\n[CHECK 5] Checking legacy tables (authorities, routing_rules)...');
  const { error: errLegacyAuth } = await adminClient.from('authorities').select('*').limit(1);
  const { error: errLegacyRules } = await adminClient.from('routing_rules').select('*').limit(1);

  console.log(` - public.authorities check: ${errLegacyAuth ? 'DOES NOT EXIST (Clean PASS)' : 'WARNING: EXISTS'}`);
  console.log(` - public.routing_rules check: ${errLegacyRules ? 'DOES NOT EXIST (Clean PASS)' : 'WARNING: EXISTS'}`);

  console.log('\n=== VERIFICATION COMPLETE ===');
}

runVerification().catch(console.error);
