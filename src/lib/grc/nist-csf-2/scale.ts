import type { CsfBand } from './types';

export const SCORE_STEPS: number[] = Array.from({ length: 21 }, (_, i) => i / 2);

export function band(score: number): CsfBand {
  if (score < 2) return 'insecure';
  if (score < 5) return 'some';
  if (score < 6) return 'minimal';
  if (score < 7) return 'effective';
  if (score < 8) return 'optimised';
  return 'excessive';
}

export const bandColor: Record<CsfBand, string> = {
  insecure: 'var(--sev-critical)',
  some: 'var(--sev-high)',
  minimal: 'var(--sev-medium)',
  effective: 'var(--accent)',
  optimised: 'var(--accent)',
  excessive: 'var(--sev-low)',
};
