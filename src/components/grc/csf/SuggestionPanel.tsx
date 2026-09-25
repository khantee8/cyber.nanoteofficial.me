'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { acceptSuggestion } from '@/server/actions/csf';
import type { Suggestion } from '@/lib/grc/nist-csf-2/score';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

export default function SuggestionPanel({ assessmentId, subcategoryId, suggestion, current, lang, base }: {
  assessmentId: string; subcategoryId: string; suggestion: Suggestion; current: number | null; lang: Lang;
  /** The ISO source assessment's `/grc/a/<id>/iso` path, or null when the customer has none (parts render unlinked). */
  base: string | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (suggestion.parts.length === 0) return null;
  return (
    <section className="panel p-4">
      <p className="eyebrow mb-2">{t(lang, 'csf.suggest.title')}</p>
      {suggestion.value === null ? (
        <p className="text-[12.5px] text-muted-soft">{t(lang, 'csf.suggest.none')}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="mono text-[22px] font-semibold">{suggestion.value.toFixed(1)}</span>
          {current !== suggestion.value ? (
            <button type="button" disabled={pending} className="btn h-8 min-h-0 text-[12.5px]"
              onClick={() => start(async () => {
                const res = await acceptSuggestion(assessmentId, subcategoryId);
                if (!res.ok) setError(res.message ?? t(lang, 'common.error'));
              })}>
              {t(lang, 'csf.suggest.accept', { v: suggestion.value.toFixed(1) })}
            </button>
          ) : null}
          {error ? <span className="text-[11px] text-sev-critical">{error}</span> : null}
        </div>
      )}
      <ul className="mono mt-3 flex flex-wrap gap-1.5 text-[11px]">
        {suggestion.parts.map((p) => (
          <li key={p.controlId}>
            {base ? (
              <Link href={`${base}/controls/${p.controlId}`} className="rounded border border-line px-1.5 py-0.5 text-muted hover:text-fg">
                {p.controlId} · {p.status ? t(lang, `grc.status.${p.status}`) : '—'}{p.weight !== null ? ` · ${p.weight}` : ''}
              </Link>
            ) : (
              <span className="rounded border border-line px-1.5 py-0.5 text-muted">{p.controlId} · —</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-muted-soft">{t(lang, 'csf.suggest.weights')}</p>
    </section>
  );
}
