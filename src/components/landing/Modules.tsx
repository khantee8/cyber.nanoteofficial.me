import Link from 'next/link';
import { modules, type ModuleStatus } from '@/lib/modules';
import type { Lang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import Icon from '@/components/site/Icon';

export function StatusChip({ status, lang }: { status: ModuleStatus; lang: Lang }) {
  const cls =
    status === 'live' ? 'border-accent/50 text-accent' :
    status === 'available' ? 'border-sev-low/50 text-sev-low' :
    'border-line-strong text-muted';
  const label = status === 'live' ? t(lang, 'common.live') : status === 'available' ? t(lang, 'common.available') : t(lang, 'common.inDesign');
  return (
    <span className={`mono inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider ${cls}`}>
      {status === 'live' ? <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" /> : null}
      {label}
    </span>
  );
}

const span: Record<string, string> = { intel: 'md:col-span-4', grc: 'md:col-span-2', redteam: 'md:col-span-3', training: 'md:col-span-3' };

export default function Modules({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">{t(lang, 'home.modulesEyebrow')}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t(lang, 'home.modulesTitle')}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{t(lang, 'home.modulesLede')}</p>
      </div>
      <div className="mt-10 grid gap-3 md:grid-cols-6">
        {modules.map((m) => (
          <Link
            key={m.slug}
            href={m.href}
            className={`panel group flex flex-col p-5 transition-colors hover:border-line-strong ${span[m.slug]}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface-2 text-accent">
                <Icon name={m.icon} className="h-4.5 w-4.5" />
              </span>
              <div className="flex items-center gap-2">
                {m.gated ? <Icon name="lock" className="h-3.5 w-3.5 text-muted-soft" /> : null}
                <StatusChip status={m.status} lang={lang} />
              </div>
            </div>
            <h3 className="mt-5 text-[19px] font-semibold tracking-tight">{pick(m.name, lang)}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{pick(m.blurb, lang)}</p>
            <ul className="mt-4 flex flex-col gap-1.5 text-[13px]">
              {m.bullets.map((b) => (
                <li key={b.en} className="flex items-start gap-2 text-muted">
                  <Icon name="check" className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{pick(b, lang)}</span>
                </li>
              ))}
            </ul>
            <span className="mono mt-auto inline-flex items-center gap-1 pt-6 text-[11.5px] text-muted-soft transition-colors group-hover:text-fg">
              {t(lang, 'common.open')} <Icon name="arrow" className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
