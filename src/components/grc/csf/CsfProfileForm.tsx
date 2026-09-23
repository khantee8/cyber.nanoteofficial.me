'use client';

import { useActionState } from 'react';
import { saveCsfProfile } from '@/server/actions/csf';
import type { ActionResult } from '@/server/actions/shared';
import type { CsfProfile } from '@/db/schema';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

const TIERS = [1, 2, 3, 4] as const;
const TIER_KEY = { 1: 'csf.tier.1', 2: 'csf.tier.2', 3: 'csf.tier.3', 4: 'csf.tier.4' } as const;

export default function CsfProfileForm({ profile, lang }: { profile: CsfProfile | null; lang: Lang }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveCsfProfile, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'csf.settings.scope')}</span>
        <textarea name="scope" rows={4} maxLength={2000} defaultValue={profile?.scope ?? ''} className="field leading-relaxed" placeholder={t(lang, 'csf.settings.scopeHint')} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['currentTier', 'targetTier'] as const).map((name) => (
          <label key={name} className="flex flex-col gap-1 text-[13px]">
            <span className="text-muted">{t(lang, name === 'currentTier' ? 'csf.settings.currentTier' : 'csf.settings.targetTier')}</span>
            <select name={name} defaultValue={profile?.[name] ?? ''} className="field">
              <option value="">—</option>
              {TIERS.map((n) => <option key={n} value={n}>{t(lang, TIER_KEY[n])}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? t(lang, 'common.saving') : t(lang, 'common.save')}</button>
        {state ? <span className={`text-[12px] ${state.ok ? 'text-accent' : 'text-sev-critical'}`}>{state.ok ? t(lang, 'common.saved') : state.message}</span> : null}
      </div>
    </form>
  );
}
