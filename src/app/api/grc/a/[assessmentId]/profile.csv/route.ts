import { getApprovedViewer, getAssessment, getCsfScores, getCustomer } from '@/lib/grc/queries';
import { profileCsv } from '@/lib/grc/nist-csf-2/score';

/** The whole CSF profile as CSV. A partial profile is a valid export. */
export async function GET(_req: Request, ctx: RouteContext<'/api/grc/a/[assessmentId]/profile.csv'>) {
  const viewer = await getApprovedViewer();
  if (!viewer) return new Response('Unauthorized', { status: 401 });
  const { assessmentId } = await ctx.params;
  const assessment = await getAssessment(assessmentId);
  if (!assessment || assessment.framework !== 'nist-csf-2') return new Response('Not found', { status: 404 });
  const customer = await getCustomer(assessment.customerId);
  if (!customer) return new Response('Not found', { status: 404 });
  const rows = (await getCsfScores(assessment.id)).map((r) => ({
    subcategoryId: r.subcategoryId, current: r.current, target: r.target, inScope: r.inScope,
    testingStatus: r.testingStatus, examined: r.examined, interviewed: r.interviewed, tested: r.tested,
    observedAt: r.observedAt, owner: r.owner, notes: r.notes,
  }));
  const safeName = `${customer.name}-${assessment.title}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'organisation';
  return new Response('\uFEFF' + profileCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="csf-profile-${safeName}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
