import { bandColor, riskBand, type Methodology } from '@/lib/grc/iso27001/score';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

/** 5×5 likelihood × impact grid; impact rises upward, likelihood rightward. */
export default function HeatMap({ grid, methodology, lang, compact }: { grid: number[][]; methodology: Methodology; lang: Lang; compact?: boolean }) {
  const size = compact ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-[11px] sm:h-10 sm:w-10';
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="flex items-stretch gap-1">
        <div className="mono flex w-4 items-center justify-center text-[10px] text-muted-soft">
          <span className="-rotate-90 whitespace-nowrap">{t(lang, 'grc.risk.impact')} ↑</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {[5, 4, 3, 2, 1].map((impact) =>
            [1, 2, 3, 4, 5].map((likelihood) => {
              const n = grid[impact - 1][likelihood - 1];
              const band = riskBand(impact * likelihood, methodology);
              return (
                <div key={`${impact}-${likelihood}`}
                  className={`mono grid place-items-center rounded ${size}`}
                  style={{
                    background: `color-mix(in oklab, ${bandColor[band]} ${n > 0 ? 55 : 14}%, var(--surface-2))`,
                    color: n > 0 ? 'var(--fg)' : 'var(--muted-soft)',
                  }}
                  title={`L${likelihood} × I${impact} = ${impact * likelihood} · ${n}`}>
                  {n > 0 ? n : ''}
                </div>
              );
            }),
          )}
        </div>
      </div>
      <p className="mono self-end pr-1 text-[10px] text-muted-soft">{t(lang, 'grc.risk.likelihood')} →</p>
    </div>
  );
}
