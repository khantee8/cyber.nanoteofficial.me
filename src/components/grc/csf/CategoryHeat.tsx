import Link from 'next/link';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import type { CsfSummary } from '@/lib/grc/nist-csf-2/score';

/** Colour steps by average gap; every cell also prints its number. */
function gapColor(g: number | null): string {
  if (g === null) return 'var(--surface-2)';
  if (g === 0) return 'color-mix(in oklab, var(--accent) 30%, var(--surface-2))';
  if (g < 1) return 'color-mix(in oklab, var(--sev-medium) 30%, var(--surface-2))';
  if (g < 2) return 'color-mix(in oklab, var(--sev-medium) 55%, var(--surface-2))';
  if (g < 3) return 'color-mix(in oklab, var(--sev-high) 55%, var(--surface-2))';
  return 'color-mix(in oklab, var(--sev-critical) 60%, var(--surface-2))';
}

export default function CategoryHeat({ items, base, lang }: { items: { id: string; name: string; s: CsfSummary }[]; base: string; lang: Lang }) {
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {items.map(({ id, name, s }) => (
        <li key={id}>
          <Link href={`${base}/profile?fn=${id.slice(0, 2)}`} className="flex items-center gap-3 rounded px-3 py-2 text-[12.5px] hover:outline hover:outline-1 hover:outline-line-strong"
            style={{ background: gapColor(s.avgGap) }}>
            <span className="mono w-12 shrink-0 text-[11px] text-muted">{id}</span>
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="mono text-[11px] text-muted">{s.assessed}/{s.inScope}</span>
            <span className="mono w-10 text-right font-semibold">{s.avgGap === null ? '—' : s.avgGap.toFixed(1)}</span>
          </Link>
        </li>
      ))}
      <li className="mono col-span-full mt-1 text-[10.5px] text-muted-soft">{t(lang, 'csf.gap')} · {t(lang, 'csf.coverage')}</li>
    </ul>
  );
}
