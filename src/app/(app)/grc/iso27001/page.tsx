import Link from 'next/link';
import { BASE, FRAMEWORK, loadWorkspace } from '@/lib/grc/workspace';
import { getRisks, getStatusRows } from '@/lib/grc/queries';
import { ISO27001_CONTROLS } from '@/lib/grc/iso27001/catalogue';
import { buildSoa, compliance, complianceByTheme, heatmap, riskBand, riskScore } from '@/lib/grc/iso27001/score';
import { t } from '@/lib/i18n';
import Gauge from '@/components/grc/Gauge';
import ThemeBars from '@/components/grc/ThemeBars';
import HeatMap from '@/components/grc/HeatMap';
import { BandPill } from '@/components/grc/StatusPill';
import Icon from '@/components/site/Icon';

export const metadata = { title: 'ISO 27001 dashboard' };

export default async function Dashboard() {
  const { lang, org, methodology } = await loadWorkspace();
  const [statusRows, risks] = await Promise.all([getStatusRows(org.id, FRAMEWORK), getRisks(org.id, FRAMEWORK)]);
  const rows = statusRows.map((r) => ({ controlId: r.controlId, status: r.status, justification: r.justification, owner: r.owner }));
  const c = compliance(rows, ISO27001_CONTROLS);
  const byTheme = complianceByTheme(rows, ISO27001_CONTROLS);
  const open = risks.filter((r) => r.status !== 'closed');
  const top = [...open].sort((a, b) => riskScore(b.likelihood, b.impact) - riskScore(a.likelihood, a.impact)).slice(0, 5);
  const noOwner = ISO27001_CONTROLS.filter((ctl) => {
    const r = statusRows.find((x) => x.controlId === ctl.id);
    return r && r.status !== 'not_applicable' && r.status !== 'not_started' && !r.owner;
  }).length;
  const { missingJustification } = buildSoa(ISO27001_CONTROLS, rows);
  const last = statusRows.reduce<Date | null>((m, r) => (!m || r.updatedAt > m ? r.updatedAt : m), null);
  const touched = statusRows.length > 0 || risks.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {!touched ? (
        <div className="panel flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent-dim/40 px-4 py-3">
          <p className="text-[13.5px]">{t(lang, 'grc.controls.lede')}</p>
          <Link href={`${BASE}/controls`} className="btn btn-primary h-8 min-h-0 text-[13px]">{t(lang, 'grc.dash.start')} <Icon name="arrow" className="h-3.5 w-3.5" /></Link>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel flex flex-col items-center justify-center p-5 lg:col-span-3">
          <Gauge value={c.pct} label={t(lang, 'grc.dash.compliance')} sub={t(lang, 'grc.dash.ofApplicable', { n: c.applicable })} />
          <dl className="mono mt-4 grid w-full grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-muted">
            <dt>{t(lang, 'grc.status.implemented')}</dt><dd className="text-right text-accent">{c.implemented}</dd>
            <dt>{t(lang, 'grc.status.partial')}</dt><dd className="text-right text-sev-medium">{c.partial}</dd>
            <dt>{t(lang, 'grc.status.not_started')}</dt><dd className="text-right">{c.notStarted}</dd>
            <dt>{t(lang, 'grc.status.not_applicable')}</dt><dd className="text-right text-sev-low">{c.notApplicable}</dd>
          </dl>
        </section>
        <section className="panel p-5 lg:col-span-5">
          <p className="eyebrow mb-4">{t(lang, 'grc.dash.byTheme')}</p>
          <ThemeBars byTheme={byTheme} lang={lang} base={BASE} />
        </section>
        <section className="panel flex flex-col p-5 lg:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">{t(lang, 'grc.dash.heat')}</p>
            <span className="mono text-[11px] text-muted">{open.length} {t(lang, 'grc.dash.openRisks')}</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <HeatMap grid={heatmap(open)} methodology={methodology} lang={lang} compact />
          </div>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel lg:col-span-8">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold">{t(lang, 'grc.dash.topRisks')}</h2>
            <Link href={`${BASE}/risks`} className="mono text-[11.5px] text-muted hover:text-fg">{t(lang, 'grc.nav.risks')} →</Link>
          </div>
          {top.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted">{t(lang, 'grc.dash.noRisks')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {top.map((r) => {
                const s = riskScore(r.likelihood, r.impact);
                return (
                  <li key={r.id}>
                    <Link href={`${BASE}/risks/${r.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2">
                      <span className="mono w-20 shrink-0 text-[11.5px] text-muted-soft">{r.ref}</span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px]">{r.title}</span>
                      <span className="hidden text-[12px] text-muted sm:inline">{r.owner ?? ''}</span>
                      <BandPill band={riskBand(s, methodology)} lang={lang} score={s} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="panel flex flex-col gap-3 p-5 lg:col-span-4">
          <div className="flex items-baseline justify-between"><span className="text-[13px] text-muted">{t(lang, 'grc.dash.noOwner')}</span><span className="mono text-[18px] font-semibold" style={{ color: noOwner ? 'var(--sev-medium)' : 'var(--accent)' }}>{noOwner}</span></div>
          <div className="flex items-baseline justify-between"><span className="text-[13px] text-muted">{t(lang, 'grc.dash.naNoJust')}</span><span className="mono text-[18px] font-semibold" style={{ color: missingJustification.length ? 'var(--sev-high)' : 'var(--accent)' }}>{missingJustification.length}</span></div>
          <div className="flex items-baseline justify-between border-t border-line pt-3"><span className="text-[13px] text-muted">{t(lang, 'grc.dash.lastActivity')}</span><span className="mono text-[12px]">{last ? last.toISOString().slice(0, 16).replace('T', ' ') : '—'}</span></div>
        </section>
      </div>
    </div>
  );
}
