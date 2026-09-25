import Link from 'next/link';
import { loadAssessment } from '@/lib/grc/context';
import { getCsfScores, getRisks, toScoreRows } from '@/lib/grc/queries';
import { CSF_BY_ID, CSF_CATEGORIES, CSF_SUBCATEGORIES } from '@/lib/grc/nist-csf-2/catalogue';
import { rankGaps, summary } from '@/lib/grc/nist-csf-2/score';
import { pick, t } from '@/lib/i18n';
import CategoryHeat from '@/components/grc/csf/CategoryHeat';
import { ScoreBadge } from '@/components/grc/csf/Pills';
import Icon from '@/components/site/Icon';

export const metadata = { title: 'CSF 2.0 gaps' };

export default async function GapsPage({ params }: PageProps<'/grc/a/[assessmentId]/csf/gaps'>) {
  const { assessmentId } = await params;
  const { lang, assessment, customer, base } = await loadAssessment(assessmentId, 'nist-csf-2');
  const CSF_BASE = `${base}/csf`;
  const [scores, risks] = await Promise.all([getCsfScores(assessment.id), getRisks(customer.id)]);
  const rows = toScoreRows(scores);
  const cats = CSF_CATEGORIES.map((c) => ({
    id: c.id, name: pick(c.name, lang), s: summary(rows, CSF_SUBCATEGORIES.filter((s) => s.category === c.id).map((s) => s.id)),
  }));
  const ranked = rankGaps(rows, risks);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">{t(lang, 'csf.gaps.title')}</h1>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t(lang, 'csf.gaps.lede')}</p>
        </div>
        <a href={`/api/grc/a/${assessment.id}/profile.csv`} className="btn h-9 min-h-0 text-[13px]"><Icon name="arrow" className="h-3.5 w-3.5 rotate-90" /> {t(lang, 'csf.gaps.export')}</a>
      </div>
      <section className="panel p-4">
        <p className="eyebrow mb-3">{t(lang, 'csf.gaps.heat')}</p>
        <CategoryHeat items={cats} base={CSF_BASE} lang={lang} />
      </section>
      <section className="panel overflow-x-auto">
        <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold">{t(lang, 'csf.gaps.ranked')}</h2>
        {ranked.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-muted">{t(lang, 'csf.dash.noGaps')}</p> : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="mono text-left text-[11px] uppercase tracking-wider text-muted-soft">
                <th className="px-4 py-2 font-normal">#</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'csf.nav.profile')}</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'csf.current')}</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'csf.target')}</th>
                <th className="px-2 py-2 text-right font-normal">{t(lang, 'csf.gap')}</th>
                <th className="px-4 py-2 text-right font-normal">{t(lang, 'csf.gaps.risk')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ranked.map((g) => (
                <tr key={g.id} className="hover:bg-surface-2/60">
                  <td className="mono px-4 py-2.5 text-[12px] text-muted">{g.id}</td>
                  <td className="px-2 py-2.5"><Link href={`${CSF_BASE}/profile/${g.id}`} className="hover:text-accent">{pick(CSF_BY_ID[g.id].text, lang)}</Link></td>
                  <td className="px-2 py-2.5"><ScoreBadge score={g.current} lang={lang} /></td>
                  <td className="mono px-2 py-2.5 text-[12.5px]">{g.target.toFixed(1)}</td>
                  <td className="mono px-2 py-2.5 text-right font-semibold text-sev-high">−{g.gap.toFixed(1)}</td>
                  <td className="mono px-4 py-2.5 text-right text-[12px] text-muted">{g.riskScore || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
