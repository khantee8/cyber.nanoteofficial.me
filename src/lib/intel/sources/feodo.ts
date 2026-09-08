import { fetchJson, isRecord, str, type C2Server } from '../types';

export const FEODO_URL = 'https://feodotracker.abuse.ch/downloads/ipblocklist.json';

/** Parse the Feodo Tracker botnet C2 blocklist; online servers first. Throws on shape mismatch. */
export function parseFeodo(raw: unknown): C2Server[] {
  if (!Array.isArray(raw)) throw new Error('Feodo: expected an array');
  return raw
    .filter(isRecord)
    .map((r) => {
      const country = str(r.country).toUpperCase();
      return {
        ip: str(r.ip_address),
        port: Number(r.port) || 0,
        country: /^[A-Z]{2}$/.test(country) ? country : null,
        malware: str(r.malware, 'unknown'),
        asName: str(r.as_name) || null,
        status: (str(r.status) === 'online' ? 'online' : 'offline') as C2Server['status'],
        lastOnline: str(r.last_online).slice(0, 10),
      };
    })
    .filter((r) => r.ip)
    .sort((a, b) => (a.status === b.status ? b.lastOnline.localeCompare(a.lastOnline) : a.status === 'online' ? -1 : 1));
}

export async function fetchFeodo(signal?: AbortSignal): Promise<C2Server[] | null> {
  const raw = await fetchJson(FEODO_URL, signal);
  if (raw === null) return null;
  try {
    return parseFeodo(raw);
  } catch {
    return null;
  }
}
