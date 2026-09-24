import 'server-only';
import { and, asc, desc, eq, ilike, isNull, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { getDb } from '@/db';
import {
  assessments, controlStatuses, csfProfiles, csfScores, customers, folders, riskMethodologies, risks, users,
  type Assessment, type Customer, type CsfProfile, type CsfScore, type ControlStatusRow, type Folder, type Risk,
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
 * doing a write or returning customer data.
 */
export async function getApprovedViewer(): Promise<Viewer | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const u = await lookupUser(email);
  return u?.approvedAt ? { userId: u.id, email, role: u.role } : null;
}

export interface CustomerSummary extends Customer { assessmentCount: number; lastActivity: Date | null }

/** Escapes `%` and `_` (and the escape character itself) so user input is a literal substring match under ILIKE. */
function escapeLike(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Every customer with its assessment count and most recent assessment activity.
 * One query: customers left-joined to a grouped subquery over assessments.
 */
export async function listCustomers(opts: { includeArchived?: boolean; q?: string } = {}): Promise<CustomerSummary[]> {
  const db = getDb();
  const agg = db.$with('assessment_agg').as(
    db.select({
      customerId: assessments.customerId,
      assessmentCount: sql<number>`count(*)`.as('assessment_count'),
      lastActivity: sql<Date | null>`max(${assessments.updatedAt})`.as('last_activity'),
    }).from(assessments).groupBy(assessments.customerId),
  );

  const conditions = [];
  if (!opts.includeArchived) conditions.push(isNull(customers.archivedAt));
  const q = opts.q?.trim();
  if (q) conditions.push(ilike(customers.name, `%${escapeLike(q)}%`));

  const rows = await db.with(agg)
    .select({
      customer: customers,
      assessmentCount: sql<number>`coalesce(${agg.assessmentCount}, 0)`,
      lastActivity: agg.lastActivity,
    })
    .from(customers)
    .leftJoin(agg, eq(agg.customerId, customers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${agg.lastActivity} desc nulls last`, asc(customers.name));

  return rows.map((r) => ({ ...r.customer, assessmentCount: Number(r.assessmentCount), lastActivity: r.lastActivity }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const [c] = await getDb().select().from(customers).where(eq(customers.id, id)).limit(1);
  return c ?? null;
}

export async function getFolders(customerId: string): Promise<Folder[]> {
  return getDb().select().from(folders).where(eq(folders.customerId, customerId)).orderBy(asc(folders.sortOrder), asc(folders.name));
}

/** Newest updatedAt first. */
export async function listAssessments(customerId: string): Promise<Assessment[]> {
  return getDb().select().from(assessments).where(eq(assessments.customerId, customerId)).orderBy(desc(assessments.updatedAt));
}

export async function getAssessment(id: string): Promise<Assessment | null> {
  const [a] = await getDb().select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return a ?? null;
}

export async function getStatuses(assessmentId: string): Promise<StatusRow[]> {
  const rows = await getDb().select().from(controlStatuses).where(eq(controlStatuses.assessmentId, assessmentId));
  return rows.map((r) => ({ controlId: r.controlId, status: r.status, justification: r.justification, owner: r.owner }));
}

export async function getStatusRows(assessmentId: string): Promise<ControlStatusRow[]> {
  return getDb().select().from(controlStatuses).where(eq(controlStatuses.assessmentId, assessmentId));
}

export async function getStatusRow(assessmentId: string, controlId: string): Promise<ControlStatusRow | null> {
  const [row] = await getDb().select().from(controlStatuses)
    .where(and(eq(controlStatuses.assessmentId, assessmentId), eq(controlStatuses.controlId, controlId)))
    .limit(1);
  return row ?? null;
}

/** Every risk of the customer. The register is shared by ISO 27001 and CSF 2.0; `framework` only records where a risk was created. */
export async function getRisks(customerId: string): Promise<Risk[]> {
  return getDb().select().from(risks)
    .where(eq(risks.customerId, customerId))
    .orderBy(desc(risks.createdAt), asc(risks.ref));
}

export async function getRisk(customerId: string, id: string): Promise<Risk | null> {
  const [r] = await getDb().select().from(risks).where(and(eq(risks.customerId, customerId), eq(risks.id, id))).limit(1);
  return r ?? null;
}

export async function getMethodology(customerId: string): Promise<Methodology> {
  const [m] = await getDb().select().from(riskMethodologies).where(eq(riskMethodologies.customerId, customerId)).limit(1);
  return m ? { lowMax: m.lowMax, mediumMax: m.mediumMax, highMax: m.highMax, acceptMax: m.acceptMax } : DEFAULT_METHODOLOGY;
}

export async function getCsfScores(assessmentId: string): Promise<CsfScore[]> {
  return getDb().select().from(csfScores).where(eq(csfScores.assessmentId, assessmentId));
}

export async function getCsfScore(assessmentId: string, subcategoryId: string): Promise<CsfScore | null> {
  const [r] = await getDb().select().from(csfScores)
    .where(and(eq(csfScores.assessmentId, assessmentId), eq(csfScores.subcategoryId, subcategoryId))).limit(1);
  return r ?? null;
}

export async function getCsfProfile(assessmentId: string): Promise<CsfProfile | null> {
  const [p] = await getDb().select().from(csfProfiles).where(eq(csfProfiles.assessmentId, assessmentId)).limit(1);
  return p ?? null;
}

export function toScoreRows(rows: CsfScore[]): CsfScoreRow[] {
  return rows.map((r) => ({ subcategoryId: r.subcategoryId, current: r.current, target: r.target, inScope: r.inScope }));
}
