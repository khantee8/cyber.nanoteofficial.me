'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { csfProfiles, csfScores } from '@/db/schema';
import { getCsfScore, getCsfScores, getStatuses, toScoreRows } from '@/lib/grc/queries';
import { CSF_BY_ID, CSF_CATEGORY_BY_ID, CSF_SUBCATEGORIES } from '@/lib/grc/nist-csf-2/catalogue';
import { prefillPlan, suggestCurrent } from '@/lib/grc/nist-csf-2/score';
import { TESTING_STATUSES } from '@/lib/grc/nist-csf-2/types';
import { CSF_BASE } from '@/lib/grc/nist-csf-2/workspace';
import { ValidationError, bool, halfStep, isoDate, oneOf, optionalTier, str, urlList } from '@/lib/validate';
import { fail, requireOrg, type ActionResult } from './shared';

export interface CsfScoreInput {
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

async function upsert(orgId: string, subcategoryId: string, patch: Patch) {
  const set = { ...patch, updatedAt: new Date() };
  await getDb().insert(csfScores)
    .values({ organisationId: orgId, subcategoryId, ...set })
    .onConflictDoUpdate({ target: [csfScores.organisationId, csfScores.subcategoryId], set });
}

export async function saveCsfScore(input: CsfScoreInput): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    if (!CSF_BY_ID[input.subcategoryId]) throw new ValidationError('unknown subcategory');
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
    await upsert(org.id, input.subcategoryId, p);
  } catch (err) {
    return fail(err);
  }
  revalidatePath(CSF_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function bulkSetTarget(categoryId: string, target: string): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    if (!CSF_CATEGORY_BY_ID[categoryId]) throw new ValidationError('unknown category');
    const value = halfStep(target, 'Target');
    if (value === null) throw new ValidationError('choose a Target');
    for (const s of CSF_SUBCATEGORIES.filter((x) => x.category === categoryId)) await upsert(org.id, s.id, { target: value });
  } catch (err) {
    return fail(err);
  }
  revalidatePath(CSF_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function acceptSuggestion(subcategoryId: string): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    const sub = CSF_BY_ID[subcategoryId];
    if (!sub) throw new ValidationError('unknown subcategory');
    const { value } = suggestCurrent(sub.iso27001, await getStatuses(org.id, 'iso27001'));
    if (value === null) throw new ValidationError('no suggestion for this subcategory');
    await upsert(org.id, subcategoryId, { current: value });
  } catch (err) {
    return fail(err);
  }
  revalidatePath(CSF_BASE, 'layout');
  return { ok: true, message: 'saved' };
}

export async function prefillFromIso(): Promise<ActionResult & { count?: number }> {
  let count = 0;
  try {
    const { org } = await requireOrg();
    const [scores, statuses] = await Promise.all([getCsfScores(org.id), getStatuses(org.id, 'iso27001')]);
    const plan = prefillPlan(toScoreRows(scores), statuses);
    for (const p of plan) {
      // Re-check emptiness per row so a concurrent edit is never overwritten.
      const existing = await getCsfScore(org.id, p.subcategoryId);
      if (existing?.current != null) continue;
      await upsert(org.id, p.subcategoryId, { current: p.value });
      count++;
    }
  } catch (err) {
    return fail(err);
  }
  revalidatePath(CSF_BASE, 'layout');
  return { ok: true, message: 'saved', count };
}

export async function saveCsfProfile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const { org } = await requireOrg();
    const values = {
      scope: str(fd.get('scope'), 2000, { field: 'Scope' }),
      currentTier: optionalTier(fd.get('currentTier'), 'Current Tier'),
      targetTier: optionalTier(fd.get('targetTier'), 'Target Tier'),
      updatedAt: new Date(),
    };
    await getDb().insert(csfProfiles).values({ organisationId: org.id, ...values })
      .onConflictDoUpdate({ target: csfProfiles.organisationId, set: values });
  } catch (err) {
    return fail(err);
  }
  revalidatePath(CSF_BASE, 'layout');
  return { ok: true, message: 'saved' };
}
