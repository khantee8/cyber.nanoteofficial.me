import { fetchJson, isRecord, str, type Infocon, type IscStatus } from '../types';

export const ISC_INFOCON_URL = 'https://isc.sans.edu/api/infocon?json';
export const ISC_TOPPORTS_URL = 'https://isc.sans.edu/api/topports/records/10?json';

export function parseInfocon(raw: unknown): Infocon {
  if (!isRecord(raw)) throw new Error('ISC infocon: expected an object');
  const s = str(raw.status).toLowerCase();
  return s === 'green' || s === 'yellow' || s === 'orange' || s === 'red' ? s : 'unknown';
}

/** The topports endpoint returns an object keyed "0","1",… plus metadata keys. */
export function parseTopPorts(raw: unknown): IscStatus['topPorts'] {
  if (!isRecord(raw)) throw new Error('ISC topports: expected an object');
  const rows = Object.values(raw).filter(isRecord).filter((r) => 'targetport' in r);
  return rows
    .map((r) => ({ port: Number(r.targetport) || 0, records: Number(r.records) || 0, sources: Number(r.sources) || 0 }))
    .filter((r) => r.port > 0)
    .sort((a, b) => b.records - a.records)
    .slice(0, 10);
}

export async function fetchIsc(signal?: AbortSignal): Promise<IscStatus | null> {
  const [infoconRaw, portsRaw] = await Promise.all([
    fetchJson(ISC_INFOCON_URL, signal),
    fetchJson(ISC_TOPPORTS_URL, signal),
  ]);
  if (infoconRaw === null && portsRaw === null) return null;
  try {
    return {
      infocon: infoconRaw === null ? 'unknown' : parseInfocon(infoconRaw),
      topPorts: portsRaw === null ? [] : parseTopPorts(portsRaw),
    };
  } catch {
    return null;
  }
}
