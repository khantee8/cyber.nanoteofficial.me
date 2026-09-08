import 'server-only';
import { and, asc, desc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { getDb } from '@/db';
import { controlStatuses, organisations, riskMethodologies, risks, users, type Organisation, type Risk } from '@/db/schema';
import { DEFAULT_METHODOLOGY, type Methodology, type StatusRow } from './iso27001/score';

export interface Viewer { userId: string; email: string; role: 'admin' | 'member' }

/** The signed-in user, or null. The (app) layout already redirected anonymous visitors. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const [u] = await getDb().select({ id: users.id, role: users.role }).from(users).where(eq(users.email, email)).limit(1);
  return u ? { userId: u.id, email, role: u.role } : null;
}

export async function getOrgForUser(userId: string): Promise<Organisation | null> {
  const [org] = await getDb().select().from(organisations).where(eq(organisations.ownerId, userId)).limit(1);
  return org ?? null;
}

export async function getStatuses(orgId: string, framework: string): Promise<StatusRow[]> {
  const rows = await getDb().select().from(controlStatuses)
    .where(and(eq(controlStatuses.organisationId, orgId), eq(controlStatuses.framework, framework)));
  return rows.map((r) => ({ controlId: r.controlId, status: r.status, justification: r.justification, owner: r.owner }));
}

export async function getStatusRows(orgId: string, framework: string) {
  return getDb().select().from(controlStatuses)
    .where(and(eq(controlStatuses.organisationId, orgId), eq(controlStatuses.framework, framework)));
}

export async function getStatusRow(orgId: string, framework: string, controlId: string) {
  const [row] = await getDb().select().from(controlStatuses)
    .where(and(eq(controlStatuses.organisationId, orgId), eq(controlStatuses.framework, framework), eq(controlStatuses.controlId, controlId)))
    .limit(1);
  return row ?? null;
}

export async function getRisks(orgId: string, framework: string): Promise<Risk[]> {
  return getDb().select().from(risks)
    .where(and(eq(risks.organisationId, orgId), eq(risks.framework, framework)))
    .orderBy(desc(risks.createdAt), asc(risks.ref));
}

export async function getRisk(orgId: string, id: string): Promise<Risk | null> {
  const [r] = await getDb().select().from(risks).where(and(eq(risks.organisationId, orgId), eq(risks.id, id))).limit(1);
  return r ?? null;
}

export async function getMethodology(orgId: string): Promise<Methodology> {
  const [m] = await getDb().select().from(riskMethodologies).where(eq(riskMethodologies.organisationId, orgId)).limit(1);
  return m ? { lowMax: m.lowMax, mediumMax: m.mediumMax, highMax: m.highMax, acceptMax: m.acceptMax } : DEFAULT_METHODOLOGY;
}
