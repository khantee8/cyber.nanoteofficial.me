'use client';

import { useMemo, useState } from 'react';
import { buildAtlas } from '@/lib/intel/geo/atlas';
import { NUMERIC_TO_ALPHA2 } from '@/lib/intel/geo/iso';
import type { Lang } from '@/lib/lang';

export type MapLayer = 'ransomware' | 'c2' | 'heat';

export interface MapPoint {
  id: string;
  alpha2: string;
  kind: 'ransomware' | 'c2';
  weight: number;
  label: string;
  sub?: string;
  /** newest points pulse */
  fresh?: boolean;
}

export interface WorldMapProps {
  points: MapPoint[];
  /** alpha-2 → intensity 0..1 for the choropleth */
  heat: Record<string, number>;
  layers?: MapLayer[];
  interactive?: boolean;
  selected?: string | null;
  onSelectCountry?: (alpha2: string | null) => void;
  lang: Lang;
  className?: string;
}

const W = 960;
const H = 500;

const kindColor: Record<MapPoint['kind'], string> = {
  ransomware: 'var(--sev-critical)',
  c2: 'var(--sev-high)',
};

/**
 * Inline-SVG world map: Natural Earth projection over the 110m atlas. The
 * browser makes zero network requests for it. Country fills carry the heat
 * layer; points are sized by log weight and the freshest pulse.
 */
export default function WorldMap({
  points, heat, layers = ['ransomware', 'c2', 'heat'], interactive = true,
  selected = null, onSelectCountry, lang, className,
}: WorldMapProps) {
  const atlas = useMemo(() => buildAtlas(W, H), []);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);

  // Merge points on the same country so a busy country is one larger dot.
  const dots = useMemo(() => {
    const merged = new Map<string, MapPoint & { x: number; y: number; n: number }>();
    for (const p of points) {
      if (!layers.includes(p.kind)) continue;
      const pos = atlas.locate(p.alpha2);
      if (!pos) continue;
      const key = `${p.kind}:${p.alpha2}`;
      const cur = merged.get(key);
      if (cur) {
        cur.weight += p.weight;
        cur.n += 1;
        cur.fresh = cur.fresh || Boolean(p.fresh);
      } else {
        merged.set(key, { ...p, x: pos[0], y: pos[1], n: 1 });
      }
    }
    return [...merged.values()].sort((a, b) => b.weight - a.weight);
  }, [points, layers, atlas]);

  const showHeat = layers.includes('heat');

  return (
    <div className={`relative ${className ?? ''}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={lang === 'th' ? 'แผนที่โลกแสดงกิจกรรมภัยคุกคาม' : 'World map of threat activity'}
      >
        <g>
          {atlas.countries.map((c) => {
            const a2 = NUMERIC_TO_ALPHA2[c.id];
            const intensity = showHeat && a2 ? heat[a2] ?? 0 : 0;
            const isSel = selected && a2 === selected;
            return (
              <path
                key={c.id}
                d={c.path}
                fill={isSel ? 'var(--accent-dim)' : 'var(--surface-2)'}
                stroke={isSel ? 'var(--accent)' : 'var(--line-strong)'}
                strokeWidth={isSel ? 1.2 : 0.5}
                style={intensity > 0 ? { fill: `color-mix(in oklab, var(--sev-critical) ${Math.round(intensity * 45)}%, var(--surface-2))` } : undefined}
                className={interactive ? 'cursor-pointer transition-[fill] duration-200 hover:stroke-fg' : undefined}
                onMouseEnter={interactive ? () => setHover({ name: c.name, x: c.centroid[0], y: c.centroid[1] }) : undefined}
                onMouseLeave={interactive ? () => setHover(null) : undefined}
                onClick={interactive && onSelectCountry && a2 ? () => onSelectCountry(selected === a2 ? null : a2) : undefined}
              >
                <title>{c.name}</title>
              </path>
            );
          })}
        </g>
        <g>
          {dots.map((d) => {
            const r = 3 + 2.2 * Math.log2(1 + d.weight);
            return (
              <g key={`${d.kind}:${d.alpha2}`} className={interactive ? 'cursor-pointer' : undefined}
                onClick={interactive && onSelectCountry ? () => onSelectCountry(selected === d.alpha2 ? null : d.alpha2) : undefined}>
                <circle cx={d.x} cy={d.y} r={r + 4} fill={kindColor[d.kind]} opacity={0.12} />
                <circle
                  cx={d.x} cy={d.y} r={r}
                  fill={kindColor[d.kind]} opacity={0.85}
                  className={d.fresh ? 'live-dot' : undefined}
                  stroke="var(--bg)" strokeWidth={0.8}
                />
                <title>{`${d.alpha2} · ${d.n} ${d.kind === 'ransomware' ? (lang === 'th' ? 'เหยื่อแรนซัมแวร์' : 'ransomware claims') : (lang === 'th' ? 'เซิร์ฟเวอร์ C2' : 'C2 servers')}`}</title>
              </g>
            );
          })}
        </g>
      </svg>
      {hover ? (
        <div
          className="mono pointer-events-none absolute rounded border border-line-strong bg-bg/95 px-2 py-1 text-[11px] text-fg"
          style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%`, transform: 'translate(-50%, -140%)' }}
        >
          {hover.name}
        </div>
      ) : null}
    </div>
  );
}
