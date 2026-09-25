import 'server-only';
import { lt } from 'drizzle-orm';
import { getDb } from '@/db';
import { intelRefresh, intelSources } from '@/db/schema';
import { REFRESH_EVERY_MS, SOURCE_IDS, type SourceRow, type SourceRows } from './store';
import type { SourceId } from './types';

export async function readIntelRows(): Promise<SourceRows> {
  const rows = await getDb().select().from(intelSources);
  const out: SourceRows = {};
  for (const r of rows) {
    if (!(SOURCE_IDS as string[]).includes(r.source)) continue;
    (out as Record<SourceId, SourceRow>)[r.source as SourceId] = {
      source: r.source as SourceId,
      data: (r.data ?? null) as SourceRow['data'],
      fetchedAt: r.fetchedAt ? r.fetchedAt.toISOString() : null,
      attemptedAt: r.attemptedAt.toISOString(),
      error: r.error, etag: r.etag, lastModified: r.lastModified,
    };
  }
  return out;
}

export async function writeIntelRows(rows: SourceRows): Promise<void> {
  const db = getDb();
  for (const id of SOURCE_IDS) {
    const r = rows[id];
    if (!r) continue;
    const values = {
      data: r.data, fetchedAt: r.fetchedAt ? new Date(r.fetchedAt) : null, attemptedAt: new Date(r.attemptedAt),
      error: r.error, etag: r.etag, lastModified: r.lastModified,
    };
    await db.insert(intelSources).values({ source: id, ...values })
      .onConflictDoUpdate({ target: intelSources.source, set: values });
  }
}

/**
 * Claim the refresh slot. With `force` (the cron route) the claim always succeeds;
 * otherwise only when the last claim is at least REFRESH_EVERY_MS old — one atomic
 * statement, so of many concurrent visits exactly one gets `true`.
 */
export async function claimRefresh(now: Date, force = false): Promise<boolean> {
  const cutoff = new Date(now.getTime() - REFRESH_EVERY_MS);
  const rows = await getDb().insert(intelRefresh).values({ id: 'intel', claimedAt: now })
    .onConflictDoUpdate({
      target: intelRefresh.id, set: { claimedAt: now },
      ...(force ? {} : { setWhere: lt(intelRefresh.claimedAt, cutoff) }),
    })
    .returning({ id: intelRefresh.id });
  return rows.length > 0;
}
