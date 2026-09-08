import { redirect } from 'next/navigation';
import { getLang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import { getOrgForUser, getViewer } from '@/lib/grc/queries';
import OrgForm from '@/components/grc/OrgForm';

export const metadata = { title: 'ISO 27001 setup' };

export default async function SetupPage() {
  const [lang, viewer] = await Promise.all([getLang(), getViewer()]);
  if (!viewer) redirect('/signin');
  if (await getOrgForUser(viewer.userId)) redirect('/grc/iso27001');
  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">{t(lang, 'grc.setup.eyebrow')}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t(lang, 'grc.setup.title')}</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">{t(lang, 'grc.setup.lede')}</p>
      <div className="panel mt-8 p-5">
        <OrgForm org={null} lang={lang} />
      </div>
    </div>
  );
}
