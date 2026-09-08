import Link from 'next/link';
import { BASE, FRAMEWORK, loadWorkspace } from '@/lib/grc/workspace';
import { getStatuses } from '@/lib/grc/queries';
import { ISO27001_CONTROLS, THEMES } from '@/lib/grc/iso27001/catalogue';
import { buildSoa } from '@/lib/grc/iso27001/score';
import { pick, t } from '@/lib/i18n';
import { StatusPill } from '@/components/grc/StatusPill';
import Icon from '@/components/site/Icon';

export const metadata = { title: 'Statement of Applicability' };

export default async function SoaPage({ searchParams }: PageProps<'/grc/iso27001/soa'>) {
  const params = await searchParams;
  const print = params.print === '1';
  const { lang, org } = await loadWorkspace();
  const rows = await getStatuses(org.id, FRAMEWORK);
  const { rows: soa, missingJustification } = buildSoa(ISO27001_CONTROLS, rows);
  const byId = new Map(ISO27001_CONTROLS.map((c) => [c.id, c]));
  const generated = new Date().toISOString().slice(0, 10);

  return (
    <div className={`flex flex-col gap-5 ${print ? 'print:text-black' : ''}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">{t(lang, 'grc.soa.title')}</h1>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{print ? `${org.name} · ${t(lang, 'grc.soa.generated')} ${generated}` : t(lang, 'grc.soa.lede')}</p>
          {org.scope ? <p className="mt-2 text-[12.5px] leading-relaxed text-muted"><span className="text-muted-soft">{t(lang, 'grc.org.scope')}:</span> {org.scope}</p> : null}
        </div>
        <div className="no-print flex items-center gap-2">
          <Link href={`${BASE}/soa?print=1`} className="btn">{t(lang, 'grc.soa.print')}</Link>
          <a href="/api/grc/iso27001/soa.csv" className={`btn btn-primary ${missingJustification.length ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={missingJustification.length > 0}>
            <Icon name="download" className="h-4 w-4" />{t(lang, 'grc.soa.export')}
          </a>
        </div>
      </div>
      {missingJustification.length ? (
        <div className="no-print panel border-sev-high/50 px-4 py-3 text-[13px]">
          <p className="text-sev-high">{t(lang, 'grc.soa.missing', { n: missingJustification.length })}</p>
          <p className="mono mt-1 flex flex-wrap gap-2">
            {missingJustification.map((id) => <Link key={id} href={`${BASE}/controls/${id}`} className="underline hover:text-fg">{id}</Link>)}
          </p>
        </div>
      ) : null}
      {THEMES.map((th) => (
        <section key={th.key} className="panel overflow-x-auto">
          <h2 className="border-b border-line px-4 py-2.5 text-[13px] font-semibold">{pick(th.label, lang)} <span className="mono text-[11px] font-normal text-muted-soft">{th.range}</span></h2>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="mono text-left text-[10.5px] uppercase tracking-wider text-muted-soft">
                <th className="px-4 py-2 font-normal">#</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'grc.nav.controls')}</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'grc.soa.applicable')}</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'grc.controls.status')}</th>
                <th className="px-2 py-2 font-normal">{t(lang, 'grc.control.justification')}</th>
                <th className="px-4 py-2 font-normal">{t(lang, 'grc.controls.owner')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {soa.filter((r) => byId.get(r.controlId)?.theme === th.key).map((r) => (
                <tr key={r.controlId} className="align-top">
                  <td className="mono whitespace-nowrap px-4 py-2 text-muted">{r.controlId}</td>
                  <td className="px-2 py-2"><Link href={`${BASE}/controls/${r.controlId}`} className="hover:text-accent">{pick(byId.get(r.controlId)!.title, lang)}</Link></td>
                  <td className="mono px-2 py-2">{r.applicable ? t(lang, 'grc.soa.yes') : <span className="text-sev-low">{t(lang, 'grc.soa.no')}</span>}</td>
                  <td className="px-2 py-2"><StatusPill status={r.status} lang={lang} /></td>
                  <td className="max-w-md px-2 py-2 text-muted">{r.justification || (r.applicable ? '' : <span className="text-sev-high">—</span>)}</td>
                  <td className="px-4 py-2 text-muted">{r.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
