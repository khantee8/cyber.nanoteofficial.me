import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import type { CsfFunctionId } from '@/lib/grc/nist-csf-2/types';

const SIZE = 260, C = SIZE / 2, R = 96;

function xy(i: number, n: number, v: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [C + Math.cos(a) * R * (v / 10), C + Math.sin(a) * R * (v / 10)] as const;
}
const poly = (vals: number[]) => vals.map((v, i) => xy(i, vals.length, v).join(',')).join(' ');

export default function Radar({ points, points2, labels, lang }: {
  points: { fn: CsfFunctionId; current: number | null; target: number | null }[];
  /**
   * A second series, index-aligned with `points` — e.g. another assessment's Current, for a
   * year-over-year comparison. When given, it is drawn as a dashed `--sev-low` outline in place
   * of the Target line.
   */
  points2?: (number | null)[];
  /** Legend labels for the two series when comparing profiles, replacing "Current" / "Target". */
  labels?: { a: string; b: string };
  lang: Lang;
}) {
  const n = points.length;
  const cur = points.map((p) => p.current ?? 0);
  const hasTarget = points.some((p) => p.target !== null);
  const tgt = points.map((p) => p.target ?? 0);
  const cur2 = points2?.map((v) => v ?? 0);
  const label = points.map((p, i) => `${p.fn} ${p.current ?? '—'} / ${points2 ? (points2[i] ?? '—') : (p.target ?? '—')}`).join(', ');
  return (
    <figure className="flex flex-col items-center gap-2">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full max-w-[280px]" role="img" aria-label={`${t(lang, 'csf.dash.radar')}: ${label}`}>
        {[2, 4, 6, 8, 10].map((v) => (
          <polygon key={v} points={poly(Array(n).fill(v))} fill="none"
            stroke={v === 6 ? 'var(--line-strong)' : 'var(--line)'} strokeWidth={1} />
        ))}
        <polygon points={poly(Array(n).fill(5))} fill="none" stroke="var(--sev-medium)" strokeDasharray="2 3" strokeWidth={1} />
        {points.map((p, i) => {
          const [x, y] = xy(i, n, 10);
          const [lx, ly] = xy(i, n, 11.8);
          return (
            <g key={p.fn}>
              <line x1={C} y1={C} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="mono" fontSize={10} fill="var(--muted)">{p.fn}</text>
            </g>
          );
        })}
        {cur2 ? (
          <polygon points={poly(cur2)} fill="none" stroke="var(--sev-low)" strokeDasharray="4 3" strokeWidth={1.5} />
        ) : hasTarget ? (
          <polygon points={poly(tgt)} fill="none" stroke="var(--fg)" strokeOpacity={0.7} strokeDasharray="4 3" strokeWidth={1.5} />
        ) : null}
        <polygon points={poly(cur)} fill="var(--accent)" fillOpacity={0.18} stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <figcaption className="mono flex flex-wrap justify-center gap-4 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-accent" />{labels?.a ?? t(lang, 'csf.current')}</span>
        {cur2 ? (
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t border-dashed" style={{ borderColor: 'var(--sev-low)' }} />{labels?.b ?? t(lang, 'csf.target')}</span>
        ) : hasTarget ? (
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t border-dashed border-fg/70" />{t(lang, 'csf.target')}</span>
        ) : null}
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t border-dotted border-sev-medium" />5</span>
      </figcaption>
    </figure>
  );
}
