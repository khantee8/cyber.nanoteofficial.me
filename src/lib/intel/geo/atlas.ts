import { geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import atlas from 'world-atlas/countries-110m.json';
import { ALPHA2_TO_NUMERIC, SMALL_TERRITORY_COORDS } from './iso';

export interface CountryShape {
  id: string;             // numeric-3 ISO id
  name: string;
  path: string;           // SVG path data
  centroid: [number, number];   // projected px
}

export interface Atlas {
  width: number;
  height: number;
  countries: CountryShape[];
  project: (lonLat: [number, number]) => [number, number] | null;
  /** Projected position for an alpha-2 code, or null when it is unknown. */
  locate: (alpha2: string) => [number, number] | null;
}

type CountryProps = { name: string };

let cached: { key: string; atlas: Atlas } | null = null;

/** Build (and memoise) the projected country outlines for a given viewport. Server-safe. */
export function buildAtlas(width: number, height: number): Atlas {
  const key = `${width}x${height}`;
  if (cached?.key === key) return cached.atlas;

  const topo = atlas as unknown as Topology<{ countries: GeometryCollection<CountryProps> }>;
  const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, CountryProps>;

  const projection = geoNaturalEarth1().fitSize([width, height], fc);
  const path = geoPath(projection);

  const byId = new Map<string, [number, number]>();
  const countries: CountryShape[] = [];
  for (const f of fc.features as Feature<Geometry, CountryProps & GeoJsonProperties>[]) {
    const id = typeof f.id === 'string' ? f.id : f.id != null ? String(f.id).padStart(3, '0') : null;
    const d = path(f);
    if (!id || !d) continue;
    const c = projection(geoCentroid(f));
    if (!c) continue;
    const centroid: [number, number] = [Math.round(c[0] * 10) / 10, Math.round(c[1] * 10) / 10];
    byId.set(id, centroid);
    countries.push({ id, name: f.properties?.name ?? id, path: d, centroid });
  }

  const project = (lonLat: [number, number]) => {
    const p = projection(lonLat);
    return p ? ([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] as [number, number]) : null;
  };

  const locate = (alpha2: string) => {
    const code = alpha2.toUpperCase();
    const num = ALPHA2_TO_NUMERIC[code];
    if (num && byId.has(num)) return byId.get(num)!;
    const ll = SMALL_TERRITORY_COORDS[code];
    return ll ? project(ll) : null;
  };

  const built: Atlas = { width, height, countries, project, locate };
  cached = { key, atlas: built };
  return built;
}
