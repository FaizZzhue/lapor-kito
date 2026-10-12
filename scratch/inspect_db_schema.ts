import dotenv from 'dotenv';
import path from 'path';
import { createAdminClient } from '../lib/supabase/admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectSchema() {
  const s = createAdminClient();
  const [users, reps, insts, units, rules, timeline, responses, triage] = await Promise.all([
    s.from('internal_users').select('*').limit(1),
    s.from('reports').select('*').limit(1),
    s.from('institutions').select('*').limit(1),
    s.from('institution_units').select('*').limit(1),
    s.from('authority_rules').select('*').limit(1),
    s.from('report_timeline').select('*').limit(1),
    s.from('report_responses').select('*').limit(1),
    s.from('ai_triage_logs').select('*').limit(1),
  ]);

  console.log('internal_users columns:', Object.keys(users.data?.[0] || {}));
  console.log('reports columns:', Object.keys(reps.data?.[0] || {}));
  console.log('institutions columns:', Object.keys(insts.data?.[0] || {}));
  console.log('institution_units columns:', Object.keys(units.data?.[0] || {}));
  console.log('authority_rules columns:', Object.keys(rules.data?.[0] || {}));
  console.log('report_timeline columns:', Object.keys(timeline.data?.[0] || {}));
  console.log('report_responses columns:', Object.keys(responses.data?.[0] || {}));
  console.log('ai_triage_logs columns:', Object.keys(triage.data?.[0] || {}));
}

inspectSchema().catch(console.error);
