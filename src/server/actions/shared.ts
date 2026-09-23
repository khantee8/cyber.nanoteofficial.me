import 'server-only';
import { getOrgForUser, getViewer } from '@/lib/grc/queries';
import { ValidationError } from '@/lib/validate';

export interface ActionResult { ok: boolean; message?: string }

export async function requireOrg() {
  const viewer = await getViewer();
  if (!viewer) throw new Error('Unauthorized');
  const org = await getOrgForUser(viewer.userId);
  if (!org) throw new Error('No organisation');
  return { viewer, org };
}

export function fail(err: unknown): ActionResult {
  if (err instanceof ValidationError) return { ok: false, message: err.message };
  console.error('grc action failed', err);
  return { ok: false, message: 'Something went wrong. Try again.' };
}
