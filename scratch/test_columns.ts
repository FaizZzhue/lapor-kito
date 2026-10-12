import dotenv from 'dotenv';
import path from 'path';
import { createAdminClient } from '../lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testColumns() {
  const s = createAdminClient();
  const res1 = await s.from('internal_users').select('institution_id').limit(1);
  console.log('internal_users.institution_id test:', res1.error ? res1.error.message : 'EXISTS');

  const res2 = await s.from('reports').select('assigned_institution_id').limit(1);
  console.log('reports.assigned_institution_id test:', res2.error ? res2.error.message : 'EXISTS');
}

testColumns().catch(console.error);
