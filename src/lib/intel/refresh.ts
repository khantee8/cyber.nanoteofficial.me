import type { C2Server, Headline, IscStatus, KevEntry, RansomVictim, SourceId } from './types';
import { EPSS_LOOKUP, KEV_KEEP, RANSOMWARE_KEEP } from './aggregate';
import { fetchKevConditional } from './sources/kev';
import { fetchEpss } from './sources/epss';
import { fetchRansomware } from './sources/ransomware';
import { fetchFeodo } from './sources/feodo';
import { fetchIsc } from './sources/isc';
import { fetchNews } from './sources/news';
import { mergeSourceRow, type FetchResult, type SourceDataMap, type SourceRows } from './store';

export interface RefreshDeps {
  kev: (v: { etag: string | null; lastModified: string | null }) => Promise<FetchResult<KevEntry[]>>;
  epss: (cves: string[]) => Promise<Map<string, number> | null>;
  ransomware: () => Promise<RansomVictim[] | null>;
  feodo: () => Promise<C2Server[] | null>;
  isc: () => Promise<IscStatus | null>;
  news: () => Promise<Headline[] | null>;
}

export type RefreshOutcome = Record<SourceId, 'ok' | 'not_modified' | 'failed'>;

const live: RefreshDeps = {
  kev: (v) => fetchKevConditional(v),
  epss: (cves) => fetchEpss(cves),
  ransomware: () => fetchRansomware(),
  feodo: () => fetchFeodo(),
  isc: () => fetchIsc(),
  news: () => fetchNews(),
};

async function wrap<T>(fn: () => Promise<T | null>): Promise<FetchResult<T>> {
  try {
    const v = await fn();
    return v === null ? { kind: 'failed', error: 'no data' } : { kind: 'ok', data: v };
  } catch (e) {
    return { kind: 'failed', error: e instanceof Error ? e.message : 'failed' };
  }
}

async function safe(fn: () => Promise<FetchResult<KevEntry[]>>): Promise<FetchResult<KevEntry[]>> {
  try {
    return await fn();
  } catch (e) {
    return { kind: 'failed', error: e instanceof Error ? e.message : 'failed' };
  }
}

/** Run every fetcher against the previous rows. Network only through `deps`; never throws. */
export async function refreshSources(prev: SourceRows, now: Date, deps: Partial<RefreshDeps> = {}) {
  const d: RefreshDeps = { ...live, ...deps };
  const rows: SourceRows = { ...prev };
  const outcome = {} as RefreshOutcome;
  const put = <K extends SourceId>(id: K, r: FetchResult<SourceDataMap[K]>) => {
    (rows as Record<SourceId, unknown>)[id] = mergeSourceRow(id, prev[id] as never, r, now);
    outcome[id] = r.kind;
  };

  const [kevResult, rw, c2, isc, news] = await Promise.all([
    safe(() => d.kev({ etag: prev.kev?.etag ?? null, lastModified: prev.kev?.lastModified ?? null })),
    wrap(d.ransomware), wrap(d.feodo), wrap(d.isc), wrap(d.news),
  ]);
  put('kev', kevResult.kind === 'ok' ? { ...kevResult, data: kevResult.data.slice(0, KEV_KEEP) } : kevResult);
  put('ransomware', rw.kind === 'ok' ? { kind: 'ok', data: rw.data.slice(0, RANSOMWARE_KEEP) } : rw);
  put('feodo', c2);
  put('isc', isc);
  put('news', news);

  const cves = (rows.kev?.data ?? []).slice(0, EPSS_LOOKUP).map((k) => k.cveId);
  if (cves.length === 0) {
    put('epss', { kind: 'failed', error: 'no KEV CVEs to enrich' });
  } else {
    const e = await wrap(() => d.epss(cves));
    put('epss', e.kind === 'ok' ? { kind: 'ok', data: Object.fromEntries(e.data) } : e);
  }
  return { rows, outcome };
}
