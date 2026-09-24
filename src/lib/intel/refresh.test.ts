import { describe, expect, it } from 'vitest';
import { refreshSources, type RefreshDeps } from './refresh';
import type { KevEntry } from './types';

const now = new Date('2026-09-24T12:00:00Z');
const kev = (cveId: string): KevEntry => ({ cveId, vendor: 'Acme', product: 'Gate', name: 'x', dateAdded: '2026-09-23', dueDate: '2026-10-14', ransomwareUse: false, description: 'd', url: 'u' });

const deps = (over: Partial<RefreshDeps> = {}): Partial<RefreshDeps> => ({
  kev: async () => ({ kind: 'ok', data: [kev('CVE-2026-0002'), kev('CVE-2026-0001')], etag: '"e1"', lastModified: 'Wed' }),
  epss: async (cves) => new Map(cves.map((c) => [c, 0.5])),
  ransomware: async () => [],
  feodo: async () => [],
  isc: async () => ({ infocon: 'green', topPorts: [] }),
  news: async () => [],
  ...over,
});

describe('refreshSources', () => {
  it('fills every row on a clean first run and asks EPSS about the stored KEV CVEs', async () => {
    let asked: string[] = [];
    const { rows, outcome } = await refreshSources({}, now, deps({ epss: async (c) => { asked = c; return new Map([[c[0], 0.9]]); } }));
    expect(outcome).toEqual({ kev: 'ok', epss: 'ok', ransomware: 'ok', feodo: 'ok', isc: 'ok', news: 'ok' });
    expect(asked).toEqual(['CVE-2026-0002', 'CVE-2026-0001']);
    expect(rows.epss?.data).toEqual({ 'CVE-2026-0002': 0.9 });
    expect(rows.kev?.etag).toBe('"e1"');
  });
  it('passes stored validators to KEV and keeps data on 304', async () => {
    const first = await refreshSources({}, now, deps());
    let seen: unknown = null;
    const later = new Date(now.getTime() + 30 * 60_000);
    const { rows, outcome } = await refreshSources(first.rows, later, deps({ kev: async (v) => { seen = v; return { kind: 'not_modified' }; } }));
    expect(seen).toEqual({ etag: '"e1"', lastModified: 'Wed' });
    expect(outcome.kev).toBe('not_modified');
    expect(rows.kev?.data).toEqual(first.rows.kev?.data);
    expect(rows.kev?.fetchedAt).toBe(later.toISOString());
  });
  it('keeps the previous copy when a source fails and reports it', async () => {
    const first = await refreshSources({}, now, deps());
    const { rows, outcome } = await refreshSources(first.rows, now, deps({ feodo: async () => null, news: async () => { throw new Error('x'); } }));
    expect(outcome.feodo).toBe('failed');
    expect(outcome.news).toBe('failed');
    expect(rows.feodo?.data).toEqual([]);
    expect(rows.feodo?.error).toBeTruthy();
  });
  it('skips EPSS (failed) when there are no KEV CVEs', async () => {
    const { outcome } = await refreshSources({}, now, deps({ kev: async () => ({ kind: 'failed', error: 'HTTP 503' }) }));
    expect(outcome.kev).toBe('failed');
    expect(outcome.epss).toBe('failed');
  });
  it('trims KEV and ransomware to the display limits before storing', async () => {
    const many = Array.from({ length: 90 }, (_, i) => kev(`CVE-2026-${1000 + i}`));
    const { rows } = await refreshSources({}, now, deps({ kev: async () => ({ kind: 'ok', data: many }) }));
    expect(rows.kev?.data).toHaveLength(60);
  });
});
