import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import { band, bandColor } from '@/lib/grc/nist-csf-2/scale';
import type { FunctionRating } from '@/lib/grc/nist-csf-2/types';

export function ScoreBadge({ score, lang }: { score: number | null; lang: Lang }) {
  if (score === null) return <span className="mono text-[12px] text-muted-soft">—</span>;
  const b = band(score);
  const label = t(lang, `csf.band.${b}`);
  return (
    <span className="mono inline-flex items-center gap-1.5 text-[12.5px]" title={label}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: bandColor[b] }} aria-hidden />
      {score.toFixed(1)}
      <span className="sr-only">{label}</span>
    </span>
  );
}

const ratingColor: Record<FunctionRating, string> = {
  satisfactory: 'var(--accent)', needs_improvement: 'var(--sev-medium)', unsatisfactory: 'var(--sev-critical)',
};

export function RatingPill({ rating, lang }: { rating: FunctionRating | null; lang: Lang }) {
  const color = rating ? ratingColor[rating] : 'var(--muted-soft)';
  return (
    <span className="mono inline-flex items-center rounded border px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider"
      style={{ borderColor: `color-mix(in oklab, ${color} 55%, transparent)`, color }}>
      {t(lang, rating ? `csf.rating.${rating}` : 'csf.rating.none')}
    </span>
  );
}
