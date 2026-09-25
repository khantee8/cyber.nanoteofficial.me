import type { IsoCompare } from '@/lib/grc/compare';
import { CONTROL_BY_ID, THEMES } from '@/lib/grc/iso27001/catalogue';
import type { Lang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import Gauge from '@/components/grc/Gauge';
import { StatusPill } from '@/components/grc/StatusPill';

const DIRECTIONS = ['improved', 'regressed', 'changed'] as const;

/** ISO 27001 year-over-year comparison: two gauges, a per-theme delta table, counts, and grouped transitions. */
export default function CompareIso({ lang, aLabel, bLabel, ic }: { lang: Lang; aLabel: string; bLabel: string; ic: IsoCompare }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel flex flex-col items-center justify-center p-5">
          <Gauge value={ic.a.pct} label={aLabel} sub={t(lang, 'grc.dash.ofApplicable', { n: ic.a.applicable })} />
        </div>
        <div className="panel flex flex-col items-center justify-center p-5">
          <Gauge value={ic.b.pct} label={bLabel} sub={t(lang, 'grc.dash.ofApplicable', { n: ic.b.applicable })} />
        </div>
      </div>

      <section className="panel grid grid-cols-3 divide-x divide-line p-4 text-center">
        <div>
          <p className="mono text-[20px] font-semibold text-accent">{ic.counts.improved}</p>
          <p className="eyebrow">{t(lang, 'grc.compare.improved')}</p>
        </div>
        <div>
          <p className="mono text-[20px] font-semibold text-sev-high">{ic.counts.regressed}</p>
          <p className="eyebrow">{t(lang, 'grc.compare.regressed')}</p>
        </div>
        <div>
          <p className="mono text-[20px] font-semibold text-muted">{ic.counts.unchanged}</p>
          <p className="eyebrow">{t(lang, 'grc.compare.unchanged')}</p>
        </div>
      </section>

      <section className="panel overflow-x-auto">
        <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold">{t(lang, 'grc.dash.byTheme')}</h2>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="mono text-left text-[11px] uppercase tracking-wider text-muted-soft">
              <th className="px-4 py-2 font-normal" />
              <th className="px-2 py-2 font-normal">{aLabel}</th>
              <th className="px-2 py-2 font-normal">{bLabel}</th>
              <th className="px-4 py-2 text-right font-normal">{t(lang, 'grc.compare.delta')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {THEMES.map((theme) => {
              const row = ic.byTheme[theme.key];
              const deltaPct = Math.round(row.delta * 100);
              const color = deltaPct > 0 ? 'var(--accent)' : deltaPct < 0 ? 'var(--sev-high)' : 'var(--muted-soft)';
              const sign = deltaPct > 0 ? '+' : '';
              return (
                <tr key={theme.key}>
                  <td className="px-4 py-2.5">{pick(theme.label, lang)} <span className="mono text-[11px] text-muted-soft">{theme.range}</span></td>
                  <td className="mono px-2 py-2.5">{Math.round(row.a * 100)}%</td>
                  <td className="mono px-2 py-2.5">{Math.round(row.b * 100)}%</td>
                  <td className="mono px-4 py-2.5 text-right font-semibold" style={{ color }}>{sign}{deltaPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold">{t(lang, 'grc.compare.transitions')}</h2>
        {ic.transitions.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-muted">{t(lang, 'grc.compare.none')}</p>
        ) : (
          <div className="divide-y divide-line">
            {DIRECTIONS.map((direction) => {
              const items = ic.transitions.filter((tr) => tr.direction === direction);
              if (items.length === 0) return null;
              return (
                <div key={direction} className="px-4 py-3">
                  <p className="eyebrow mb-2">{t(lang, `grc.compare.${direction}`)} <span className="text-muted-soft">({items.length})</span></p>
                  <ul className="flex flex-col gap-1.5">
                    {items.map((tr) => (
                      <li key={tr.controlId} className="flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="mono w-12 shrink-0 text-[11.5px] text-muted-soft">{tr.controlId}</span>
                        <span className="min-w-0 flex-1 truncate">{pick(CONTROL_BY_ID[tr.controlId].title, lang)}</span>
                        <StatusPill status={tr.from} lang={lang} />
                        <span className="text-muted-soft">→</span>
                        <StatusPill status={tr.to} lang={lang} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
