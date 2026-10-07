import { redirect } from 'next/navigation';
import { getCurrentInternalUser } from '@/lib/auth/session';
import {
  getAuthorityRulesAction,
  getAuthorityRuleFormDataAction,
} from '@/lib/actions/authority-rules';
import { AuthorityRulesManager } from '@/components/admin/authority-rules/authority-rules-manager';

export const dynamic = 'force-dynamic';

export default async function DataKewenanganPage() {
  const { internalUser } = await getCurrentInternalUser();
  if (internalUser?.role !== 'admin') {
    redirect('/admin/laporan');
  }
  const [rulesRes, formDataRes] = await Promise.all([
    getAuthorityRulesAction(),
    getAuthorityRuleFormDataAction(),
  ]);

  const rules = rulesRes.success ? rulesRes.data : [];
  const formData = formDataRes.success
    ? formDataRes.data
    : { categories: [], kecamatan: [], institutions: [], institutionUnits: [] };

  return <AuthorityRulesManager initialRules={rules} formData={formData} />;
}
