/**
 * Emit SQL that loads the BankX demo assessment into an existing organisation:
 *   npm run seed:demo -- --org "BankX" | psql "$DATABASE_URL_UNPOOLED"
 * One transaction; aborts if the organisation is not found; upserts control
 * statuses and the CSF 2.0 profile, and replaces the organisation's risks so
 * it can be re-run.
 */
import { bankxOrg, bankxRisks, bankxStatuses } from '../src/lib/grc/iso27001/demo/bankx';
import { bankxCsfProfile, bankxCsfScores } from '../src/lib/grc/nist-csf-2/demo/bankx';

const argOrg = process.argv.indexOf('--org');
const orgName = argOrg >= 0 ? process.argv[argOrg + 1] : '';
if (!orgName) {
  console.error('usage: seed-demo --org "<organisation name>"');
  process.exit(1);
}

const q = (v: string | null | undefined) => (v === null || v === undefined ? 'NULL' : `'${v.replace(/'/g, "''")}'`);
const j = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const ORG = `(select id from organisation where name = ${q(orgName)} limit 1)`;

const out: string[] = [];
out.push('BEGIN;');
out.push(`DO $$ BEGIN IF NOT EXISTS (select 1 from organisation where name = ${q(orgName)}) THEN RAISE EXCEPTION 'organisation % not found', ${q(orgName)}; END IF; END $$;`);
out.push(`UPDATE organisation SET scope = ${q(bankxOrg.scope)}, industry = ${q(bankxOrg.industry)}, "sizeBand" = ${q(bankxOrg.sizeBand)}, "ismsLead" = ${q(bankxOrg.ismsLead)} WHERE id = ${ORG};`);
out.push(`INSERT INTO risk_methodology ("organisationId") VALUES (${ORG}) ON CONFLICT DO NOTHING;`);

for (const s of bankxStatuses) {
  out.push(
    `INSERT INTO control_status ("organisationId", framework, "controlId", status, justification, owner, "evidenceUrls", "updatedAt") ` +
    `VALUES (${ORG}, 'iso27001', ${q(s.controlId)}, ${q(s.status)}, ${q(s.justification ?? null)}, ${q(s.owner)}, ${j(s.evidenceUrls ?? [])}, now()) ` +
    `ON CONFLICT ("organisationId", framework, "controlId") DO UPDATE SET status = EXCLUDED.status, justification = EXCLUDED.justification, owner = EXCLUDED.owner, "evidenceUrls" = EXCLUDED."evidenceUrls", "updatedAt" = now();`,
  );
}

out.push(`DELETE FROM risk WHERE "organisationId" = ${ORG};`);
bankxRisks.forEach((r, i) => {
  const ref = `RISK-${String(i + 1).padStart(3, '0')}`;
  out.push(
    `INSERT INTO risk (id, "organisationId", framework, ref, title, description, asset, threat, vulnerability, likelihood, impact, treatment, "treatmentPlan", owner, status, "linkedControlIds", "linkedCsfIds", "residualLikelihood", "residualImpact", "createdAt", "updatedAt") ` +
    `VALUES (gen_random_uuid()::text, ${ORG}, 'iso27001', ${q(ref)}, ${q(r.title)}, ${q(r.description)}, ${q(r.asset)}, ${q(r.threat)}, ${q(r.vulnerability)}, ${r.likelihood}, ${r.impact}, ${q(r.treatment)}, ${q(r.treatmentPlan)}, ${q(r.owner)}, ${q(r.status)}, ${j(r.linkedControlIds)}, ${j(r.linkedCsfIds ?? [])}, ${r.residualLikelihood ?? 'NULL'}, ${r.residualImpact ?? 'NULL'}, now() - interval '${bankxRisks.length - i} days', now());`,
  );
});

const n = (v: number | null) => (v === null ? 'NULL' : String(v));
out.push(
  `INSERT INTO csf_profile ("organisationId", scope, "currentTier", "targetTier", "updatedAt") VALUES (${ORG}, ${q(bankxCsfProfile.scope)}, ${bankxCsfProfile.currentTier}, ${bankxCsfProfile.targetTier}, now()) ` +
  `ON CONFLICT ("organisationId") DO UPDATE SET scope = EXCLUDED.scope, "currentTier" = EXCLUDED."currentTier", "targetTier" = EXCLUDED."targetTier", "updatedAt" = now();`,
);
for (const s of bankxCsfScores) {
  out.push(
    `INSERT INTO csf_score ("organisationId", "subcategoryId", current, target, "inScope", owner, "testingStatus", examined, interviewed, tested, "observedAt", notes, "evidenceUrls", "updatedAt") ` +
    `VALUES (${ORG}, ${q(s.subcategoryId)}, ${n(s.current)}, ${n(s.target)}, true, ${q(s.owner)}, ${q(s.testingStatus)}, ${s.examined}, ${s.interviewed}, ${s.tested}, ${s.observedAt ? `${q(s.observedAt)}::date` : 'NULL'}, ${q(s.notes)}, '[]'::jsonb, now()) ` +
    `ON CONFLICT ("organisationId", "subcategoryId") DO UPDATE SET current = EXCLUDED.current, target = EXCLUDED.target, "inScope" = true, owner = EXCLUDED.owner, "testingStatus" = EXCLUDED."testingStatus", examined = EXCLUDED.examined, interviewed = EXCLUDED.interviewed, tested = EXCLUDED.tested, "observedAt" = EXCLUDED."observedAt", notes = EXCLUDED.notes, "updatedAt" = now();`,
  );
}
out.push('COMMIT;');
process.stdout.write(out.join('\n') + '\n');
