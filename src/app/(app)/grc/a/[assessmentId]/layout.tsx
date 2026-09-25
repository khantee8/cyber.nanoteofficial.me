import { loadAssessment } from '@/lib/grc/context';
import { getAssessment } from '@/lib/grc/queries';
import AssessmentHeader from '@/components/grc/AssessmentHeader';

export default async function AssessmentLayout({ children, params }: LayoutProps<'/grc/a/[assessmentId]'>) {
  const { assessmentId } = await params;
  const { lang, assessment, customer, folders } = await loadAssessment(assessmentId);
  const source = assessment.basedOnId ? await getAssessment(assessment.basedOnId) : null;
  const basedOn = source && source.customerId === customer.id ? { id: source.id, title: source.title } : null;
  return (
    <div className="flex flex-col gap-6">
      <AssessmentHeader assessment={assessment} customer={customer} folders={folders} basedOn={basedOn} lang={lang} />
      {children}
    </div>
  );
}
