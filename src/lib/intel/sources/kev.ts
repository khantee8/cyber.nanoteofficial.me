import { fetchJson, isRecord, str, type KevEntry } from '../types';

export const KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

/** Parse the CISA KEV catalogue, newest first. Throws on a shape mismatch. */
export function parseKev(raw: unknown): KevEntry[] {
  if (!isRecord(raw) || !Array.isArray(raw.vulnerabilities)) {
    throw new Error('KEV: expected { vulnerabilities: [] }');
  }
  return raw.vulnerabilities
    .filter(isRecord)
    .map((v) => ({
      cveId: str(v.cveID),
      vendor: str(v.vendorProject),
      product: str(v.product),
      name: str(v.vulnerabilityName),
      dateAdded: str(v.dateAdded),
      dueDate: str(v.dueDate),
      ransomwareUse: str(v.knownRansomwareCampaignUse).toLowerCase() === 'known',
      description: str(v.shortDescription),
      url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${encodeURIComponent(str(v.cveID))}`,
    }))
    .filter((e) => e.cveId.startsWith('CVE-'))
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded) || b.cveId.localeCompare(a.cveId));
}

/** Entries added within the last `days` days, counted back from `now`. */
export function selectRecentKev(entries: KevEntry[], days: number, now: Date): KevEntry[] {
  const cutoff = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  return entries.filter((e) => e.dateAdded >= cutoff);
}

export async function fetchKev(signal?: AbortSignal): Promise<KevEntry[] | null> {
  const raw = await fetchJson(KEV_URL, signal);
  if (raw === null) return null;
  try {
    return parseKev(raw);
  } catch {
    return null;
  }
}
