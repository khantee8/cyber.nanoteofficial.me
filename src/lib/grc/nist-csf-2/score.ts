import type { ControlStatusValue } from '../types';
import { CSF_SUBCATEGORIES } from './catalogue';
import type { CsfScoreRow, FunctionRating } from './types';

// Re-export scale helpers for convenience
export { SCORE_STEPS, band, bandColor } from './scale';

export function gap(row: Pick<CsfScoreRow, 'current' | 'target'>): number | null {
  if (row.current === null || row.target === null) return null;
  return Math.max(0, row.target - row.current);
}

export function isAssessed(row: CsfScoreRow): boolean {
  return row.inScope && row.current !== null && row.target !== null;
}

export function rowsFor(rows: CsfScoreRow[], ids: string[]): CsfScoreRow[] {
  const m = new Map(rows.map((r) => [r.subcategoryId, r]));
  return ids.map((id) => m.get(id) ?? { subcategoryId: id, current: null, target: null, inScope: true });
}

export interface CsfSummary {
  inScope: number; assessed: number; coverage: number;
  avgCurrent: number | null; avgTarget: number | null; avgGap: number | null;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r2 = (n: number) => Math.round(n * 100) / 100;

export function summary(rows: CsfScoreRow[], ids: string[]): CsfSummary {
  const all = rowsFor(rows, ids);
  const inScope = all.filter((r) => r.inScope).length;
  const done = all.filter(isAssessed);
  if (done.length === 0) return { inScope, assessed: 0, coverage: 0, avgCurrent: null, avgTarget: null, avgGap: null };
  return {
    inScope,
    assessed: done.length,
    coverage: inScope ? done.length / inScope : 0,
    avgCurrent: r2(mean(done.map((r) => r.current!))),
    avgTarget: r2(mean(done.map((r) => r.target!))),
    avgGap: r2(mean(done.map((r) => gap(r)!))),
  };
}

export function functionRating(s: CsfSummary): FunctionRating | null {
  if (s.avgCurrent === null || s.avgTarget === null) return null;
  if (s.avgCurrent >= s.avgTarget) return 'satisfactory';
  if (s.avgCurrent >= 0.7 * s.avgTarget) return 'needs_improvement';
  return 'unsatisfactory';
}

export interface RankedGap { id: string; current: number; target: number; gap: number; riskScore: number }

export function rankGaps(rows: CsfScoreRow[], risks: { likelihood: number; impact: number; linkedCsfIds: string[] }[]): RankedGap[] {
  const out: RankedGap[] = [];
  for (const r of rows) {
    if (!isAssessed(r)) continue;
    const g = gap(r)!;
    if (g <= 0) continue;
    const riskScore = risks.filter((k) => k.linkedCsfIds.includes(r.subcategoryId))
      .reduce((m, k) => Math.max(m, k.likelihood * k.impact), 0);
    out.push({ id: r.subcategoryId, current: r.current!, target: r.target!, gap: g, riskScore });
  }
  return out.sort((a, b) => b.gap - a.gap || b.riskScore - a.riskScore || a.id.localeCompare(b.id));
}

/** Round to the nearest 0.5, halves up. */
export function roundHalf(n: number): number {
  return Math.floor(n * 2 + 0.5 + 1e-9) / 2;
}

/** Our weights, shown next to every suggestion — not an official NIST or ISO conversion. */
export const SUGGEST_WEIGHTS = { implemented: 5, partial: 3, not_started: 0 } as const;

export interface Suggestion {
  value: number | null;
  parts: { controlId: string; status: ControlStatusValue | null; weight: number | null }[];
}

export function suggestCurrent(iso27001: string[], statuses: { controlId: string; status: ControlStatusValue }[]): Suggestion {
  const m = new Map(statuses.map((s) => [s.controlId, s.status]));
  const parts = iso27001.map((controlId) => {
    const status = m.get(controlId) ?? null;
    const weight = status && status !== 'not_applicable' ? SUGGEST_WEIGHTS[status] : null;
    return { controlId, status, weight };
  });
  const weights = parts.map((p) => p.weight).filter((w): w is NonNullable<typeof w> => w !== null);
  return { value: weights.length ? roundHalf(mean(weights as number[])) : null, parts };
}

export function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Subcategories whose Current is empty and for which ISO statuses give a suggestion. */
export function prefillPlan(scores: CsfScoreRow[], statuses: { controlId: string; status: ControlStatusValue }[]) {
  const have = new Map(scores.map((s) => [s.subcategoryId, s]));
  const out: { subcategoryId: string; value: number }[] = [];
  for (const sub of CSF_SUBCATEGORIES) {
    if (have.get(sub.id)?.current != null) continue;
    const { value } = suggestCurrent(sub.iso27001, statuses);
    if (value !== null) out.push({ subcategoryId: sub.id, value });
  }
  return out;
}
