import { fetchJson, isRecord, str } from '../types';

export const EPSS_URL = 'https://api.first.org/data/v1/epss';

/** Parse a FIRST EPSS response into a CVE → probability map. Throws on shape mismatch. */
export function parseEpss(raw: unknown): Map<string, number> {
  if (!isRecord(raw) || !Array.isArray(raw.data)) throw new Error('EPSS: expected { data: [] }');
  const out = new Map<string, number>();
  for (const row of raw.data) {
    if (!isRecord(row)) continue;
    const cve = str(row.cve);
    const p = Number(row.epss);
    if (cve && Number.isFinite(p)) out.set(cve, p);
  }
  return out;
}

/** Look up EPSS for up to 100 CVEs in one call. */
export async function fetchEpss(cves: string[], signal?: AbortSignal): Promise<Map<string, number> | null> {
  if (cves.length === 0) return new Map();
  const raw = await fetchJson(`${EPSS_URL}?cve=${cves.slice(0, 100).join(',')}`, signal);
  if (raw === null) return null;
  try {
    return parseEpss(raw);
  } catch {
    return null;
  }
}
