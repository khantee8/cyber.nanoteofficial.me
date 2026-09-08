import Link from 'next/link';
import type { Compliance } from '@/lib/grc/iso27001/score';
import { THEMES } from '@/lib/grc/iso27001/catalogue';
import type { Theme } from '@/lib/grc/types';
import type { Lang } from '@/lib/lang';
import { pick } from '@/lib/i18n';

export default function ThemeBars({ byTheme, lang, base }: { byTheme: Record<Theme, Compliance>; lang: Lang; base: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {THEMES.map((th) => {
        const c = byTheme[th.key];
        const impl = c.applicable ? c.implemented / c.applicable : 0;
        const part = c.applicable ? (c.partial * 0.5) / c.applicable : 0;
        return (
          <li key={th.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <Link href={`${base}/controls?theme=${th.key}`} className="hover:text-accent">
                {pick(th.label, lang)} <span className="mono text-[11px] text-muted-soft">{th.range}</span>
              </Link>
              <span className="mono text-[11.5px] text-muted">
                {c.implemented}<span className="text-muted-soft">+{c.partial}½</span> / {c.applicable}
              </span>
            </div>
            <div className="flex h-[6px] overflow-hidden rounded-full bg-surface-3">
              <span className="block h-full bg-accent" style={{ width: `${impl * 100}%` }} />
              <span className="block h-full bg-sev-medium" style={{ width: `${part * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
