import 'server-only';
import { revalidateTag } from 'next/cache';
import { readIntelRows, writeIntelRows } from './db';
import { refreshSources, type RefreshOutcome } from './refresh';
import { INTEL_TAG } from './snapshot';

/** Fetch every source, store the result, expire the cached snapshot. Shared by the cron route and visit-triggered refreshes. */
export async function runRefresh(now: Date): Promise<RefreshOutcome> {
  const prev = await readIntelRows();
  const { rows, outcome } = await refreshSources(prev, now);
  await writeIntelRows(rows);
  // Runs in a Route Handler or an `after()` callback, never during render, so
  // `revalidateTag` is allowed; `{ expire: 0 }` expires the snapshot immediately.
  revalidateTag(INTEL_TAG, { expire: 0 });
  return outcome;
}
