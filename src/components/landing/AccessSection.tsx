import Link from 'next/link';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import RequestAccessForm from '@/components/site/RequestAccessForm';

export default function AccessSection({ lang }: { lang: Lang }) {
  return (
    <section id="access" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:py-20">
      <div className="lg:col-span-6">
        <p className="eyebrow">{t(lang, 'home.accessEyebrow')}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t(lang, 'access.title')}</h2>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">{t(lang, 'access.lede')}</p>
        <p className="mt-6 text-[13.5px] text-muted">
          {t(lang, 'access.already')}{' '}
          <Link href="/signin" className="text-accent underline">{t(lang, 'nav.signIn')}</Link>
        </p>
      </div>
      <div className="panel p-5 lg:col-span-5 lg:col-start-8">
        <RequestAccessForm
          labels={{
            emailLabel: t(lang, 'access.emailLabel'),
            messageHint: t(lang, 'access.messageHint'),
            sending: t(lang, 'access.sending'),
            submit: t(lang, 'access.submit'),
            messages: {
              received: t(lang, 'access.received'),
              invalidEmail: t(lang, 'access.invalidEmail'),
              rate: t(lang, 'access.rate'),
              failed: t(lang, 'access.failed'),
            },
          }}
        />
      </div>
    </section>
  );
}
