import type { C2Server, Headline, IscStatus, KevEntry, RansomVictim, SourceId } from './types';
import { computeStats, KEV_KEEP, RANSOMWARE_KEEP, type IntelSnapshot, type SourceHealth } from './aggregate';

export interface SourceDataMap {
  kev: KevEntry[];
  epss: Record<string, number>;
  ransomware: RansomVictim[];
  feodo: C2Server[];
  isc: IscStatus;
  news: Headline[];
}

export interface SourceRow<K extends SourceId = SourceId> {
  source: K;
  data: SourceDataMap[K] | null;
  fetchedAt: string | null;    // last success (or 304 confirmation)
  attemptedAt: string;
  error: string | null;
  etag: string | null;
  lastModified: string | null;
}

export type SourceRows = { [K in SourceId]?: SourceRow<K> };

export type FetchResult<T> =
  | { kind: 'ok'; data: T; etag?: string | null; lastModified?: string | null }
  | { kind: 'not_modified' }
  | { kind: 'failed'; error: string };

export const SOURCE_IDS: SourceId[] = ['kev', 'epss', 'ransomware', 'feodo', 'isc', 'news'];
export const STALE_AFTER_MS = 60 * 60_000;

export function mergeSourceRow<K extends SourceId>(
  source: K, prev: SourceRow<K> | undefined, result: FetchResult<SourceDataMap[K]>, now: Date,
): SourceRow<K> {
  const at = now.toISOString();
  const base: SourceRow<K> = prev ?? { source, data: null, fetchedAt: null, attemptedAt: at, error: null, etag: null, lastModified: null };
  if (result.kind === 'ok') {
    return { source, data: result.data, fetchedAt: at, attemptedAt: at, error: null, etag: result.etag ?? null, lastModified: result.lastModified ?? null };
  }
  if (result.kind === 'not_modified' && base.data !== null) {
    return { ...base, source, fetchedAt: at, attemptedAt: at, error: null };
  }
  const error = result.kind === 'failed' ? result.error : 'not modified, but no stored copy';
  return { ...base, source, attemptedAt: at, error };
}

export function healthFromAge(fetchedAt: string | null, now: Date): SourceHealth['status'] {
  if (!fetchedAt) return 'down';
  return now.getTime() - new Date(fetchedAt).getTime() < STALE_AFTER_MS ? 'ok' : 'stale';
}

const EMPTY: SourceDataMap = { kev: [], epss: {}, ransomware: [], feodo: [], isc: { infocon: 'unknown', topPorts: [] }, news: [] };

function fromFallback(fb: IntelSnapshot): SourceDataMap {
  const epss: Record<string, number> = {};
  for (const k of fb.kev) if (k.epss !== undefined) epss[k.cveId] = k.epss;
  return { kev: fb.kev, epss, ransomware: fb.ransomware, feodo: fb.c2, isc: fb.isc, news: fb.headlines };
}

/** Build the page snapshot from stored rows; fallback fills sources that have no data. Pure. */
export function assembleSnapshot(rows: SourceRows, fallback: IntelSnapshot | undefined, now: Date): IntelSnapshot {
  const fb = fallback ? fromFallback(fallback) : undefined;
  const health = {} as Record<SourceId, SourceHealth>;
  const pick = <K extends SourceId>(id: K): SourceDataMap[K] => {
    const row = rows[id] as SourceRow<K> | undefined;
    if (row?.data != null && row.fetchedAt) {
      health[id] = { status: healthFromAge(row.fetchedAt, now), fetchedAt: row.fetchedAt, ms: 0 };
      return row.data;
    }
    if (fb && fallback) {
      health[id] = { status: 'stale', fetchedAt: fallback.health[id]?.fetchedAt ?? fallback.generatedAt, ms: 0 };
      return fb[id];
    }
    health[id] = { status: 'down', fetchedAt: now.toISOString(), ms: 0 };
    return EMPTY[id];
  };

  const epss = pick('epss');
  const kev = pick('kev').slice(0, KEV_KEEP).map((k) => {
    const copy: KevEntry = { ...k };
    delete copy.epss;
    const p = epss[k.cveId];
    if (p !== undefined) copy.epss = p;
    return copy;
  });
  const ransomware = pick('ransomware').slice(0, RANSOMWARE_KEEP);
  const c2 = pick('feodo');
  const isc = pick('isc');
  const headlines = pick('news');

  const fetched = SOURCE_IDS
    .map((id) => health[id])
    .filter((h): h is SourceHealth => h.status !== 'down')
    .map((h) => h.fetchedAt)
    .sort();
  const partial = { kev, ransomware, c2, isc };
  return {
    generatedAt: fetched.length ? fetched[fetched.length - 1] : now.toISOString(),
    ...partial,
    headlines,
    health,
    stats: computeStats(partial, now),
  };
}
