import { unstable_cache } from 'next/cache';
import { buildIntelSnapshot, type IntelSnapshot } from './aggregate';
import fallbackJson from './fallback.json';

/**
 * The committed fallback: captured by `npm run intel:snapshot`. Any source that
 * is unreachable at request time is served from here and labelled stale.
 */
export const fallback = fallbackJson as unknown as IntelSnapshot;

export const INTEL_REVALIDATE_SECONDS = 900;

/**
 * One cached snapshot shared by `/`, `/intel` and `/api/intel`. A burst of
 * visitors costs one upstream round-trip per source per 15-minute window.
 * `unstable_cache` is used deliberately: `"use cache"` would require Cache
 * Components mode for the whole app (see CLAUDE.md).
 */
export const getIntelSnapshot = unstable_cache(
  () => buildIntelSnapshot({}, fallback),
  ['intel-snapshot-v1'],
  { revalidate: INTEL_REVALIDATE_SECONDS, tags: ['intel'] },
);
