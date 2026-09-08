import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import pkg from '../../../package.json';

export default function Footer({ lang, refreshedAt }: { lang: Lang; refreshedAt?: string }) {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-[12px] text-muted-soft sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-3xl leading-relaxed">{t(lang, 'footer.sources')}</p>
        <p className="mono flex shrink-0 items-center gap-3">
          {refreshedAt ? (
            <span>
              {t(lang, 'footer.refreshed')} {new Date(refreshedAt).toISOString().slice(0, 16).replace('T', ' ')}Z
            </span>
          ) : null}
          <span>v{pkg.version}</span>
          <a href="https://nanoteofficial.me" target="_blank" rel="noopener noreferrer" className="hover:text-fg">
            {t(lang, 'footer.built')}
          </a>
        </p>
      </div>
    </footer>
  );
}
