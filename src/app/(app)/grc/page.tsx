import Link from 'next/link';
import { frameworks, plannedFrameworks } from '@/lib/grc/frameworks';
import { getLang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import Icon from '@/components/site/Icon';

export const metadata = { title: 'GRC' };

export default async function GrcHub() {
  const lang = await getLang();
  return (
    <div className="flex flex-col gap-10">
      <div className="max-w-2xl">
        <p className="eyebrow">{t(lang, 'grc.eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(lang, 'grc.title')}</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{t(lang, 'grc.lede')}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {frameworks.map((f) => (
          <Link key={f.slug} href={f.href} className="panel group flex flex-col p-5 transition-colors hover:border-accent/50 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface-2 text-accent"><Icon name="clipboard" /></span>
              <span className="mono rounded border border-accent/50 px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-accent">{t(lang, 'common.available')}</span>
            </div>
            <h2 className="mt-5 text-[20px] font-semibold tracking-tight">{pick(f.name, lang)} <span className="mono text-[12px] font-normal text-muted-soft">{t(lang, 'grc.version')} {f.version}</span></h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{pick(f.blurb, lang)}</p>
            <span className="mono mt-auto inline-flex items-center gap-1 pt-6 text-[11.5px] text-muted-soft group-hover:text-fg">
              {t(lang, 'common.open')} <Icon name="arrow" className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
        <div className="flex flex-col gap-3">
          <p className="eyebrow">{t(lang, 'grc.planned')}</p>
          {plannedFrameworks.map((p) => (
            <div key={p.slug} className="panel flex-1 p-4 opacity-80">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">{pick(p.name, lang)}</h3>
                <span className="mono rounded border border-line-strong px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-muted">{t(lang, 'common.inDesign')}</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{pick(p.blurb, lang)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
