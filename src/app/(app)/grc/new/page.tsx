import Link from 'next/link';
import { loadViewer } from '@/lib/grc/context';
import { t } from '@/lib/i18n';
import CustomerForm from '@/components/grc/CustomerForm';

export const metadata = { title: 'New customer' };

export default async function NewCustomerPage() {
  const { lang } = await loadViewer();
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/grc" className="mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg">← {t(lang, 'grc.customers.title')}</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t(lang, 'grc.customers.new')}</h1>
      <div className="panel mt-6 p-5">
        <CustomerForm customer={null} lang={lang} />
      </div>
    </div>
  );
}
