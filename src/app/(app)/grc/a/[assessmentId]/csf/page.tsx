import Link from 'next/link';
import { loadAssessment } from '@/lib/grc/context';
import { getCsfProfile, getCsfScores, getRisks, toScoreRows } from '@/lib/grc/queries';
import { CSF_BY_ID, CSF_FUNCTIONS, CSF_SUBCATEGORIES } from '@/lib/grc/nist-csf-2/catalogue';
import { functionRating, rankGaps, summary } from '@/lib/grc/nist-csf-2/score';
import { riskBand, riskScore } from '@/lib/grc/iso27001/score';
import { pick, t } from '@/lib/i18n';
import Radar from '@/components/grc/csf/Radar';
import FunctionBars from '@/components/grc/csf/FunctionBars';
import { ScoreBadge } from '@/components/grc/csf/Pills';
import { BandPill } from '@/components/grc/StatusPill';
import Icon from '@/components/site/Icon';

export const metadata = { title: 'NIST CSF 2.0 dashboard' };

const TIER_KEY = { 1: 'csf.tier.1', 2: 'csf.tier.2', 3: 'csf.tier.3', 4: 'csf.tier.4' } as const;

export default async function CsfDashboard({ params }: PageProps<'/grc/a/[assessmentId]/csf'>) {
  const { assessmentId } = await params;
  const { lang, assessment, customer, methodology, base, customerBase } = await loadAssessment(assessmentId, 'nist-csf-2');
  const CSF_BASE = `${base}/csf`;
  const [scoreRows, profile, risks] = await Promise.all([getCsfScores(assessment.id), getCsfProfile(assessment.id), getRisks(customer.id)]);
  const rows = toScoreRows(scoreRows);
  const allIds = CSF_SUBCATEGORIES.map((s) => s.id);
  const overall = summary(rows, allIds);
  const byFn = CSF_FUNCTIONS.map((f) => {
    const s = summary(rows, CSF_SUBCATEGORIES.filter((x) => x.fn === f.id).map((x) => x.id));
    return { fn: f.id, name: pick(f.name, lang), s, rating: functionRating(s) };
  });
  const gaps = rankGaps(rows, risks).slice(0, 10);
  const linked = risks.filter((r) => r.linkedCsfIds.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {overall.assessed === 0 ? (
        <div className="panel flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent-dim/40 px-4 py-3">
          <p className="text-[13.5px]">{t(lang, 'csf.dash.empty')}</p>
          <Link href={`${CSF_BASE}/profile`} className="btn btn-primary h-8 min-h-0 text-[13px]">{t(lang, 'csf.dash.start')} <Icon name="arrow" className="h-3.5 w-3.5" /></Link>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel flex flex-col items-center p-5 lg:col-span-4">
          <p className="eyebrow mb-3 self-start">{t(lang, 'csf.dash.radar')}</p>
          <Radar points={byFn.map((b) => ({ fn: b.fn, current: b.s.avgCurrent, target: b.s.avgTarget }))} lang={lang} />
        </section>
        <section className="panel p-5 lg:col-span-5">
          <p className="eyebrow mb-4">{t(lang, 'csf.dash.byFunction')}</p>
          <FunctionBars items={byFn} lang={lang} base={CSF_BASE} />
        </section>
        <section className="panel flex flex-col gap-3 p-5 lg:col-span-3">
          <div>
            <p className="eyebrow">{t(lang, 'csf.coverage')}</p>
            <p className="mono mt-1 text-[26px] font-semibold">{Math.round(overall.coverage * 100)}%</p>
            <p className="mono text-[11px] text-muted">{t(lang, 'csf.coverageOf', { a: overall.assessed, n: overall.inScope })}</p>
          </div>
          <div className="border-t border-line pt-3">
            <p className="eyebrow">{t(lang, 'csf.tier')}</p>
            <p className="mt-1 text-[13px]">{profile?.currentTier ? t(lang, TIER_KEY[profile.currentTier as 1 | 2 | 3 | 4]) : '—'}</p>
            <p className="text-[13px] text-muted">→ {profile?.targetTier ? t(lang, TIER_KEY[profile.targetTier as 1 | 2 | 3 | 4]) : '—'}</p>
          </div>
          <div className="border-t border-line pt-3 text-[13px]">
            <span className="text-muted">{t(lang, 'csf.current')} / {t(lang, 'csf.target')}</span>
            <p className="mono mt-1 text-[18px] font-semibold">{overall.avgCurrent ?? '—'} <span className="text-muted-soft">/ {overall.avgTarget ?? '—'}</span></p>
          </div>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold">{t(lang, 'csf.dash.topGaps')}</h2>
            <Link href={`${CSF_BASE}/gaps`} className="mono text-[11.5px] text-muted hover:text-fg">{t(lang, 'csf.nav.gaps')} →</Link>
          </div>
          {gaps.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-muted">{t(lang, 'csf.dash.noGaps')}</p> : (
            <ul className="divide-y divide-line">
              {gaps.map((g) => (
                <li key={g.id}>
                  <Link href={`${CSF_BASE}/profile/${g.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2">
                    <span className="mono w-20 shrink-0 text-[11.5px] text-muted-soft">{g.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{pick(CSF_BY_ID[g.id].text, lang)}</span>
                    <ScoreBadge score={g.current} lang={lang} />
                    <span className="mono text-[11px] text-muted-soft">→ {g.target.toFixed(1)}</span>
                    <span className="mono w-12 text-right text-[12.5px] font-semibold text-sev-high">−{g.gap.toFixed(1)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel lg:col-span-5">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold">{t(lang, 'csf.dash.linkedRisks')}</h2>
            <Link href={`${customerBase}/risks`} className="mono text-[11.5px] text-muted hover:text-fg">{t(lang, 'grc.nav.risks')} →</Link>
          </div>
          {linked.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-muted">{t(lang, 'csf.dash.noRisks')}</p> : (
            <ul className="divide-y divide-line">
              {linked.slice(0, 8).map((r) => {
                const s = riskScore(r.likelihood, r.impact);
                return (
                  <li key={r.id}>
                    <Link href={`${customerBase}/risks/${r.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2">
                      <span className="mono w-16 shrink-0 text-[11px] text-muted-soft">{r.ref}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px]">{r.title}</span>
                      <span className="mono hidden text-[10.5px] text-muted sm:inline">{r.linkedCsfIds.slice(0, 2).join(' ')}</span>
                      <BandPill band={riskBand(s, methodology)} lang={lang} score={s} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
