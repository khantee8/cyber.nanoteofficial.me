import { describe, expect, it } from 'vitest';
import type { Assessment } from '@/db/schema';
import { pickIsoSource } from './isoSource';

type Row = Pick<Assessment, 'id' | 'framework' | 'fiscalYear' | 'updatedAt'>;

const a = (id: string, framework: string, fiscalYear: number | null, updatedAt: string): Row =>
  ({ id, framework, fiscalYear, updatedAt: new Date(updatedAt) });

describe('pickIsoSource', () => {
  it('prefers the most recently updated ISO assessment in the same fiscal year', () => {
    const rows = [
      a('iso-2026-old', 'iso27001', 2026, '2026-01-01'),
      a('iso-2026-new', 'iso27001', 2026, '2026-06-01'),
      a('iso-2025', 'iso27001', 2025, '2026-09-01'), // newer overall, wrong year
    ];
    expect(pickIsoSource(rows, 2026)).toBe('iso-2026-new');
  });

  it('falls back to the most recently updated ISO assessment overall when the fiscal year has none', () => {
    const rows = [
      a('iso-2024', 'iso27001', 2024, '2026-01-01'),
      a('iso-2025', 'iso27001', 2025, '2026-06-01'),
    ];
    expect(pickIsoSource(rows, 2026)).toBe('iso-2025');
  });

  it('falls back to the most recent ISO assessment when the target fiscal year is null', () => {
    const rows = [
      a('iso-2024', 'iso27001', 2024, '2026-01-01'),
      a('iso-2025', 'iso27001', 2025, '2026-06-01'),
    ];
    expect(pickIsoSource(rows, null)).toBe('iso-2025');
  });

  it('ignores non-ISO (CSF) assessments even when newer', () => {
    const rows = [
      a('csf-2026', 'nist-csf-2', 2026, '2026-09-01'),
      a('iso-2025', 'iso27001', 2025, '2026-01-01'),
    ];
    expect(pickIsoSource(rows, 2026)).toBe('iso-2025');
  });

  it('returns null when there is no ISO assessment', () => {
    expect(pickIsoSource([a('csf-2026', 'nist-csf-2', 2026, '2026-09-01')], 2026)).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(pickIsoSource([], null)).toBeNull();
  });
});
