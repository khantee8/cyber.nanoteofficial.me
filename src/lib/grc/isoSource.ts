import type { Assessment } from '@/db/schema';

type SourceCandidate = Pick<Assessment, 'id' | 'framework' | 'fiscalYear' | 'updatedAt'>;

const newest = (rows: SourceCandidate[]): SourceCandidate =>
  rows.reduce((best, a) => (a.updatedAt > best.updatedAt ? a : best));

/**
 * The ISO 27001 assessment to pull ISO control statuses from for a given customer:
 * prefer the most recently updated ISO assessment that shares the target fiscal year,
 * else the most recently updated ISO assessment overall. `null` when the customer has
 * no ISO 27001 assessment at all.
 */
export function pickIsoSource(assessments: SourceCandidate[], fiscalYear: number | null): string | null {
  const iso = assessments.filter((a) => a.framework === 'iso27001');
  if (iso.length === 0) return null;
  const sameYear = fiscalYear !== null ? iso.filter((a) => a.fiscalYear === fiscalYear) : [];
  return newest(sameYear.length ? sameYear : iso).id;
}
