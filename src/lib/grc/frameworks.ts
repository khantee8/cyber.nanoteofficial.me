import type { LStr } from '@/lib/i18n';

export type FrameworkSlug = 'iso27001' | 'nist-csf-2';

export interface Framework {
  slug: FrameworkSlug;
  name: LStr;
  version: string;
  blurb: LStr;
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
    status: 'available',
    href: '/grc/iso27001',
  },
  {
    slug: 'nist-csf-2',
    name: { en: 'NIST CSF 2.0', th: 'NIST CSF 2.0' },
    version: '2.0',
    blurb: {
      en: 'Organisational Profile: Current and Target for all 106 subcategories, gaps by Function and Category, cross-referenced to your ISO 27001 assessment.',
      th: 'โปรไฟล์องค์กร: คะแนนปัจจุบันและเป้าหมายของหัวข้อย่อยทั้ง 106 ข้อ ช่องว่างรายฟังก์ชันและรายหมวด เชื่อมโยงกับการประเมิน ISO 27001 ของคุณ',
    },
    status: 'available',
    href: '/grc/nist-csf-2',
  },
];

export const plannedFrameworks: { slug: string; name: LStr; blurb: LStr }[] = [
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
