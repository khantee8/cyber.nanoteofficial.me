'use client';

import { useTransition } from 'react';
import { deleteRisk } from '@/server/actions/grc';

export default function DeleteRiskButton({ id, label, confirmText }: { id: string; label: string; confirmText: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending}
      onClick={() => { if (window.confirm(confirmText)) start(async () => { await deleteRisk(id); }); }}
      className="btn text-muted hover:border-sev-critical/50 hover:text-sev-critical">
      {label}
    </button>
  );
}
