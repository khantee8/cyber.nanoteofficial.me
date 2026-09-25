import Link from 'next/link';
import { loadCustomer } from '@/lib/grc/context';
import { CSF_SUBCATEGORIES } from '@/lib/grc/nist-csf-2/catalogue';
import { t } from '@/lib/i18n';
import RiskForm from '@/components/grc/RiskForm';

export const metadata = { title: 'New risk' };

export default async function NewRiskPage({ params }: PageProps<'/grc/c/[customerId]/risks/new'>) {
  const { customerId } = await params;
  const { lang, customer, methodology, base } = await loadCustomer(customerId);
  const csfOptions = CSF_SUBCATEGORIES.map((s) => ({ id: s.id, text: s.text }));
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`${base}/risks`} className="mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg">← {t(lang, 'grc.risks.title')}</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t(lang, 'grc.risks.new')}</h1>
      <div className="panel mt-6 p-5">
        <RiskForm customerId={customer.id} risk={null} methodology={methodology} lang={lang} csfOptions={csfOptions} />
      </div>
    </div>
  );
}
