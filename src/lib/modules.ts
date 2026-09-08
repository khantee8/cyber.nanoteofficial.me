import type { LStr } from './i18n';
import type { IconName } from '@/components/site/Icon';

export type ModuleStatus = 'live' | 'available' | 'design';

export interface ModuleDef {
  slug: 'intel' | 'grc' | 'redteam' | 'training';
  name: LStr;
  blurb: LStr;
  bullets: LStr[];
  status: ModuleStatus;
  href: string;
  icon: IconName;
  wide?: boolean;
  /** shown when the module needs an account */
  gated?: boolean;
}

export const modules: ModuleDef[] = [
  {
    slug: 'intel',
    name: { en: 'Threat Intel', th: 'ข่าวกรองภัยคุกคาม' },
    blurb: {
      en: 'A live operations view over public feeds: exploited CVEs with exploit probability, ransomware claims by country and sector, botnet command servers, the most attacked ports, and the headlines behind them.',
      th: 'มุมมองปฏิบัติการสดจากแหล่งข้อมูลสาธารณะ: CVE ที่ถูกโจมตีจริงพร้อมความน่าจะเป็น เหยื่อแรนซัมแวร์แยกตามประเทศและภาคธุรกิจ เซิร์ฟเวอร์ควบคุมบอตเน็ต พอร์ตที่ถูกโจมตีมากที่สุด และข่าวเบื้องหลัง',
    },
    bullets: [
      { en: 'CISA KEV joined with FIRST EPSS', th: 'CISA KEV ผนวกกับ FIRST EPSS' },
      { en: 'World map with ransomware and C2 layers', th: 'แผนที่โลกพร้อมเลเยอร์แรนซัมแวร์และ C2' },
      { en: 'Refreshes every 15 minutes, degrades gracefully', th: 'อัปเดตทุก 15 นาที ทำงานต่อได้แม้แหล่งข้อมูลล่ม' },
      { en: 'Public JSON API', th: 'JSON API สาธารณะ' },
    ],
    status: 'live',
    href: '/intel',
    icon: 'radar',
    wide: true,
  },
  {
    slug: 'grc',
    name: { en: 'GRC', th: 'GRC' },
    blurb: {
      en: 'An ISO/IEC 27001:2022 workspace you can run a real programme in: all 93 Annex A controls, gap assessment, a scored risk register, and a Statement of Applicability you can export.',
      th: 'พื้นที่ทำงาน ISO/IEC 27001:2022 ที่ใช้บริหารโปรแกรมจริงได้: การควบคุม Annex A ทั้ง 93 ข้อ การประเมินช่องว่าง ทะเบียนความเสี่ยงพร้อมคะแนน และ Statement of Applicability ที่ส่งออกได้',
    },
    bullets: [
      { en: 'ISO 27001 available now', th: 'ISO 27001 พร้อมใช้แล้ว' },
      { en: 'NIST CSF 2.0 and CRAF in design', th: 'NIST CSF 2.0 และ CRAF กำลังออกแบบ' },
      { en: 'Invite-only', th: 'เฉพาะผู้ได้รับเชิญ' },
    ],
    status: 'available',
    href: '/grc',
    icon: 'clipboard',
    gated: true,
  },
  {
    slug: 'redteam',
    name: { en: 'AI Red Teaming', th: 'AI Red Teaming' },
    blurb: {
      en: 'Adversarial testing of AI systems and AI-assisted testing of everything else: prompt-injection suites, model-behaviour probes, and attack-path simulation.',
      th: 'การทดสอบเชิงปฏิปักษ์กับระบบ AI และการทดสอบด้วย AI สำหรับระบบอื่น: ชุดทดสอบ prompt injection การตรวจสอบพฤติกรรมโมเดล และการจำลองเส้นทางโจมตี',
    },
    bullets: [
      { en: 'LLM application testing', th: 'ทดสอบแอปพลิเคชัน LLM' },
      { en: 'Attack-path simulation', th: 'จำลองเส้นทางโจมตี' },
    ],
    status: 'design',
    href: '/redteam',
    icon: 'flask',
  },
  {
    slug: 'training',
    name: { en: 'Training and Consulting', th: 'อบรมและที่ปรึกษา' },
    blurb: {
      en: 'Certification preparation, tabletop exercises, and hands-on ISMS implementation support from a practitioner.',
      th: 'เตรียมสอบใบรับรอง การฝึกซ้อมแบบ tabletop และการสนับสนุนการนำ ISMS ไปใช้จริงจากผู้ปฏิบัติงาน',
    },
    bullets: [
      { en: 'ISO 27001 Lead Implementer track', th: 'เส้นทาง ISO 27001 Lead Implementer' },
      { en: 'Incident tabletop exercises', th: 'ฝึกซ้อมรับมือเหตุการณ์' },
    ],
    status: 'design',
    href: '/training',
    icon: 'graduation',
  },
];
