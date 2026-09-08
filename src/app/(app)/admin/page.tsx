import { notFound } from 'next/navigation';
import { desc, eq, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { getDb } from '@/db';
import { accessRequests, users } from '@/db/schema';
import AdminDecideButtons from '@/components/site/AdminDecideButtons';
import { t, type Key } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const metadata = { title: 'Admin' };

const STATUS_KEY: Record<string, Key> = {
  pending: 'admin.statusPending',
  approved: 'admin.statusApproved',
  rejected: 'admin.statusRejected',
};

const fmt = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ');

export default async function AdminPage() {
  const lang = await getLang();
  const session = await auth();
  const email = session?.user?.email;
  if (!email) notFound();

  const db = getDb();
  const [me] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!me || me.role !== 'admin') notFound();

  const requests = await db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt)).limit(50);
  const allUsers = await db.select().from(users).orderBy(sql`${users.approvedAt} is null`, desc(users.approvedAt));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <p className="eyebrow">{t(lang, 'nav.admin')}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t(lang, 'admin.title')}</h1>
        </div>
        <div className="panel overflow-hidden">
          {requests.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">{t(lang, 'admin.noRequests')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.email}</p>
                    {r.message ? <p className="truncate text-xs text-muted">{r.message}</p> : null}
                    <p className="mono text-[11px] text-muted-soft">{fmt(r.createdAt)}</p>
                  </div>
                  {r.status === 'pending' ? (
                    <AdminDecideButtons requestId={r.id}
                      labels={{ approve: t(lang, 'admin.approve'), reject: t(lang, 'admin.reject') }} />
                  ) : (
                    <span className={`mono shrink-0 text-[11px] uppercase tracking-wider ${r.status === 'approved' ? 'text-accent' : 'text-sev-critical'}`}>
                      {t(lang, STATUS_KEY[r.status] ?? 'admin.statusPending')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t(lang, 'admin.users')}</h2>
        <div className="panel overflow-hidden">
          <ul className="divide-y divide-line">
            {allUsers.map((u) => (
              <li key={u.id} className="px-4 py-3">
                <p className="truncate text-sm font-medium">{u.email}</p>
                <p className="mono text-[11px] text-muted-soft">
                  {u.role} · {u.approvedAt ? t(lang, 'admin.approvedOn', { date: u.approvedAt.toISOString().slice(0, 10) }) : t(lang, 'admin.notApproved')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
