import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BASE, FRAMEWORK, loadWorkspace } from '@/lib/grc/workspace';
import { getRisks, getStatusRow } from '@/lib/grc/queries';
import { CONTROL_BY_ID, THEMES } from '@/lib/grc/iso27001/catalogue';
import { riskBand, riskScore } from '@/lib/grc/iso27001/score';
import { pick, t } from '@/lib/i18n';
import ControlDetailForm from '@/components/grc/ControlDetailForm';
import { BandPill, StatusPill } from '@/components/grc/StatusPill';
import Icon from '@/components/site/Icon';

export default async function ControlPage({ params }: PageProps<'/grc/iso27001/controls/[id]'>) {
  const { id } = await params;
  const control = CONTROL_BY_ID[id];
  if (!control) notFound();
  const { lang, org, methodology } = await loadWorkspace();
  const [row, risks] = await Promise.all([getStatusRow(org.id, FRAMEWORK, id), getRisks(org.id, FRAMEWORK)]);
  const linked = risks.filter((r) => r.linkedControlIds.includes(id));
  const theme = THEMES.find((x) => x.key === control.theme)!;
  const Tag = ({ children }: { children: string }) => <span className="mono rounded border border-line px-1.5 py-0.5 text-[10.5px] text-muted">{children}</span>;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Link href={`${BASE}/controls?theme=${control.theme}`} className="mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg">
          ← {pick(theme.label, lang)} {theme.range}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="mono text-[13px] text-muted">{control.id}</span>
          <StatusPill status={row?.status ?? 'not_started'} lang={lang} />
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{pick(control.title, lang)}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">{pick(control.summary, lang)}</p>
        <p className="mt-2 text-[11.5px] text-muted-soft">{t(lang, 'grc.control.summaryNote')}</p>
        <div className="panel mt-6 p-5">
          <ControlDetailForm controlId={id} status={row?.status ?? 'not_started'} justification={row?.justification ?? ''} owner={row?.owner ?? ''} evidenceUrls={row?.evidenceUrls ?? []} lang={lang} />
        </div>
      </div>
      <aside className="flex flex-col gap-4 lg:col-span-5">
        <section className="panel p-4">
          <p className="eyebrow mb-3">{t(lang, 'grc.control.attributes')}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[12.5px]">
            <dt className="text-muted">{t(lang, 'grc.control.type')}</dt><dd className="flex flex-wrap gap-1">{control.type.map((x) => <Tag key={x}>{x}</Tag>)}</dd>
            <dt className="text-muted">{t(lang, 'grc.control.cia')}</dt><dd className="flex flex-wrap gap-1">{control.cia.map((x) => <Tag key={x}>{x === 'C' ? 'confidentiality' : x === 'I' ? 'integrity' : 'availability'}</Tag>)}</dd>
            <dt className="text-muted">{t(lang, 'grc.control.concept')}</dt><dd className="flex flex-wrap gap-1">{control.concept.map((x) => <Tag key={x}>{x}</Tag>)}</dd>
            <dt className="text-muted">{t(lang, 'grc.control.domains')}</dt><dd className="flex flex-wrap gap-1">{control.domains.map((x) => <Tag key={x}>{x.replace(/_/g, ' ')}</Tag>)}</dd>
          </dl>
        </section>
        {row?.evidenceUrls?.length ? (
          <section className="panel p-4">
            <p className="eyebrow mb-2">{t(lang, 'grc.control.evidence')}</p>
            <ul className="flex flex-col gap-1 text-[12.5px]">
              {row.evidenceUrls.map((u) => (
                <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="mono inline-flex items-center gap-1 break-all text-accent hover:underline">{u}<Icon name="external" className="h-3 w-3 shrink-0" /></a></li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="panel p-4">
          <p className="eyebrow mb-2">{t(lang, 'grc.control.linkedRisks')}</p>
          {linked.length === 0 ? <p className="text-[12.5px] text-muted-soft">{t(lang, 'grc.control.noLinked')}</p> : (
            <ul className="divide-y divide-line">
              {linked.map((r) => {
                const s = riskScore(r.likelihood, r.impact);
                return (
                  <li key={r.id}>
                    <Link href={`${BASE}/risks/${r.id}`} className="flex items-center gap-3 py-2 text-[13px] hover:text-accent">
                      <span className="mono text-[11px] text-muted-soft">{r.ref}</span>
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <BandPill band={riskBand(s, methodology)} lang={lang} score={s} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
