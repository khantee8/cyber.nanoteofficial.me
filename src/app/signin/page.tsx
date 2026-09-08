import Link from 'next/link';
import { signIn } from '@/auth';
import { t } from '@/lib/i18n';
import { getLang } from '@/lib/lang';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';

export const metadata = { title: 'Sign in' };

export default async function SignInPage({ searchParams }: PageProps<'/signin'>) {
  const params = await searchParams;
  // Auth.js redirects here with ?provider=&type= after mailing a link.
  const sent = Boolean(params.provider);
  const failed = Boolean(params.error);
  const misconfigured = params.error === 'Configuration';
  const lang = await getLang();

  return (
    <>
      <Nav lang={lang} />
      <main className="flex flex-1 items-center justify-center">
        <div className="animate-in mx-auto w-full max-w-md px-5 py-16 sm:px-6 sm:py-20">
          {sent ? (
            <div className="panel p-6 sm:p-8">
              <p className="eyebrow">{t(lang, 'signin.title')}</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t(lang, 'signin.sentTitle')}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t(lang, 'signin.sentP1')}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {t(lang, 'signin.sentP2')}{' '}
                <Link href="/signin" className="text-accent underline">{t(lang, 'signin.tryAgain')}</Link>.
              </p>
            </div>
          ) : (
            <>
              <p className="eyebrow">NaNote Cyber</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t(lang, 'signin.title')}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t(lang, 'signin.lede')}</p>
              <form
                action={async (formData: FormData) => {
                  'use server';
                  await signIn('resend', { email: String(formData.get('email')), redirectTo: '/grc' });
                }}
                className="mt-8 space-y-3"
              >
                <label htmlFor="signin-email" className="sr-only">{t(lang, 'signin.emailLabel')}</label>
                <input id="signin-email" name="email" type="email" autoComplete="email" required
                  placeholder="you@company.com" className="field" />
                <button type="submit" className="btn btn-primary w-full justify-center">
                  {t(lang, 'signin.submit')}
                </button>
              </form>
              {failed ? (
                <p className="mt-4 text-sm leading-relaxed text-sev-critical">
                  {misconfigured ? t(lang, 'signin.errConfig') : t(lang, 'signin.errFailed')}
                </p>
              ) : null}
              <p className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-muted">
                {t(lang, 'signin.noAccount')}{' '}
                <Link href="/#access" className="text-accent underline">{t(lang, 'signin.request')}</Link>
              </p>
            </>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
