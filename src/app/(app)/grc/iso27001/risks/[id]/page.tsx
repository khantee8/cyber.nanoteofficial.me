import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BASE, loadWorkspace } from '@/lib/grc/workspace';
import { getRisk } from '@/lib/grc/queries';
import { riskBand, riskScore } from '@/lib/grc/iso27001/score';
import { t } from '@/lib/i18n';
import RiskForm from '@/components/grc/RiskForm';
import DeleteRiskButton from '@/components/grc/DeleteRiskButton';
import { BandPill } from '@/components/grc/StatusPill';

export default async function RiskPage({ params }: PageProps<'/grc/iso27001/risks/[id]'>) {
  const { id } = await params;
  const { lang, org, methodology } = await loadWorkspace();
  const risk = await getRisk(org.id, id);
  if (!risk) notFound();
  const s = riskScore(risk.likelihood, risk.impact);
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`${BASE}/risks`} className="mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg">← {t(lang, 'grc.risks.title')}</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="mono text-[13px] text-muted">{risk.ref}</span>
          <BandPill band={riskBand(s, methodology)} lang={lang} score={s} />
        </div>
        <DeleteRiskButton id={risk.id} label={t(lang, 'common.delete')} confirmText={t(lang, 'grc.risk.deleteConfirm')} />
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{risk.title}</h1>
      <p className="mono mt-1 text-[11px] text-muted-soft">
        {t(lang, 'grc.risk.created')} {risk.createdAt.toISOString().slice(0, 10)} · {t(lang, 'grc.risk.updated')} {risk.updatedAt.toISOString().slice(0, 10)}
      </p>
      <div className="panel mt-6 p-5">
        <RiskForm risk={risk} methodology={methodology} lang={lang} />
      </div>
    </div>
  );
}
