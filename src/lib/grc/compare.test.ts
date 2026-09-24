import { describe, expect, it } from 'vitest';
import { compareCsf, compareIso } from './compare';
import type { StatusRow } from './iso27001/score';

const s = (controlId: string, status: StatusRow['status']): StatusRow => ({ controlId, status, justification: null, owner: null });

describe('compareIso', () => {
  it('classifies transitions and computes compliance for both sides', () => {
    const r = compareIso([s('5.1', 'partial'), s('5.2', 'implemented'), s('5.3', 'not_started'), s('5.4', 'implemented')],
                         [s('5.1', 'implemented'), s('5.2', 'partial'), s('5.3', 'not_applicable'), s('5.4', 'implemented')]);
    expect(r.transitions).toEqual([
      { controlId: '5.1', from: 'partial', to: 'implemented', direction: 'improved' },
      { controlId: '5.2', from: 'implemented', to: 'partial', direction: 'regressed' },
      { controlId: '5.3', from: 'not_started', to: 'not_applicable', direction: 'changed' },
    ]);
    expect(r.counts).toEqual({ improved: 1, regressed: 1, unchanged: 90 });
    expect(r.b.notApplicable).toBe(1);
    expect(r.byTheme.organisational.delta).toBeCloseTo(r.byTheme.organisational.b - r.byTheme.organisational.a);
  });
  it('treats a missing row as not_started', () => {
    const r = compareIso([], [s('8.1', 'implemented')]);
    expect(r.transitions[0]).toEqual({ controlId: '8.1', from: 'not_started', to: 'implemented', direction: 'improved' });
  });
});

describe('compareCsf', () => {
  const row = (subcategoryId: string, current: number | null, target: number | null, inScope = true) => ({ subcategoryId, current, target, inScope });
  it('finds closed, opened and changed gaps; skips unchanged and out-of-scope', () => {
    const r = compareCsf(
      [row('GV.OC-01', 3, 6), row('GV.OC-02', 6, 6), row('GV.OC-03', 2, 6), row('GV.OC-04', 4, 6), row('GV.OC-05', 1, 6, false)],
      [row('GV.OC-01', 6, 6), row('GV.OC-02', 5, 6), row('GV.OC-03', 4, 6), row('GV.OC-04', 4, 6), row('GV.OC-05', 1, 6, false)],
    );
    expect(r.changes).toEqual([
      { id: 'GV.OC-01', aGap: 3, bGap: 0, kind: 'closed' },
      { id: 'GV.OC-02', aGap: 0, bGap: 1, kind: 'opened' },
      { id: 'GV.OC-03', aGap: 4, bGap: 2, kind: 'changed' },
    ]);
    expect(r.byFunction.map((x) => x.fn)).toEqual(['GV', 'ID', 'PR', 'DE', 'RS', 'RC']);
    expect(r.byFunction[0].b.avgCurrent).not.toBeNull();
  });
});
