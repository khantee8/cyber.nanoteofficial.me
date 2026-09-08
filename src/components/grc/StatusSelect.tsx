'use client';

import { useState, useTransition } from 'react';
import { setControlStatus } from '@/server/actions/grc';
import { CONTROL_STATUSES, type ControlStatusValue } from '@/lib/grc/types';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

const colors: Record<ControlStatusValue, string> = {
  not_started: 'var(--muted-soft)', partial: 'var(--sev-medium)', implemented: 'var(--accent)', not_applicable: 'var(--sev-low)',
};

export default function StatusSelect({ controlId, value, lang }: { controlId: string; value: ControlStatusValue; lang: Lang }) {
  const [current, setCurrent] = useState(value);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: colors[current] }} />
      <select
        value={current}
        disabled={pending}
        aria-label={`${controlId} ${t(lang, 'grc.controls.status')}`}
        onChange={(e) => {
          const next = e.target.value as ControlStatusValue;
          const prev = current;
          setCurrent(next);
          setError(null);
          start(async () => {
            const res = await setControlStatus({ controlId, status: next });
            if (!res.ok) { setCurrent(prev); setError(res.message ?? 'error'); }
          });
        }}
        className="field h-8 min-h-0 w-auto py-0 pr-7 text-[12px]"
      >
        {CONTROL_STATUSES.map((s) => <option key={s} value={s}>{t(lang, `grc.status.${s}`)}</option>)}
      </select>
      {error ? <span className="text-[11px] text-sev-critical">{error}</span> : null}
    </span>
  );
}
