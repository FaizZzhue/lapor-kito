import { notFound } from 'next/navigation';
import {
  getAuthorityRuleByIdAction,
  getAuthorityRuleFormDataAction,
} from '@/lib/actions/authority-rules';
import { RuleDetailView } from '@/components/admin/authority-rules/rule-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AuthorityRuleDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [ruleRes, formDataRes] = await Promise.all([
    getAuthorityRuleByIdAction(id),
    getAuthorityRuleFormDataAction(),
  ]);

  if (!ruleRes.success || !ruleRes.data) {
    notFound();
  }

  return <RuleDetailView rule={ruleRes.data} formData={formDataRes.data} />;
}
