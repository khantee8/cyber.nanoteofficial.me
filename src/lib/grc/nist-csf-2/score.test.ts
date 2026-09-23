import { describe, expect, it } from 'vitest';
import { SCORE_STEPS, band, functionRating, gap, prefillPlan, rankGaps, roundHalf, rowsFor, suggestCurrent, summary } from './score';
import { CSF_SUBCATEGORIES } from './catalogue';
import type { CsfScoreRow } from './types';

const row = (subcategoryId: string, current: number | null, target: number | null, inScope = true): CsfScoreRow =>
  ({ subcategoryId, current, target, inScope });

describe('scale', () => {
  it('has 21 half steps from 0 to 10', () => {
    expect(SCORE_STEPS).toHaveLength(21);
    expect(SCORE_STEPS[0]).toBe(0); expect(SCORE_STEPS[20]).toBe(10); expect(SCORE_STEPS[9]).toBe(4.5);
  });
  it('puts boundary scores in the band that starts there', () => {
    expect(band(0)).toBe('insecure'); expect(band(1.5)).toBe('insecure');
    expect(band(2)).toBe('some'); expect(band(4.5)).toBe('some');
    expect(band(5)).toBe('minimal'); expect(band(5.5)).toBe('minimal');
    expect(band(6)).toBe('effective'); expect(band(7)).toBe('optimised'); expect(band(7.5)).toBe('optimised');
    expect(band(8)).toBe('excessive'); expect(band(10)).toBe('excessive');
  });
});

describe('gap and summary', () => {
  it('gap is target − current, floored at 0, null unless both set', () => {
    expect(gap({ current: 3, target: 6 })).toBe(3);
    expect(gap({ current: 7, target: 6 })).toBe(0);
    expect(gap({ current: null, target: 6 })).toBeNull();
  });
  it('fills missing rows with unscored in-scope defaults', () => {
    expect(rowsFor([row('A', 1, 2)], ['A', 'B'])).toEqual([row('A', 1, 2), row('B', null, null)]);
  });
  it('averages only assessed in-scope rows and reports coverage', () => {
    const rows = [row('A', 2, 6), row('B', 4, 6), row('C', null, 6), row('D', 1, 9, false)];
    expect(summary(rows, ['A', 'B', 'C', 'D', 'E'])).toEqual({
      inScope: 4, assessed: 2, coverage: 0.5, avgCurrent: 3, avgTarget: 6, avgGap: 3,
    });
  });
  it('returns null averages when nothing is assessed', () => {
    expect(summary([], ['A'])).toEqual({ inScope: 1, assessed: 0, coverage: 0, avgCurrent: null, avgTarget: null, avgGap: null });
    expect(summary([row('A', null, null, false)], ['A']).coverage).toBe(0);
  });
});

describe('functionRating', () => {
  const s = (avgCurrent: number, avgTarget: number) => ({ inScope: 1, assessed: 1, coverage: 1, avgCurrent, avgTarget, avgGap: 0 });
  it('uses ≥ target and ≥ 70 % of target boundaries', () => {
    expect(functionRating(s(6, 6))).toBe('satisfactory');
    expect(functionRating(s(4.2, 6))).toBe('needs_improvement');
    expect(functionRating(s(4.1, 6))).toBe('unsatisfactory');
    expect(functionRating({ inScope: 1, assessed: 0, coverage: 0, avgCurrent: null, avgTarget: null, avgGap: null })).toBeNull();
  });
});

describe('rankGaps', () => {
  it('orders by gap, then by highest linked risk, then id; skips zero gaps', () => {
    const rows = [row('A', 2, 6), row('B', 3, 7), row('C', 1, 3), row('D', 6, 6), row('E', null, 6)];
    const risks = [{ likelihood: 5, impact: 4, linkedCsfIds: ['B'] }, { likelihood: 2, impact: 2, linkedCsfIds: ['A', 'B'] }];
    expect(rankGaps(rows, risks).map((g) => [g.id, g.gap, g.riskScore])).toEqual([['B', 4, 20], ['A', 4, 4], ['C', 2, 0]]);
  });
});

describe('suggestCurrent', () => {
  const st = (controlId: string, status: 'implemented' | 'partial' | 'not_started' | 'not_applicable') => ({ controlId, status });
  it('all implemented → 5', () => {
    expect(suggestCurrent(['5.1', '5.2'], [st('5.1', 'implemented'), st('5.2', 'implemented')]).value).toBe(5);
  });
  it('mixed statuses round to the nearest half, half up', () => {
    expect(suggestCurrent(['5.1', '5.2', '5.3'], [st('5.1', 'implemented'), st('5.2', 'partial'), st('5.3', 'not_started')]).value).toBe(2.5); // 8/3 = 2.67
    expect(suggestCurrent(['5.1', '5.2'], [st('5.1', 'partial'), st('5.2', 'not_started')]).value).toBe(1.5);           // 1.5
    expect(roundHalf(2.25)).toBe(2.5); expect(roundHalf(2.24)).toBe(2);
  });
  it('skips not applicable and unassessed controls; null when nothing remains', () => {
    const s = suggestCurrent(['5.1', '5.2', '5.3'], [st('5.1', 'not_applicable'), st('5.2', 'implemented')]);
    expect(s.value).toBe(5);
    expect(s.parts).toEqual([
      { controlId: '5.1', status: 'not_applicable', weight: null },
      { controlId: '5.2', status: 'implemented', weight: 5 },
      { controlId: '5.3', status: null, weight: null },
    ]);
    expect(suggestCurrent(['5.1'], [st('5.1', 'not_applicable')]).value).toBeNull();
    expect(suggestCurrent(['5.1'], []).value).toBeNull();
    expect(suggestCurrent([], []).value).toBeNull();
  });
});

describe('prefillPlan', () => {
  it('fills only empty Current values that have a suggestion', () => {
    const withIso = CSF_SUBCATEGORIES.filter((s) => s.iso27001.length > 0);
    const [a, b] = withIso;
    const statuses = [...a.iso27001, ...b.iso27001].map((controlId) => ({ controlId, status: 'implemented' as const }));
    const plan = prefillPlan([{ subcategoryId: a.id, current: 2, target: 6, inScope: true }], statuses);
    expect(plan.find((p) => p.subcategoryId === a.id)).toBeUndefined();
    expect(plan.find((p) => p.subcategoryId === b.id)).toEqual({ subcategoryId: b.id, value: 5 });
    expect(prefillPlan([], [])).toEqual([]);
  });
});
