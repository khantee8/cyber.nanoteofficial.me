/**
 * Emit SQL that loads the BankX demo assessment into an existing customer's folder:
 *   npm run -s seed:demo -- --customer "BankX" [--folder "FY2026"] [--year 2026] | psql "$DATABASE_URL_UNPOOLED"
 * (`-s` is required: without it npm's own banner line leaks into the piped SQL and
 * breaks psql's parser.)
 *
 * One transaction; aborts if the customer is not found. Finds or creates a root-level
 * folder under the customer (default name `FY{year}`), then upserts one ISO 27001 and
 * one NIST CSF 2.0 assessment in it — titled to match the "New assessment" dialog's own
 * default (`{framework name} — FY{year}`, the names from frameworks.ts), matched by
 * customer + framework + fiscal year + folder (not title — a production assessment the
 * v1.3 migration created keeps its pre-existing title, e.g. "ISO 27001 — FY2026", and the
 * seed must still find and refresh it rather than creating a second one) so re-running
 * with the same `--year` updates the same assessments instead of creating new ones.
 * Control statuses, CSF scores and the CSF profile are upserted keyed by those assessment
 * ids, and the customer's risk register is replaced wholesale (it is shared across all
 * the customer's assessments, so the demo owns the whole register, not just this year's).
 * Re-running with the same arguments is idempotent — same row counts every time.
 */
import { bankxOrg, bankxRisks, bankxStatuses } from '../src/lib/grc/iso27001/demo/bankx';
import { bankxCsfProfile, bankxCsfScores } from '../src/lib/grc/nist-csf-2/demo/bankx';
import { frameworks } from '../src/lib/grc/frameworks';

function argVal(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const customerName = argVal('--customer');
if (!customerName) {
  console.error('usage: seed-demo --customer "<customer name>" [--folder "<folder name>"] [--year <fiscal year>]');
  process.exit(1);
}

const yearArg = argVal('--year');
let year: number;
if (yearArg === undefined) {
  year = new Date().getFullYear();
} else if (yearArg.trim() === '' || !Number.isInteger(Number(yearArg))) {
  console.error('--year must be an integer');
  process.exit(1);
} else {
  year = Number(yearArg);
}

const folderName = argVal('--folder') ?? `FY${year}`;
// Same default the "New assessment" dialog computes (NewAssessmentForm's `autoTitle`):
// `{framework name} — FY{year}`, using frameworks.ts as the one source of truth for the name.
const frameworkName = (slug: 'iso27001' | 'nist-csf-2') => frameworks.find((f) => f.slug === slug)!.name.en;
const isoTitle = `${frameworkName('iso27001')} — FY${year}`;
const csfTitle = `${frameworkName('nist-csf-2')} — FY${year}`;

const q = (v: string | null | undefined) => (v === null || v === undefined ? 'NULL' : `'${v.replace(/'/g, "''")}'`);
const j = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const n = (v: number | null) => (v === null ? 'NULL' : String(v));

// The customer id is resolved exactly once, into a temp table, after asserting the
// name matches exactly one row — names aren't unique, so without this a duplicate
// name could silently target (and wipe the risks of) a different customer. Every
// later statement reads the id back from this table instead of re-querying by name.
const CUST = `(select customer_id from _seed_customer)`;
const FOLDER = `(select id from folder where "customerId" = ${CUST} and "parentId" is null and name = ${q(folderName)} limit 1)`;
// Matched by (customer, framework, fiscal year, folder) rather than title, so the seed
// still finds and refreshes an assessment whose title doesn't match today's default —
// notably one the v1.3 migration created under its own fixed title.
const ISO = `(select id from assessment where "customerId" = ${CUST} and framework = 'iso27001' and "fiscalYear" = ${year} and "folderId" = ${FOLDER} limit 1)`;
const CSF = `(select id from assessment where "customerId" = ${CUST} and framework = 'nist-csf-2' and "fiscalYear" = ${year} and "folderId" = ${FOLDER} limit 1)`;

// Guards that the (customer, framework, fiscal year, folder) lookup used for ISO/CSF
// above matches at most one row before anything relies on its `limit 1` — a bare limit 1
// would otherwise silently pick an arbitrary row if more than one ever matched.
function assertAtMostOneAssessment(framework: string): string {
  return (
    `DO $$ BEGIN IF (SELECT count(*) FROM assessment WHERE "customerId" = ${CUST} AND framework = ${q(framework)} AND "fiscalYear" = ${year} AND "folderId" = ${FOLDER}) > 1 ` +
    `THEN RAISE EXCEPTION 'assessment % for fiscal year % in this folder is ambiguous for this customer (more than one match)', ${q(framework)}, ${year}; END IF; END $$;`
  );
}

const out: string[] = [];
out.push('BEGIN;');
out.push(
  `DO $$ BEGIN IF (SELECT count(*) FROM customer WHERE name = ${q(customerName)}) <> 1 ` +
  `THEN RAISE EXCEPTION 'customer % not found or not unique', ${q(customerName)}; END IF; END $$;`,
);
out.push(`CREATE TEMP TABLE _seed_customer AS SELECT id AS customer_id FROM customer WHERE name = ${q(customerName)};`);
out.push(`UPDATE customer SET industry = COALESCE(industry, ${q(bankxOrg.industry)}), "sizeBand" = COALESCE("sizeBand", ${q(bankxOrg.sizeBand)}) WHERE id = ${CUST};`);
out.push(`INSERT INTO risk_methodology ("customerId") VALUES (${CUST}) ON CONFLICT DO NOTHING;`);

// Folder: find or create, root level under the customer.
out.push(
  `INSERT INTO folder (id, "customerId", "parentId", name) ` +
  `SELECT gen_random_uuid()::text, ${CUST}, NULL, ${q(folderName)} ` +
  `WHERE NOT EXISTS (SELECT 1 FROM folder WHERE "customerId" = ${CUST} AND "parentId" IS NULL AND name = ${q(folderName)});`,
);

// Assessments: find or create by (customer, framework, fiscal year, folder), then always
// refresh folder/year/scope/lead so a re-run with new demo data still lands — title is
// only ever set on insert, never overwritten on refresh, so a pre-existing title (e.g.
// from the v1.3 migration) is left alone. Each lookup is asserted to match at most one
// row first.
out.push(assertAtMostOneAssessment('iso27001'));
out.push(
  `INSERT INTO assessment (id, "customerId", "folderId", framework, title, "fiscalYear", scope, lead) ` +
  `SELECT gen_random_uuid()::text, ${CUST}, ${FOLDER}, 'iso27001', ${q(isoTitle)}, ${year}, ${q(bankxOrg.scope)}, ${q(bankxOrg.ismsLead)} ` +
  `WHERE NOT EXISTS (SELECT 1 FROM assessment WHERE "customerId" = ${CUST} AND framework = 'iso27001' AND "fiscalYear" = ${year} AND "folderId" = ${FOLDER});`,
);
out.push(
  `UPDATE assessment SET "folderId" = ${FOLDER}, "fiscalYear" = ${year}, scope = ${q(bankxOrg.scope)}, lead = ${q(bankxOrg.ismsLead)}, "updatedAt" = now() ` +
  `WHERE "customerId" = ${CUST} AND framework = 'iso27001' AND "fiscalYear" = ${year} AND "folderId" = ${FOLDER};`,
);
out.push(assertAtMostOneAssessment('nist-csf-2'));
out.push(
  `INSERT INTO assessment (id, "customerId", "folderId", framework, title, "fiscalYear", scope, lead) ` +
  `SELECT gen_random_uuid()::text, ${CUST}, ${FOLDER}, 'nist-csf-2', ${q(csfTitle)}, ${year}, ${q(bankxCsfProfile.scope)}, ${q(bankxOrg.ismsLead)} ` +
  `WHERE NOT EXISTS (SELECT 1 FROM assessment WHERE "customerId" = ${CUST} AND framework = 'nist-csf-2' AND "fiscalYear" = ${year} AND "folderId" = ${FOLDER});`,
);
out.push(
  `UPDATE assessment SET "folderId" = ${FOLDER}, "fiscalYear" = ${year}, scope = ${q(bankxCsfProfile.scope)}, lead = ${q(bankxOrg.ismsLead)}, "updatedAt" = now() ` +
  `WHERE "customerId" = ${CUST} AND framework = 'nist-csf-2' AND "fiscalYear" = ${year} AND "folderId" = ${FOLDER};`,
);

for (const s of bankxStatuses) {
  out.push(
    `INSERT INTO control_status ("assessmentId", "controlId", status, justification, owner, "evidenceUrls", "updatedAt") ` +
    `VALUES (${ISO}, ${q(s.controlId)}, ${q(s.status)}, ${q(s.justification ?? null)}, ${q(s.owner)}, ${j(s.evidenceUrls ?? [])}, now()) ` +
    `ON CONFLICT ("assessmentId", "controlId") DO UPDATE SET status = EXCLUDED.status, justification = EXCLUDED.justification, owner = EXCLUDED.owner, "evidenceUrls" = EXCLUDED."evidenceUrls", "updatedAt" = now();`,
  );
}

out.push(`DELETE FROM risk WHERE "customerId" = ${CUST};`);
bankxRisks.forEach((r, i) => {
  const ref = `RISK-${String(i + 1).padStart(3, '0')}`;
  out.push(
    `INSERT INTO risk (id, "customerId", framework, ref, title, description, asset, threat, vulnerability, likelihood, impact, treatment, "treatmentPlan", owner, status, "linkedControlIds", "linkedCsfIds", "residualLikelihood", "residualImpact", "createdAt", "updatedAt") ` +
    `VALUES (gen_random_uuid()::text, ${CUST}, 'iso27001', ${q(ref)}, ${q(r.title)}, ${q(r.description)}, ${q(r.asset)}, ${q(r.threat)}, ${q(r.vulnerability)}, ${r.likelihood}, ${r.impact}, ${q(r.treatment)}, ${q(r.treatmentPlan)}, ${q(r.owner)}, ${q(r.status)}, ${j(r.linkedControlIds)}, ${j(r.linkedCsfIds ?? [])}, ${r.residualLikelihood ?? 'NULL'}, ${r.residualImpact ?? 'NULL'}, now() - interval '${bankxRisks.length - i} days', now());`,
  );
});

out.push(
  `INSERT INTO csf_profile ("assessmentId", scope, "currentTier", "targetTier", "updatedAt") VALUES (${CSF}, ${q(bankxCsfProfile.scope)}, ${bankxCsfProfile.currentTier}, ${bankxCsfProfile.targetTier}, now()) ` +
  `ON CONFLICT ("assessmentId") DO UPDATE SET scope = EXCLUDED.scope, "currentTier" = EXCLUDED."currentTier", "targetTier" = EXCLUDED."targetTier", "updatedAt" = now();`,
);
for (const s of bankxCsfScores) {
  out.push(
    `INSERT INTO csf_score ("assessmentId", "subcategoryId", current, target, "inScope", owner, "testingStatus", examined, interviewed, tested, "observedAt", notes, "evidenceUrls", "updatedAt") ` +
    `VALUES (${CSF}, ${q(s.subcategoryId)}, ${n(s.current)}, ${n(s.target)}, true, ${q(s.owner)}, ${q(s.testingStatus)}, ${s.examined}, ${s.interviewed}, ${s.tested}, ${s.observedAt ? `${q(s.observedAt)}::date` : 'NULL'}, ${q(s.notes)}, '[]'::jsonb, now()) ` +
    `ON CONFLICT ("assessmentId", "subcategoryId") DO UPDATE SET current = EXCLUDED.current, target = EXCLUDED.target, "inScope" = true, owner = EXCLUDED.owner, "testingStatus" = EXCLUDED."testingStatus", examined = EXCLUDED.examined, interviewed = EXCLUDED.interviewed, tested = EXCLUDED.tested, "observedAt" = EXCLUDED."observedAt", notes = EXCLUDED.notes, "updatedAt" = now();`,
  );
}
out.push('COMMIT;');
process.stdout.write(out.join('\n') + '\n');
