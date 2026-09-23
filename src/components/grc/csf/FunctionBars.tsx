import Link from 'next/link';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import type { CsfSummary } from '@/lib/grc/nist-csf-2/score';
import type { CsfFunctionId, FunctionRating } from '@/lib/grc/nist-csf-2/types';
import { RatingPill } from './Pills';

export default function FunctionBars({ items, lang, base }: {
  items: { fn: CsfFunctionId; name: string; s: CsfSummary; rating: FunctionRating | null }[]; lang: Lang; base: string;
}) {
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map(({ fn, name, s, rating }) => (
        <li key={fn}>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
            <Link href={`${base}/profile?fn=${fn}`} className="hover:text-accent">
              <span className="mono mr-1.5 text-[11px] text-muted-soft">{fn}</span>{name}
            </Link>
            <span className="flex items-center gap-2">
              <span className="mono text-[11.5px] text-muted">
                {s.avgCurrent ?? '—'} <span className="text-muted-soft">/ {s.avgTarget ?? '—'}</span>
              </span>
              <RatingPill rating={rating} lang={lang} />
            </span>
          </div>
          <div className="relative h-[6px] rounded-full bg-surface-3" aria-hidden>
            <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${((s.avgCurrent ?? 0) / 10) * 100}%` }} />
            {s.avgTarget !== null ? <span className="absolute -top-1 h-[14px] w-0.5 bg-fg/70" style={{ left: `${(s.avgTarget / 10) * 100}%` }} /> : null}
          </div>
          <p className="mono mt-1 text-[10.5px] text-muted-soft">{t(lang, 'csf.coverageOf', { a: s.assessed, n: s.inScope })}</p>
        </li>
      ))}
    </ul>
  );
}
