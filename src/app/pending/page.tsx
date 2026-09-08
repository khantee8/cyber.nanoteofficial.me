import Link from 'next/link';
import { t } from '@/lib/i18n';
import { getLang } from '@/lib/lang';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';

export const metadata = { title: 'Awaiting approval' };

export default async function PendingPage() {
  const lang = await getLang();
  return (
    <>
      <Nav lang={lang} />
      <main className="flex flex-1 items-center justify-center">
        <div className="animate-in mx-auto w-full max-w-md px-5 py-16 sm:px-6 sm:py-20">
          <p className="eyebrow">{t(lang, 'pending.eyebrow')}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t(lang, 'pending.title')}</h1>
          <p className="mt-5 text-sm leading-relaxed text-muted">{t(lang, 'pending.p1')}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted">{t(lang, 'pending.p2')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#access" className="btn btn-primary">{t(lang, 'access.title')}</Link>
            <Link href="/signin" className="btn">{t(lang, 'pending.backToSignIn')}</Link>
          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
