import { loadCsfWorkspace } from '@/lib/grc/nist-csf-2/workspace';
import { getCsfProfile, getCsfScores, getStatuses, toScoreRows } from '@/lib/grc/queries';
import { prefillPlan } from '@/lib/grc/nist-csf-2/score';
import { t } from '@/lib/i18n';
import CsfProfileForm from '@/components/grc/csf/CsfProfileForm';
import PrefillButton from '@/components/grc/csf/PrefillButton';

export const metadata = { title: 'CSF 2.0 settings' };

const ANCHORS = ['csf.anchor.0', 'csf.anchor.1', 'csf.anchor.2', 'csf.anchor.3', 'csf.anchor.4', 'csf.anchor.5',
  'csf.anchor.6', 'csf.anchor.7', 'csf.anchor.8', 'csf.anchor.9', 'csf.anchor.10'] as const;

export default async function CsfSettings() {
  const { lang, org } = await loadCsfWorkspace();
  const [profile, scores, statuses] = await Promise.all([getCsfProfile(org.id), getCsfScores(org.id), getStatuses(org.id, 'iso27001')]);
  const plan = prefillPlan(toScoreRows(scores), statuses);
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <section className="panel p-5">
          <h1 className="mb-4 text-[18px] font-semibold tracking-tight">{t(lang, 'csf.settings.title')}</h1>
          <CsfProfileForm profile={profile} lang={lang} />
        </section>
        <section className="panel p-5">
          <h2 className="text-[15px] font-semibold">{t(lang, 'csf.prefill.title')}</h2>
          <p className="mb-4 mt-1 text-[13px] text-muted">{t(lang, 'csf.prefill.lede')}</p>
          <PrefillButton count={plan.length} lang={lang} />
          <p className="mt-3 text-[11px] text-muted-soft">{t(lang, 'csf.suggest.weights')}</p>
        </section>
      </div>
      <aside className="panel p-5 lg:col-span-5">
        <p className="eyebrow mb-3">{t(lang, 'csf.scale.title')}</p>
        <ol className="flex flex-col gap-1.5 text-[12.5px]">
          {ANCHORS.map((k, i) => (
            <li key={k} className="flex gap-3"><span className="mono w-5 shrink-0 text-right text-muted-soft">{i}</span><span className={i === 5 ? 'text-fg' : 'text-muted'}>{t(lang, k)}</span></li>
          ))}
        </ol>
        <p className="mt-3 text-[11.5px] text-muted-soft">{t(lang, 'csf.scale.note')}</p>
      </aside>
    </div>
  );
}
