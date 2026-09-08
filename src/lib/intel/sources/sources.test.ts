import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseKev, selectRecentKev } from './kev';
import { parseEpss } from './epss';
import { parseRansomware, selectRecentVictims } from './ransomware';
import { parseFeodo } from './feodo';
import { parseInfocon, parseTopPorts } from './isc';
import { parseRss } from './news';

const fx = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8');
const json = (name: string) => JSON.parse(fx(name)) as unknown;

describe('KEV', () => {
  const entries = parseKev(json('kev.json'));
  it('parses every entry newest first', () => {
    expect(entries).toHaveLength(40);
    expect(entries[0].cveId).toMatch(/^CVE-/);
    expect(entries[0].dateAdded >= entries[39].dateAdded).toBe(true);
    expect(entries[0]).toMatchObject({ vendor: 'Google', product: 'Chromium V8', dateAdded: '2026-09-04' });
    expect(typeof entries[0].ransomwareUse).toBe('boolean');
    expect(entries[0].url).toContain(entries[0].cveId);
  });
  it('throws on the wrong shape', () => {
    expect(() => parseKev({})).toThrow();
    expect(() => parseKev(null)).toThrow();
  });
  it('selects a trailing window by dateAdded', () => {
    const now = new Date('2026-09-05T12:00:00Z');
    const recent = selectRecentKev(entries, 7, now);
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.length).toBeLessThan(entries.length);
    expect(recent.every((e) => e.dateAdded >= '2026-08-29')).toBe(true);
  });
});

describe('EPSS', () => {
  it('maps CVE to probability', () => {
    const m = parseEpss(json('epss.json'));
    expect(m.get('CVE-2024-3400')).toBeCloseTo(0.99999, 4);
  });
  it('throws on the wrong shape', () => {
    expect(() => parseEpss({ status: 'OK' })).toThrow();
  });
});

describe('ransomware.live', () => {
  const victims = parseRansomware(json('ransomware.json'));
  it('parses victims with upper-case alpha-2 countries', () => {
    expect(victims).toHaveLength(50);
    for (const v of victims) {
      expect(v.victim).not.toBe('');
      expect(v.group).not.toBe('');
      if (v.country) expect(v.country).toMatch(/^[A-Z]{2}$/);
      expect(v.attackDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(victims[0].discovered >= victims[49].discovered).toBe(true);
  });
  it('throws on the wrong shape', () => {
    expect(() => parseRansomware({})).toThrow();
  });
  it('selects a window by discovery time', () => {
    const now = new Date(victims[0].discovered);
    expect(selectRecentVictims(victims, 7, now).length).toBeGreaterThan(0);
    expect(selectRecentVictims(victims, 0, new Date(now.getTime() + 1))).toHaveLength(0);
  });
});

describe('Feodo', () => {
  it('parses C2 servers, online first', () => {
    const c2 = parseFeodo(json('feodo.json'));
    expect(c2.length).toBeGreaterThan(0);
    expect(c2[0]).toMatchObject({ ip: expect.stringMatching(/^\d+\.\d+\.\d+\.\d+$/), malware: expect.any(String) });
    const firstOffline = c2.findIndex((s) => s.status === 'offline');
    const lastOnline = c2.map((s) => s.status).lastIndexOf('online');
    if (firstOffline >= 0 && lastOnline >= 0) expect(lastOnline).toBeLessThan(firstOffline);
  });
  it('throws on the wrong shape', () => {
    expect(() => parseFeodo('nope')).toThrow();
  });
});

describe('ISC', () => {
  it('reads infocon', () => {
    expect(parseInfocon(json('isc-infocon.json'))).toBe('green');
    expect(parseInfocon({ status: 'purple' })).toBe('unknown');
    expect(() => parseInfocon(null)).toThrow();
  });
  it('reads top ports sorted by records', () => {
    const ports = parseTopPorts(json('isc-topports.json'));
    expect(ports.length).toBeGreaterThanOrEqual(5);
    expect(ports[0].port).toBe(443);
    expect(ports[0].records).toBeGreaterThanOrEqual(ports[1].records);
  });
});

describe('RSS', () => {
  it('parses THN with CDATA titles and dates', () => {
    const items = parseRss(fx('thn.xml'), 'thn');
    expect(items.length).toBeGreaterThan(3);
    expect(items[0].url).toMatch(/^https?:\/\//);
    expect(items[0].source).toBe('thn');
    expect(items[0].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(items[0].title).not.toContain('CDATA');
  });
  it('parses BleepingComputer', () => {
    const items = parseRss(fx('bleeping.xml'), 'bleeping');
    expect(items.length).toBeGreaterThan(3);
  });
  it('throws on non-RSS text', () => {
    expect(() => parseRss('<html></html>', 'thn')).toThrow();
  });
});
