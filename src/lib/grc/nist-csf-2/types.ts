import type { LStr } from '@/lib/i18n';

export type CsfFunctionId = 'GV' | 'ID' | 'PR' | 'DE' | 'RS' | 'RC';
export const CSF_FUNCTION_IDS: CsfFunctionId[] = ['GV', 'ID', 'PR', 'DE', 'RS', 'RC'];

export type TestingStatus = 'not_started' | 'in_progress' | 'complete';
export const TESTING_STATUSES: TestingStatus[] = ['not_started', 'in_progress', 'complete'];

export type CsfBand = 'insecure' | 'some' | 'minimal' | 'effective' | 'optimised' | 'excessive';
export const CSF_BANDS: CsfBand[] = ['insecure', 'some', 'minimal', 'effective', 'optimised', 'excessive'];

export type FunctionRating = 'satisfactory' | 'needs_improvement' | 'unsatisfactory';

export interface CsfFunction { id: CsfFunctionId; name: LStr; text: LStr }
export interface CsfCategory { id: string; fn: CsfFunctionId; name: LStr; text: LStr }
export interface CsfExample { id: string; text: LStr }
export interface CsfSubcategory {
  id: string;            // "GV.OC-01"
  category: string;      // "GV.OC"
  fn: CsfFunctionId;
  text: LStr;
  examples: CsfExample[];
  /** ISO/IEC 27001:2022 Annex A control IDs ("5.20") from NIST's informative references. */
  iso27001: string[];
}

export interface CsfScoreRow { subcategoryId: string; current: number | null; target: number | null; inScope: boolean }

export interface RawCatalogue {
  source: { cprt: string; olir: string; generatedAt: string };
  functions: { id: CsfFunctionId; title: string; text: string }[];
  categories: { id: string; fn: CsfFunctionId; title: string; text: string }[];
  subcategories: {
    id: string; category: string; fn: CsfFunctionId; text: string;
    examples: { id: string; text: string }[];
    iso27001: string[];
  }[];
}
