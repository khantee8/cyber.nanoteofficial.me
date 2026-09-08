import { describe, expect, it } from 'vitest';
import { ALPHA2_TO_NUMERIC, SMALL_TERRITORY_COORDS, numericFor } from './iso';
import { buildAtlas } from './atlas';

describe('iso', () => {
  it('maps alpha-2 to numeric', () => {
    expect(numericFor('US')).toBe('840');
    expect(numericFor('th')).toBe('764');
    expect(numericFor('XX')).toBeNull();
  });
  it('has 249 unique assignments', () => {
    const values = Object.values(ALPHA2_TO_NUMERIC);
    expect(values).toHaveLength(249);
    expect(new Set(values).size).toBe(249);
    for (const v of values) expect(v).toMatch(/^\d{3}$/);
  });
});

describe('atlas', () => {
  const atlas = buildAtlas(960, 500);
  it('renders the 110m countries with finite centroids', () => {
    expect(atlas.countries.length).toBeGreaterThan(150);
    for (const c of atlas.countries) {
      expect(c.path.length).toBeGreaterThan(10);
      expect(Number.isFinite(c.centroid[0]) && Number.isFinite(c.centroid[1])).toBe(true);
      expect(c.centroid[0]).toBeGreaterThanOrEqual(0);
      expect(c.centroid[0]).toBeLessThanOrEqual(960);
    }
  });
  it('locates every alpha-2 code either by shape or by small-territory coordinates', () => {
    const ids = new Set(atlas.countries.map((c) => c.id));
    const missing = Object.entries(ALPHA2_TO_NUMERIC)
      .filter(([a2, num]) => !ids.has(num) && !SMALL_TERRITORY_COORDS[a2])
      .map(([a2]) => a2);
    // Uninhabited or dependency-only territories that no feed reports on.
    const allowed = new Set(['BV', 'HM', 'SJ', 'UM', 'GS', 'TF', 'AQ']);
    expect(missing.filter((m) => !allowed.has(m))).toEqual([]);
  });
  it('projects Thailand east of the UK and memoises per size', () => {
    const th = atlas.locate('TH')!;
    const gb = atlas.locate('GB')!;
    expect(th[0]).toBeGreaterThan(gb[0]);
    expect(atlas.locate('SG')).not.toBeNull();
    expect(atlas.locate('ZZ')).toBeNull();
    expect(buildAtlas(960, 500)).toBe(atlas);
  });
});
