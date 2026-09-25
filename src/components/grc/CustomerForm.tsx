'use client';

import { useActionState, useState, useTransition } from 'react';
import { createCustomer, setCustomerArchived, updateCustomer, type ActionResult } from '@/server/actions/grc';
import type { Customer } from '@/db/schema';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

const SIZES = ['1-10', '11-50', '51-250', '251-1000', '1000+'] as const;

type Fields = Pick<Customer, 'id' | 'name' | 'industry' | 'sizeBand' | 'notes'>;

/** Create mode (`customer` null) redirects to the new customer; update mode saves in place. */
export default function CustomerForm({ customer, lang }: { customer: Fields | null; lang: Lang }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(customer ? updateCustomer : createCustomer, null);
  const label = 'flex flex-col gap-1 text-[13px]';
  return (
    <form action={action} className="flex flex-col gap-4">
      {customer ? <input type="hidden" name="customerId" value={customer.id} /> : null}
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.org.name')}</span>
        <input name="name" required maxLength={120} defaultValue={customer?.name ?? ''} className="field" />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.org.industry')}</span>
          <input name="industry" maxLength={120} defaultValue={customer?.industry ?? ''} className="field" />
        </label>
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.org.size')}</span>
          <select name="sizeBand" defaultValue={customer?.sizeBand ?? ''} className="field">
            <option value="">—</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.customer.notes')}</span>
        <textarea name="notes" rows={4} maxLength={4000} defaultValue={customer?.notes ?? ''} className="field leading-relaxed" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? t(lang, 'common.saving') : customer ? t(lang, 'common.save') : t(lang, 'grc.customer.create')}
        </button>
        {state?.ok ? <span className="text-[12px] text-accent">{t(lang, 'common.saved')}</span> : null}
        {state && !state.ok ? <span className="text-[12px] text-sev-critical">{state.message}</span> : null}
      </div>
    </form>
  );
}

/** Archive hides the customer from the list; restore brings it back. Nothing is deleted. */
export function ArchiveCustomer({ customerId, archived, lang }: { customerId: string; archived: boolean; lang: Lang }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] leading-relaxed text-muted">{t(lang, 'grc.customer.archiveLede')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} className="btn"
          onClick={() => start(async () => {
            setError(null);
            const res = await setCustomerArchived(customerId, !archived);
            if (!res.ok) setError(res.message ?? t(lang, 'common.error'));
          })}>
          {archived ? t(lang, 'grc.customer.unarchive') : t(lang, 'grc.customer.archive')}
        </button>
        {error ? <span className="text-[12px] text-sev-critical">{error}</span> : null}
      </div>
    </div>
  );
}
