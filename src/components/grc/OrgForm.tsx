'use client';

import { useActionState } from 'react';
import { createOrganisation, updateOrganisation, type ActionResult } from '@/server/actions/grc';
import type { Organisation } from '@/db/schema';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

const SIZES = ['1-10', '11-50', '51-250', '251-1000', '1000+'] as const;

export default function OrgForm({ org, lang }: { org: Organisation | null; lang: Lang }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(org ? updateOrganisation : createOrganisation, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.org.name')}</span>
        <input name="name" required maxLength={120} defaultValue={org?.name ?? ''} className="field" />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.org.scope')}</span>
        <textarea name="scope" rows={4} maxLength={2000} defaultValue={org?.scope ?? ''} className="field leading-relaxed" placeholder={t(lang, 'grc.org.scopeHint')} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.org.industry')}</span>
          <input name="industry" maxLength={120} defaultValue={org?.industry ?? ''} className="field" />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.org.size')}</span>
          <select name="sizeBand" defaultValue={org?.sizeBand ?? ''} className="field">
            <option value="">—</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.org.lead')}</span>
          <input name="ismsLead" maxLength={120} defaultValue={org?.ismsLead ?? ''} className="field" />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? t(lang, 'common.saving') : org ? t(lang, 'common.save') : t(lang, 'grc.org.create')}
        </button>
        {state?.ok && state.message === 'saved' ? <span className="text-[12px] text-accent">{t(lang, 'common.saved')}</span> : null}
        {state && !state.ok ? <span className="text-[12px] text-sev-critical">{state.message}</span> : null}
      </div>
    </form>
  );
}
