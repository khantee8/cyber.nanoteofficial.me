import Link from 'next/link';
import type { ModuleDef } from '@/lib/modules';
import type { Lang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import Nav from './Nav';
import Footer from './Footer';
import Icon from './Icon';
import { StatusChip } from '@/components/landing/Modules';

/** Shared layout for modules that are designed but not built. No fake screenshots. */
export default function ModulePage({ mod, lang, paragraphs, bullets }: { mod: ModuleDef; lang: Lang; paragraphs: string[]; bullets: string[] }) {
  return (
    <>
      <Nav lang={lang} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-14 sm:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md border border-line bg-surface text-accent"><Icon name={mod.icon} className="h-5 w-5" /></span>
              <StatusChip status={mod.status} lang={lang} />
            </div>
            <h1 className="mt-5 text-[36px] font-semibold leading-tight tracking-[-0.02em] sm:text-[44px]">{pick(mod.name, lang)}</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">{pick(mod.blurb, lang)}</p>
            <div className="mt-8 flex flex-col gap-4 text-[15px] leading-relaxed text-fg/90">
              {paragraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </div>
          </div>
          <aside className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
            <section className="panel p-5">
              <p className="eyebrow mb-3">{t(lang, 'module.planned')}</p>
              <ul className="flex flex-col gap-2 text-[13.5px]">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-muted"><Icon name="check" className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" /><span>{b}</span></li>
                ))}
              </ul>
            </section>
            <section className="panel p-5">
              <p className="eyebrow mb-2">{t(lang, 'module.briefing')}</p>
              <p className="text-[13px] leading-relaxed text-muted">{t(lang, 'module.briefingLede')}</p>
              <Link href="/#access" className="btn btn-primary mt-4">{t(lang, 'home.ctaAccess')} <Icon name="arrow" className="h-4 w-4" /></Link>
            </section>
          </aside>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
