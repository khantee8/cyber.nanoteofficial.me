import { ASSESSMENT_STATUSES } from '@/db/schema';
import { loadAssessment } from '@/lib/grc/context';
import { buildTree, type FolderNode } from '@/lib/grc/tree';
import { t } from '@/lib/i18n';
import AssessmentDetailsForm from '@/components/grc/AssessmentDetailsForm';
import DeleteAssessment from '@/components/grc/DeleteAssessment';

export const metadata = { title: 'Assessment details' };

function flatten(nodes: FolderNode[]): { id: string; label: string }[] {
  return nodes.flatMap((n) => [{ id: n.id, label: `${'  '.repeat(n.depth - 1)}${n.name}` }, ...flatten(n.children)]);
}

export default async function DetailsPage({ params }: PageProps<'/grc/a/[assessmentId]/details'>) {
  const { assessmentId } = await params;
  const { lang, assessment, folders } = await loadAssessment(assessmentId);
  const folderOptions = flatten(buildTree(folders));
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <section className="panel p-5">
        <h2 className="mb-4 text-[15px] font-semibold">{t(lang, 'grc.assessment.details')}</h2>
        <AssessmentDetailsForm
          assessment={{
            id: assessment.id, title: assessment.title, fiscalYear: assessment.fiscalYear, periodStart: assessment.periodStart,
            periodEnd: assessment.periodEnd, status: assessment.status, folderId: assessment.folderId, scope: assessment.scope, lead: assessment.lead,
          }}
          statuses={ASSESSMENT_STATUSES}
          folders={folderOptions}
          lang={lang}
        />
      </section>
      <section className="panel border-sev-critical/30 p-5">
        <h2 className="mb-2 text-[15px] font-semibold text-sev-critical">{t(lang, 'grc.assessment.delete')}</h2>
        <DeleteAssessment assessmentId={assessment.id} title={assessment.title} lang={lang} />
      </section>
    </div>
  );
}
