'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SubNav({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const path = usePathname();
  return (
    <nav className="mono -mx-1 flex gap-1 overflow-x-auto text-[12px]" aria-label="Workspace">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + '/');
        return (
          <Link key={it.href} href={it.href}
            className={`whitespace-nowrap rounded px-3 py-1.5 transition-colors ${active ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg'}`}
            aria-current={active ? 'page' : undefined}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
