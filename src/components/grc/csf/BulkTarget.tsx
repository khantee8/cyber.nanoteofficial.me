'use client';

import { useState, useTransition } from 'react';
import { bulkSetTarget } from '@/server/actions/csf';
import { SCORE_STEPS } from '@/lib/grc/nist-csf-2/scale';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

export default function BulkTarget({ assessmentId, categoryId, lang }: { assessmentId: string; categoryId: string; lang: Lang }) {
  const [v, setV] = useState('6');
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
      <label className="inline-flex items-center gap-1.5">
        <span className="hidden sm:inline">{t(lang, 'csf.bulk.label')}</span>
        <select value={v} onChange={(e) => setV(e.target.value)} className="field mono h-7 min-h-0 w-16 py-0 text-[11.5px]" aria-label={`${categoryId} ${t(lang, 'csf.bulk.label')}`}>
          {SCORE_STEPS.map((s) => <option key={s} value={s}>{s.toFixed(1)}</option>)}
        </select>
      </label>
      <button type="button" disabled={pending} className="btn h-7 min-h-0 px-2 text-[11.5px]"
        onClick={() => start(async () => {
          const res = await bulkSetTarget(assessmentId, categoryId, v);
          setMsg(res.ok ? t(lang, 'common.saved') : (res.message ?? t(lang, 'common.error')));
        })}>
        {t(lang, 'csf.bulk.apply')}
      </button>
      {msg ? <span className="text-[11px]">{msg}</span> : null}
    </span>
  );
}
