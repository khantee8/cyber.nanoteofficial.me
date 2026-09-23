/**
 * NIST CSF 2.0 Core. English text is NIST's own (CSF 2.0 is a US Government work
 * and in the public domain), unlike the ISO catalogue, whose text is copyrighted
 * and therefore paraphrased. Thai is our unofficial translation. The ISO mapping
 * is NIST's informative reference ISO/IEC 27001:2022 → CSF 2.0 and carries only
 * Annex A identifiers. Regenerate English with `npm run csf:import`.
 */
import raw from './catalogue.data.json';
import th from './catalogue.th.json';
import type { CsfCategory, CsfFunction, CsfFunctionId, CsfSubcategory, RawCatalogue } from './types';

const data = raw as RawCatalogue;
type Th = {
  functions: Record<string, { title: string; text: string }>;
  categories: Record<string, { title: string; text: string }>;
  subcategories: Record<string, string>;
  examples: Record<string, string>;
};
const T = th as Th;

export const CSF_SOURCE = data.source;

export const CSF_FUNCTIONS: CsfFunction[] = data.functions.map((f) => ({
  id: f.id,
  name: { en: f.title, th: T.functions[f.id]?.title ?? '' },
  text: { en: f.text, th: T.functions[f.id]?.text ?? '' },
}));

export const CSF_CATEGORIES: CsfCategory[] = data.categories.map((c) => ({
  id: c.id, fn: c.fn,
  name: { en: c.title, th: T.categories[c.id]?.title ?? '' },
  text: { en: c.text, th: T.categories[c.id]?.text ?? '' },
}));

export const CSF_SUBCATEGORIES: CsfSubcategory[] = data.subcategories.map((s) => ({
  id: s.id, category: s.category, fn: s.fn,
  text: { en: s.text, th: T.subcategories[s.id] ?? '' },
  examples: s.examples.map((e) => ({ id: e.id, text: { en: e.text, th: T.examples[e.id] ?? '' } })),
  iso27001: s.iso27001,
}));

export const CSF_BY_ID: Record<string, CsfSubcategory> = Object.fromEntries(CSF_SUBCATEGORIES.map((s) => [s.id, s]));
export const CSF_CATEGORY_BY_ID: Record<string, CsfCategory> = Object.fromEntries(CSF_CATEGORIES.map((c) => [c.id, c]));
export const CSF_FUNCTION_BY_ID = Object.fromEntries(CSF_FUNCTIONS.map((f) => [f.id, f])) as Record<CsfFunctionId, CsfFunction>;
export const CSF_IDS = new Set(CSF_SUBCATEGORIES.map((s) => s.id));
