'use client';

import { useState, useTransition } from 'react';
import { saveCsfScore } from '@/server/actions/csf';
import { SCORE_STEPS, band, bandColor } from '@/lib/grc/nist-csf-2/scale';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

export default function ScorePicker({ subcategoryId, field, value, lang }: {
  subcategoryId: string; field: 'current' | 'target'; value: number | null; lang: Lang;
}) {
  const [v, setV] = useState<number | null>(value);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" aria-hidden
        style={{ background: v === null ? 'var(--surface-3)' : bandColor[band(v)] }} />
      <select
        value={v === null ? '' : String(v)}
        disabled={pending}
        aria-label={`${subcategoryId} ${t(lang, field === 'current' ? 'csf.current' : 'csf.target')}`}
        title={v === null ? undefined : t(lang, `csf.band.${band(v)}`)}
        onChange={(e) => {
          const next = e.target.value === '' ? null : Number(e.target.value);
          const prev = v;
          setV(next); setError(null);
          start(async () => {
            const res = await saveCsfScore({ subcategoryId, [field]: next });
            if (!res.ok) { setV(prev); setError(res.message ?? t(lang, 'common.error')); }
          });
        }}
        className="field mono h-8 min-h-0 w-[4.5rem] py-0 pr-6 text-[12px]"
      >
        <option value="">—</option>
        {SCORE_STEPS.map((s) => <option key={s} value={s}>{s.toFixed(1)}</option>)}
      </select>
      {error ? <span className="text-[11px] text-sev-critical">{error}</span> : null}
    </span>
  );
}
