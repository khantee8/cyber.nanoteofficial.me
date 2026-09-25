import { redirect } from 'next/navigation';
import { loadAssessment } from '@/lib/grc/context';

/** `/grc/a/[id]` has no content of its own: it opens the framework's dashboard. */
export default async function AssessmentIndex({ params }: PageProps<'/grc/a/[assessmentId]'>) {
  const { assessmentId } = await params;
  const { assessment, base } = await loadAssessment(assessmentId);
  redirect(`${base}/${assessment.framework === 'iso27001' ? 'iso' : 'csf'}`);
}
