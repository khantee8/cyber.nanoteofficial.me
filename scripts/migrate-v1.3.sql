-- cyber v1.3.0: organisation → customer / folder / assessment.
--
-- Production: psql "$DATABASE_URL_UNPOOLED" -v ON_ERROR_STOP=1 -f scripts/migrate-v1.3.sql
-- (the direct/unpooled URL, not the pooler — this holds an ACCESS EXCLUSIVE lock and
-- issues DDL for the duration of the transaction, which doesn't belong on a pooled
-- connection). Requires a clean exit 0 and a final COMMIT (the "COMMIT" acknowledgement
-- printed at the end of a successful run) before deploying app code that depends on the
-- new schema — a nonzero exit or a mid-run abort means the whole transaction rolled back
-- and the database is still on the v1.2.0 shape.
--
-- One transaction; aborts on any count mismatch or unexpected data shape.
BEGIN;

SET LOCAL lock_timeout = '10s';
-- Block the live v1.2.0 app from writing to any table this migration touches while it runs,
-- rather than racing it. lock_timeout above means we fail fast (and roll back) instead of
-- hanging if something already holds a conflicting lock.
LOCK TABLE organisation, control_status, csf_score, csf_profile, risk, risk_methodology
  IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE _before AS SELECT
  (SELECT count(*) FROM organisation) AS orgs,
  (SELECT count(*) FROM control_status) AS statuses,
  (SELECT count(*) FROM csf_score) AS scores,
  (SELECT count(*) FROM csf_profile) AS profiles,
  (SELECT count(*) FROM risk) AS risks,
  (SELECT count(*) FROM risk_methodology) AS methods,
  (SELECT count(DISTINCT "organisationId") FROM control_status) AS orgs_with_iso,
  (SELECT count(*) FROM organisation o
     WHERE EXISTS (SELECT 1 FROM csf_score s WHERE s."organisationId" = o."id")
        OR EXISTS (SELECT 1 FROM csf_profile p WHERE p."organisationId" = o."id")) AS orgs_with_csf;

-- This migration assumes control_status is ISO-only (v1.2.0's control_status.framework
-- column is dropped below without being read into the new assessment link); confirm that
-- assumption holds before touching any data.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM control_status WHERE framework <> 'iso27001') THEN
    RAISE EXCEPTION 'non-ISO control_status rows present; migration assumes control_status is ISO-only';
  END IF;
END $$;

CREATE TABLE customer (
  "id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "industry" text, "sizeBand" text, "notes" text,
  "createdBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL, "archivedAt" timestamp
);
ALTER TABLE customer ADD CONSTRAINT "customer_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL;
CREATE TABLE folder (
  "id" text PRIMARY KEY NOT NULL, "customerId" text NOT NULL,
  "parentId" text, "name" text NOT NULL,
  "sortOrder" integer DEFAULT 0 NOT NULL, "createdAt" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE folder ADD CONSTRAINT "folder_customerId_customer_id_fk" FOREIGN KEY ("customerId") REFERENCES customer("id") ON DELETE CASCADE;
ALTER TABLE folder ADD CONSTRAINT "folder_parentId_folder_id_fk" FOREIGN KEY ("parentId") REFERENCES folder("id") ON DELETE CASCADE;
CREATE INDEX folder_customer_parent ON folder ("customerId", "parentId");
CREATE TABLE assessment (
  "id" text PRIMARY KEY NOT NULL, "customerId" text NOT NULL,
  "folderId" text, "framework" text NOT NULL, "title" text NOT NULL,
  "fiscalYear" integer, "periodStart" date, "periodEnd" date, "status" text DEFAULT 'draft' NOT NULL,
  "scope" text, "lead" text, "basedOnId" text,
  "createdBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL, "updatedAt" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE assessment ADD CONSTRAINT "assessment_customerId_customer_id_fk" FOREIGN KEY ("customerId") REFERENCES customer("id") ON DELETE CASCADE;
ALTER TABLE assessment ADD CONSTRAINT "assessment_folderId_folder_id_fk" FOREIGN KEY ("folderId") REFERENCES folder("id") ON DELETE SET NULL;
ALTER TABLE assessment ADD CONSTRAINT "assessment_basedOnId_assessment_id_fk" FOREIGN KEY ("basedOnId") REFERENCES assessment("id") ON DELETE SET NULL;
ALTER TABLE assessment ADD CONSTRAINT "assessment_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL;
CREATE INDEX assessment_customer_folder ON assessment ("customerId", "folderId");

-- 1. organisations become customers (same id), each with a FY2026 folder
INSERT INTO customer ("id", "name", "industry", "sizeBand", "createdBy", "createdAt")
  SELECT "id", "name", "industry", "sizeBand", "ownerId", "createdAt" FROM organisation;
INSERT INTO folder ("id", "customerId", "name") SELECT gen_random_uuid()::text, "id", 'FY2026' FROM organisation;

-- 2. one ISO and/or one CSF assessment per organisation that has data
INSERT INTO assessment ("id", "customerId", "folderId", "framework", "title", "fiscalYear", "status", "scope", "lead", "createdBy")
  SELECT gen_random_uuid()::text, o."id", f."id", 'iso27001', 'ISO 27001 — FY2026', 2026, 'in_progress', o."scope", o."ismsLead", o."ownerId"
  FROM organisation o JOIN folder f ON f."customerId" = o."id"
  WHERE EXISTS (SELECT 1 FROM control_status cs WHERE cs."organisationId" = o."id");
INSERT INTO assessment ("id", "customerId", "folderId", "framework", "title", "fiscalYear", "status", "scope", "lead", "createdBy")
  SELECT gen_random_uuid()::text, o."id", f."id", 'nist-csf-2', 'NIST CSF 2.0 — FY2026', 2026, 'in_progress',
         coalesce((SELECT p."scope" FROM csf_profile p WHERE p."organisationId" = o."id"), o."scope"), o."ismsLead", o."ownerId"
  FROM organisation o JOIN folder f ON f."customerId" = o."id"
  WHERE EXISTS (SELECT 1 FROM csf_score s WHERE s."organisationId" = o."id") OR EXISTS (SELECT 1 FROM csf_profile p WHERE p."organisationId" = o."id");

-- 3. control_status → assessment
ALTER TABLE control_status ADD COLUMN "assessmentId" text;
UPDATE control_status cs SET "assessmentId" = a."id" FROM assessment a WHERE a."customerId" = cs."organisationId" AND a."framework" = 'iso27001';
ALTER TABLE control_status DROP CONSTRAINT "control_status_organisationId_framework_controlId_pk";
ALTER TABLE control_status DROP CONSTRAINT "control_status_organisationId_organisation_id_fk";
ALTER TABLE control_status DROP COLUMN "organisationId", DROP COLUMN "framework";
ALTER TABLE control_status ALTER COLUMN "assessmentId" SET NOT NULL;
ALTER TABLE control_status ADD CONSTRAINT "control_status_assessmentId_controlId_pk" PRIMARY KEY ("assessmentId", "controlId");
ALTER TABLE control_status ADD CONSTRAINT "control_status_assessmentId_assessment_id_fk" FOREIGN KEY ("assessmentId") REFERENCES assessment("id") ON DELETE CASCADE;

-- 4. csf_score / csf_profile → assessment
ALTER TABLE csf_score ADD COLUMN "assessmentId" text;
UPDATE csf_score s SET "assessmentId" = a."id" FROM assessment a WHERE a."customerId" = s."organisationId" AND a."framework" = 'nist-csf-2';
ALTER TABLE csf_score DROP CONSTRAINT "csf_score_organisationId_subcategoryId_pk";
ALTER TABLE csf_score DROP CONSTRAINT "csf_score_organisationId_organisation_id_fk";
ALTER TABLE csf_score DROP COLUMN "organisationId";
ALTER TABLE csf_score ALTER COLUMN "assessmentId" SET NOT NULL;
ALTER TABLE csf_score ADD CONSTRAINT "csf_score_assessmentId_subcategoryId_pk" PRIMARY KEY ("assessmentId", "subcategoryId");
ALTER TABLE csf_score ADD CONSTRAINT "csf_score_assessmentId_assessment_id_fk" FOREIGN KEY ("assessmentId") REFERENCES assessment("id") ON DELETE CASCADE;

ALTER TABLE csf_profile ADD COLUMN "assessmentId" text;
UPDATE csf_profile p SET "assessmentId" = a."id" FROM assessment a WHERE a."customerId" = p."organisationId" AND a."framework" = 'nist-csf-2';
ALTER TABLE csf_profile DROP CONSTRAINT "csf_profile_pkey";
ALTER TABLE csf_profile DROP CONSTRAINT "csf_profile_organisationId_organisation_id_fk";
ALTER TABLE csf_profile DROP COLUMN "organisationId";
ALTER TABLE csf_profile ALTER COLUMN "assessmentId" SET NOT NULL;
ALTER TABLE csf_profile ADD PRIMARY KEY ("assessmentId");
ALTER TABLE csf_profile ADD CONSTRAINT "csf_profile_assessmentId_assessment_id_fk" FOREIGN KEY ("assessmentId") REFERENCES assessment("id") ON DELETE CASCADE;

-- 5. risk / risk_methodology → customer (customer ids equal organisation ids)
ALTER TABLE risk RENAME COLUMN "organisationId" TO "customerId";
ALTER TABLE risk DROP CONSTRAINT "risk_organisationId_organisation_id_fk";
DROP INDEX risk_org_ref;
ALTER TABLE risk ADD CONSTRAINT "risk_customerId_customer_id_fk" FOREIGN KEY ("customerId") REFERENCES customer("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX risk_customer_ref ON risk ("customerId", "ref");

ALTER TABLE risk_methodology RENAME COLUMN "organisationId" TO "customerId";
ALTER TABLE risk_methodology DROP CONSTRAINT "risk_methodology_organisationId_organisation_id_fk";
ALTER TABLE risk_methodology ADD CONSTRAINT "risk_methodology_customerId_customer_id_fk" FOREIGN KEY ("customerId") REFERENCES customer("id") ON DELETE CASCADE;

-- 6. drop organisation
DROP TABLE organisation;

-- 7. assert nothing was lost
DO $$
DECLARE b _before%ROWTYPE;
BEGIN
  SELECT * INTO b FROM _before;
  IF (SELECT count(*) FROM customer) <> b.orgs THEN RAISE EXCEPTION 'customer count % <> %', (SELECT count(*) FROM customer), b.orgs; END IF;
  IF (SELECT count(*) FROM folder) <> b.orgs THEN RAISE EXCEPTION 'folder count % <> %', (SELECT count(*) FROM folder), b.orgs; END IF;
  IF (SELECT count(*) FROM assessment) <> (b.orgs_with_iso + b.orgs_with_csf) THEN
    RAISE EXCEPTION 'assessment count % <> % (orgs_with_iso % + orgs_with_csf %)',
      (SELECT count(*) FROM assessment), (b.orgs_with_iso + b.orgs_with_csf), b.orgs_with_iso, b.orgs_with_csf;
  END IF;
  IF (SELECT count(*) FROM control_status) <> b.statuses THEN RAISE EXCEPTION 'control_status count changed'; END IF;
  IF (SELECT count(*) FROM csf_score) <> b.scores THEN RAISE EXCEPTION 'csf_score count changed'; END IF;
  IF (SELECT count(*) FROM csf_profile) <> b.profiles THEN RAISE EXCEPTION 'csf_profile count changed'; END IF;
  IF (SELECT count(*) FROM risk) <> b.risks THEN RAISE EXCEPTION 'risk count changed'; END IF;
  IF (SELECT count(*) FROM risk_methodology) <> b.methods THEN RAISE EXCEPTION 'risk_methodology count changed'; END IF;
  IF EXISTS (SELECT 1 FROM control_status WHERE "assessmentId" IS NULL) OR EXISTS (SELECT 1 FROM csf_score WHERE "assessmentId" IS NULL) THEN
    RAISE EXCEPTION 'unmapped score rows'; END IF;
END $$;

COMMIT;
