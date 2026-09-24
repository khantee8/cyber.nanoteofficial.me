import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getLang } from '@/lib/lang';
import type { FrameworkId } from '@/db/schema';
import { getApprovedViewer, getAssessment, getCustomer, getFolders, getMethodology } from './queries';

export const customerBase = (id: string) => `/grc/c/${id}`;
export const assessmentBase = (id: string) => `/grc/a/${id}`;

/** Mirrors (app)/layout.tsx: no session → /signin, signed in but not approved → /pending. */
export async function loadViewer() {
  const [lang, session, viewer] = await Promise.all([getLang(), auth(), getApprovedViewer()]);
  if (!session?.user?.email) redirect('/signin');
  if (!viewer) redirect('/pending');
  return { lang, viewer };
}

export async function loadCustomer(customerId: string) {
  const { lang, viewer } = await loadViewer();
  const customer = await getCustomer(customerId);
  if (!customer) notFound();
  const methodology = await getMethodology(customer.id);
  return { lang, viewer, customer, methodology, base: customerBase(customer.id) };
}

export async function loadAssessment(assessmentId: string, framework?: FrameworkId) {
  const { lang, viewer } = await loadViewer();
  const assessment = await getAssessment(assessmentId);
  if (!assessment || (framework && assessment.framework !== framework)) notFound();
  const [customer, folders] = await Promise.all([getCustomer(assessment.customerId), getFolders(assessment.customerId)]);
  if (!customer) notFound();
  const methodology = await getMethodology(customer.id);
  return { lang, viewer, assessment, customer, methodology, folders, base: assessmentBase(assessment.id), customerBase: customerBase(customer.id) };
}
