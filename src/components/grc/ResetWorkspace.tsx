'use client';

import { useActionState } from 'react';
import { resetWorkspace, type ActionResult } from '@/server/actions/grc';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

export default function ResetWorkspace({ orgName, lang }: { orgName: string; lang: Lang }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(resetWorkspace, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-[13px] leading-relaxed text-muted">{t(lang, 'grc.settings.resetLede')}</p>
      <input name="confirm" placeholder={orgName} autoComplete="off" className="field mono max-w-sm" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn border-sev-critical/50 text-sev-critical hover:bg-sev-critical/10">
          {t(lang, 'grc.settings.reset')}
        </button>
        {state?.ok ? <span className="text-[12px] text-accent">{t(lang, 'grc.settings.resetDone')}</span> : null}
        {state && !state.ok ? <span className="text-[12px] text-sev-critical">{state.message}</span> : null}
      </div>
    </form>
  );
}
