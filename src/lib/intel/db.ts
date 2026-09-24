import 'server-only';
import { getDb } from '@/db';
import { intelSources } from '@/db/schema';
import { SOURCE_IDS, type SourceRow, type SourceRows } from './store';
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
