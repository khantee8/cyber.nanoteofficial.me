import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth, signOut } from '@/auth';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import { t } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

/**
 * The only gate in front of the signed-in app — this project has no middleware,
 * so every page under `(app)` is protected here and nowhere else. Approval is
 * re-read from the database on each request rather than trusted from the
 * session, so revoking access takes effect on the next navigation.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect('/signin');

  const db = getDb();
  const [user] = await db
    .select({ role: users.role, approvedAt: users.approvedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user?.approvedAt) redirect('/pending');

  const lang = await getLang();
  const linkCls = 'text-[13px] text-muted transition-colors hover:text-fg';

  return (
    <>
      <Nav
        lang={lang}
        right={
          <nav className="flex items-center gap-4" aria-label="Account">
            {user.role === 'admin' ? (
              <Link href="/admin" className={linkCls}>{t(lang, 'nav.admin')}</Link>
            ) : null}
            <span className="mono hidden max-w-[180px] truncate text-[11px] text-muted-soft lg:inline">{email}</span>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
              <button type="submit" className={linkCls}>{t(lang, 'nav.signOut')}</button>
            </form>
          </nav>
        }
      />
      <main className="flex-1">
        <div className="animate-in mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">{children}</div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
