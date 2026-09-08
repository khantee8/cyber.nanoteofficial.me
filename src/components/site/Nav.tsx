import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import Wordmark from './Wordmark';
import LangToggle from './LangToggle';
import Icon from './Icon';

const links = [
  { href: '/intel', key: 'nav.intel' },
  { href: '/grc', key: 'nav.grc' },
  { href: '/redteam', key: 'nav.redteam' },
  { href: '/training', key: 'nav.training' },
] as const;

/**
 * Site-wide navigation. The mobile menu is a native <details> so it works
 * before hydration and needs no client state.
 */
export default function Nav({ lang, right }: { lang: Lang; right?: ReactNode }) {
  const linkCls = 'text-[13.5px] text-muted transition-colors hover:text-fg';
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls}>
              {t(lang, l.key)}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-4 md:flex">
          <LangToggle lang={lang} />
          {right ?? (
            <Link href="/signin" className="btn h-8 min-h-0 px-3 text-[13px]">
              <Icon name="lock" className="h-3.5 w-3.5" />
              {t(lang, 'nav.signIn')}
            </Link>
          )}
        </div>
        <details className="group ml-auto md:hidden">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-line text-muted [&::-webkit-details-marker]:hidden">
            <span className="sr-only">{t(lang, 'nav.menu')}</span>
            <Icon name="menu" className="h-4 w-4 group-open:hidden" />
            <Icon name="close" className="hidden h-4 w-4 group-open:block" />
          </summary>
          <div className="absolute inset-x-0 top-14 border-b border-line bg-bg px-5 py-4">
            <nav className="flex flex-col gap-3" aria-label="Primary">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-[15px] text-fg">
                  {t(lang, l.key)}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <LangToggle lang={lang} />
              {right ?? (
                <Link href="/signin" className="btn h-8 min-h-0 px-3 text-[13px]">
                  {t(lang, 'nav.signIn')}
                </Link>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
