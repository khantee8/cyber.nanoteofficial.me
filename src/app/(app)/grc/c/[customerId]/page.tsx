import { loadCustomer } from '@/lib/grc/context';
import { frameworks } from '@/lib/grc/frameworks';
import { getCsfScores, getFolders, getStatuses, listAssessments, toScoreRows } from '@/lib/grc/queries';
import { ancestorsOf, buildTree, type FolderNode } from '@/lib/grc/tree';
import { compliance } from '@/lib/grc/iso27001/score';
import { ISO27001_CONTROLS } from '@/lib/grc/iso27001/catalogue';
import { summary } from '@/lib/grc/nist-csf-2/score';
import { CSF_SUBCATEGORIES } from '@/lib/grc/nist-csf-2/catalogue';
import type { Assessment } from '@/db/schema';
import { pick, t } from '@/lib/i18n';
import FolderTree, { type FolderSelection } from '@/components/grc/FolderTree';
import AssessmentList, { type AssessmentRow } from '@/components/grc/AssessmentList';
import NewAssessmentForm from '@/components/grc/NewAssessmentForm';

export const metadata = { title: 'Customer workspace' };

const CSF_ALL_IDS = CSF_SUBCATEGORIES.map((s) => s.id);

function flatten(nodes: FolderNode[]): { id: string; label: string }[] {
  return nodes.flatMap((n) => [{ id: n.id, label: `${'\u00a0\u00a0'.repeat(n.depth - 1)}${n.name}` }, ...flatten(n.children)]);
}

/** One query per assessment: ISO → compliance %, CSF → average Current / Target over assessed subcategories. */
async function keyScore(a: Assessment): Promise<string | null> {
  if (a.framework === 'iso27001') {
    const rows = await getStatuses(a.id);
    return rows.length ? `${Math.round(compliance(rows, ISO27001_CONTROLS).pct * 100)}%` : null;
  }
  if (a.framework === 'nist-csf-2') {
    const s = summary(toScoreRows(await getCsfScores(a.id)), CSF_ALL_IDS);
    return s.avgCurrent !== null && s.avgTarget !== null ? `${s.avgCurrent.toFixed(1)} / ${s.avgTarget.toFixed(1)}` : null;
  }
  return null;
}

/** Newest fiscal year first, then newest created — the default "From" source is the first of its framework. */
const newestFirst = (a: Assessment, b: Assessment) =>
  (b.fiscalYear ?? -Infinity) - (a.fiscalYear ?? -Infinity) || b.createdAt.getTime() - a.createdAt.getTime();

export default async function CustomerWorkspace({ params, searchParams }: PageProps<'/grc/c/[customerId]'>) {
  const [{ customerId }, sp] = await Promise.all([params, searchParams]);
  const { lang, customer, base } = await loadCustomer(customerId);
  const [folders, assessments] = await Promise.all([getFolders(customer.id), listAssessments(customer.id)]);

  const byId = new Map(folders.map((f) => [f.id, f]));
  const raw = typeof sp.folder === 'string' ? sp.folder : null;
  const selected: FolderSelection = raw === 'root' ? 'root' : raw && byId.has(raw) ? raw : 'all';

  const counts: Record<string, number> = {};
  let rootCount = 0;
  for (const a of assessments) {
    if (a.folderId && byId.has(a.folderId)) counts[a.folderId] = (counts[a.folderId] ?? 0) + 1;
    else rootCount++;
  }

  const visible = assessments.filter((a) => {
    if (selected === 'all') return true;
    const inFolder = a.folderId && byId.has(a.folderId) ? a.folderId : null;
    return selected === 'root' ? inFolder === null : inFolder === selected;
  });
  const folderLabel = (id: string | null) => {
    const f = id ? byId.get(id) : undefined;
    return f ? [...ancestorsOf(folders, f.id), f].map((x) => x.name).join(' / ') : null;
  };
  const scores = await Promise.all(visible.map(keyScore));
  const rows: AssessmentRow[] = visible.map((a, i) => ({
    id: a.id, title: a.title, framework: a.framework, fiscalYear: a.fiscalYear, status: a.status, updatedAt: a.updatedAt,
    score: scores[i], folderLabel: selected === 'all' ? folderLabel(a.folderId) : null,
  }));

  const tree = buildTree(folders);
  const selectedName = selected === 'all' ? t(lang, 'grc.folders.all') : selected === 'root' ? t(lang, 'grc.folders.root') : byId.get(selected)!.name;
  const sources = [...assessments].sort(newestFirst).map((a) => ({ id: a.id, title: a.title, framework: a.framework }));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="min-w-0">
        <FolderTree customerId={customer.id} base={base} tree={tree} counts={counts} total={assessments.length}
          rootCount={rootCount} selected={selected} lang={lang} />
      </aside>
      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="text-[16px] font-semibold tracking-tight">{selectedName}</h2>
        <details className="panel group">
          <summary className="btn btn-primary m-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">{t(lang, 'grc.assessments.new')}</summary>
          <div className="border-t border-line p-5">
            <NewAssessmentForm
              key={selected}
              customerId={customer.id}
              frameworks={frameworks.map((f) => ({ slug: f.slug, name: pick(f.name, lang) }))}
              folders={flatten(tree)}
              defaultFolderId={selected === 'all' || selected === 'root' ? null : selected}
              sources={sources}
              defaultYear={new Date().getFullYear()}
              lang={lang}
            />
          </div>
        </details>
        {rows.length === 0 ? (
          <div className="panel px-4 py-12 text-center text-[13px] text-muted">{t(lang, 'grc.assessments.none')}</div>
        ) : (
          <AssessmentList rows={rows} lang={lang} now={new Date()} />
        )}
      </section>
    </div>
  );
}
