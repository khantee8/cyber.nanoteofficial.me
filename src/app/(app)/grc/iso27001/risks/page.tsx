import Link from 'next/link';
import { BASE, FRAMEWORK, loadWorkspace } from '@/lib/grc/workspace';
import { getRisks } from '@/lib/grc/queries';
import { heatmap, riskBand, riskScore } from '@/lib/grc/iso27001/score';
import { t } from '@/lib/i18n';
import HeatMap from '@/components/grc/HeatMap';
import { BandPill } from '@/components/grc/StatusPill';
import Icon from '@/components/site/Icon';

export const metadata = { title: 'Risk register' };

export default async function RisksPage() {
  const { lang, org, methodology } = await loadWorkspace();
  const risks = await getRisks(org.id, FRAMEWORK);
  const sorted = [...risks].sort((a, b) => (a.status === 'closed') === (b.status === 'closed') ? riskScore(b.likelihood, b.impact) - riskScore(a.likelihood, a.impact) : a.status === 'closed' ? 1 : -1);
  const open = risks.filter((r) => r.status !== 'closed');
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">{t(lang, 'grc.risks.title')}</h1>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t(lang, 'grc.risks.lede')}</p>
        </div>
        <Link href={`${BASE}/risks/new`} className="btn btn-primary"><Icon name="alert" className="h-4 w-4" />{t(lang, 'grc.risks.new')}</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel flex items-center justify-center p-4 lg:col-span-4">
          <HeatMap grid={heatmap(open)} methodology={methodology} lang={lang} />
        </section>
        <section className="panel overflow-x-auto lg:col-span-8">
          {sorted.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-muted">{t(lang, 'grc.risks.none')}</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="mono text-left text-[11px] uppercase tracking-wider text-muted-soft">
                  <th className="px-4 py-2.5 font-normal">{t(lang, 'grc.risk.ref')}</th>
                  <th className="px-2 py-2.5 font-normal">{t(lang, 'grc.risk.title')}</th>
                  <th className="hidden px-2 py-2.5 font-normal md:table-cell">{t(lang, 'grc.risk.owner')}</th>
                  <th className="px-2 py-2.5 font-normal">L×I</th>
                  <th className="px-2 py-2.5 font-normal">{t(lang, 'grc.risk.band')}</th>
                  <th className="px-4 py-2.5 text-right font-normal">{t(lang, 'grc.risk.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sorted.map((r) => {
                  const s = riskScore(r.likelihood, r.impact);
                  return (
                    <tr key={r.id} className={`hover:bg-surface-2/60 ${r.status === 'closed' ? 'opacity-50' : ''}`}>
                      <td className="mono whitespace-nowrap px-4 py-2.5 text-[12px] text-muted">{r.ref}</td>
                      <td className="px-2 py-2.5"><Link href={`${BASE}/risks/${r.id}`} className="font-medium hover:text-accent">{r.title}</Link></td>
                      <td className="hidden px-2 py-2.5 text-[12.5px] text-muted md:table-cell">{r.owner ?? '—'}</td>
                      <td className="mono whitespace-nowrap px-2 py-2.5 text-[12px] text-muted">{r.likelihood}×{r.impact}</td>
                      <td className="px-2 py-2.5"><BandPill band={riskBand(s, methodology)} lang={lang} score={s} /></td>
                      <td className="mono whitespace-nowrap px-4 py-2.5 text-right text-[11px] uppercase tracking-wider text-muted">{t(lang, `grc.rstatus.${r.status}`)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
