import 'server-only';
import { and, asc, desc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { getDb } from '@/db';
import {
  controlStatuses, csfProfiles, csfScores, organisations, riskMethodologies, risks, users,
  type CsfProfile, type CsfScore, type Organisation, type Risk,
} from '@/db/schema';
import { DEFAULT_METHODOLOGY, type Methodology, type StatusRow } from './iso27001/score';
import type { CsfScoreRow } from './nist-csf-2/types';

export interface Viewer { userId: string; email: string; role: 'admin' | 'member' }

async function lookupUser(email: string) {
  const [u] = await getDb().select({ id: users.id, role: users.role, approvedAt: users.approvedAt })
    .from(users).where(eq(users.email, email)).limit(1);
  return u ?? null;
}

/** The signed-in user, or null. The (app) layout already redirected anonymous visitors. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const u = await lookupUser(email);
  return u ? { userId: u.id, email, role: u.role } : null;
}

/**
 * The signed-in AND approved user, or null. Unlike `getViewer()`, this also re-reads
 * approval from the database. Anything outside the `(app)` layout (which is the only
 * place approval is normally enforced) — API routes, and server actions, since invoking
 * an action does not render the layout — must call this instead of `getViewer()` before
 * doing a write or returning organisation data.
 */
export async function getApprovedViewer(): Promise<Viewer | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const u = await lookupUser(email);
  return u?.approvedAt ? { userId: u.id, email, role: u.role } : null;
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

/** Every risk of the organisation. The register is shared by ISO 27001 and CSF 2.0; `framework` only records where a risk was created. */
export async function getRisks(orgId: string): Promise<Risk[]> {
  return getDb().select().from(risks)
    .where(eq(risks.organisationId, orgId))
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

export async function getCsfScores(orgId: string): Promise<CsfScore[]> {
  return getDb().select().from(csfScores).where(eq(csfScores.organisationId, orgId));
}

export async function getCsfScore(orgId: string, subcategoryId: string): Promise<CsfScore | null> {
  const [r] = await getDb().select().from(csfScores)
    .where(and(eq(csfScores.organisationId, orgId), eq(csfScores.subcategoryId, subcategoryId))).limit(1);
  return r ?? null;
}

export async function getCsfProfile(orgId: string): Promise<CsfProfile | null> {
  const [p] = await getDb().select().from(csfProfiles).where(eq(csfProfiles.organisationId, orgId)).limit(1);
  return p ?? null;
}

export function toScoreRows(rows: CsfScore[]): CsfScoreRow[] {
  return rows.map((r) => ({ subcategoryId: r.subcategoryId, current: r.current, target: r.target, inScope: r.inScope }));
}
