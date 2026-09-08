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

  // sign-in
  'signin.title':      { en: 'Sign in',   th: 'เข้าสู่ระบบ' },
  'signin.lede':       { en: 'There is no password. Enter the email your account was approved under and a one-time sign-in link is sent to it.',
                         th: 'ที่นี่ไม่มีรหัสผ่าน กรอกอีเมลที่บัญชีของคุณได้รับอนุมัติไว้ แล้วระบบจะส่งลิงก์เข้าสู่ระบบแบบใช้ครั้งเดียวไปให้' },
  'signin.emailLabel': { en: 'Email address', th: 'อีเมล' },
  'signin.submit':     { en: 'Send sign-in link', th: 'ส่งลิงก์เข้าสู่ระบบ' },
  'signin.sentTitle':  { en: 'Check your inbox', th: 'ตรวจสอบกล่องจดหมายของคุณ' },
  'signin.sentP1':     { en: 'If that address is approved, a sign-in link is on its way. It works once and expires in 24 hours.',
                         th: 'หากอีเมลนั้นได้รับอนุมัติแล้ว ลิงก์เข้าสู่ระบบกำลังถูกส่งไป ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง' },
  'signin.sentP2':     { en: 'Nothing arrived after a few minutes? Check spam, or', th: 'ยังไม่ได้รับหลังผ่านไปสักครู่? ตรวจสอบโฟลเดอร์สแปม หรือ' },
  'signin.tryAgain':   { en: 'try again', th: 'ลองอีกครั้ง' },
  'signin.errConfig':  { en: 'Sign-in is not configured on this deployment. This is on our side, not yours.',
                         th: 'การเข้าสู่ระบบยังไม่ได้ตั้งค่าบนระบบนี้ ปัญหาอยู่ที่ฝั่งเรา ไม่ใช่คุณ' },
  'signin.errFailed':  { en: 'That link could not be used. Links work once and expire after 24 hours; request a new one.',
                         th: 'ใช้ลิงก์นั้นไม่ได้ ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง กรุณาขอลิงก์ใหม่' },
  'signin.noAccount':  { en: 'No account yet?', th: 'ยังไม่มีบัญชี?' },
  'signin.request':    { en: 'Request access', th: 'ขอสิทธิ์เข้าใช้งาน' },

  // pending
  'pending.eyebrow':   { en: 'Access', th: 'สิทธิ์การเข้าใช้' },
  'pending.title':     { en: 'Your account is not approved yet', th: 'บัญชีของคุณยังไม่ได้รับอนุมัติ' },
  'pending.p1':        { en: 'Sign-in worked, but this email has not been approved for the platform. Accounts are reviewed one at a time.',
                         th: 'เข้าสู่ระบบสำเร็จ แต่อีเมลนี้ยังไม่ได้รับอนุมัติให้ใช้แพลตฟอร์ม บัญชีจะได้รับการพิจารณาทีละราย' },
  'pending.p2':        { en: 'If you have not asked yet, send a request from the front page. If you have, there is nothing more to do.',
                         th: 'หากยังไม่ได้ส่งคำขอ ส่งได้จากหน้าแรก หากส่งแล้ว ไม่ต้องทำอะไรเพิ่ม' },
  'pending.backToSignIn': { en: 'Back to sign in', th: 'กลับไปหน้าเข้าสู่ระบบ' },

  // access form
  'access.title':      { en: 'Request access', th: 'ขอสิทธิ์เข้าใช้งาน' },
  'access.lede':       { en: 'The GRC workspace and everything behind sign-in is invite-only. Leave an email and a line about your organisation; approvals are manual.',
                         th: 'พื้นที่ทำงาน GRC และทุกอย่างหลังการเข้าสู่ระบบเปิดให้เฉพาะผู้ได้รับเชิญ ฝากอีเมลและบอกสั้น ๆ เกี่ยวกับองค์กรของคุณ การอนุมัติทำด้วยมือ' },
  'access.emailLabel': { en: 'Work email', th: 'อีเมลที่ทำงาน' },
  'access.messageHint':{ en: 'Who you are and what you want to use (optional)', th: 'คุณเป็นใคร และต้องการใช้อะไร (ไม่บังคับ)' },
  'access.sending':    { en: 'Sending…', th: 'กำลังส่ง…' },
  'access.submit':     { en: 'Request access', th: 'ส่งคำขอ' },
  'access.received':   { en: 'Request received. Once approved, a sign-in link can be requested from the sign-in page.',
                         th: 'ได้รับคำขอแล้ว เมื่ออนุมัติแล้ว ขอลิงก์เข้าสู่ระบบได้จากหน้าเข้าสู่ระบบ' },
  'access.invalidEmail': { en: 'Enter a valid email address.', th: 'กรอกอีเมลให้ถูกต้อง' },
  'access.rate':       { en: 'Too many requests from this network. Try again later.', th: 'มีคำขอจากเครือข่ายนี้มากเกินไป ลองใหม่ภายหลัง' },
  'access.failed':     { en: 'Something went wrong on our side. Try again later.', th: 'เกิดข้อผิดพลาดฝั่งเรา ลองใหม่ภายหลัง' },
  'access.already':    { en: 'Already approved?', th: 'ได้รับอนุมัติแล้ว?' },

  // admin
  'admin.title':       { en: 'Access requests', th: 'คำขอเข้าใช้งาน' },
  'admin.noRequests':  { en: 'No requests yet.', th: 'ยังไม่มีคำขอ' },
  'admin.approve':     { en: 'Approve', th: 'อนุมัติ' },
  'admin.reject':      { en: 'Reject', th: 'ปฏิเสธ' },
  'admin.statusPending':  { en: 'Pending', th: 'รอดำเนินการ' },
  'admin.statusApproved': { en: 'Approved', th: 'อนุมัติแล้ว' },
  'admin.statusRejected': { en: 'Rejected', th: 'ปฏิเสธแล้ว' },
  'admin.users':       { en: 'Users', th: 'ผู้ใช้' },
  'admin.approvedOn':  { en: 'approved {date}', th: 'อนุมัติเมื่อ {date}' },
  'admin.notApproved': { en: 'not approved', th: 'ยังไม่อนุมัติ' },
} as const;

export type Key = keyof typeof dict;

/** Translate. `vars` fills {placeholders}. */
export function t(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s: string = dict[key][lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
