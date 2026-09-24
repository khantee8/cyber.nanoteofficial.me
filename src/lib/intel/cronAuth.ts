import { timingSafeEqual } from 'node:crypto';

/** Bearer check for cron callers. Refuses when CRON_SECRET is unset (fails closed). */
export function isAuthorised(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith('Bearer ')) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
