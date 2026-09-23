import type { CsfFunctionId, RawCatalogue } from '../types';
import { CSF_FUNCTION_IDS } from '../types';

type Parsed = Omit<RawCatalogue, 'source'>;
interface El { element_type: string; element_identifier: string; title?: string; text?: string }
interface Rel { source_element_identifier: string; dest_element_identifier: string }

function shape(msg: string): never { throw new Error(`CPRT shape mismatch: ${msg}`); }

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
const clean = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/** Numeric sort for ISO ids: 5.9 before 5.16. */
export function isoSort(a: string, b: string): number {
  const [a1, a2] = a.split('.').map(Number); const [b1, b2] = b.split('.').map(Number);
  return a1 - b1 || a2 - b2;
}

export function parseCprt(json: unknown): Parsed {
  const els = (json as { response?: { elements?: { elements?: unknown; relationships?: unknown } } } | null)?.response?.elements;
  if (!els || !Array.isArray(els.elements) || !Array.isArray(els.relationships)) shape('missing response.elements');
  const elements = els.elements as El[];
  const withdrawn = new Set((els.relationships as Rel[])
    .filter((r) => typeof r.dest_element_identifier === 'string' && r.dest_element_identifier.startsWith('WR-'))
    .map((r) => r.source_element_identifier));
  const active = (type: string) => elements.filter((e) => e.element_type === type && !withdrawn.has(e.element_identifier));

  const functions = active('function').map((e) => {
    if (!(CSF_FUNCTION_IDS as string[]).includes(e.element_identifier)) shape(`unknown function ${e.element_identifier}`);
    return { id: e.element_identifier as CsfFunctionId, title: titleCase(clean(e.title)), text: clean(e.text) };
  });
  const order = (id: string) => CSF_FUNCTION_IDS.indexOf(id.slice(0, 2) as CsfFunctionId);
  functions.sort((a, b) => order(a.id) - order(b.id));

  const categories = active('category').map((e) => {
    if (!/^[A-Z]{2}\.[A-Z]{2}$/.test(e.element_identifier)) shape(`bad category id ${e.element_identifier}`);
    return { id: e.element_identifier, fn: e.element_identifier.slice(0, 2) as CsfFunctionId, title: clean(e.title), text: clean(e.text) };
  });
  const catIndex = new Map(categories.map((c, i) => [c.id, i]));

  const examplesBySub = new Map<string, { id: string; text: string }[]>();
  for (const e of elements.filter((x) => x.element_type === 'implementation_example')) {
    const sub = e.element_identifier.replace(/\.\d{3}$/, '');
    const list = examplesBySub.get(sub) ?? [];
    list.push({ id: e.element_identifier, text: clean(e.text) });
    examplesBySub.set(sub, list);
  }

  const subcategories = active('subcategory').map((e) => {
    const id = e.element_identifier;
    if (!/^[A-Z]{2}\.[A-Z]{2}-\d{2}$/.test(id)) shape(`bad subcategory id ${id}`);
    const category = id.slice(0, 5);
    if (!catIndex.has(category)) shape(`subcategory ${id} has no active category`);
    const examples = (examplesBySub.get(id) ?? []).sort((a, b) => a.id.localeCompare(b.id));
    return { id, category, fn: id.slice(0, 2) as CsfFunctionId, text: clean(e.text), examples, iso27001: [] as string[] };
  });
  subcategories.sort((a, b) => order(a.id) - order(b.id) || catIndex.get(a.category)! - catIndex.get(b.category)! || a.id.localeCompare(b.id));
  categories.sort((a, b) => order(a.id) - order(b.id) || catIndex.get(a.id)! - catIndex.get(b.id)!);
  return { functions, categories, subcategories };
}

const ANNEX_A = /ISO\/IEC 27001:2022:\s*Annex A Controls:[ \t]*(?:A\.)?(\d+\.\d+)/g;

export function parseIsoRefs(rows: [string | null, string | null][]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [sub, refs] of rows) {
    const m = /^([A-Z]{2}\.[A-Z]{2}-\d{2}):/.exec((sub ?? '').trim());
    if (!m) continue;
    const ids = new Set<string>();
    for (const hit of (refs ?? '').matchAll(ANNEX_A)) ids.add(hit[1]);
    out[m[1]] = [...ids].sort(isoSort);
  }
  return out;
}

export function buildCatalogueData(cprt: Parsed, iso: Record<string, string[]>, validIso: Set<string>, source: RawCatalogue['source']) {
  const dropped: string[] = [];
  const subcategories = cprt.subcategories.map((s) => {
    const ids = (iso[s.id] ?? []).filter((x) => {
      if (validIso.has(x)) return true;
      dropped.push(`${s.id}→${x}`);
      return false;
    });
    return { ...s, iso27001: ids };
  });
  const data: RawCatalogue = { source, functions: cprt.functions, categories: cprt.categories, subcategories };
  return { data, dropped };
}
