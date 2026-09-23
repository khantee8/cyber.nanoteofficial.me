import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CSF_BASE, loadCsfWorkspace } from '@/lib/grc/nist-csf-2/workspace';
import { getCsfScore, getRisks, getStatuses } from '@/lib/grc/queries';
import { CSF_BY_ID, CSF_CATEGORY_BY_ID, CSF_FUNCTION_BY_ID } from '@/lib/grc/nist-csf-2/catalogue';
import { suggestCurrent } from '@/lib/grc/nist-csf-2/score';
import { CONTROL_BY_ID } from '@/lib/grc/iso27001/catalogue';
import { riskBand, riskScore } from '@/lib/grc/iso27001/score';
import { pick, t } from '@/lib/i18n';
import CsfScoreForm from '@/components/grc/csf/CsfScoreForm';
import SuggestionPanel from '@/components/grc/csf/SuggestionPanel';
import { BandPill, StatusPill } from '@/components/grc/StatusPill';

export default async function SubcategoryPage({ params }: PageProps<'/grc/nist-csf-2/profile/[id]'>) {
  const { id } = await params;
  const sub = CSF_BY_ID[id];
  if (!sub) notFound();
  const { lang, org, methodology } = await loadCsfWorkspace();
  const [row, statuses, risks] = await Promise.all([getCsfScore(org.id, id), getStatuses(org.id, 'iso27001'), getRisks(org.id)]);
  const cat = CSF_CATEGORY_BY_ID[sub.category];
  const fn = CSF_FUNCTION_BY_ID[sub.fn];
  const suggestion = suggestCurrent(sub.iso27001, statuses);
  const statusOf = new Map(statuses.map((s) => [s.controlId, s.status]));
  const linked = risks.filter((r) => r.linkedCsfIds.includes(id));

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Link href={`${CSF_BASE}/profile?fn=${sub.fn}`} className="mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg">
          ← {sub.fn} {pick(fn.name, lang)} / {cat.id} {pick(cat.name, lang)}
        </Link>
        <p className="mono mt-2 text-[13px] text-muted">{sub.id}</p>
        <h1 className="mt-1 text-[22px] font-semibold leading-snug tracking-tight">{pick(sub.text, lang)}</h1>
        {lang === 'th' ? <p className="mt-2 text-[12.5px] text-muted">{sub.text.en}</p> : null}
        <div className="panel mt-6 p-5">
          <CsfScoreForm key={String(row?.updatedAt ?? '')} subcategoryId={id} initial={row} lang={lang} />
        </div>
        {sub.examples.length ? (
          <section className="mt-6">
            <p className="eyebrow mb-2">{t(lang, 'csf.examples')}</p>
            <ol className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
              {sub.examples.map((e, i) => (
                <li key={e.id} className="flex gap-3"><span className="mono shrink-0 text-[11px] text-muted-soft">Ex{i + 1}</span><span>{pick(e.text, lang)}</span></li>
              ))}
            </ol>
          </section>
        ) : null}
        <p className="mt-6 text-[11px] text-muted-soft">{t(lang, 'csf.source')}{lang === 'th' ? ` ${t(lang, 'csf.thUnofficial')}` : ''}</p>
      </div>
      <aside className="flex flex-col gap-4 lg:col-span-5">
        <SuggestionPanel subcategoryId={id} suggestion={suggestion} current={row?.current ?? null} lang={lang} />
        <section className="panel p-4">
          <p className="eyebrow mb-2">{t(lang, 'csf.iso.title')}</p>
          {sub.iso27001.length === 0 ? <p className="text-[12.5px] text-muted-soft">{t(lang, 'csf.iso.none')}</p> : (
            <ul className="divide-y divide-line">
              {sub.iso27001.map((cid) => (
                <li key={cid}>
                  <Link href={`/grc/iso27001/controls/${cid}`} className="flex items-center gap-3 py-2 text-[13px] hover:text-accent">
                    <span className="mono w-10 text-[11.5px] text-muted-soft">{cid}</span>
                    <span className="min-w-0 flex-1 truncate">{pick(CONTROL_BY_ID[cid].title, lang)}</span>
                    <StatusPill status={statusOf.get(cid) ?? 'not_started'} lang={lang} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-muted-soft">{t(lang, 'csf.iso.source')}</p>
        </section>
        <section className="panel p-4">
          <p className="eyebrow mb-2">{t(lang, 'grc.control.linkedRisks')}</p>
          {linked.length === 0 ? <p className="text-[12.5px] text-muted-soft">{t(lang, 'grc.control.noLinked')}</p> : (
            <ul className="divide-y divide-line">
              {linked.map((r) => {
                const s = riskScore(r.likelihood, r.impact);
                return (
                  <li key={r.id}>
                    <Link href={`/grc/iso27001/risks/${r.id}`} className="flex items-center gap-3 py-2 text-[13px] hover:text-accent">
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
