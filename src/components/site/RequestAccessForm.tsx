'use client';

import { useActionState, useState } from 'react';
import { requestAccess, type RequestAccessState } from '@/server/actions/access';

export interface RequestAccessLabels {
  emailLabel: string;
  messageHint: string;
  sending: string;
  submit: string;
  messages: Record<RequestAccessState['code'], string>;
}

export default function RequestAccessForm({ labels }: { labels: RequestAccessLabels }) {
  const [state, formAction, pending] = useActionState<RequestAccessState | null, FormData>(
    requestAccess,
    null,
  );
  // React resets an uncontrolled form once its action settles, which would throw
  // away what was typed on a rejected submit. Holding the values keeps them.
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div aria-live="polite">
      {state?.ok ? (
        <div className="rounded-md border border-accent/40 bg-accent-dim p-4">
          <p className="text-sm leading-relaxed text-accent">{labels.messages.received}</p>
        </div>
      ) : (
        <form action={formAction} className="space-y-3">
          <div>
            <label htmlFor="request-email" className="sr-only">{labels.emailLabel}</label>
            <input
              id="request-email" name="email" type="email" autoComplete="email" required
              placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="request-message" className="sr-only">{labels.messageHint}</label>
            <textarea
              id="request-message" name="message" rows={3} maxLength={1000}
              placeholder={labels.messageHint} value={message} onChange={(e) => setMessage(e.target.value)}
              className="field resize-none leading-relaxed"
            />
          </div>
          {/* honeypot — hidden from people, filled by bots */}
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="request-website">Website</label>
            <input id="request-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center">
            {pending ? labels.sending : labels.submit}
          </button>
          {state ? (
            <p className="text-sm leading-relaxed text-sev-critical">{labels.messages[state.code]}</p>
          ) : null}
        </form>
      )}
    </div>
  );
}
