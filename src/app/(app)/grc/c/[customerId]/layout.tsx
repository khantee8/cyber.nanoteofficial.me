import Link from 'next/link';
import { loadCustomer } from '@/lib/grc/context';
import { t } from '@/lib/i18n';
import SubNav from '@/components/grc/SubNav';

export default async function CustomerLayout({ children, params }: LayoutProps<'/grc/c/[customerId]'>) {
  const { customerId } = await params;
  const { lang, customer, base } = await loadCustomer(customerId);
  const items = [
    { href: base, label: t(lang, 'grc.nav.workspace'), exact: true },
    { href: `${base}/risks`, label: t(lang, 'grc.nav.risks') },
    { href: `${base}/compare`, label: t(lang, 'grc.nav.compare') },
    { href: `${base}/settings`, label: t(lang, 'grc.nav.settings') },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-line pb-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href="/grc" className="mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg">{t(lang, 'grc.customers.title')}</Link>
          <span className="text-muted-soft">/</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-3">
            <h1 className="min-w-0 break-words text-[20px] font-semibold tracking-tight">{customer.name}</h1>
            {customer.industry ? <span className="text-[13px] text-muted">{customer.industry}</span> : null}
            {customer.archivedAt ? (
              <span className="mono rounded border border-line-strong px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-muted">{t(lang, 'grc.customers.archived')}</span>
            ) : null}
          </div>
          <SubNav items={items} />
        </div>
      </div>
      {children}
    </div>
  );
}
