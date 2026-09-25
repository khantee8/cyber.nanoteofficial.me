import type { CsfCompare } from '@/lib/grc/compare';
import { CSF_BY_ID, CSF_FUNCTION_BY_ID } from '@/lib/grc/nist-csf-2/catalogue';
import type { Lang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import Radar from '@/components/grc/csf/Radar';

const KINDS = ['closed', 'opened', 'changed'] as const;
const KIND_KEY = { closed: 'grc.compare.closed', opened: 'grc.compare.opened', changed: 'grc.compare.gapChanged' } as const;

const fmt = (n: number | null) => (n === null ? '—' : n.toFixed(1));

/** NIST CSF 2.0 year-over-year comparison: a two-profile radar, a per-Function table, and grouped gap changes. */
export default function CompareCsf({ lang, aLabel, bLabel, cc }: { lang: Lang; aLabel: string; bLabel: string; cc: CsfCompare }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="panel flex flex-col items-center p-5">
        <p className="eyebrow mb-3 self-start">{t(lang, 'csf.dash.radar')}</p>
        <Radar
          points={cc.byFunction.map((f) => ({ fn: f.fn, current: f.a.avgCurrent, target: null }))}
          points2={cc.byFunction.map((f) => f.b.avgCurrent)}
          labels={{ a: aLabel, b: bLabel }}
          lang={lang}
        />
      </section>

      <section className="panel overflow-x-auto">
        <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold">{t(lang, 'csf.dash.byFunction')}</h2>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="mono text-left text-[11px] uppercase tracking-wider text-muted-soft">
              <th className="px-4 py-1 font-normal" />
              <th className="px-2 py-1 text-center font-normal" colSpan={2}>{aLabel}</th>
              <th className="px-4 py-1 text-center font-normal" colSpan={2}>{bLabel}</th>
            </tr>
            <tr className="mono border-t border-line text-left text-[11px] uppercase tracking-wider text-muted-soft">
              <th className="px-4 py-2 font-normal" />
              <th className="px-2 py-2 font-normal">{t(lang, 'csf.current')}</th>
              <th className="px-2 py-2 font-normal">{t(lang, 'csf.gap')}</th>
              <th className="px-2 py-2 font-normal">{t(lang, 'csf.current')}</th>
              <th className="px-4 py-2 font-normal">{t(lang, 'csf.gap')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {cc.byFunction.map((f) => (
              <tr key={f.fn}>
                <td className="mono px-4 py-2.5 text-[12.5px]">{f.fn} <span className="text-muted-soft">{pick(CSF_FUNCTION_BY_ID[f.fn].name, lang)}</span></td>
                <td className="mono px-2 py-2.5">{fmt(f.a.avgCurrent)}</td>
                <td className="mono px-2 py-2.5">{fmt(f.a.avgGap)}</td>
                <td className="mono px-2 py-2.5">{fmt(f.b.avgCurrent)}</td>
                <td className="mono px-4 py-2.5">{fmt(f.b.avgGap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="border-b border-line px-4 py-3 text-[14px] font-semibold">{t(lang, 'grc.compare.changes')}</h2>
        {cc.changes.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-muted">{t(lang, 'grc.compare.none')}</p>
        ) : (
          <div className="divide-y divide-line">
            {KINDS.map((kind) => {
              const items = cc.changes.filter((c) => c.kind === kind);
              if (items.length === 0) return null;
              return (
                <div key={kind} className="px-4 py-3">
                  <p className="eyebrow mb-2">{t(lang, KIND_KEY[kind])} <span className="text-muted-soft">({items.length})</span></p>
                  <ul className="flex flex-col gap-1.5">
                    {items.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="mono w-16 shrink-0 text-[11px] text-muted-soft">{c.id}</span>
                        <span className="min-w-0 flex-1 truncate">{pick(CSF_BY_ID[c.id].text, lang)}</span>
                        <span className="mono text-[12px] text-muted">{fmt(c.aGap)} → {fmt(c.bGap)}</span>
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
