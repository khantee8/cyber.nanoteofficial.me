import type { Lang } from '@/lib/lang';

/** Human "3m" / "2h" / "4d" age of an ISO timestamp. */
export function ago(iso: string, now: Date = new Date(), lang: Lang = 'en'): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return lang === 'th' ? 'เมื่อสักครู่' : 'just now';
  const s = Math.floor(ms / 1000);
  const unit = (n: number, en: string, th: string) => `${n}${lang === 'th' ? th : en}`;
  if (s < 60) return lang === 'th' ? 'เมื่อสักครู่' : 'just now';
  if (s < 3600) return unit(Math.floor(s / 60), 'm', ' นาที');
  if (s < 86_400) return unit(Math.floor(s / 3600), 'h', ' ชม.');
  return unit(Math.floor(s / 86_400), 'd', ' วัน');
}

export function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

export function fmtInt(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';

/** EPSS probability → severity band used for colour. */
export function epssBand(p: number | undefined): Severity | null {
  if (p === undefined) return null;
  if (p >= 0.7) return 'critical';
  if (p >= 0.4) return 'high';
  if (p >= 0.1) return 'medium';
  return 'low';
}

export const sevColor: Record<Severity, string> = {
  critical: 'var(--sev-critical)',
  high: 'var(--sev-high)',
  medium: 'var(--sev-medium)',
  low: 'var(--sev-low)',
};
