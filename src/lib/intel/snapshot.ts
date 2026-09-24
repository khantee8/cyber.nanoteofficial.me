import { unstable_cache } from 'next/cache';
import type { IntelSnapshot } from './aggregate';
import { assembleSnapshot } from './store';
import fallbackJson from './fallback.json';

/**
 * The committed fallback: captured by `npm run intel:snapshot`. Used to fill gaps
 * when `DATABASE_URL` is unset, the DB is unreachable, or a source row has no data.
 */
export const fallback = fallbackJson as unknown as IntelSnapshot;

export const INTEL_TAG = 'intel';
/** Safety net only: the refresh job invalidates INTEL_TAG every 30 minutes. */
export const INTEL_REVALIDATE_SECONDS = 3600;

async function load(): Promise<IntelSnapshot> {
  if (!process.env.DATABASE_URL) return assembleSnapshot({}, fallback, new Date());
  try {
    const { readIntelRows } = await import('./db');
    return assembleSnapshot(await readIntelRows(), fallback, new Date());
  } catch (e) {
    console.error('intel: DB read failed, serving fallback', e);
    return assembleSnapshot({}, fallback, new Date());
  }
}

/**
 * One cached snapshot for `/`, `/intel` and `/api/intel`; one DB read per refresh
 * cycle. Never calls upstream — only `/api/cron/intel` and `npm run intel:snapshot`
 * do that. `"use cache"` was deliberately not used (see CLAUDE.md).
 *
 * Health ages are computed when this is (re)assembled, at most once per refresh
 * cycle, so they can lag up to ~30 minutes behind reality; the next refresh
 * re-assembles.
 */
export const getIntelSnapshot = unstable_cache(load, ['intel-snapshot-v2'], {
  revalidate: INTEL_REVALIDATE_SECONDS, tags: [INTEL_TAG],
});
