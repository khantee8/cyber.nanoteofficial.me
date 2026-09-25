import Link from 'next/link';
import { customerBase, loadViewer } from '@/lib/grc/context';
import { listCustomers } from '@/lib/grc/queries';
import { since } from '@/lib/grc/since';
import { t } from '@/lib/i18n';
import Icon from '@/components/site/Icon';

export const metadata = { title: 'GRC customers' };

export default async function CustomersPage({ searchParams }: PageProps<'/grc'>) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 120) : '';
  const includeArchived = sp.archived === '1';
  const { lang } = await loadViewer();
  const customers = await listCustomers({ includeArchived, q });
  const now = new Date();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">{t(lang, 'grc.eyebrow')}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(lang, 'grc.customers.title')}</h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t(lang, 'grc.customers.lede')}</p>
        </div>
        <Link href="/grc/new" className="btn btn-primary"><Icon name="clipboard" className="h-4 w-4" />{t(lang, 'grc.customers.new')}</Link>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-3" role="search">
        <input type="search" name="q" defaultValue={q} maxLength={120} placeholder={t(lang, 'grc.customers.search')}
          aria-label={t(lang, 'grc.customers.search')} className="field w-72 max-w-full" />
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" name="archived" value="1" defaultChecked={includeArchived} />
          {t(lang, 'grc.customers.showArchived')}
        </label>
        <button type="submit" className="btn">{t(lang, 'common.search')}</button>
      </form>

      {customers.length === 0 ? (
        <div className="panel px-4 py-12 text-center text-[13px] text-muted">{t(lang, 'grc.customers.none')}</div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <li key={c.id}>
              <Link href={customerBase(c.id)} className={`panel flex h-full flex-col gap-2 p-5 transition-colors hover:border-line-strong ${c.archivedAt ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words text-[17px] font-semibold tracking-tight">{c.name}</h2>
                  {c.archivedAt ? (
                    <span className="mono shrink-0 rounded border border-line-strong px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-muted">{t(lang, 'grc.customers.archived')}</span>
                  ) : null}
                </div>
                <p className="text-[13px] text-muted">{c.industry ?? '—'}{c.sizeBand ? ` · ${c.sizeBand}` : ''}</p>
                <div className="mono mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-[11.5px] text-muted-soft">
                  <span>{t(lang, 'grc.customers.assessments', { n: c.assessmentCount })}</span>
                  {c.lastActivity ? <span>{t(lang, 'grc.assessment.updated')} {since(c.lastActivity, now, lang)}</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
