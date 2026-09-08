import type { IntelSnapshot } from './aggregate';
import type { MapPoint } from '@/components/intel/WorldMap';

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

