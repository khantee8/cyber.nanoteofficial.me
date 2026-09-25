import { loadCustomer } from '@/lib/grc/context';
import { t } from '@/lib/i18n';
import CustomerForm, { ArchiveCustomer } from '@/components/grc/CustomerForm';
import MethodologyForm from '@/components/grc/MethodologyForm';

export const metadata = { title: 'Customer settings' };

export default async function CustomerSettingsPage({ params }: PageProps<'/grc/c/[customerId]/settings'>) {
  const { customerId } = await params;
  const { lang, customer, methodology } = await loadCustomer(customerId);
  const archived = customer.archivedAt !== null;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <section className="panel p-5">
        <h2 className="mb-4 text-[15px] font-semibold">{t(lang, 'grc.customer.details')}</h2>
        <CustomerForm
          customer={{ id: customer.id, name: customer.name, industry: customer.industry, sizeBand: customer.sizeBand, notes: customer.notes }}
          lang={lang}
        />
      </section>
      <section className="panel p-5">
        <h2 className="text-[15px] font-semibold">{t(lang, 'grc.settings.method')}</h2>
        <p className="mb-4 mt-1 text-[13px] leading-relaxed text-muted">{t(lang, 'grc.settings.methodLede')}</p>
        <MethodologyForm customerId={customer.id} m={methodology} lang={lang} />
      </section>
      <section className="panel p-5">
        <h2 className="mb-2 text-[15px] font-semibold">{archived ? t(lang, 'grc.customer.unarchive') : t(lang, 'grc.customer.archive')}</h2>
        <ArchiveCustomer customerId={customer.id} archived={archived} lang={lang} />
      </section>
    </div>
  );
}
