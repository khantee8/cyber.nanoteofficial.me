import { getLang } from '@/lib/lang';
import { getApprovedViewer, getAssessment, getCustomer, getStatuses } from '@/lib/grc/queries';
import { ISO27001_CONTROLS } from '@/lib/grc/iso27001/catalogue';
import { buildSoa, soaCsv } from '@/lib/grc/iso27001/score';

/** Statement of Applicability as CSV. Refuses (409) while any exclusion lacks a justification. */
export async function GET(_req: Request, ctx: RouteContext<'/api/grc/a/[assessmentId]/soa.csv'>) {
  const viewer = await getApprovedViewer();
  if (!viewer) return new Response('Unauthorized', { status: 401 });
  const { assessmentId } = await ctx.params;
  const assessment = await getAssessment(assessmentId);
  if (!assessment || assessment.framework !== 'iso27001') return new Response('Not found', { status: 404 });
  const customer = await getCustomer(assessment.customerId);
  if (!customer) return new Response('Not found', { status: 404 });
  const lang = await getLang();
  const rows = await getStatuses(assessment.id);
  const { rows: soa, missingJustification } = buildSoa(ISO27001_CONTROLS, rows);
  if (missingJustification.length) {
    return Response.json({ error: 'missing_justification', controls: missingJustification }, { status: 409 });
  }
  const safeName = `${customer.name}-${assessment.title}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'organisation';
  return new Response('﻿' + soaCsv(soa, ISO27001_CONTROLS, lang), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="soa-${safeName}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
