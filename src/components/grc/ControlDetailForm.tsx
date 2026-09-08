'use client';

import { useState, useTransition } from 'react';
import { setControlStatus } from '@/server/actions/grc';
import { CONTROL_STATUSES, type ControlStatusValue } from '@/lib/grc/types';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

export default function ControlDetailForm({
  controlId, status, justification, owner, evidenceUrls, lang,
}: { controlId: string; status: ControlStatusValue; justification: string; owner: string; evidenceUrls: string[]; lang: Lang }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setMsg(null);
        start(async () => {
          const res = await setControlStatus({
            controlId,
            status: String(fd.get('status')),
            justification: String(fd.get('justification') ?? ''),
            owner: String(fd.get('owner') ?? ''),
            evidenceUrls: String(fd.get('evidenceUrls') ?? ''),
          });
          setMsg(res.ok ? { ok: true, text: t(lang, 'common.saved') } : { ok: false, text: res.message ?? t(lang, 'common.error') });
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.controls.status')}</span>
          <select name="status" defaultValue={status} className="field">
            {CONTROL_STATUSES.map((s) => <option key={s} value={s}>{t(lang, `grc.status.${s}`)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.controls.owner')}</span>
          <input name="owner" maxLength={120} defaultValue={owner} className="field" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.control.justification')}</span>
        <textarea name="justification" rows={5} maxLength={4000} defaultValue={justification} className="field leading-relaxed" placeholder={t(lang, 'grc.control.justHint')} />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.control.evidence')}</span>
        <textarea name="evidenceUrls" rows={3} defaultValue={evidenceUrls.join('\n')} className="field mono text-[12px] leading-relaxed" placeholder={t(lang, 'grc.control.evidenceHint')} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? t(lang, 'common.saving') : t(lang, 'common.save')}</button>
        {msg ? <span className={`text-[12px] ${msg.ok ? 'text-accent' : 'text-sev-critical'}`}>{msg.text}</span> : null}
      </div>
    </form>
  );
}
