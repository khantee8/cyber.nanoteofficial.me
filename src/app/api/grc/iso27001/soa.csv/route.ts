import { getLang } from '@/lib/lang';
import { getOrgForUser, getStatuses, getViewer } from '@/lib/grc/queries';
import { ISO27001_CONTROLS } from '@/lib/grc/iso27001/catalogue';
import { buildSoa, soaCsv } from '@/lib/grc/iso27001/score';

/** Statement of Applicability as CSV. Refuses (409) while any exclusion lacks a justification. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return new Response('Unauthorized', { status: 401 });
  const org = await getOrgForUser(viewer.userId);
  if (!org) return new Response('No organisation', { status: 404 });
  const lang = await getLang();
  const rows = await getStatuses(org.id, 'iso27001');
  const { rows: soa, missingJustification } = buildSoa(ISO27001_CONTROLS, rows);
  if (missingJustification.length) {
    return Response.json({ error: 'missing_justification', controls: missingJustification }, { status: 409 });
  }
  const safeName = org.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'organisation';
  return new Response('﻿' + soaCsv(soa, ISO27001_CONTROLS, lang), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="soa-${safeName}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
