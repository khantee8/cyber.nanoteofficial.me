'use client';

import { useState, useTransition } from 'react';
import { prefillFromIso } from '@/server/actions/csf';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

export default function PrefillButton({ count, lang }: { count: number; lang: Lang }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[13px]">{t(lang, 'csf.prefill.count', { n: count })}</span>
      <button type="button" disabled={pending || count === 0} className="btn h-9 min-h-0 text-[13px]"
        onClick={() => start(async () => {
          const res = await prefillFromIso();
          setMsg(res.ok ? t(lang, 'csf.prefill.done', { n: res.count ?? 0 }) : (res.message ?? t(lang, 'common.error')));
        })}>
        {t(lang, 'csf.prefill.button', { n: count })}
      </button>
      {msg ? <span className="text-[12px] text-accent">{msg}</span> : null}
    </div>
  );
}
