import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getLang } from '@/lib/lang';
import { getApprovedViewer, getMethodology, getOrgForUser } from '../queries';

export const CSF_BASE = '/grc/nist-csf-2';
export const CSF_FRAMEWORK = 'nist-csf-2';

/**
 * Everything a CSF page needs. The organisation is shared with ISO 27001, so
 * setup lives there. Re-checks approval itself (see loadWorkspace in
 * ../workspace.ts for why): no session at all -> /signin, signed in but not
 * approved -> /pending, mirroring (app)/layout.tsx.
 */
export async function loadCsfWorkspace() {
  const [lang, session, viewer] = await Promise.all([getLang(), auth(), getApprovedViewer()]);
  if (!session?.user?.email) redirect('/signin');
  if (!viewer) redirect('/pending');
  const org = await getOrgForUser(viewer.userId);
  if (!org) redirect(`/grc/iso27001/setup?next=${encodeURIComponent(CSF_BASE)}`);
  const methodology = await getMethodology(org.id);
  return { lang, viewer, org, methodology };
}
