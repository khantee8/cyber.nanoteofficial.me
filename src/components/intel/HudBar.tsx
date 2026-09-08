'use client';

import { useEffect, useState } from 'react';
import type { IntelSnapshot } from '@/lib/intel/aggregate';
import type { SourceId } from '@/lib/intel/types';
import { fmtInt } from '@/lib/intel/format';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

/**
 * Counts from 0 to `target` on mount. State is only written from the animation
 * frame callback, never synchronously inside the effect. Reduced-motion users
 * and the server render see the final value straight away.
 */
function useCountUp(target: number, ms = 900): number {
  const [v, setV] = useState<number | null>(null);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = reduce ? 1 : Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v ?? target;
}

const infoconColor: Record<string, string> = {
  green: 'var(--accent)',
  yellow: 'var(--sev-medium)',
  orange: 'var(--sev-high)',
  red: 'var(--sev-critical)',
  unknown: 'var(--muted-soft)',
};

const sourceLabel: Record<SourceId, string> = {
  kev: 'CISA KEV', epss: 'EPSS', ransomware: 'ransomware.live', feodo: 'Feodo', isc: 'SANS ISC', news: 'RSS',
};

export function SourceHealthDots({ health, lang }: { health: IntelSnapshot['health']; lang: Lang }) {
  return (
    <ul className="mono flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-soft">
      {(Object.keys(sourceLabel) as SourceId[]).map((id) => {
        const h = health[id];
        const color = h?.status === 'ok' ? 'var(--accent)' : h?.status === 'stale' ? 'var(--sev-medium)' : 'var(--sev-critical)';
        return (
          <li key={id} className="flex items-center gap-1.5" title={`${sourceLabel[id]}: ${h?.status ?? 'down'} · ${h?.ms ?? 0} ms`}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {sourceLabel[id]}
            <span className="sr-only">{t(lang, h?.status === 'ok' ? 'intel.health.ok' : h?.status === 'stale' ? 'intel.health.stale' : 'intel.health.down')}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Tile({ label, value, accent, sub }: { label: string; value: number | string; accent?: string; sub?: string }) {
  const n = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div className="panel flex min-w-0 flex-col gap-1 px-4 py-3">
      <span className="eyebrow truncate">{label}</span>
      <span className="mono text-[26px] font-semibold leading-none tracking-tight" style={accent ? { color: accent } : undefined}>
        {typeof value === 'number' ? fmtInt(n) : value}
      </span>
      {sub ? <span className="mono truncate text-[11px] text-muted-soft">{sub}</span> : null}
    </div>
  );
}

export default function HudBar({ snapshot, lang, compact = false, refreshedAgo }: { snapshot: IntelSnapshot; lang: Lang; compact?: boolean; refreshedAgo?: string }) {
  const { stats, health } = snapshot;
  const stale = Object.values(health).some((h) => h.status !== 'ok');
  return (
    <div className="flex flex-col gap-3">
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <Tile label={t(lang, 'intel.kev7d')} value={stats.kevAdded7d} accent="var(--sev-critical)"
          sub={stats.kevRansomware7d ? `${stats.kevRansomware7d} ${t(lang, 'intel.exploited.ransom')}` : undefined} />
        <Tile label={t(lang, 'intel.ransom7d')} value={stats.ransomware7d} accent="var(--sev-high)"
          sub={stats.topGroups7d[0] ? `${stats.topGroups7d[0].group} · ${stats.topGroups7d[0].count}` : undefined} />
        <Tile label={t(lang, 'intel.c2online')} value={stats.c2Online} accent="var(--sev-medium)" />
        <Tile label={t(lang, 'intel.infocon')} value={stats.infocon.toUpperCase()} accent={infoconColor[stats.infocon]} />
      </div>
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <SourceHealthDots health={health} lang={lang} />
          <p className="mono flex items-center gap-2 text-[11px] text-muted-soft">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: stale ? 'var(--sev-medium)' : 'var(--accent)' }} />
            {t(lang, stale ? 'common.stale' : 'common.live')} · {t(lang, 'intel.refreshed')} {refreshedAgo ?? '—'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
