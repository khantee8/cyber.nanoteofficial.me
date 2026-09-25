'use client';

import { useActionState, useState } from 'react';
import { createAssessment, type ActionResult } from '@/server/actions/grc';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

export interface FrameworkOption { slug: string; name: string }
/** Existing assessments of this customer, newest first. */
export interface SourceOption { id: string; title: string; framework: string }

const autoTitle = (fw: FrameworkOption | undefined, year: string) => (fw ? `${fw.name} — FY${year}` : '');

/**
 * Framework, title, fiscal year, folder, and Start = Blank | From <a previous assessment of the
 * same framework>, defaulting to the newest one. The title is re-prefilled when framework or
 * year change, until the user edits it. `createAssessment` redirects to the new assessment.
 */
export default function NewAssessmentForm({ customerId, frameworks, folders, defaultFolderId, sources, defaultYear, lang }: {
  customerId: string; frameworks: FrameworkOption[]; folders: { id: string; label: string }[];
  defaultFolderId: string | null; sources: SourceOption[]; defaultYear: number; lang: Lang;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createAssessment, null);
  const firstFrom = (slug: string) => sources.find((s) => s.framework === slug)?.id ?? '';
  const [framework, setFramework] = useState(frameworks[0]?.slug ?? '');
  const [year, setYear] = useState(String(defaultYear));
  const [title, setTitle] = useState(autoTitle(frameworks[0], String(defaultYear)));
  const [touched, setTouched] = useState(false);
  const [basedOn, setBasedOn] = useState(firstFrom(frameworks[0]?.slug ?? ''));
  const fwOf = (slug: string) => frameworks.find((f) => f.slug === slug);
  const candidates = sources.filter((s) => s.framework === framework);
  const label = 'flex flex-col gap-1 text-[13px]';

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.assessment.framework')}</span>
          <select name="framework" value={framework} className="field"
            onChange={(e) => {
              const next = e.target.value;
              setFramework(next);
              setBasedOn(firstFrom(next));
              if (!touched) setTitle(autoTitle(fwOf(next), year));
            }}>
            {frameworks.map((f) => <option key={f.slug} value={f.slug}>{f.name}</option>)}
          </select>
        </label>
        <label className={label}>
          <span className="text-muted">{t(lang, 'grc.assessment.fiscalYear')}</span>
          <input name="fiscalYear" type="number" min={1990} max={2100} value={year} className="field mono"
            onChange={(e) => {
              setYear(e.target.value);
              if (!touched) setTitle(autoTitle(fwOf(framework), e.target.value));
            }} />
        </label>
      </div>
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.assessment.title')}</span>
        <input name="title" required maxLength={200} value={title} className="field"
          onChange={(e) => { setTitle(e.target.value); setTouched(true); }} />
      </label>
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.assessment.folder')}</span>
        <select name="folderId" defaultValue={defaultFolderId ?? ''} className="field">
          <option value="">{t(lang, 'grc.folders.root')}</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </label>
      <fieldset className="flex flex-col gap-2 text-[13px]">
        <legend className="mb-1 text-muted">{t(lang, 'grc.assessment.start')}</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="basedOnId" value="" checked={basedOn === ''} onChange={() => setBasedOn('')} />
          {t(lang, 'grc.assessment.blank')}
        </label>
        {candidates.map((s) => (
          <label key={s.id} className="flex min-w-0 items-center gap-2">
            <input type="radio" name="basedOnId" value={s.id} checked={basedOn === s.id} onChange={() => setBasedOn(s.id)} />
            <span className="min-w-0 break-words">{t(lang, 'grc.assessment.from', { title: s.title })}</span>
          </label>
        ))}
      </fieldset>
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.assessment.scope')}</span>
        <textarea name="scope" rows={3} maxLength={2000} className="field leading-relaxed" />
      </label>
      <label className={label}>
        <span className="text-muted">{t(lang, 'grc.assessment.lead')}</span>
        <input name="lead" maxLength={120} className="field" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? t(lang, 'common.saving') : t(lang, 'grc.assessment.create')}</button>
        {state && !state.ok ? <span className="text-[12px] text-sev-critical">{state.message}</span> : null}
      </div>
    </form>
  );
}
