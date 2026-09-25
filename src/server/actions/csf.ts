'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { assessments, csfProfiles, csfScores } from '@/db/schema';
import { getCsfScore, getCsfScores, getStatuses, listAssessments, toScoreRows } from '@/lib/grc/queries';
import { CSF_BY_ID, CSF_CATEGORY_BY_ID, CSF_SUBCATEGORIES } from '@/lib/grc/nist-csf-2/catalogue';
import { pickIsoSource } from '@/lib/grc/isoSource';
import { prefillPlan, suggestCurrent } from '@/lib/grc/nist-csf-2/score';
import { TESTING_STATUSES } from '@/lib/grc/nist-csf-2/types';
import { ValidationError, bool, halfStep, isoDate, oneOf, optionalTier, str, urlList } from '@/lib/validate';
import { fail, requireAssessment, type ActionResult } from './shared';

export interface CsfScoreInput {
  assessmentId: string;
  subcategoryId: string;
  current?: string | number | null;
  target?: string | number | null;
  inScope?: boolean;
  owner?: string;
  testingStatus?: string;
  examined?: boolean;
  interviewed?: boolean;
  tested?: boolean;
  observedAt?: string;
  notes?: string;
  evidenceUrls?: string;
}

type Patch = Partial<typeof csfScores.$inferInsert>;

async function upsert(assessmentId: string, subcategoryId: string, patch: Patch) {
  const set = { ...patch, updatedAt: new Date() };
  await getDb().insert(csfScores)
    .values({ assessmentId, subcategoryId, ...set })
    .onConflictDoUpdate({ target: [csfScores.assessmentId, csfScores.subcategoryId], set });
}

/** Bumps the parent assessment's updatedAt so day-to-day CSF edits show up as recent activity. */
async function touchAssessment(assessmentId: string) {
  await getDb().update(assessments).set({ updatedAt: new Date() }).where(eq(assessments.id, assessmentId));
}

/** The ISO 27001 assessment to source suggestions/prefill from, per the copy rule in isoSource.ts. */
async function requireIsoSource(customerId: string, fiscalYear: number | null): Promise<string> {
  const all = await listAssessments(customerId);
  const sourceId = pickIsoSource(all, fiscalYear);
  if (!sourceId) throw new ValidationError('no ISO 27001 assessment for this customer');
  return sourceId;
}

export async function saveCsfScore(input: CsfScoreInput): Promise<ActionResult> {
  try {
    const { assessment } = await requireAssessment(input.assessmentId, 'nist-csf-2');
    if (!Object.hasOwn(CSF_BY_ID, input.subcategoryId)) throw new ValidationError('unknown subcategory');
    const p: Patch = {};
    if (input.current !== undefined) p.current = halfStep(input.current, 'Current');
    if (input.target !== undefined) p.target = halfStep(input.target, 'Target');
    if (input.inScope !== undefined) p.inScope = bool(input.inScope);
    if (input.owner !== undefined) p.owner = str(input.owner, 120, { field: 'Owner' });
    if (input.testingStatus !== undefined) p.testingStatus = oneOf(input.testingStatus, TESTING_STATUSES, 'Testing status');
    if (input.examined !== undefined) p.examined = bool(input.examined);
    if (input.interviewed !== undefined) p.interviewed = bool(input.interviewed);
    if (input.tested !== undefined) p.tested = bool(input.tested);
    if (input.observedAt !== undefined) p.observedAt = isoDate(input.observedAt, 'Observation date');
    if (input.notes !== undefined) p.notes = str(input.notes, 4000, { field: 'Notes' });
    if (input.evidenceUrls !== undefined) p.evidenceUrls = urlList(input.evidenceUrls);
    await upsert(assessment.id, input.subcategoryId, p);
    await touchAssessment(assessment.id);
  } catch (err) {
    return fail(err);
  }
  revalidatePath('/grc', 'layout');
  return { ok: true, message: 'saved' };
}

export async function bulkSetTarget(assessmentId: string, categoryId: string, target: string): Promise<ActionResult> {
  try {
    const { assessment } = await requireAssessment(assessmentId, 'nist-csf-2');
    if (!Object.hasOwn(CSF_CATEGORY_BY_ID, categoryId)) throw new ValidationError('unknown category');
    const value = halfStep(target, 'Target');
    if (value === null) throw new ValidationError('choose a Target');
    for (const s of CSF_SUBCATEGORIES.filter((x) => x.category === categoryId)) await upsert(assessment.id, s.id, { target: value });
    await touchAssessment(assessment.id);
  } catch (err) {
    return fail(err);
  }
  revalidatePath('/grc', 'layout');
  return { ok: true, message: 'saved' };
}

export async function acceptSuggestion(assessmentId: string, subcategoryId: string): Promise<ActionResult> {
  try {
    const { customer, assessment } = await requireAssessment(assessmentId, 'nist-csf-2');
    if (!Object.hasOwn(CSF_BY_ID, subcategoryId)) throw new ValidationError('unknown subcategory');
    const sub = CSF_BY_ID[subcategoryId];
    const sourceId = await requireIsoSource(customer.id, assessment.fiscalYear);
    const { value } = suggestCurrent(sub.iso27001, await getStatuses(sourceId));
    if (value === null) throw new ValidationError('no suggestion for this subcategory');
    await upsert(assessment.id, subcategoryId, { current: value });
    await touchAssessment(assessment.id);
  } catch (err) {
    return fail(err);
  }
  revalidatePath('/grc', 'layout');
  return { ok: true, message: 'saved' };
}

export async function prefillFromIso(assessmentId: string): Promise<ActionResult & { count?: number }> {
  let count = 0;
  try {
    const { customer, assessment } = await requireAssessment(assessmentId, 'nist-csf-2');
    const sourceId = await requireIsoSource(customer.id, assessment.fiscalYear);
    const [scores, statuses] = await Promise.all([getCsfScores(assessment.id), getStatuses(sourceId)]);
    const plan = prefillPlan(toScoreRows(scores), statuses);
    for (const p of plan) {
      // Re-check emptiness per row so a concurrent edit is never overwritten.
      const existing = await getCsfScore(assessment.id, p.subcategoryId);
      if (existing?.current != null) continue;
      await upsert(assessment.id, p.subcategoryId, { current: p.value });
      count++;
    }
    if (count > 0) await touchAssessment(assessment.id);
  } catch (err) {
    return fail(err);
  }
  revalidatePath('/grc', 'layout');
  return { ok: true, message: 'saved', count };
}

export async function saveCsfProfile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const { assessment } = await requireAssessment(fd.get('assessmentId'), 'nist-csf-2');
    const values = {
      scope: str(fd.get('scope'), 2000, { field: 'Scope' }),
      currentTier: optionalTier(fd.get('currentTier'), 'Current Tier'),
      targetTier: optionalTier(fd.get('targetTier'), 'Target Tier'),
      updatedAt: new Date(),
    };
    await getDb().insert(csfProfiles).values({ assessmentId: assessment.id, ...values })
      .onConflictDoUpdate({ target: csfProfiles.assessmentId, set: values });
    await touchAssessment(assessment.id);
  } catch (err) {
    return fail(err);
  }
  revalidatePath('/grc', 'layout');
  return { ok: true, message: 'saved' };
}
