'use client';

import { useMemo, useState } from 'react';
import type { IntelSnapshot } from '@/lib/intel/aggregate';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import WorldMap, { type MapLayer, type MapPoint } from './WorldMap';
import LayerToggles from './LayerToggles';
import HudBar from './HudBar';
import { ExploitedPanel, HeadlinesPanel, InfraPanel, RansomwarePanel } from './panels';

type Tab = 'exploited' | 'ransomware' | 'infra' | 'news';

/** Build map points and heat from a snapshot. Shared with the landing page band. */
export function mapDataFrom(snapshot: IntelSnapshot): { points: MapPoint[]; heat: Record<string, number> } {
  const points: MapPoint[] = [];
  const freshCut = snapshot.ransomware[9]?.discovered ?? '';
  for (const v of snapshot.ransomware) {
    if (!v.country) continue;
    points.push({ id: `${v.group}:${v.victim}`, alpha2: v.country, kind: 'ransomware', weight: 1, label: v.victim, sub: v.group, fresh: v.discovered >= freshCut });
  }
  for (const c of snapshot.c2) {
    if (!c.country || c.status !== 'online') continue;
    points.push({ id: c.ip, alpha2: c.country, kind: 'c2', weight: 1, label: c.ip, sub: c.malware, fresh: true });
  }
  const heat: Record<string, number> = {};
  const max = Math.max(1, ...Object.values(snapshot.stats.byCountry).map((b) => b.ransomware + b.c2));
  for (const [a2, b] of Object.entries(snapshot.stats.byCountry)) heat[a2] = (b.ransomware + b.c2) / max;
  return { points, heat };
}

export default function IntelWorkspace({ snapshot, lang, refreshedAgo }: { snapshot: IntelSnapshot; lang: Lang; refreshedAgo: string }) {
  const [country, setCountry] = useState<string | null>(null);
  const [layers, setLayers] = useState<MapLayer[]>(['ransomware', 'c2', 'heat']);
  const [tab, setTab] = useState<Tab>('exploited');
  const { points, heat } = useMemo(() => mapDataFrom(snapshot), [snapshot]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'exploited', label: t(lang, 'intel.tab.exploited') },
    { id: 'ransomware', label: t(lang, 'intel.tab.ransomware') },
    { id: 'infra', label: t(lang, 'intel.tab.infra') },
    { id: 'news', label: t(lang, 'intel.tab.news') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <HudBar snapshot={snapshot} lang={lang} refreshedAgo={refreshedAgo} />

      {/* mobile: tabs */}
      <div role="tablist" className="mono flex gap-1 rounded-md border border-line bg-surface p-1 text-[11.5px] lg:hidden">
        {tabs.map((tb) => (
          <button key={tb.id} role="tab" aria-selected={tab === tb.id} type="button" onClick={() => setTab(tb.id)}
            className={`flex-1 rounded px-2 py-1.5 ${tab === tb.id ? 'bg-surface-2 text-fg' : 'text-muted'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="panel relative min-w-0 overflow-hidden lg:col-span-7">
          <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
            <LayerToggles layers={layers} onChange={setLayers}
              labels={{ ransomware: t(lang, 'intel.layers.ransomware'), c2: t(lang, 'intel.layers.c2'), heat: t(lang, 'intel.layers.heat') }} />
            {country ? (
              <button type="button" onClick={() => setCountry(null)}
                className="mono flex items-center gap-1.5 rounded border border-accent/50 bg-accent-dim px-2 py-1 text-[11px] text-accent">
                {t(lang, 'intel.filter')} {country} · {t(lang, 'intel.clear')}
              </button>
            ) : null}
          </div>
          <WorldMap points={points} heat={heat} layers={layers} selected={country} onSelectCountry={setCountry} lang={lang} className="pt-10" />
        </div>
        <div className={`min-w-0 lg:col-span-5 ${tab === 'exploited' ? '' : 'hidden lg:block'}`}>
          <ExploitedPanel snapshot={snapshot} lang={lang} limit={30} scroll />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`min-w-0 ${tab === 'ransomware' ? '' : 'hidden lg:block'}`}><RansomwarePanel snapshot={snapshot} lang={lang} country={country} limit={40} scroll /></div>
        <div className={`min-w-0 ${tab === 'infra' ? '' : 'hidden lg:block'}`}><InfraPanel snapshot={snapshot} lang={lang} country={country} /></div>
        <div className={`min-w-0 ${tab === 'news' ? '' : 'hidden lg:block'}`}><HeadlinesPanel snapshot={snapshot} lang={lang} scroll /></div>
      </div>
    </div>
  );
}
