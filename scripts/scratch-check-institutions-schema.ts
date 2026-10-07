import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  // Query table via rpc or select
  // We can query information_schema or check by inserting/selecting or postgrest
  // In Supabase, postgres schema table info can be queried via RPC if exists, or let's test a dummy select
  const { data, error } = await supabase.from('institutions').select('*').limit(1);
  console.log('institutions select test:', { data, error });
}

checkSchema().catch(console.error);
