import 'server-only';

/**
 * Minimal Resend sender shared by the access-request flow. Never throws: a
 * notification failure must not turn a successful request into an error.
 * Returns false (and logs) when the key is missing or Resend rejects the send.
 */
export async function sendMail(input: { to: string | string[]; subject: string; text: string; html: string }): Promise<boolean> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_RESEND_FROM ?? 'NaNote Cyber <cyber@nanoteofficial.me>';
  if (!apiKey) {
    console.error('sendMail: AUTH_RESEND_KEY is not set');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text, html: input.html, headers: { 'X-Entity-Ref-ID': crypto.randomUUID() } }),
    });
    if (!res.ok) {
      console.error(`sendMail: Resend ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendMail failed', err);
    return false;
  }
}

export const SITE_URL = 'https://cyber.nanoteofficial.me';

export function adminEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shell(body: string): string {
  return `<!doctype html><html lang="en"><body style="margin:0;padding:24px;background:#070B14;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E6EAF2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto"><tr><td>${body}
<p style="margin:0;padding-top:20px;border-top:1px solid #1f2937;font-size:12px;line-height:1.6;color:#5C6478">NaNote Cyber · cyber.nanoteofficial.me</p>
</td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:0 0 24px"><a href="${href}" style="display:inline-block;padding:12px 22px;background:#3DDC97;color:#052616;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600">${label}</a></p>`;

/** Tell the admins someone asked for access. */
export function newRequestMail(email: string, message: string | null) {
  const adminUrl = `${SITE_URL}/admin`;
  const subject = `Access request: ${email}`;
  const text = [`${email} requested access to NaNote Cyber.`, '', message ? `Message: ${message}` : 'No message.', '', `Approve or reject: ${adminUrl}`].join('\n');
  const html = shell(
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.6"><strong>${esc(email)}</strong> requested access to NaNote Cyber.</p>` +
    `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#8B94A7">${message ? esc(message) : 'No message.'}</p>` +
    button(adminUrl, 'Open admin'),
  );
  return { subject, text, html };
}

/** Tell a requester they were approved and where to sign in. Bilingual. */
export function approvedMail() {
  const signin = `${SITE_URL}/signin`;
  const subject = 'Your NaNote Cyber access is approved · อนุมัติการเข้าใช้แล้ว';
  const text = [
    'Your request to access NaNote Cyber has been approved.', '',
    `Sign in with this email address to receive a one-time link: ${signin}`, '',
    'คำขอเข้าใช้ NaNote Cyber ของคุณได้รับอนุมัติแล้ว', `เข้าสู่ระบบด้วยอีเมลนี้เพื่อรับลิงก์ใช้ครั้งเดียว: ${signin}`,
  ].join('\n');
  const html = shell(
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.6">Your request to access <strong>NaNote Cyber</strong> has been approved. Sign in with this email address and a one-time link is sent to you.</p>` +
    `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#8B94A7">คำขอเข้าใช้ NaNote Cyber ของคุณได้รับอนุมัติแล้ว เข้าสู่ระบบด้วยอีเมลนี้เพื่อรับลิงก์ใช้ครั้งเดียว</p>` +
    button(signin, 'Sign in · เข้าสู่ระบบ'),
  );
  return { subject, text, html };
}
