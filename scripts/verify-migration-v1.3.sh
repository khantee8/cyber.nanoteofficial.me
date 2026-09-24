#!/usr/bin/env bash
# Local-only check of scripts/migrate-v1.3.sql: build a DB with the OLD schema + BankX demo
# (plus two more organisations, to exercise per-customer folder/assessment counts), migrate
# it, verify row counts and full-row content are unchanged, and verify the migrated structure
# matches a DB built fresh from the NEW schema.
#
# Every comparison below is a hard gate: on a mismatch it prints a diagnostic and exits
# nonzero. None of them are allowed to fail silently — in particular, nothing here relies on
# `&&`-chaining a diff into an echo (set -e does not fire inside an if/&&/|| list, so a real
# mismatch there would just skip the echo and let the script fall through to "MIGRATION OK"),
# and nothing diffs two `<(process substitutions)` directly (a failure inside one of those is
# invisible to set -e/pipefail, so a broken query on both sides would produce two empty
# streams that "match"). Every comparison below writes each side to a file, asserts the file
# is non-empty, and only then diffs the files as a plain statement.
set -euo pipefail

# Refuse unless we're clearly pointed at the local cyber-pg container, not a remote database.
if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    *localhost*|*127.0.0.1*|*cyber-pg*) ;;
    *) echo "refusing: DATABASE_URL is set and does not point at localhost/cyber-pg" >&2; exit 1 ;;
  esac
fi
if ! docker inspect cyber-pg >/dev/null 2>&1; then
  echo "refusing: local docker container 'cyber-pg' not found" >&2
  exit 1
fi

# MIGRATE_SQL lets a caller point this at a modified copy of the migration (e.g. one with a
# statement deliberately removed) to prove these checks actually fail on a broken migration.
# Defaults to the real migration that ships to production.
MIGRATE_SQL=${MIGRATE_SQL:-scripts/migrate-v1.3.sql}

PG="docker exec -i cyber-pg psql -U postgres -v ON_ERROR_STOP=1 -q"
OLD_REF=${OLD_REF:-main}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# require_file <label> <path> -- fail loudly if a file a check depends on is missing or empty.
require_file() {
  local label="$1" path="$2"
  if [ ! -s "$path" ]; then
    echo "MIGRATION CHECK FAILED: $label produced no output ($path is empty/missing)" >&2
    exit 1
  fi
}

# check_diff <label> <file_a> <file_b> -- hard-fails the script on any difference. Always
# called as a plain statement (never inside if/&&/||) so `set -e` can do its job.
check_diff() {
  local label="$1" a="$2" b="$3"
  require_file "$label (before/old)" "$a"
  require_file "$label (after/new)" "$b"
  local diffout="$TMP/$(echo "$label" | tr -c 'A-Za-z0-9_' '_').diff"
  if ! diff "$a" "$b" > "$diffout"; then
    echo "MIGRATION CHECK FAILED: $label differs" >&2
    cat "$diffout" >&2
    exit 1
  fi
}

for db in mig_old mig_new; do $PG -d postgres -c "DROP DATABASE IF EXISTS $db" -c "CREATE DATABASE $db"; done

# old schema + demo data
git show "$OLD_REF:src/db/schema.ts" > "$TMP/schema.ts"
ln -s "$(pwd)/node_modules" "$TMP/node_modules"
npx drizzle-kit generate --schema "$TMP/schema.ts" --dialect postgresql --out "$TMP/old" --name old >/dev/null
sed 's/--> statement-breakpoint//' "$TMP"/old/*.sql | $PG -d mig_old
$PG -d mig_old -c "INSERT INTO \"user\" (id, email, \"approvedAt\") VALUES ('u1','owner@example.com', now()); INSERT INTO organisation (id, \"ownerId\", name) VALUES ('o1','u1','BankX');"
# seed-demo.ts (from OLD_REF) imports '../src/lib/grc/...' relatively; mirror that layout
# so the import resolves. The demo data files under src/lib/grc/*/demo/ are unchanged by
# this task (pure data, no schema.ts dependency), so the current worktree's copies are used.
mkdir -p "$TMP/scripts"
ln -s "$(pwd)/src" "$TMP/src"
git show "$OLD_REF:scripts/seed-demo.ts" > "$TMP/scripts/seed-demo.ts"
npx tsx "$TMP/scripts/seed-demo.ts" --org BankX | $PG -d mig_old

# Two more organisations to exercise per-customer folder/assessment counts:
# o2 has only a csf_profile row (should get exactly one nist-csf-2 assessment, no iso27001);
# o3 has no GRC data at all (should still get a folder, but zero assessments).
$PG -d mig_old -c "
INSERT INTO \"user\" (id, email, \"approvedAt\") VALUES ('u2','owner2@example.com', now()), ('u3','owner3@example.com', now());
INSERT INTO organisation (id, \"ownerId\", name) VALUES ('o2','u2','CSF Only Co'), ('o3','u3','Empty Co');
INSERT INTO csf_profile (\"organisationId\", scope, \"currentTier\", \"targetTier\", \"updatedAt\") VALUES ('o2', 'Pilot scope', 1, 2, now());
"

# --- before snapshots ---
$PG -d mig_old -At -c "select count(*) from control_status; select count(*) from csf_score; select count(*) from csf_profile; select count(*) from risk; select count(*) from risk_methodology" > "$TMP/counts_before.txt"
$PG -d mig_old -At -c "select \"organisationId\"||'|'||\"controlId\"||'|'||(to_jsonb(t) - 'organisationId' - 'framework' - 'assessmentId')::text from control_status t order by 1" > "$TMP/rows_control_status_before.txt"
$PG -d mig_old -At -c "select \"organisationId\"||'|'||\"subcategoryId\"||'|'||(to_jsonb(t) - 'organisationId' - 'assessmentId')::text from csf_score t order by 1" > "$TMP/rows_csf_score_before.txt"
$PG -d mig_old -At -c "select \"organisationId\"||'|'||(to_jsonb(t) - 'organisationId' - 'assessmentId')::text from csf_profile t order by 1" > "$TMP/rows_csf_profile_before.txt"
$PG -d mig_old -At -c "select id||'|'||(to_jsonb(t) - 'organisationId' - 'customerId')::text from risk t order by 1" > "$TMP/rows_risk_before.txt"
$PG -d mig_old -At -c "select \"organisationId\"||'|'||(to_jsonb(t) - 'organisationId' - 'customerId')::text from risk_methodology t order by 1" > "$TMP/rows_risk_methodology_before.txt"
require_file "before counts" "$TMP/counts_before.txt"
require_file "before control_status rows" "$TMP/rows_control_status_before.txt"
require_file "before csf_score rows" "$TMP/rows_csf_score_before.txt"
require_file "before csf_profile rows" "$TMP/rows_csf_profile_before.txt"
require_file "before risk rows" "$TMP/rows_risk_before.txt"
require_file "before risk_methodology rows" "$TMP/rows_risk_methodology_before.txt"

# --- migrate ---
$PG -d mig_old < "$MIGRATE_SQL"

# --- after snapshots + comparisons (full-row value checks, not just counts) ---
$PG -d mig_old -At -c "select count(*) from control_status; select count(*) from csf_score; select count(*) from csf_profile; select count(*) from risk; select count(*) from risk_methodology" > "$TMP/counts_after.txt"
check_diff "row counts (control_status/csf_score/csf_profile/risk/risk_methodology)" "$TMP/counts_before.txt" "$TMP/counts_after.txt"

$PG -d mig_old -At -c "select coalesce((select a.\"customerId\" from assessment a where a.id = t.\"assessmentId\"), '')||'|'||t.\"controlId\"||'|'||(to_jsonb(t) - 'organisationId' - 'framework' - 'assessmentId')::text from control_status t order by 1" > "$TMP/rows_control_status_after.txt"
check_diff "control_status full rows" "$TMP/rows_control_status_before.txt" "$TMP/rows_control_status_after.txt"

$PG -d mig_old -At -c "select coalesce((select a.\"customerId\" from assessment a where a.id = t.\"assessmentId\"), '')||'|'||t.\"subcategoryId\"||'|'||(to_jsonb(t) - 'organisationId' - 'assessmentId')::text from csf_score t order by 1" > "$TMP/rows_csf_score_after.txt"
check_diff "csf_score full rows" "$TMP/rows_csf_score_before.txt" "$TMP/rows_csf_score_after.txt"

$PG -d mig_old -At -c "select coalesce((select a.\"customerId\" from assessment a where a.id = t.\"assessmentId\"), '')||'|'||(to_jsonb(t) - 'organisationId' - 'assessmentId')::text from csf_profile t order by 1" > "$TMP/rows_csf_profile_after.txt"
check_diff "csf_profile full rows" "$TMP/rows_csf_profile_before.txt" "$TMP/rows_csf_profile_after.txt"

$PG -d mig_old -At -c "select id||'|'||(to_jsonb(t) - 'organisationId' - 'customerId')::text from risk t order by 1" > "$TMP/rows_risk_after.txt"
check_diff "risk full rows" "$TMP/rows_risk_before.txt" "$TMP/rows_risk_after.txt"

$PG -d mig_old -At -c "select \"customerId\"||'|'||(to_jsonb(t) - 'organisationId' - 'customerId')::text from risk_methodology t order by 1" > "$TMP/rows_risk_methodology_after.txt"
check_diff "risk_methodology full rows" "$TMP/rows_risk_methodology_before.txt" "$TMP/rows_risk_methodology_after.txt"

# --- per-customer folder/assessment counts ---
$PG -d mig_old -At -c "select c.id, count(f.id) from customer c left join folder f on f.\"customerId\" = c.id group by c.id order by c.id" > "$TMP/folder_counts.txt"
require_file "folder counts" "$TMP/folder_counts.txt"
cat "$TMP/folder_counts.txt"
for want in "o1|1" "o2|1" "o3|1"; do
  grep -qxF "$want" "$TMP/folder_counts.txt" || { echo "MIGRATION CHECK FAILED: expected folder count $want, got:" >&2; cat "$TMP/folder_counts.txt" >&2; exit 1; }
done

$PG -d mig_old -At -c "select c.id, count(a.id) from customer c left join assessment a on a.\"customerId\" = c.id group by c.id order by c.id" > "$TMP/assessment_counts.txt"
require_file "assessment counts" "$TMP/assessment_counts.txt"
cat "$TMP/assessment_counts.txt"
for want in "o1|2" "o2|1" "o3|0"; do
  grep -qxF "$want" "$TMP/assessment_counts.txt" || { echo "MIGRATION CHECK FAILED: expected assessment count $want, got:" >&2; cat "$TMP/assessment_counts.txt" >&2; exit 1; }
done

$PG -d mig_old -At -c "select a.framework from assessment a join customer c on c.id = a.\"customerId\" where c.id = 'o2'" > "$TMP/o2_framework.txt"
require_file "o2 assessment framework" "$TMP/o2_framework.txt"
grep -qxF "nist-csf-2" "$TMP/o2_framework.txt" || { echo "MIGRATION CHECK FAILED: o2's one assessment should be nist-csf-2, got:" >&2; cat "$TMP/o2_framework.txt" >&2; exit 1; }

$PG -d mig_old -At -c "select c.name, f.name, a.framework, a.title from customer c join folder f on f.\"customerId\"=c.id join assessment a on a.\"folderId\"=f.id order by c.id, a.framework"

# --- structure must equal a DB built from the NEW schema ---
npx drizzle-kit generate --schema src/db/schema.ts --dialect postgresql --out "$TMP/new" --name new >/dev/null
sed 's/--> statement-breakpoint//' "$TMP"/new/*.sql | $PG -d mig_new

# Normalise pg_dump output before comparing: strip comments/SET/pg_catalog noise and blank
# lines, strip trailing commas (a migrated table can legitimately have a different column
# order than one freshly CREATE TABLE'd from schema.ts -- e.g. assessmentId appended at the
# end vs. declared earlier -- without that being a real structural difference), and drop the
# \restrict/\unrestrict lines (a random per-dump session token, not schema content). This
# normalised, sorted dump diff is the primary structural gate: it compares real column defs
# and constraint definitions, including constraint names.
dump() {
  docker exec cyber-pg pg_dump -U postgres --schema-only --no-owner --no-privileges "$1" \
    | grep -vE '^(--|SET |SELECT pg_catalog)' \
    | grep -vE '^\\(restrict|unrestrict)' \
    | sed -E 's/,$//' \
    | sed '/^$/d' \
    | sort
}
dump mig_old > "$TMP/dump_old.txt"
dump mig_new > "$TMP/dump_new.txt"
check_diff "pg_dump schema (normalised, primary gate)" "$TMP/dump_old.txt" "$TMP/dump_new.txt"
echo "STRUCTURE MATCHES (pg_dump)"

# Extra: an independently-derived information_schema comparison (columns, constraints,
# foreign keys, indexes) on top of the pg_dump gate above -- not a fallback for it.
cols() {
  docker exec -i cyber-pg psql -U postgres -At -d "$1" -c "
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, column_name;"
}
cons() {
  docker exec -i cyber-pg psql -U postgres -At -d "$1" -c "
    select tc.table_name, tc.constraint_type, string_agg(kcu.column_name, ',' order by kcu.ordinal_position)
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.table_schema = 'public'
    group by tc.table_name, tc.constraint_type, tc.constraint_name
    order by tc.table_name, tc.constraint_type, 3;"
}
fks() {
  docker exec -i cyber-pg psql -U postgres -At -d "$1" -c "
    select tc.table_name, kcu.column_name, ccu.table_name as ref_table, ccu.column_name as ref_column, rc.delete_rule
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
    join information_schema.referential_constraints rc on tc.constraint_name = rc.constraint_name and tc.table_schema = rc.constraint_schema
    where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY'
    order by 1,2,3,4;"
}
idx() {
  docker exec -i cyber-pg psql -U postgres -At -d "$1" -c "
    select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by tablename, indexname;"
}
cols mig_old > "$TMP/cols_old.txt"; cols mig_new > "$TMP/cols_new.txt"
check_diff "information_schema columns" "$TMP/cols_old.txt" "$TMP/cols_new.txt"
cons mig_old > "$TMP/cons_old.txt"; cons mig_new > "$TMP/cons_new.txt"
check_diff "information_schema constraints" "$TMP/cons_old.txt" "$TMP/cons_new.txt"
fks mig_old > "$TMP/fks_old.txt"; fks mig_new > "$TMP/fks_new.txt"
check_diff "information_schema foreign keys" "$TMP/fks_old.txt" "$TMP/fks_new.txt"
idx mig_old > "$TMP/idx_old.txt"; idx mig_new > "$TMP/idx_new.txt"
check_diff "information_schema indexes" "$TMP/idx_old.txt" "$TMP/idx_new.txt"
echo "STRUCTURE MATCHES (information_schema, extra check)"

echo "MIGRATION OK"
