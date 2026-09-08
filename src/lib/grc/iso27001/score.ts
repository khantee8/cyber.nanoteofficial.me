import type { Lang } from '@/lib/lang';
import type { Control, ControlStatusValue, Theme } from '../types';

export interface StatusRow {
  controlId: string;
  status: ControlStatusValue;
  justification: string | null;
  owner: string | null;
}

export interface Methodology {
  lowMax: number;      // score ≤ lowMax → low
  mediumMax: number;   // ≤ mediumMax → medium
  highMax: number;     // ≤ highMax → high, above → critical
  acceptMax: number;   // residual score ≤ acceptMax may be accepted
}

export const DEFAULT_METHODOLOGY: Methodology = { lowMax: 4, mediumMax: 9, highMax: 15, acceptMax: 4 };

export interface Compliance {
  total: number;
  applicable: number;
  implemented: number;
  partial: number;
  notStarted: number;
  notApplicable: number;
  /** (implemented + 0.5 × partial) / applicable, 0 when nothing is applicable */
  pct: number;
}

function statusMap(rows: StatusRow[]): Map<string, StatusRow> {
  return new Map(rows.map((r) => [r.controlId, r]));
}

export function compliance(rows: StatusRow[], catalogue: Control[]): Compliance {
  const m = statusMap(rows);
  let implemented = 0, partial = 0, notStarted = 0, notApplicable = 0;
  for (const c of catalogue) {
    const s = m.get(c.id)?.status ?? 'not_started';
    if (s === 'implemented') implemented++;
    else if (s === 'partial') partial++;
    else if (s === 'not_applicable') notApplicable++;
    else notStarted++;
  }
  const applicable = catalogue.length - notApplicable;
  return {
    total: catalogue.length,
    applicable, implemented, partial, notStarted, notApplicable,
    pct: applicable === 0 ? 0 : (implemented + 0.5 * partial) / applicable,
  };
}

export function complianceByTheme(rows: StatusRow[], catalogue: Control[]): Record<Theme, Compliance> {
  const out = {} as Record<Theme, Compliance>;
  for (const theme of ['organisational', 'people', 'physical', 'technological'] as Theme[]) {
    out[theme] = compliance(rows, catalogue.filter((c) => c.theme === theme));
  }
  return out;
}

export type Band = 'low' | 'medium' | 'high' | 'critical';

export function riskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function riskBand(score: number, m: Methodology = DEFAULT_METHODOLOGY): Band {
  if (score <= m.lowMax) return 'low';
  if (score <= m.mediumMax) return 'medium';
  if (score <= m.highMax) return 'high';
  return 'critical';
}

export const bandColor: Record<Band, string> = {
  low: 'var(--sev-low)',
  medium: 'var(--sev-medium)',
  high: 'var(--sev-high)',
  critical: 'var(--sev-critical)',
};

/** 5×5 counts, indexed [impact-1][likelihood-1]. */
export function heatmap(risks: { likelihood: number; impact: number }[]): number[][] {
  const grid = Array.from({ length: 5 }, () => Array<number>(5).fill(0));
  for (const r of risks) {
    const i = Math.min(5, Math.max(1, Math.round(r.impact))) - 1;
    const l = Math.min(5, Math.max(1, Math.round(r.likelihood))) - 1;
    grid[i][l] += 1;
  }
  return grid;
}

export interface SoaRow {
  controlId: string;
  applicable: boolean;
  status: ControlStatusValue;
  justification: string;
  owner: string;
}

/**
 * Statement of Applicability. Every control appears once. A control marked
 * not applicable without a written justification is reported, because an
 * auditor will ask for it and the export must not silently ship a blank.
 */
export function buildSoa(catalogue: Control[], rows: StatusRow[]): { rows: SoaRow[]; missingJustification: string[] } {
  const m = statusMap(rows);
  const out: SoaRow[] = [];
  const missing: string[] = [];
  for (const c of catalogue) {
    const r = m.get(c.id);
    const status = r?.status ?? 'not_started';
    const justification = r?.justification?.trim() ?? '';
    const applicable = status !== 'not_applicable';
    if (!applicable && !justification) missing.push(c.id);
    out.push({ controlId: c.id, applicable, status, justification, owner: r?.owner?.trim() ?? '' });
  }
  return { rows: out, missingJustification: missing };
}

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export const STATUS_LABEL: Record<ControlStatusValue, { en: string; th: string }> = {
  not_started: { en: 'Not started', th: 'ยังไม่เริ่ม' },
  partial: { en: 'Partially implemented', th: 'ดำเนินการบางส่วน' },
  implemented: { en: 'Implemented', th: 'ดำเนินการแล้ว' },
  not_applicable: { en: 'Not applicable', th: 'ไม่เกี่ยวข้อง' },
};

export function soaCsv(rows: SoaRow[], catalogue: Control[], lang: Lang): string {
  const byId = new Map(catalogue.map((c) => [c.id, c]));
  const header = lang === 'th'
    ? ['รหัส', 'ชื่อการควบคุม', 'กลุ่ม', 'เกี่ยวข้อง', 'สถานะ', 'เหตุผล', 'ผู้รับผิดชอบ']
    : ['Control', 'Title', 'Theme', 'Applicable', 'Status', 'Justification', 'Owner'];
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    const c = byId.get(r.controlId);
    lines.push([
      r.controlId,
      c?.title[lang] ?? '',
      c?.theme ?? '',
      r.applicable ? (lang === 'th' ? 'ใช่' : 'Yes') : (lang === 'th' ? 'ไม่' : 'No'),
      STATUS_LABEL[r.status][lang],
      r.justification,
      r.owner,
    ].map(csvCell).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}
