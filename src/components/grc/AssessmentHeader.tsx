import Link from 'next/link';
import type { Assessment, Customer, Folder } from '@/db/schema';
import { assessmentBase, customerBase } from '@/lib/grc/context';
import { frameworkBySlug } from '@/lib/grc/frameworks';
import { ancestorsOf } from '@/lib/grc/tree';
import type { Lang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import SubNav from '@/components/grc/SubNav';

/**
 * Breadcrumb (GRC / customer / folders / assessment), framework, fiscal year and a
 * read-only status; the status is edited on the Details page. The sub-navigation
 * depends on the assessment's framework.
 */
export default function AssessmentHeader({ assessment, customer, folders, basedOn, lang }: {
  assessment: Assessment; customer: Customer; folders: Folder[]; basedOn: Pick<Assessment, 'id' | 'title'> | null; lang: Lang;
}) {
  const base = assessmentBase(assessment.id);
  const cBase = customerBase(customer.id);
  const folder = assessment.folderId ? folders.find((f) => f.id === assessment.folderId) ?? null : null;
  const path = folder ? [...ancestorsOf(folders, folder.id), folder] : [];
  const fw = frameworkBySlug(assessment.framework);
  const iso = assessment.framework === 'iso27001';
  const fwBase = `${base}/${iso ? 'iso' : 'csf'}`;
  const items = iso
    ? [
        { href: fwBase, label: t(lang, 'grc.nav.dashboard'), exact: true },
        { href: `${fwBase}/controls`, label: t(lang, 'grc.nav.controls') },
        { href: `${fwBase}/soa`, label: t(lang, 'grc.nav.soa') },
        { href: `${cBase}/risks`, label: t(lang, 'grc.nav.risks') },
        { href: `${base}/details`, label: t(lang, 'grc.nav.details') },
      ]
    : [
        { href: fwBase, label: t(lang, 'grc.nav.dashboard'), exact: true },
        { href: `${fwBase}/profile`, label: t(lang, 'csf.nav.profile') },
        { href: `${fwBase}/gaps`, label: t(lang, 'csf.nav.gaps') },
        { href: `${fwBase}/settings`, label: t(lang, 'grc.nav.settings') },
        { href: `${cBase}/risks`, label: t(lang, 'grc.nav.risks') },
        { href: `${base}/details`, label: t(lang, 'grc.nav.details') },
      ];
  const crumb = 'mono text-[11px] uppercase tracking-wider text-muted-soft hover:text-fg';

  return (
    <div className="flex flex-col gap-3 border-b border-line pb-4">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link href="/grc" className={crumb}>{t(lang, 'grc.title')}</Link>
        <span className="text-muted-soft">/</span>
        <Link href={cBase} className={crumb}>{customer.name}</Link>
        {path.map((f) => (
          <span key={f.id} className="flex items-center gap-2">
            <span className="text-muted-soft">/</span>
            <Link href={`${cBase}?folder=${f.id}`} className={crumb}>{f.name}</Link>
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-3">
          <h1 className="text-[18px] font-semibold tracking-tight">{assessment.title}</h1>
          <span className="mono rounded border border-accent/50 px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-accent">
            {fw ? `${pick(fw.name, lang)} ${fw.version}` : assessment.framework}
          </span>
          {assessment.fiscalYear !== null ? (
            <span className="mono text-[12px] text-muted">{t(lang, 'grc.assessment.fiscalYear')} {assessment.fiscalYear}</span>
          ) : null}
          <Link href={`${base}/details`} className="mono rounded border border-line px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-muted hover:text-fg"
            title={t(lang, 'grc.assessment.status')}>
            {t(lang, `grc.assessment.status.${assessment.status}`)}
          </Link>
          {basedOn ? (
            <Link href={assessmentBase(basedOn.id)} className="text-[12px] text-muted hover:text-fg">
              {t(lang, 'grc.assessment.basedOn', { title: basedOn.title })}
            </Link>
          ) : null}
        </div>
        <SubNav items={items} />
      </div>
    </div>
  );
}
