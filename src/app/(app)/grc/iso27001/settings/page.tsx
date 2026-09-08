import { loadWorkspace } from '@/lib/grc/workspace';
import { t } from '@/lib/i18n';
import OrgForm from '@/components/grc/OrgForm';
import MethodologyForm from '@/components/grc/MethodologyForm';
import ResetWorkspace from '@/components/grc/ResetWorkspace';

export const metadata = { title: 'ISO 27001 settings' };

export default async function SettingsPage() {
  const { lang, org, methodology } = await loadWorkspace();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t(lang, 'grc.settings.title')}</h1>
      <section className="panel p-5">
        <h2 className="mb-4 text-[15px] font-semibold">{t(lang, 'grc.settings.org')}</h2>
        <OrgForm org={org} lang={lang} />
      </section>
      <section className="panel p-5">
        <h2 className="text-[15px] font-semibold">{t(lang, 'grc.settings.method')}</h2>
        <p className="mb-4 mt-1 text-[13px] leading-relaxed text-muted">{t(lang, 'grc.settings.methodLede')}</p>
        <MethodologyForm m={methodology} lang={lang} />
      </section>
      <section className="panel border-sev-critical/30 p-5">
        <h2 className="mb-3 text-[15px] font-semibold text-sev-critical">{t(lang, 'grc.settings.reset')}</h2>
        <ResetWorkspace orgName={org.name} lang={lang} />
      </section>
    </div>
  );
}
