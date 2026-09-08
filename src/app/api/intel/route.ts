import { getIntelSnapshot, INTEL_REVALIDATE_SECONDS } from '@/lib/intel/snapshot';

/**
 * Public JSON view of the Threat Intel snapshot. Same cached object the pages
 * render; the seed of a later MCP / REST surface.
 */
export async function GET() {
  const snapshot = await getIntelSnapshot();
  return Response.json(snapshot, {
    headers: {
      'Cache-Control': `public, s-maxage=${INTEL_REVALIDATE_SECONDS}, stale-while-revalidate=300`,
    },
  });
}
