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
