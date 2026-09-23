import Link from 'next/link';
import { CSF_BASE, loadCsfWorkspace } from '@/lib/grc/nist-csf-2/workspace';
import { getCsfScores } from '@/lib/grc/queries';
import { CSF_CATEGORIES, CSF_FUNCTIONS, CSF_SUBCATEGORIES } from '@/lib/grc/nist-csf-2/catalogue';
import { gap } from '@/lib/grc/nist-csf-2/score';
import { CSF_FUNCTION_IDS, TESTING_STATUSES, type CsfFunctionId, type TestingStatus } from '@/lib/grc/nist-csf-2/types';
import { pick, t } from '@/lib/i18n';
import ScorePicker from '@/components/grc/csf/ScorePicker';
import BulkTarget from '@/components/grc/csf/BulkTarget';

export const metadata = { title: 'CSF 2.0 profile' };

const SHOW = ['unscored', 'gap2', 'out'] as const;
type Show = (typeof SHOW)[number];

export default async function ProfilePage({ searchParams }: PageProps<'/grc/nist-csf-2/profile'>) {
  const params = await searchParams;
  const { lang, org } = await loadCsfWorkspace();
  const rows = await getCsfScores(org.id);
  const byId = new Map(rows.map((r) => [r.subcategoryId, r]));
  const fn = typeof params.fn === 'string' && (CSF_FUNCTION_IDS as string[]).includes(params.fn) ? (params.fn as CsfFunctionId) : null;
  const show = typeof params.show === 'string' && (SHOW as readonly string[]).includes(params.show) ? (params.show as Show) : null;
  const ts = typeof params.ts === 'string' && (TESTING_STATUSES as string[]).includes(params.ts) ? (params.ts as TestingStatus) : null;

  const visible = CSF_SUBCATEGORIES.filter((s) => {
    if (fn && s.fn !== fn) return false;
    const r = byId.get(s.id);
    if (ts && (r?.testingStatus ?? 'not_started') !== ts) return false;
    if (show === 'unscored') return (r?.inScope ?? true) && (r?.current == null || r?.target == null);
    if (show === 'gap2') return (r?.inScope ?? true) && (gap({ current: r?.current ?? null, target: r?.target ?? null }) ?? 0) >= 2;
    if (show === 'out') return r?.inScope === false;
    return true;
  });
  const visibleIds = new Set(visible.map((s) => s.id));

  const href = (patch: { fn?: string | null; show?: string | null; ts?: string | null }) => {
    const p = new URLSearchParams();
    const next = { fn, show, ts, ...patch };
    if (next.fn) p.set('fn', next.fn);
    if (next.show) p.set('show', next.show);
    if (next.ts) p.set('ts', next.ts);
    const s = p.toString();
    return `${CSF_BASE}/profile${s ? `?${s}` : ''}`;
  };
  const chip = (active: boolean) => `mono rounded border px-2 py-1 text-[11.5px] ${active ? 'border-line-strong bg-surface-2 text-fg' : 'border-line text-muted hover:text-fg'}`;
  const showLabel: Record<Show, string> = { unscored: t(lang, 'csf.filter.unscored'), gap2: t(lang, 'csf.filter.gap2'), out: t(lang, 'csf.outOfScope') };

  return (
    <div className="flex flex-col gap-5">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">{t(lang, 'csf.profile.title')}</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t(lang, 'csf.profile.lede')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">{t(lang, 'csf.filter.function')}</span>
        <Link href={href({ fn: null })} className={chip(!fn)}>{t(lang, 'common.all')}</Link>
        {CSF_FUNCTIONS.map((f) => <Link key={f.id} href={href({ fn: f.id })} className={chip(fn === f.id)}>{f.id} <span className="text-muted-soft">{pick(f.name, lang)}</span></Link>)}
        <span className="eyebrow ml-3 mr-1">{t(lang, 'csf.filter.show')}</span>
        <Link href={href({ show: null })} className={chip(!show)}>{t(lang, 'common.all')}</Link>
        {SHOW.map((s) => <Link key={s} href={href({ show: s })} className={chip(show === s)}>{showLabel[s]}</Link>)}
        <span className="eyebrow ml-3 mr-1">{t(lang, 'csf.testing')}</span>
        <Link href={href({ ts: null })} className={chip(!ts)}>{t(lang, 'common.all')}</Link>
        {TESTING_STATUSES.map((x) => <Link key={x} href={href({ ts: x })} className={chip(ts === x)}>{t(lang, `csf.testing.${x}`)}</Link>)}
        <span className="mono ml-auto text-[11.5px] text-muted-soft">{t(lang, 'csf.profile.count', { n: visible.length })}</span>
      </div>

      {visible.length === 0 ? <p className="panel px-4 py-10 text-center text-[13px] text-muted">{t(lang, 'csf.profile.none')}</p> : null}

      {CSF_CATEGORIES.filter((c) => CSF_SUBCATEGORIES.some((s) => s.category === c.id && visibleIds.has(s.id))).map((c) => (
        <section key={c.id} className="panel overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <h2 className="text-[14px] font-semibold"><span className="mono mr-2 text-[12px] text-muted-soft">{c.id}</span>{pick(c.name, lang)}</h2>
            <BulkTarget categoryId={c.id} lang={lang} />
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="mono text-left text-[11px] uppercase tracking-wider text-muted-soft">
                <th className="px-4 py-2 font-normal">#</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'csf.nav.profile')}</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'csf.current')}</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'csf.target')}</th>
                <th className="px-4 py-2 text-right font-normal">{t(lang, 'csf.gap')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {CSF_SUBCATEGORIES.filter((s) => s.category === c.id && visibleIds.has(s.id)).map((s) => {
                const r = byId.get(s.id);
                const g = gap({ current: r?.current ?? null, target: r?.target ?? null });
                return (
                  <tr key={s.id} className={`align-top hover:bg-surface-2/60 ${r?.inScope === false ? 'opacity-60' : ''}`}>
                    <td className="mono whitespace-nowrap px-4 py-2.5 text-[12px] text-muted">{s.id}</td>
                    <td className="px-2 py-2.5">
                      <Link href={`${CSF_BASE}/profile/${s.id}`} className="leading-snug hover:text-accent">{pick(s.text, lang)}</Link>
                      {r?.inScope === false ? <span className="mono ml-2 text-[10.5px] uppercase text-muted-soft">{t(lang, 'csf.outOfScope')}</span> : null}
                    </td>
                    <td className="px-2 py-2"><ScorePicker subcategoryId={s.id} field="current" value={r?.current ?? null} lang={lang} /></td>
                    <td className="px-2 py-2"><ScorePicker subcategoryId={s.id} field="target" value={r?.target ?? null} lang={lang} /></td>
                    <td className="mono px-4 py-2.5 text-right text-[12.5px]">{g === null ? <span className="text-muted-soft">—</span> : g > 0 ? <span className="text-sev-high">−{g.toFixed(1)}</span> : '0.0'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
