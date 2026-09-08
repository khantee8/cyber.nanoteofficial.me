import type { LStr } from '@/lib/i18n';
import type { Control } from './types';
import { ISO27001_CONTROLS } from './iso27001/catalogue';

export type FrameworkSlug = 'iso27001';

export interface Framework {
  slug: FrameworkSlug;
  name: LStr;
  version: string;
  blurb: LStr;
  catalogue: Control[];
  status: 'available';
  href: string;
}

/** Frameworks with a working workspace. Adding one = adding an entry here plus its routes. */
export const frameworks: Framework[] = [
  {
    slug: 'iso27001',
    name: { en: 'ISO/IEC 27001', th: 'ISO/IEC 27001' },
    version: '2022',
    blurb: {
      en: 'Information security management system: 93 Annex A controls, gap assessment, risk register, Statement of Applicability.',
      th: 'ระบบบริหารความมั่นคงปลอดภัยสารสนเทศ: การควบคุม Annex A 93 ข้อ การประเมินช่องว่าง ทะเบียนความเสี่ยง Statement of Applicability',
    },
    catalogue: ISO27001_CONTROLS,
    status: 'available',
    href: '/grc/iso27001',
  },
];

export const plannedFrameworks: { slug: string; name: LStr; blurb: LStr }[] = [
  {
    slug: 'nist-csf-2',
    name: { en: 'NIST CSF 2.0', th: 'NIST CSF 2.0' },
    blurb: {
      en: 'Maturity assessment across Govern, Identify, Protect, Detect, Respond and Recover, with tiered questions by organisation size.',
      th: 'การประเมินวุฒิภาวะครอบคลุม Govern, Identify, Protect, Detect, Respond และ Recover พร้อมคำถามแบ่งระดับตามขนาดองค์กร',
    },
  },
  {
    slug: 'craf',
    name: { en: 'Cyber Resilience Assessment', th: 'การประเมินความยืดหยุ่นไซเบอร์' },
    blurb: {
      en: 'Resilience-focused assessment for regulated sectors, mapped back to ISO 27001 and CSF controls.',
      th: 'การประเมินที่เน้นความยืดหยุ่นสำหรับภาคธุรกิจที่ถูกกำกับ เชื่อมโยงกลับไปยังการควบคุมของ ISO 27001 และ CSF',
    },
  },
];

export function frameworkBySlug(slug: string): Framework | undefined {
  return frameworks.find((f) => f.slug === slug);
}
