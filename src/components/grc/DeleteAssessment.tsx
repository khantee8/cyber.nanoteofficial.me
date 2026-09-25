'use client';

import { useState, useTransition } from 'react';
import { deleteAssessment } from '@/server/actions/grc';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

/** Deletes the assessment once its exact title is typed; the action redirects to the customer. */
export default function DeleteAssessment({ assessmentId, title, lang }: { assessmentId: string; title: string; lang: Lang }) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] leading-relaxed text-muted">{t(lang, 'grc.assessment.deleteLede')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t(lang, 'grc.assessment.deleteConfirm')}
          aria-label={t(lang, 'grc.assessment.deleteConfirm')} className="field w-72 max-w-full" />
        <button type="button" disabled={pending || typed !== title} className="btn border-sev-critical/50 text-sev-critical disabled:opacity-50"
          onClick={() => start(async () => {
            setError(null);
            const res = await deleteAssessment(assessmentId, typed);
            if (res && !res.ok) setError(res.message ?? t(lang, 'common.error'));
          })}>
          {t(lang, 'grc.assessment.delete')}
        </button>
        {error ? <span className="text-[12px] text-sev-critical">{error}</span> : null}
      </div>
    </div>
  );
}
