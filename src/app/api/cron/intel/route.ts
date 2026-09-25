import { isAuthorised } from '@/lib/intel/cronAuth';
import { claimRefresh } from '@/lib/intel/db';
import { runRefresh } from '@/lib/intel/job';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Scheduled/manual refresh (GitHub Actions, daily Vercel cron). Always runs; records the claim so visits don't repeat it. Returns outcomes only, never data. */
export async function GET(req: Request) {
  if (!isAuthorised(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const now = new Date();
  await claimRefresh(now, true);
  const outcome = await runRefresh(now);
  return Response.json({ sources: outcome }, { headers: { 'Cache-Control': 'no-store' } });
}
