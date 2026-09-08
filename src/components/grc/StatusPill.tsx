import type { ControlStatusValue } from '@/lib/grc/types';
import type { Band } from '@/lib/grc/iso27001/score';
import { bandColor } from '@/lib/grc/iso27001/score';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

const statusColor: Record<ControlStatusValue, string> = {
  not_started: 'var(--muted-soft)',
  partial: 'var(--sev-medium)',
  implemented: 'var(--accent)',
  not_applicable: 'var(--sev-low)',
};

export function StatusPill({ status, lang }: { status: ControlStatusValue; lang: Lang }) {
  return (
    <span className="mono inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-line px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-muted">
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: statusColor[status] }} />
      {t(lang, `grc.status.${status}`)}
    </span>
  );
}

export function BandPill({ band, lang, score }: { band: Band; lang: Lang; score?: number }) {
  return (
    <span className="mono inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider"
      style={{ borderColor: `color-mix(in oklab, ${bandColor[band]} 50%, transparent)`, color: bandColor[band] }}>
      {score !== undefined ? <span>{score}</span> : null}
      {t(lang, `grc.band.${band}`)}
    </span>
  );
}
