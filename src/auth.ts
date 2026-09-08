import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { users } from '@/db/schema';

const allowed = (process.env.ALLOWED_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const baseAdapter = DrizzleAdapter(db, {
  usersTable: schema.users,
  accountsTable: schema.accounts,
  sessionsTable: schema.sessions,
  verificationTokensTable: schema.verificationTokens,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: baseAdapter,
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_RESEND_FROM ?? 'NaNote Cyber <noreply@nanoteofficial.me>',
      /**
       * The default Auth.js email is a single link in bare HTML with no plain-text
       * part, which Gmail scores as spam — especially from a young domain. This
       * sends a real multipart message, in the recipient's language, with a
       * unique X-Entity-Ref-ID so Gmail does not collapse repeat requests into
       * one thread (collapsing makes them look like bulk mail).
       */
      async sendVerificationRequest({ identifier, url, provider, request }) {
        const cookie = request?.headers?.get('cookie') ?? '';
        const th = /(?:^|;\s*)lang=th(?:;|$)/.test(cookie);

        const subject = th
          ? 'ลิงก์เข้าสู่ระบบ NaNote Cyber ของคุณ'
          : 'Your NaNote Cyber sign-in link';

        const text = th
          ? [
              'สวัสดี',
              '',
              'กดลิงก์ด้านล่างเพื่อเข้าสู่ระบบ NaNote Cyber ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง',
              '',
              url,
              '',
              'หากคุณไม่ได้ขอลิงก์นี้ ให้ละเว้นอีเมลฉบับนี้ได้เลย ไม่มีสิ่งใดเปลี่ยนแปลงในบัญชีของคุณ',
              '',
              'NaNote Cyber — cyber.nanoteofficial.me',
            ].join('\n')
          : [
              'Hello,',
              '',
              'Use the link below to sign in to NaNote Cyber. It works once and expires in 24 hours.',
              '',
              url,
              '',
              'If you did not ask for this link you can ignore this email — nothing about your account has changed.',
              '',
              'NaNote Cyber — cyber.nanoteofficial.me',
            ].join('\n');

        const html = `<!doctype html><html lang="${th ? 'th' : 'en'}"><body style="margin:0;padding:24px;background:#070B14;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E6EAF2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto"><tr><td>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6">${th ? 'กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ <strong>NaNote Cyber</strong> ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง' : 'Use the button below to sign in to <strong>NaNote Cyber</strong>. It works once and expires in 24 hours.'}</p>
<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;padding:12px 22px;background:#3DDC97;color:#052616;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600">${th ? 'เข้าสู่ระบบ' : 'Sign in'}</a></p>
<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#8B94A7">${th ? 'หากปุ่มใช้งานไม่ได้ ให้คัดลอกที่อยู่นี้ไปวางในเบราว์เซอร์:' : 'If the button does not work, copy this address into your browser:'}<br><span style="word-break:break-all;color:#3DDC97">${url}</span></p>
<p style="margin:0;padding-top:20px;border-top:1px solid #1f2937;font-size:12px;line-height:1.6;color:#5C6478">${th ? 'หากคุณไม่ได้ขอลิงก์นี้ ให้ละเว้นอีเมลฉบับนี้ได้เลย ไม่มีสิ่งใดเปลี่ยนแปลงในบัญชีของคุณ' : 'If you did not ask for this link you can ignore this email — nothing about your account has changed.'}<br>NaNote Cyber · cyber.nanoteofficial.me</p>
</td></tr></table></body></html>`;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to: identifier,
            subject,
            html,
            text,
            headers: { 'X-Entity-Ref-ID': crypto.randomUUID() },
          }),
        });

        if (!res.ok) {
          throw new Error(`Resend rejected the sign-in email: ${res.status} ${await res.text()}`);
        }
      },
    }),
  ],
  session: { strategy: 'database' },
  pages: {
    signIn: '/signin',
    // Like `error` below, this must NOT carry a query string: Auth.js appends its
    // own params, producing a malformed `/signin?sent=1?provider=resend`.
    // The page treats the presence of `provider` as "a link was sent".
    verifyRequest: '/signin',
    // No query string here: Auth.js appends its own `?error=<Code>`, which would
    // otherwise produce a malformed `/signin?error=1?error=Configuration`.
    error: '/signin',
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      // Allowlisted emails always pass — this check must not touch the DB, because
      // an allowlisted admin's first sign-in runs this callback BEFORE the adapter
      // creates their user row (see events.createUser below).
      if (allowed.includes(email)) return true;

      // Everyone else needs an existing, admin-approved user row. Approval is
      // granted out-of-band (an admin approves an access_request, which inserts
      // or updates a `users` row with `approvedAt` set) — so a never-approved
      // visitor has no row, or a row with `approvedAt` still null.
      const [existing] = await db.select({ approvedAt: users.approvedAt })
        .from(users).where(eq(users.email, email)).limit(1);
      if (existing?.approvedAt) return true;
      return '/pending';
    },
    session({ session, user }) {
      session.user.role = user.role;
      session.user.approvedAt = user.approvedAt;
      return session;
    },
  },
  events: {
    // Fires after the adapter creates a first-time user — the signIn callback
    // runs before the row exists, so allowlisted admins must be promoted here.
    async createUser({ user }) {
      try {
        const email = user.email?.toLowerCase();
        if (email && user.id && allowed.includes(email)) {
          await db.update(users)
            .set({ role: 'admin', approvedAt: new Date() })
            .where(eq(users.id, user.id));
        }
      } catch {
        /* auth events must never fail sign-in */
      }
    },
  },
});
