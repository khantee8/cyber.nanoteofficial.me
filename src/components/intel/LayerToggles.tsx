'use client';

import type { MapLayer } from './WorldMap';

const dot: Record<MapLayer, string> = {
  ransomware: 'var(--sev-critical)',
  c2: 'var(--sev-high)',
  heat: 'color-mix(in oklab, var(--sev-critical) 45%, var(--surface-2))',
};

export default function LayerToggles({
  layers, onChange, labels,
}: {
  layers: MapLayer[];
  onChange: (next: MapLayer[]) => void;
  labels: Record<MapLayer, string>;
}) {
  const toggle = (l: MapLayer) =>
    onChange(layers.includes(l) ? layers.filter((x) => x !== l) : [...layers, l]);
  return (
    <div className="mono flex flex-wrap items-center gap-1.5 text-[11px]" role="group" aria-label="Map layers">
      {(['ransomware', 'c2', 'heat'] as const).map((l) => {
        const on = layers.includes(l);
        return (
          <button
            key={l}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(l)}
            className={`flex items-center gap-1.5 rounded border px-2 py-1 transition-colors ${
              on ? 'border-line-strong bg-surface-2 text-fg' : 'border-line text-muted-soft hover:text-muted'
            }`}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: dot[l], opacity: on ? 1 : 0.35 }} />
            {labels[l]}
          </button>
        );
      })}
    </div>
  );
}
