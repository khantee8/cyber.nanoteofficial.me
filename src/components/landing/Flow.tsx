import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import Icon, { type IconName } from '@/components/site/Icon';

export default function Flow({ lang }: { lang: Lang }) {
  const steps: { icon: IconName; title: string; body: string }[] = [
    { icon: 'radar', title: t(lang, 'home.flow1Title'), body: t(lang, 'home.flow1Body') },
    { icon: 'clipboard', title: t(lang, 'home.flow2Title'), body: t(lang, 'home.flow2Body') },
    { icon: 'flask', title: t(lang, 'home.flow3Title'), body: t(lang, 'home.flow3Body') },
  ];
  return (
    <section className="border-y border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <p className="eyebrow">{t(lang, 'home.flowEyebrow')}</p>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4">
              <span className="mono mt-0.5 shrink-0 text-[11px] text-muted-soft">0{i + 1}</span>
              <div>
                <h3 className="flex items-center gap-2 text-[16px] font-semibold tracking-tight">
                  <Icon name={s.icon} className="h-4 w-4 text-accent" />
                  {s.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
              </div>
              {i < steps.length - 1 ? (
                <Icon name="arrow" className="absolute -right-5 top-1 hidden h-4 w-4 text-muted-soft md:block" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
