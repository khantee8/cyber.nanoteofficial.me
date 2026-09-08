import type { LStr } from '@/lib/i18n';

export type Theme = 'organisational' | 'people' | 'physical' | 'technological';
export type ControlType = 'preventive' | 'detective' | 'corrective';
export type Cia = 'C' | 'I' | 'A';
export type Concept = 'identify' | 'protect' | 'detect' | 'respond' | 'recover';

export interface Control {
  id: string;            // "5.1" … "8.34"
  theme: Theme;
  title: LStr;
  /** One line in our own words — never the standard's text. */
  summary: LStr;
  type: ControlType[];
  cia: Cia[];
  concept: Concept[];
  /** ISO 27002:2022 operational capability tags */
  domains: string[];
}

export type ControlStatusValue = 'not_started' | 'partial' | 'implemented' | 'not_applicable';
export const CONTROL_STATUSES: ControlStatusValue[] = ['not_started', 'partial', 'implemented', 'not_applicable'];

export type Treatment = 'mitigate' | 'accept' | 'transfer' | 'avoid';
export const TREATMENTS: Treatment[] = ['mitigate', 'accept', 'transfer', 'avoid'];
export type RiskStatus = 'open' | 'in_treatment' | 'closed';
export const RISK_STATUSES: RiskStatus[] = ['open', 'in_treatment', 'closed'];
