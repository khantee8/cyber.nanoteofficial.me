'use client';

import { useActionState } from 'react';
import { updateMethodology, type ActionResult } from '@/server/actions/grc';
import type { Methodology } from '@/lib/grc/iso27001/score';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

export default function MethodologyForm({ m, lang }: { m: Methodology; lang: Lang }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateMethodology, null);
  const fields: { name: keyof Methodology; key: 'grc.settings.lowMax' | 'grc.settings.mediumMax' | 'grc.settings.highMax' | 'grc.settings.acceptMax' }[] = [
    { name: 'lowMax', key: 'grc.settings.lowMax' },
    { name: 'mediumMax', key: 'grc.settings.mediumMax' },
    { name: 'highMax', key: 'grc.settings.highMax' },
    { name: 'acceptMax', key: 'grc.settings.acceptMax' },
  ];
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-4">
        {fields.map((f) => (
          <label key={f.name} className="flex flex-col gap-1 text-[13px]">
            <span className="text-muted">{t(lang, f.key)}</span>
            <input name={f.name} type="number" min={1} max={25} required defaultValue={m[f.name]} className="field mono" />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? t(lang, 'common.saving') : t(lang, 'common.save')}</button>
        {state?.ok ? <span className="text-[12px] text-accent">{t(lang, 'common.saved')}</span> : null}
        {state && !state.ok ? <span className="text-[12px] text-sev-critical">{state.message}</span> : null}
      </div>
    </form>
  );
}
