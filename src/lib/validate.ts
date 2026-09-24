/** Hand-written form guards. Each throws a plain Error the action turns into a message. */
export class ValidationError extends Error {}

export function str(v: unknown, max: number, opts: { required?: boolean; field?: string } = {}): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) {
    if (opts.required) throw new ValidationError(`${opts.field ?? 'field'} is required`);
    return null;
  }
  if (s.length > max) throw new ValidationError(`${opts.field ?? 'field'} is longer than ${max} characters`);
  return s;
}

export function int(v: unknown, min: number, max: number, field = 'value'): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isInteger(n) || n < min || n > max) throw new ValidationError(`${field} must be a whole number from ${min} to ${max}`);
  return n;
}

export function optionalInt(v: unknown, min: number, max: number, field = 'value'): number | null {
  const s = typeof v === 'string' ? v.trim() : v;
  if (s === '' || s === null || s === undefined) return null;
  return int(s, min, max, field);
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], field = 'value'): T {
  if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) return v as T;
  throw new ValidationError(`${field} must be one of ${allowed.join(', ')}`);
}

/** Newline- or comma-separated https URLs, deduplicated, max 10. */
export function urlList(v: unknown, max = 10): string[] {
  const raw = typeof v === 'string' ? v : '';
  const out: string[] = [];
  for (const part of raw.split(/[\n,]/)) {
    const u = part.trim();
    if (!u) continue;
    if (!/^https?:\/\/[^\s]{3,500}$/.test(u)) throw new ValidationError(`not a valid URL: ${u.slice(0, 60)}`);
    if (!out.includes(u)) out.push(u);
  }
  if (out.length > max) throw new ValidationError(`at most ${max} links`);
  return out;
}

export function idList(v: unknown, valid: Set<string>, max = 20): string[] {
  const items = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  const out: string[] = [];
  for (const raw of items) {
    const id = String(raw).trim();
    if (!id) continue;
    if (!valid.has(id)) throw new ValidationError(`unknown control ${id}`);
    if (!out.includes(id)) out.push(id);
  }
  if (out.length > max) throw new ValidationError(`at most ${max} linked controls`);
  return out;
}

/** CSF score: null, or a multiple of 0.5 from 0 to 10. */
export function halfStep(v: unknown, field = 'score'): number | null {
  const s = typeof v === 'string' ? v.trim() : v;
  if (s === '' || s === null || s === undefined) return null;
  if (typeof s !== 'number' && typeof s !== 'string') {
    throw new ValidationError(`${field} must be 0 to 10 in steps of 0.5`);
  }
  const n = typeof s === 'number' ? s : Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 10 || !Number.isInteger(n * 2)) {
    throw new ValidationError(`${field} must be 0 to 10 in steps of 0.5`);
  }
  return n;
}

export function optionalTier(v: unknown, field = 'Tier'): number | null {
  return optionalInt(v, 1, 4, field);
}

const BANGKOK_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' });

/** Format + real-calendar-date check shared by `isoDate` and `optionalDate`. */
function parseCalendarDate(s: string, field: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  if (!m || !d || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) throw new ValidationError(`${field} is not a valid date`);
  return s;
}

/** A calendar date "YYYY-MM-DD" that exists and is not after today in Asia/Bangkok (the product's audience) — not UTC, which would reject a Thai user's local "today" between 00:00 and 06:59 ICT. */
export function isoDate(v: unknown, field = 'date', today = new Date()): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return null;
  parseCalendarDate(s, field);
  if (s > BANGKOK_DATE.format(today)) throw new ValidationError(`${field} cannot be in the future`);
  return s;
}

/**
 * A calendar date "YYYY-MM-DD" that exists, with no past/future constraint — for planning
 * fields such as an assessment period that may legitimately be set ahead of today (e.g. FY2027).
 */
export function optionalDate(v: unknown, field = 'date'): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return null;
  return parseCalendarDate(s, field);
}

export function bool(v: unknown): boolean {
  return v === true || v === 'true' || v === 'on' || v === '1';
}
