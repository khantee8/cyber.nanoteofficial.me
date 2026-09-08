'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { auth } from '@/auth';
import { accessRequests, users } from '@/db/schema';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const db = getDb();
  const [user] = await db.select().from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user || user.role !== 'admin') throw new Error('Unauthorized');
  return user;
}

export async function decideAccessRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
) {
  if (decision !== 'approved' && decision !== 'rejected') {
    throw new Error('Invalid decision');
  }
  await requireAdmin();
  const db = getDb();

  // Claim the request in a single conditional write: only a row still `pending`
  // is returned, so two concurrent approvals cannot both proceed to the insert
  // below (which would collide on the unique email).
  const [request] = await db.update(accessRequests)
    .set({ status: decision, decidedAt: new Date() })
    .where(and(eq(accessRequests.id, requestId), eq(accessRequests.status, 'pending')))
    .returning({ email: accessRequests.email });
  if (!request) return;

  if (decision === 'approved') {
    const email = request.email.toLowerCase();
    // Insert-or-approve in one statement. The first-time-approved case needs a
    // row to exist with `approvedAt` set, because the signIn callback in
    // src/auth.ts admits a non-allowlisted person only when it finds one.
    await db.insert(users)
      .values({ email, approvedAt: new Date() })
      .onConflictDoUpdate({
        target: users.email,
        set: { approvedAt: new Date() },
      });
  }

  revalidatePath('/admin');
}
