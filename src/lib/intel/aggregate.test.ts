import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildIntelSnapshot, computeStats, type Fetchers, type IntelSnapshot } from './aggregate';
import { parseKev } from './sources/kev';
import { parseRansomware } from './sources/ransomware';
import { parseFeodo } from './sources/feodo';
import { parseRss } from './sources/news';

const fx = (name: string) => readFileSync(new URL(`./sources/__fixtures__/${name}`, import.meta.url), 'utf8');
const json = (name: string) => JSON.parse(fx(name)) as unknown;

const kev = parseKev(json('kev.json'));
const ransomware = parseRansomware(json('ransomware.json'));
const c2 = parseFeodo(json('feodo.json'));
const headlines = parseRss(fx('thn.xml'), 'thn');
const isc = { infocon: 'green' as const, topPorts: [{ port: 443, records: 10, sources: 2 }] };

const ok: Fetchers = {
  kev: async () => kev,
  epss: async (cves) => new Map(cves.map((c) => [c, 0.5])),
  ransomware: async () => ransomware,
  feodo: async () => c2,
  isc: async () => isc,
  news: async () => headlines,
};

const now = new Date(ransomware[0].discovered);

describe('buildIntelSnapshot', () => {
  it('reports every source ok and computes stats', async () => {
    const s = await buildIntelSnapshot(ok, undefined, now);
    for (const id of ['kev', 'epss', 'ransomware', 'feodo', 'isc', 'news'] as const) {
      expect(s.health[id].status, id).toBe('ok');
    }
    expect(s.kev[0].epss).toBe(0.5);
    expect(s.stats.ransomware7d).toBeGreaterThan(0);
    expect(s.stats.topGroups7d[0].count).toBeGreaterThan(0);
    expect(s.stats.c2Online).toBe(c2.filter((x) => x.status === 'online').length);
    expect(s.stats.infocon).toBe('green');
    expect(Object.keys(s.stats.byCountry).length).toBeGreaterThan(0);
  });

  it('falls back to the snapshot and marks the source stale', async () => {
    const fallback: IntelSnapshot = await buildIntelSnapshot(ok, undefined, now);
    const s = await buildIntelSnapshot({ ...ok, ransomware: async () => null }, fallback, now);
    expect(s.health.ransomware.status).toBe('stale');
    expect(s.health.ransomware.fetchedAt).toBe(fallback.generatedAt);
    expect(s.ransomware).toEqual(fallback.ransomware);
    expect(s.health.kev.status).toBe('ok');
  });

  it('marks a source down when there is no fallback, and never throws', async () => {
    const s = await buildIntelSnapshot({
      ...ok,
      kev: async () => { throw new Error('boom'); },
      news: async () => null,
    }, undefined, now);
    expect(s.health.kev.status).toBe('down');
    expect(s.kev).toEqual([]);
    expect(s.health.news.status).toBe('down');
    expect(s.headlines).toEqual([]);
  });

  it('reuses EPSS from the fallback when FIRST is unreachable', async () => {
    const fallback = await buildIntelSnapshot(ok, undefined, now);
    const s = await buildIntelSnapshot({ ...ok, epss: async () => null }, fallback, now);
    expect(s.health.epss.status).toBe('stale');
    expect(s.kev[0].epss).toBe(0.5);
  });
});

describe('computeStats', () => {
  it('counts only online C2 per country', () => {
    const stats = computeStats({ kev: [], ransomware: [], c2, isc }, now);
    const total = Object.values(stats.byCountry).reduce((a, b) => a + b.c2, 0);
    expect(total).toBe(c2.filter((x) => x.status === 'online' && x.country).length);
  });
});
