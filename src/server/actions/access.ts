'use server';

import { headers } from 'next/headers';
import { and, eq, gte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { accessRequests } from '@/db/schema';
import { adminEmails, newRequestMail, sendMail } from '@/lib/mail';

export interface RequestAccessState {
  ok: boolean;
  /** i18n key resolved by the form */
  code: 'received' | 'invalidEmail' | 'rate' | 'failed';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 1000;
const REQUESTS_PER_HOUR = 3;

export async function requestAccess(
  _prev: RequestAccessState | null,
  formData: FormData,
): Promise<RequestAccessState> {
  // Honeypot: real people never see this field. A filled value is a bot, and
  // the bot is told it succeeded so it stops trying.
  if (String(formData.get('website') ?? '').trim()) return { ok: true, code: 'received' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const message = String(formData.get('message') ?? '').trim().slice(0, MESSAGE_MAX);

  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return { ok: false, code: 'invalidEmail' };
  }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  try {
    const db = getDb();

    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [recent] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(accessRequests)
      .where(and(eq(accessRequests.ip, ip), gte(accessRequests.createdAt, since)));

    if ((recent?.count ?? 0) >= REQUESTS_PER_HOUR) {
      return { ok: false, code: 'rate' };
    }

    const [pending] = await db
      .select({ id: accessRequests.id })
      .from(accessRequests)
      .where(and(eq(accessRequests.email, email), eq(accessRequests.status, 'pending')))
      .limit(1);

    if (!pending) {
      await db.insert(accessRequests).values({ email, message: message || null, ip });
      // Notify the admins. Awaited so the serverless function does not exit
      // before the send completes; failures are logged, never surfaced.
      const admins = adminEmails();
      if (admins.length) await sendMail({ to: admins, ...newRequestMail(email, message || null) });
    }
  } catch (err) {
    console.error('requestAccess failed', err);
    return { ok: false, code: 'failed' };
  }

  // Deliberately identical whether or not a request already existed, so the form
  // never reveals who has already asked for access.
  return { ok: true, code: 'received' };
}
