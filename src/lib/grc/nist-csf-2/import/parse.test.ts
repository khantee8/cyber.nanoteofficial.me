import { describe, expect, it } from 'vitest';
import { buildCatalogueData, parseCprt, parseIsoRefs } from './parse';

const el = (element_type: string, element_identifier: string, title: string, text: string) =>
  ({ doc_identifier: 'CSF_2_0_0', element_type, element_identifier, title, text });
const rel = (source_element_identifier: string, dest_element_identifier: string) =>
  ({ source_element_identifier, dest_element_identifier, relationship_identifier: 'projection' });

const cprt = {
  response: { elements: {
    documents: [{ doc_identifier: 'CSF_2_0_0' }],
    elements: [
      el('function', 'GV', 'GOVERN', 'Govern text'),
      el('function', 'ID', 'IDENTIFY', 'Identify text'),
      el('category', 'GV.OC', 'Organizational Context', 'OC text'),
      el('category', 'ID.BE', 'Business Environment', ''),
      el('subcategory', 'GV.OC-01', '', 'The organizational mission is understood'),
      el('subcategory', 'GV.OC-02', '', 'Stakeholders are understood'),
      el('subcategory', 'ID.AM-06', '', 'Withdrawn roles text'),
      el('implementation_example', 'GV.OC-01.002', 'Ex2', 'Second example'),
      el('implementation_example', 'GV.OC-01.001', 'Ex1', 'First example'),
      el('withdraw_reason', 'WR-ID.AM-06', '', 'Moved'),
    ],
    relationships: [rel('ID.AM-06', 'WR-ID.AM-06'), rel('ID.BE', 'WR-ID.BE')],
  } },
};

describe('parseCprt', () => {
  it('keeps active elements, drops withdrawn ones, orders examples', () => {
    const out = parseCprt(cprt);
    expect(out.functions.map((f) => f.id)).toEqual(['GV', 'ID']);
    expect(out.functions[0]).toEqual({ id: 'GV', title: 'Govern', text: 'Govern text' });
    expect(out.categories.map((c) => c.id)).toEqual(['GV.OC']);
    expect(out.subcategories.map((s) => s.id)).toEqual(['GV.OC-01', 'GV.OC-02']);
    expect(out.subcategories[0]).toMatchObject({ category: 'GV.OC', fn: 'GV', iso27001: [] });
    expect(out.subcategories[0].examples).toEqual([
      { id: 'GV.OC-01.001', text: 'First example' },
      { id: 'GV.OC-01.002', text: 'Second example' },
    ]);
    expect(out.subcategories[1].examples).toEqual([]);
  });
  it('throws on a shape mismatch', () => {
    expect(() => parseCprt({ response: {} })).toThrow(/shape/);
    expect(() => parseCprt(null)).toThrow(/shape/);
  });
});

describe('parseIsoRefs', () => {
  it('extracts Annex A ids per subcategory, ignores clauses, blanks and other rows', () => {
    const rows: [string | null, string | null][] = [
      [null, 'ISO/IEC 27001:2022: Annex A Controls: 5.1'],                 // function/category row
      ['GV.OC-01: The organizational mission is understood', 'ISO/IEC 27001:2022: Mandatory Clause:  4.1\nISO/IEC 27001:2022: Annex A Controls:\nNICE Framework: OG-WRL-002'],
      ['GV.OC-03: Legal requirements', 'ISO/IEC 27001:2022: Annex A Controls: 5.31\nISO/IEC 27001:2022: Annex A Controls: 5.20,\nISO/IEC 27001:2022: Annex A Controls: A.5.31\nSCF: CPL-01'],
      ['PR.AA-01: Identities', 'ISO/IEC 27001:2022: Annex A Controls: 5.16\nISO/IEC 27001:2022: Annex A Controls: 5.9'],
    ];
    expect(parseIsoRefs(rows)).toEqual({
      'GV.OC-01': [],
      'GV.OC-03': ['5.20', '5.31'],
      'PR.AA-01': ['5.9', '5.16'],
    });
  });
});

describe('buildCatalogueData', () => {
  it('attaches valid ISO ids and reports dropped ones', () => {
    const parsed = parseCprt(cprt);
    const src = { cprt: 'a', olir: 'b', generatedAt: '2026-09-23T00:00:00.000Z' };
    const { data, dropped } = buildCatalogueData(parsed, { 'GV.OC-01': ['5.1', '9.9'] }, new Set(['5.1']), src);
    expect(data.subcategories[0].iso27001).toEqual(['5.1']);
    expect(data.subcategories[1].iso27001).toEqual([]);
    expect(dropped).toEqual(['GV.OC-01→9.9']);
    expect(data.source).toEqual(src);
  });
});
