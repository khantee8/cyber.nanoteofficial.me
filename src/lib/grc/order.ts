/**
 * Newest-first chronology for an assessment: fiscal year descending, then created-at
 * descending. This is "which assessment is later" for the purposes of a customer's
 * assessment list and the year-over-year comparison defaults — not `updatedAt`, which
 * reflects whoever last touched a row and can make an older fiscal year look "later"
 * just because someone edited it more recently.
 */
export function byChronologyDesc<T extends { fiscalYear: number | null; createdAt: Date }>(a: T, b: T): number {
  return (b.fiscalYear ?? -Infinity) - (a.fiscalYear ?? -Infinity) || b.createdAt.getTime() - a.createdAt.getTime();
}
