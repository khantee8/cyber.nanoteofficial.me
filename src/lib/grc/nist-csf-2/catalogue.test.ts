import { describe, expect, it } from 'vitest';
import { CONTROL_BY_ID } from '../iso27001/catalogue';
import { CSF_BY_ID, CSF_CATEGORIES, CSF_FUNCTIONS, CSF_SUBCATEGORIES } from './catalogue';

const perFunction = { GV: 31, ID: 21, PR: 22, DE: 11, RS: 13, RC: 8 };
const catsPerFunction = { GV: 6, ID: 3, PR: 5, DE: 2, RS: 4, RC: 2 };

describe('CSF 2.0 catalogue', () => {
  it('has 6 functions, 22 categories, 106 subcategories and 363 examples', () => {
    expect(CSF_FUNCTIONS.map((f) => f.id)).toEqual(['GV', 'ID', 'PR', 'DE', 'RS', 'RC']);
    expect(CSF_CATEGORIES).toHaveLength(22);
    expect(CSF_SUBCATEGORIES).toHaveLength(106);
    expect(CSF_SUBCATEGORIES.reduce((n, s) => n + s.examples.length, 0)).toBe(363);
  });
  it('matches the per-function counts', () => {
    for (const [fn, n] of Object.entries(perFunction)) expect(CSF_SUBCATEGORIES.filter((s) => s.fn === fn), fn).toHaveLength(n);
    for (const [fn, n] of Object.entries(catsPerFunction)) expect(CSF_CATEGORIES.filter((c) => c.fn === fn), fn).toHaveLength(n);
  });
  it('has unique, well-formed ids consistent with their parents', () => {
    expect(new Set(CSF_SUBCATEGORIES.map((s) => s.id)).size).toBe(106);
    const cats = new Set(CSF_CATEGORIES.map((c) => c.id));
    for (const s of CSF_SUBCATEGORIES) {
      expect(s.id).toMatch(/^[A-Z]{2}\.[A-Z]{2}-\d{2}$/);
      expect(s.id.startsWith(s.category + '-'), s.id).toBe(true);
      expect(s.category.startsWith(s.fn + '.'), s.id).toBe(true);
      expect(cats.has(s.category), s.id).toBe(true);
      expect(CSF_BY_ID[s.id]).toBe(s);
    }
  });
  it('is bilingual everywhere', () => {
    for (const f of CSF_FUNCTIONS) { expect(f.name.en && f.name.th, f.id).toBeTruthy(); expect(f.text.en && f.text.th, f.id).toBeTruthy(); }
    for (const c of CSF_CATEGORIES) { expect(c.name.en && c.name.th, c.id).toBeTruthy(); if (c.text.en) expect(c.text.th, c.id).toBeTruthy(); }
    for (const s of CSF_SUBCATEGORIES) {
      expect(s.text.en && s.text.th, s.id).toBeTruthy();
      for (const e of s.examples) expect(e.text.en && e.text.th, e.id).toBeTruthy();
    }
  });
  it('maps only to Annex A controls that exist, for at least 90 subcategories', () => {
    for (const s of CSF_SUBCATEGORIES) for (const id of s.iso27001) expect(CONTROL_BY_ID[id], `${s.id}→${id}`).toBeDefined();
    expect(CSF_SUBCATEGORIES.filter((s) => s.iso27001.length > 0).length).toBeGreaterThanOrEqual(90);
  });
});
