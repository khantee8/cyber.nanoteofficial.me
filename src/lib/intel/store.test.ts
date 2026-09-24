import { describe, expect, it } from 'vitest';
import { assembleSnapshot, healthFromAge, mergeSourceRow, type SourceRows } from './store';
import { buildIntelSnapshot, type Fetchers } from './aggregate';
import type { KevEntry } from './types';

const now = new Date('2026-09-24T12:00:00Z');
const iso = (msAgo: number) => new Date(now.getTime() - msAgo).toISOString();
const kev = (cveId: string, dateAdded = '2026-09-23'): KevEntry => ({
  cveId, vendor: 'Acme', product: 'Gate', name: 'x', dateAdded, dueDate: '2026-10-14',
  ransomwareUse: false, description: 'd', url: 'u',
});

describe('mergeSourceRow', () => {
  const prev = { source: 'kev' as const, data: [kev('CVE-2026-0001')], fetchedAt: iso(3_600_000), attemptedAt: iso(3_600_000), error: null, etag: '"a"', lastModified: 'Mon' };
  it('replaces data, clears the error and stores validators on success', () => {
    const r = mergeSourceRow('kev', { ...prev, error: 'boom' }, { kind: 'ok', data: [kev('CVE-2026-0002')], etag: '"b"', lastModified: 'Tue' }, now);
    expect(r).toEqual({ source: 'kev', data: [kev('CVE-2026-0002')], fetchedAt: now.toISOString(), attemptedAt: now.toISOString(), error: null, etag: '"b"', lastModified: 'Tue' });
  });
  it('keeps data and validators but bumps fetchedAt on 304', () => {
    const r = mergeSourceRow('kev', prev, { kind: 'not_modified' }, now);
    expect(r.data).toEqual(prev.data);
    expect(r.fetchedAt).toBe(now.toISOString());
    expect(r.etag).toBe('"a"');
    expect(r.error).toBeNull();
  });
  it('keeps the last good copy and records the error on failure', () => {
    const r = mergeSourceRow('kev', prev, { kind: 'failed', error: 'HTTP 503' }, now);
    expect(r.data).toEqual(prev.data);
    expect(r.fetchedAt).toBe(prev.fetchedAt);
    expect(r.attemptedAt).toBe(now.toISOString());
    expect(r.error).toBe('HTTP 503');
  });
  it('leaves data null when the very first attempt fails', () => {
    const r = mergeSourceRow('feodo', undefined, { kind: 'failed', error: 'timeout' }, now);
    expect(r).toMatchObject({ source: 'feodo', data: null, fetchedAt: null, error: 'timeout', etag: null, lastModified: null });
  });
  it('treats 304 without a previous row as a failure', () => {
    const r = mergeSourceRow('kev', undefined, { kind: 'not_modified' }, now);
    expect(r.data).toBeNull();
    expect(r.error).toMatch(/not modified/i);
  });
});

describe('healthFromAge', () => {
  it('is ok under 60 minutes, stale from 60, down when never fetched', () => {
    expect(healthFromAge(iso(59 * 60_000), now)).toBe('ok');
    expect(healthFromAge(iso(60 * 60_000), now)).toBe('stale');
    expect(healthFromAge(null, now)).toBe('down');
  });
});

describe('assembleSnapshot', () => {
  it('builds panels from rows, merges EPSS and uses the newest fetchedAt as generatedAt', () => {
    const rows: SourceRows = {
      kev: { source: 'kev', data: [kev('CVE-2026-0002'), kev('CVE-2026-0001')], fetchedAt: iso(10 * 60_000), attemptedAt: iso(0), error: null, etag: null, lastModified: null },
      epss: { source: 'epss', data: { 'CVE-2026-0002': 0.91 }, fetchedAt: iso(5 * 60_000), attemptedAt: iso(0), error: null, etag: null, lastModified: null },
      isc: { source: 'isc', data: { infocon: 'green', topPorts: [] }, fetchedAt: iso(2 * 3_600_000), attemptedAt: iso(0), error: 'HTTP 500', etag: null, lastModified: null },
    };
    const s = assembleSnapshot(rows, undefined, now);
    expect(s.kev.map((k) => k.cveId)).toEqual(['CVE-2026-0002', 'CVE-2026-0001']);
    expect(s.kev[0].epss).toBe(0.91);
    expect(s.kev[1].epss).toBeUndefined();
    expect(s.health.kev).toEqual({ status: 'ok', fetchedAt: iso(10 * 60_000), ms: 0 });
    expect(s.health.isc.status).toBe('stale');
    expect(s.health.ransomware.status).toBe('down');
    expect(s.ransomware).toEqual([]);
    expect(s.generatedAt).toBe(iso(5 * 60_000));
    expect(s.stats.kevAdded7d).toBe(2);
  });
  it('fills a source with no data from the fallback and labels it stale with the fallback time', async () => {
    const ok: Fetchers = {
      kev: async () => [kev('CVE-2026-0009')], epss: async () => new Map(), ransomware: async () => [],
      feodo: async () => [], isc: async () => ({ infocon: 'yellow', topPorts: [] }), news: async () => [],
    };
    const fallback = await buildIntelSnapshot(ok, undefined, new Date('2026-09-08T00:00:00Z'));
    const s = assembleSnapshot({}, fallback, now);
    expect(s.kev.map((k) => k.cveId)).toEqual(['CVE-2026-0009']);
    expect(s.health.kev).toMatchObject({ status: 'stale', fetchedAt: fallback.health.kev.fetchedAt });
    expect(s.isc.infocon).toBe('yellow');
  });
  it('uses the fallback capture time as generatedAt when there are no DB rows at all', async () => {
    const ok: Fetchers = {
      kev: async () => [kev('CVE-2026-0009')], epss: async () => new Map(), ransomware: async () => [],
      feodo: async () => [], isc: async () => ({ infocon: 'yellow', topPorts: [] }), news: async () => [],
    };
    const fallback = await buildIntelSnapshot(ok, undefined, new Date('2026-09-08T00:00:00Z'));
    const s = assembleSnapshot({}, fallback, now);
    expect(s.generatedAt).toBe(fallback.generatedAt);
  });
  it('returns an all-down empty snapshot with no rows and no fallback, dated now', () => {
    const s = assembleSnapshot({}, undefined, now);
    expect(s.generatedAt).toBe(now.toISOString());
    expect(Object.values(s.health).every((h) => h.status === 'down')).toBe(true);
    expect(s.isc).toEqual({ infocon: 'unknown', topPorts: [] });
  });
  it('trims stored lists to the display limits', () => {
    const many = Array.from({ length: 80 }, (_, i) => kev(`CVE-2026-${String(1000 + i)}`));
    const s = assembleSnapshot({ kev: { source: 'kev', data: many, fetchedAt: iso(0), attemptedAt: iso(0), error: null, etag: null, lastModified: null } }, undefined, now);
    expect(s.kev).toHaveLength(60);
  });
});
