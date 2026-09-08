import { fetchJson, isRecord, str, type RansomVictim } from '../types';

export const RANSOMWARE_URL = 'https://api.ransomware.live/v2/recentvictims';

/** Parse ransomware.live recent victims, newest discovery first. Throws on shape mismatch. */
export function parseRansomware(raw: unknown): RansomVictim[] {
  if (!Array.isArray(raw)) throw new Error('ransomware.live: expected an array');
  return raw
    .filter(isRecord)
    .map((v) => {
      const country = str(v.country).trim().toUpperCase();
      const sector = str(v.activity).trim();
      return {
        victim: str(v.victim).trim(),
        group: str(v.group).trim(),
        country: /^[A-Z]{2}$/.test(country) ? country : null,
        sector: sector && !/^not found$/i.test(sector) ? sector : null,
        attackDate: str(v.attackdate).slice(0, 10),
        discovered: str(v.discovered),
        url: str(v.url) || 'https://www.ransomware.live/',
      };
    })
    .filter((v) => v.victim && v.group)
    .sort((a, b) => b.discovered.localeCompare(a.discovered));
}

/** Victims discovered within the last `days` days. */
export function selectRecentVictims(victims: RansomVictim[], days: number, now: Date): RansomVictim[] {
  const cutoff = new Date(now.getTime() - days * 86_400_000).toISOString();
  return victims.filter((v) => v.discovered >= cutoff);
}

export async function fetchRansomware(signal?: AbortSignal): Promise<RansomVictim[] | null> {
  const raw = await fetchJson(RANSOMWARE_URL, signal);
  if (raw === null) return null;
  try {
    return parseRansomware(raw);
  } catch {
    return null;
  }
}
