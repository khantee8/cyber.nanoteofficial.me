export type SourceId = 'kev' | 'epss' | 'ransomware' | 'feodo' | 'isc' | 'news';

export interface KevEntry {
  cveId: string;
  vendor: string;
  product: string;
  name: string;
  dateAdded: string;   // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
  ransomwareUse: boolean;
  description: string;
  url: string;
  /** FIRST EPSS probability 0–1, merged in by the aggregator when available */
  epss?: number;
}

export interface RansomVictim {
  victim: string;
  group: string;
  country: string | null;   // ISO 3166-1 alpha-2, upper-case
  sector: string | null;
  attackDate: string;       // YYYY-MM-DD as published by the group
  discovered: string;       // ISO datetime when ransomware.live saw it
  url: string;
}

export interface C2Server {
  ip: string;
  port: number;
  country: string | null;
  malware: string;
  asName: string | null;
  status: 'online' | 'offline';
  lastOnline: string;       // YYYY-MM-DD
}

export type Infocon = 'green' | 'yellow' | 'orange' | 'red' | 'unknown';

export interface IscStatus {
  infocon: Infocon;
  topPorts: { port: number; records: number; sources: number }[];
}

export interface Headline {
  title: string;
  url: string;
  source: 'thn' | 'bleeping';
  publishedAt: string | null;   // ISO datetime
}

/** Shared fetch helper: 8 s timeout, never throws. */
export async function fetchText(url: string, accept: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { accept, 'user-agent': 'nanote-cyber/1.0 (+https://cyber.nanoteofficial.me)' },
      signal: signal ?? AbortSignal.timeout(12000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown | null> {
  const text = await fetchText(url, 'application/json', signal);
  if (text === null) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;
}
