import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getLang } from '@/lib/lang';
import { getApprovedViewer, getMethodology, getOrgForUser } from './queries';

/**
 * Everything an ISO 27001 page needs. The (app) layout gates the session on
 * first load, but layouts don't re-render on a client-side navigation, so a
 * page loader must re-check approval itself — otherwise a user whose access
 * is revoked mid-session keeps reaching gated pages until a hard reload.
 * Mirrors (app)/layout.tsx: no session at all -> /signin, signed in but not
 * (yet, or no longer) approved -> /pending. The ISO layout has already
 * redirected users without an organisation to the setup screen, so pages can
 * rely on `org` existing.
 */
export async function loadWorkspace() {
  const [lang, session, viewer] = await Promise.all([getLang(), auth(), getApprovedViewer()]);
  if (!session?.user?.email) redirect('/signin');
  if (!viewer) redirect('/pending');
  const org = await getOrgForUser(viewer.userId);
  if (!org) redirect('/grc/iso27001/setup');
  const methodology = await getMethodology(org.id);
  return { lang, viewer, org, methodology };
}

export const FRAMEWORK = 'iso27001';
export const BASE = '/grc/iso27001';
