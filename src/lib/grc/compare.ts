import { ISO27001_CONTROLS } from './iso27001/catalogue';
import { compliance, complianceByTheme, type Compliance, type StatusRow } from './iso27001/score';
import type { ControlStatusValue, Theme } from './types';
import { CSF_FUNCTIONS, CSF_SUBCATEGORIES } from './nist-csf-2/catalogue';
import { gap, summary, type CsfSummary } from './nist-csf-2/score';
import type { CsfFunctionId, CsfScoreRow } from './nist-csf-2/types';

const RANK: Record<Exclude<ControlStatusValue, 'not_applicable'>, number> = { not_started: 0, partial: 1, implemented: 2 };

export interface IsoCompare {
  a: Compliance; b: Compliance;
  byTheme: Record<Theme, { a: number; b: number; delta: number }>;
  transitions: { controlId: string; from: ControlStatusValue; to: ControlStatusValue; direction: 'improved' | 'regressed' | 'changed' }[];
  counts: { improved: number; regressed: number; unchanged: number };
}

export function compareIso(a: StatusRow[], b: StatusRow[]): IsoCompare {
  const am = new Map(a.map((r) => [r.controlId, r.status]));
  const bm = new Map(b.map((r) => [r.controlId, r.status]));
  const transitions: IsoCompare['transitions'] = [];
  let unchanged = 0;
  for (const c of ISO27001_CONTROLS) {
    const from = am.get(c.id) ?? 'not_started';
    const to = bm.get(c.id) ?? 'not_started';
    if (from === to) { unchanged++; continue; }
    const direction = from === 'not_applicable' || to === 'not_applicable' ? 'changed' : RANK[to] > RANK[from] ? 'improved' : 'regressed';
    transitions.push({ controlId: c.id, from, to, direction });
  }
  const ta = complianceByTheme(a, ISO27001_CONTROLS);
  const tb = complianceByTheme(b, ISO27001_CONTROLS);
  const byTheme = Object.fromEntries((Object.keys(ta) as Theme[]).map((t) => [t, { a: ta[t].pct, b: tb[t].pct, delta: tb[t].pct - ta[t].pct }])) as IsoCompare['byTheme'];
  return {
    a: compliance(a, ISO27001_CONTROLS), b: compliance(b, ISO27001_CONTROLS), byTheme, transitions,
    counts: { improved: transitions.filter((t) => t.direction === 'improved').length, regressed: transitions.filter((t) => t.direction === 'regressed').length, unchanged },
  };
}

export interface CsfCompare {
  byFunction: { fn: CsfFunctionId; a: CsfSummary; b: CsfSummary }[];
  changes: { id: string; aGap: number | null; bGap: number | null; kind: 'closed' | 'opened' | 'changed' }[];
}

export function compareCsf(a: CsfScoreRow[], b: CsfScoreRow[]): CsfCompare {
  const byFunction = CSF_FUNCTIONS.map((f) => {
    const ids = CSF_SUBCATEGORIES.filter((s) => s.fn === f.id).map((s) => s.id);
    return { fn: f.id, a: summary(a, ids), b: summary(b, ids) };
  });
  const am = new Map(a.map((r) => [r.subcategoryId, r]));
  const bm = new Map(b.map((r) => [r.subcategoryId, r]));
  const changes: CsfCompare['changes'] = [];
  for (const s of CSF_SUBCATEGORIES) {
    const ra = am.get(s.id); const rb = bm.get(s.id);
    if (ra?.inScope === false || rb?.inScope === false) continue;
    const aGap = ra ? gap(ra) : null; const bGap = rb ? gap(rb) : null;
    if (aGap !== null && aGap > 0 && bGap === 0) changes.push({ id: s.id, aGap, bGap, kind: 'closed' });
    else if ((aGap === 0 || aGap === null) && bGap !== null && bGap > 0) changes.push({ id: s.id, aGap, bGap, kind: 'opened' });
    else if (aGap !== null && bGap !== null && aGap > 0 && bGap > 0 && aGap !== bGap) changes.push({ id: s.id, aGap, bGap, kind: 'changed' });
  }
  return { byFunction, changes };
}
