'use client';

import { useTransition } from 'react';
import { setLang } from '@/server/actions/prefs';
import type { Lang } from '@/lib/lang';

export default function LangToggle({ lang }: { lang: Lang }) {
  const [pending, start] = useTransition();
  return (
    <div className="mono flex items-center rounded-md border border-line text-[11px]" role="group" aria-label="Language">
      {(['en', 'th'] as const).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={lang === l}
          onClick={() => start(() => { void setLang(l); })}
          className={`px-2.5 py-1 uppercase transition-colors first:rounded-l-[5px] last:rounded-r-[5px] disabled:opacity-50 ${
            lang === l ? 'bg-accent text-accent-ink' : 'text-muted hover:text-fg'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
