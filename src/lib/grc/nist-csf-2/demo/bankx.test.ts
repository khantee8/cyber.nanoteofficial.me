import { describe, expect, it } from 'vitest';
import { CSF_BY_ID, CSF_IDS, CSF_SUBCATEGORIES } from '../catalogue';
import { suggestCurrent } from '../score';
import { bankxRisks, bankxStatuses } from '../../iso27001/demo/bankx';
import { bankxCsfProfile, bankxCsfScores } from './bankx';

const valid = (n: number) => n >= 0 && n <= 10 && Number.isInteger(n * 2);

describe('BankX CSF demo', () => {
  it('covers every subcategory once', () => {
    expect(bankxCsfScores.map((s) => s.subcategoryId)).toEqual(CSF_SUBCATEGORIES.map((s) => s.id));
  });
  it('uses valid scores, owners, dates and methods', () => {
    for (const s of bankxCsfScores) {
      expect(valid(s.current) && valid(s.target), s.subcategoryId).toBe(true);
      expect(s.target, s.subcategoryId).toBeLessThan(8);
      expect(s.owner.length, s.subcategoryId).toBeGreaterThan(2);
      expect(s.notes.length, s.subcategoryId).toBeGreaterThan(10);
      if (s.testingStatus === 'complete') {
        expect(s.observedAt, s.subcategoryId).toMatch(/^2026-\d{2}-\d{2}$/);
        expect(s.examined || s.interviewed || s.tested, s.subcategoryId).toBe(true);
      }
    }
    expect(bankxCsfProfile).toMatchObject({ currentTier: 2, targetTier: 3 });
  });
  it('agrees with the ISO-derived suggestion within ±1', () => {
    for (const s of bankxCsfScores) {
      const { value } = suggestCurrent(CSF_BY_ID[s.subcategoryId].iso27001, bankxStatuses);
      if (value !== null) expect(Math.abs(s.current - value), `${s.subcategoryId}: ${s.current} vs ${value}`).toBeLessThanOrEqual(1);
    }
  });
  it('links 4–5 risks to real subcategories', () => {
    const linked = bankxRisks.filter((r) => (r.linkedCsfIds ?? []).length > 0);
    expect(linked.length).toBeGreaterThanOrEqual(4);
    expect(linked.length).toBeLessThanOrEqual(5);
    for (const r of linked) for (const id of r.linkedCsfIds!) expect(CSF_IDS.has(id), `${r.title} → ${id}`).toBe(true);
  });
});
