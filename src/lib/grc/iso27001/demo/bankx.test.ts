import { describe, expect, it } from 'vitest';
import { CONTROL_BY_ID, ISO27001_CONTROLS } from '../catalogue';
import { bankxRisks, bankxStatuses } from './bankx';

describe('BankX demo dataset', () => {
  it('covers every control exactly once with a known id', () => {
    expect(bankxStatuses).toHaveLength(ISO27001_CONTROLS.length);
    expect(new Set(bankxStatuses.map((s) => s.controlId)).size).toBe(ISO27001_CONTROLS.length);
    for (const s of bankxStatuses) expect(CONTROL_BY_ID[s.controlId], s.controlId).toBeDefined();
  });
  it('justifies every not-applicable control and gives every control an owner', () => {
    for (const s of bankxStatuses) {
      expect(s.owner.length, s.controlId).toBeGreaterThan(2);
      if (s.status === 'not_applicable') expect(s.justification?.length ?? 0, s.controlId).toBeGreaterThan(20);
      for (const u of s.evidenceUrls ?? []) expect(u).toMatch(/^https:\/\//);
    }
  });
  it('links risks only to known controls with valid scores', () => {
    for (const r of bankxRisks) {
      expect(r.likelihood).toBeGreaterThanOrEqual(1); expect(r.likelihood).toBeLessThanOrEqual(5);
      expect(r.impact).toBeGreaterThanOrEqual(1); expect(r.impact).toBeLessThanOrEqual(5);
      for (const id of r.linkedControlIds) expect(CONTROL_BY_ID[id], `${r.title} → ${id}`).toBeDefined();
      if (r.residualLikelihood !== undefined) expect(r.residualLikelihood * (r.residualImpact ?? 0)).toBeLessThanOrEqual(r.likelihood * r.impact);
    }
  });
});
