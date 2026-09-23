import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import type { CsfFunctionId } from '@/lib/grc/nist-csf-2/types';

const SIZE = 260, C = SIZE / 2, R = 96;

function xy(i: number, n: number, v: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [C + Math.cos(a) * R * (v / 10), C + Math.sin(a) * R * (v / 10)] as const;
}
const poly = (vals: number[]) => vals.map((v, i) => xy(i, vals.length, v).join(',')).join(' ');

export default function Radar({ points, lang }: { points: { fn: CsfFunctionId; current: number | null; target: number | null }[]; lang: Lang }) {
  const n = points.length;
  const cur = points.map((p) => p.current ?? 0);
  const tgt = points.map((p) => p.target ?? 0);
  const label = points.map((p) => `${p.fn} ${p.current ?? '—'} / ${p.target ?? '—'}`).join(', ');
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
        <polygon points={poly(tgt)} fill="none" stroke="var(--fg)" strokeOpacity={0.7} strokeDasharray="4 3" strokeWidth={1.5} />
        <polygon points={poly(cur)} fill="var(--accent)" fillOpacity={0.18} stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <figcaption className="mono flex gap-4 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-accent" />{t(lang, 'csf.current')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t border-dashed border-fg/70" />{t(lang, 'csf.target')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t border-dotted border-sev-medium" />5</span>
      </figcaption>
    </figure>
  );
}
