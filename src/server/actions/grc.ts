'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { controlStatuses, organisations, riskMethodologies, risks } from '@/db/schema';
import { getOrgForUser, getViewer } from '@/lib/grc/queries';
import { CONTROL_BY_ID } from '@/lib/grc/iso27001/catalogue';
import { CONTROL_STATUSES, RISK_STATUSES, TREATMENTS } from '@/lib/grc/types';
import { ValidationError, idList, int, oneOf, optionalInt, str, urlList } from '@/lib/validate';

export interface ActionResult { ok: boolean; message?: string }

const FRAMEWORK = 'iso27001';
const BASE = '/grc/iso27001';

async function requireOrg() {
  const viewer = await getViewer();
  if (!viewer) throw new Error('Unauthorized');
  const org = await getOrgForUser(viewer.userId);
  if (!org) throw new Error('No organisation');
  return { viewer, org };
}

function fail(err: unknown): ActionResult {
  if (err instanceof ValidationError) return { ok: false, message: err.message };
  console.error('grc action failed', err);
  return { ok: false, message: 'Something went wrong. Try again.' };
}

const SIZE_BANDS = ['1-10', '11-50', '51-250', '251-1000', '1000+'] as const;

function orgFields(fd: FormData) {
  return {
    name: str(fd.get('name'), 120, { required: true, field: 'Organisation name' })!,
    scope: str(fd.get('scope'), 2000, { field: 'Scope' }),
    industry: str(fd.get('industry'), 120, { field: 'Industry' }),
    sizeBand: fd.get('sizeBand') ? oneOf(fd.get('sizeBand'), SIZE_BANDS, 'Size') : null,
    ismsLead: str(fd.get('ismsLead'), 120, { field: 'ISMS lead' }),
  };
}

export async function createOrganisation(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const viewer = await getViewer();
    if (!viewer) throw new Error('Unauthorized');
    const existing = await getOrgForUser(viewer.userId);
    if (existing) return { ok: true };
    const fields = orgFields(fd);
    const db = getDb();
    const [org] = await db.insert(organisations).values({ ownerId: viewer.userId, ...fields }).returning({ id: organisations.id });
    await db.insert(riskMethodologies).values({ organisationId: org.id }).onConflictDoNothing();
  } catch (err) {
    return fail(err);
  }
  revalidatePath(BASE, 'layout');
  return { ok: true };
}

export async function updateOrganisation(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    await getDb().update(organisations).set(orgFields(fd)).where(eq(organisations.id, org.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export interface ControlStatusInput {
  controlId: string;
  status: string;
  justification?: string | null;
  owner?: string | null;
  evidenceUrls?: string;
}

export async function setControlStatus(input: ControlStatusInput): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    if (!CONTROL_BY_ID[input.controlId]) throw new ValidationError('unknown control');
    const status = oneOf(input.status, CONTROL_STATUSES, 'Status');
    const patch: Partial<typeof controlStatuses.$inferInsert> = { status, updatedAt: new Date() };
    if (input.justification !== undefined) patch.justification = str(input.justification, 4000, { field: 'Justification' });
    if (input.owner !== undefined) patch.owner = str(input.owner, 120, { field: 'Owner' });
    if (input.evidenceUrls !== undefined) patch.evidenceUrls = urlList(input.evidenceUrls);
    await getDb().insert(controlStatuses)
      .values({ organisationId: org.id, framework: FRAMEWORK, controlId: input.controlId, ...patch })
      .onConflictDoUpdate({ target: [controlStatuses.organisationId, controlStatuses.framework, controlStatuses.controlId], set: patch });
  } catch (err) {
    return fail(err);
  }
  revalidatePath(BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function saveRisk(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  let id: string | null = null;
  try {
    const { org } = await requireOrg();
    const db = getDb();
    id = str(fd.get('id'), 64) ?? null;
    const values = {
      title: str(fd.get('title'), 200, { required: true, field: 'Title' })!,
      description: str(fd.get('description'), 4000, { field: 'Description' }),
      asset: str(fd.get('asset'), 200, { field: 'Asset' }),
      threat: str(fd.get('threat'), 500, { field: 'Threat' }),
      vulnerability: str(fd.get('vulnerability'), 500, { field: 'Vulnerability' }),
      likelihood: int(fd.get('likelihood'), 1, 5, 'Likelihood'),
      impact: int(fd.get('impact'), 1, 5, 'Impact'),
      treatment: oneOf(fd.get('treatment'), TREATMENTS, 'Treatment'),
      treatmentPlan: str(fd.get('treatmentPlan'), 4000, { field: 'Treatment plan' }),
      owner: str(fd.get('owner'), 120, { field: 'Owner' }),
      status: oneOf(fd.get('status') ?? 'open', RISK_STATUSES, 'Status'),
      linkedControlIds: idList(fd.getAll('linkedControlIds'), new Set(Object.keys(CONTROL_BY_ID))),
      residualLikelihood: optionalInt(fd.get('residualLikelihood'), 1, 5, 'Residual likelihood'),
      residualImpact: optionalInt(fd.get('residualImpact'), 1, 5, 'Residual impact'),
      updatedAt: new Date(),
    };
    if (id) {
      const [updated] = await db.update(risks).set(values)
        .where(and(eq(risks.id, id), eq(risks.organisationId, org.id))).returning({ id: risks.id });
      if (!updated) throw new ValidationError('risk not found');
    } else {
      // Next sequential reference. A collision on the unique (org, ref) index is
      // retried once; concurrent creates by one owner are not a realistic case.
      for (let attempt = 0; attempt < 2; attempt++) {
        const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(risks).where(eq(risks.organisationId, org.id));
        const ref = `RISK-${String(n + 1 + attempt).padStart(3, '0')}`;
        try {
          const [row] = await db.insert(risks).values({ organisationId: org.id, framework: FRAMEWORK, ref, ...values }).returning({ id: risks.id });
          id = row.id;
          break;
        } catch (e) {
          if (attempt === 1) throw e;
        }
      }
    }
  } catch (err) {
    return fail(err);
  }
  revalidatePath(BASE, 'layout');
  redirect(`${BASE}/risks/${id}`);
}

export async function deleteRisk(id: string): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    await getDb().delete(risks).where(and(eq(risks.id, id), eq(risks.organisationId, org.id)));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(BASE, 'layout');
  redirect(`${BASE}/risks`);
}

export async function updateMethodology(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    const lowMax = int(fd.get('lowMax'), 1, 24, 'Low max');
    const mediumMax = int(fd.get('mediumMax'), 2, 24, 'Medium max');
    const highMax = int(fd.get('highMax'), 3, 24, 'High max');
    const acceptMax = int(fd.get('acceptMax'), 1, 25, 'Acceptance threshold');
    if (!(lowMax < mediumMax && mediumMax < highMax)) throw new ValidationError('thresholds must increase: low < medium < high');
    await getDb().insert(riskMethodologies).values({ organisationId: org.id, lowMax, mediumMax, highMax, acceptMax })
      .onConflictDoUpdate({ target: riskMethodologies.organisationId, set: { lowMax, mediumMax, highMax, acceptMax } });
  } catch (err) {
    return fail(err);
  }
  revalidatePath(BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function resetWorkspace(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    const confirm = str(fd.get('confirm'), 200) ?? '';
    if (confirm !== org.name) throw new ValidationError('type the organisation name exactly to confirm');
    const db = getDb();
    await db.delete(controlStatuses).where(eq(controlStatuses.organisationId, org.id));
    await db.delete(risks).where(eq(risks.organisationId, org.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(BASE, 'layout');
  return { ok: true, message: 'reset' };
}
