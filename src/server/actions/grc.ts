'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, notExists, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { getDb } from '@/db';
import {
  assessments, controlStatuses, csfProfiles, csfScores, customers, folders, riskMethodologies, risks,
  ASSESSMENT_STATUSES, FRAMEWORK_IDS, SIZE_BANDS, type Assessment,
} from '@/db/schema';
import { getAssessment, getCsfProfile, getCsfScores, getFolders, getStatusRows } from '@/lib/grc/queries';
import { CONTROL_BY_ID } from '@/lib/grc/iso27001/catalogue';
import { CSF_IDS } from '@/lib/grc/nist-csf-2/catalogue';
import { planCsfCopy, planIsoCopy } from '@/lib/grc/copy';
import { ancestorsOf, canMove, MAX_FOLDER_DEPTH, type FolderRow } from '@/lib/grc/tree';
import { CONTROL_STATUSES, RISK_STATUSES, TREATMENTS } from '@/lib/grc/types';
import { ValidationError, idList, int, oneOf, optionalDate, optionalInt, str, urlList } from '@/lib/validate';
import { fail, requireApproved, requireAssessment, requireCustomer, type ActionResult } from './shared';

export type { ActionResult } from './shared';

const GRC_BASE = '/grc';

function customerFields(fd: FormData) {
  return {
    name: str(fd.get('name'), 120, { required: true, field: 'Customer name' })!,
    industry: str(fd.get('industry'), 120, { field: 'Industry' }),
    sizeBand: fd.get('sizeBand') ? oneOf(fd.get('sizeBand'), SIZE_BANDS, 'Size') : null,
    notes: str(fd.get('notes'), 4000, { field: 'Notes' }),
  };
}

async function loadFolder(id: string) {
  const [row] = await getDb().select().from(folders).where(eq(folders.id, id)).limit(1);
  return row ?? null;
}

// ── Customers ───────────────────────────────────────────────

export async function createCustomer(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  let id: string | null = null;
  try {
    const viewer = await requireApproved();
    const fields = customerFields(fd);
    const [row] = await getDb().insert(customers).values({ createdBy: viewer.userId, ...fields }).returning({ id: customers.id });
    id = row.id;
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  redirect(`/grc/c/${id}`);
}

export async function updateCustomer(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const { customer } = await requireCustomer(fd.get('customerId'));
    await getDb().update(customers).set(customerFields(fd)).where(eq(customers.id, customer.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function setCustomerArchived(customerId: string, archived: boolean): Promise<ActionResult> {
  try {
    const { customer } = await requireCustomer(customerId);
    await getDb().update(customers).set({ archivedAt: archived === true ? new Date() : null }).where(eq(customers.id, customer.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

// ── Folders ─────────────────────────────────────────────────

export async function createFolder(customerId: string, parentId: string | null, name: string): Promise<ActionResult & { id?: string }> {
  let id: string | null = null;
  try {
    const { customer } = await requireCustomer(customerId);
    const folderName = str(name, 120, { required: true, field: 'Folder name' })!;
    const rows: FolderRow[] = await getFolders(customer.id);
    if (parentId !== null && !rows.some((f) => f.id === parentId)) throw new ValidationError('folder not found');
    const parentDepth = parentId === null ? 0 : ancestorsOf(rows, parentId).length + 1;
    if (parentDepth + 1 > MAX_FOLDER_DEPTH) throw new ValidationError('depth');
    const [row] = await getDb().insert(folders).values({ customerId: customer.id, parentId, name: folderName }).returning({ id: folders.id });
    id = row.id;
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, id: id! };
}

export async function renameFolder(folderId: string, name: string): Promise<ActionResult> {
  try {
    await requireApproved();
    const id = str(folderId, 64, { required: true, field: 'folder id' })!;
    const folderName = str(name, 120, { required: true, field: 'Folder name' })!;
    const existing = await loadFolder(id);
    if (!existing) throw new ValidationError('folder not found');
    await getDb().update(folders).set({ name: folderName }).where(eq(folders.id, existing.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function moveFolder(folderId: string, newParentId: string | null): Promise<ActionResult> {
  try {
    await requireApproved();
    const id = str(folderId, 64, { required: true, field: 'folder id' })!;
    const existing = await loadFolder(id);
    if (!existing) throw new ValidationError('folder not found');
    const target = newParentId === null ? null : str(newParentId, 64, { required: true, field: 'parent id' })!;
    const rows: FolderRow[] = await getFolders(existing.customerId);
    const check = canMove(rows, existing.id, target);
    if (!check.ok) throw new ValidationError(check.reason === 'missing' ? 'folder not found' : check.reason);
    await getDb().update(folders).set({ parentId: target }).where(eq(folders.id, existing.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function deleteFolder(folderId: string): Promise<ActionResult> {
  try {
    await requireApproved();
    const id = str(folderId, 64, { required: true, field: 'folder id' })!;
    const existing = await loadFolder(id);
    if (!existing) throw new ValidationError('folder not found');
    // One conditional DELETE instead of count-then-delete: the emptiness check and the
    // delete itself run as a single statement, so a folder/assessment created between a
    // check and a delete can never sneak the folder into being deleted non-empty.
    const childFolder = getDb().select({ one: sql`1` }).from(folders).where(eq(folders.parentId, existing.id));
    const childAssessment = getDb().select({ one: sql`1` }).from(assessments).where(eq(assessments.folderId, existing.id));
    const [deleted] = await getDb().delete(folders)
      .where(and(eq(folders.id, existing.id), notExists(childFolder), notExists(childAssessment)))
      .returning({ id: folders.id });
    if (!deleted) throw new ValidationError('folder not empty');
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'deleted' };
}

// ── Assessments ─────────────────────────────────────────────

export async function createAssessment(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  let id: string | null = null;
  try {
    const { viewer, customer } = await requireCustomer(fd.get('customerId'));
    const framework = oneOf(fd.get('framework'), FRAMEWORK_IDS, 'Framework');
    const title = str(fd.get('title'), 200, { required: true, field: 'Title' })!;
    const fiscalYear = optionalInt(fd.get('fiscalYear'), 1990, 2100, 'Fiscal year');
    const scope = str(fd.get('scope'), 2000, { field: 'Scope' });
    const lead = str(fd.get('lead'), 120, { field: 'Lead' });

    const folderIdRaw = str(fd.get('folderId'), 64);
    let folderId: string | null = null;
    if (folderIdRaw) {
      const folder = await loadFolder(folderIdRaw);
      if (!folder || folder.customerId !== customer.id) throw new ValidationError('folder not found');
      folderId = folder.id;
    }

    const basedOnIdRaw = str(fd.get('basedOnId'), 64);
    let source: Assessment | null = null;
    if (basedOnIdRaw) {
      source = await getAssessment(basedOnIdRaw);
      if (!source || source.customerId !== customer.id || source.framework !== framework) {
        throw new ValidationError('source assessment not found');
      }
    }

    const newId = crypto.randomUUID();
    const insertAssessment = getDb().insert(assessments).values({
      id: newId, customerId: customer.id, folderId, framework, title, fiscalYear,
      scope, lead, basedOnId: source ? source.id : null, createdBy: viewer.userId,
    });

    const extra: BatchItem<'pg'>[] = [];
    if (source) {
      if (framework === 'iso27001') {
        const rows = await getStatusRows(source.id);
        const plan = planIsoCopy(rows.map((r) => ({
          controlId: r.controlId, status: r.status, justification: r.justification, owner: r.owner, evidenceUrls: r.evidenceUrls,
        })));
        for (const p of plan) extra.push(getDb().insert(controlStatuses).values({ assessmentId: newId, ...p }));
      } else {
        const [scores, profile] = await Promise.all([getCsfScores(source.id), getCsfProfile(source.id)]);
        const plan = planCsfCopy(scores.map((r) => ({
          subcategoryId: r.subcategoryId, current: r.current, target: r.target, inScope: r.inScope, owner: r.owner,
          notes: r.notes, evidenceUrls: r.evidenceUrls, testingStatus: r.testingStatus,
          examined: r.examined, interviewed: r.interviewed, tested: r.tested, observedAt: r.observedAt,
        })));
        for (const p of plan) extra.push(getDb().insert(csfScores).values({ assessmentId: newId, ...p }));
        if (profile) {
          extra.push(getDb().insert(csfProfiles).values({
            assessmentId: newId, scope: profile.scope, currentTier: profile.currentTier, targetTier: profile.targetTier,
          }));
        }
      }
    }

    // The Neon HTTP driver has no interactive `db.transaction`; `db.batch` runs a fixed
    // list of prepared statements atomically instead, so the new assessment's id is
    // generated up front and every copied row references it in the same batch.
    await getDb().batch([insertAssessment, ...extra] as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]);
    id = newId;
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  redirect(`/grc/a/${id}`);
}

/**
 * The assessment details form posts every field on every save (there is no partial-patch
 * form), so every field below is read and validated as required or explicitly optional —
 * none of them silently falls back to a default the caller didn't ask for. A dedicated
 * status picker should call `setAssessmentStatus` instead of a partial post here.
 */
export async function updateAssessment(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const { assessment } = await requireAssessment(fd.get('assessmentId'));
    const title = str(fd.get('title'), 200, { required: true, field: 'Title' })!;
    const fiscalYear = optionalInt(fd.get('fiscalYear'), 1990, 2100, 'Fiscal year');
    const periodStart = optionalDate(fd.get('periodStart'), 'Period start');
    const periodEnd = optionalDate(fd.get('periodEnd'), 'Period end');
    if (periodStart && periodEnd && periodEnd < periodStart) throw new ValidationError('period end is before period start');
    const status = oneOf(fd.get('status'), ASSESSMENT_STATUSES, 'Status');
    const scope = str(fd.get('scope'), 2000, { field: 'Scope' });
    const lead = str(fd.get('lead'), 120, { field: 'Lead' });

    const folderIdRaw = str(fd.get('folderId'), 64);
    let folderId: string | null = null;
    if (folderIdRaw) {
      const folder = await loadFolder(folderIdRaw);
      if (!folder || folder.customerId !== assessment.customerId) throw new ValidationError('folder not found');
      folderId = folder.id;
    }

    await getDb().update(assessments).set({
      title, fiscalYear, periodStart, periodEnd, status, scope, lead, folderId, updatedAt: new Date(),
    }).where(eq(assessments.id, assessment.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

/** A lightweight status change (e.g. a header status picker) that doesn't require posting every other field. */
export async function setAssessmentStatus(assessmentId: string, status: string): Promise<ActionResult> {
  try {
    const { assessment } = await requireAssessment(assessmentId);
    const value = oneOf(status, ASSESSMENT_STATUSES, 'Status');
    await getDb().update(assessments).set({ status: value, updatedAt: new Date() }).where(eq(assessments.id, assessment.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function deleteAssessment(assessmentId: string, confirmTitle: string): Promise<ActionResult> {
  let customerId: string | null = null;
  try {
    const { assessment } = await requireAssessment(assessmentId);
    const confirm = str(confirmTitle, 200) ?? '';
    if (confirm !== assessment.title) throw new ValidationError('title does not match');
    await getDb().delete(assessments).where(eq(assessments.id, assessment.id));
    customerId = assessment.customerId;
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  redirect(`/grc/c/${customerId}`);
}

// ── ISO control status ─────────────────────────────────────

export interface ControlStatusInput {
  assessmentId: string;
  controlId: string;
  status: string;
  justification?: string | null;
  owner?: string | null;
  evidenceUrls?: string;
}

export async function setControlStatus(input: ControlStatusInput): Promise<ActionResult> {
  try {
    const { assessment } = await requireAssessment(input.assessmentId, 'iso27001');
    if (!Object.hasOwn(CONTROL_BY_ID, input.controlId)) throw new ValidationError('unknown control');
    const status = oneOf(input.status, CONTROL_STATUSES, 'Status');
    const patch: Partial<typeof controlStatuses.$inferInsert> = { status, updatedAt: new Date() };
    if (input.justification !== undefined) patch.justification = str(input.justification, 4000, { field: 'Justification' });
    if (input.owner !== undefined) patch.owner = str(input.owner, 120, { field: 'Owner' });
    if (input.evidenceUrls !== undefined) patch.evidenceUrls = urlList(input.evidenceUrls);
    await getDb().insert(controlStatuses)
      .values({ assessmentId: assessment.id, controlId: input.controlId, ...patch })
      .onConflictDoUpdate({ target: [controlStatuses.assessmentId, controlStatuses.controlId], set: patch });
    await getDb().update(assessments).set({ updatedAt: new Date() }).where(eq(assessments.id, assessment.id));
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

// ── Risks (per customer) ────────────────────────────────────

export async function saveRisk(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  let id: string | null = null;
  let customerId: string | null = null;
  try {
    const { customer } = await requireCustomer(fd.get('customerId'));
    customerId = customer.id;
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
      linkedCsfIds: idList(fd.getAll('linkedCsfIds'), CSF_IDS, 30),
      residualLikelihood: optionalInt(fd.get('residualLikelihood'), 1, 5, 'Residual likelihood'),
      residualImpact: optionalInt(fd.get('residualImpact'), 1, 5, 'Residual impact'),
      updatedAt: new Date(),
    };
    if (id) {
      const [updated] = await db.update(risks).set(values)
        .where(and(eq(risks.id, id), eq(risks.customerId, customer.id))).returning({ id: risks.id });
      if (!updated) throw new ValidationError('risk not found');
    } else {
      // Next sequential reference. A collision on the unique (customer, ref) index is
      // retried once; concurrent creates by one owner are not a realistic case.
      for (let attempt = 0; attempt < 2; attempt++) {
        const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(risks).where(eq(risks.customerId, customer.id));
        const ref = `RISK-${String(n + 1 + attempt).padStart(3, '0')}`;
        try {
          const [row] = await db.insert(risks).values({ customerId: customer.id, framework: 'iso27001', ref, ...values }).returning({ id: risks.id });
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
  revalidatePath(GRC_BASE, 'layout');
  redirect(`/grc/c/${customerId}/risks/${id}`);
}

export async function deleteRisk(customerId: string, id: string): Promise<ActionResult> {
  let resolvedCustomerId: string | null = null;
  try {
    const { customer } = await requireCustomer(customerId);
    resolvedCustomerId = customer.id;
    const riskId = str(id, 64, { required: true, field: 'risk id' })!;
    const [deleted] = await getDb().delete(risks)
      .where(and(eq(risks.id, riskId), eq(risks.customerId, customer.id)))
      .returning({ id: risks.id });
    if (!deleted) throw new ValidationError('risk not found');
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  redirect(`/grc/c/${resolvedCustomerId}/risks`);
}

export async function updateMethodology(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const { customer } = await requireCustomer(fd.get('customerId'));
    const lowMax = int(fd.get('lowMax'), 1, 24, 'Low max');
    const mediumMax = int(fd.get('mediumMax'), 2, 24, 'Medium max');
    const highMax = int(fd.get('highMax'), 3, 24, 'High max');
    const acceptMax = int(fd.get('acceptMax'), 1, 25, 'Acceptance threshold');
    if (!(lowMax < mediumMax && mediumMax < highMax)) throw new ValidationError('thresholds must increase: low < medium < high');
    await getDb().insert(riskMethodologies).values({ customerId: customer.id, lowMax, mediumMax, highMax, acceptMax })
      .onConflictDoUpdate({ target: riskMethodologies.customerId, set: { lowMax, mediumMax, highMax, acceptMax } });
  } catch (err) {
    return fail(err);
  }
  revalidatePath(GRC_BASE, 'layout');
  return { ok: true, message: 'saved' };
}
