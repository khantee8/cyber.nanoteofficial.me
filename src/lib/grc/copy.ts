import type { ControlStatusValue } from './types';
import type { TestingStatus } from './nist-csf-2/types';

export interface IsoStatusCopy { controlId: string; status: ControlStatusValue; justification: string | null; owner: string | null; evidenceUrls: string[] }
export interface CsfScoreCopy {
  subcategoryId: string; current: number | null; target: number | null; inScope: boolean; owner: string | null; notes: string | null; evidenceUrls: string[];
  testingStatus: TestingStatus; examined: boolean; interviewed: boolean; tested: boolean; observedAt: string | null;
}

/** ISO carries over as the new year's baseline, unchanged. */
export function planIsoCopy(rows: IsoStatusCopy[]): IsoStatusCopy[] {
  return rows.map((r) => ({ ...r, evidenceUrls: [...r.evidenceUrls] }));
}

/** CSF carries over scores and context; fieldwork belongs to the new year and is reset. */
export function planCsfCopy(rows: CsfScoreCopy[]): CsfScoreCopy[] {
  return rows.map((r) => ({
    ...r, evidenceUrls: [...r.evidenceUrls],
    testingStatus: 'not_started', examined: false, interviewed: false, tested: false, observedAt: null,
  }));
}
