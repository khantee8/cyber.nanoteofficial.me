import type { ReactNode } from 'react';
import Link from 'next/link';
import { getLang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import { getOrgForUser, getViewer } from '@/lib/grc/queries';
import { CSF_BASE } from '@/lib/grc/nist-csf-2/workspace';
import SubNav from '@/components/grc/SubNav';

export default async function CsfLayout({ children }: { children: ReactNode }) {
  const [lang, viewer] = await Promise.all([getLang(), getViewer()]);
  const org = viewer ? await getOrgForUser(viewer.userId) : null;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-baseline gap-3">
          <Link href="/grc" className="mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg">{t(lang, 'grc.title')}</Link>
          <span className="text-muted-soft">/</span>
          <span className="text-[15px] font-semibold tracking-tight">NIST CSF<span className="mono ml-1 text-[11px] font-normal text-muted-soft">2.0</span></span>
          {org ? <span className="hidden text-[13px] text-muted sm:inline">· {org.name}</span> : null}
        </div>
        {org ? (
          <SubNav items={[
            { href: CSF_BASE, label: t(lang, 'grc.nav.dashboard'), exact: true },
            { href: `${CSF_BASE}/profile`, label: t(lang, 'csf.nav.profile') },
            { href: `${CSF_BASE}/gaps`, label: t(lang, 'csf.nav.gaps') },
            { href: `${CSF_BASE}/settings`, label: t(lang, 'grc.nav.settings') },
          ]} />
        ) : null}
      </div>
      {children}
    </div>
  );
}
