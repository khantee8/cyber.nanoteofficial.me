import { revalidateTag } from 'next/cache';
import { isAuthorised } from '@/lib/intel/cronAuth';
import { readIntelRows, writeIntelRows } from '@/lib/intel/db';
import { refreshSources } from '@/lib/intel/refresh';
import { INTEL_TAG } from '@/lib/intel/snapshot';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Background refresh: GitHub Actions every 30 min, Vercel cron daily. Returns outcomes only, never data. */
export async function GET(req: Request) {
  if (!isAuthorised(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const prev = await readIntelRows();
  const { rows, outcome } = await refreshSources(prev, new Date());
  await writeIntelRows(rows);
  // Called from a Route Handler, not a Server Action, so `updateTag` isn't available;
  // `{ expire: 0 }` is the documented way to expire immediately from outside one.
  revalidateTag(INTEL_TAG, { expire: 0 });
  return Response.json({ sources: outcome }, { headers: { 'Cache-Control': 'no-store' } });
}
