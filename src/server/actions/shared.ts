import 'server-only';
import type { FrameworkId } from '@/db/schema';
import { getApprovedViewer, getAssessment, getCustomer } from '@/lib/grc/queries';
import { str, ValidationError } from '@/lib/validate';

export interface ActionResult { ok: boolean; message?: string }

/**
 * Invoking a server action never renders `(app)/layout.tsx`, so its approval redirect
 * does not protect writes — every action must re-check approval itself.
 */
export async function requireApproved() {
  const viewer = await getApprovedViewer();
  if (!viewer) throw new Error('Unauthorized');
  return viewer;
}

export async function requireCustomer(customerId: unknown) {
  const viewer = await requireApproved();
  const id = str(customerId, 64, { required: true, field: 'customer id' });
  const customer = id ? await getCustomer(id) : null;
  if (!customer) throw new ValidationError('customer not found');
  return { viewer, customer };
}

export async function requireAssessment(assessmentId: unknown, framework?: FrameworkId) {
  const viewer = await requireApproved();
  const id = str(assessmentId, 64, { required: true, field: 'assessment id' });
  const assessment = id ? await getAssessment(id) : null;
  if (!assessment || (framework && assessment.framework !== framework)) throw new ValidationError('assessment not found');
  const customer = await getCustomer(assessment.customerId);
  if (!customer) throw new ValidationError('assessment not found');
  return { viewer, customer, assessment };
}

export function fail(err: unknown): ActionResult {
  if (err instanceof ValidationError) return { ok: false, message: err.message };
  console.error('grc action failed', err);
  return { ok: false, message: 'Something went wrong. Try again.' };
}
