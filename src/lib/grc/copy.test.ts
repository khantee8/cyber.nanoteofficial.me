import { describe, expect, it } from 'vitest';
import { planCsfCopy, planIsoCopy } from './copy';

describe('planIsoCopy', () => {
  it('copies every field into new objects', () => {
    const src = [{ controlId: '5.1', status: 'partial' as const, justification: 'j', owner: 'CISO', evidenceUrls: ['https://x'] }];
    const out = planIsoCopy(src);
    expect(out).toEqual(src);
    expect(out[0]).not.toBe(src[0]);
    expect(out[0].evidenceUrls).not.toBe(src[0].evidenceUrls);
  });
});

describe('planCsfCopy', () => {
  it('keeps scores, scope, owner, notes and evidence; resets fieldwork', () => {
    const [r] = planCsfCopy([{ subcategoryId: 'GV.OC-01', current: 4, target: 6, inScope: false, owner: 'CISO', notes: 'n', evidenceUrls: ['https://e'],
      testingStatus: 'complete', examined: true, interviewed: true, tested: true, observedAt: '2026-08-01' }]);
    expect(r).toEqual({ subcategoryId: 'GV.OC-01', current: 4, target: 6, inScope: false, owner: 'CISO', notes: 'n', evidenceUrls: ['https://e'],
      testingStatus: 'not_started', examined: false, interviewed: false, tested: false, observedAt: null });
  });
});
