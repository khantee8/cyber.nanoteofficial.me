import { unstable_cache } from 'next/cache';
import { after } from 'next/server';
import type { IntelSnapshot } from './aggregate';
import { assembleSnapshot, isRefreshDue } from './store';
import fallbackJson from './fallback.json';

/**
 * The committed fallback: captured by `npm run intel:snapshot`. Used to fill gaps
 * when `DATABASE_URL` is unset, the DB is unreachable, or a source row has no data.
 */
export const fallback = fallbackJson as unknown as IntelSnapshot;

export const INTEL_TAG = 'intel';
/** Safety net only: every refresh (on visit or scheduled) invalidates INTEL_TAG. */
export const INTEL_REVALIDATE_SECONDS = 3600;

/**
 * Assembles `health[id].status` from each row's `fetchedAt` at cache-fill time,
 * so it's at most ~30 min stale by the time a page renders it. That's fine:
 * `PanelHeader` re-derives the *displayed* status from `fetchedAt` with
 * `healthFromAge` at render time (down excepted, since that can't be recomputed
 * from an age alone), so only the underlying `fetchedAt`/`data` lag — never the
 * ok/stale label shown to a visitor.
 */
async function load(): Promise<IntelSnapshot> {
  if (!process.env.DATABASE_URL) return assembleSnapshot({}, fallback, new Date());
  const { readIntelRows } = await import('./db');
  return assembleSnapshot(await readIntelRows(), fallback, new Date());
}

/**
 * One cached snapshot for `/`, `/intel` and `/api/intel`; one DB read per refresh
 * cycle. Never calls upstream — only `/api/cron/intel` and `npm run intel:snapshot`
 * do that. `"use cache"` was deliberately not used (see CLAUDE.md).
 *
 * `load` is allowed to throw on a DB error, so `unstable_cache` never caches a
 * fallback snapshot as if it were the real one — a transient read failure just
 * falls through to `getIntelSnapshot`'s own catch below on this request, and the
 * next call gets a fresh attempt instead of being stuck on the fallback until
 * the next refresh or the 1 h safety-net revalidation.
 */
const cached = unstable_cache(load, ['intel-snapshot-v2'], {
  revalidate: INTEL_REVALIDATE_SECONDS, tags: [INTEL_TAG],
});

export async function getIntelSnapshot(): Promise<IntelSnapshot> {
  let snapshot: IntelSnapshot;
  try {
    snapshot = await cached();
  } catch (e) {
    console.error('intel: DB read failed, serving fallback', e);
    snapshot = assembleSnapshot({}, fallback, new Date());
  }
  refreshIfDue(snapshot);
  return snapshot;
}

/**
 * Refresh on visit: when the data is REFRESH_EVERY_MS old, refresh after the
 * response is sent (this visitor gets the current copy, the next one fresh data).
 * `claimRefresh` lets exactly one of many concurrent visits run it, at most once
 * per 30 min; scheduled runs claim too. Needs a DB and a request scope; never throws.
 * `lastAttempt` keeps each server instance to one claim query per 5 min, so a
 * stretch where the data stays due (every source failing) doesn't hit Neon per visit.
 */
let lastAttempt = 0;
const ATTEMPT_GAP_MS = 5 * 60_000;
function refreshIfDue(snapshot: IntelSnapshot): void {
  const nowMs = Date.now();
  if (!process.env.DATABASE_URL || nowMs - lastAttempt < ATTEMPT_GAP_MS || !isRefreshDue(snapshot, new Date(nowMs))) return;
  lastAttempt = nowMs;
  try {
    after(async () => {
      try {
        const now = new Date();
        const { claimRefresh } = await import('./db');
        if (!(await claimRefresh(now))) return;
        const { runRefresh } = await import('./job');
        const outcome = await runRefresh(now);
        console.log('intel: refreshed on visit', JSON.stringify(outcome));
      } catch (e) {
        console.error('intel: refresh on visit failed', e);
      }
    });
  } catch (e) {
    console.error('intel: could not schedule refresh', e);
  }
}
