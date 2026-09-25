import Link from 'next/link';
import type { Assessment } from '@/db/schema';
import { assessmentBase } from '@/lib/grc/context';
import { frameworkBySlug } from '@/lib/grc/frameworks';
import { since } from '@/lib/grc/since';
import type { Lang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';

export interface AssessmentRow extends Pick<Assessment, 'id' | 'title' | 'framework' | 'fiscalYear' | 'status' | 'updatedAt'> {
  /** Pre-formatted key score: ISO compliance "62%", CSF "5.2 / 7.5"; null when nothing is scored yet. */
  score: string | null;
  /** Folder path, shown only when listing across folders. */
  folderLabel?: string | null;
}

const statusTone: Record<Assessment['status'], string> = {
  draft: 'border-line-strong text-muted',
  in_progress: 'border-accent/50 text-accent',
  complete: 'border-accent bg-accent-dim text-accent',
  archived: 'border-line text-muted-soft',
};

export default function AssessmentList({ rows, lang, now }: { rows: AssessmentRow[]; lang: Lang; now: Date }) {
  return (
    <ul className="panel divide-y divide-line">
      {rows.map((a) => {
        const fw = frameworkBySlug(a.framework);
        return (
          <li key={a.id} className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <Link href={assessmentBase(a.id)} className="break-words text-[14.5px] font-medium hover:text-accent">{a.title}</Link>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono rounded border border-accent/50 px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-accent">
                  {fw ? pick(fw.name, lang) : a.framework}
                </span>
                {a.fiscalYear !== null ? <span className="mono text-[12px] text-muted">FY{a.fiscalYear}</span> : null}
                <span className={`mono rounded border px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider ${statusTone[a.status]}`}>
                  {t(lang, `grc.assessment.status.${a.status}`)}
                </span>
                {a.folderLabel ? <span className="text-[12px] text-muted-soft">{a.folderLabel}</span> : null}
              </div>
            </div>
            <div className="mono flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12px] text-muted md:justify-end md:text-right">
              <span>
                <span className="text-muted-soft">{t(lang, 'grc.assessment.keyScore')} </span>
                <span className="text-fg">{a.score ?? '—'}</span>
              </span>
              <span>
                <span className="text-muted-soft">{t(lang, 'grc.assessment.updated')} </span>
                {since(a.updatedAt, now, lang)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
