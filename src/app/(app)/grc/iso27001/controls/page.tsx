import Link from 'next/link';
import { BASE, FRAMEWORK, loadWorkspace } from '@/lib/grc/workspace';
import { getStatusRows } from '@/lib/grc/queries';
import { ISO27001_CONTROLS, THEMES } from '@/lib/grc/iso27001/catalogue';
import { CONTROL_STATUSES, type ControlStatusValue, type Theme } from '@/lib/grc/types';
import { pick, t } from '@/lib/i18n';
import StatusSelect from '@/components/grc/StatusSelect';
import Icon from '@/components/site/Icon';

export const metadata = { title: 'Annex A controls' };

const themeKeys = new Set(THEMES.map((x) => x.key));

export default async function ControlsPage({ searchParams }: PageProps<'/grc/iso27001/controls'>) {
  const params = await searchParams;
  const { lang, org } = await loadWorkspace();
  const rows = await getStatusRows(org.id, FRAMEWORK);
  const byId = new Map(rows.map((r) => [r.controlId, r]));

  const theme = typeof params.theme === 'string' && themeKeys.has(params.theme as Theme) ? (params.theme as Theme) : null;
  const status = typeof params.status === 'string' && (CONTROL_STATUSES as string[]).includes(params.status) ? (params.status as ControlStatusValue) : null;
  const q = typeof params.q === 'string' ? params.q.trim().toLowerCase() : '';

  const list = ISO27001_CONTROLS.filter((c) => {
    if (theme && c.theme !== theme) return false;
    const s = byId.get(c.id)?.status ?? 'not_started';
    if (status && s !== status) return false;
    if (q && !(c.id.includes(q) || c.title.en.toLowerCase().includes(q) || c.title.th.includes(q) || c.summary.en.toLowerCase().includes(q))) return false;
    return true;
  });

  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const next = { theme, status, q, ...patch };
    if (next.theme) p.set('theme', next.theme);
    if (next.status) p.set('status', next.status);
    if (next.q) p.set('q', next.q);
    const s = p.toString();
    return `${BASE}/controls${s ? `?${s}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">{t(lang, 'grc.controls.title')}</h1>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t(lang, 'grc.controls.lede')}</p>
        </div>
        <form action={`${BASE}/controls`} className="flex items-center gap-2">
          {theme ? <input type="hidden" name="theme" value={theme} /> : null}
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input name="q" defaultValue={q} placeholder={t(lang, 'grc.controls.search')} className="field h-9 min-h-0 w-56" />
          <button type="submit" className="btn h-9 min-h-0 px-3"><Icon name="radar" className="h-4 w-4" /></button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">{t(lang, 'grc.controls.theme')}</span>
        <Link href={href({ theme: null })} className={`mono rounded border px-2 py-1 text-[11.5px] ${!theme ? 'border-line-strong bg-surface-2 text-fg' : 'border-line text-muted hover:text-fg'}`}>{t(lang, 'common.all')}</Link>
        {THEMES.map((th) => (
          <Link key={th.key} href={href({ theme: th.key })} className={`mono rounded border px-2 py-1 text-[11.5px] ${theme === th.key ? 'border-line-strong bg-surface-2 text-fg' : 'border-line text-muted hover:text-fg'}`}>
            {pick(th.label, lang)} <span className="text-muted-soft">{th.range}</span>
          </Link>
        ))}
        <span className="eyebrow ml-3 mr-1">{t(lang, 'grc.controls.status')}</span>
        <Link href={href({ status: null })} className={`mono rounded border px-2 py-1 text-[11.5px] ${!status ? 'border-line-strong bg-surface-2 text-fg' : 'border-line text-muted hover:text-fg'}`}>{t(lang, 'common.all')}</Link>
        {CONTROL_STATUSES.map((s) => (
          <Link key={s} href={href({ status: s })} className={`mono rounded border px-2 py-1 text-[11.5px] ${status === s ? 'border-line-strong bg-surface-2 text-fg' : 'border-line text-muted hover:text-fg'}`}>{t(lang, `grc.status.${s}`)}</Link>
        ))}
        <span className="mono ml-auto text-[11.5px] text-muted-soft">{t(lang, 'grc.controls.count', { n: list.length })}</span>
      </div>

      <div className="panel overflow-x-auto">
        {list.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-muted">{t(lang, 'grc.controls.none')}</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="mono text-left text-[11px] uppercase tracking-wider text-muted-soft">
                <th className="px-4 py-2.5 font-normal">#</th>
                <th className="px-2 py-2.5 font-normal">{t(lang, 'grc.nav.controls')}</th>
                <th className="hidden px-2 py-2.5 font-normal md:table-cell">{t(lang, 'grc.controls.owner')}</th>
                <th className="px-4 py-2.5 text-right font-normal">{t(lang, 'grc.controls.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((c) => {
                const r = byId.get(c.id);
                return (
                  <tr key={c.id} className="align-top hover:bg-surface-2/60">
                    <td className="mono whitespace-nowrap px-4 py-2.5 text-[12px] text-muted">{c.id}</td>
                    <td className="px-2 py-2.5">
                      <Link href={`${BASE}/controls/${c.id}`} className="font-medium hover:text-accent">{pick(c.title, lang)}</Link>
                      <p className="mt-0.5 max-w-xl text-[12px] leading-snug text-muted">{pick(c.summary, lang)}</p>
                    </td>
                    <td className="hidden px-2 py-2.5 text-[12.5px] text-muted md:table-cell">{r?.owner ?? <span className="text-muted-soft">—</span>}</td>
                    <td className="px-4 py-2 text-right"><StatusSelect controlId={c.id} value={r?.status ?? 'not_started'} lang={lang} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
