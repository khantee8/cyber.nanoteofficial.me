import type { ReactNode } from 'react';
import { loadCustomer } from '@/lib/grc/context';
import { getCsfScores, getStatuses, listAssessments, toScoreRows } from '@/lib/grc/queries';
import { compareCsf, compareIso } from '@/lib/grc/compare';
import { byChronologyDesc } from '@/lib/grc/order';
import { frameworkBySlug, frameworks } from '@/lib/grc/frameworks';
import type { Assessment } from '@/db/schema';
import { pick, t } from '@/lib/i18n';
import CompareIso from '@/components/grc/CompareIso';
import CompareCsf from '@/components/grc/CompareCsf';

export const metadata = { title: 'Compare assessments' };

function optionLabel(a: Assessment): string {
  return a.fiscalYear !== null ? `${a.title} (FY${a.fiscalYear})` : a.title;
}

/**
 * The other id in `group` (chronological, newest-first) adjacent to `id` — newer by default
 * (`preferOlder` false, used to fill `b` from a given `a`), older when `preferOlder` is true
 * (used to fill `a` from a given `b`). Falls back to the other neighbour when `id` is already at
 * that end of the list, and to `undefined` when `group` has fewer than two assessments — the
 * caller then leaves the pair incomplete rather than forcing a cross-framework guess.
 */
function adjacent(group: Assessment[], id: string, preferOlder: boolean): string | undefined {
  if (group.length < 2) return undefined;
  const idx = group.findIndex((x) => x.id === id);
  if (idx === -1) return undefined;
  const otherIdx = preferOlder
    ? (idx < group.length - 1 ? idx + 1 : idx - 1)
    : (idx > 0 ? idx - 1 : idx + 1);
  return group[otherIdx]?.id;
}

/**
 * Year-over-year comparison. Both `a` and `b` are resolved strictly against this customer's own
 * assessments (`listAssessments(customer.id)`) — an id for another customer's assessment simply
 * won't be found here, which is what keeps a forged query param from crossing customers. A
 * framework mismatch (or an unresolved id) shows `grc.compare.sameFramework` instead of crashing.
 *
 * Ordering is fiscal-year chronology (`byChronologyDesc`), the same "later" a reader means by
 * FY2027 vs FY2026 — not `updatedAt`, which would make an older assessment someone just edited
 * look like the "later" side.
 */
export default async function ComparePage({ params, searchParams }: PageProps<'/grc/c/[customerId]/compare'>) {
  const [{ customerId }, sp] = await Promise.all([params, searchParams]);
  const { lang, customer } = await loadCustomer(customerId);
  const assessments = [...await listAssessments(customer.id)].sort(byChronologyDesc);

  const byFramework = new Map<string, Assessment[]>();
  for (const a of assessments) {
    const arr = byFramework.get(a.framework);
    if (arr) arr.push(a);
    else byFramework.set(a.framework, [a]);
  }

  const rawA = typeof sp.a === 'string' ? sp.a : undefined;
  const rawB = typeof sp.b === 'string' ? sp.b : undefined;

  let aId = rawA;
  let bId = rawB;
  if (!rawA && !rawB) {
    // Default: the two most recent assessments of the framework with the most assessments (needs >= 2).
    let bestCount = 1;
    for (const fw of frameworks) {
      const arr = byFramework.get(fw.slug);
      if (arr && arr.length > bestCount) {
        bestCount = arr.length;
        aId = arr[1].id; // earlier
        bId = arr[0].id; // later
      }
    }
  } else if (rawA && !rawB) {
    const a = assessments.find((x) => x.id === rawA);
    bId = a ? adjacent(byFramework.get(a.framework) ?? [], rawA, false) : undefined;
  } else if (!rawA && rawB) {
    const b = assessments.find((x) => x.id === rawB);
    aId = b ? adjacent(byFramework.get(b.framework) ?? [], rawB, true) : undefined;
  }

  const aAssessment = aId ? (assessments.find((x) => x.id === aId) ?? null) : null;
  const bAssessment = bId ? (assessments.find((x) => x.id === bId) ?? null) : null;
  const picked = Boolean(aId && bId);
  const valid = Boolean(aAssessment && bAssessment && aAssessment.id !== bAssessment.id && aAssessment.framework === bAssessment.framework);

  // Frameworks present among this customer's assessments, in catalogue order (unknown ones last).
  const present = [...byFramework.keys()];
  const known: string[] = frameworks.map((f) => f.slug).filter((slug) => present.includes(slug));
  const ordered = [...known, ...present.filter((slug) => !known.includes(slug))];

  let body: ReactNode = null;
  if (valid && aAssessment && bAssessment) {
    const aLabel = optionLabel(aAssessment);
    const bLabel = optionLabel(bAssessment);
    if (aAssessment.framework === 'iso27001') {
      const [aRows, bRows] = await Promise.all([getStatuses(aAssessment.id), getStatuses(bAssessment.id)]);
      body = <CompareIso lang={lang} aLabel={aLabel} bLabel={bLabel} ic={compareIso(aRows, bRows)} />;
    } else if (aAssessment.framework === 'nist-csf-2') {
      const [aScores, bScores] = await Promise.all([getCsfScores(aAssessment.id), getCsfScores(bAssessment.id)]);
      body = <CompareCsf lang={lang} aLabel={aLabel} bLabel={bLabel} cc={compareCsf(toScoreRows(aScores), toScoreRows(bScores))} />;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">{t(lang, 'grc.compare.title')}</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{t(lang, 'grc.compare.lede')}</p>
      </div>

      {assessments.length < 2 ? (
        <div className="panel px-4 py-12 text-center text-[13px] text-muted">{t(lang, 'grc.compare.needTwo')}</div>
      ) : (
        <>
          <form method="get" className="panel flex flex-wrap items-end gap-4 p-4">
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-[13px]">
              <span className="text-muted">{t(lang, 'grc.compare.pickA')}</span>
              <select name="a" defaultValue={aId ?? ''} className="field">
                <option value="" disabled>—</option>
                {ordered.map((slug) => (
                  <optgroup key={slug} label={frameworkBySlug(slug) ? pick(frameworkBySlug(slug)!.name, lang) : slug}>
                    {byFramework.get(slug)!.map((a) => <option key={a.id} value={a.id}>{optionLabel(a)}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-[13px]">
              <span className="text-muted">{t(lang, 'grc.compare.pickB')}</span>
              <select name="b" defaultValue={bId ?? ''} className="field">
                <option value="" disabled>—</option>
                {ordered.map((slug) => (
                  <optgroup key={slug} label={frameworkBySlug(slug) ? pick(frameworkBySlug(slug)!.name, lang) : slug}>
                    {byFramework.get(slug)!.map((a) => <option key={a.id} value={a.id}>{optionLabel(a)}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary h-9 min-h-0 text-[13px]">{t(lang, 'grc.compare.go')}</button>
          </form>

          {picked && !valid ? (
            <div className="panel px-4 py-8 text-center text-[13px] text-sev-high">{t(lang, 'grc.compare.sameFramework')}</div>
          ) : null}

          {body}
        </>
      )}
    </div>
  );
}
