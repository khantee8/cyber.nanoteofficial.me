'use client';

import { useState, useTransition } from 'react';
import { saveCsfScore } from '@/server/actions/csf';
import type { CsfScore } from '@/db/schema';
import { SCORE_STEPS, band } from '@/lib/grc/nist-csf-2/scale';
import { TESTING_STATUSES } from '@/lib/grc/nist-csf-2/types';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

const ANCHOR = ['csf.anchor.0', 'csf.anchor.1', 'csf.anchor.2', 'csf.anchor.3', 'csf.anchor.4', 'csf.anchor.5',
  'csf.anchor.6', 'csf.anchor.7', 'csf.anchor.8', 'csf.anchor.9', 'csf.anchor.10'] as const;

function ScoreField({ name, label, value, onChange, lang }: { name: string; label: string; value: string; onChange: (v: string) => void; lang: Lang }) {
  const n = value === '' ? null : Number(value);
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      <span className="text-muted">{label}</span>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value)} className="field mono">
        <option value="">—</option>
        {SCORE_STEPS.map((s) => <option key={s} value={s}>{s.toFixed(1)}</option>)}
      </select>
      <span className="min-h-[2.5em] text-[11.5px] leading-snug text-muted-soft">
        {n === null ? '' : `${t(lang, `csf.band.${band(n)}`)} · ${t(lang, ANCHOR[Math.floor(n)])}`}
      </span>
    </label>
  );
}

type SaveMsg = { ok: boolean; text: string } | null;

/**
 * The actual <form>. Keyed by the caller on the saved row's identity so it
 * remounts (and re-seeds its local state) when the row changes from outside
 * this form — e.g. SuggestionPanel's "accept" writing a new `current`. That
 * remount must never carry the save confirmation, so status is reported
 * upward via `onResult` instead of being held here — see CsfScoreForm below.
 */
function Fields({ assessmentId, subcategoryId, initial, lang, onResult }: {
  assessmentId: string; subcategoryId: string; initial: CsfScore | null; lang: Lang; onResult: (msg: SaveMsg) => void;
}) {
  const [current, setCurrent] = useState(initial?.current == null ? '' : String(initial.current));
  const [target, setTarget] = useState(initial?.target == null ? '' : String(initial.target));
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onResult(null);
        start(async () => {
          const res = await saveCsfScore({
            assessmentId,
            subcategoryId,
            current, target,
            inScope: fd.get('inScope') === 'on',
            owner: String(fd.get('owner') ?? ''),
            testingStatus: String(fd.get('testingStatus')),
            examined: fd.get('examined') === 'on',
            interviewed: fd.get('interviewed') === 'on',
            tested: fd.get('tested') === 'on',
            observedAt: String(fd.get('observedAt') ?? ''),
            notes: String(fd.get('notes') ?? ''),
            evidenceUrls: String(fd.get('evidenceUrls') ?? ''),
          });
          onResult(res.ok ? { ok: true, text: t(lang, 'common.saved') } : { ok: false, text: res.message ?? t(lang, 'common.error') });
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScoreField name="current" label={t(lang, 'csf.current')} value={current} onChange={setCurrent} lang={lang} />
        <ScoreField name="target" label={t(lang, 'csf.target')} value={target} onChange={setTarget} lang={lang} />
      </div>
      <p className="text-[11.5px] text-muted-soft">{t(lang, 'csf.scale.note')}</p>
      <label className="inline-flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="inScope" defaultChecked={initial?.inScope ?? true} /> {t(lang, 'csf.inScope')}
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.controls.owner')}</span>
          <input name="owner" maxLength={120} defaultValue={initial?.owner ?? ''} className="field" />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'csf.testing')}</span>
          <select name="testingStatus" defaultValue={initial?.testingStatus ?? 'not_started'} className="field">
            {TESTING_STATUSES.map((s) => <option key={s} value={s}>{t(lang, `csf.testing.${s}`)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'csf.observedAt')}</span>
          <input type="date" name="observedAt" defaultValue={initial?.observedAt ?? ''} className="field mono" />
        </label>
      </div>
      <fieldset className="flex flex-wrap items-center gap-4 text-[13px]">
        <legend className="mb-1 text-muted">{t(lang, 'csf.methods')}</legend>
        {(['examined', 'interviewed', 'tested'] as const).map((m) => (
          <label key={m} className="inline-flex items-center gap-2">
            <input type="checkbox" name={m} defaultChecked={initial?.[m] ?? false} /> {t(lang, `csf.method.${m}`)}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'csf.notes')}</span>
        <textarea name="notes" rows={4} maxLength={4000} defaultValue={initial?.notes ?? ''} className="field leading-relaxed" />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.control.evidence')}</span>
        <textarea name="evidenceUrls" rows={3} defaultValue={(initial?.evidenceUrls ?? []).join('\n')} className="field mono text-[12px] leading-relaxed" placeholder={t(lang, 'grc.control.evidenceHint')} />
      </label>
      <button type="submit" disabled={pending} className="btn btn-primary self-start">{pending ? t(lang, 'common.saving') : t(lang, 'common.save')}</button>
    </form>
  );
}

export default function CsfScoreForm({ assessmentId, subcategoryId, initial, lang }: { assessmentId: string; subcategoryId: string; initial: CsfScore | null; lang: Lang }) {
  const [msg, setMsg] = useState<SaveMsg>(null);
  return (
    <div className="flex flex-col gap-3">
      <Fields key={String(initial?.updatedAt ?? '')} assessmentId={assessmentId} subcategoryId={subcategoryId} initial={initial} lang={lang} onResult={setMsg} />
      {msg ? <span className={`text-[12px] ${msg.ok ? 'text-accent' : 'text-sev-critical'}`}>{msg.text}</span> : null}
    </div>
  );
}
