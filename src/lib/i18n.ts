import type { Lang } from './lang';

/** A bilingual string. Every user-facing field in data files uses this. */
export type LStr = Record<Lang, string>;

export function pick(l: LStr, lang: Lang): string {
  return l[lang] ?? l.en;
}

const dict = {
  // chrome
  'nav.intel':        { en: 'Threat Intel',    th: 'ข่าวกรองภัยคุกคาม' },
  'nav.grc':          { en: 'GRC',             th: 'GRC' },
  'nav.redteam':      { en: 'AI Red Team',     th: 'AI Red Team' },
  'nav.training':     { en: 'Training',        th: 'อบรม' },
  'nav.signIn':       { en: 'Sign in',         th: 'เข้าสู่ระบบ' },
  'nav.signOut':      { en: 'Sign out',        th: 'ออกจากระบบ' },
  'nav.admin':        { en: 'Admin',           th: 'ผู้ดูแล' },
  'nav.workspace':    { en: 'Workspace',       th: 'พื้นที่ทำงาน' },
  'nav.menu':         { en: 'Menu',            th: 'เมนู' },
  'footer.sources':   { en: 'Data: CISA KEV · FIRST EPSS · ransomware.live · abuse.ch Feodo Tracker · SANS ISC · The Hacker News · BleepingComputer',
                        th: 'ข้อมูล: CISA KEV · FIRST EPSS · ransomware.live · abuse.ch Feodo Tracker · SANS ISC · The Hacker News · BleepingComputer' },
  'footer.built':     { en: 'Built by NaNote', th: 'สร้างโดย NaNote' },
  'footer.portfolio': { en: 'nanoteofficial.me', th: 'nanoteofficial.me' },
  'footer.refreshed': { en: 'Refreshed', th: 'อัปเดตล่าสุด' },

  // common
  'common.live':      { en: 'Live',            th: 'สด' },
  'common.stale':     { en: 'Stale',           th: 'ข้อมูลเก่า' },
  'common.down':      { en: 'Down',            th: 'ล่ม' },
  'common.available': { en: 'Available',       th: 'พร้อมใช้' },
  'common.inDesign':  { en: 'In design',       th: 'กำลังออกแบบ' },
  'common.open':      { en: 'Open',            th: 'เปิด' },
  'common.save':      { en: 'Save',            th: 'บันทึก' },
  'common.saving':    { en: 'Saving…',         th: 'กำลังบันทึก…' },
  'common.saved':     { en: 'Saved',           th: 'บันทึกแล้ว' },
  'common.cancel':    { en: 'Cancel',          th: 'ยกเลิก' },
  'common.delete':    { en: 'Delete',          th: 'ลบ' },
  'common.edit':      { en: 'Edit',            th: 'แก้ไข' },
  'common.back':      { en: 'Back',            th: 'กลับ' },
  'common.none':      { en: 'None',            th: 'ไม่มี' },
  'common.all':       { en: 'All',             th: 'ทั้งหมด' },
  'common.search':    { en: 'Search',          th: 'ค้นหา' },
  'common.loading':   { en: 'Loading…',        th: 'กำลังโหลด…' },
  'common.ago':       { en: '{t} ago',         th: '{t} ที่แล้ว' },
  'common.justNow':   { en: 'just now',        th: 'เมื่อสักครู่' },
  'common.error':     { en: 'Something went wrong. Try again.', th: 'เกิดข้อผิดพลาด ลองอีกครั้ง' },
  'common.source':    { en: 'Source',          th: 'แหล่งข้อมูล' },
  'common.unknown':   { en: 'Unknown',         th: 'ไม่ทราบ' },
  'common.version':   { en: 'Version',         th: 'เวอร์ชัน' },
} as const;

export type Key = keyof typeof dict;

/** Translate. `vars` fills {placeholders}. */
export function t(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s: string = dict[key][lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
