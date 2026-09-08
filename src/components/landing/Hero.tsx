import Link from 'next/link';
import type { IntelSnapshot } from '@/lib/intel/aggregate';
import { ago, fmtDate } from '@/lib/intel/format';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import Icon from '@/components/site/Icon';
import HudBar, { SourceHealthDots } from '@/components/intel/HudBar';

export default function Hero({ snapshot, lang }: { snapshot: IntelSnapshot; lang: Lang }) {
  const latest = snapshot.kev.slice(0, 4);
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-14 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:pb-20 lg:pt-20">
        <div className="lg:col-span-7">
          <p className="eyebrow">{t(lang, 'home.eyebrow')}</p>
          <h1 className="mt-4 max-w-xl text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[52px]">
            {t(lang, 'home.headline')}
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted">{t(lang, 'home.lede')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/intel" className="btn btn-primary">
              {t(lang, 'home.ctaIntel')}
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link href="#access" className="btn">{t(lang, 'home.ctaAccess')}</Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">{t(lang, 'home.hudTitle')}</p>
              <p className="mono flex items-center gap-2 text-[11px] text-muted-soft">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {ago(snapshot.generatedAt, new Date(), lang)}
              </p>
            </div>
            <HudBar snapshot={snapshot} lang={lang} compact />
            <div className="mt-4 border-t border-line pt-3">
              <p className="eyebrow mb-2">{t(lang, 'home.latestExploited')}</p>
              <ul className="flex flex-col gap-1.5">
                {latest.map((k) => (
                  <li key={k.cveId} className="flex items-baseline gap-3 text-[12.5px]">
                    <span className="mono shrink-0 text-fg">{k.cveId}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{k.vendor} {k.product}</span>
                    <span className="mono shrink-0 text-[11px] text-muted-soft">{fmtDate(k.dateAdded).slice(5)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <SourceHealthDots health={snapshot.health} lang={lang} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
