'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { saveRisk, type ActionResult } from '@/server/actions/grc';
import type { Risk } from '@/db/schema';
import { ISO27001_CONTROLS } from '@/lib/grc/iso27001/catalogue';
import { riskBand, riskScore, type Methodology } from '@/lib/grc/iso27001/score';
import { suggestControls } from '@/lib/grc/iso27001/suggest';
import { RISK_STATUSES, TREATMENTS } from '@/lib/grc/types';
import type { Lang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import { BandPill } from './StatusPill';

function Scale({ name, value, onChange, label }: { name: string; value: number; onChange: (n: number) => void; label: string }) {
  return (
    <fieldset className="flex flex-col gap-1 text-[13px]">
      <legend className="text-muted">{label}</legend>
      <div className="mono flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`grid h-9 w-9 cursor-pointer place-items-center rounded border text-[13px] ${value === n ? 'border-accent bg-accent-dim text-accent' : 'border-line text-muted hover:border-line-strong'}`}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function RiskForm({ risk, methodology, lang }: { risk: Risk | null; methodology: Methodology; lang: Lang }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveRisk, null);
  const [likelihood, setL] = useState(risk?.likelihood ?? 3);
  const [impact, setI] = useState(risk?.impact ?? 3);
  const [title, setTitle] = useState(risk?.title ?? '');
  const [description, setDescription] = useState(risk?.description ?? '');
  const [linked, setLinked] = useState<string[]>(risk?.linkedControlIds ?? []);
  const [text, setText] = useState(`${risk?.title ?? ''} ${risk?.description ?? ''}`);
  const [rl, setRl] = useState<string>(risk?.residualLikelihood?.toString() ?? '');
  const [ri, setRi] = useState<string>(risk?.residualImpact?.toString() ?? '');

  // Debounce suggestions so typing does not re-run the keyword scan per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setText(`${title} ${description}`), 300);
    return () => clearTimeout(id);
  }, [title, description]);
  const suggested = useMemo(() => suggestControls(text).filter((id) => !linked.includes(id)), [text, linked]);

  const score = riskScore(likelihood, impact);
  const band = riskBand(score, methodology);
  const residual = rl && ri ? Number(rl) * Number(ri) : null;

  return (
    <form action={action} className="flex flex-col gap-5">
      {risk ? <input type="hidden" name="id" value={risk.id} /> : null}
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.risk.title')}</span>
        <input name="title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className="field" />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.risk.description')}</span>
        <textarea name="description" rows={3} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} className="field leading-relaxed" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        {(['asset', 'threat', 'vulnerability'] as const).map((f) => (
          <label key={f} className="flex flex-col gap-1 text-[13px]">
            <span className="text-muted">{t(lang, `grc.risk.${f}`)}</span>
            <input name={f} maxLength={500} defaultValue={risk?.[f] ?? ''} className="field" />
          </label>
        ))}
      </div>

      <div className="panel flex flex-wrap items-end gap-6 p-4">
        <Scale name="likelihood" value={likelihood} onChange={setL} label={t(lang, 'grc.risk.likelihood')} />
        <Scale name="impact" value={impact} onChange={setI} label={t(lang, 'grc.risk.impact')} />
        <div className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.risk.score')}</span>
          <div className="flex h-9 items-center gap-2">
            <span className="mono text-[22px] font-semibold">{score}</span>
            <BandPill band={band} lang={lang} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.risk.treatment')}</span>
          <select name="treatment" defaultValue={risk?.treatment ?? 'mitigate'} className="field">
            {TREATMENTS.map((x) => <option key={x} value={x}>{t(lang, `grc.treatment.${x}`)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.risk.status')}</span>
          <select name="status" defaultValue={risk?.status ?? 'open'} className="field">
            {RISK_STATUSES.map((x) => <option key={x} value={x}>{t(lang, `grc.rstatus.${x}`)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.risk.owner')}</span>
          <input name="owner" maxLength={120} defaultValue={risk?.owner ?? ''} className="field" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.risk.treatmentPlan')}</span>
        <textarea name="treatmentPlan" rows={3} maxLength={4000} defaultValue={risk?.treatmentPlan ?? ''} className="field leading-relaxed" />
      </label>

      <div className="flex flex-col gap-2 text-[13px]">
        <span className="text-muted">{t(lang, 'grc.risk.linked')}</span>
        {linked.map((id) => <input key={id} type="hidden" name="linkedControlIds" value={id} />)}
        <div className="flex flex-wrap gap-1.5">
          {linked.map((id) => {
            const c = ISO27001_CONTROLS.find((x) => x.id === id);
            return (
              <button key={id} type="button" onClick={() => setLinked(linked.filter((x) => x !== id))}
                className="mono inline-flex items-center gap-1.5 rounded border border-accent/50 bg-accent-dim px-2 py-1 text-[11.5px] text-accent"
                title={c ? pick(c.title, lang) : id}>
                {id} <span className="max-w-[180px] truncate font-sans text-fg">{c ? pick(c.title, lang) : ''}</span> <span aria-hidden>×</span>
              </button>
            );
          })}
          {linked.length === 0 ? <span className="text-[12px] text-muted-soft">{t(lang, 'common.none')}</span> : null}
        </div>
        {suggested.length ? (
          <div className="mt-1">
            <p className="eyebrow mb-1.5">{t(lang, 'grc.risk.suggested')}</p>
            <div className="flex flex-wrap gap-1.5">
              {suggested.map((id) => {
                const c = ISO27001_CONTROLS.find((x) => x.id === id);
                return (
                  <button key={id} type="button" onClick={() => setLinked([...linked, id])}
                    className="mono inline-flex items-center gap-1.5 rounded border border-line px-2 py-1 text-[11.5px] text-muted hover:border-line-strong hover:text-fg">
                    + {id} <span className="max-w-[180px] truncate font-sans">{c ? pick(c.title, lang) : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <select
          aria-label={t(lang, 'grc.risk.linked')}
          value=""
          onChange={(e) => { if (e.target.value && !linked.includes(e.target.value)) setLinked([...linked, e.target.value]); }}
          className="field mt-1 max-w-md text-[12.5px]"
        >
          <option value="">+ …</option>
          {ISO27001_CONTROLS.filter((c) => !linked.includes(c.id)).map((c) => (
            <option key={c.id} value={c.id}>{c.id} {pick(c.title, lang)}</option>
          ))}
        </select>
      </div>

      <div className="panel flex flex-wrap items-end gap-6 p-4">
        <div className="w-full text-[13px] text-muted">{t(lang, 'grc.risk.residual')} <span className="text-muted-soft">— {t(lang, 'grc.risk.residualHint')}</span></div>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.risk.likelihood')}</span>
          <select name="residualLikelihood" value={rl} onChange={(e) => setRl(e.target.value)} className="field w-24">
            <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="text-muted">{t(lang, 'grc.risk.impact')}</span>
          <select name="residualImpact" value={ri} onChange={(e) => setRi(e.target.value)} className="field w-24">
            <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {residual !== null ? (
          <div className="flex h-10 items-center gap-2">
            <span className="mono text-[20px] font-semibold">{residual}</span>
            <BandPill band={riskBand(residual, methodology)} lang={lang} />
            <span className={`text-[12px] ${residual <= methodology.acceptMax ? 'text-accent' : 'text-sev-high'}`}>
              {t(lang, residual <= methodology.acceptMax ? 'grc.risk.acceptable' : 'grc.risk.aboveAccept')}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? t(lang, 'common.saving') : t(lang, 'grc.risk.save')}</button>
        {state && !state.ok ? <span className="text-[12px] text-sev-critical">{state.message}</span> : null}
      </div>
    </form>
  );
}
