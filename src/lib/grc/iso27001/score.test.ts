import { describe, expect, it } from 'vitest';
import { ISO27001_CONTROLS } from './catalogue';
import { DEFAULT_METHODOLOGY, buildSoa, compliance, complianceByTheme, heatmap, riskBand, soaCsv, type StatusRow } from './score';
import { suggestControls } from './suggest';

const row = (controlId: string, status: StatusRow['status'], justification: string | null = null): StatusRow =>
  ({ controlId, status, justification, owner: null });

describe('compliance', () => {
  it('is zero with no rows', () => {
    const c = compliance([], ISO27001_CONTROLS);
    expect(c).toMatchObject({ total: 93, applicable: 93, notStarted: 93, implemented: 0, pct: 0 });
  });
  it('is 1 when everything is implemented', () => {
    const rows = ISO27001_CONTROLS.map((c) => row(c.id, 'implemented'));
    expect(compliance(rows, ISO27001_CONTROLS).pct).toBe(1);
  });
  it('weights partial at half and excludes not-applicable', () => {
    const rows = [row('5.1', 'implemented'), row('5.2', 'partial'), row('5.3', 'not_applicable', 'n/a')];
    const c = compliance(rows, ISO27001_CONTROLS);
    expect(c.applicable).toBe(92);
    expect(c.pct).toBeCloseTo(1.5 / 92, 6);
    expect(complianceByTheme(rows, ISO27001_CONTROLS).organisational.applicable).toBe(36);
    expect(complianceByTheme(rows, ISO27001_CONTROLS).people.applicable).toBe(8);
  });
});

describe('risk bands and heat map', () => {
  it('bands by the default thresholds', () => {
    expect(riskBand(4)).toBe('low');
    expect(riskBand(5)).toBe('medium');
    expect(riskBand(9)).toBe('medium');
    expect(riskBand(10)).toBe('high');
    expect(riskBand(16)).toBe('critical');
    expect(riskBand(9, { ...DEFAULT_METHODOLOGY, mediumMax: 8 })).toBe('high');
  });
  it('counts risks into a 5×5 grid', () => {
    const grid = heatmap([{ likelihood: 5, impact: 5 }, { likelihood: 1, impact: 1 }, { likelihood: 3, impact: 4 }]);
    expect(grid.flat().reduce((a, b) => a + b, 0)).toBe(3);
    expect(grid[4][4]).toBe(1);
    expect(grid[0][0]).toBe(1);
    expect(grid[3][2]).toBe(1);
  });
});

describe('Statement of Applicability', () => {
  it('lists not-applicable controls without justification', () => {
    const { rows, missingJustification } = buildSoa(ISO27001_CONTROLS, [
      row('7.12', 'not_applicable'),
      row('7.13', 'not_applicable', 'Fully cloud-hosted; no owned equipment.'),
      row('5.1', 'implemented'),
    ]);
    expect(rows).toHaveLength(93);
    expect(missingJustification).toEqual(['7.12']);
    expect(rows.find((r) => r.controlId === '7.13')).toMatchObject({ applicable: false, status: 'not_applicable' });
    expect(rows.find((r) => r.controlId === '5.1')).toMatchObject({ applicable: true, status: 'implemented' });
  });
  it('exports CSV with quoting', () => {
    const { rows } = buildSoa(ISO27001_CONTROLS, [row('5.1', 'implemented', 'Approved, "v3", published')]);
    const csv = soaCsv(rows, ISO27001_CONTROLS, 'en');
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Control,Title,Theme,Applicable,Status,Justification,Owner');
    expect(lines[1]).toContain('"Approved, ""v3"", published"');
    expect(lines).toHaveLength(95); // header + 93 + trailing newline
    expect(soaCsv(rows, ISO27001_CONTROLS, 'th').split('\r\n')[0]).toContain('รหัส');
  });
});

describe('suggestControls', () => {
  it('maps phishing to authentication and awareness', () => {
    const ids = suggestControls('Phishing email steals a password from staff');
    expect(ids).toContain('8.5');
    expect(ids).toContain('6.3');
    expect(ids.length).toBeLessThanOrEqual(5);
  });
  it('maps ransomware to malware and backup', () => {
    const ids = suggestControls('Ransomware encrypts file server');
    expect(ids).toContain('8.7');
    expect(ids).toContain('8.13');
  });
  it('returns nothing for empty text', () => {
    expect(suggestControls('   ')).toEqual([]);
  });
});
