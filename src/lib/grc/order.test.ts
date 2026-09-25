import { describe, expect, it } from 'vitest';
import { byChronologyDesc } from './order';

const a = (fiscalYear: number | null, createdAt: string) => ({ fiscalYear, createdAt: new Date(createdAt) });

describe('byChronologyDesc', () => {
  it('orders by fiscal year descending regardless of createdAt/updatedAt', () => {
    const older = a(2025, '2026-06-01');
    const newer = a(2027, '2026-01-01'); // created earlier, but the later fiscal year
    expect([older, newer].sort(byChronologyDesc)).toEqual([newer, older]);
  });

  it('breaks a fiscal-year tie by createdAt descending', () => {
    const first = a(2026, '2026-01-01');
    const second = a(2026, '2026-06-01');
    expect([first, second].sort(byChronologyDesc)).toEqual([second, first]);
  });

  it('treats a null fiscal year as the oldest', () => {
    const dated = a(2020, '2020-01-01');
    const undated = a(null, '2026-01-01'); // created most recently, but no fiscal year
    expect([undated, dated].sort(byChronologyDesc)).toEqual([dated, undated]);
  });
});
