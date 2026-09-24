import { describe, expect, it } from 'vitest';
import { ValidationError, bool, halfStep, isoDate, optionalTier } from './validate';

describe('halfStep', () => {
  it('accepts null-ish and multiples of 0.5 from 0 to 10', () => {
    expect(halfStep('')).toBeNull(); expect(halfStep(null)).toBeNull(); expect(halfStep(undefined)).toBeNull();
    expect(halfStep('4.5')).toBe(4.5); expect(halfStep(0)).toBe(0); expect(halfStep(10)).toBe(10);
  });
  it('accepts whitespace-trimmed strings', () => {
    expect(halfStep(' 4.5 ')).toBe(4.5);
  });
  it('rejects other values', () => {
    for (const v of ['4.25', '10.5', '-0.5', 'abc', 11]) expect(() => halfStep(v), String(v)).toThrow(ValidationError);
  });
  it('rejects non-numeric input: booleans, arrays, special numbers', () => {
    for (const v of [true, false, [], [4.5], Infinity, NaN]) expect(() => halfStep(v), String(v)).toThrow(ValidationError);
  });
});

describe('optionalTier', () => {
  it('accepts 1–4 or empty', () => {
    expect(optionalTier('')).toBeNull(); expect(optionalTier('3')).toBe(3);
    expect(() => optionalTier('5')).toThrow(ValidationError); expect(() => optionalTier('0')).toThrow(ValidationError);
  });
});

describe('isoDate', () => {
  const today = new Date('2026-09-23T12:00:00Z');
  it('accepts real past or present dates', () => {
    expect(isoDate('', 'd', today)).toBeNull();
    expect(isoDate('2026-09-23', 'd', today)).toBe('2026-09-23');
    expect(isoDate('2026-02-28', 'd', today)).toBe('2026-02-28');
  });
  it('rejects malformed, impossible and future dates', () => {
    for (const v of ['2026-9-1', '2026-02-30', '2026-09-24', 'yesterday']) expect(() => isoDate(v, 'd', today), v).toThrow(ValidationError);
  });
  it('treats "today" as the Asia/Bangkok calendar day, not the UTC day', () => {
    // 2026-09-23T20:00Z is already 2026-09-24 03:00 ICT (UTC+7) — a Thai user should
    // be able to enter today's local date, not have it rejected as "in the future".
    const lateUtc = new Date('2026-09-23T20:00:00Z');
    expect(isoDate('2026-09-24', 'd', lateUtc)).toBe('2026-09-24');
    expect(() => isoDate('2026-09-25', 'd', lateUtc)).toThrow(ValidationError);
  });
});

describe('bool', () => {
  it('reads checkbox and JSON booleans', () => {
    expect(bool(true)).toBe(true); expect(bool('on')).toBe(true); expect(bool('true')).toBe(true); expect(bool('1')).toBe(true);
    expect(bool(false)).toBe(false); expect(bool(null)).toBe(false); expect(bool('')).toBe(false);
  });
});
