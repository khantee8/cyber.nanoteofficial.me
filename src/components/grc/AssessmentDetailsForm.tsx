'use client';

import { useActionState } from 'react';
import { updateAssessment, type ActionResult } from '@/server/actions/grc';
import type { Assessment } from '@/db/schema';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

type Fields = Pick<Assessment, 'id' | 'title' | 'fiscalYear' | 'periodStart' | 'periodEnd' | 'status' | 'folderId' | 'scope' | 'lead'>;

/** Posts every field on every save — `updateAssessment` has no partial patch. */
export default function AssessmentDetailsForm({ assessment: a, statuses, folders, lang }: {
  assessment: Fields; statuses: readonly Assessment['status'][]; folders: { id: string; label: string }[]; lang: Lang;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateAssessment, null);
  const label = 'flex flex-col gap-1 text-[13px]';
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="assessmentId" value={a.id} />
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.assessment.title')}</span>
        <input name="title" required maxLength={200} defaultValue={a.title} className="field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.assessment.fiscalYear')}</span>
          <input name="fiscalYear" type="number" min={1990} max={2100} defaultValue={a.fiscalYear ?? ''} className="field mono" />
        </label>
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.assessment.periodStart')}</span>
          <input name="periodStart" type="date" defaultValue={a.periodStart ?? ''} className="field mono" />
        </label>
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.assessment.periodEnd')}</span>
          <input name="periodEnd" type="date" defaultValue={a.periodEnd ?? ''} className="field mono" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.assessment.status')}</span>
          <select name="status" defaultValue={a.status} className="field">
            {statuses.map((s) => <option key={s} value={s}>{t(lang, `grc.assessment.status.${s}`)}</option>)}
          </select>
        </label>
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.assessment.folder')}</span>
          <select name="folderId" defaultValue={a.folderId ?? ''} className="field">
            <option value="">{t(lang, 'grc.folders.root')}</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
      </div>
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.assessment.scope')}</span>
        <textarea name="scope" rows={3} maxLength={2000} defaultValue={a.scope ?? ''} className="field leading-relaxed" />
      </label>
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.assessment.lead')}</span>
        <input name="lead" maxLength={120} defaultValue={a.lead ?? ''} className="field" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? t(lang, 'common.saving') : t(lang, 'common.save')}</button>
        {state?.ok ? <span className="text-[12px] text-accent">{t(lang, 'common.saved')}</span> : null}
        {state && !state.ok ? <span className="text-[12px] text-sev-critical">{state.message}</span> : null}
      </div>
    </form>
  );
}
