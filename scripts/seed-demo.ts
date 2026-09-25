/**
 * Emit SQL that loads the BankX demo assessment into an existing customer's folder:
 *   npm run -s seed:demo -- --customer "BankX" [--folder "FY2026"] [--year 2026] | psql "$DATABASE_URL_UNPOOLED"
 * (`-s` is required: without it npm's own banner line leaks into the piped SQL and
 * breaks psql's parser.)
 *
 * One transaction; aborts if the customer is not found. Finds or creates a root-level
 * folder under the customer (default name `FY{year}`), then upserts one ISO 27001 and
 * one NIST CSF 2.0 assessment in it — titled "ISO 27001 — FY{year}" / "NIST CSF 2.0 —
 * FY{year}", matched by customer + framework + title, so re-running with the same
 * `--year` updates the same assessments instead of creating new ones. Control statuses,
 * CSF scores and the CSF profile are upserted keyed by those assessment ids, and the
 * customer's risk register is replaced wholesale (it is shared across all the
 * customer's assessments, so the demo owns the whole register, not just this year's).
 * Re-running with the same arguments is idempotent — same row counts every time.
 */
import { bankxOrg, bankxRisks, bankxStatuses } from '../src/lib/grc/iso27001/demo/bankx';
import { bankxCsfProfile, bankxCsfScores } from '../src/lib/grc/nist-csf-2/demo/bankx';

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
const year = yearArg !== undefined ? Number(yearArg) : new Date().getFullYear();
if (!Number.isInteger(year)) {
  console.error('--year must be an integer');
  process.exit(1);
}

const folderName = argVal('--folder') ?? `FY${year}`;
const isoTitle = `ISO 27001 — FY${year}`;
const csfTitle = `NIST CSF 2.0 — FY${year}`;

const q = (v: string | null | undefined) => (v === null || v === undefined ? 'NULL' : `'${v.replace(/'/g, "''")}'`);
const j = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const n = (v: number | null) => (v === null ? 'NULL' : String(v));

const CUST = `(select id from customer where name = ${q(customerName)} limit 1)`;
const FOLDER = `(select id from folder where "customerId" = ${CUST} and "parentId" is null and name = ${q(folderName)} limit 1)`;
const ISO = `(select id from assessment where "customerId" = ${CUST} and framework = 'iso27001' and title = ${q(isoTitle)} limit 1)`;
const CSF = `(select id from assessment where "customerId" = ${CUST} and framework = 'nist-csf-2' and title = ${q(csfTitle)} limit 1)`;

const out: string[] = [];
out.push('BEGIN;');
out.push(`DO $$ BEGIN IF NOT EXISTS (select 1 from customer where name = ${q(customerName)}) THEN RAISE EXCEPTION 'customer % not found', ${q(customerName)}; END IF; END $$;`);
out.push(`UPDATE customer SET industry = ${q(bankxOrg.industry)}, "sizeBand" = ${q(bankxOrg.sizeBand)} WHERE id = ${CUST};`);
out.push(`INSERT INTO risk_methodology ("customerId") VALUES (${CUST}) ON CONFLICT DO NOTHING;`);

// Folder: find or create, root level under the customer.
out.push(
  `INSERT INTO folder (id, "customerId", "parentId", name) ` +
  `SELECT gen_random_uuid()::text, ${CUST}, NULL, ${q(folderName)} ` +
  `WHERE NOT EXISTS (SELECT 1 FROM folder WHERE "customerId" = ${CUST} AND "parentId" IS NULL AND name = ${q(folderName)});`,
);

// Assessments: find or create by (customer, framework, title), then always refresh
// their folder/year/scope/lead so a re-run with new demo data still lands.
out.push(
  `INSERT INTO assessment (id, "customerId", "folderId", framework, title, "fiscalYear", scope, lead) ` +
  `SELECT gen_random_uuid()::text, ${CUST}, ${FOLDER}, 'iso27001', ${q(isoTitle)}, ${year}, ${q(bankxOrg.scope)}, ${q(bankxOrg.ismsLead)} ` +
  `WHERE NOT EXISTS (SELECT 1 FROM assessment WHERE "customerId" = ${CUST} AND framework = 'iso27001' AND title = ${q(isoTitle)});`,
);
out.push(
  `UPDATE assessment SET "folderId" = ${FOLDER}, "fiscalYear" = ${year}, scope = ${q(bankxOrg.scope)}, lead = ${q(bankxOrg.ismsLead)}, "updatedAt" = now() ` +
  `WHERE "customerId" = ${CUST} AND framework = 'iso27001' AND title = ${q(isoTitle)};`,
);
out.push(
  `INSERT INTO assessment (id, "customerId", "folderId", framework, title, "fiscalYear", scope, lead) ` +
  `SELECT gen_random_uuid()::text, ${CUST}, ${FOLDER}, 'nist-csf-2', ${q(csfTitle)}, ${year}, ${q(bankxCsfProfile.scope)}, ${q(bankxOrg.ismsLead)} ` +
  `WHERE NOT EXISTS (SELECT 1 FROM assessment WHERE "customerId" = ${CUST} AND framework = 'nist-csf-2' AND title = ${q(csfTitle)});`,
);
out.push(
  `UPDATE assessment SET "folderId" = ${FOLDER}, "fiscalYear" = ${year}, scope = ${q(bankxCsfProfile.scope)}, lead = ${q(bankxOrg.ismsLead)}, "updatedAt" = now() ` +
  `WHERE "customerId" = ${CUST} AND framework = 'nist-csf-2' AND title = ${q(csfTitle)};`,
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
