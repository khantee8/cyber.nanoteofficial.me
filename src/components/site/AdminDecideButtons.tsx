'use client';

import { useTransition } from 'react';
import { decideAccessRequest } from '@/server/actions/admin';

export default function AdminDecideButtons({
  requestId, labels,
}: { requestId: string; labels: { approve: string; reject: string } }) {
  const [isPending, startTransition] = useTransition();
  function decide(decision: 'approved' | 'rejected') {
    startTransition(() => { decideAccessRequest(requestId, decision); });
  }
  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      <button type="button" onClick={() => decide('approved')} disabled={isPending}
        className="btn btn-primary h-8 min-h-0 px-3 text-xs">{labels.approve}</button>
      <button type="button" onClick={() => decide('rejected')} disabled={isPending}
        className="btn h-8 min-h-0 px-3 text-xs text-muted hover:text-sev-critical">{labels.reject}</button>
    </div>
  );
}
