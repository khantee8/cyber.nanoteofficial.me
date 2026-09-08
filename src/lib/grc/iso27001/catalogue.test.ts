import { describe, expect, it } from 'vitest';
import { CONTROL_BY_ID, ISO27001_CONTROLS, THEMES, compareControlId } from './catalogue';

describe('ISO 27001:2022 Annex A catalogue', () => {
  it('has exactly 93 controls with unique ids', () => {
    expect(ISO27001_CONTROLS).toHaveLength(93);
    expect(new Set(ISO27001_CONTROLS.map((c) => c.id)).size).toBe(93);
    for (const c of ISO27001_CONTROLS) expect(c.id).toMatch(/^[5-8]\.\d{1,2}$/);
  });
  it('has the four themes with the right counts', () => {
    const count = (t: string) => ISO27001_CONTROLS.filter((c) => c.theme === t).length;
    expect(count('organisational')).toBe(37);
    expect(count('people')).toBe(8);
    expect(count('physical')).toBe(14);
    expect(count('technological')).toBe(34);
    expect(THEMES.map((t) => t.key)).toEqual(['organisational', 'people', 'physical', 'technological']);
  });
  it('is bilingual and fully tagged', () => {
    for (const c of ISO27001_CONTROLS) {
      expect(c.title.en.length, c.id).toBeGreaterThan(3);
      expect(c.title.th.length, c.id).toBeGreaterThan(3);
      expect(c.summary.en.length, c.id).toBeGreaterThan(20);
      expect(c.summary.th.length, c.id).toBeGreaterThan(10);
      expect(c.type.length, c.id).toBeGreaterThan(0);
      expect(c.cia.length, c.id).toBeGreaterThan(0);
      expect(c.concept.length, c.id).toBeGreaterThan(0);
      expect(c.domains.length, c.id).toBeGreaterThan(0);
      for (const t of c.type) expect(['preventive', 'detective', 'corrective']).toContain(t);
      for (const x of c.cia) expect(['C', 'I', 'A']).toContain(x);
      for (const k of c.concept) expect(['identify', 'protect', 'detect', 'respond', 'recover']).toContain(k);
    }
  });
  it('sorts ids numerically and indexes by id', () => {
    expect(['5.10', '5.9', '8.1', '6.2'].sort(compareControlId)).toEqual(['5.9', '5.10', '6.2', '8.1']);
    expect(CONTROL_BY_ID['8.8'].title.en).toBe('Management of technical vulnerabilities');
  });
});
