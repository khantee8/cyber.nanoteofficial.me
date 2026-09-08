import type { C2Server, Headline, IscStatus, KevEntry, RansomVictim, SourceId } from './types';
import { fetchKev, selectRecentKev } from './sources/kev';
import { fetchEpss } from './sources/epss';
import { fetchRansomware, selectRecentVictims } from './sources/ransomware';
import { fetchFeodo } from './sources/feodo';
import { fetchIsc } from './sources/isc';
import { fetchNews } from './sources/news';

export interface SourceHealth {
  status: 'ok' | 'stale' | 'down';
  fetchedAt: string;   // when this data was obtained (fallback capture time when stale)
  ms: number;
}

export interface IntelStats {
  kevAdded7d: number;
  kevRansomware7d: number;
  ransomware7d: number;
  c2Online: number;
  infocon: IscStatus['infocon'];
  topGroups7d: { group: string; count: number }[];
  topSectors7d: { sector: string; count: number }[];
  topVendors30d: { vendor: string; count: number }[];
  byCountry: Record<string, { ransomware: number; c2: number }>;
}

export interface IntelSnapshot {
  generatedAt: string;
  kev: KevEntry[];
  ransomware: RansomVictim[];
  c2: C2Server[];
  isc: IscStatus;
  headlines: Headline[];
  health: Record<SourceId, SourceHealth>;
  stats: IntelStats;
}

export interface Fetchers {
  kev: () => Promise<KevEntry[] | null>;
  epss: (cves: string[]) => Promise<Map<string, number> | null>;
  ransomware: () => Promise<RansomVictim[] | null>;
  feodo: () => Promise<C2Server[] | null>;
  isc: () => Promise<IscStatus | null>;
  news: () => Promise<Headline[] | null>;
}

const live: Fetchers = {
  kev: () => fetchKev(),
  epss: (cves) => fetchEpss(cves),
  ransomware: () => fetchRansomware(),
  feodo: () => fetchFeodo(),
  isc: () => fetchIsc(),
  news: () => fetchNews(),
};

export const KEV_KEEP = 60;
export const RANSOMWARE_KEEP = 150;
export const EPSS_LOOKUP = 30;

function topN<T>(items: T[], key: (t: T) => string | null, n: number): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export function computeStats(
  s: Pick<IntelSnapshot, 'kev' | 'ransomware' | 'c2' | 'isc'>,
  now: Date,
): IntelStats {
  const kev7 = selectRecentKev(s.kev, 7, now);
  const kev30 = selectRecentKev(s.kev, 30, now);
  const rw7 = selectRecentVictims(s.ransomware, 7, now);
  const byCountry: IntelStats['byCountry'] = {};
  for (const v of rw7) {
    if (!v.country) continue;
    byCountry[v.country] ??= { ransomware: 0, c2: 0 };
    byCountry[v.country].ransomware += 1;
  }
  for (const c of s.c2) {
    if (!c.country || c.status !== 'online') continue;
    byCountry[c.country] ??= { ransomware: 0, c2: 0 };
    byCountry[c.country].c2 += 1;
  }
  return {
    kevAdded7d: kev7.length,
    kevRansomware7d: kev7.filter((k) => k.ransomwareUse).length,
    ransomware7d: rw7.length,
    c2Online: s.c2.filter((c) => c.status === 'online').length,
    infocon: s.isc.infocon,
    topGroups7d: topN(rw7, (v) => v.group, 8).map(({ key, count }) => ({ group: key, count })),
    topSectors7d: topN(rw7, (v) => v.sector, 6).map(({ key, count }) => ({ sector: key, count })),
    topVendors30d: topN(kev30, (k) => k.vendor, 6).map(({ key, count }) => ({ vendor: key, count })),
    byCountry,
  };
}

async function timed<T>(fn: () => Promise<T | null>): Promise<{ value: T | null; ms: number }> {
  const t0 = Date.now();
  try {
    const value = await fn();
    return { value, ms: Date.now() - t0 };
  } catch {
    return { value: null, ms: Date.now() - t0 };
  }
}

/**
 * Fetch every source, tolerate any of them failing, and fill the gaps from the
 * fallback snapshot. Never throws. Pure given `deps`, `fallback` and `now`.
 */
export async function buildIntelSnapshot(
  deps: Partial<Fetchers> = {},
  fallback?: IntelSnapshot,
  now: Date = new Date(),
): Promise<IntelSnapshot> {
  const f: Fetchers = { ...live, ...deps };
  const [kevR, rwR, c2R, iscR, newsR] = await Promise.all([
    timed(f.kev), timed(f.ransomware), timed(f.feodo), timed(f.isc), timed(f.news),
  ]);

  const iso = now.toISOString();
  const health = {} as Record<SourceId, SourceHealth>;
  const pickOr = <T>(id: SourceId, r: { value: T | null; ms: number }, fb: T | undefined, empty: T): T => {
    if (r.value !== null) {
      health[id] = { status: 'ok', fetchedAt: iso, ms: r.ms };
      return r.value;
    }
    if (fb !== undefined && fallback) {
      health[id] = { status: 'stale', fetchedAt: fallback.health[id]?.fetchedAt ?? fallback.generatedAt, ms: r.ms };
      return fb;
    }
    health[id] = { status: 'down', fetchedAt: iso, ms: r.ms };
    return empty;
  };

  const kev = pickOr('kev', kevR, fallback?.kev, []).slice(0, KEV_KEEP);
  const ransomware = pickOr('ransomware', rwR, fallback?.ransomware, []).slice(0, RANSOMWARE_KEEP);
  const c2 = pickOr('feodo', c2R, fallback?.c2, []);
  const isc = pickOr('isc', iscR, fallback?.isc, { infocon: 'unknown', topPorts: [] });
  const headlines = pickOr('news', newsR, fallback?.headlines, []);

  // EPSS is an enrichment of KEV, so it runs after KEV resolves.
  const epssR = await timed(() => f.epss(kev.slice(0, EPSS_LOOKUP).map((k) => k.cveId)));
  if (epssR.value !== null) {
    health.epss = { status: 'ok', fetchedAt: iso, ms: epssR.ms };
    for (const k of kev) {
      const p = epssR.value.get(k.cveId);
      if (p !== undefined) k.epss = p;
    }
  } else if (fallback) {
    health.epss = { status: 'stale', fetchedAt: fallback.health.epss?.fetchedAt ?? fallback.generatedAt, ms: epssR.ms };
    const prior = new Map(fallback.kev.map((k) => [k.cveId, k.epss] as const));
    for (const k of kev) {
      const p = prior.get(k.cveId);
      if (p !== undefined) k.epss = p;
    }
  } else {
    health.epss = { status: 'down', fetchedAt: iso, ms: epssR.ms };
  }

  const partial = { kev, ransomware, c2, isc };
  return {
    generatedAt: iso,
    ...partial,
    headlines,
    health,
    stats: computeStats(partial, now),
  };
}
