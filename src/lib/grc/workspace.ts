import 'server-only';
import { redirect } from 'next/navigation';
import { getLang } from '@/lib/lang';
import { getMethodology, getOrgForUser, getViewer } from './queries';

/**
 * Everything an ISO 27001 page needs. The (app) layout has already verified the
 * session; the ISO layout has already redirected users without an organisation
 * to the setup screen, so pages can rely on `org` existing.
 */
export async function loadWorkspace() {
  const [lang, viewer] = await Promise.all([getLang(), getViewer()]);
  if (!viewer) redirect('/signin');
  const org = await getOrgForUser(viewer.userId);
  if (!org) redirect('/grc/iso27001/setup');
  const methodology = await getMethodology(org.id);
  return { lang, viewer, org, methodology };
}

export const FRAMEWORK = 'iso27001';
export const BASE = '/grc/iso27001';
