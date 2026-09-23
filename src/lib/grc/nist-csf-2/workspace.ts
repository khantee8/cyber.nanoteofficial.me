import 'server-only';
import { redirect } from 'next/navigation';
import { getLang } from '@/lib/lang';
import { getMethodology, getOrgForUser, getViewer } from '../queries';

export const CSF_BASE = '/grc/nist-csf-2';
export const CSF_FRAMEWORK = 'nist-csf-2';

/** Everything a CSF page needs. The organisation is shared with ISO 27001, so setup lives there. */
export async function loadCsfWorkspace() {
  const [lang, viewer] = await Promise.all([getLang(), getViewer()]);
  if (!viewer) redirect('/signin');
  const org = await getOrgForUser(viewer.userId);
  if (!org) redirect(`/grc/iso27001/setup?next=${encodeURIComponent(CSF_BASE)}`);
  const methodology = await getMethodology(org.id);
  return { lang, viewer, org, methodology };
}
