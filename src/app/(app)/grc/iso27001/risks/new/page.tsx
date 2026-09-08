import Link from 'next/link';
import { BASE, loadWorkspace } from '@/lib/grc/workspace';
import { t } from '@/lib/i18n';
import RiskForm from '@/components/grc/RiskForm';

export const metadata = { title: 'New risk' };

export default async function NewRiskPage() {
  const { lang, methodology } = await loadWorkspace();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`${BASE}/risks`} className="mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg">← {t(lang, 'grc.risks.title')}</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t(lang, 'grc.risks.new')}</h1>
      <div className="panel mt-6 p-5">
        <RiskForm risk={null} methodology={methodology} lang={lang} />
      </div>
    </div>
  );
}
